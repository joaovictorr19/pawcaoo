import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { ProfessionalTabBar } from "../components/professional-hub/ProfessionalTabBar";
import { StatsSection } from "../components/professional-hub/StatsSection";
import { ServiceManager } from "../components/professional-hub/ServiceManager";
import { AgendaCalendar } from "../components/professional-hub/AgendaCalendar";
import { ActiveRequestsList } from "../components/professional-hub/ActiveRequestsList";
import { ToolsSection } from "../components/professional-hub/ToolsSection";
import { VerificationBanner } from "../components/professional-hub/VerificationBanner";

export default function ProfessionalHubV2() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // 1. Fonte Única de Dados
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000
  });

  // Fetch the related profile
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

  // 2. Mutação de Status (Ficar Online no PawGo)
  const toggleOnlineMutation = useMutation({
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
      toast.success(data.pawgo_status?.is_online ? "🚀 Online no PawGo!" : "😴 Offline");
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  const isOnline = user?.pawgo_status?.is_online || false;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32 font-sans selection:bg-orange-500/30">
      {/* 1. Header Fixo com Status Online */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl p-4 md:p-6 flex justify-between items-center border-b border-white/5">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tighter">Painel Pro</h2>
          <VerificationBanner status={professionalProfile?.verification_status} />
        </div>
        <div className="flex items-center gap-4">
           <button 
              onClick={() => toggleOnlineMutation.mutate(!isOnline)}
              className="flex flex-col items-end cursor-pointer active:scale-95 transition-transform"
            >
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Status</span>
              <span className={`text-xs font-black flex items-center gap-1.5 px-2 py-1 rounded-md ${isOnline ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} /> 
                {isOnline ? 'Online' : 'Offline'}
              </span>
           </button>
           <Button 
             onClick={() => navigate(createPageUrl('Notifications'))}
             variant="ghost"
             className="rounded-[1rem] bg-slate-900 border border-white/5 w-12 h-12 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
           >
              <Bell size={20} />
           </Button>
        </div>
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
              
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                   Pedidos PawGo Urgentes
                </h3>
                <ActiveRequestsList />
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
              <ServiceManager services={user?.professional_profile?.services || professionalProfile?.services_offered} />
            </motion.div>
          )}

          {activeTab === "calendar" && (
            <motion.div 
              key="cal" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <AgendaCalendar user={user} walkerProfile={professionalProfile} trainerProfile={professionalProfile} />
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
        </AnimatePresence>
      </main>

      <ProfessionalTabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}