import React from "react";
import { Building2, CheckCircle2, XCircle, Clock, TrendingUp, TrendingDown, MessageCircle, Phone } from "lucide-react";

function formatWhatsAppLink(number) {
  if (!number) return null;
  let cleaned = number.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "351" + cleaned.slice(1);
  if (!cleaned.startsWith("351") && cleaned.length === 9) cleaned = "351" + cleaned;
  return `https://wa.me/${cleaned}`;
}

export default function HotelBookingStatusPanel({ hotels = [], hotelBookings = [] }) {
  const activeHotels = hotels.filter(
    (h) => h.verification_status === "verified" || h.is_verified
  );

  if (activeHotels.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
        Nenhum hotel ativo
      </div>
    );
  }

  const stats = activeHotels.map((hotel) => {
    const bookings = hotelBookings.filter((b) => b.hotel_profile_id === hotel.id || b.hotel_email === hotel.created_by);
    const confirmed = bookings.filter((b) => ["confirmed", "checked_in", "in_progress", "checked_out", "completed"].includes(b.status));
    const rejected = bookings.filter((b) => b.status === "rejected");
    const cancelled = bookings.filter((b) => b.status === "cancelled");
    const pending = bookings.filter((b) => b.status === "pending");
    const total = bookings.length;
    const acceptanceRate = total > 0 ? Math.round((confirmed.length / total) * 100) : null;

    return { hotel, total, confirmed: confirmed.length, rejected: rejected.length, cancelled: cancelled.length, pending: pending.length, acceptanceRate };
  });

  const sorted = stats.sort((a, b) => {
    if (a.pending > 0 && b.pending === 0) return -1;
    if (b.pending > 0 && a.pending === 0) return 1;
    return (b.rejected + b.pending) - (a.rejected + a.pending);
  });

  return (
    <div className="space-y-3">
      {sorted.map(({ hotel, total, confirmed, rejected, cancelled, pending, acceptanceRate }) => {
        const hotelName = hotel.hotel_details?.hotel_name || hotel.walker_name || "Sem nome";
        const waLink = formatWhatsAppLink(hotel.whatsapp_number || hotel.phone);
        const isLowAcceptance = acceptanceRate !== null && acceptanceRate < 50 && total >= 3;
        const hasPending = pending > 0;

        return (
          <div
            key={hotel.id}
            className={`rounded-xl border p-3 sm:p-4 ${
              isLowAcceptance
                ? "border-red-200 bg-red-50"
                : hasPending
                ? "border-amber-200 bg-amber-50"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <h4 className="font-bold text-slate-900 text-sm truncate">{hotelName}</h4>
                  {hotel.is_active ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Ativo</span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Inativo</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{hotel.location || "—"} · {hotel.created_by}</p>
              </div>
              {acceptanceRate !== null && (
                <div className="text-right shrink-0">
                  <div className={`text-2xl font-extrabold ${isLowAcceptance ? "text-red-600" : "text-emerald-600"}`}>
                    {acceptanceRate}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">aceitação</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="text-center rounded-lg bg-amber-50 py-1.5">
                <div className="text-lg font-bold text-amber-600">{pending}</div>
                <div className="text-[10px] text-slate-500 font-medium">Pendentes</div>
              </div>
              <div className="text-center rounded-lg bg-emerald-50 py-1.5">
                <div className="text-lg font-bold text-emerald-600">{confirmed}</div>
                <div className="text-[10px] text-slate-500 font-medium">Aceites</div>
              </div>
              <div className="text-center rounded-lg bg-red-50 py-1.5">
                <div className="text-lg font-bold text-red-600">{rejected}</div>
                <div className="text-[10px] text-slate-500 font-medium">Recusados</div>
              </div>
              <div className="text-center rounded-lg bg-slate-50 py-1.5">
                <div className="text-lg font-bold text-slate-500">{cancelled}</div>
                <div className="text-[10px] text-slate-500 font-medium">Cancelados</div>
              </div>
            </div>

            {total === 0 && (
              <p className="text-xs text-slate-400 mt-2 text-center">Sem reservas recebidas</p>
            )}

            {isLowAcceptance && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-red-600">
                <TrendingDown className="w-3.5 h-3.5" />
                Taxa de aceitação baixa — contactar hotel
              </div>
            )}

            {hasPending && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-600">
                <Clock className="w-3.5 h-3.5" />
                {pending} reserva(s) à espera de resposta
              </div>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              )}
              {hotel.phone && (
                <a
                  href={`tel:${hotel.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Ligar
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}