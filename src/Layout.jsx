import React from "react";
import { Link, useLocation, useNavigate, NavLink } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dog, Home, Calendar, User, PlusCircle, Zap, Heart, CalendarClock, HomeIcon, Bell, History, Crown, Gift, Store, Award, Globe, Camera, Shield, ShieldCheck, BarChart3, Trophy, GraduationCap, Megaphone, ShoppingBag, Sparkles, LogOut, Building2, Download, Users, CreditCard, AlertCircle, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { ThemeProvider, useTheme } from "@/components/ThemeContext";
import { LocalizationProvider, useLocalization } from "@/components/LocalizationContext";
import CountrySelector from "@/components/ui/CountrySelector";
import PawCaoLogo from "@/components/PawCaoLogo";
import GlobalSearch from "@/components/search/GlobalSearch";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { ToastProvider } from "@/components/notifications/NotificationToast";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import MobileNavBar from "@/components/layout/MobileNavBar";
import SidebarNav from "@/components/layout/SidebarNav";
import { lazy, Suspense } from "react";

import NotificationArea from "@/components/notifications/NotificationArea";
import PullToRefresh from "@/components/ui/PullToRefresh";
import BadgeNotification from "@/components/gamification/BadgeNotification";
import PushNotificationManager from "@/components/notifications/PushNotificationManager";
import MobileHeader from "@/components/layout/MobileHeader";

import NotificationTriggers from "@/components/notifications/NotificationTriggers";
import DynamicBackground from "@/components/ui/DynamicBackground";
import { useModalCleanup } from "@/components/ui/ModalCleanup";
import SEOManager from "@/components/SEOManager";
import MobileOptimizations from "@/components/ui/MobileOptimizations";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";
import RoleSwitcher from "@/components/layout/RoleSwitcher";
import LayoutStyles from "@/components/layout/LayoutStyles";
import LayoutFooter from "@/components/layout/LayoutFooter";
import LayoutSEO from "@/components/layout/LayoutSEO";
import NotificationManager from "@/components/notifications/NotificationManager";

import "./globals.css";




function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = React.useState(false);
  const [newBadge, setNewBadge] = React.useState(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  useModalCleanup();

  const seoManager = <SEOManager />;

  const impersonationData = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('impersonation') || 'null');
    } catch {
      return null;
    }
  }, []);


  const isRouteActive = (path) => {
    if (!path) return false;
    if (path === createPageUrl("Home") && location.pathname === path) return true;
    if (path !== createPageUrl("Home") && location.pathname.startsWith(path)) return true;
    return location.pathname === path;
  };

  React.useEffect(() => {
    // Não redirecionar de /login automaticamente — deixar o sistema de auth tratar
  }, []);

  const lastAuthUserRef = React.useRef(null);

  const { data: authUser, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const impersonation = JSON.parse(localStorage.getItem('impersonation'));
        let userData = null;

        if (impersonation?.targetUserId) {
          const expired = impersonation.expiresAt && new Date(impersonation.expiresAt) < new Date();
          if (expired) {
            localStorage.removeItem('impersonation');
          } else {
            const realUser = await base44.auth.me();
            if (realUser?.role === 'admin') {
              // Use stored target user data — no fragile fetch on every refetch
              if (impersonation.targetUserData) {
                userData = { ...impersonation.targetUserData, isImpersonating: true };
              } else {
                // Fallback: fetch only if stored data is missing (legacy impersonation)
                const targets = await base44.entities.User.filter({ id: impersonation.targetUserId });
                if (targets.length > 0) {
                  userData = { ...targets[0], isImpersonating: true };
                }
              }
            } else {
              localStorage.removeItem('impersonation');
            }
          }
        }

        if (!userData) {
          userData = await base44.auth.me();
        }

        if (userData?.email) {
          try {
            const profiles = await base44.entities.UserProfile.filter({ user_email: userData.email });
            if (profiles.length > 0) {
              userData.gamification_xp = profiles[0].gamification_xp || 0;
              userData.gamification_level = profiles[0].gamification_level || 1;
            }
          } catch (e) {}
        }

        return userData;
      } catch (err) {
        console.error('Auth error:', err);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 500,
  });

  if (authUser) lastAuthUserRef.current = authUser;
  const stableUser = authUser || lastAuthUserRef.current;

  const { data: notifications } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      if (!authUser?.email) return [];
      try {
        const allNotifications = await base44.entities.Notification.filter({ 
          recipient_email: authUser.email,
          is_read: false 
        }, '-created_date', 10);
        return Array.isArray(allNotifications) ? allNotifications : [];
      } catch (error) {
        console.error("Notifications fetch error:", error);
        return [];
      }
    },
    enabled: !!authUser?.email,
    initialData: [],
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    retry: 1,
    retryDelay: 1000,
  });

  const unreadCount = notifications?.length || 0;

  const { data: hotelPartnerships } = useQuery({
    queryKey: ['hotelPartnerships', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return [];
      try {
        const profiles = await base44.entities.WalkerProfile.filter({ created_by: authUser.email });
        if (profiles.length > 0 && profiles[0].hotel_partnerships?.length > 0) {
          return profiles[0].hotel_partnerships;
        }
        const hotels = await base44.entities.WalkerProfile.filter(
          { professional_type: 'hotel' },
          undefined,
          100
        );
        const partnerships = [];
        for (const h of hotels) {
          const partners = h.hotel_details?.partner_walkers || [];
          const found = partners.find(p => p.walker_email?.toLowerCase() === authUser.email.toLowerCase());
          if (found) {
            partnerships.push({
              hotel_profile_id: h.id,
              hotel_name: h.hotel_details?.hotel_name || h.walker_name || 'Hotel',
              hotel_photo_url: h.photo_url || '',
              partner_role: found.partner_role || 'simple',
            });
          }
        }
        return partnerships;
      } catch {
        return [];
      }
    },
    enabled: !!authUser?.email,
    staleTime: 10 * 60 * 1000,
  });

  React.useEffect(() => {
    setIsNotificationPanelOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const mainMenu = [
    { 
      title: language === 'pt' ? 'Profissionais' : language === 'es' ? 'Profesionales' : 'Professionals', 
      url: createPageUrl("Home"), 
      icon: Users, 
      id: "nav-home" 
    },
    { 
      title: "PawGo", 
      url: createPageUrl("Dashboard"), 
      icon: Zap, 
      className: "text-orange-600 font-bold bg-orange-50 hover:bg-orange-100" 
    },
    { 
      title: language === 'pt' ? 'Meu Painel' : 'Dashboard', 
      url: createPageUrl("ProfessionalHubV2"),
      icon: BarChart3 
    }
  ];

  const myActivityMenu = [
    { title: t('myFavorites', language), url: createPageUrl("Favorites"), icon: Heart },
    { title: t('myBookings', language), url: createPageUrl("MyBookings"), icon: Calendar },
    { title: language === 'pt' ? 'Painel Cliente' : 'Client Dashboard', url: createPageUrl("ClientDashboard"), icon: BarChart3 },
    { title: t('walkHistory', language), url: createPageUrl("WalkHistory"), icon: History },
    { title: language === 'pt' ? 'Lista de Desejos' : 'Wishlist', url: createPageUrl("MyWishlist"), icon: Heart },
    { title: t('notifications', language), url: createPageUrl("Notifications"), icon: Bell, hasNotifications: true },
    { title: language === 'pt' ? 'Legado' : language === 'es' ? 'Legado' : 'Legacy', url: createPageUrl("Gamification"), icon: Trophy, id: "nav-gamification" },
    { title: language === 'pt' ? 'Programa Afiliados' : language === 'es' ? 'Programa de Afiliados' : 'Affiliate Program', url: createPageUrl("AffiliateDashboard"), icon: Users },
  ];

  const professionalMenu = [
    { title: t('ownerMembership', language), url: createPageUrl("OwnerSubscriptions"), icon: Crown }
  ];



  const welcomeBadgeAwardedRef = React.useRef(false);
  
  React.useEffect(() => {
    const awardWelcomeBadge = async () => {
      if (!authUser?.email || welcomeBadgeAwardedRef.current || authUser?.isImpersonating) return;

      const badges = authUser.achievements_badges || [];
      const hasWelcomeBadge = badges.some(b => b.badge_id === 'welcome');

      if (!hasWelcomeBadge && badges.length === 0) {
        welcomeBadgeAwardedRef.current = true;
        try {
          const badge = {
            badge_id: 'welcome',
            name: language === 'pt' ? 'Bem-vindo à PawCão!' : (language === 'es' ? '¡Bienvenido a PawCão!' : 'Welcome to PawCão!'),
            description: language === 'pt' ? 'Obrigado por se juntar à nossa comunidade!' : (language === 'es' ? '¡Gracias por unirte a nuestra comunidad!' : 'Thanks for joining our community!'),
            icon: '🎉',
            rarity: 'common',
            earned_date: new Date().toISOString(),
            category: 'milestone',
            xp_reward: 0
          };

          await base44.auth.updateMe({
            achievements_badges: [badge]
          });

          queryClient.invalidateQueries(['currentUser']);
          setNewBadge(badge);
        } catch (error) {
          console.error('Error awarding welcome badge:', error);
          welcomeBadgeAwardedRef.current = false;
        }
      }
    };

    if (authUser?.email && authUser.achievements_badges !== undefined) {
      awardWelcomeBadge();
    }
  }, [authUser?.email, language, queryClient]);

  const profileSetupRef = React.useRef({ initialized: false, syncedXP: null });
  
  React.useEffect(() => {
    const setupProfiles = async () => {
      if (!authUser?.email || profileSetupRef.current.initialized || authUser?.isImpersonating) return;
      
      profileSetupRef.current.initialized = true;

      // Derive a friendly display name from email if full_name is missing
      const emailPart = (authUser.email || '').split('@')[0] || '';
      const cleaned = emailPart.replace(/[._-]+/g, ' ').trim();
      const deriveName = (authUser.full_name && authUser.full_name.trim())
        ? authUser.full_name
        : (cleaned ? cleaned.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Utilizador');

      if (authUser.profile_stats === undefined || authUser.profile_stats === null) {
        try {
          await base44.auth.updateMe({
            profile_stats: {
              total_posts: 0,
              total_likes_received: 0,
              total_comments_made: 0,
              total_bookings: 0,
              total_dogs_helped: 0,
              total_referrals: 0,
              total_reviews_written: 0,
              total_forum_topics: 0,
              total_forum_replies: 0,
              total_events_attended: 0,
              total_adoptions: 0,
              member_since_days: 0
            },
            followers_count: 0,
            following_count: 0,
            total_posts: 0
          });
          queryClient.invalidateQueries(['currentUser']);
        } catch (error) {
          console.error('Error setting up Dog Connect profile:', error);
        }
      }

      try {
        const profiles = await base44.entities.UserProfile.filter({ user_email: authUser.email });
        let userProfile = profiles[0];
        
        if (!profiles || profiles.length === 0) {
          userProfile = await base44.entities.UserProfile.create({
            user_email: authUser.email,
            user_id: authUser.id,
            username: authUser.username,
            full_name: deriveName,
            profile_photo_url: authUser.profile_photo_url,
            cover_photo_url: authUser.cover_photo_url,
            bio: authUser.bio || '',
            city: authUser.city || '',
            role: authUser.role || 'user',
            gamification_xp: authUser.gamification_xp || 0,
            gamification_level: authUser.gamification_level || 1,
            followers_count: 0,
            following_count: 0,
            is_verified: authUser.is_verified || false,
            owned_dogs: []
          });
        }

        // Backfill missing names on existing profiles (user + professional)
        try {
          if (userProfile && (!userProfile.full_name || String(userProfile.full_name).trim() === '' || userProfile.full_name === 'Utilizador')) {
            await base44.entities.UserProfile.update(userProfile.id, { full_name: deriveName });
          }
        } catch (e) { console.warn('UserProfile name backfill skipped:', e?.message); }

        try {
          const walkers = await base44.entities.WalkerProfile.filter({ created_by: authUser.email });
          if (walkers?.length) {
            const w = walkers[0];
            if (!w.walker_name || String(w.walker_name).trim() === '') {
              const hotelName = w.hotel_details?.hotel_name;
              await base44.entities.WalkerProfile.update(w.id, { walker_name: hotelName || deriveName });
            }
          }
        } catch (e) { console.warn('WalkerProfile name backfill skipped:', e?.message); }

        try {
          const trainers = await base44.entities.TrainerProfile.filter({ created_by: authUser.email });
          if (trainers?.length) {
            const t = trainers[0];
            if (!t.trainer_name || String(t.trainer_name).trim() === '') {
              await base44.entities.TrainerProfile.update(t.id, { trainer_name: deriveName });
            }
          }
        } catch (e) { console.warn('TrainerProfile name backfill skipped:', e?.message); }

      } catch (err) {
        console.error("Error ensuring UserProfile entity:", err);
      }
    };

    setupProfiles();
  }, [authUser?.email]);
  
  React.useEffect(() => {
    profileSetupRef.current = { initialized: false, syncedXP: null };
  }, [authUser?.email]);

  const NAV_I18N = {
    professionalHub: { pt: 'Painel Profissional', en: 'Pro Dashboard', es: 'Panel Profesional', fr: 'Tableau Pro' },
    clientPanel:     { pt: 'Painel Cliente',       en: 'Client Panel',  es: 'Panel Cliente',    fr: 'Panel Client' },
    bookings:        { pt: 'Reservas',              en: 'Bookings',      es: 'Reservas',         fr: 'Réservations' },
    myPanel:         { pt: 'Meu Painel',            en: 'My Dashboard',  es: 'Mi Panel',         fr: 'Mon Tableau'  },
    myHotel:         { pt: 'Meu Hotel',             en: 'My Hotel',      es: 'Mi Hotel',         fr: 'Mon Hôtel'    },
    signOut:         { pt: 'Sair',                  en: 'Sign Out',      es: 'Salir',            fr: 'Déconnexion'  },
    signIn:          { pt: 'Entrar',                en: 'Sign In',       es: 'Entrar',           fr: 'Connexion'    },
    signUp:          { pt: 'Registar',              en: 'Sign Up',       es: 'Registrarse',      fr: 'S\'inscrire'  },
    confirmLogout:   { pt: 'Tem certeza que deseja sair?', en: 'Are you sure you want to log out?', es: '¿Estás seguro de que quieres cerrar sesión?', fr: 'Êtes-vous sûr de vouloir vous déconnecter?' },
  };
  const nav = (key) => NAV_I18N[key]?.[language] || NAV_I18N[key]?.pt || key;





  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      const reason = event?.reason;
      const safeError = reason instanceof Error
        ? reason
        : new Error(typeof reason === 'string' ? reason : 'Unhandled promise rejection');

      if (!safeError.stack) {
        safeError.stack = safeError.message || 'Unhandled promise rejection';
      }

      console.error('🔴 Unhandled Promise Rejection:', safeError);
      event?.preventDefault?.();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  const handleLogout = () => {
    if (confirm(nav('confirmLogout'))) {
      base44.auth.logout('/');
    }
  };

  return (
    <SidebarProvider>
      <MobileOptimizations />
      {seoManager}
      <ImpersonationBanner />
      <LayoutSEO />
      <LayoutStyles />
      <div className="hidden md:block">
        <DynamicBackground />
      </div>

      {/* Top header for desktop — floating glass */}
      <header className="hidden md:flex fixed top-3 left-4 right-4 z-[10000]">
        <div
          className="max-w-6xl mx-auto w-full flex items-center justify-between rounded-full px-5 py-2"
          style={{
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <PawCaoLogo size="small" showText={false} />
            <span className="sr-only">PawCão</span>
          </Link>
          <nav className="flex items-center gap-1">
            {/* Links de painel — só para utilizadores autenticados */}
            {authUser && (() => {
              const role = authUser.role || 'user';
              const isAdmin = role === 'admin';
              const isHotel = role === 'hotel' || role === 'hotel_admin';
              const isPro = role === 'walker' || role === 'trainer' || role === 'professional';

              const navCls = ({ isActive }) =>
                `px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${isActive ? 'bg-teal-500/15 text-teal-700' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'}`;

              if (isAdmin) return (
                <>
                  <NavLink to={createPageUrl("ProfessionalHubV2")} className={navCls}>{nav('professionalHub')}</NavLink>
                  <NavLink to={createPageUrl("ClientDashboard")} className={navCls}>{nav('clientPanel')}</NavLink>
                  <NavLink to={createPageUrl("AdminDashboard")} className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${isActive ? 'bg-red-100 text-red-700' : 'text-red-500 hover:bg-red-50'}`}>
                    Admin
                  </NavLink>
                </>
              );

              if (isHotel) return (
                <NavLink to={createPageUrl("HotelDashboard")} className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'}`}>
                  {nav('myHotel')}
                </NavLink>
              );

              if (isPro) return (
                <>
                  <NavLink to={createPageUrl("ProfessionalHubV2")} className={navCls}>{nav('professionalHub')}</NavLink>
                  <NavLink to={createPageUrl("ClientDashboard")} className={navCls}>{nav('bookings')}</NavLink>
                </>
              );

              return (
                <NavLink to={createPageUrl("ClientDashboard")} className={navCls}>{nav('myPanel')}</NavLink>
              );
            })()}
            {hotelPartnerships && hotelPartnerships.length > 0 && (
              <NavLink to={createPageUrl("PartnerHotelPanel")} className={({ isActive }) => `px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'}`}>
                Painel Parceiro
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            {stableUser ? (
              <button
                onClick={handleLogout}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 bg-white/50 hover:bg-white/80 border border-slate-200/50 transition-all active:scale-95"
              >
                {nav('signOut')}
              </button>
            ) : (
              <button
                onClick={() => navigate('/register')}
                className="rounded-full px-6 py-2 text-sm font-bold text-white transition-all active:scale-95 hover:shadow-lg flex items-center gap-2 bg-gradient-to-br from-[#00a699] to-[#207373] shadow-[0_4px_14px_rgba(0,166,153,0.3)]"
              >
                {nav('signUp')}
              </button>
            )}
          </div>
        </div>
      </header>

      <PushNotificationManager user={authUser} />
      <NotificationTriggers user={authUser} />
      <NotificationManager />

      <div className="flex flex-col w-full relative z-10 min-h-screen mt-0 md:mt-16">
        <div className="hidden md:block" style={{ height: '26px' }} />
        <div className="flex flex-1 w-full flex-col">
          <MobileHeader />
          {stableUser && (
            <MobileNavBar user={stableUser} unreadCount={unreadCount} onNotificationsClick={() => setIsNotificationPanelOpen(true)} />
          )}

          <GlobalSearch 
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />

          <div aria-live="polite" aria-label="Notifications">
            <NotificationArea
              isOpen={isNotificationPanelOpen}
              onClose={() => setIsNotificationPanelOpen(false)}
            />
          </div>

          {newBadge && (
            <BadgeNotification 
              badge={newBadge}
              onClose={() => setNewBadge(null)}
            />
          )}

          <PullToRefresh>
            <main className="flex-1 w-full pt-[calc(4.5rem+env(safe-area-inset-top))] md:pt-0 pb-28 md:pb-0">
              {children}
            </main>
          </PullToRefresh>

          <LayoutFooter />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <LocalizationProvider>
          <ThemeProvider>
            <ToastProvider>
              <LayoutContent children={children} currentPageName={currentPageName} />
            </ToastProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}