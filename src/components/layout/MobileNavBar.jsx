import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Map, Calendar, User, Zap, LayoutDashboard, Globe, Bell } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Per-tab last-visited path storage with localStorage persistence
const getTabHistorySafe = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("mobileTabHistory") || "{}");
  } catch {
    return {};
  }
};

const saveTabHistory = (history) => {
  try {
    localStorage.setItem('mobileTabHistory', JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save tab history:', e);
  }
};

let tabHistory = getTabHistorySafe();

export default function MobileNavBar({ user, unreadCount = 0, onNotificationsClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [scrollPositions, setScrollPositions] = React.useState({});

  const isProf = user?.preferences?.current_mode === "professional";
  const isTutor = user?.preferences?.current_mode === "tutor";
  const isOnline = user?.pawgo_status?.is_online;

  // Localized labels with safe fallbacks
  const labelDashboard = t('dashboard', language) || (language === 'pt' ? 'Painel' : language === 'es' ? 'Panel' : 'Dashboard');
  const labelClient = t('client', language) || (language === 'pt' ? 'Cliente' : language === 'es' ? 'Cliente' : 'Client');
  const labelExplore = t('explore', language) || (language === 'pt' ? 'Explorar' : language === 'es' ? 'Explorar' : 'Explore');
  const labelSchedule = t('schedule', language) || (language === 'pt' ? 'Agenda' : language === 'es' ? 'Agenda' : 'Schedule');
  const labelNotifications = t('notifications', language) || (language === 'pt' ? 'Notificações' : language === 'es' ? 'Notificaciones' : 'Notifications');
  const labelProfile = t('profile', language) || (language === 'pt' ? 'Perfil' : language === 'es' ? 'Perfil' : 'Profile');
  const labelOn = language === 'pt' ? 'Ligado' : (language === 'es' ? 'Encendido' : 'On');
  const labelOff = language === 'pt' ? 'Desligado' : (language === 'es' ? 'Apagado' : 'Off');

  const isActive = (path) => {
    if (path === createPageUrl("Home") && location.pathname === path) return true;
    if (path !== createPageUrl("Home") && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Save scroll position before navigating away
  React.useEffect(() => {
    return () => {
      setScrollPositions(prev => ({
        ...prev,
        [location.pathname]: window.scrollY
      }));
    };
  }, [location.pathname]);

  // Restore scroll position when returning to a tab
  React.useEffect(() => {
    if (scrollPositions[location.pathname]) {
      window.scrollTo(0, scrollPositions[location.pathname]);
    }
  }, [location.pathname, scrollPositions]);

  const handleTabClick = (rootPath) => {
    if (isActive(rootPath)) {
      // Already on this tab — reset to root
      window.scrollTo(0, 0);
      setScrollPositions(prev => ({ ...prev, [rootPath]: 0 }));
      tabHistory[rootPath] = rootPath;
      saveTabHistory(tabHistory);
      navigate(rootPath, { replace: true });
    } else {
      // Save current location under the active tab root before switching
      const activeRoot = Object.keys(tabHistory).find(root => isActive(root));
      if (activeRoot) {
        tabHistory[activeRoot] = location.pathname + location.search;
      }
      // Navigate to last visited path in the target tab (or its root)
      const target = tabHistory[rootPath] || rootPath;
      saveTabHistory(tabHistory);
      navigate(target);
    }
  };

  const handleCenterButtonClick = async () => {
    if (isProf) {
      // Profissional: toggle online/offline with optimistic update
      const newStatus = !isOnline;
      
      // Optimistic update: update local state immediately
      queryClient.setQueryData(['currentUser'], (old) => ({
        ...old,
        pawgo_status: {
          ...old?.pawgo_status,
          is_online: newStatus,
          last_active: new Date().toISOString()
        }
      }));
      
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
        // Rollback optimistic update on error
        queryClient.invalidateQueries(['currentUser']);
      }
    } else {
      // Cliente/Tutor: voltar para modo usuário normal (não profissional)
      if (location.pathname !== createPageUrl("Dashboard")) {
          navigate(createPageUrl("Dashboard"), { state: { triggerTransition: true, toProfessional: false } });
      } else {
          window.dispatchEvent(new CustomEvent('triggerModeSwitch', { detail: { toProfessional: false } }));
      }
    }
  };

  // Hide global nav only on ProfessionalHubV2 (has its own ProfessionalTabBar)
  const isOnProfHub = location.pathname === '/ProfessionalHubV2' || location.pathname === createPageUrl('ProfessionalHubV2');

  if (!user || isOnProfHub) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-[9998] w-full px-3 pt-3 bg-white/98 backdrop-blur-lg border-t border-slate-200 shadow-[0_-15px_50px_rgba(0,0,0,0.08)] rounded-t-2xl pointer-events-auto"
      style={{ pointerEvents: 'auto', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-3xl mx-auto flex items-center justify-center gap-2 sm:gap-4">
        
        {/* ABA 1: EXPLORAR / PAINEL PROFISSIONAL / CLIENTE */}
        <button 
          onClick={() => {
            const targetPath = isProf ? createPageUrl("ProfessionalHubV2") : isTutor ? createPageUrl("ClientDashboard") : createPageUrl("Home");
            handleTabClick(targetPath);
          }}
          className={`flex flex-col items-center gap-0.5 transition-all flex-1 min-w-0 px-1 py-2 overflow-hidden rounded-xl border border-slate-200 ${
            (isProf && isActive(createPageUrl("ProfessionalHubV2"))) ||
            (isTutor && isActive(createPageUrl("ClientDashboard"))) ||
            (!isProf && !isTutor && isActive(createPageUrl("Home")))
              ? "text-orange-500 bg-orange-50" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          {isProf ? <LayoutDashboard size={18} /> : isTutor ? <LayoutDashboard size={18} /> : <Map size={18} />}
          <span className="text-[9px] leading-none font-bold uppercase tracking-tight whitespace-nowrap truncate max-w-[68px] text-center">
            {isProf ? labelDashboard : isTutor ? labelClient : labelExplore}
          </span>
        </button>

        {/* ABA 2: AGENDA / RESERVAS */}
        <button 
          onClick={() => {
            if (isProf) {
              navigate(createPageUrl("ManageAvailability"));
            } else {
              handleTabClick(createPageUrl("MyBookings"));
            }
          }}
          className={`flex flex-col items-center gap-0.5 transition-all flex-1 min-w-0 px-1 py-2 overflow-hidden rounded-xl border border-slate-200 ${
            (isProf && (isActive(createPageUrl("ManageAvailability")) || isActive(createPageUrl("ProfessionalCalendar")))) ||
            (!isProf && isActive(createPageUrl("MyBookings")))
              ? "text-orange-500 bg-orange-50" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Calendar size={18} />
          <span className="text-[9px] leading-none font-bold uppercase tracking-tight whitespace-nowrap truncate max-w-[68px] text-center">{isProf ? (language === 'pt' ? 'Agenda' : language === 'es' ? 'Calendario' : 'Calendar') : labelSchedule}</span>
        </button>

        {/* BOTÃO CENTRAL: RADAR / PAWGO */}
        <div className="flex flex-col items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCenterButtonClick}
            aria-pressed={isProf ? isOnline : undefined}
            title={isProf ? (isOnline ? 'Ficar offline' : 'Ficar online') : 'PawGo'}
            className={`relative ${isProf ? 'w-24 h-10' : 'w-14 h-14 bg-orange-500'} rounded-full shadow-lg flex items-center justify-center transition-all border border-slate-200`}
          >
            {isProf ? (
              <>
                <div className={`absolute inset-0 ${isOnline ? 'bg-green-500' : 'bg-slate-400'} rounded-full`} />
                <div className={`absolute top-1 left-1 w-8 h-8 rounded-full bg-white transition-transform ${isOnline ? 'translate-x-14' : ''}`} />
                <div className="absolute inset-0 flex items-center justify-between px-2 text-[9px] font-extrabold uppercase">
                  <span className={`${isOnline ? 'text-white/70' : 'text-slate-800'}`}>{labelOff}</span>
                  <span className={`${isOnline ? 'text-white' : 'text-white/70'}`}>{labelOn}</span>
                </div>
              </>
            ) : (
              <Zap className="text-white w-5 h-5 fill-current" />
            )}
          </motion.button>
          <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest mt-1 whitespace-nowrap truncate max-w-[72px] text-center">
            {isProf ? (isOnline ? labelOn : labelOff) : 'PawGo'}
          </span>
        </div>

        {/* ABA 3: NOTIFICAÇÕES */}
        <button 
          onClick={onNotificationsClick}
          className="flex flex-col items-center gap-0.5 transition-all flex-1 min-w-0 px-1 py-2 overflow-hidden rounded-xl relative border border-slate-200 text-slate-500 hover:bg-slate-50"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="text-[9px] leading-none font-bold uppercase tracking-tight whitespace-nowrap truncate max-w-[68px] text-center">{labelNotifications}</span>
        </button>



        {/* ABA 4: PERFIL */}
        <button 
          onClick={() => {
            const profilePath = createPageUrl("UserProfile");
            handleTabClick(profilePath);
          }}
          className={`flex flex-col items-center gap-0.5 transition-all flex-1 min-w-0 px-1 py-2 overflow-hidden rounded-xl border border-slate-200 ${isActive(createPageUrl("UserProfile")) ? "text-orange-500 bg-orange-50" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <User size={18} />
          <span className="text-[9px] leading-none font-bold uppercase tracking-tight whitespace-nowrap truncate max-w-[68px] text-center">{labelProfile}</span>
        </button>

      </div>
    </div>
  );
}