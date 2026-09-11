import React, { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Loader2, Trash2, PawPrint, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { ProfessionalTabBar } from "../components/professional-hub/ProfessionalTabBar";
const AgendaCalendar = React.lazy(() => import("../components/professional-hub/AgendaCalendar").then(m => ({ default: m.AgendaCalendar })));
import IncomingRequestModal from "@/components/professional/IncomingRequestModal";
import { VerificationBanner } from "@/components/professional-hub/VerificationBanner";
const ToolsSection = React.lazy(() => import("@/components/professional-hub/ToolsSection").then(m => ({ default: m.ToolsSection })));
const WalletSection = React.lazy(() => import("@/components/professional-hub/WalletSection").then(m => ({ default: m.WalletSection })));
const FinancesSection = React.lazy(() => import("@/components/professional-hub/FinancesSection").then(m => ({ default: m.FinancesSection })));
const ServiceOfferingsEditor = React.lazy(() => import("@/components/professional-hub/ServiceOfferingsEditor"));
const HotelServiceManager = React.lazy(() => import("@/components/hotel/HotelServiceManager"));
const ReviewsManagementSection = React.lazy(() => import("@/components/professional-hub/ReviewsManagementSection"));
const PortfolioSection = React.lazy(() => import("@/components/professional-hub/PortfolioSection"));
const DocumentsVerificationSection = React.lazy(() => import("@/components/professional-hub/DocumentsVerificationSection"));
const WalkDiaryPanel = React.lazy(() => import("@/components/professional-hub/WalkDiaryPanel"));
const ProClientsPanel = React.lazy(() => import("@/components/professional-hub/ProClientsPanel"));
const ProBookingsPanel = React.lazy(() => import("@/components/professional-hub/ProBookingsPanel"));
const ProAlertsPanel = React.lazy(() => import("@/components/professional-hub/ProAlertsPanel"));
import PendingApproval from "@/components/professional-hub/PendingApproval";
// ProfessionalProfileForm replaced by centralized WalkerOnboarding redirect
const HotelManagementPanel = React.lazy(() => import("@/components/professional-hub/HotelManagementPanel"));
const PendingRequestsList = React.lazy(() => import("@/components/professional-hub/PendingRequestsList"));
const PartnerStorePanel = React.lazy(() => import("@/components/shop/PartnerStorePanel"));
import ProOverview from "@/components/professional-hub/ProOverview";
import ProfessionalSettings from "@/components/professional-hub/ProfessionalSettings";
import BackButton from "@/components/ui/BackButton";

const sizeLabels = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };

function ActiveRequestsList({ user }) {
  const { data: activeBookings = [] } = useQuery({
    queryKey: ['activeBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Booking.filter({
        $or: [
          { walker_email: user.email, status: 'confirmed' },
          { walker_email: user.email, status: 'in_progress' }
        ]
      }, '-created_date', 50);
    },
    enabled: !!user?.email,
    refetchInterval: 15000
  });

  const navigate = useNavigate();

  if (activeBookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-sm">Nenhum passeio ativo no momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-700 mb-4">Passeios Ativos</h2>
      {activeBookings.map((booking) => {
        const dogs = booking.dogs?.length > 0
          ? booking.dogs
          : [{ dog_name: booking.dog_name, dog_breed: booking.dog_breed, dog_size: booking.dog_size, photo_url: null }];
        const walkDate = booking.walk_date || booking.session_date;
        const walkTime = booking.walk_time || booking.session_time;
        const isInProgress = booking.status === 'in_progress';

        return (
          <div
            key={booking.id}
            className="bg-white border border-slate-100 rounded-2xl p-4 cursor-pointer hover:border-orange-200 hover:shadow-sm transition-all shadow-sm"
            onClick={() => navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${booking.id}`))}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-900">{booking.owner_name}</h3>
                {booking.owner_phone && (
                  <a href={`tel:${booking.owner_phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-slate-400 hover:text-orange-500">
                    {booking.owner_phone}
                  </a>
                )}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                isInProgress
                  ? 'bg-green-50 text-green-600 border-green-100'
                  : 'bg-orange-50 text-orange-600 border-orange-100'
              }`}>
                {isInProgress ? 'Em andamento' : 'Confirmado'}
              </span>
            </div>

            {/* Dogs */}
            <div className="space-y-1.5 mb-3">
              {dogs.map((dog, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                  {dog.photo_url ? (
                    <img src={dog.photo_url} alt={dog.dog_name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-base">🐕</span>
                  )}
                  <span className="font-medium">{dog.dog_name || "Cão"}</span>
                  {dog.dog_breed && <span className="text-slate-400">• {dog.dog_breed}</span>}
                  {dog.dog_size && <span className="text-slate-400">• {sizeLabels[dog.dog_size] || dog.dog_size}</span>}
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mb-3">
              {walkDate && (
                <span>{new Date(walkDate).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short' })}{walkTime ? ` às ${walkTime}` : ''}</span>
              )}
              <span>{booking.duration_hours || 1}h</span>
              {booking.pickup_address && (
                <span className="truncate max-w-[200px]">📍 {booking.pickup_address}</span>
              )}
            </div>

            {booking.special_notes && (
              <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded mb-3 border border-amber-200">
                {booking.special_notes}
              </p>
            )}

            <Button
              onClick={(e) => {
                e.stopPropagation();
                navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${booking.id}`));
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold"
            >
              {isInProgress ? 'Ver passeio em andamento' : 'Iniciar Passeio'}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export default function ProfessionalHubV2() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const validTabs = ['overview', 'calendar', 'requests', 'active', 'documents', 'wallet', 'services', 'portfolio', 'reviews', 'finances', 'profile', 'tools', 'store', 'diary', 'clients', 'bookings', 'alerts'];
  const mapTab = (t) => {
    if (t === 'agenda') return 'calendar';
    if (!t) return 'overview';
    return validTabs.includes(t) ? t : 'overview';
  };
  const [activeTab, setActiveTab] = useState(mapTab(tabParam));
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProfileUpdateRequired, setShowProfileUpdateRequired] = useState(false);

  const scrollToTop = () => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const root = document.getElementById('root');
    if (root) root.scrollTop = 0;
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('tab');
    setActiveTab(mapTab(t));
  }, [location.search]);

  useEffect(() => {
    scrollToTop();
    const rafId = window.requestAnimationFrame(scrollToTop);
    const timeoutId = window.setTimeout(scrollToTop, 250);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [location.key, location.pathname, location.search, activeTab]);
  const [incomingRequest, setIncomingRequest] = useState(null);

  // 1. Fonte Única de Dados
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Fetch the related profile
  // O Hook useRealTimeRequests foi movido para dentro do ActiveRequestsList

  const { data: professionalProfile } = useQuery({
    queryKey: ['myProfessionalProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      let profiles = await base44.entities.WalkerProfile.filter({ user_id: user.id }, '-created_date');
      // Contas com perfil profissional E hotel/loja: usar o perfil profissional no hub
      // (o hotel tem o seu próprio dashboard — HotelDashboard)
      const professionalOnly = profiles.filter(p => !['hotel', 'shop'].includes(p.professional_type));
      if (professionalOnly.length > 0) return professionalOnly[0];
      if (profiles.length === 0) {
        profiles = await base44.entities.TrainerProfile.filter({ user_id: user.id }, '-created_date');
      }
      return profiles[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Check if profile needs update to new format (missing lat/lng or service_areas)
  const profileNeedsUpdate = professionalProfile && (!professionalProfile?.latitude || !professionalProfile?.longitude || !professionalProfile?.service_areas?.length);

  // Polling: detectar pedidos pendentes direcionados a este profissional (estilo Uber)
  const isOnlinePro = user?.pawgo_status?.is_online || false;
  const BOOKING_TIMEOUT_MINUTES = 10; // Pedidos expiram após 10 minutos

  useQuery({
    queryKey: ['incomingRequests', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const allPending = await base44.entities.Booking.filter({
        walker_email: user.email,
        status: 'pending'
      }, '-created_date', 100);

      const now = new Date();
      const expiredBookings = [];
      const validBookings = [];

      // Separar pedidos válidos dos expirados
      for (const booking of allPending) {
        const createdTime = new Date(booking.created_date);
        const ageMinutes = (now - createdTime) / (1000 * 60);
        
        if (ageMinutes > BOOKING_TIMEOUT_MINUTES) {
          expiredBookings.push(booking);
        } else {
          validBookings.push(booking);
        }
      }

      // Marcar pedidos expirados como rejeitados
      for (const booking of expiredBookings) {
        try {
          await base44.entities.Booking.update(booking.id, { 
            status: 'rejected',
            forced_finish_reason: 'Auto-rejected due to timeout'
          });
        } catch (error) {
          console.error('Error rejecting expired booking:', error);
        }
      }

      const latest = validBookings[0] || null;
      // Only show if not already showing this request and it's valid
      if (latest && (!incomingRequest || incomingRequest.id !== latest.id)) {
        setIncomingRequest(latest);
      }
      // Clear incoming request if it's expired
      if (incomingRequest && expiredBookings.some(b => b.id === incomingRequest.id)) {
        setIncomingRequest(null);
      }

      return validBookings;
    },
    enabled: !!user?.email && isOnlinePro,
    refetchInterval: isOnlinePro ? 15000 : false,
    refetchOnWindowFocus: false,
  });

  // 2. Mutação de Status (Ficar Online no PawGo) - Com Optimistic Update
  const toggleOnlineMutation = useMutation({
    onMutate: async (checked) => {
      // Optimistic update: immediately update local state
      queryClient.setQueryData(['currentUser'], (old) => ({
        ...old,
        pawgo_status: {
          ...old?.pawgo_status,
          is_online: checked,
          last_active: new Date().toISOString()
        }
      }));
    },
    mutationFn: async (checked) => {
      const updatedUser = await base44.auth.updateMe({
        pawgo_status: {
          ...user.pawgo_status,
          is_online: checked,
          last_active: new Date().toISOString()
        }
      });

      if (professionalProfile) {
        const entity = professionalProfile.walker_name ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
        await entity.update(professionalProfile.id, { is_online: checked });
      }

      return updatedUser;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data);
      queryClient.invalidateQueries(['myProfessionalProfile']);
      queryClient.invalidateQueries(['allWalkers']);
      queryClient.invalidateQueries(['allTrainers']);
      toast.success(data.pawgo_status?.is_online ? "🚀 Online no PawGo!" : "😴 Offline");
    },
    onError: () => {
      // Rollback optimistic update on error
      queryClient.invalidateQueries(['currentUser']);
      toast.error("Erro ao atualizar status");
    }
  });

  const handleAcceptRequest = async (req) => {
    setIncomingRequest(null);
    queryClient.setQueryData(['incomingRequests', user?.email], (old) => 
      old?.filter(r => r.id !== req.id) || []
    );
    
    try {
      const professionalPhone = professionalProfile?.whatsapp_number || professionalProfile?.phone || user?.phone || '';
      await base44.entities.Booking.update(req.id, {
        status: 'confirmed',
        walker_payment_contact: professionalPhone,
      });

      const ownerEmail = req.owner_email || req.created_by;
      const ownerPhone = req.owner_phone || '';
      const professionalEmail = req.walker_email || user?.email;
      const professionalName = req.walker_name || professionalProfile?.walker_name || user?.full_name || 'Profissional';
      const dateStr = req.walk_date ? new Date(req.walk_date).toLocaleDateString('pt-PT') : '';
      const timeStr = req.walk_time || '';
      const locationStr = req.pickup_address || req.pickup_location || req.location || '';

      if (ownerEmail) {
        await base44.integrations.Core.SendEmail({
          from_name: 'PawCão',
          to: ownerEmail,
          subject: 'Reserva aceite — contactos disponíveis | PawCão',
          body: [
            'Olá,',
            'A sua reserva foi aceite pelo profissional.',
            '',
            'Estado da reserva: ACEITE',
            '',
            'Resumo',
            `- Profissional: ${professionalName}`,
            dateStr || timeStr ? `- Data e hora: ${[dateStr, timeStr].filter(Boolean).join(' às ')}` : null,
            locationStr ? `- Local de recolha/encontro: ${locationStr}` : null,
            '',
            'Contacto do profissional',
            professionalPhone ? `- WhatsApp / telefone: ${professionalPhone}` : null,
            professionalEmail ? `- Email: ${professionalEmail}` : null,
            '',
            'Obrigado,',
            'Equipa PawCão'
          ].filter(Boolean).join('\n')
        });
      }

      if (professionalEmail) {
        await base44.integrations.Core.SendEmail({
          from_name: 'PawCão',
          to: professionalEmail,
          subject: 'Reserva aceite com sucesso — contactos do cliente | PawCão',
          body: [
            'Olá,',
            'Confirmamos que aceitou esta reserva com sucesso.',
            '',
            'Estado da reserva: ACEITE',
            '',
            'Resumo',
            `- Cliente: ${req.owner_name || 'Cliente'}`,
            `- Animal: ${req.dog_name || 'Pet'}`,
            dateStr || timeStr ? `- Data e hora: ${[dateStr, timeStr].filter(Boolean).join(' às ')}` : null,
            locationStr ? `- Local de recolha/encontro: ${locationStr}` : null,
            '',
            'Contacto do cliente',
            ownerPhone ? `- WhatsApp / telefone: ${ownerPhone}` : null,
            ownerEmail ? `- Email: ${ownerEmail}` : null,
            '',
            'Obrigado,',
            'Equipa PawCão'
          ].filter(Boolean).join('\n')
        });
      }

      queryClient.invalidateQueries(['incomingRequests']);
      queryClient.invalidateQueries(['walkerWalks']);
      queryClient.invalidateQueries(['myWalks']);
      toast.success("Passeio aceite! 🎉");
      navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${req.id}`));
    } catch (error) {
      queryClient.invalidateQueries(['incomingRequests']);
      toast.error("Erro ao aceitar. Tenta novamente.");
    }
  };

  const handleDeclineRequest = async (req) => {
    // Optimistic update: immediately remove from list
    setIncomingRequest(null);
    queryClient.setQueryData(['incomingRequests', user?.email], (old) => 
      old?.filter(r => r.id !== req.id) || []
    );
    
    try {
      await base44.entities.Booking.update(req.id, { status: 'rejected' });
      queryClient.invalidateQueries(['incomingRequests']);
      toast.info("Passeio recusado");
    } catch (error) {
      // Rollback optimistic update
      queryClient.invalidateQueries(['incomingRequests']);
      toast.error("Erro ao recusar.");
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const result = await base44.functions.invoke('deleteUserAccount', {});
      if (result.data?.success) {
        toast.success('Conta eliminada com sucesso');
        base44.auth.logout();
      } else {
        toast.error(result.data?.message || 'Erro ao eliminar conta');
      }
    } catch (error) {
      toast.error('Erro ao eliminar conta');
      console.error('Delete account error:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const isHotelProfile = professionalProfile?.professional_type === 'hotel';

  // Se o perfil profissional já existe (por user_id), o painel abre —
  // não exigir user.account_type (nem sempre preenchido no onboarding).
  const needsSetup = !professionalProfile;

  if (needsSetup) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-slate-900">Configura o teu perfil</h2>
          <p className="text-slate-500 text-sm mb-6">Completa o teu perfil profissional no editor centralizado para começar a receber pedidos.</p>
          <Button
            onClick={() => navigate("/WalkerOnboarding")}
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-semibold px-6 h-11"
          >
            Criar Perfil Profissional
          </Button>
        </div>
      </div>
    );
  }

  // Hotéis têm painel próprio — sem pending approval screen
  const verificationStatus = professionalProfile?.verification_status;
  const showRestrictedPendingScreen = !isHotelProfile && verificationStatus !== 'verified' && !['documents', 'portfolio', 'requests', 'bookings', 'clients', 'diary', 'alerts', 'profile'].includes(activeTab);

  if (showRestrictedPendingScreen) {
    return <PendingApproval profile={professionalProfile} activeTab={activeTab} onChangeTab={setActiveTab} />;
  }

  const isOnline = user?.pawgo_status?.is_online || false;

  const isTrainer = !!professionalProfile?.trainer_name;
  const proName = professionalProfile?.walker_name || professionalProfile?.trainer_name || user?.full_name || 'Profissional';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pt-12 md:pt-0 pb-24 md:pb-8">
      <IncomingRequestModal
        request={incomingRequest}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />
      {/* Header sticky branco — alinhado ao padrão do HotelDashboard */}
      <header className="bg-white border-b border-slate-200 sticky top-12 md:top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to={createPageUrl("Home")} />
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
              {isTrainer ? <GraduationCap className="w-5 h-5 text-white" /> : <PawPrint className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-tight truncate max-w-[180px]">
                {proName}
              </h1>
              <p className="text-slate-400 text-xs truncate max-w-[180px]">{professionalProfile?.location || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {incomingRequest && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-2 py-1 rounded-md shrink-0">
                1 pendente
              </span>
            )}
            <button
              onClick={() => toggleOnlineMutation.mutate(!isOnline)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer active:scale-95 shrink-0 ${
                isOnline
                  ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                  : 'border-slate-200 text-slate-500 bg-white'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
            </button>
            <button
              onClick={() => navigate(createPageUrl('Notifications'))}
              className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shrink-0"
            >
              <Bell size={16} />
            </button>
          </div>
        </div>
      </header>

      <ProfessionalTabBar active={activeTab} pendingCount={incomingRequest ? 1 : 0} onChange={(tab) => {
        setActiveTab(tab);
        scrollToTop();
      }} />

      <main className="px-4 md:px-6 pt-4 pb-6 max-w-5xl mx-auto w-full space-y-4">
        <VerificationBanner status={professionalProfile?.verification_status} />
        {/* Renderização Condicional por Abas */}
        <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>}>
        <AnimatePresence mode="wait">
          {/* ── Painel Hotel ─────────────────────────────────── */}
          {isHotelProfile && activeTab === "overview" && (
            <motion.div key="hotel-ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <HotelManagementPanel user={user} hotelProfile={professionalProfile} />
            </motion.div>
          )}

          {!isHotelProfile && activeTab === "overview" && (
            <motion.div
              key="ov"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <ProOverview
                user={user}
                professionalProfile={professionalProfile}
                onLogout={() => {
                  if (confirm('Tem certeza que deseja sair?')) base44.auth.logout();
                }}
                onDeleteAccount={() => setShowDeleteConfirm(true)}
              />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {!isHotelProfile && (
                <ProfessionalSettings professionalProfile={professionalProfile} user={user} />
              )}
              {isHotelProfile && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
                  <h2 className="text-lg font-bold text-slate-900 mb-1">Configurações do Hotel</h2>
                  <p className="text-slate-500 text-sm mb-4">Gerido no separador de Configurações do painel do hotel.</p>
                  <Button
                    onClick={() => navigate(createPageUrl("HotelDashboard"))}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-semibold px-6 h-11"
                  >
                    Ir para Painel do Hotel
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "services" && (
            <motion.div 
              key="serv" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {isHotelProfile ? (
                <Suspense fallback={<Loader2 className="w-6 h-6 text-orange-500 animate-spin mx-auto" />}>
                  <HotelServiceManager hotelProfile={professionalProfile} />
                </Suspense>
              ) : (
                <ServiceOfferingsEditor professionalProfile={professionalProfile} />
              )}
            </motion.div>
          )}

          {activeTab === "tools" && (
            <motion.div 
              key="tools" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ToolsSection user={user} professionalProfile={professionalProfile} />
            </motion.div>
          )}

          {activeTab === "calendar" && (
            <motion.div 
              key="cal" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <AgendaCalendar user={user} walkerProfile={professionalProfile} />
            </motion.div>
          )}

          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <PendingRequestsList user={user} professionalProfile={professionalProfile} />
            </motion.div>
          )}

          {activeTab === "active" && (
            <motion.div 
              key="active" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ActiveRequestsList user={user} />
            </motion.div>
          )}

          {activeTab === "wallet" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <WalletSection user={user} professionalProfile={professionalProfile} />
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <motion.div
              key="reviews"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ReviewsManagementSection user={user} professionalProfile={professionalProfile} />
            </motion.div>
          )}

          {activeTab === "diary" && (
            <motion.div
              key="diary"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <WalkDiaryPanel user={user} professionalProfile={professionalProfile} />
            </motion.div>
          )}

          {activeTab === "clients" && (
            <motion.div
              key="clients"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ProClientsPanel user={user} professionalProfile={professionalProfile} />
            </motion.div>
          )}

          {activeTab === "bookings" && (
            <motion.div
              key="bookings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ProBookingsPanel user={user} />
            </motion.div>
          )}

          {activeTab === "alerts" && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ProAlertsPanel user={user} />
            </motion.div>
          )}

          {activeTab === "portfolio" && (
            <motion.div
              key="portfolio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <PortfolioSection professionalProfile={professionalProfile} />
            </motion.div>
          )}

          {activeTab === "store" && (
            <motion.div
              key="store"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <PartnerStorePanel user={user} professionalProfile={professionalProfile} variant="light" />
            </motion.div>
          )}

          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <DocumentsVerificationSection professionalProfile={professionalProfile} user={user} />
            </motion.div>
          )}

          {activeTab === "finances" && (
            <motion.div
              key="finances"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <FinancesSection user={user} professionalProfile={professionalProfile} />
            </motion.div>
          )}
        </AnimatePresence>
        </Suspense>
      </main>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">⚠️ Eliminar Conta</h3>
            <p className="text-slate-500 text-sm mb-6">
              Tem certeza que deseja eliminar sua conta? Esta ação é irreversível e todos os seus dados serão permanentemente apagados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    A eliminar...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}