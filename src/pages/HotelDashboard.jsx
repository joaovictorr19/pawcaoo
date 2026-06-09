import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, isToday, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Hotel, CalendarDays, Dog, Users, Euro, CheckCircle2,
  XCircle, Clock, ChevronRight, Plus, ToggleLeft, ToggleRight,
  Camera, AlertCircle, ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const STATUS_LABELS = {
  pending: { label: "Pendente", color: "bg-orange-100 text-orange-700" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  checked_in: { label: "Check-in feito", color: "bg-green-100 text-green-700" },
  in_progress: { label: "Em curso", color: "bg-teal-100 text-teal-700" },
  checked_out: { label: "Check-out", color: "bg-purple-100 text-purple-700" },
  completed: { label: "Concluído", color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-600" },
  rejected: { label: "Rejeitado", color: "bg-red-100 text-red-600" },
};

const SERVICE_LABELS = {
  boarding: "🛏️ Alojamento",
  daycare: "☀️ Creche",
  grooming: "✂️ Grooming",
  walk_with_partner: "🐕 Passeio",
  training: "🎓 Treino",
};

export default function HotelDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("bookings");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: hotelProfile } = useQuery({
    queryKey: ["myHotelProfile", user?.email],
    queryFn: () => base44.entities.WalkerProfile.filter({ created_by: user.email, professional_type: "hotel" }).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["hotelBookings", hotelProfile?.id],
    queryFn: () => base44.entities.HotelBooking.filter({ hotel_email: user.email }, "-created_date", 50),
    enabled: !!user?.email,
    staleTime: 60 * 1000,
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HotelBooking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });
      setSelectedBooking(null);
      toast.success("Reserva atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar reserva."),
  });

  const togglePartnerAvailability = async (partnerEmail) => {
    if (!hotelProfile) return;
    const partners = hotelProfile.hotel_details?.partner_walkers || [];
    const updated = partners.map(p =>
      p.walker_email === partnerEmail ? { ...p, is_available_today: !p.is_available_today } : p
    );
    await base44.entities.WalkerProfile.update(hotelProfile.id, {
      hotel_details: { ...hotelProfile.hotel_details, partner_walkers: updated },
    });
    queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
    toast.success("Disponibilidade atualizada!");
  };

  const updateCapacity = async (value) => {
    if (!hotelProfile) return;
    await base44.entities.WalkerProfile.update(hotelProfile.id, {
      hotel_details: { ...hotelProfile.hotel_details, capacity_available: parseInt(value) },
    });
    queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
    toast.success("Capacidade atualizada!");
  };

  const partners = hotelProfile?.hotel_details?.partner_walkers || [];
  const pendingBookings = bookings.filter(b => b.status === "pending");
  const activeBookings = bookings.filter(b => ["confirmed", "checked_in", "in_progress"].includes(b.status));
  const todayBookings = bookings.filter(b => {
    try { return isToday(parseISO(b.checkin_date)); } catch { return false; }
  });

  if (!hotelProfile && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Hotel className="w-12 h-12 mx-auto text-purple-300 mb-4" />
          <h2 className="text-xl font-bold mb-2">Painel do Hotel</h2>
          <p className="text-gray-500 mb-4">Ainda não tens um perfil de hotel criado.</p>
          <Button onClick={() => navigate(createPageUrl("ProfessionalHubV2"))} className="bg-purple-600 hover:bg-purple-700 text-white">
            Criar Perfil de Hotel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header — cor exclusiva do painel de hotéis */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-4 py-4 sticky top-0 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-base">{hotelProfile?.walker_name || "Hotel"}</h1>
              <p className="text-xs text-purple-200">{hotelProfile?.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs border-0 ${hotelProfile?.is_active ? "bg-green-400/30 text-green-100" : "bg-red-400/30 text-red-100"}`}>
              {hotelProfile?.is_active ? "Ativo" : "Inativo"}
            </Badge>
            <Button size="sm" variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20" onClick={() => navigate(createPageUrl("ProfessionalHubV2"))}>
              Editar Perfil
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Pendentes", value: pendingBookings.length, color: "text-orange-600", bg: "bg-orange-50", icon: <Clock className="w-4 h-4" /> },
            { label: "Ativos", value: activeBookings.length, color: "text-green-600", bg: "bg-green-50", icon: <CheckCircle2 className="w-4 h-4" /> },
            { label: "Check-ins Hoje", value: todayBookings.length, color: "text-blue-600", bg: "bg-blue-50", icon: <CalendarDays className="w-4 h-4" /> },
            { label: "Vagas Hoje", value: hotelProfile?.hotel_details?.capacity_available ?? "—", color: "text-purple-600", bg: "bg-purple-50", icon: <Dog className="w-4 h-4" /> },
          ].map(kpi => (
            <div key={kpi.label} className={`${kpi.bg} rounded-2xl p-4`}>
              <div className={`flex items-center gap-1 ${kpi.color} mb-1`}>{kpi.icon}<span className="text-xs font-bold uppercase tracking-wide">{kpi.label}</span></div>
              <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Vagas rápidas */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-800 text-sm">Vagas disponíveis agora</p>
            <p className="text-xs text-slate-400">Máx: {hotelProfile?.hotel_details?.capacity_total || "?"} cães</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => updateCapacity(Math.max(0, (hotelProfile?.hotel_details?.capacity_available || 0) - 1))}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-200">−</button>
            <span className="font-black text-2xl text-purple-600 w-8 text-center">{hotelProfile?.hotel_details?.capacity_available ?? 0}</span>
            <button onClick={() => updateCapacity(Math.min(hotelProfile?.hotel_details?.capacity_total || 99, (hotelProfile?.hotel_details?.capacity_available || 0) + 1))}
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold hover:bg-slate-200">+</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: "bookings", label: "Reservas", count: pendingBookings.length },
            { key: "active", label: "Ativos" },
            { key: "walkers", label: "Passeadores", count: partners.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-purple-600 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
              {tab.label}
              {tab.count > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-orange-500 text-white"}`}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Tab: Reservas Pendentes + Todas */}
        {activeTab === "bookings" && (
          <div className="space-y-3">
            {loadingBookings && <p className="text-center text-slate-400 py-8">A carregar...</p>}
            {!loadingBookings && bookings.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Sem reservas ainda.</p>
              </div>
            )}
            {bookings.map(booking => (
              <motion.div key={booking.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedBooking(booking)}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{booking.owner_name}</p>
                    <p className="text-xs text-slate-400">{SERVICE_LABELS[booking.service_type] || booking.service_type}</p>
                  </div>
                  <Badge className={`text-[10px] ${STATUS_LABELS[booking.status]?.color || "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[booking.status]?.label || booking.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{booking.checkin_date} → {booking.checkout_date || "—"}</span>
                  <span className="flex items-center gap-1"><Dog className="w-3 h-3" />{booking.total_dogs || 1} cão(ões)</span>
                  <span className="flex items-center gap-1 font-bold text-green-600"><Euro className="w-3 h-3" />{booking.total_amount?.toFixed(2)}</span>
                </div>
                {booking.status === "pending" && (
                  <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                    <Button size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs"
                      onClick={() => updateBookingMutation.mutate({ id: booking.id, data: { status: "confirmed" } })}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 border-red-300 text-red-500 hover:bg-red-50 rounded-xl text-xs"
                      onClick={() => updateBookingMutation.mutate({ id: booking.id, data: { status: "rejected" } })}>
                      <XCircle className="w-3 h-3 mr-1" /> Rejeitar
                    </Button>
                  </div>
                )}
                {booking.status === "confirmed" && (
                  <Button size="sm" className="w-full mt-3 h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs"
                    onClick={e => { e.stopPropagation(); updateBookingMutation.mutate({ id: booking.id, data: { status: "checked_in" } }); }}>
                    Registar Check-in
                  </Button>
                )}
                {booking.status === "checked_in" && (
                  <Button size="sm" className="w-full mt-3 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs"
                    onClick={e => { e.stopPropagation(); updateBookingMutation.mutate({ id: booking.id, data: { status: "checked_out", completed_date: new Date().toISOString() } }); }}>
                    Registar Check-out
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Tab: Ativos */}
        {activeTab === "active" && (
          <div className="space-y-3">
            {activeBookings.length === 0 ? (
              <div className="text-center py-12 text-slate-400"><p>Nenhum hóspede ativo.</p></div>
            ) : activeBookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-2xl p-4 border border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{booking.owner_name}</p>
                    <p className="text-xs text-slate-400">{booking.dogs?.map(d => d.dog_name).join(", ") || "—"}</p>
                  </div>
                  <Badge className={STATUS_LABELS[booking.status]?.color}>{STATUS_LABELS[booking.status]?.label}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Check-out: {booking.checkout_date || "—"}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Passeadores */}
        {activeTab === "walkers" && (
          <div className="space-y-3">
            {partners.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Sem passeadores parceiros.</p>
                <Button size="sm" className="mt-4 bg-purple-600 hover:bg-purple-700 text-white" onClick={() => navigate(createPageUrl("ProfessionalHubV2"))}>
                  <Plus className="w-3 h-3 mr-1" /> Adicionar Passeador
                </Button>
              </div>
            ) : partners.map(partner => (
              <div key={partner.walker_email} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                  {partner.walker_photo_url ? (
                    <img src={partner.walker_photo_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🐕</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{partner.walker_name}</p>
                  <p className="text-xs text-slate-400 truncate">{partner.walker_email}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {(partner.services || []).map(s => (
                      <span key={s} className="text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => togglePartnerAvailability(partner.walker_email)} title="Disponível hoje?">
                  {partner.is_available_today
                    ? <ToggleRight className="w-7 h-7 text-green-500" />
                    : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}