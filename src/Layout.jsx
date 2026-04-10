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
import { ThemeProvider, useTheme } from "@/components/ThemeContext";
import { LocalizationProvider, useLocalization } from "@/components/LocalizationContext";
import CountrySelector from "@/components/ui/CountrySelector";
import { getAvailableLanguages } from "@/components/translations";
import { t } from "@/components/translations";
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
    if (location.pathname === '/login' || location.pathname === '/login/') {
      navigate(createPageUrl('Home'), { replace: true });
    }
  }, [location.pathname, navigate]);

  const lastAuthUserRef = React.useRef(null);

  const { data: authUser, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const impersonation = JSON.parse(localStorage.getItem('impersonation'));
        let userData = null;

        if (impersonation?.targetUserId) {
          const realUser = await base44.auth.me();
          if (realUser?.role === 'admin') {
            const targets = await base44.entities.User.filter({ id: impersonation.targetUserId });
            if (targets.length > 0) {
              userData = { ...targets[0], isImpersonating: true };
            }
          } else {
            localStorage.removeItem('impersonation');
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
      if (!authUser?.email || welcomeBadgeAwardedRef.current) return;

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
      if (!authUser?.email || profileSetupRef.current.initialized) return;
      
      profileSetupRef.current.initialized = true;

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
            full_name: authUser.full_name || 'Utilizador',
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
      } catch (err) {
        console.error("Error ensuring UserProfile entity:", err);
      }
    };

    setupProfiles();
  }, [authUser?.email]);
  
  React.useEffect(() => {
    profileSetupRef.current = { initialized: false, syncedXP: null };
  }, [authUser?.email]);

  const availableLanguages = getAvailableLanguages();
  
  const languageFlags = availableLanguages.reduce((acc, lang) => {
    acc[lang.code] = lang.flag;
    return acc;
  }, {});

  const languageNames = availableLanguages.reduce((acc, lang) => {
    acc[lang.code] = lang.name;
    return acc;
  }, {});





  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      try {
        const reason = event.reason;
        console.error('🔴 Unhandled Promise Rejection:', reason);
        
        if (!reason || typeof reason !== 'object' || !reason.stack) {}
        
        event.preventDefault();
      } catch (e) {
        console.error('Error in unhandled rejection handler:', e);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  const handleLogout = () => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja sair?' : language === 'es' ? '¿Estás seguro de que quieres cerrar sesión?' : 'Are you sure you want to log out?')) {
      base44.auth.logout();
    }
  };

  return (
    <SidebarProvider>
      <MobileOptimizations />
      {seoManager}
      <ImpersonationBanner />
      <LayoutSEO />
      <LayoutStyles />
      <DynamicBackground />

      {/* Top header for desktop */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-[10000] h-16 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto w-full h-full px-4 flex items-center justify-between">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <PawCaoLogo size="small" showText={false} />
            <span className="sr-only">PawCão</span>
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink to={createPageUrl("Home")} className={({ isActive }) => `px-3 py-2 rounded-full text-sm ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 text-slate-700'}`}>Profissionais</NavLink>
            <NavLink to={createPageUrl("ProfessionalHubV2")} className={({ isActive }) => `px-3 py-2 rounded-full text-sm ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 text-slate-700'}`}>Painel Profissional</NavLink>
            <NavLink to={createPageUrl("ClientDashboard")} className={({ isActive }) => `px-3 py-2 rounded-full text-sm ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 text-slate-700'}`}>Painel Cliente</NavLink>
            {stableUser?.role === 'admin' && (
              <NavLink to={createPageUrl("AdminDashboard")} className={({ isActive }) => `px-3 py-2 rounded-full text-sm ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 text-slate-700'}`}>Admin</NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {stableUser ? (
              <Button variant="outline" size="sm" onClick={handleLogout}>Sair</Button>
            ) : (
              <Button size="sm" onClick={() => base44.auth.redirectToLogin()}>Entrar</Button>
            )}
          </div>
        </div>
      </header>

      <PushNotificationManager user={authUser} />
      <NotificationTriggers user={authUser} />
      <NotificationManager />

      <div className="flex flex-col w-full relative z-10 min-h-[100dvh] overflow-x-hidden mt-0 md:mt-16">
        <div className="hidden md:block" style={{ height: '26px' }} />
        <div className="flex flex-1 w-full flex-col">
          <MobileHeader />
          <div className="block md:hidden" style={{ height: 'calc(48px + env(safe-area-inset-top))' }} />
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

          <main className="flex-1 w-full pb-28 md:pb-0 overflow-y-auto md:overflow-visible" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
            {children}
          </main>

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