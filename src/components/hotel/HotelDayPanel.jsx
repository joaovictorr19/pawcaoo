import React from "react";
import { format, parseISO, isToday } from "date-fns";
import { pt } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Dog, Euro, Clock, Phone, FileText } from "lucide-react";

const STATUS_CONFIG = {
  pending:    { label: "Pendente",    cls: "bg-orange-100 text-orange-700 border-orange-200" },
  confirmed:  { label: "Confirmado",  cls: "bg-blue-100 text-blue-700 border-blue-200" },
  checked_in: { label: "Check-in ✓", cls: "bg-green-100 text-green-700 border-green-200" },
  in_progress:{ label: "Em curso",   cls: "bg-teal-100 text-teal-700 border-teal-200" },
  checked_out:{ label: "Check-out",  cls: "bg-purple-100 text-purple-700 border-purple-200" },
  completed:  { label: "Concluído",  cls: "bg-gray-100 text-gray-600 border-gray-200" },
  cancelled:  { label: "Cancelado",  cls: "bg-red-100 text-red-500 border-red-200" },
  rejected:   { label: "Rejeitado",  cls: "bg-red-100 text-red-500 border-red-200" },
};

const SERVICE_LABELS = {
  boarding: "🛏️ Alojamento",
  daycare: "☀️ Creche",
  grooming: "✂️ Grooming",
  walk_with_partner: "🐕 Passeio",
  training: "🎓 Treino",
};

export default function HotelDayPanel({ date, bookings = [], onUpdateBooking, capacity, onClose }) {
  if (!date) return null;

  const dayBookings = bookings.filter(b => {
    if (!b.checkin_date) return false;
    try {
      const checkin = parseISO(b.checkin_date);
      const checkout = b.checkout_date ? parseISO(b.checkout_date) : checkin;
      return date >= checkin && date <= checkout && !["cancelled", "rejected"].includes(b.status);
    } catch { return false; }
  });

  const checkinsToday = bookings.filter(b => {
    try { return b.checkin_date && isSameDay(parseISO(b.checkin_date), date); } catch { return false; }
  });

  const checkoutsToday = bookings.filter(b => {
    try { return b.checkout_date && isSameDay(parseISO(b.checkout_date), date); } catch { return false; }
  });

  const occupancyCount = dayBookings.reduce((acc, b) => acc + (b.total_dogs || 1), 0);
  const occupancyPct = capacity?.total ? Math.min(100, Math.round((occupancyCount / capacity.total) * 100)) : 0;

  function isSameDay(a, b) {
    return a.toDateString() === b.toDateString();
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg shadow-purple-900/10 border border-purple-100">
      {/* Day header */}
      <div className="relative bg-gradient-to-br from-purple-800 via-purple-700 to-purple-500 px-4 py-4 flex items-center justify-between overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-8 left-8 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white font-black text-base capitalize leading-tight">
            {format(date, "EEEE, d 'de' MMMM", { locale: pt })}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {isToday(date) && (
              <span className="text-[10px] bg-white/25 text-white px-2 py-0.5 rounded-full font-bold">● Hoje</span>
            )}
            <span className="text-purple-200 text-[11px]">{dayBookings.length} reserva{dayBookings.length !== 1 ? "s" : ""} · {occupancyCount} cão(ões)</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="relative z-10 w-7 h-7 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-full text-white transition-all">×</button>
        )}
      </div>

      {/* Occupancy bar */}
      <div className="px-4 pt-3 pb-2 bg-gradient-to-b from-purple-50/50 to-white border-b border-purple-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Ocupação</span>
          <span className="text-xs font-black text-purple-700">{occupancyCount} / {capacity?.total || "?"} cães
            <span className="ml-1 text-purple-400 font-normal">({occupancyPct}%)</span>
          </span>
        </div>
        <div className="h-3 bg-purple-100 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              occupancyPct >= 90 ? "bg-gradient-to-r from-red-500 to-red-400"
              : occupancyPct >= 70 ? "bg-gradient-to-r from-orange-500 to-orange-400"
              : "bg-gradient-to-r from-purple-700 to-purple-400"
            }`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1">↓ Chegadas: {checkinsToday.length}</span>
          <span className="text-[10px] text-purple-500 font-semibold flex items-center gap-1">↑ Saídas: {checkoutsToday.length}</span>
        </div>
      </div>

      {/* Booking list */}
      <div className="px-3 pb-3 space-y-2 max-h-96 overflow-y-auto bg-white">
        {dayBookings.length === 0 ? (
          <div className="text-center py-8 text-slate-300">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Dog className="w-7 h-7 text-purple-200" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Sem reservas neste dia</p>
            <p className="text-[11px] text-slate-300 mt-0.5">Clica + para criar uma reserva</p>
          </div>
        ) : dayBookings.map(booking => (
          <div key={booking.id} className="bg-gradient-to-br from-purple-50/40 to-white rounded-xl p-3 border border-purple-100/60 hover:border-purple-200 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">{booking.owner_name}</p>
                <p className="text-xs text-slate-500">{SERVICE_LABELS[booking.service_type] || booking.service_type}</p>
                {booking.dogs?.length > 0 && (
                  <p className="text-xs text-purple-600 font-medium mt-0.5">🐕 {booking.dogs.map(d => d.dog_name).join(", ")}</p>
                )}
              </div>
              <Badge className={`text-[10px] border shrink-0 ${STATUS_CONFIG[booking.status]?.cls || "bg-gray-100 text-gray-600"}`}>
                {STATUS_CONFIG[booking.status]?.label || booking.status}
              </Badge>
            </div>

            <div className="flex items-center gap-3 text-[10px] text-slate-400 mb-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="font-semibold text-slate-600">{booking.checkin_time || "—"}</span>
                {booking.checkout_date && (() => {
                  try {
                    const co = parseISO(booking.checkout_date);
                    const ci = parseISO(booking.checkin_date);
                    const sameDay = ci.toDateString() === co.toDateString();
                    return sameDay
                      ? <span> → <span className="font-semibold text-purple-600">{booking.checkout_time || "—"}</span></span>
                      : <span> → <span className="font-semibold text-purple-600">{format(co, "dd/MM", { locale: pt })}{booking.checkout_time ? ` ${booking.checkout_time}` : ""}</span></span>;
                  } catch { return null; }
                })()}
              </span>
              <span className="flex items-center gap-1"><Dog className="w-3 h-3" />{booking.total_dogs || 1} cão(ões)</span>
              {booking.total_amount && <span className="flex items-center gap-1 font-bold text-green-600"><Euro className="w-3 h-3" />{booking.total_amount.toFixed(2)}</span>}
              {booking.owner_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{booking.owner_phone}</span>}
            </div>

            {booking.special_requests && (
              <div className="bg-orange-50 border border-orange-100 rounded-lg px-2 py-1 mb-2">
                <p className="text-[10px] text-orange-700 flex items-start gap-1"><FileText className="w-3 h-3 mt-0.5 shrink-0" />{booking.special_requests}</p>
              </div>
            )}

            {/* Action buttons */}
            {booking.status === "pending" && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="flex-1 h-7 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px]"
                  onClick={() => onUpdateBooking(booking.id, { status: "confirmed" })}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-7 border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-[11px]"
                  onClick={() => onUpdateBooking(booking.id, { status: "rejected" })}>
                  <XCircle className="w-3 h-3 mr-1" /> Rejeitar
                </Button>
              </div>
            )}
            {booking.status === "confirmed" && (
              <Button size="sm" className="w-full mt-2 h-7 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px]"
                onClick={() => onUpdateBooking(booking.id, { status: "checked_in", checkin_time: format(new Date(), "HH:mm") })}>
                ✅ Registar Check-in
              </Button>
            )}
            {booking.status === "checked_in" && (
              <Button size="sm" className="w-full mt-2 h-7 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px]"
                onClick={() => onUpdateBooking(booking.id, { status: "checked_out", checkout_time: format(new Date(), "HH:mm") })}>
                🚪 Registar Check-out
              </Button>
            )}
            {booking.status === "checked_out" && (
              <Button size="sm" className="w-full mt-2 h-7 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-[11px]"
                onClick={() => onUpdateBooking(booking.id, { status: "completed" })}>
                ✔️ Marcar Concluído
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}