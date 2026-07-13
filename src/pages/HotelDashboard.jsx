import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useHotelCapacity } from "@/hooks/useHotelCapacity";
import {
  Hotel, CalendarDays, Dog, Users, Euro, CheckCircle2,
  XCircle, Clock, Plus, AlertCircle, TrendingUp, LayoutGrid, Settings, RefreshCw,
  ClipboardList, Wallet, UserCheck, Phone, Mail, StickyNote, FileText, DoorOpen,
  BedDouble, Sun, Scissors, GraduationCap, PawPrint, ArrowRight, ArrowLeft,
  CircleDot, X, ChevronDown
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
import HotelProfileSettings from "@/components/hotel/HotelProfileSettings";
import HotelReservationsPanel from "@/components/hotel/HotelReservationsPanel";
import HotelSalesInsights from "@/components/hotel/HotelSalesInsights";
import HotelWaitlistPanel from "@/components/hotel/HotelWaitlistPanel";
import HotelGuestProfilesPanel from "@/components/hotel/HotelGuestProfilesPanel";

const STATUS_CONFIG = {
  pending:     { label: "Pendente",    dot: "bg-amber-500", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed:   { label: "Confirmado",  dot: "bg-blue-500",  cls: "bg-blue-50 text-blue-700 border-blue-200" },
  checked_in:  { label: "Check-in",    dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "Em curso",    dot: "bg-teal-500",  cls: "bg-teal-50 text-teal-700 border-teal-200" },
  checked_out: { label: "Check-out",   dot: "bg-violet-500", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  completed:   { label: "Concluído",   dot: "bg-slate-400", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  cancelled:   { label: "Cancelado",   dot: "bg-red-500",   cls: "bg-red-50 text-red-600 border-red-200" },
  rejected:    { label: "Rejeitado",   dot: "bg-red-500",   cls: "bg-red-50 text-red-600 border-red-200" },
};

const SERVICE_ICONS = {
  boarding: BedDouble,
  daycare: Sun,
  grooming: Scissors,
  walk_with_partner: PawPrint,
  training: GraduationCap,
};

const SERVICE_LABELS = {
  boarding: "Alojamento",
  daycare: "Creche",
  grooming: "Grooming",
  walk_with_partner: "Passeio",
  training: "Treino",
};

const TABS = [
  { key: "hospedes",  label: "Hóspedes",          icon: Users },
  { key: "reservas",  label: "Reservas",          icon: ClipboardList },
  { key: "agenda",    label: "Agenda",            icon: CalendarDays },
  { key: "espera",    label: "Lista Espera",      icon: Clock },
  { key: "clientes",  label: "Clientes",          icon: UserCheck },
  { key: "servicos",  label: "Serviços e Vagas",  icon: LayoutGrid },
  { key: "financas",  label: "Finanças",          icon: Wallet },
  { key: "parceiros", label: "Parceiros",         icon: UserCheck },
  { key: "config",    label: "Configurações",     icon: Settings },
];

export default function HotelDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const adjustServiceCapacity = async (serviceType, delta) => {
    if (!hotelProfile || !serviceType || !delta) return;
    const hd = hotelProfile.hotel_details || {};
    const services = (hd.services || []).map(s => {
      if (s.service_type === serviceType) {
        const current = s.capacity_available ?? 0;
        const updated = Math.max(0, Math.min(s.capacity_total ?? current, current + delta));
        return { ...s, capacity_available: updated };
      }
      return s;
    });
    const topCurrent = hd.capacity_available ?? 0;
    const topUpdated = Math.max(0, Math.min(hd.capacity_total ?? topCurrent, topCurrent + delta));
    await base44.entities.WalkerProfile.update(hotelProfile.id, {
      hotel_details: { ...hd, capacity_available: topUpdated, services },
    });
    queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
  };

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HotelBooking.update(id, data),
    onSuccess: async (_response, { id, data: updates }) => {
      queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });
      if (updates.status) {
          const booking = bookings.find(b => b.id === id);
          if (booking) {
            const oldStatus = booking.status;
            const newStatus = updates.status;
            const dogs = booking.total_dogs || 1;
            // Decrement capacity when booking becomes confirmed or checked_in (from pending)
            if (oldStatus === "pending" && ["confirmed", "checked_in"].includes(newStatus)) {
              await adjustServiceCapacity(booking.service_type, -dogs);
            }
            // Restore capacity when cancelling from an active/confirmed state
            if (newStatus === "cancelled" && ["confirmed", "checked_in", "in_progress", "pending"].includes(oldStatus)) {
              await adjustServiceCapacity(booking.service_type, dogs);
            }
          }
        }
      toast.success("Reserva atualizada com sucesso");
    },
    onError: () => toast.error("Erro ao atualizar reserva"),
  });

  const createBookingMutation = useMutation({
    mutationFn: (data) => base44.entities.HotelBooking.create(data),
    onSuccess: async (newBooking) => {
      queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });
      if (["confirmed", "checked_in"].includes(newBooking.status) && newBooking.service_type) {
        await adjustServiceCapacity(newBooking.service_type, -(newBooking.total_dogs || 1));
      }
      toast.success(newBooking.status === "checked_in" ? "Check-in registado" : "Reserva criada com sucesso");
    },
    onError: () => toast.error("Erro ao criar reserva"),
  });

  const updateCapacity = async (value) => {
    if (!hotelProfile) return;
    await base44.entities.WalkerProfile.update(hotelProfile.id, {
      hotel_details: { ...hotelProfile.hotel_details, capacity_available: parseInt(value) },
    });
    queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
    toast.success("Vagas atualizadas");
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
    toast.success("Disponibilidade do parceiro atualizada");
  };

  const updatePartnerRole = async (partnerEmail, newRole) => {
    if (!hotelProfile) return;
    const partners = hotelProfile.hotel_details?.partner_walkers || [];
    const updated = partners.map(p =>
      p.walker_email === partnerEmail ? { ...p, partner_role: newRole } : p
    );
    await base44.entities.WalkerProfile.update(hotelProfile.id, {
      hotel_details: { ...hotelProfile.hotel_details, partner_walkers: updated },
    });
    queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
    const roleLabels = { simple: "Acesso Simples", limited: "Acesso Limitado", full: "Acesso Total" };
    toast.success(`Nível de acesso alterado para ${roleLabels[newRole] || newRole}`);
  };

  const handleSyncGoogleCalendar = async () => {
    if (!hotelProfile) return;
    setIsSyncing(true);
    try {
      const response = await base44.functions.invoke('syncHotelBookingsToGoogleCalendar', {
        hotel_profile_id: hotelProfile.id
      });
      toast.success(response.data?.message || "Sincronização concluída");
    } catch (error) {
      toast.error(`Erro na sincronização: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateBooking = (id, data) => updateBookingMutation.mutate({ id, data });
  const handleCreateBooking = (data) => createBookingMutation.mutate(data);

  const partners = hotelProfile?.hotel_details?.partner_walkers || [];
  const {
    capacityTotal, occupancyToday, occupancyPct, revenue30d,
    pendingBookings, activeBookings, todayCheckins, todayCheckouts,
  } = useHotelCapacity(hotelProfile, bookings);

  if (!loadingProfile && !hotelProfile && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Hotel className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Painel do Hotel</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            Ainda não tens um perfil de hotel criado. Cria o teu perfil para começar a gerir reservas, hóspedes e capacidades.
          </p>
          <Button onClick={() => navigate(createPageUrl("ProfessionalSetup"))}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-6">
            <Plus className="w-4 h-4 mr-2" /> Criar Perfil de Hotel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-tight">
                {hotelProfile?.hotel_details?.hotel_name || hotelProfile?.walker_name || "Hotel"}
              </h1>
              <p className="text-slate-400 text-xs truncate max-w-[180px]">{hotelProfile?.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingBookings.length > 0 && (
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">
                {pendingBookings.length} pendente{pendingBookings.length > 1 ? "s" : ""}
              </Badge>
            )}
            <div className="flex items-center gap-1.5">
              <CircleDot className={`w-3 h-3 ${hotelProfile?.is_active ? "text-emerald-500" : "text-slate-300"}`} />
              <span className="text-xs font-medium text-slate-600 hidden sm:inline">
                {hotelProfile?.is_active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <Button size="sm" variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg gap-1.5 text-xs hidden md:flex"
              onClick={handleSyncGoogleCalendar} disabled={isSyncing}>
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? "A sincronizar" : "Google Calendar"}
            </Button>
            <Button size="sm" variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg gap-1.5 text-xs hidden md:flex"
              onClick={() => navigate(createPageUrl("ProfessionalHubV2"))}>
              <Settings className="w-3.5 h-3.5" /> Configurar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 flex gap-0.5 overflow-x-auto scrollbar-none">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const count = tab.key === "hospedes" ? activeBookings.length + pendingBookings.length
                         : tab.key === "parceiros" ? partners.length : 0;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all rounded-t-md ${
                  activeTab === tab.key
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    activeTab === tab.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-4 space-y-4">
        {/* Capacity Alert */}
        {!alertDismissed && (
          <HotelCapacityAlert
            bookings={bookings}
            capacityTotal={capacityTotal}
            onDismiss={() => setAlertDismissed(true)}
          />
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Hóspedes agora", value: occupancyToday, sub: `de ${capacityTotal} vagas`, icon: Dog, iconCls: "text-slate-500" },
            { label: "Pendentes", value: pendingBookings.length, sub: "a responder", icon: Clock, iconCls: "text-amber-500" },
            { label: "Chegadas hoje", value: todayCheckins.length, sub: "check-in", icon: ArrowRight, iconCls: "text-emerald-500" },
            { label: "Receita 30d", value: `${revenue30d.toFixed(0)}€`, sub: "estimada", icon: TrendingUp, iconCls: "text-blue-500" },
          ].map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${kpi.iconCls}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Occupancy Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-slate-900 text-sm">Ocupação de Hoje</p>
              <p className="text-xs text-slate-400">{occupancyToday} cães alojados · {capacityTotal - occupancyToday} vagas livres</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">Vagas:</span>
              <button onClick={() => updateCapacity(Math.max(0, (hotelProfile?.hotel_details?.capacity_available || 0) - 1))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-lg text-slate-900 w-6 text-center">{hotelProfile?.hotel_details?.capacity_available ?? capacityTotal}</span>
              <button onClick={() => updateCapacity(Math.min(200, (hotelProfile?.hotel_details?.capacity_available || 0) + 1))}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${
              occupancyPct >= 90 ? "bg-red-500"
              : occupancyPct >= 70 ? "bg-amber-500"
              : "bg-slate-900"
            }`}
              style={{ width: `${occupancyPct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
            <span>{occupancyPct}% ocupado</span>
            <span>Capacidade máxima: {capacityTotal} cães</span>
          </div>
        </div>

        {/* Sales Insights */}
        {!loadingBookings && hotelProfile && (
          <HotelSalesInsights
            bookings={bookings}
            hotelProfile={hotelProfile}
            onNewBooking={() => setShowNewBooking(true)}
          />
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">

          {activeTab === "hospedes" && (
            <motion.div key="hospedes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelGuestsPanel
                bookings={bookings}
                onUpdateBooking={handleUpdateBooking}
              />
            </motion.div>
          )}

          {activeTab === "reservas" && (
            <motion.div key="reservas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {loadingBookings ? (
                <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
                  <p className="text-slate-400 text-sm">A carregar reservas...</p>
                </div>
              ) : (
                <HotelReservationsPanel
                  bookings={bookings}
                  onUpdateBooking={handleUpdateBooking}
                  onNewBooking={() => setShowNewBooking(true)}
                />
              )}
            </motion.div>
          )}

          {activeTab === "agenda" && (
            <motion.div key="agenda" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
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

          {activeTab === "espera" && (
            <motion.div key="espera" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelWaitlistPanel hotelProfile={hotelProfile} />
            </motion.div>
          )}

          {activeTab === "clientes" && (
            <motion.div key="clientes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelGuestProfilesPanel hotelProfile={hotelProfile} />
            </motion.div>
          )}

          {activeTab === "servicos" && (
            <motion.div key="servicos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <HotelServiceManager
                hotelProfile={hotelProfile}
                onServiceUpdate={() => queryClient.invalidateQueries(['hotelProfile'])}
              />
              <HotelCapacityAdjuster hotelProfile={hotelProfile} />
              <HotelOccupancyManager
                bookings={bookings}
                hotelProfile={hotelProfile}
                onUpdateCapacity={updateCapacity}
              />
            </motion.div>
          )}

          {activeTab === "financas" && (
            <motion.div key="financas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-4">
              <HotelFinancesPanel bookings={bookings} hotelProfile={hotelProfile} />
            </motion.div>
          )}

          {activeTab === "parceiros" && (
            <motion.div key="parceiros" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelPartnersPanel
                partners={partners}
                bookings={bookings}
                onToggleAvailability={togglePartnerAvailability}
                onAddPartner={() => setShowAddPartner(true)}
                onUpdatePartnerRole={updatePartnerRole}
              />
            </motion.div>
          )}

          {activeTab === "config" && (
            <motion.div key="config" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Perfil e Imagem</p>
                <HotelProfileSettings
                  hotelProfile={hotelProfile}
                  onSave={() => queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] })}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Política de Check-in/out</p>
                <HotelCheckinPolicyConfig
                  hotelProfile={hotelProfile}
                  onSave={() => {
                    queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
                  }}
                />
              </div>
              <HotelDigitalPass hotelProfile={hotelProfile} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowNewBooking(true)}
        className="fixed bottom-24 md:bottom-8 right-5 z-30 w-14 h-14 bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-lg shadow-slate-900/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        title="Nova Reserva"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

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

// Booking Row Component
function BookingRow({ booking, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.completed;
  const ServiceIcon = SERVICE_ICONS[booking.service_type] || ClipboardList;

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-2">
      <button className="w-full text-left p-4" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-900 text-sm">{booking.owner_name}</p>
              {booking.dogs?.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                  <PawPrint className="w-3 h-3" />
                  {booking.dogs.map(d => d.dog_name).join(", ")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <ServiceIcon className="w-3 h-3" />
                {SERVICE_LABELS[booking.service_type] || booking.service_type}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {booking.checkin_date}{booking.checkout_date ? ` → ${booking.checkout_date}` : ""}
              </span>
              {booking.checkin_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {booking.checkin_time}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Dog className="w-3 h-3" />
                {booking.total_dogs || 1}
              </span>
              {booking.total_amount > 0 && (
                <span className="text-emerald-600 font-semibold">{booking.total_amount.toFixed(2)}€</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-[10px] border ${cfg.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
              {cfg.label}
            </Badge>
            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-slate-100">
            <div className="p-4 pt-3 space-y-2.5">
              {booking.owner_phone && (
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {booking.owner_phone}
                </p>
              )}
              {booking.owner_email && (
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {booking.owner_email}
                </p>
              )}
              {booking.special_requests && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700 flex items-start gap-2">
                    <StickyNote className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{booking.special_requests}</span>
                  </p>
                </div>
              )}
              {booking.assigned_walker_name && (
                <p className="text-xs text-slate-600 font-medium flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  Parceiro: {booking.assigned_walker_name}
                </p>
              )}
              {booking.internal_notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500 flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                    <span>{booking.internal_notes}</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-1 flex-wrap">
                {booking.status === "pending" && (
                  <>
                    <Button size="sm" className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs min-w-[120px]"
                      onClick={() => onUpdate(booking.id, { status: "confirmed" })}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmar
                    </Button>
                    <Button size="sm" variant="outline"
                      className="flex-1 h-8 border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs min-w-[120px]"
                      onClick={() => onUpdate(booking.id, { status: "rejected" })}>
                      <X className="w-3.5 h-3.5 mr-1" /> Rejeitar
                    </Button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <Button size="sm" className="flex-1 h-8 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs"
                    onClick={() => onUpdate(booking.id, { status: "checked_in", checkin_time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) })}>
                    <DoorOpen className="w-3.5 h-3.5 mr-1" /> Registar Check-in
                  </Button>
                )}
                {booking.status === "checked_in" && (
                  <Button size="sm" className="flex-1 h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs"
                    onClick={() => onUpdate(booking.id, { status: "checked_out", checkout_time: new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }) })}>
                    <DoorOpen className="w-3.5 h-3.5 mr-1" /> Registar Check-out
                  </Button>
                )}
                {booking.status === "checked_out" && (
                  <Button size="sm" className="flex-1 h-8 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs"
                    onClick={() => onUpdate(booking.id, { status: "completed" })}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Concluir Estadia
                  </Button>
                )}
                {["confirmed", "pending"].includes(booking.status) && (
                  <Button size="sm" variant="outline"
                    className="h-8 border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs"
                    onClick={() => onUpdate(booking.id, { status: "cancelled" })}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
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

// Stats Panel Component
function StatsPanel({ bookings }) {
  const totalRevenue = bookings.filter(b => !["cancelled", "rejected"].includes(b.status)).reduce((acc, b) => acc + (b.total_amount || 0), 0);
  const completedCount = bookings.filter(b => b.status === "completed").length;
  const cancelledCount = bookings.filter(b => ["cancelled", "rejected"].includes(b.status)).length;
  const avgValue = completedCount > 0
    ? (bookings.filter(b => b.status === "completed").reduce((acc, b) => acc + (b.total_amount || 0), 0) / completedCount)
    : 0;

  const serviceBreakdown = Object.entries(
    bookings.reduce((acc, b) => {
      if (["cancelled", "rejected"].includes(b.status)) return acc;
      acc[b.service_type] = (acc[b.service_type] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const stats = [
    { label: "Receita Total", value: `${totalRevenue.toFixed(2)}€`, color: "text-emerald-700" },
    { label: "Concluídas", value: completedCount, color: "text-blue-700" },
    { label: "Canceladas", value: cancelledCount, color: "text-red-600" },
    { label: "Ticket Médio", value: `${avgValue.toFixed(2)}€`, color: "text-slate-700" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {serviceBreakdown.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Reservas por Tipo de Serviço</p>
          <div className="space-y-2.5">
            {serviceBreakdown.map(([type, count]) => {
              const maxCount = serviceBreakdown[0][1];
              const Icon = SERVICE_ICONS[type] || ClipboardList;
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 w-32 shrink-0">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    {SERVICE_LABELS[type] || type}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-900 rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxCount) * 100}%` }} />
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