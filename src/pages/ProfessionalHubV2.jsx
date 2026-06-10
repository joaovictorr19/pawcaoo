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

function ActiveRequestsList({ user }) {
  const { data: activeBookings = [] } = useQuery({
    queryKey: ['activeBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Booking.filter({
        $or: [
          { walker_email: user.email, status: 'pending' },
          { walker_email: user.email, status: 'confirmed' },
          { walker_email: user.email, status: 'in_progress' }
        ]
      }, '-created_date', 50);
    },
    enabled: !!user?.email,
    refetchInterval: user?.pawgo_status?.is_online ? 15000 : false
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
      {activeBookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-white border border-slate-100 rounded-2xl p-4 cursor-pointer hover:border-orange-200 hover:shadow-sm transition-all shadow-sm"
          onClick={() => navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${booking.id}`))}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-slate-900">{booking.owner_name}</h3>
            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-full border border-orange-100 font-medium">Confirmado</span>
          </div>
          <p className="text-sm text-slate-500 mb-3">🐕 {booking.dog_name} • {booking.duration_hours}h</p>
          <p className="text-xs text-slate-400">{new Date(booking.walk_date).toLocaleDateString('pt-PT')} às {booking.walk_time}</p>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${booking.id}`));
            }}
            className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold"
          >
            Iniciar Passeio
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function ProfessionalHubV2() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const initialTab = tabParam === 'agenda' ? 'calendar' : tabParam === 'active' ? 'active' : tabParam === 'documents' ? 'documents' : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
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
    if (params.get('tab') === 'agenda') setActiveTab('calendar');
  }, []);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
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
  const showRestrictedPendingScreen = !isHotelProfile && verificationStatus !== 'verified' && !['documents', 'portfolio'].includes(activeTab);

  if (showRestrictedPendingScreen) {
    return <PendingApproval profile={professionalProfile} activeTab={activeTab} onChangeTab={setActiveTab} />;
  }

  const isOnline = user?.pawgo_status?.is_online || false;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" style={{ paddingBottom: 'calc(130px + env(safe-area-inset-bottom, 0px))', WebkitOverflowScrolling: 'touch', overflowY: 'auto' }}>
      <IncomingRequestModal
        request={incomingRequest}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />
      {/* 1. Header com saudação, status e stats rápidas */}
      <header className="bg-white border-b border-slate-100 px-4 pt-20 pb-6 mb-6 shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{isHotelProfile ? 'Painel Hotel Canino' : 'Painel Profissional'}</p>
            <h1 className="text-xl font-bold text-slate-900">Olá, {user?.full_name?.split(' ')[0] || 'Pro'} {isHotelProfile ? '🏨' : '🐾'}</h1>
          </motion.div>
          <motion.div className="flex items-center gap-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <button
              onClick={() => toggleOnlineMutation.mutate(!isOnline)}
              className={`px-3 py-1.5 rounded-full border cursor-pointer active:scale-95 transition-all font-semibold text-xs ${
                isOnline
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                  : 'border-slate-200 text-slate-500 bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </button>
            <button
              onClick={() => navigate(createPageUrl('Notifications'))}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
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
              className="space-y-8"
            >
              <StatsSection user={user} professionalProfile={professionalProfile} />

              <div className="flex gap-2 mb-4">
                <Button
                  onClick={() => setActiveTab('portfolio')}
                  className="flex-1 bg-slate-900 text-white hover:bg-slate-800 font-semibold rounded-2xl h-11"
                >
                  Portfólio
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl(`UserProfile?id=${user?.id}`))}
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-2xl h-11"
                >
                  Ver Perfil
                </Button>
              </div>

              <div className="flex gap-2 mb-6">
                <Button
                  onClick={() => base44.auth.logout()}
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-2xl h-11"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-500 hover:bg-red-50 font-semibold rounded-2xl h-11"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>


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
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-100">
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