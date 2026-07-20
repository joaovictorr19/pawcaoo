import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { ClipboardList, CalendarDays, PawPrint, Euro, BedDouble, Sun, Scissors, GraduationCap, PawPrint as WalkIcon } from "lucide-react";

const STATUS_CONFIG = {
  pending:     { label: "Pendente",    dot: "bg-amber-500",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed:   { label: "Confirmada",  dot: "bg-blue-500",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
  checked_in:  { label: "No hotel",    dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "Em curso",    dot: "bg-teal-500",   cls: "bg-teal-50 text-teal-700 border-teal-200" },
  checked_out: { label: "Check-out",   dot: "bg-violet-500", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  completed:   { label: "Concluída",   dot: "bg-slate-400",  cls: "bg-slate-50 text-slate-600 border-slate-200" },
  cancelled:   { label: "Cancelada",   dot: "bg-red-500",    cls: "bg-red-50 text-red-600 border-red-200" },
  rejected:    { label: "Rejeitada",   dot: "bg-red-500",    cls: "bg-red-50 text-red-600 border-red-200" },
};

const SERVICE_ICONS = {
  boarding: BedDouble,
  daycare: Sun,
  grooming: Scissors,
  walk_with_partner: WalkIcon,
  training: GraduationCap,
};

const SERVICE_LABELS = {
  boarding: "Alojamento",
  daycare: "Creche",
  grooming: "Grooming",
  walk_with_partner: "Passeio",
  training: "Treino",
};

export default function GuestBookingHistory({ ownerEmail, hotelEmail }) {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["guestBookingHistory", ownerEmail, hotelEmail],
    queryFn: async () => {
      const all = await base44.entities.HotelBooking.filter(
        { owner_email: ownerEmail, hotel_email: hotelEmail },
        "-checkin_date",
        100
      );
      return Array.isArray(all) ? all : [];
    },
    enabled: !!ownerEmail && !!hotelEmail,
    staleTime: 30 * 1000,
  });

  const totalSpent = bookings
    .filter(b => !["cancelled", "rejected"].includes(b.status))
    .reduce((sum, b) => sum + (b.total_amount || 0), 0);

  const completedCount = bookings.filter(b => b.status === "completed").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Histórico de Serviços
        </p>
        {bookings.length > 0 && (
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span>{bookings.length} reserva(s)</span>
            <span>·</span>
            <span className="font-semibold text-slate-600">{completedCount} concluída(s)</span>
            <span>·</span>
            <span className="font-semibold text-emerald-600">{totalSpent.toFixed(0)}€</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl py-8 text-center">
          <p className="text-slate-400 text-sm">A carregar histórico...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-8 text-center">
          <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Sem reservas anteriores</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map(booking => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.completed;
            const ServiceIcon = SERVICE_ICONS[booking.service_type] || ClipboardList;
            const dogNames = (booking.dogs || []).map(d => d.dog_name).filter(Boolean).join(", ");

            return (
              <div key={booking.id} className="bg-white border border-slate-200 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ServiceIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-800">
                        {SERVICE_LABELS[booking.service_type] || booking.service_type}
                      </span>
                      <Badge variant="outline" className={`text-[9px] border ${cfg.cls} py-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-0.5">
                        <CalendarDays className="w-3 h-3" />
                        {booking.checkin_date ? format(parseISO(booking.checkin_date), "dd/MM/yyyy", { locale: pt }) : "—"}
                        {booking.checkout_date && booking.checkout_date !== booking.checkin_date &&
                          ` → ${format(parseISO(booking.checkout_date), "dd/MM/yyyy", { locale: pt })}`}
                      </span>
                      {dogNames && (
                        <span className="flex items-center gap-0.5">
                          <PawPrint className="w-3 h-3" />
                          {dogNames}
                        </span>
                      )}
                      {booking.total_dogs > 1 && (
                        <span>{booking.total_dogs} cães</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {booking.total_amount > 0 && (
                      <span className="text-sm font-bold text-slate-800">{booking.total_amount.toFixed(2)}€</span>
                    )}
                    {booking.payment_status === "paid" && (
                      <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[8px] ml-1">Pago</Badge>
                    )}
                  </div>
                </div>

                {(booking.service_type === "boarding" && booking.total_nights > 1) && (
                  <p className="text-[10px] text-slate-400 mt-1">{booking.total_nights} noites</p>
                )}
                {booking.special_requests && (
                  <p className="text-[10px] text-amber-700 mt-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                    {booking.special_requests}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}