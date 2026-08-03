import React from "react";
import { Building2, Clock, Phone, MessageCircle, Mail, AlertTriangle } from "lucide-react";

function getDaysWaiting(createdDate) {
  if (!createdDate) return 0;
  const created = new Date(createdDate);
  const now = new Date();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

function getUrgencyLevel(days) {
  if (days >= 7) return { label: "Urgente", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" };
  if (days >= 3) return { label: "Atenção", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
  return { label: "Recente", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
}

function formatWhatsAppLink(number) {
  if (!number) return null;
  let cleaned = number.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "351" + cleaned.slice(1);
  if (!cleaned.startsWith("351") && cleaned.length === 9) cleaned = "351" + cleaned;
  return `https://wa.me/${cleaned}`;
}

export default function PendingHotelsPanel({ hotels = [] }) {
  const sorted = [...hotels].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
        Nenhum hotel pendente
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((hotel) => {
        const days = getDaysWaiting(hotel.created_date);
        const urgency = getUrgencyLevel(days);
        const waLink = formatWhatsAppLink(hotel.whatsapp_number || hotel.phone);
        const email = hotel.created_by || "";
        const hotelName = hotel.hotel_details?.hotel_name || hotel.walker_name || "Sem nome";
        const location = hotel.location || "—";

        return (
          <div
            key={hotel.id}
            className={`rounded-xl border ${urgency.border} ${urgency.bg} p-3 sm:p-4`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <h4 className="font-bold text-slate-900 text-sm truncate">{hotelName}</h4>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgency.color} ${urgency.bg} border ${urgency.border}`}>
                    {urgency.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{location} · {email}</p>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-2xl font-extrabold ${urgency.color}`}>{days}</div>
                <div className="text-[10px] text-slate-400 font-medium uppercase">dias</div>
              </div>
            </div>

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
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </a>
              )}
              {days >= 7 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Contactar urgente
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}