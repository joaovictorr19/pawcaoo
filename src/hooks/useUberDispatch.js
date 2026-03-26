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
export function useUberDispatch() {
  const [isDispatching, setIsDispatching] = React.useState(false);

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