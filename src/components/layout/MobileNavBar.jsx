import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Calendar, User, Zap, LayoutDashboard, Globe, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function MobileNavBar({ user, unreadCount = 0, onNotificationsClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isProf = user?.preferences?.current_mode === "professional";
  const isOnline = user?.pawgo_status?.is_online;

  const isActive = (path) => {
    if (path === createPageUrl("Home") && location.pathname === path) return true;
    if (path !== createPageUrl("Home") && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleCenterButtonClick = async () => {
    if (isProf) {
      // 1. Atualiza apenas o estado na base de dados, sem redirecionar
      const newStatus = !isOnline;
      try {
        await base44.auth.updateMe({
          pawgo_status: {
            ...user.pawgo_status,
            is_online: newStatus,
            last_active: new Date().toISOString()
          }
        });
        queryClient.invalidateQueries(['currentUser']);
        queryClient.invalidateQueries(['myProfessionalProfile']);
        queryClient.invalidateQueries(['allWalkers']);
      } catch (error) {
        console.error("Erro ao atualizar status:", error);
      }
    } else {
      if (location.pathname !== createPageUrl("Dashboard")) {
          navigate(createPageUrl("Dashboard"), { state: { triggerTransition: true, toProfessional: !isProf } });
      } else {
          window.dispatchEvent(new CustomEvent('triggerModeSwitch', { detail: { toProfessional: !isProf } }));
      }
    }
  };

  if (!user) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] px-6 pb-8 pt-4 bg-white/80 backdrop-blur-2xl border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* ABA 1: MAPA / DASHBOARD */}
        <button 
          onClick={() => navigate(createPageUrl("Home"))}
          className={`flex flex-col items-center gap-1 transition-all ${isActive(createPageUrl("Home")) ? "text-orange-500 scale-110" : "text-slate-400"}`}
        >
          {isProf ? <LayoutDashboard size={24} /> : <Map size={24} />}
          <span className="text-[10px] font-black uppercase tracking-tighter">
            {isProf ? "Painel" : "Explorar"}
          </span>
        </button>

        {/* ABA 2: AGENDA / RESERVAS */}
        <button 
          onClick={() => navigate(createPageUrl("MyBookings"))}
          className={`flex flex-col items-center gap-1 transition-all ${isActive(createPageUrl("MyBookings")) ? "text-orange-500 scale-110" : "text-slate-400"}`}
        >
          <Calendar size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Agenda</span>
        </button>

        {/* BOTÃO CENTRAL: O GATILHO DE MODO (O "UAU" DO APP) */}
        <div className="relative -top-8 flex flex-col items-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCenterButtonClick}
            className={`w-16 h-16 rounded-3xl shadow-2xl flex items-center justify-center transition-all border-4 border-white
              ${isProf 
                ? (isOnline ? "bg-slate-900" : "bg-slate-500") 
                : "bg-orange-500"}
            `}
          >
            {isProf ? (
              <Globe className={`text-white w-8 h-8 ${isOnline ? "animate-spin-slow" : "opacity-50"}`} />
            ) : (
              <Zap className="text-white w-8 h-8 fill-current" />
            )}
          </motion.button>
          <div className="absolute -bottom-6 whitespace-nowrap">
             <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full shadow-sm">
                {isProf ? (isOnline ? "Radar On" : "Radar Off") : "Pedir PawGo"}
             </span>
          </div>
        </div>



        {/* ABA 4: PERFIL / DEFINIÇÕES */}
        <button 
          onClick={() => navigate(user?.username ? createPageUrl(`UserProfile?username=${user.username}`) : createPageUrl(`UserProfile?id=${user?.id}`))}
          className={`flex flex-col items-center gap-1 transition-all ${isActive(createPageUrl("UserProfile")) ? "text-orange-500 scale-110" : "text-slate-400"}`}
        >
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Perfil</span>
        </button>

      </div>
    </div>
  );
}