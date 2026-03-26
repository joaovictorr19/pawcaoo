import { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

/**
 * Polls the booking/request status every 3s until accepted or timeout.
 * Returns true if accepted, false if timed out.
 */
function waitForResponse(bookingId, timeout = 30000) {
  return new Promise((resolve) => {
    const checkStatus = setInterval(async () => {
      try {
        const bookings = await base44.entities.Booking.filter({ id: bookingId });
        const booking = bookings[0];
        if (booking?.status === "confirmed") {
          clearInterval(checkStatus);
          resolve(true);
        } else if (booking?.status === "rejected" || booking?.status === "cancelled") {
          clearInterval(checkStatus);
          resolve(false);
        }
      } catch {
        // polling error — keep trying
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(checkStatus);
      resolve(false);
    }, timeout);
  });
}

/**
 * Sends a booking request to a single professional and creates a Notification.
 * Returns the booking ID if created successfully.
 */
async function sendRequestToPro(pro, requestData) {
  try {
    // Create a pending booking targeted at this specific pro
    const booking = await base44.entities.Booking.create({
      ...requestData,
      walker_id: pro.id,
      walker_name: pro.walker_name,
      walker_email: pro.created_by,
      status: "pending",
    });

    // Notify the professional
    await base44.entities.Notification.create({
      recipient_email: pro.created_by,
      title: "Novo pedido de passeio! 🐾",
      message: `${requestData.owner_name} precisa de um passeador agora. Tens 30 segundos para aceitar.`,
      type: "booking",
      related_id: booking.id,
      priority: "urgent",
    });

    return booking.id;
  } catch {
    return null;
  }
}

/**
 * Main Uber-style sequential dispatch hook.
 *
 * Usage:
 *   const { dispatch, isDispatching } = useUberDispatch();
 *   await dispatch(walkersInRange, requestData, (bookingId) => navigate(`/tracking/${bookingId}`));
 */
/**
 * Tenta o ciclo de dispatch até maxAttempts vezes.
 * Entre cada tentativa falhada espera 5s e reinicia com os walkers online nesse momento.
 */
export async function requestServiceWithRetry(getAllOnlineWalkers, requestData, onAccepted, maxAttempts = 2) {
  let accepted = false;
  let attempts = 0;

  while (!accepted && attempts < maxAttempts) {
    console.log(`Ciclo de procura ${attempts + 1}/${maxAttempts}`);

    const onlineNow = (await getAllOnlineWalkers()).filter(
      (w) => w.is_online || w.pawgo_status?.is_online
    );

    if (onlineNow.length === 0) {
      attempts++;
      if (attempts < maxAttempts) {
        toast.info("Nenhum passeador online. A reiniciar procura...");
        await new Promise((r) => setTimeout(r, 5000));
      }
      continue;
    }

    // Despacha sequencialmente (reutiliza lógica interna)
    for (const pro of onlineNow) {
      const proName = pro.walker_name?.split(" ")[0] || "Passeador";
      const bookingId = await sendRequestToPro(pro, requestData);
      if (!bookingId) continue;

      const toastId = toast.loading(`A aguardar resposta de ${proName}...`);
      const ok = await waitForResponse(bookingId, 30000);
      toast.dismiss(toastId);

      if (ok) {
        toast.success(`${proName} aceitou o passeio! 🎉`);
        onAccepted?.(bookingId);
        accepted = true;
        return;
      }

      try { await base44.entities.Booking.update(bookingId, { status: "rejected" }); } catch {}
      toast.error(`${proName} não disponível. A tentar o próximo...`, { duration: 2000 });
    }

    attempts++;
    if (!accepted && attempts < maxAttempts) {
      toast.info("Ninguém disponível no momento. A reiniciar procura...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  if (!accepted) {
    toast.error("Infelizmente todos os passeadores estão ocupados. Tenta de novo em instantes.");
  }
}

export function useUberDispatch() {
  const [isDispatching, setIsDispatching] = useState(false);

  async function dispatch(walkersInRange, requestData, onAccepted) {
    if (!walkersInRange?.length) {
      toast.error("Não há passeadores disponíveis na tua zona.");
      return;
    }

    setIsDispatching(true);
    toast.info("A procurar o melhor passeador para ti...");

    for (const pro of walkersInRange) {
      const proName = pro.walker_name?.split(" ")[0] || "Passeador";

      const bookingId = await sendRequestToPro(pro, requestData);
      if (!bookingId) continue;

      const toastId = toast.loading(`A aguardar resposta de ${proName}...`);

      const accepted = await waitForResponse(bookingId, 30000);

      toast.dismiss(toastId);

      if (accepted) {
        toast.success(`${proName} aceitou o passeio! 🎉`);
        setIsDispatching(false);
        onAccepted?.(bookingId);
        return;
      }

      // Mark this booking as rejected so it's clean
      try {
        await base44.entities.Booking.update(bookingId, { status: "rejected" });
      } catch {}

      toast.error(`${proName} não está disponível. A tentar o próximo...`, { duration: 2000 });
    }

    toast.error("Infelizmente ninguém pode aceitar agora. Tenta daqui a pouco!");
    setIsDispatching(false);
  }

  return { dispatch, isDispatching };
}