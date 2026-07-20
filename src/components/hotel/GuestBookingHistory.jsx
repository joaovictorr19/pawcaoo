import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { pt, es, fr } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { ClipboardList, CalendarDays, PawPrint, BedDouble, Sun, Scissors, GraduationCap, PawPrint as WalkIcon } from "lucide-react";

const LOCALES = { pt, es, fr };

const I18N = {
  pt: {
    title: "Histórico de Serviços", bookings: n => `${n} reserva(s)`, completed: n => `${n} concluída(s)`,
    noBookings: "Sem reservas anteriores", loading: "A carregar histórico...",
    nights: n => `${n} noites`, dogs: n => `${n} cães`, paid: "Pago",
    services: { boarding: "Alojamento", daycare: "Creche", grooming: "Grooming", walk_with_partner: "Passeio", training: "Treino" },
    status: { pending: "Pendente", confirmed: "Confirmada", checked_in: "No hotel", in_progress: "Em curso",
      checked_out: "Check-out", completed: "Concluída", cancelled: "Cancelada", rejected: "Rejeitada" },
  },
  es: {
    title: "Historial de Servicios", bookings: n => `${n} reserva(s)`, completed: n => `${n} completada(s)`,
    noBookings: "Sin reservas anteriores", loading: "Cargando historial...",
    nights: n => `${n} noches`, dogs: n => `${n} perros`, paid: "Pagado",
    services: { boarding: "Alojamiento", daycare: "Guardería", grooming: "Grooming", walk_with_partner: "Paseo", training: "Adiestramiento" },
    status: { pending: "Pendiente", confirmed: "Confirmada", checked_in: "En hotel", in_progress: "En curso",
      checked_out: "Check-out", completed: "Completada", cancelled: "Cancelada", rejected: "Rechazada" },
  },
  fr: {
    title: "Historique des Services", bookings: n => `${n} réservation(s)`, completed: n => `${n} terminée(s)`,
    noBookings: "Aucune réservation antérieure", loading: "Chargement de l'historique...",
    nights: n => `${n} nuits`, dogs: n => `${n} chiens`, paid: "Payé",
    services: { boarding: "Pension", daycare: "Garde", grooming: "Toilettage", walk_with_partner: "Promenade", training: "Dressage" },
    status: { pending: "En attente", confirmed: "Confirmée", checked_in: "À l'hôtel", in_progress: "En cours",
      checked_out: "Check-out", completed: "Terminée", cancelled: "Annulée", rejected: "Rejetée" },
  },
};

const STATUS_DOT = {
  pending: "bg-amber-500", confirmed: "bg-blue-500", checked_in: "bg-emerald-500",
  in_progress: "bg-teal-500", checked_out: "bg-violet-500", completed: "bg-slate-400",
  cancelled: "bg-red-500", rejected: "bg-red-500",
};
const STATUS_CLS = {
  pending: "bg-amber-50 text-amber-700 border-amber-200", confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  checked_in: "bg-emerald-50 text-emerald-700 border-emerald-200", in_progress: "bg-teal-50 text-teal-700 border-teal-200",
  checked_out: "bg-violet-50 text-violet-700 border-violet-200", completed: "bg-slate-50 text-slate-600 border-slate-200",
  cancelled: "bg-red-50 text-red-600 border-red-200", rejected: "bg-red-50 text-red-600 border-red-200",
};
const SERVICE_ICONS = { boarding: BedDouble, daycare: Sun, grooming: Scissors, walk_with_partner: WalkIcon, training: GraduationCap };

export default function GuestBookingHistory({ ownerEmail, hotelEmail }) {
  const { language } = useLanguage();
  const lang = ['pt', 'es', 'fr'].includes(language) ? language : 'pt';
  const tr = I18N[lang];
  const dateLocale = LOCALES[lang];

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["guestBookingHistory", ownerEmail, hotelEmail],
    queryFn: async () => {
      const all = await base44.entities.HotelBooking.filter(
        { owner_email: ownerEmail, hotel_email: hotelEmail }, "-checkin_date", 100
      );
      return Array.isArray(all) ? all : [];
    },
    enabled: !!ownerEmail && !!hotelEmail,
    staleTime: 30 * 1000,
  });

  const totalSpent = bookings.filter(b => !["cancelled", "rejected"].includes(b.status))
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const completedCount = bookings.filter(b => b.status === "completed").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{tr.title}</p>
        {bookings.length > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
            <span>{tr.bookings(bookings.length)}</span><span>·</span>
            <span className="font-semibold text-slate-600">{tr.completed(completedCount)}</span><span>·</span>
            <span className="font-semibold text-emerald-600">{totalSpent.toFixed(0)}€</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl py-8 text-center">
          <p className="text-slate-400 text-sm">{tr.loading}</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-8 text-center">
          <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">{tr.noBookings}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map(booking => {
            const dot = STATUS_DOT[booking.status] || "bg-slate-400";
            const cls = STATUS_CLS[booking.status] || STATUS_CLS.completed;
            const label = tr.status[booking.status] || booking.status;
            const ServiceIcon = SERVICE_ICONS[booking.service_type] || ClipboardList;
            const dogNames = (booking.dogs || []).map(d => d.dog_name).filter(Boolean).join(", ");

            return (
              <div key={booking.id} className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ServiceIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-800">
                        {tr.services[booking.service_type] || booking.service_type}
                      </span>
                      <Badge variant="outline" className={`text-[9px] border ${cls} py-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dot} mr-1`} />{label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-0.5">
                        <CalendarDays className="w-3 h-3" />
                        {booking.checkin_date ? format(parseISO(booking.checkin_date), "dd/MM/yyyy", { locale: dateLocale }) : "—"}
                        {booking.checkout_date && booking.checkout_date !== booking.checkin_date &&
                          ` → ${format(parseISO(booking.checkout_date), "dd/MM/yyyy", { locale: dateLocale })}`}
                      </span>
                      {dogNames && <span className="flex items-center gap-0.5"><PawPrint className="w-3 h-3" />{dogNames}</span>}
                      {booking.total_dogs > 1 && <span>{tr.dogs(booking.total_dogs)}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {booking.total_amount > 0 && <span className="text-sm font-bold text-slate-800">{booking.total_amount.toFixed(2)}€</span>}
                    {booking.payment_status === "paid" && <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[8px] ml-1">{tr.paid}</Badge>}
                  </div>
                </div>
                {booking.service_type === "boarding" && booking.total_nights > 1 && (
                  <p className="text-[10px] text-slate-400 mt-1">{tr.nights(booking.total_nights)}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}