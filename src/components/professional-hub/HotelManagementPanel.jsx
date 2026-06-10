import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Hotel, Dog, Users, CalendarDays, CheckCircle2, XCircle,
  Clock, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Euro,
  Minus, Plus, Phone
} from "lucide-react";

const STATUS_COLORS = {
  pending:    "bg-orange-50 border-orange-200 text-orange-600",
  confirmed:  "bg-blue-50 border-blue-200 text-blue-600",
  checked_in: "bg-emerald-50 border-emerald-200 text-emerald-600",
  in_progress:"bg-teal-50 border-teal-200 text-teal-600",
  checked_out:"bg-purple-50 border-purple-200 text-purple-600",
  completed:  "bg-slate-100 border-slate-200 text-slate-500",
  cancelled:  "bg-red-50 border-red-200 text-red-500",
  rejected:   "bg-red-50 border-red-200 text-red-500",
};
const STATUS_LABELS = {
  pending: "Pendente", confirmed: "Confirmado", checked_in: "Check-in",
  in_progress: "Em curso", checked_out: "Check-out",
  completed: "Concluído", cancelled: "Cancelado", rejected: "Rejeitado",
};
const SERVICE_LABELS = {
  boarding: "🛏️ Alojamento", daycare: "☀️ Creche", grooming: "✂️ Grooming",
  walk_with_partner: "🐕 Passeio", training: "🎓 Treino",
};

// ─── Vagas ─────────────────────────────────────────────────────────────────
function VacanciesPanel({ hotelProfile, onUpdate }) {
  const available = hotelProfile?.hotel_details?.capacity_available ?? 0;
  const total = hotelProfile?.hotel_details?.capacity_total ?? 0;
  const pct = total > 0 ? Math.min(100, (available / total) * 100) : 0;
  const barColor = pct > 60 ? "bg-emerald-400" : pct > 30 ? "bg-orange-400" : "bg-red-400";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Vagas Disponíveis Hoje</h3>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-5xl font-bold text-slate-900">{available}</p>
          <p className="text-xs text-slate-400 mt-1">de {total || "?"} vagas totais</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onUpdate({ capacity_available: Math.max(0, available - 1) })}
            className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xl font-bold flex items-center justify-center transition-colors">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => onUpdate({ capacity_available: Math.min(total || 99, available + 1) })}
            className="w-11 h-11 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xl font-bold flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      {total > 0 && (
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

// ─── Profissionais Associados ──────────────────────────────────────────────
function AssociatedProfessionals({ hotelProfile, onToggleAvailability }) {
  const partners = hotelProfile?.hotel_details?.partner_walkers || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Users className="w-3.5 h-3.5" /> Profissionais Associados ({partners.length})
      </h3>
      {partners.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
          <Users className="w-7 h-7 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum profissional associado ainda.</p>
          <p className="text-xs text-slate-400 mt-1">Adiciona-os em Editar Perfil.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {partners.map(partner => (
            <div key={partner.walker_email} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                {partner.walker_photo_url
                  ? <img src={partner.walker_photo_url} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center text-lg">🐕</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-800 font-semibold text-sm truncate">{partner.walker_name}</p>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {(partner.services || []).map(s => (
                    <span key={s} className="text-[9px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <button onClick={() => onToggleAvailability(partner.walker_email)} className="transition-colors">
                  {partner.is_available_today
                    ? <ToggleRight className="w-7 h-7 text-emerald-500" />
                    : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                </button>
                <span className={`text-[9px] font-semibold ${partner.is_available_today ? "text-emerald-500" : "text-slate-400"}`}>
                  {partner.is_available_today ? "Disponível" : "Indispon."}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card de Reserva ────────────────────────────────────────────────────────
function HotelBookingCard({ booking, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-slate-900 text-sm">{booking.owner_name}</p>
            <p className="text-xs text-slate-500">{SERVICE_LABELS[booking.service_type] || booking.service_type}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[booking.status] || "bg-slate-100 border-slate-200 text-slate-500"}`}>
              {STATUS_LABELS[booking.status] || booking.status}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {booking.checkin_date}{booking.checkout_date ? ` → ${booking.checkout_date}` : ""}
          </span>
          <span className="flex items-center gap-1">
            <Dog className="w-3 h-3" />
            {booking.total_dogs || 1} cão(ões)
          </span>
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <Euro className="w-3 h-3" />{booking.total_amount?.toFixed(2)}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-3">
          {booking.special_requests && (
            <p className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100">"{booking.special_requests}"</p>
          )}
          {booking.dogs?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {booking.dogs.map((d, i) => (
                <span key={i} className="text-xs bg-white text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg font-medium">
                  {d.dog_name} <span className="text-slate-400">({d.dog_size})</span>
                </span>
              ))}
            </div>
          )}
          {booking.owner_phone && (
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> {booking.owner_phone}
            </p>
          )}

          <div className="flex gap-2 flex-wrap pt-1">
            {booking.status === "pending" && (
              <>
                <Button size="sm" className="flex-1 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold"
                  onClick={() => onUpdateStatus(booking.id, "confirmed")}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-9 border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs font-semibold"
                  onClick={() => onUpdateStatus(booking.id, "rejected")}>
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Rejeitar
                </Button>
              </>
            )}
            {booking.status === "confirmed" && (
              <Button size="sm" className="flex-1 h-9 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold"
                onClick={() => onUpdateStatus(booking.id, "checked_in")}>
                ✅ Registar Check-in
              </Button>
            )}
            {booking.status === "checked_in" && (
              <Button size="sm" className="flex-1 h-9 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold"
                onClick={() => onUpdateStatus(booking.id, "completed")}>
                🏁 Registar Check-out
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Painel Principal ──────────────────────────────────────────────────────
export default function HotelManagementPanel({ user, hotelProfile }) {
  const queryClient = useQueryClient();
  const [bookingFilter, setBookingFilter] = useState("active");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["hotelBookings", user?.email],
    queryFn: () => base44.entities.HotelBooking.filter({ hotel_email: user.email }, "-created_date", 60),
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.HotelBooking.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });
      toast.success("Reserva atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar reserva."),
  });

  const updateHotelDetailsMutation = useMutation({
    mutationFn: (details) => base44.entities.WalkerProfile.update(hotelProfile.id, {
      hotel_details: { ...hotelProfile.hotel_details, ...details }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfessionalProfile"] });
      toast.success("Atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar."),
  });

  const handleTogglePartner = (email) => {
    const partners = (hotelProfile?.hotel_details?.partner_walkers || []).map(p =>
      p.walker_email === email ? { ...p, is_available_today: !p.is_available_today } : p
    );
    updateHotelDetailsMutation.mutate({ partner_walkers: partners });
  };

  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const activeCount = bookings.filter(b => ["confirmed", "checked_in", "in_progress"].includes(b.status)).length;

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === "pending") return b.status === "pending";
    if (bookingFilter === "active") return ["confirmed", "checked_in", "in_progress"].includes(b.status);
    if (bookingFilter === "completed") return ["completed", "cancelled", "rejected"].includes(b.status);
    return true;
  });

  return (
    <motion.div key="hotel-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pendentes", value: pendingCount, color: "text-orange-500", bg: "bg-orange-50 border-orange-100" },
          { label: "Ativos",    value: activeCount,  color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Vagas",     value: hotelProfile?.hotel_details?.capacity_available ?? "—", color: "text-purple-500", bg: "bg-purple-50 border-purple-100" },
        ].map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} border rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Vagas */}
      <VacanciesPanel hotelProfile={hotelProfile} onUpdate={updateHotelDetailsMutation.mutate} />

      {/* Profissionais */}
      <AssociatedProfessionals hotelProfile={hotelProfile} onToggleAvailability={handleTogglePartner} />

      {/* Reservas */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5" /> Reservas
        </h3>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "active",    label: "Ativos",    count: activeCount },
            { key: "pending",   label: "Pendentes", count: pendingCount },
            { key: "completed", label: "Histórico" },
            { key: "all",       label: "Todos" },
          ].map(f => (
            <button key={f.key} onClick={() => setBookingFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                bookingFilter === f.key
                  ? "bg-purple-500 text-white border-purple-500"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}>
              {f.label}
              {f.count > 0 && (
                <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{f.count}</span>
              )}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="text-center py-8 text-slate-400 text-sm">A carregar...</div>
        )}

        {!isLoading && filteredBookings.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-200">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 text-slate-200" />
            <p className="text-sm text-slate-400">Sem reservas nesta categoria.</p>
          </div>
        )}

        {filteredBookings.map(booking => (
          <HotelBookingCard
            key={booking.id}
            booking={booking}
            onUpdateStatus={(id, status) => updateMutation.mutate({ id, status })}
          />
        ))}
      </div>
    </motion.div>
  );
}