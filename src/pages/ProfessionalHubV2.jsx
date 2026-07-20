import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Loader2, Trash2, LogOut, Star, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { ProfessionalTabBar } from "../components/professional-hub/ProfessionalTabBar";
import { AgendaCalendar } from "../components/professional-hub/AgendaCalendar";
import { StatsSection } from "../components/professional-hub/StatsSection";
import { ServiceManager } from "../components/professional-hub/ServiceManager";
import { ServiceEditor } from "../components/professional-hub/ServiceEditor";
import { ProfessionalEditProfile } from "@/components/professionals/ProfessionalEditProfile";
import IncomingRequestModal from "@/components/professional/IncomingRequestModal";
import { VerificationBanner } from "@/components/professional-hub/VerificationBanner";
import { ToolsSection } from "@/components/professional-hub/ToolsSection";
import { WalletSection } from "@/components/professional-hub/WalletSection";
import { FinancesSection } from "@/components/professional-hub/FinancesSection";
import { DayOffManager } from "@/components/professional-hub/DayOffManager";
import ServiceOfferingsEditor from "@/components/professional-hub/ServiceOfferingsEditor";
import ReviewsManagementSection from "@/components/professional-hub/ReviewsManagementSection";
import PortfolioSection from "@/components/professional-hub/PortfolioSection";
import DocumentsVerificationSection from "@/components/professional-hub/DocumentsVerificationSection";
import PendingApproval from "@/components/professional-hub/PendingApproval";
import ProfessionalProfileForm from "@/components/professional-hub/ProfessionalProfileForm";
import HotelManagementPanel from "@/components/professional-hub/HotelManagementPanel";
import PendingRequestsList from "@/components/professional-hub/PendingRequestsList";
import ProOverview from "@/components/professional-hub/ProOverview";
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
  const validTabs = ['overview', 'calendar', 'requests', 'active', 'documents', 'wallet', 'services', 'portfolio', 'reviews', 'finances', 'profile', 'tools'];
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
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    refetchInterval: false,
  });

  // Fetch the related profile
  // O Hook useRealTimeRequests foi movido para dentro do ActiveRequestsList

  const { data: professionalProfile } = useQuery({
    queryKey: ['myProfessionalProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      let profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email }, '-created_date');
      if (profiles.length === 0) {
        profiles = await base44.entities.TrainerProfile.filter({ created_by: user.email }, '-created_date');
      }
      return profiles[0] || null;
    },
    enabled: !!user?.email
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const isHotelProfile = professionalProfile?.professional_type === 'hotel';

  // Show inline form for new professionals or those without a profile
  const needsSetup = !professionalProfile || (!isHotelProfile && !user?.account_type);

  if (needsSetup) {
    return (
      <ProfessionalProfileForm
        user={user}
        professionalProfile={null}
        onDone={() => {
          queryClient.invalidateQueries(['currentUser']);
          queryClient.invalidateQueries(['myProfessionalProfile']);
        }}
      />
    );
  }

  // Hotéis têm painel próprio — sem pending approval screen
  const verificationStatus = professionalProfile?.verification_status;
  const showRestrictedPendingScreen = !isHotelProfile && verificationStatus !== 'verified' && !['documents', 'portfolio', 'requests'].includes(activeTab);

  if (showRestrictedPendingScreen) {
    return <PendingApproval profile={professionalProfile} activeTab={activeTab} onChangeTab={setActiveTab} />;
  }

  const isOnline = user?.pawgo_status?.is_online || false;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans" style={{ paddingBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))', WebkitOverflowScrolling: 'touch', overflowY: 'auto' }}>
      <IncomingRequestModal
        request={incomingRequest}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />
      {/* 1. Header com saudação, status e stats rápidas */}
      <header className="px-4 pt-6 md:pt-20 pb-5">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
          <BackButton className="bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white" />
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{isHotelProfile ? 'Painel Hotel Canino' : 'Painel Profissional'}</p>
            <h1 className="text-lg font-black text-white">Olá, {user?.full_name?.split(' ')[0] || 'Pro'} {isHotelProfile ? '🏨' : '🐾'}</h1>
          </motion.div>
          </div>
          <motion.div className="flex items-center gap-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <button
              onClick={() => toggleOnlineMutation.mutate(!isOnline)}
              className={`px-3 py-1.5 rounded-full border cursor-pointer active:scale-95 transition-all font-semibold text-xs ${
                isOnline
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                  : 'border-white/10 text-slate-500 bg-slate-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </button>
            <button
              onClick={() => navigate(createPageUrl('Notifications'))}
              className="w-9 h-9 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors"
            >
              <Bell size={16} />
            </button>
          </motion.div>
        </div>
        <div className="max-w-3xl mx-auto mt-3">
          <VerificationBanner status={professionalProfile?.verification_status} />
        </div>
      </header>

      <main className="px-4 md:px-6 pb-6 max-w-3xl mx-auto w-full">
        {/* Renderização Condicional por Abas */}
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
            >
              <ProfessionalProfileForm
                user={user}
                professionalProfile={professionalProfile}
                onDone={() => {
                  queryClient.invalidateQueries(['currentUser']);
                  queryClient.invalidateQueries(['myProfessionalProfile']);
                  setActiveTab('overview');
                }}
              />
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
              <ServiceOfferingsEditor professionalProfile={professionalProfile} />
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
              <DayOffManager userEmail={user?.email} />
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

          {verificationStatus !== 'verified' && activeTab === 'portfolio' && (
            <motion.div
              key="portfolio-pending"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <PortfolioSection professionalProfile={professionalProfile} />
            </motion.div>
          )}

          {verificationStatus !== 'verified' && activeTab === 'documents' && (
            <motion.div
              key="documents-pending"
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
      </main>

      <ProfessionalTabBar active={activeTab} onChange={(tab) => {
        setActiveTab(tab);
        scrollToTop();
      }} />

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-2">⚠️ Eliminar Conta</h3>
            <p className="text-slate-400 text-sm mb-6">
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