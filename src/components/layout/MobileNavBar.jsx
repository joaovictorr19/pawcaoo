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
  const isHotel = user?.role === 'hotel' || user?.role === 'hotel_admin';

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

  // Hide global nav on pages that have their own bottom tab bar
  const profHubPath = createPageUrl("ProfessionalHubV2");
  const hotelDashPath = createPageUrl("HotelDashboard");
  const isOnOwnTabBar = location.pathname === profHubPath || location.pathname === hotelDashPath ||
    location.pathname.startsWith(profHubPath) || location.pathname.startsWith(hotelDashPath);

  if (!user || isOnOwnTabBar) return null;

  const profPanelPath = isHotel ? hotelDashPath : profHubPath;

  // Active checks per tab
  const isTab1Active = (isProf && isActive(profPanelPath)) ||
    (isTutor && isActive(createPageUrl("ClientDashboard"))) ||
    (!isProf && !isTutor && isActive(createPageUrl("Home")));
  const isTab2Active = (isProf && isActive(createPageUrl("ProfessionalCalendar"))) ||
    (!isProf && isActive(createPageUrl("MyBookings")));
  const isTab4Active = isActive(createPageUrl("UserProfile"));

  const tabBase = "flex flex-col items-center justify-center gap-1 transition-all duration-200 flex-1 min-w-0 py-2 rounded-full";
  const activeCls = "text-white bg-[#207373]";
  const inactiveCls = "text-slate-500";

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-[9998] w-full pointer-events-none"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div
        className="mx-auto flex items-center justify-between gap-1 max-w-md pointer-events-auto"
        style={{
          marginLeft: '12px',
          marginRight: '12px',
          background: 'rgba(255, 255, 255, 0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          borderRadius: '9999px',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
          padding: '6px',
        }}
      >
        {/* ABA 1: EXPLORAR / PAINEL / CLIENTE */}
        <button
          onClick={() => {
            const targetPath = isProf ? profPanelPath : isTutor ? createPageUrl("ClientDashboard") : createPageUrl("Home");
            handleTabClick(targetPath);
          }}
          className={`${tabBase} ${isTab1Active ? activeCls : inactiveCls}`}
          style={isTab1Active ? { boxShadow: '0 2px 12px rgba(32,115,115,0.35)' } : {}}
        >
          {isProf ? <LayoutDashboard size={18} /> : isTutor ? <LayoutDashboard size={18} /> : <Map size={18} />}
          <span className="text-[8px] leading-none font-bold uppercase tracking-tight whitespace-nowrap truncate max-w-[60px] text-center">
            {isProf ? labelDashboard : isTutor ? labelClient : labelExplore}
          </span>
        </button>

        {/* ABA 2: AGENDA / RESERVAS */}
        <button
          onClick={() => {
            if (isProf) {
              handleTabClick(createPageUrl("ProfessionalCalendar"));
            } else {
              handleTabClick(createPageUrl("MyBookings"));
            }
          }}
          className={`${tabBase} ${isTab2Active ? activeCls : inactiveCls}`}
          style={isTab2Active ? { boxShadow: '0 2px 12px rgba(32,115,115,0.35)' } : {}}
        >
          <Calendar size={18} />
          <span className="text-[8px] leading-none font-bold uppercase tracking-tight whitespace-nowrap truncate max-w-[60px] text-center">{isProf ? (language === 'pt' ? 'Agenda' : language === 'es' ? 'Calendario' : 'Calendar') : labelSchedule}</span>
        </button>

        {/* ABA 3: NOTIFICAÇÕES */}
        <button
          onClick={onNotificationsClick}
          className={`${tabBase} relative ${inactiveCls}`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="text-[8px] leading-none font-bold uppercase tracking-tight whitespace-nowrap truncate max-w-[60px] text-center">{labelNotifications}</span>
        </button>

        {/* ABA 4: PERFIL */}
        <button
          onClick={() => {
            const profilePath = createPageUrl("UserProfile");
            handleTabClick(profilePath);
          }}
          className={`${tabBase} ${isTab4Active ? activeCls : inactiveCls}`}
          style={isTab4Active ? { boxShadow: '0 2px 12px rgba(32,115,115,0.35)' } : {}}
        >
          <User size={18} />
          <span className="text-[8px] leading-none font-bold uppercase tracking-tight whitespace-nowrap truncate max-w-[60px] text-center">{labelProfile}</span>
        </button>
      </div>
    </div>
  );
}