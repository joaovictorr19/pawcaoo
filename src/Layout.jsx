import React from "react";
import { Link, useLocation, useNavigate, NavLink } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dog, Home, Calendar, User, PlusCircle, Zap, Heart, CalendarClock, HomeIcon, Bell, History, Crown, Gift, Store, Award, Globe, TrendingUp, Camera, Shield, ShieldCheck, BarChart3, Trophy, GraduationCap, Megaphone, ShoppingBag, Sparkles, Users, LogOut, Building2, Download, MessageCircle } from "lucide-react";
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
import { t } from "@/components/translations";
import PawCaoLogo from "@/components/PawCaoLogo";
import { ToastProvider } from "@/components/notifications/NotificationToast";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import MobileNavBar from "@/components/layout/MobileNavBar";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import NotificationArea from "@/components/notifications/NotificationArea";
import PullToRefresh from "@/components/ui/PullToRefresh";
import BadgeNotification from "@/components/gamification/BadgeNotification";
import PushNotificationManager from "@/components/notifications/PushNotificationManager";
import { useRealtimeNotifications } from "@/components/notifications/useRealtimeNotifications";
import NotificationTriggers from "@/components/notifications/NotificationTriggers";
import "./globals.css";

// Query optimization configs - v1.1
const queryConfig = {
  user: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  },
  notifications: {
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false, // Reduced aggressiveness
    refetchInterval: 60 * 1000, // Reduced to 1 minute
  },
  static: {
    staleTime: 15 * 60 * 1000, // Increased for static data
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  },
};

// Simple prefetch helpers
const prefetchQueries = {
  walkers: (queryClient, base44) => {
    queryClient.prefetchQuery({
      queryKey: ['walkers'],
      queryFn: () => base44.entities.WalkerProfile.filter({ is_active: true }, '-rating', 100),
      staleTime: 2 * 60 * 1000,
    });
  },
  trainers: (queryClient, base44) => {
    queryClient.prefetchQuery({
      queryKey: ['trainers'],
      queryFn: () => base44.entities.TrainerProfile.filter({ is_active: true }, '-rating'),
      staleTime: 2 * 60 * 1000,
    });
  },
  partners: (queryClient, base44) => {
    queryClient.prefetchQuery({
      queryKey: ['partners'],
      queryFn: () => base44.entities.Partnership.filter({ is_active: true }),
      staleTime: 3 * 60 * 1000,
    });
  },
  bookings: (queryClient, base44, userEmail) => {
    if (!userEmail) return;
    queryClient.prefetchQuery({
      queryKey: ['userBookings', userEmail],
      queryFn: () => base44.entities.Booking.filter({ created_by: userEmail }, '-created_date'),
      staleTime: 1 * 60 * 1000,
    });
  },
};

// Prefetch on hover hook
const usePrefetchOnHover = (prefetchFn) => {
  const timeoutRef = React.useRef(null);

  const handleMouseEnter = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      prefetchFn();
    }, 100);
  }, [prefetchFn]);

  const handleMouseLeave = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { handleMouseEnter, handleMouseLeave };
};

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [myActivityExpanded, setMyActivityExpanded] = React.useState(true);
  const [professionalServicesExpanded, setProfessionalServicesExpanded] = React.useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = React.useState(false);
  const [newBadge, setNewBadge] = React.useState(null);

  // Dictionary for menu translations
  const menuTranslations = {
    shelterArea: { pt: 'Área de Abrigos', es: 'Área de Refugios', en: 'Shelter Area' },
    myDashboard: { pt: 'Meu Dashboard', es: 'Mi Panel', en: 'My Dashboard' },
    badges: { pt: 'Emblemas', es: 'Emblemas', en: 'Badges' },
    becomeProfessional: { pt: 'Tornar-me Profissional', es: 'Ser Profesional', en: 'Become Professional' },
    verifyWalkers: { pt: 'Verificar Passeadores', es: 'Verificar Paseadores', en: 'Verify Walkers' },
    approveAds: { pt: 'Aprovar Anúncios', es: 'Aprobar Anuncios', en: 'Approve Ads' },
    paymentSetup: { pt: 'Config. Pagamentos', es: 'Config. Pagos', en: 'Payment Setup' },
    verifyShelters: { pt: 'Verificar Abrigos', es: 'Verificar Refugios', en: 'Verify Shelters' },
    moderation: { pt: 'Moderação', es: 'Moderación', en: 'Moderation' },
    myCompany: { pt: 'Minha Empresa', es: 'Mi Empresa', en: 'My Company' },
    vetDashboard: { pt: 'Painel Veterinário', es: 'Panel Veterinario', en: 'Vet Dashboard' },
    administration: { pt: 'Administração', es: 'Administración', en: 'Administration' },
    company: { pt: 'Empresa', es: 'Empresa', en: 'Company' },
    logout: { pt: 'Sair', es: 'Salir', en: 'Logout' },
    login: { pt: 'Entrar', es: 'Entrar', en: 'Login' }
  };

  const getMenuText = (key) => menuTranslations[key]?.[language] || menuTranslations[key]?.en;

  // Helper for active state
  const isRouteActive = (path) => {
    if (!path) return false;
    // Remove leading slash for comparison if needed, but usually paths match
    if (path === createPageUrl("Home") && location.pathname === path) return true;
    if (path !== createPageUrl("Home") && location.pathname.startsWith(path)) return true;
    return location.pathname === path;
  };

  // Fix 404 on /login route by redirecting to Home
  React.useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/login/') {
      navigate(createPageUrl('Home'), { replace: true });
    }
  }, [location.pathname, navigate]);

  const { data: authUser, isLoading: isLoadingUser, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        const userData = await base44.auth.me();
        // console.log("User loaded:", userData?.email);
        return userData;
      } catch (err) {
        // console.error("Auth error:", err);
        return null;
      }
    },
    ...queryConfig.user,
    retry: 1,
  });

  const { data: notifications } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      if (!authUser?.email) return [];
      try {
        const allNotifications = await base44.entities.Notification.filter({ 
          recipient_email: authUser.email,
          is_read: false 
        });
        return Array.isArray(allNotifications) ? allNotifications : [];
      } catch (error) {
        console.error("Notifications fetch error:", error);
        return [];
      }
    },
    enabled: !!authUser,
    initialData: [],
    ...queryConfig.notifications,
  });



  const { data: ownerSubscription } = useQuery({
    queryKey: ['ownerSubscription'],
    queryFn: async () => {
      if (!authUser?.email) return null;
      try {
        const subs = await base44.entities.OwnerSubscription.filter({
          owner_email: authUser.email,
          is_active: true
        });
        return Array.isArray(subs) ? subs[0] : null;
      } catch (error) {
        console.error("Subscription fetch error:", error);
        return null;
      }
    },
    enabled: !!authUser,
    ...queryConfig.static,
  });

  const unreadCount = notifications?.length || 0;

  // ✅ Sistema de Notificações em Tempo Real
  useRealtimeNotifications(authUser);

  // Definição clara dos grupos de menu para evitar problemas de índice
  const mainMenu = [
    { title: t('findWalkers', language), url: createPageUrl("Home"), icon: Dog, id: "nav-home" },
    { title: t('postEmergency', language), url: createPageUrl("PostEmergency"), icon: Zap, className: "text-red-600 font-bold bg-red-50 hover:bg-red-100" },
    { title: t('adoptAPet', language), url: createPageUrl("AdoptionListings"), icon: Home },
    { title: getMenuText('shelterArea'), url: createPageUrl("ShelterDashboard"), icon: Building2 },
    ...(authUser?.account_type === 'walker' || authUser?.account_type === 'trainer' || authUser?.account_type === 'both' ? [
      { title: t('professionalDashboard', language), url: createPageUrl("ProfessionalDashboard"), icon: BarChart3 },
      { title: t('manageAvailability', language), url: createPageUrl("ManageAvailability"), icon: CalendarClock }
    ] : [])
  ];

  const myActivityMenu = [
    { title: t('myFavorites', language), url: createPageUrl("Favorites"), icon: Heart },
    { title: t('myBookings', language), url: createPageUrl("MyBookings"), icon: Calendar },
    { title: t('walkHistory', language), url: createPageUrl("WalkHistory"), icon: History },
    { title: t('notifications', language), url: createPageUrl("Notifications"), icon: Bell, hasNotifications: true },
    { title: language === 'pt' ? 'Hall da Fama' : language === 'es' ? 'Salón de la Fama' : 'Hall of Fame', url: createPageUrl("Gamification"), icon: Trophy, id: "nav-gamification" },
  ];

  const professionalMenu = [
    { title: language === 'pt' ? 'Tornar-me Profissional' : language === 'es' ? 'Ser Profesional' : 'Become Professional', url: createPageUrl("BecomeProfessional"), icon: PlusCircle },
    { title: t('ownerMembership', language), url: createPageUrl("OwnerSubscriptions"), icon: Crown }
  ];

  const adminMenu = authUser?.role === 'admin' ? [
    { title: t('adminDashboard', language), url: createPageUrl("AdminDashboard"), icon: ShieldCheck },
    { title: getMenuText('verifyWalkers'), url: createPageUrl("AdminDashboard?tab=applications"), icon: User },
    { title: getMenuText('approveAds'), url: createPageUrl("ApproveAnnouncements"), icon: Megaphone },
    { title: getMenuText('paymentSetup'), url: createPageUrl("PaymentSetup"), icon: Shield },
    { title: getMenuText('verifyShelters'), url: createPageUrl("AdminShelterVerification"), icon: Building2 },
    { title: "Static Export", url: createPageUrl("StaticExport"), icon: Download },
    // Moderação também aqui para admins
    { title: getMenuText('moderation'), url: createPageUrl("ModerationPanel"), icon: Shield }
  ] : [];

  const companyMenu = authUser?.account_type === 'company' ? [
    { title: getMenuText('myCompany'), url: createPageUrl("PartnerDashboard"), icon: Store },
    ...(authUser?.company_type === 'veterinary' ? [{ title: getMenuText('vetDashboard'), url: createPageUrl("VeterinaryDashboard"), icon: Award }] : [])
  ] : [];

  // Award welcome badge on mount if user doesn't have it
  React.useEffect(() => {
    const awardWelcomeBadge = async () => {
      if (!authUser?.email) return;
      
      const badges = authUser.achievements_badges || [];
      const hasWelcomeBadge = badges.some(b => b.badge_id === 'welcome');
      
      if (!hasWelcomeBadge) {
        try {
          const badge = {
            badge_id: 'welcome',
            name: language === 'pt' ? 'Bem-vindo à PawCão!' : (language === 'es' ? '¡Bienvenido a PawCão!' : 'Welcome to PawCão!'),
            description: language === 'pt' ? 'Obrigado por se juntar à nossa comunidade!' : (language === 'es' ? '¡Gracias por unirte a nuestra comunidad!' : 'Thanks for joining our community!'),
            icon: '🎉',
            rarity: 'common',
            earned_date: new Date().toISOString(),
            category: 'milestone',
            xp_reward: 50
          };
          
          await base44.auth.updateMe({
            achievements_badges: [...badges, badge],
            gamification_xp: (authUser.gamification_xp || 0) + 50
          });
          
          queryClient.invalidateQueries(['currentUser']);
          setNewBadge(badge);
        } catch (error) {
          console.error('Error awarding welcome badge:', error);
        }
      }
    };
    
    // Delay to ensure user data is loaded and badges are initialized
    if (authUser?.email && authUser.achievements_badges !== undefined) {
      awardWelcomeBadge();
    }
  }, [authUser?.email, authUser?.achievements_badges, language, queryClient]);

  // Ensure Dog Connect profile and UserProfile entity for every user
  React.useEffect(() => {
    const setupProfiles = async () => {
      if (!authUser?.email) return;

      // 1. Setup Dog Connect Stats on User Object (Auth)
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

      // 2. Ensure UserProfile Entity exists (for public access)
      try {
        const profiles = await base44.entities.UserProfile.filter({ user_email: authUser.email });
        if (!profiles || profiles.length === 0) {
          console.log("Creating missing UserProfile entity...");
          await base44.entities.UserProfile.create({
            user_email: authUser.email,
            user_id: authUser.id,
            username: authUser.username, // might be undefined, allowed if optional or handled
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
            is_verified: authUser.is_verified || false
          });
        }
      } catch (err) {
        console.error("Error ensuring UserProfile entity:", err);
      }
    };

    setupProfiles();
  }, [authUser?.email, queryClient]);


  const languageFlags = {
    pt: "🇵🇹",
    en: "🇬🇧",
    es: "🇪🇸"
  };

  const languageNames = {
    pt: "Português",
    en: "English",
    es: "Español"
  };

  const getPlanBadge = () => {
    if (!ownerSubscription) return null;
    const planColors = {
      free: "bg-gray-500",
      basic: "bg-blue-500",
      premium: "bg-purple-500",
      vip: "bg-yellow-500"
    };
    const planIcons = {
      free: "⚡",
      basic: "💼",
      premium: "🥇",
      vip: "👑"
    };
    return {
      color: planColors[ownerSubscription.plan_type] || "bg-gray-500",
      icon: planIcons[ownerSubscription.plan_type] || "⚡",
      name: ownerSubscription.plan_type.toUpperCase()
    };
  };

  const planBadge = getPlanBadge();

  const prefetchWalkers = usePrefetchOnHover(() => 
    prefetchQueries.walkers(queryClient, base44)
  );
  
  const prefetchTrainers = usePrefetchOnHover(() => 
    prefetchQueries.trainers(queryClient, base44)
  );
  
  const prefetchPartners = usePrefetchOnHover(() => 
    prefetchQueries.partners(queryClient, base44)
  );
  
  const prefetchBookings = usePrefetchOnHover(() => 
    prefetchQueries.bookings(queryClient, base44, authUser?.email)
  );

  const getPrefetchHandlers = (item) => {
    if (item.url === createPageUrl("Home")) return prefetchWalkers;
    if (item.url === createPageUrl("Trainers")) return prefetchTrainers;
    if (item.url === createPageUrl("Partners")) return prefetchPartners;
    if (item.url === createPageUrl("MyBookings")) return prefetchBookings;
    return {};
  };

  const handleNavigation = (url) => (e) => {
    e.preventDefault();
    navigate(url);
  };

  const handleNavigationToProfile = (e) => {
    e.preventDefault();
    if (authUser) {
      // Prioritize username for cleaner URLs
      const profileUrl = authUser.username 
        ? createPageUrl(`UserProfile?username=${authUser.username}`)
        : createPageUrl(`UserProfile?id=${authUser.id}`);

      console.log('Navigating to profile:', profileUrl);
      navigate(profileUrl);
    }
  };

  const handleLogout = () => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja sair?' : language === 'es' ? '¿Estás seguro de que quieres cerrar sesión?' : 'Are you sure you want to log out?')) {
      base44.auth.logout();
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-9LBZ1D08FT"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-9LBZ1D08FT');
          `}
        </script>
      </Helmet>
      <style>{`
      :root {
        --primary: 142 76% 36%;
        --primary-foreground: 0 0% 100%;
        --accent: 142 76% 92%;
        --accent-foreground: 142 76% 20%;
        --orb-1: #3b82f6;
        --orb-2: #8b5cf6;
        --orb-primary: #2563eb;
      }

      .glass-panel-dark {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.4);
      }

      .dark-cosmos .glass-panel-dark {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(147, 51, 234, 0.4);
      }

      /* === SAPPHIRE PREMIUM THEME === */

      /* --- 1. MELHORIA NOS BOTÕES (Micro-interações) --- */
        /* Aplica-se a qualquer botão do shadcn ou html padrão */
        button, .button-premium {
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative;
        }

        /* Estado Hover: Sobe levemente */
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Estado Active (Clique): Afunda */
        button:active:not(:disabled) {
          transform: translateY(1px) !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          filter: brightness(0.95);
        }

        /* --- 2. GLASSMORPHISM PREMIUM (Vidro Fosco) --- */
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        /* --- 3. ANIMAÇÃO 4D PARA O SELO (Flutuar) --- */
        @keyframes float-badge {
          0%, 100% { transform: translateY(0px); filter: drop-shadow(0 5px 5px rgba(0,0,0,0.2)); }
          50% { transform: translateY(-8px); filter: drop-shadow(0 15px 10px rgba(0,0,0,0.1)); }
        }
        
        .badge-4d-anim {
          animation: float-badge 4s ease-in-out infinite;
          will-change: transform;
        }
        
        @media (max-width: 768px) {
          [data-sidebar="sidebar"] {
            width: 280px !important;
          }
          input:not([type="checkbox"]):not([type="radio"]), select, textarea {
            width: 100% !important;
            max-width: 100%;
            box-sizing: border-box;
          }
          .table-responsive-card {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
        }

[data-sidebar="sidebar"] {
  position: fixed !important;
  left: 0;
  top: 0;
  z-index: 40;
}

[data-sidebar="sidebar"][data-state="collapsed"] {
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Hide scrollbar when collapsed */
[data-sidebar="sidebar"][data-state="collapsed"] {
  overflow: hidden !important;
}

[data-sidebar="sidebar"][data-state="collapsed"] * {
  overflow: hidden !important;
}

/* Floating button always visible */
.floating-sidebar-trigger {
  display: flex !important;
}

/* Remove trigger from sidebar header */
button[data-sidebar="trigger"] {
  display: none !important;
}

/* Premium glass effect */
[data-sidebar="sidebar"]::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 2rem;
  padding: 1px;
  background: linear-gradient(145deg, rgba(255,255,255,0.3), rgba(255,255,255,0.05));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

/* Ensure main content doesn't shift */
main {
  margin-left: 0 !important;
  width: 100% !important;
}

/* Floating button always visible */
.floating-sidebar-trigger {
  display: flex !important;
}

/* Remove trigger from sidebar header */
button[data-sidebar="trigger"] {
  display: none !important;
}
        `}</style>
      {/* Dynamic Tier-based Aurora Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob"
          style={{ backgroundColor: 'var(--orb-1)', transition: 'background-color 1s ease' }}
        />
        <div 
          className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000"
          style={{ backgroundColor: 'var(--orb-2)', transition: 'background-color 1s ease' }}
        />
        <div 
          className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-blob animation-delay-4000"
          style={{ backgroundColor: 'var(--orb-1)', transition: 'background-color 1s ease' }}
        />
      </div>

      {/* Floating Trigger Button - Always visible */}
      {authUser && (
        <SidebarTrigger className="floating-sidebar-trigger fixed left-4 top-4 backdrop-blur-2xl shadow-2xl rounded-full w-14 h-14 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group bg-green-600 hover:bg-green-700 text-white border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
            <line x1="4" x2="20" y1="12" y2="12"/>
            <line x1="4" x2="20" y1="6" y2="6"/>
            <line x1="4" x2="20" y1="18" y2="18"/>
          </svg>
        </SidebarTrigger>
      )}

      <div className="w-full min-h-screen overflow-x-hidden relative flex flex-col">
        {authUser && (
        <>
        <Sidebar className={`backdrop-blur-2xl border transition-all duration-500 m-4 rounded-[2rem] h-[calc(100vh-2rem)] shadow-2xl fixed left-0 top-0 z-40 overflow-hidden ${
          colors?.isDarkMode 
            ? 'bg-slate-900/30 border-slate-700/20 shadow-purple-900/20' 
            : 'bg-white/30 border-white/40 shadow-blue-900/10'
        }`} collapsible="offcanvas">
          <SidebarHeader className={`border-b p-4 md:p-6 rounded-t-[2rem] transition-all backdrop-blur-xl ${
            colors?.isDarkMode ? 'border-slate-700/30 bg-slate-900/20' : 'border-white/40 bg-white/20'
          }`}>
            <div className="flex items-center justify-center mb-3">
              <Link 
                to={createPageUrl("Home")} 
                className="block hover:opacity-80 transition-opacity group-data-[state=collapsed]:hidden"
              >
                <PawCaoLogo size="default" />
              </Link>
            </div>

            {planBadge && (
              <div className={`mt-3 ${planBadge.color} text-white rounded-lg px-3 py-2 text-center shadow-lg group-data-[state=collapsed]:hidden`}>
                <div className="text-xs font-semibold">
                  {planBadge.icon} {planBadge.name}
                </div>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3 w-full text-xs md:text-sm">
                  <Globe className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  {languageFlags[language]} {languageNames[language]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem onClick={() => setLanguage('pt')} className="cursor-pointer">
                  🇵🇹 Português
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')} className="cursor-pointer">
                  🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('es')} className="cursor-pointer">
                  🇪🇸 Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarHeader>

          <SidebarContent className="p-3 md:p-4 backdrop-blur-sm">
            {/* My Profile - Now in bottom nav */}

            {/* MENU PRINCIPAL */}
            <SidebarGroup className="md:hidden">
              <SidebarGroupLabel className="text-[10px] md:text-xs text-gray-600 px-2 mb-2 font-semibold uppercase">
              {t('mainMenu', language)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
              <SidebarMenu>
                {mainMenu.map((item) => ( 
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`mb-1.5 rounded-lg transition-all ${
                      isRouteActive(item.url)
                        ? `bg-gradient-to-r ${colors?.gradient || 'from-blue-600 to-indigo-600'} text-white hover:opacity-90 shadow-md` 
                        : (item.className || (colors?.isDarkMode ? 'hover:bg-slate-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'))
                    }`}
                  >
                    <Link 
                      to={item.url} 
                      className={`flex items-center gap-3 md:gap-4 px-4 md:px-5 py-2.5 md:py-3 relative ${item.className ? '' : ''}`}
                      {...getPrefetchHandlers(item)}
                    >
                      {isRouteActive(item.url) && (
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                          style={{ backgroundColor: colors?.primary || '#3b82f6' }}
                        />
                      )}
                      <item.icon className={`w-4 h-4 md:w-5 md:h-5 flex-shrink-0 ${item.icon === Zap ? 'text-red-500' : ''}`} />
                      <span className="font-medium text-xs md:text-sm flex-1 min-w-0">
                        {item.title.length > 22 ? (
                          <span className="animate-marquee inline-block whitespace-nowrap">
                            {item.title}
                          </span>
                        ) : (
                          <span className="truncate block">{item.title}</span>
                        )}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                ))}
              </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* MINHA ATIVIDADE */}
            <SidebarGroup>
              <SidebarGroupLabel 
                className={`text-[10px] md:text-xs px-2 cursor-pointer flex items-center justify-between group transition-all py-2 font-semibold uppercase ${
                  colors?.isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setMyActivityExpanded(!myActivityExpanded)}
              >
                <span>{t('myActivity', language)}</span>
                <span className={`transition-transform duration-300 ${myActivityExpanded ? 'rotate-90' : ''}`}>▶</span>
              </SidebarGroupLabel>
              {myActivityExpanded && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {myActivityMenu.map((item) => ( 
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`transition-all duration-200 rounded-lg mb-1 ${
                            isRouteActive(item.url) 
                              ? `bg-gradient-to-r ${colors?.gradient || 'from-blue-600 to-indigo-600'} text-white shadow-md` 
                              : (item.icon === Zap ? 'border border-orange-300 bg-orange-50 hover:bg-orange-100' : (colors?.isDarkMode ? 'hover:bg-slate-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'))
                          }`}
                        >
                          <Link to={item.url} id={item.id} className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-2 md:py-2.5 relative">
                            {isRouteActive(item.url) && (
                              <div 
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                                style={{ backgroundColor: colors?.primary || '#3b82f6' }}
                              />
                            )}
                            <item.icon className={`w-4 h-4 md:w-4 md:h-4 flex-shrink-0 ${item.icon === Zap ? 'text-orange-600' : ''}`} />
                            <span className="font-medium text-xs md:text-sm flex-1 min-w-0 truncate">{item.title}</span>
                            {item.hasNotifications && unreadCount > 0 && (
                              <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 flex-shrink-0">
                                {unreadCount}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>

            {/* PROFISSIONAL - Only show if user is walker/trainer/both */}
            {authUser && (authUser.account_type === 'walker' || authUser.account_type === 'trainer' || authUser.account_type === 'both' || authUser.role === 'admin') && (
            <SidebarGroup>
              <SidebarGroupLabel 
                className={`text-[10px] md:text-xs px-2 cursor-pointer flex items-center justify-between group transition-all py-2 font-semibold uppercase ${
                  colors?.isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setProfessionalServicesExpanded(!professionalServicesExpanded)}
              >
                <span>{getMenuText('becomeProfessional')}</span>
                <span className={`transition-transform duration-300 ${professionalServicesExpanded ? 'rotate-90' : ''}`}>▶</span>
              </SidebarGroupLabel>
              {professionalServicesExpanded && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {professionalMenu.map((item) => ( 
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`transition-all duration-200 rounded-lg mb-1 ${
                            isRouteActive(item.url) 
                              ? `bg-gradient-to-r ${colors?.gradient || 'from-blue-600 to-indigo-600'} text-white shadow-md` 
                              : (colors?.isDarkMode ? 'hover:bg-slate-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700')
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 relative">
                            {isRouteActive(item.url) && (
                              <div 
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                                style={{ backgroundColor: colors?.primary || '#3b82f6' }}
                              />
                            )}
                            <item.icon className="w-4 h-4 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="font-medium text-xs md:text-sm truncate">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              )}
            </SidebarGroup>
            )}

            {/* COMPANY */}
            {companyMenu.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className={`text-[10px] md:text-xs px-2 font-semibold uppercase ${
                  colors?.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {getMenuText('company')}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {companyMenu.map((item) => ( 
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`transition-all duration-200 rounded-lg mb-1 ${
                            isRouteActive(item.url) 
                              ? `bg-gradient-to-r ${colors?.gradient || 'from-blue-600 to-indigo-600'} text-white shadow-md` 
                              : (colors?.isDarkMode ? 'hover:bg-slate-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700')
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 relative">
                            {isRouteActive(item.url) && (
                              <div 
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                                style={{ backgroundColor: colors?.primary || '#3b82f6' }}
                              />
                            )}
                            <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                            <span className="font-medium text-xs md:text-sm truncate">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* ADMINISTRAÇÃO */}
            {adminMenu.length > 0 && ( 
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] md:text-xs text-red-600 px-2 font-semibold uppercase">{getMenuText('administration')}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminMenu.map((item) => ( 
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`transition-all duration-200 rounded-lg mb-1 ${
                            isRouteActive(item.url) 
                              ? 'bg-red-600 text-white shadow-md' 
                              : (colors?.isDarkMode ? 'hover:bg-slate-800 text-gray-300' : 'hover:bg-red-50 text-gray-700')
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 relative">
                            {isRouteActive(item.url) && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-red-400" />
                            )}
                            <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                            <span className="font-medium text-xs md:text-sm truncate">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* BOTÃO DE LOGOUT - NOVO */}
            <SidebarGroup className={`mt-auto border-t pt-3 ${
              colors?.isDarkMode ? 'border-slate-700/60' : 'border-gray-200'
            }`}>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={handleLogout}
                      className={`text-red-600 rounded-lg transition-colors w-full ${
                        colors?.isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-red-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3">
                        <LogOut className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="font-semibold text-xs md:text-sm truncate">
                          {getMenuText('logout')}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            </SidebarContent>
            </Sidebar>
            </>
            )}

            {/* Push Notification Manager */}
            <PushNotificationManager user={authUser} />

            {/* Notification Triggers (invisible) */}
            <NotificationTriggers user={authUser} />

            <main className="flex flex-col min-w-0 pb-20 md:pb-0 w-full relative z-10 mt-0">
            <header className={`px-3 md:px-6 py-2 md:py-3 sticky top-0 z-30 transition-all duration-300 shadow-lg backdrop-blur-xl ${
              colors?.isDarkMode ? 'bg-slate-900/80 border-b border-slate-700/60' : 'bg-white/70 border-b border-white/40'
            }`}>
            <div className="flex items-center gap-2 md:gap-4">

              <Link 
                to={createPageUrl("Home")} 
                className={`${authUser ? "md:hidden" : ""} flex-shrink-0 hover:opacity-80 transition-opacity`}
              >
                <PawCaoLogo size="small" showText={!authUser} />
              </Link>

              {authUser && (
                <div className="hidden md:flex items-center justify-center gap-2 flex-1">
                  {mainMenu.map((item) => (
                    <Link
                      key={item.url}
                      id={item.id}
                      to={item.url}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                        isRouteActive(item.url)
                          ? `bg-gradient-to-r ${colors?.gradient || 'from-blue-600 to-indigo-600'} text-white shadow-md`
                          : (colors?.isDarkMode ? "text-gray-300 hover:bg-slate-800" : "text-gray-600 hover:bg-gray-100")
                      } ${item.className && !isRouteActive(item.url) ? item.className.replace('bg-red-50', '').replace('text-red-600', colors?.isDarkMode ? 'text-gray-300' : 'text-gray-600') : ""}`}
                      >
                      <item.icon className={`w-4 h-4 ${isRouteActive(item.url) ? "text-white" : item.icon === Zap ? "text-red-500" : "text-gray-500"}`} />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                  <Link 
                    id="header-profile"
                    to={authUser.username ? createPageUrl(`UserProfile?username=${authUser.username}`) : createPageUrl(`UserProfile?id=${authUser.id}`)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                      location.pathname.includes('UserProfile')
                        ? `bg-gradient-to-r ${colors?.gradient || 'from-blue-600 to-indigo-600'} text-white shadow-md`
                        : (colors?.isDarkMode ? "text-gray-300 hover:bg-slate-800" : "text-gray-600 hover:bg-gray-100")
                    }`}
                    >
                    <User className={`w-4 h-4 ${location.pathname.includes('UserProfile') ? "text-white" : "text-gray-500"}`} />
                    <span>{t('myProfile', language)}</span>

                  </Link>
                </div>
              )}

              {!authUser && (
                <div className="flex-1"></div>
              )}

              {planBadge && (
                <Badge className={`${planBadge.color} text-white text-[10px] md:text-sm shadow-lg flex-shrink-0 px-2 md:px-3 py-1`}>
                  <span className="hidden sm:inline">{planBadge.icon} </span>
                  {planBadge.name}
                </Badge>
              )}



              {/* Notification Trigger */}
              <div className="relative flex-shrink-0 cursor-pointer mr-2 group" onClick={() => setIsNotificationPanelOpen(true)}>
                <div className="p-2.5 rounded-full hover:bg-red-50 transition-all duration-200 active:scale-95">
                  <Bell className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${unreadCount > 0 ? 'text-red-500 fill-red-100/50' : 'text-gray-500 group-hover:text-red-500'}`} />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 border-[2px] border-white rounded-full transform translate-x-1/4 -translate-y-1/4 shadow-sm animate-in zoom-in duration-300">
                    {unreadCount}
                  </span>
                )}
              </div>

              {!authUser && (
                <Button 
                  onClick={() => base44.auth.redirectToLogin(window.location.href)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-sm"
                  size="sm"
                >
                  {getMenuText('login')}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={`${authUser ? "md:hidden" : ""} h-8 w-8 flex-shrink-0 ml-2`} aria-label="Change language">
                    <Globe className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('pt')}>🇵🇹 PT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')}>🇬🇧 EN</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('es')}>🇪🇸 ES</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
              </header>

          {/* Main Content Area with bottom padding for mobile nav */}
          <div className="flex-1">
            <div className="md:hidden">
              <PullToRefresh>
                {children}
              </PullToRefresh>
            </div>
            <div className="hidden md:block h-full">
              {children}
            </div>
          </div>

          {/* Mobile Navigation Bar */}
          <MobileNavBar user={authUser} unreadCount={unreadCount} onNotificationsClick={() => setIsNotificationPanelOpen(true)} />

          <NotificationArea 
            isOpen={isNotificationPanelOpen} 
            onClose={() => setIsNotificationPanelOpen(false)} 
          />

          {/* Badge Notification */}
          {newBadge && (
            <BadgeNotification 
              badge={newBadge}
              onClose={() => setNewBadge(null)}
            />
          )}

          {authUser && (
            <OnboardingWizard 
              user={authUser}
              steps={[
                {
                  targetId: '#nav-home',
                  title: 'Encontre Ajuda',
                  content: 'Aqui podes encontrar passeadores e treinadores verificados perto de ti.'
                },
                {
                  targetId: '#nav-gamification',
                  title: 'Ganhe Prémios',
                  content: 'Acumule XP em cada passeio e desbloqueie emblemas exclusivos para o teu perfil!'
                },
                {
                  targetId: '#header-profile',
                  title: 'O Teu Perfil',
                  content: 'Aqui vês o teu nível, estatísticas e podes editar as tuas preferências.'
                }
              ]}
            />
          )}

          <footer className={`backdrop-blur-xl border-t transition-colors duration-300 ${
            colors?.isDarkMode ? 'bg-slate-900/80 border-slate-700/60' : 'bg-white/70 border-white/40'
          }`}>
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                  <PawCaoLogo size="default" className="mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    {t('footerTagline', language)}
                  </p>
                  <div className="space-y-2">
                    <a href="mailto:support@pawcao.net" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      support@pawcao.net
                    </a>
                    <a href="https://instagram.com/paw.cao" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                      <Camera className="w-4 h-4" />
                      @Paw.cao
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">{t('services', language)}</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link to={createPageUrl("Home")} className="hover:text-green-600 transition-colors">{t('findWalkers', language)}</Link></li>
                    <li><Link to={createPageUrl("Trainers")} className="hover:text-green-600 transition-colors">{t('findTrainers', language)}</Link></li>
                    <li><Link to={createPageUrl("DogSittingServices")} className="hover:text-green-600 transition-colors">{t('dogSitting', language)}</Link></li>
                    <li><Link to={createPageUrl("Partners")} className="hover:text-green-600 transition-colors">{language === 'pt' ? 'Loja' : language === 'es' ? 'Tienda' : 'Shop'}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">{t('forProfessionals', language)}</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link to={createPageUrl("BecomeWalker")} className="hover:text-green-600 transition-colors">{t('becomeWalker', language)}</Link></li>
                    <li><Link to={createPageUrl("BecomeTrainer")} className="hover:text-green-600 transition-colors">{t('becomeTrainer', language)}</Link></li>
                    <li><Link to={createPageUrl("ProfessionalDashboard")} className="hover:text-green-600 transition-colors">{t('professionalDashboard', language)}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">{t('company', language)}</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li><Link to={createPageUrl("AboutUs")} className="hover:text-green-600 transition-colors">{t('aboutUs', language)}</Link></li>
                    <li><Link to={createPageUrl("Contact")} className="hover:text-green-600 transition-colors">{t('contactUs', language)}</Link></li>
                    <li><Link to={createPageUrl("FAQ")} className="hover:text-green-600 transition-colors">FAQ</Link></li>
                    <li><Link to={createPageUrl("TermsOfService")} className="hover:text-green-600 transition-colors">{t('termsOfService', language)}</Link></li>
                    <li><Link to={createPageUrl("PrivacyPolicy")} className="hover:text-green-600 transition-colors">{t('privacyPolicy', language)}</Link></li>
                    <li><Link to={createPageUrl("CookiesPolicy")} className="hover:text-green-600 transition-colors">{t('cookiesPolicy', language)}</Link></li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  © 2025 PawCão. {t('allRightsReserved', language)}.
                </p>
                <div className="flex items-center gap-2">
                  <PawCaoLogo size="small" showText={false} />
                  <span className="text-sm text-green-700 font-semibold">
                    ✓ {t('verifiedProfessionals', language)}
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <ErrorBoundary>
              <LayoutContent children={children} currentPageName={currentPageName} />
            </ErrorBoundary>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}