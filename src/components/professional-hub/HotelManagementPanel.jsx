import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Hotel, Dog, Users, CalendarDays, CheckCircle2, XCircle,
  Clock, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Euro
} from "lucide-react";
import { isToday, parseISO } from "date-fns";

const STATUS_COLORS = {
  pending: "bg-orange-500/20 text-orange-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  checked_in: "bg-green-500/20 text-green-400",
  in_progress: "bg-teal-500/20 text-teal-400",
  checked_out: "bg-purple-500/20 text-purple-400",
  completed: "bg-slate-500/20 text-slate-400",
  cancelled: "bg-red-500/20 text-red-400",
  rejected: "bg-red-500/20 text-red-400",
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

// ─── Secção de Vagas ───────────────────────────────────────────────────────
function VacanciesPanel({ hotelProfile, onUpdate }) {
  const available = hotelProfile?.hotel_details?.capacity_available ?? 0;
  const total = hotelProfile?.hotel_details?.capacity_total ?? 0;

  const change = (delta) => {
    const next = Math.max(0, Math.min(total || 99, available + delta));
    onUpdate({ capacity_available: next });
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Vagas Diárias</h3>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-4xl font-black text-white">{available}</p>
          <p className="text-xs text-slate-500">de {total || "?"} vagas totais</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => change(-1)}
            className="w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-2xl font-bold flex items-center justify-center transition-colors">
            −
          </button>
          <button onClick={() => change(+1)}
            className="w-12 h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-2xl font-bold flex items-center justify-center transition-colors">
            +
          </button>
        </div>
      </div>
      {/* Barra de progresso */}
      {total > 0 && (
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
            style={{ width: `${Math.min(100, (available / total) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Profissionais Associados ──────────────────────────────────────────────
function AssociatedProfessionals({ hotelProfile, onToggleAvailability }) {
  const partners = hotelProfile?.hotel_details?.partner_walkers || [];

  if (partners.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Profissionais Associados</h3>
        <p className="text-sm text-slate-500 text-center py-4">
          Nenhum profissional associado ainda.<br />
          <span className="text-slate-600 text-xs">Adiciona-os no teu perfil → Editar Perfil.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
        Profissionais Associados ({partners.length})
      </h3>
      <div className="space-y-3">
        {partners.map(partner => (
          <div key={partner.walker_email} className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-slate-700 overflow-hidden shrink-0">
              {partner.walker_photo_url
                ? <img src={partner.walker_photo_url} className="w-full h-full object-cover" alt="" />
                : <div className="w-full h-full flex items-center justify-center text-lg">🐕</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{partner.walker_name}</p>
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {(partner.services || []).map(s => (
                  <span key={s} className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button onClick={() => onToggleAvailability(partner.walker_email)} title="Disponível hoje?">
                {partner.is_available_today
                  ? <ToggleRight className="w-7 h-7 text-green-400" />
                  : <ToggleLeft className="w-7 h-7 text-slate-600" />}
              </button>
              <span className="text-[9px] text-slate-500">{partner.is_available_today ? "Disponível" : "Indisponível"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card de Reserva ────────────────────────────────────────────────────────
function HotelBookingCard({ booking, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-bold text-white text-sm">{booking.owner_name}</p>
            <p className="text-xs text-slate-400">{SERVICE_LABELS[booking.service_type] || booking.service_type}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[booking.status] || "bg-slate-700 text-slate-300"}`}>
              {STATUS_LABELS[booking.status] || booking.status}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{booking.checkin_date}{booking.checkout_date ? ` → ${booking.checkout_date}` : ""}</span>
          <span className="flex items-center gap-1"><Dog className="w-3 h-3" />{booking.total_dogs || 1} cão(ões)</span>
          <span className="flex items-center gap-1 text-green-400 font-bold"><Euro className="w-3 h-3" />{booking.total_amount?.toFixed(2)}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-3">
          {booking.special_requests && (
            <p className="text-xs text-slate-400 italic">"{booking.special_requests}"</p>
          )}
          {booking.dogs?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {booking.dogs.map((d, i) => (
                <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-lg">
                  {d.dog_name} ({d.dog_size})
                </span>
              ))}
            </div>
          )}
          {booking.owner_phone && (
            <p className="text-xs text-slate-400">📞 {booking.owner_phone}</p>
          )}

          {/* Ações por status */}
          <div className="flex gap-2 flex-wrap">
            {booking.status === "pending" && (
              <>
                <Button size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs"
                  onClick={() => onUpdateStatus(booking.id, "confirmed")}>
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmar
                </Button>
                <Button size="sm" variant="outline" className="flex-1 h-8 border-red-800 text-red-400 hover:bg-red-900/20 rounded-xl text-xs"
                  onClick={() => onUpdateStatus(booking.id, "rejected")}>
                  <XCircle className="w-3 h-3 mr-1" /> Rejeitar
                </Button>
              </>
            )}
            {booking.status === "confirmed" && (
              <Button size="sm" className="flex-1 h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs"
                onClick={() => onUpdateStatus(booking.id, "checked_in")}>
                ✅ Registar Check-in
              </Button>
            )}
            {booking.status === "checked_in" && (
              <Button size="sm" className="flex-1 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs"
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
    <motion.div key="hotel-panel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* KPIs rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pendentes", value: pendingCount, color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Ativos", value: activeCount, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Vagas", value: hotelProfile?.hotel_details?.capacity_available ?? "—", color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map(kpi => (
          <div key={kpi.label} className={`${kpi.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Vagas */}
      <VacanciesPanel hotelProfile={hotelProfile} onUpdate={updateHotelDetailsMutation.mutate} />

      {/* Profissionais */}
      <AssociatedProfessionals hotelProfile={hotelProfile} onToggleAvailability={handleTogglePartner} />

      {/* Reservas */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Reservas</h3>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "active", label: "Ativos", count: activeCount },
            { key: "pending", label: "Pendentes", count: pendingCount },
            { key: "completed", label: "Histórico" },
            { key: "all", label: "Todos" },
          ].map(f => (
            <button key={f.key} onClick={() => setBookingFilter(f.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${bookingFilter === f.key ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
              {f.label}
              {f.count > 0 && <span className="bg-orange-500 text-white text-[9px] px-1.5 rounded-full">{f.count}</span>}
            </button>
          ))}
        </div>

        {isLoading && <p className="text-center text-slate-500 text-sm py-8">A carregar...</p>}

        {!isLoading && filteredBookings.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sem reservas nesta categoria.</p>
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