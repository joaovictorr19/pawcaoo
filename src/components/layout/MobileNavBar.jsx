import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Calendar, User, Zap, LayoutDashboard, Globe, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function MobileNavBar({ user, unreadCount = 0, onNotificationsClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isProf = user?.preferences?.current_mode === "professional";
  const isTutor = user?.preferences?.current_mode === "tutor";
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 w-full h-24 px-3 py-3 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-15px_50px_rgba(0,0,0,0.08)] pointer-events-auto" style={{ pointerEvents: 'auto' }}>
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 sm:gap-4">
        
        {/* ABA 1: EXPLORAR / PAINEL PROFISSIONAL / CLIENTE */}
        <button 
          onClick={() => {
            if (isProf) {
              navigate(createPageUrl("ProfessionalHubV2"));
            } else if (isTutor) {
              navigate(createPageUrl("ClientDashboard"));
            } else {
              navigate(createPageUrl("Home"));
            }
          }}
          className={`flex flex-col items-center gap-0.5 transition-all flex-1 py-2 rounded-xl ${
            (isProf && isActive(createPageUrl("ProfessionalHubV2"))) ||
            (isTutor && isActive(createPageUrl("ClientDashboard"))) ||
            (!isProf && !isTutor && isActive(createPageUrl("Home")))
              ? "text-orange-500 bg-orange-50" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          {isProf ? <LayoutDashboard size={20} /> : isTutor ? <LayoutDashboard size={20} /> : <Map size={20} />}
          <span className="text-[9px] font-bold uppercase tracking-tight">
            {isProf ? "Painel" : isTutor ? "Cliente" : "Explorar"}
          </span>
        </button>

        {/* ABA 2: AGENDA / RESERVAS */}
        <button 
          onClick={() => navigate(createPageUrl("MyBookings"))}
          className={`flex flex-col items-center gap-0.5 transition-all flex-1 py-2 rounded-xl ${isActive(createPageUrl("MyBookings")) ? "text-orange-500 bg-orange-50" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Calendar size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Agenda</span>
        </button>

        {/* BOTÃO CENTRAL: RADAR / PAWGO */}
        <div className="flex flex-col items-center">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCenterButtonClick}
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all border-3 border-white
              ${isProf 
                ? (isOnline ? "bg-slate-900" : "bg-slate-400") 
                : "bg-orange-500"}
            `}
          >
            {isProf ? (
              <Globe className={`text-white w-6 h-6 ${isOnline ? "animate-spin-slow" : "opacity-50"}`} />
            ) : (
              <Zap className="text-white w-6 h-6 fill-current" />
            )}
          </motion.button>
          <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-1">
            {isProf ? (isOnline ? "Online" : "Offline") : "PawGo"}
          </span>
        </div>

        {/* ABA 3: NOTIFICAÇÕES */}
        <button 
          onClick={onNotificationsClick}
          className={`flex flex-col items-center gap-0.5 transition-all flex-1 py-2 rounded-xl relative text-slate-500 hover:bg-slate-50`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-tight">Avisos</span>
        </button>



        {/* ABA 4: PERFIL */}
        <button 
          onClick={() => navigate(user?.username ? createPageUrl(`UserProfile?username=${user.username}`) : createPageUrl(`UserProfile?id=${user?.id}`))}
          className={`flex flex-col items-center gap-0.5 transition-all flex-1 py-2 rounded-xl ${isActive(createPageUrl("UserProfile")) ? "text-orange-500 bg-orange-50" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <User size={20} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Perfil</span>
        </button>

      </div>
    </div>
  );
}