import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Loader2, AlertCircle, Hotel, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function useCountdown(expiresAt) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000));
    setSecondsLeft(calc());
    const t = setInterval(() => {
      const s = calc();
      setSecondsLeft(s);
      if (s <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return secondsLeft;
}

function CountdownBadge({ expiresAt }) {
  const seconds = useCountdown(expiresAt);
  if (seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 60;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${isUrgent ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-amber-500/20 text-amber-400'}`}>
      <Clock className="w-3 h-3" />
      {mins}:{String(secs).padStart(2, '0')}
    </span>
  );
}

export default function PendingHotelBookings({ user }) {
  const [payingId, setPayingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: pendingBookings = [] } = useQuery({
    queryKey: ['pendingHotelBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.HotelBooking.filter({
        owner_email: user.email,
        payment_status: 'pending',
        status: 'pending'
      }, '-created_date', 10);
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const handlePay = async (bookingId) => {
    setPayingId(bookingId);
    try {
      const response = await base44.functions.invoke('retryHotelPayment', {
        hotel_booking_id: bookingId,
      });
      const { url, error } = response.data;
      if (error) {
        toast.error(error);
        return;
      }
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      toast.error("Erro ao iniciar pagamento: " + err.message);
    } finally {
      setPayingId(null);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!confirm("Cancelar esta reserva pendente?")) return;
    try {
      await base44.entities.HotelBooking.update(bookingId, {
        status: 'cancelled',
        cancellation_reason: 'Cancelada pelo cliente (pagamento não concluído)',
      });
      queryClient.invalidateQueries(['pendingHotelBookings']);
      toast.success("Reserva cancelada.");
    } catch (err) {
      toast.error("Erro ao cancelar: " + err.message);
    }
  };

  if (!pendingBookings || pendingBookings.length === 0) return null;

  // Filtrar reservas cujo prazo de pagamento já expirou (o backend cancela-as a cada 5 min,
  // mas aqui escondemos do UI para o utilizador não ver cards stale "a pagar")
  const now = new Date();
  const activeBookings = pendingBookings.filter(b => {
    const expiresAt = b.payment_expires_at
      ? new Date(b.payment_expires_at)
      : (b.created_date ? new Date(new Date(b.created_date).getTime() + 5 * 60 * 1000) : null);
    return !expiresAt || expiresAt > now;
  });

  if (activeBookings.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeBookings.map((booking) => {
        const dogNames = (booking.dogs || []).map(d => d.dog_name).filter(Boolean).join(', ') || 'animal';
        return (
          <div
            key={booking.id}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Hotel className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {booking.hotel_name || 'Hotel'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {dogNames} · Check-in: {booking.checkin_date ? format(new Date(booking.checkin_date + 'T12:00:00'), "dd MMM", { locale: ptBR }) : '—'}
              </p>
              <p className="text-xs text-amber-400 font-semibold mt-0.5 flex items-center gap-2 flex-wrap">
                <span>⚠️ Pagamento pendente · {booking.total_amount}€</span>
                {booking.payment_expires_at && <CountdownBadge expiresAt={booking.payment_expires_at} />}
              </p>
              <p className="text-[10px] text-red-400/80 mt-0.5">
                Se não pagar em 5 min, a reserva é cancelada automaticamente.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button
                onClick={() => handlePay(booking.id)}
                disabled={payingId === booking.id}
                className="h-8 px-3 rounded-lg bg-green-500 hover:bg-green-400 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
              >
                {payingId === booking.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5" />
                )}
                Pagar
              </button>
              <button
                onClick={() => handleCancel(booking.id)}
                className="h-7 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-semibold transition-all active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}