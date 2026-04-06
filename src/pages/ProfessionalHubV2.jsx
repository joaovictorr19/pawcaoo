import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Loader2, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { ProfessionalTabBar } from "../components/professional-hub/ProfessionalTabBar";
import { AgendaCalendar } from "../components/professional-hub/AgendaCalendar";
import { StatsSection } from "../components/professional-hub/StatsSection";
import { ServiceManager } from "../components/professional-hub/ServiceManager";
import { ServiceEditor } from "../components/professional-hub/ServiceEditor";
import { ProfessionalEditProfile } from "@/components/professionals/ProfessionalEditProfile";
import IncomingRequestModal from "@/components/professional/IncomingRequestModal";
import { VerificationBanner } from "@/components/professional-hub/VerificationBanner";
import { RadarStatusPanel } from "@/components/professional-hub/RadarStatusPanel";
import { ToolsSection } from "@/components/professional-hub/ToolsSection";
import { WalletSection } from "@/components/professional-hub/WalletSection";

function ActiveRequestsList({ user }) {
  const { data: activeBookings = [] } = useQuery({
    queryKey: ['activeBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Booking.filter({
        walker_email: user.email,
        status: 'confirmed'
      }, '-created_date', 50);
    },
    enabled: !!user?.email,
    refetchInterval: 5000
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
      <h2 className="text-lg font-black text-orange-400 mb-6">Passeios Ativos</h2>
      {activeBookings.map((booking) => (
        <div
          key={booking.id}
          className="bg-slate-900 border border-orange-500/30 rounded-2xl p-4 cursor-pointer hover:border-orange-500/60 transition-colors"
          onClick={() => navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${booking.id}`))}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-white">{booking.owner_name}</h3>
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Confirmado</span>
          </div>
          <p className="text-sm text-slate-400 mb-3">🐕 {booking.dog_name} • {booking.duration_hours}h</p>
          <p className="text-xs text-slate-500">{new Date(booking.walk_date).toLocaleDateString('pt-PT')} às {booking.walk_time}</p>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${booking.id}`));
            }}
            className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold"
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
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') === 'agenda' ? 'calendar' : urlParams.get('tab') === 'active' ? 'active' : 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showProfileUpdateRequired, setShowProfileUpdateRequired] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'agenda') setActiveTab('calendar');
  }, []);
  const [incomingRequest, setIncomingRequest] = useState(null);

  // 1. Fonte Única de Dados
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
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
  
  useEffect(() => {
    if (profileNeedsUpdate && !showEditProfile) {
      setShowProfileUpdateRequired(true);
      setShowEditProfile(true);
    }
  }, [profileNeedsUpdate, showEditProfile]);

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
    refetchInterval: 5000,
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
    // Optimistic update: immediately show as confirmed
    setIncomingRequest(null);
    queryClient.setQueryData(['incomingRequests', user?.email], (old) => 
      old?.filter(r => r.id !== req.id) || []
    );
    
    try {
      await base44.entities.Booking.update(req.id, { status: 'confirmed' });
      queryClient.invalidateQueries(['incomingRequests']);
      toast.success("Passeio aceite! 🎉");
      navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${req.id}`));
    } catch (error) {
      // Rollback optimistic update
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

  // Redirect non-professionals to setup
  if (!user?.account_type || !['walker', 'trainer', 'both'].includes(user.account_type)) {
    navigate(createPageUrl('ProfessionalSetup'), { replace: true });
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  // Redirect if no professional profile exists
  if (!professionalProfile) {
    navigate(createPageUrl('ProfessionalSetup'), { replace: true });
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }


  const isOnline = user?.pawgo_status?.is_online || false;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32 font-sans selection:bg-orange-500/30">
      <IncomingRequestModal
        request={incomingRequest}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />
      {/* Modal de Edição de Perfil - Obrigatório se precisa update */}
      {showEditProfile && (
        <div className="fixed inset-0 z-[9999] bg-white text-slate-900 overflow-y-auto">
          <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between">
            <div>
              <h2 className="font-black text-lg">Editar Perfil Público</h2>
              {showProfileUpdateRequired && <p className="text-xs text-red-600 font-bold mt-1">⚠️ Atualização obrigatória</p>}
            </div>
            <button 
              onClick={() => !showProfileUpdateRequired && setShowEditProfile(false)}
              disabled={showProfileUpdateRequired}
              className={"p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 active:scale-95 transition-all" + (showProfileUpdateRequired ? " opacity-50 cursor-not-allowed" : "")}
            >
              <span className="font-bold text-sm">X</span>
            </button>
          </div>
          <div className="pt-6">
            <ProfessionalEditProfile 
              user={user} 
              onUpdate={() => {
                queryClient.invalidateQueries(['currentUser']);
                queryClient.invalidateQueries(['myProfessionalProfile']);
                setShowProfileUpdateRequired(false);
                if (showProfileUpdateRequired) {
                  setTimeout(() => setShowEditProfile(false), 500);
                }
              }} 
              onClose={() => !showProfileUpdateRequired && setShowEditProfile(false)}
              forceUpdate={showProfileUpdateRequired}
            />
          </div>
        </div>
      )}

      {/* 1. Header com saudação, status e stats rápidas */}
      <header className="bg-slate-950 text-white p-6 rounded-b-[2.5rem] shadow-xl mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-black italic">Olá, {user?.full_name?.split(' ')[0] || 'Pro'}! 🐾</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Painel Profissional</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleOnlineMutation.mutate(!isOnline)}
              className={`px-4 py-2 rounded-2xl border cursor-pointer active:scale-95 transition-transform ${
                isOnline ? 'border-green-500 text-green-400' : 'border-slate-700 text-slate-500'
              }`}
            >
              <span className="text-[10px] font-black uppercase flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </button>
            <Button
              onClick={() => navigate(createPageUrl('Notifications'))}
              variant="ghost"
              className="rounded-[1rem] bg-slate-900 border border-white/5 w-10 h-10 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Bell size={18} />
            </Button>
          </div>
        </div>
        <VerificationBanner status={professionalProfile?.verification_status} />
      </header>

      <main className="p-4 md:p-6 max-w-lg mx-auto">
        {/* Renderização Condicional por Abas */}
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div 
              key="ov" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <StatsSection user={user} professionalProfile={professionalProfile} />

              <div className="flex gap-2 mb-6">
                <Button
                  onClick={() => setShowEditProfile(true)}
                  className="flex-1 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-2xl h-12"
                >
                  Editar Perfil
                </Button>
                <Button
                  onClick={() => navigate(createPageUrl(`UserProfile?id=${user?.id}`))}
                  variant="outline"
                  className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white font-bold rounded-2xl h-12"
                >
                  Ver Perfil
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => base44.auth.logout()}
                  variant="outline"
                  className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white font-bold rounded-2xl h-12"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  className="flex-1 border-red-800/50 text-red-400 hover:bg-red-900/30 hover:text-red-300 font-bold rounded-2xl h-12"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar Conta
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                   Radar PawGo
                 </h3>
                <RadarStatusPanel userEmail={user?.email} isOnline={isOnline} city={professionalProfile?.location || user?.city || "Portugal"} />
              </div>
            </motion.div>
          )}

          {activeTab === "services" && (
            <motion.div 
              key="serv" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <ServiceEditor 
                professionalProfile={professionalProfile}
                isWalker={!!professionalProfile?.walker_name}
              />
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
            >
              <AgendaCalendar user={user} walkerProfile={professionalProfile} />
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
              <WalletSection user={user} />
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
          </AnimatePresence>
          </main>

      <ProfessionalTabBar active={activeTab} onChange={setActiveTab} />

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
          <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-red-500/30">
            <h3 className="text-xl font-bold text-red-500 mb-3">⚠️ Eliminar Conta</h3>
            <p className="text-slate-300 text-sm mb-6">
              Tem certeza que deseja eliminar sua conta? Esta ação é irreversível e todos os seus dados serão permanentemente apagados.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deletando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Deletar
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