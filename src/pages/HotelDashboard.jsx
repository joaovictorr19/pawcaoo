import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, isToday, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Hotel, CalendarDays, Dog, Users, Euro, CheckCircle2,
  XCircle, Clock, Plus, AlertCircle, TrendingUp, LayoutGrid, ListOrdered, Settings, RefreshCw, LogOut
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

import HotelCalendar from "@/components/hotel/HotelCalendar";
import HotelDayPanel from "@/components/hotel/HotelDayPanel";
import HotelPartnersPanel from "@/components/hotel/HotelPartnersPanel";
import HotelAddPartnerModal from "@/components/hotel/HotelAddPartnerModal";
import HotelNewBookingModal from "@/components/hotel/HotelNewBookingModal";
import HotelOccupancyManager from "@/components/hotel/HotelOccupancyManager";
import HotelCapacityAdjuster from "@/components/hotel/HotelCapacityAdjuster";
import HotelServiceManager from "@/components/hotel/HotelServiceManager";
import HotelFinancesPanel from "@/components/hotel/HotelFinancesPanel";
import HotelDigitalPass from "@/components/hotel/HotelDigitalPass";
import HotelCapacityAlert from "@/components/hotel/HotelCapacityAlert";
import HotelGuestsPanel from "@/components/hotel/HotelGuestsPanel";
import HotelCheckinPolicyConfig from "@/components/hotel/HotelCheckinPolicyConfig";

const STATUS_CONFIG = {
  pending:    { label: "Pendente",    cls: "bg-orange-100 text-orange-700" },
  confirmed:  { label: "Confirmado",  cls: "bg-blue-100 text-blue-700" },
  checked_in: { label: "Check-in ✓", cls: "bg-green-100 text-green-700" },
  in_progress:{ label: "Em curso",   cls: "bg-teal-100 text-teal-700" },
  checked_out:{ label: "Check-out",  cls: "bg-purple-100 text-purple-700" },
  completed:  { label: "Concluído",  cls: "bg-gray-100 text-gray-600" },
  cancelled:  { label: "Cancelado",  cls: "bg-red-100 text-red-500" },
  rejected:   { label: "Rejeitado",  cls: "bg-red-100 text-red-500" },
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

  // Scroll to top on mount — single motor, no duplicates
  React.useEffect(() => {
    const el = document.scrollingElement || document.documentElement;
    if (el) el.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  const [activeTab, setActiveTab] = useState("hospedes");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: hotelProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["myHotelProfile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email, professional_type: "hotel" });
      const profile = profiles[0] || null;
      
      // If user is a partner with limited access, redirect to partner panel
      if (!profile && user?.email) {
        const allHotels = await base44.entities.WalkerProfile.filter(
          { professional_type: "hotel" },
          undefined,
          100
        );
        
        for (const h of allHotels) {
          const partners = h.hotel_details?.partner_walkers || [];
          const isPartner = partners.find(p => p.walker_email === user.email && p.partner_role === 'limited');
          if (isPartner) {
            navigate(createPageUrl("PartnerHotelPanel"));
            break;
          }
        }
      }
      
      return profile;
    },
    enabled: !!user?.email,
  });

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["hotelBookings", user?.email],
    queryFn: () => base44.entities.HotelBooking.filter({ hotel_email: user.email }, "-created_date", 100),
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HotelBooking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });
      toast.success("Reserva atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar reserva."),
  });

  const createBookingMutation = useMutation({
    mutationFn: (data) => base44.entities.HotelBooking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });
      toast.success("Reserva criada com sucesso!");
    },
    onError: () => toast.error("Erro ao criar reserva."),
  });

  const updateCapacity = async (value) => {
    if (!hotelProfile) return;
    await base44.entities.WalkerProfile.update(hotelProfile.id, {
      hotel_details: { ...hotelProfile.hotel_details, capacity_available: parseInt(value) },
    });
    queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
    toast.success("Vagas atualizadas!");
  };

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

  const handleSyncGoogleCalendar = async () => {
    if (!hotelProfile) return;
    setIsSyncing(true);
    try {
      const response = await base44.functions.invoke('syncHotelBookingsToGoogleCalendar', {
        hotel_profile_id: hotelProfile.id
      });
      toast.success(`✓ ${response.data.message}`);
    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateBooking = (id, data) => updateBookingMutation.mutate({ id, data });
  const handleCreateBooking = (data) => createBookingMutation.mutate(data);

  const partners = hotelProfile?.hotel_details?.partner_walkers || [];
  const pendingBookings = bookings.filter(b => b.status === "pending");
  const activeBookings = bookings.filter(b => ["confirmed", "checked_in", "in_progress"].includes(b.status));
  const todayCheckins = bookings.filter(b => {
    try { return b.checkin_date && isToday(parseISO(b.checkin_date)); } catch { return false; }
  });
  const todayCheckouts = bookings.filter(b => {
    try { return b.checkout_date && isToday(parseISO(b.checkout_date)); } catch { return false; }
  });

  const occupancyToday = activeBookings.reduce((acc, b) => acc + (b.total_dogs || 1), 0);
  const capacityTotal = hotelProfile?.hotel_details?.capacity_total || 0;
  const occupancyPct = capacityTotal ? Math.min(100, Math.round((occupancyToday / capacityTotal) * 100)) : 0;

  const revenue30d = bookings
    .filter(b => {
      try {
        const d = parseISO(b.checkin_date);
        const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
        return diff <= 30 && !["cancelled", "rejected"].includes(b.status);
      } catch { return false; }
    })
    .reduce((acc, b) => acc + (b.total_amount || 0), 0);

  // Empty state
  if (!loadingProfile && !hotelProfile && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-white">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Hotel className="w-10 h-10 text-purple-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Painel do Hotel</h2>
          <p className="text-slate-500 mb-6 text-sm">Ainda não tens um perfil de hotel criado. Cria o teu perfil para começar a gerir as reservas.</p>
          <Button onClick={() => navigate(createPageUrl("ProfessionalSetup"))} className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl px-6">
            <Plus className="w-4 h-4 mr-2" /> Criar Perfil de Hotel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      {/* ── Top Header ── */}
       <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-purple-600 sticky top-0 z-20 shadow-xl shadow-purple-900/30 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-white text-sm leading-tight">
                {hotelProfile?.hotel_details?.hotel_name || hotelProfile?.walker_name || "Hotel"}
              </h1>
              <p className="text-purple-200 text-xs truncate max-w-[180px]">{hotelProfile?.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingBookings.length > 0 && (
              <Badge className="bg-orange-500 text-white border-0 text-xs animate-pulse">
                {pendingBookings.length} pendente{pendingBookings.length > 1 ? "s" : ""}
              </Badge>
            )}
            <Badge className={`text-xs border-0 ${hotelProfile?.is_active ? "bg-green-400/30 text-green-100" : "bg-red-400/30 text-red-100"}`}>
              {hotelProfile?.is_active ? "● Ativo" : "● Inativo"}
            </Badge>
            <Button size="sm" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 rounded-xl gap-1 text-xs hidden md:flex"
              onClick={handleSyncGoogleCalendar} disabled={isSyncing}>
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'Sincronizando' : 'Google Calendar'}
            </Button>
            <Button size="sm" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 rounded-xl gap-1 text-xs hidden md:flex"
              onClick={() => navigate(createPageUrl("ProfessionalHubV2"))}>
              <Settings className="w-3 h-3" /> Configurar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 pb-0 flex gap-1 overflow-x-auto scrollbar-none">
          {[
            { key: "hospedes", label: "🐕 Hóspedes", count: activeBookings.length },
            { key: "agenda", label: "📅 Agenda" },
            { key: "reservas", label: "Reservas", count: pendingBookings.length },
            { key: "today", label: "Hoje", count: todayCheckins.length + todayCheckouts.length },
            { key: "servicos", label: "🎯 Serviços" },
            { key: "vagas", label: "🐾 Vagas" },
            { key: "financas", label: "💰 Finanças" },
            { key: "cartao", label: "🎫 Cartão" },
            { key: "parceiros", label: "Parceiros", count: partners.length },
            { key: "config", label: "⚙️ Configurações" },
            { key: "stats", label: "Estatísticas" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-white text-white"
                  : "border-transparent text-purple-200 hover:text-white"
              }`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-orange-500/80 text-white"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4 space-y-4">

        {/* ── Capacity Alert Banner ── */}
        {!alertDismissed && (
          <HotelCapacityAlert
            bookings={bookings}
            capacityTotal={capacityTotal}
            onDismiss={() => setAlertDismissed(true)}
          />
        )}

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Hóspedes agora", value: occupancyToday, sub: `de ${capacityTotal}`, color: "text-purple-700", bg: "bg-purple-50 border-purple-100", icon: <Dog className="w-4 h-4 text-purple-500" /> },
            { label: "Pendentes", value: pendingBookings.length, sub: "a responder", color: "text-orange-700", bg: "bg-orange-50 border-orange-100", icon: <Clock className="w-4 h-4 text-orange-500" /> },
            { label: "Chegadas hoje", value: todayCheckins.length, sub: "check-in", color: "text-green-700", bg: "bg-green-50 border-green-100", icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
            { label: "Receita 30d", value: `${revenue30d.toFixed(0)}€`, sub: "estimada", color: "text-blue-700", bg: "bg-blue-50 border-blue-100", icon: <TrendingUp className="w-4 h-4 text-blue-500" /> },
          ].map(kpi => (
            <div key={kpi.label} className={`${kpi.bg} border rounded-2xl p-3.5`}>
              <div className="flex items-center gap-1.5 mb-1">{kpi.icon}<span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{kpi.label}</span></div>
              <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Ocupação + vagas ── */}
        <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-100 p-4 shadow-sm shadow-purple-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-slate-800 text-sm">Ocupação Hoje</p>
              <p className="text-xs text-slate-400">{occupancyToday} cães alojados · {(capacityTotal - occupancyToday)} vagas livres</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Vagas:</span>
              <button onClick={() => updateCapacity(Math.max(0, (hotelProfile?.hotel_details?.capacity_available || 0) - 1))}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">−</button>
              <span className="font-black text-lg text-purple-600 w-6 text-center">{hotelProfile?.hotel_details?.capacity_available ?? capacityTotal}</span>
              <button onClick={() => updateCapacity(Math.min(200, (hotelProfile?.hotel_details?.capacity_available || 0) + 1))}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">+</button>
            </div>
          </div>
          <div className="h-3 bg-purple-100 rounded-full overflow-hidden shadow-inner">
            <div className={`h-full rounded-full transition-all duration-700 ${
              occupancyPct >= 90 ? "bg-gradient-to-r from-red-600 to-red-400"
              : occupancyPct >= 70 ? "bg-gradient-to-r from-orange-500 to-orange-400"
              : "bg-gradient-to-r from-purple-800 to-purple-400"
            }`}
              style={{ width: `${occupancyPct}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-slate-400">
            <span>{occupancyPct}% ocupado</span>
            <span>Máx: {capacityTotal} cães</span>
          </div>
        </div>

        {/* ── Tab content ── */}
        <AnimatePresence mode="wait">

          {/* HÓSPEDES */}
          {activeTab === "hospedes" && (
            <motion.div key="hospedes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelGuestsPanel
                bookings={bookings}
                onUpdateBooking={handleUpdateBooking}
              />
            </motion.div>
          )}

          {/* AGENDA: Calendário + painel do dia */}
          {activeTab === "agenda" && (
            <motion.div key="agenda" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <HotelCalendar
                  bookings={bookings}
                  selectedDate={selectedDate}
                  onDayClick={setSelectedDate}
                />
              </div>
              <div>
                <HotelDayPanel
                  date={selectedDate}
                  bookings={bookings}
                  onUpdateBooking={handleUpdateBooking}
                  capacity={{ total: capacityTotal, available: hotelProfile?.hotel_details?.capacity_available }}
                />
              </div>
            </motion.div>
          )}

          {/* SERVIÇOS */}
          {activeTab === "servicos" && (
            <motion.div key="servicos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelServiceManager
                hotelProfile={hotelProfile}
                onServiceUpdate={() => queryClient.invalidateQueries(['hotelProfile'])}
              />
            </motion.div>
          )}

          {/* VAGAS */}
          {activeTab === "vagas" && (
            <motion.div key="vagas" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <HotelCapacityAdjuster hotelProfile={hotelProfile} />
              <HotelOccupancyManager
                bookings={bookings}
                hotelProfile={hotelProfile}
                onUpdateCapacity={updateCapacity}
              />
            </motion.div>
          )}

          {/* FINANÇAS */}
          {activeTab === "financas" && (
            <motion.div key="financas" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelFinancesPanel bookings={bookings} hotelProfile={hotelProfile} />
            </motion.div>
          )}

          {/* CARTÃO DIGITAL */}
          {activeTab === "cartao" && (
            <motion.div key="cartao" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelDigitalPass hotelProfile={hotelProfile} />
            </motion.div>
          )}

          {/* HOJE */}
          {activeTab === "today" && (
            <motion.div key="today" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">

              {/* Check-ins */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Chegadas hoje ({todayCheckins.length})
                </p>
                {todayCheckins.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 py-6 text-center text-slate-400 text-sm">Sem chegadas hoje</div>
                ) : todayCheckins.map(b => (
                  <BookingRow key={b.id} booking={b} onUpdate={handleUpdateBooking} />
                ))}
              </div>

              {/* Check-outs */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Saídas hoje ({todayCheckouts.length})
                </p>
                {todayCheckouts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 py-6 text-center text-slate-400 text-sm">Sem saídas hoje</div>
                ) : todayCheckouts.map(b => (
                  <BookingRow key={b.id} booking={b} onUpdate={handleUpdateBooking} />
                ))}
              </div>
            </motion.div>
          )}

          {/* RESERVAS */}
          {activeTab === "reservas" && (
            <motion.div key="reservas" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              {/* Pendentes primeiro */}
              {pendingBookings.length > 0 && (
                <div>
                  <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Aguardam resposta ({pendingBookings.length})
                  </p>
                  {pendingBookings.map(b => <BookingRow key={b.id} booking={b} onUpdate={handleUpdateBooking} />)}
                </div>
              )}
              {/* Todas */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Todas as reservas ({bookings.length})</p>
                {loadingBookings && <p className="text-center text-slate-400 py-8 text-sm">A carregar...</p>}
                {!loadingBookings && bookings.length === 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center">
                    <CalendarDays className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="text-slate-400 text-sm">Sem reservas ainda</p>
                    <Button size="sm" className="mt-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1.5"
                      onClick={() => setShowNewBooking(true)}>
                      <Plus className="w-3.5 h-3.5" /> Nova Reserva
                    </Button>
                  </div>
                )}
                {bookings.filter(b => b.status !== "pending").map(b => (
                  <BookingRow key={b.id} booking={b} onUpdate={handleUpdateBooking} />
                ))}
              </div>
            </motion.div>
          )}

          {/* PARCEIROS */}
          {activeTab === "parceiros" && (
            <motion.div key="parceiros" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelPartnersPanel
                partners={partners}
                bookings={bookings}
                onToggleAvailability={togglePartnerAvailability}
                onAddPartner={() => setShowAddPartner(true)}
              />
            </motion.div>
          )}

          {/* CONFIGURAÇÕES */}
          {activeTab === "config" && (
            <motion.div key="config" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelCheckinPolicyConfig
                hotelProfile={hotelProfile}
                onSave={() => {
                  queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
                }}
              />
            </motion.div>
          )}

          {/* STATS */}
          {activeTab === "stats" && (
            <motion.div key="stats" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              <StatsPanel bookings={bookings} />
            </motion.div>
          )}

          </AnimatePresence>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowNewBooking(true)}
        className="fixed bottom-24 md:bottom-8 right-5 z-30 w-14 h-14 bg-gradient-to-br from-purple-800 to-purple-500 rounded-2xl shadow-2xl shadow-purple-900/40 flex items-center justify-center hover:scale-110 hover:shadow-purple-700/50 active:scale-95 transition-all border border-purple-400/30"
        title="Nova Reserva"
      >
        <Plus className="w-6 h-6 text-white drop-shadow" />
      </button>

      {/* New booking modal */}
      <HotelNewBookingModal
        isOpen={showNewBooking}
        onClose={() => setShowNewBooking(false)}
        onSave={handleCreateBooking}
        hotelProfile={hotelProfile}
        partners={partners}
        defaultDate={selectedDate}
      />

      <HotelAddPartnerModal
        isOpen={showAddPartner}
        onClose={() => {
          setShowAddPartner(false);
          queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
        }}
        hotelProfile={hotelProfile}
      />
    </div>
  );
}

// ── Reutilizável: linha de reserva ──
function BookingRow({ booking, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.completed;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-2">
      <button className="w-full text-left p-4" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-900 text-sm">{booking.owner_name}</p>
              {booking.dogs?.length > 0 && (
                <span className="text-[10px] text-purple-600 font-medium">🐕 {booking.dogs.map(d => d.dog_name).join(", ")}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 flex-wrap">
              <span>{SERVICE_LABELS[booking.service_type] || booking.service_type}</span>
              <span>📅 {booking.checkin_date}{booking.checkout_date ? ` → ${booking.checkout_date}` : ""}</span>
              {booking.checkin_time && <span>🕐 {booking.checkin_time}</span>}
              <span>🐶 {booking.total_dogs || 1}</span>
              {booking.total_amount > 0 && <span className="text-green-600 font-bold">{booking.total_amount.toFixed(2)}€</span>}
            </div>
          </div>
          <Badge className={`text-[10px] border-0 shrink-0 ${cfg.cls}`}>{cfg.label}</Badge>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-slate-50">
            <div className="p-4 pt-3 space-y-2">
              {booking.owner_phone && <p className="text-xs text-slate-500">📞 {booking.owner_phone}</p>}
              {booking.owner_email && <p className="text-xs text-slate-500">✉️ {booking.owner_email}</p>}
              {booking.special_requests && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                  <p className="text-xs text-orange-700">📝 {booking.special_requests}</p>
                </div>
              )}
              {booking.assigned_walker_name && (
                <p className="text-xs text-purple-600 font-medium">👤 Parceiro: {booking.assigned_walker_name}</p>
              )}
              {booking.internal_notes && (
                <div className="bg-slate-50 rounded-xl px-3 py-2">
                  <p className="text-xs text-slate-500">🗒 {booking.internal_notes}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                {booking.status === "pending" && (
                  <>
                    <Button size="sm" className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs"
                      onClick={() => onUpdate(booking.id, { status: "confirmed" })}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8 border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs"
                      onClick={() => onUpdate(booking.id, { status: "rejected" })}>
                      <XCircle className="w-3 h-3 mr-1" /> Rejeitar
                    </Button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <Button size="sm" className="flex-1 h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs"
                    onClick={() => onUpdate(booking.id, { status: "checked_in", checkin_time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) })}>
                    ✅ Registar Check-in
                  </Button>
                )}
                {booking.status === "checked_in" && (
                  <Button size="sm" className="flex-1 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs"
                    onClick={() => onUpdate(booking.id, { status: "checked_out", checkout_time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) })}>
                    🚪 Registar Check-out
                  </Button>
                )}
                {booking.status === "checked_out" && (
                  <Button size="sm" className="flex-1 h-8 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-xs"
                    onClick={() => onUpdate(booking.id, { status: "completed" })}>
                    ✔️ Concluir
                  </Button>
                )}
                {["confirmed", "pending"].includes(booking.status) && (
                  <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-400 hover:bg-red-50 rounded-xl text-xs"
                    onClick={() => onUpdate(booking.id, { status: "cancelled" })}>
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Stats panel ──
function StatsPanel({ bookings }) {
  const totalRevenue = bookings.filter(b => !["cancelled", "rejected"].includes(b.status)).reduce((acc, b) => acc + (b.total_amount || 0), 0);
  const completedCount = bookings.filter(b => b.status === "completed").length;
  const cancelledCount = bookings.filter(b => ["cancelled", "rejected"].includes(b.status)).length;
  const avgValue = completedCount > 0 ? (bookings.filter(b => b.status === "completed").reduce((acc, b) => acc + (b.total_amount || 0), 0) / completedCount) : 0;

  const serviceBreakdown = Object.entries(
    bookings.reduce((acc, b) => {
      if (["cancelled", "rejected"].includes(b.status)) return acc;
      acc[b.service_type] = (acc[b.service_type] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Receita Total", value: `${totalRevenue.toFixed(2)}€`, color: "text-green-700", bg: "bg-green-50 border-green-100" },
          { label: "Concluídas", value: completedCount, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
          { label: "Canceladas", value: cancelledCount, color: "text-red-600", bg: "bg-red-50 border-red-100" },
          { label: "Ticket Médio", value: `${avgValue.toFixed(2)}€`, color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-2xl p-4`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {serviceBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Por tipo de serviço</p>
          <div className="space-y-2">
            {serviceBreakdown.map(([type, count]) => {
              const maxCount = serviceBreakdown[0][1];
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-28 shrink-0">{SERVICE_LABELS[type] || type}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
          </div>
          )}
          </div>
          );
          }