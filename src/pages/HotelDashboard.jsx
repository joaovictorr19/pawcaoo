import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useHotelCapacity } from "@/hooks/useHotelCapacity";
import {
  Hotel, CalendarDays, Dog, Users, Euro, CheckCircle2,
  XCircle, Clock, Plus, AlertCircle, TrendingUp, LayoutGrid, Settings,
  ClipboardList, Wallet, UserCheck, UserPlus, Phone, Mail, StickyNote, FileText, DoorOpen,
  BedDouble, Sun, Scissors, GraduationCap, PawPrint, ArrowRight, ArrowLeft,
  CircleDot, X, ChevronDown, Stethoscope, ListChecks, BookOpen, Store, Gift
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
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
import HotelAddOnSalesPanel from "@/components/hotel/HotelAddOnSalesPanel";
import HotelWaitlistPanel from "@/components/hotel/HotelWaitlistPanel";
import HotelGuestProfilesPanel from "@/components/hotel/HotelGuestProfilesPanel";
import HotelCaninoProfiles from "@/components/hotel/HotelCaninoProfiles";
import HotelPetRecordsPanel from "@/components/hotel/HotelPetRecordsPanel";
import HotelBulkMessagePanel from "@/components/hotel/HotelBulkMessagePanel";
import HotelTasksPanel from "@/components/hotel/HotelTasksPanel";
import HotelMimoDeliveries from "@/components/hotel/HotelMimoDeliveries";
import AssignTaskModal from "@/components/hotel/AssignTaskModal";
import AddServiceToStayModal from "@/components/hotel/AddServiceToStayModal";
import HotelOnboardingEmpty from "@/components/hotel/HotelOnboardingEmpty";
import PortfolioSection from "@/components/professional-hub/PortfolioSection";
import BackButton from "@/components/ui/BackButton";
import PartnerStorePanel from "@/components/shop/PartnerStorePanel";
import { getCurrentUser } from "@/utils/getCurrentUser";

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

// Tabs agrupadas por categoria — pills que quebram linha (mobile-friendly),
// sem ícones duplicados e labels claros para evitar confusão entre secções.
const TAB_GROUPS = [
  {
    label: "Operação",
    items: [
      { key: "diario",   label: "Diário",          icon: BookOpen },
      { key: "tarefas",  label: "Tarefas",         icon: ListChecks },
      { key: "reservas", label: "Reservas",        icon: ClipboardList },
      { key: "agenda",   label: "Agenda",          icon: CalendarDays },
      { key: "hospedes", label: "Hóspedes",        icon: Users },
      { key: "mimos",    label: "Mimos",           icon: Gift },
    ],
  },
  {
    label: "Clientes & Cães",
    items: [
      { key: "clientes",   label: "Ficha Clientes",  icon: UserCheck },
      { key: "caninos",     label: "Perfis Caninos",  icon: PawPrint },
      { key: "prontuario", label: "Registos Saúde",   icon: Stethoscope },
      { key: "espera",      label: "Lista Espera",    icon: Clock },
    ],
  },
  {
    label: "Gestão",
    items: [
      { key: "servicos",  label: "Serviços & Vagas", icon: LayoutGrid },
      { key: "financas",  label: "Finanças",         icon: Wallet },
      { key: "loja",      label: "Loja",             icon: Store },
      { key: "parceiros", label: "Parceiros",        icon: UserPlus },
    ],
  },
  {
    label: "Configurações",
    items: [
      { key: "config", label: "Configurações", icon: Settings },
    ],
  },
];

export default function HotelDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const el = document.scrollingElement || document.documentElement;
    if (el) el.scrollTop = 0;
    window.scrollTo(0, 0);
  }, []);

  const [activeTab, setActiveTab] = useState("tarefas");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => await getCurrentUser(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: hotelProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["myHotelProfile", user?.email],
    queryFn: async () => {
      let profiles = await base44.entities.WalkerProfile.filter({ user_id: user.id, professional_type: "hotel" });
      if (!profiles.length) {
        profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email, professional_type: "hotel" });
      }
      const profile = profiles[0] || null;

      if (!profile && user?.email) {
        // Consulta leve: o servidor devolve apenas hotéis onde este email é parceiro
        let partnerHotels = await base44.entities.WalkerProfile.filter(
          { professional_type: "hotel", "hotel_details.partner_walkers.walker_email": user.email },
          undefined,
          20
        );
        if (!partnerHotels.length) {
          const lowerEmail = user.email.trim().toLowerCase();
          if (lowerEmail !== user.email) {
            partnerHotels = await base44.entities.WalkerProfile.filter(
              { professional_type: "hotel", "hotel_details.partner_walkers.walker_email": lowerEmail },
              undefined,
              20
            );
          }
        }

        for (const h of partnerHotels) {
          const partners = h.hotel_details?.partner_walkers || [];
          const partnership = partners.find(p => p.walker_email?.toLowerCase() === user.email.toLowerCase());
          if (partnership) {
            if (partnership.partner_role === 'full') {
              // Full-access partner: use the hotel's profile directly
              return h;
            } else {
              // simple or limited: redirect to partner panel (feito no effect abaixo,
              // nunca dentro do queryFn — a query corre em background no TabKeepAlive
              // e um navigate aqui arrancava o utilizador de outras páginas)
              return { _redirectToPartnerPanel: true };
            }
          }
        }
      }

      return profile;
    },
    enabled: !!user?.email,
    staleTime: 60 * 1000,
  });

  // Parceiro simple/limited a abrir o painel do hotel: redirecionar para o painel
  // parceiro — apenas quando este painel está realmente visível (nunca em background)
  React.useEffect(() => {
    if (hotelProfile?._redirectToPartnerPanel && location.pathname === createPageUrl("HotelDashboard")) {
      navigate(createPageUrl("PartnerHotelPanel"));
    }
  }, [hotelProfile, location.pathname, navigate]);

  // Sincronizar vagas globais e por serviço com a ocupação real de hoje
  // (corre uma vez ao abrir o painel; a invalidação não gera loop — a dep é o id)
  React.useEffect(() => {
    if (!hotelProfile?.id || !user?.email || hotelProfile?._redirectToPartnerPanel) return;
    let cancelled = false;
    (async () => {
      try {
        await base44.functions.invoke('syncHotelAvailability', {
          hotel_email: hotelProfile.created_by || user.email,
        });
        if (!cancelled) queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
      } catch (e) { /* silencioso — não bloqueia o painel */ }
    })();
    return () => { cancelled = true; };
  }, [hotelProfile?.id, user?.email]);

  const { data: bookings = [], isLoading: loadingBookings } = useQuery({
    queryKey: ["hotelBookings", hotelProfile?.id],
    queryFn: () => base44.entities.HotelBooking.filter({ hotel_profile_id: hotelProfile.id }, "-created_date", 100),
    enabled: !!hotelProfile?.id,
    staleTime: 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
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
            // Capacity is already reserved at booking creation (by createHotelCheckout backend
            // or by createBookingMutation below). Do NOT decrement again on confirm — that would
            // double-count.
            // Restore capacity when cancelling from an active/confirmed/pending state
            if (newStatus === "cancelled" && ["confirmed", "checked_in", "in_progress", "pending"].includes(oldStatus)) {
              await adjustServiceCapacity(booking.service_type, dogs);
            }
            // ── Libertar pagamento para o hotel quando o cão entra (check-in) ──
            if (newStatus === "checked_in" && oldStatus !== "checked_in") {
              try {
                await base44.functions.invoke('releaseHotelPayout', { bookingId: id });
                toast.success("Pagamento libertado para o hotel (check-in).");
              } catch (e) {
                console.error('Payout release error:', e);
              }
            }
            // ── Notificar cliente quando o hotel confirma ou rejeita a reserva ──
            if (oldStatus === "pending" && newStatus === "confirmed") {
              try {
                await base44.entities.Notification.create({
                  recipient_email: booking.owner_email,
                  title: '✅ Reserva Confirmada pelo Hotel',
                  message: `O hotel ${booking.hotel_name || ''} confirmou a sua reserva. Check-in: ${booking.checkin_date}.`,
                  type: 'booking',
                  related_id: booking.id,
                  icon: '✅'
                });
              } catch (e) { console.error('Notify client error:', e); }
            }
            if (oldStatus === "pending" && newStatus === "rejected") {
              try {
                await base44.entities.Notification.create({
                  recipient_email: booking.owner_email,
                  title: '❌ Reserva Rejeitada',
                  message: `O hotel ${booking.hotel_name || ''} não pode aceitar a sua reserva. O reembolso será processado.`,
                  type: 'booking',
                  related_id: booking.id,
                  icon: '❌'
                });
              } catch (e) { console.error('Notify client error:', e); }
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
      // Reserve capacity for any active status (pending, confirmed, checked_in)
      if (["pending", "confirmed", "checked_in"].includes(newBooking.status) && newBooking.service_type) {
        await adjustServiceCapacity(newBooking.service_type, -(newBooking.total_dogs || 1));
      }
      // ── Notificar a equipa se o cliente é VIP ──
      try {
        if (hotelProfile?.id && newBooking.owner_email) {
          const profiles = await base44.entities.HotelGuestProfile.filter({
            hotel_profile_id: hotelProfile.id,
            owner_email: newBooking.owner_email,
          });
          if (profiles.length > 0 && profiles[0].is_vip) {
            const notifyEmail = hotelProfile.created_by || newBooking.hotel_email;
            if (notifyEmail) {
              await base44.entities.Notification.create({
                recipient_email: notifyEmail,
                title: '👑 Cliente VIP — Nova Reserva',
                message: `${newBooking.owner_name} é um cliente VIP. Reserva criada para ${newBooking.checkin_date}.`,
                type: 'booking',
                related_id: newBooking.id,
                icon: '👑'
              });
            }
          }
        }
      } catch (e) { console.error('VIP check error:', e); }
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

  const updatePartnerTitle = async (partnerEmail, newTitle) => {
    if (!hotelProfile) return;
    const partners = hotelProfile.hotel_details?.partner_walkers || [];
    const updated = partners.map(p =>
      p.walker_email === partnerEmail ? { ...p, custom_title: newTitle } : p
    );
    await base44.entities.WalkerProfile.update(hotelProfile.id, {
      hotel_details: { ...hotelProfile.hotel_details, partner_walkers: updated },
    });
    queryClient.invalidateQueries({ queryKey: ["myHotelProfile"] });
    toast.success(`Título alterado para ${newTitle}`);
  };

  const handleUpdateBooking = (id, data) => updateBookingMutation.mutate({ id, data });
  const handleCreateBooking = (data) => createBookingMutation.mutate(data);

  const handleAssignTask = async ({ bookingId, addOn }) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    const newAddOns = [...(booking.add_ons || []), addOn];
    const newTotal = newAddOns.reduce((sum, a) => sum + (a.total_price || 0), 0);
    await base44.entities.HotelBooking.update(bookingId, { add_ons: newAddOns, add_ons_total: newTotal });
    queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });
    toast.success("Tarefa atribuída ao parceiro");
  };

  const handleAddServiceToStay = async ({ bookingId, addOn, paymentMethod, total }) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    // Hotel-initiated card add-ons are auto-accepted so the client can pay through the site
    const finalAddOn = paymentMethod === "card"
      ? { ...addOn, requested_by_client: false, request_status: 'accepted' }
      : addOn;
    const newAddOns = [...(booking.add_ons || []), finalAddOn];
    const newAddOnsTotal = newAddOns.reduce((sum, a) => sum + (a.total_price || 0), 0);
    const updates = { add_ons: newAddOns, add_ons_total: newAddOnsTotal };
    if (booking.total_amount != null) {
      updates.total_amount = (booking.total_amount || 0) + total;
    }
    if (paymentMethod === "cash") {
      updates.service_amount = (booking.service_amount || 0) + total;
    }
    await base44.entities.HotelBooking.update(bookingId, updates);
    queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });

    if (paymentMethod === "cash") {
      toast.success(`Serviço adicionado · ${total.toFixed(2)}€ recebido (presencial)`);
      return;
    }

    // Card: generate Stripe checkout link + notify the client in-app
    let stripeUrl = null;
    try {
      const addOnIndex = newAddOns.length - 1;
      const origin = window.location.origin;
      const resp = await base44.functions.invoke('createHotelAddOnCheckout', {
        bookingId,
        addOnIndex,
        initiatedBy: 'hotel',
        successUrl: `${origin}/ClientDashboard?addon=success`,
        cancelUrl: `${origin}/ClientDashboard?addon=cancelled`,
      });
      stripeUrl = resp?.data?.url || null;
    } catch (e) {
      console.error('Stripe add-on checkout error:', e);
    }

    if (booking.owner_email) {
      try {
        await base44.entities.Notification.create({
          recipient_email: booking.owner_email,
          title: '💳 Pagamento de Serviço Extra',
          message: stripeUrl
            ? `O hotel pediu ${total.toFixed(2)}€ pelo serviço "${addOn.service_name}". Clica para pagar com cartão ou usa o teu saldo PawCão no painel.`
            : `O hotel pediu ${total.toFixed(2)}€ pelo serviço "${addOn.service_name}". Paga no teu painel (cartão ou saldo PawCão).`,
          type: 'payment',
          related_id: bookingId,
          link: stripeUrl || createPageUrl("ClientDashboard"),
          icon: '💳',
        });
      } catch (e) {
        console.error('Notify client error:', e);
      }
    }
    toast.success(stripeUrl
      ? `Stripe gerado + cliente notificado (${total.toFixed(2)}€)`
      : `Cliente notificado — pagamento via painel (${total.toFixed(2)}€)`);
  };

  const partners = hotelProfile?.hotel_details?.partner_walkers || [];
  const {
    capacityTotal, occupancyToday, occupancyPct, scheduledServices, revenue30d,
    pendingBookings, activeBookings, todayCheckins, todayCheckouts,
  } = useHotelCapacity(hotelProfile, bookings);

  // Hóspedes = apenas alojamento/creche ativos + pendentes (marcações pontuais não contam)
  const hospedeCount = bookings.filter(b =>
    ["boarding", "daycare"].includes(b.service_type) &&
    ["confirmed", "checked_in", "in_progress", "pending"].includes(b.status)
  ).length;

  if (!loadingProfile && !hotelProfile && user) {
    return <HotelOnboardingEmpty userName={user?.full_name} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-12 md:pt-0 pb-24 md:pb-8">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-12 md:top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to={createPageUrl("Home")} />
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            {pendingBookings.length > 0 && (
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs shrink-0">
                {pendingBookings.length} pendente{pendingBookings.length > 1 ? "s" : ""}
              </Badge>
            )}
            <div className="flex items-center gap-1.5 shrink-0">
              <CircleDot className={`w-3 h-3 ${hotelProfile?.is_active ? "text-emerald-500" : "text-slate-300"}`} />
              <span className="text-xs font-medium text-slate-600 hidden sm:inline">
                {hotelProfile?.is_active ? "Ativo" : "Inativo"}
              </span>
            </div>
            <Button size="sm" variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg gap-1.5 text-xs h-9 w-9 sm:w-auto p-0 sm:px-3"
              onClick={() => navigate(createPageUrl("ProfessionalHubV2"))}>
              <Settings className="w-4 h-4" /> <span className="hidden md:inline">Painel Pro</span>
            </Button>
          </div>
        </div>

      </header>

      {/* Navegação agrupada — pills por categoria (mobile-friendly, sem scroll horizontal de 13 items) */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-2.5 space-y-2.5">
          {TAB_GROUPS.map(group => (
            <div key={group.label} className="flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map(tab => {
                  const Icon = tab.icon;
                  const count = tab.key === "hospedes" ? hospedeCount : tab.key === "parceiros" ? partners.length : 0;
                  const active = activeTab === tab.key;
                  return (
                    <button key={tab.key} onClick={() => { setActiveTab(tab.key); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        active ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}>
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                      {count > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 pt-4 pb-28 md:pb-8 space-y-4">
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
            { label: "Serviços agendados", value: scheduledServices, sub: "grooming, passeio, treino", icon: Scissors, iconCls: "text-teal-500" },
            { label: "Pendentes", value: pendingBookings.length, sub: "a responder", icon: Clock, iconCls: "text-amber-500" },
            { label: "Chegadas hoje", value: todayCheckins.length, sub: "check-in", icon: ArrowRight, iconCls: "text-emerald-500" },
            ...(activeTab === "financas" ? [{ label: "Receita 30d", value: `${revenue30d.toFixed(0)}€`, sub: "estimada", icon: TrendingUp, iconCls: "text-blue-500" }] : []),
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

        {/* Tab Content */}
        <AnimatePresence mode="wait">

          {activeTab === "diario" && (
            <motion.div key="diario" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelBulkMessagePanel hotelProfile={hotelProfile} bookings={bookings} />
            </motion.div>
          )}

          {activeTab === "tarefas" && (
            <motion.div key="tarefas" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-3 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setShowAddService(true)}
                  className="w-full sm:w-auto h-10 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Serviço Extra / Produto
                </Button>
                {partners.length > 0 && (
                  <Button
                    onClick={() => setShowAssignTask(true)}
                    className="w-full sm:w-auto h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Atribuir Tarefa a Parceiro
                  </Button>
                )}
              </div>
              <HotelTasksPanel
                bookings={bookings}
                onUpdateBooking={handleUpdateBooking}
              />
            </motion.div>
          )}

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
                  onRefresh={() => queryClient.invalidateQueries({ queryKey: ["hotelBookings"] })}
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

          {activeTab === "prontuario" && (
            <motion.div key="prontuario" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelPetRecordsPanel hotelProfile={hotelProfile} />
            </motion.div>
          )}

          {activeTab === "espera" && (
            <motion.div key="espera" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelWaitlistPanel hotelProfile={hotelProfile} bookings={bookings} />
            </motion.div>
          )}

          {activeTab === "clientes" && (
            <motion.div key="clientes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelGuestProfilesPanel hotelProfile={hotelProfile} />
            </motion.div>
          )}

          {activeTab === "caninos" && (
            <motion.div key="caninos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HotelCaninoProfiles hotelProfile={hotelProfile} bookings={bookings} />
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
              {!loadingBookings && hotelProfile && (
                <HotelSalesInsights
                  bookings={bookings}
                  hotelProfile={hotelProfile}
                  onNewBooking={() => setShowAddService(true)}
                />
              )}
              <HotelFinancesPanel bookings={bookings} hotelProfile={hotelProfile} />
              <HotelAddOnSalesPanel bookings={bookings} />
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
                onUpdatePartnerTitle={updatePartnerTitle}
              />
            </motion.div>
          )}

          {activeTab === "loja" && (
            <motion.div key="loja" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PartnerStorePanel user={user} professionalProfile={hotelProfile} variant="light" />
            </motion.div>
          )}

          {activeTab === "mimos" && (
            <motion.div key="mimos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-4 h-4 text-teal-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Mimos por entregar</h3>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Mimos resgatados pelos clientes para os seus cães durante a estadia. Entrega e publica uma foto no diário.
                </p>
                <HotelMimoDeliveries hotelEmail={user?.email} />
              </div>
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
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Portfólio</p>
                <PortfolioSection professionalProfile={hotelProfile} hideCertifications />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowNewBooking(true)}
        className="fixed bottom-28 md:bottom-8 right-4 sm:right-5 z-30 w-14 h-14 bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-lg shadow-slate-900/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
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

      {showAssignTask && (
        <AssignTaskModal
          bookings={bookings}
          partners={partners}
          onAssign={handleAssignTask}
          onClose={() => setShowAssignTask(false)}
        />
      )}

      {showAddService && (
        <AddServiceToStayModal
          bookings={bookings}
          hotelProfile={hotelProfile}
          partners={partners}
          onConfirm={handleAddServiceToStay}
          onClose={() => setShowAddService(false)}
        />
      )}
    </div>
  );
}