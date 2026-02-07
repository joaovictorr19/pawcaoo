import React from "react";
import { Link, useLocation, useNavigate, NavLink } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dog, Home, Calendar, User, PlusCircle, Zap, Heart, CalendarClock, HomeIcon, Bell, History, Crown, Gift, Store, Award, Globe, Camera, Shield, ShieldCheck, BarChart3, Trophy, GraduationCap, Megaphone, ShoppingBag, Sparkles, LogOut, Building2, Download, MessageCircle, Users, CreditCard, AlertCircle, Search } from "lucide-react";
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
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import NotificationArea from "@/components/notifications/NotificationArea";
import PullToRefresh from "@/components/ui/PullToRefresh";
import BadgeNotification from "@/components/gamification/BadgeNotification";
import PushNotificationManager from "@/components/notifications/PushNotificationManager";
import { useRealtimeNotifications } from "@/components/notifications/useRealtimeNotifications";
import NotificationTriggers from "@/components/notifications/NotificationTriggers";
import DynamicBackground from "@/components/ui/DynamicBackground";
import { useModalCleanup } from "@/components/ui/ModalCleanup";
import SEOManager from "@/components/SEOManager";
import MobileOptimizations from "@/components/ui/MobileOptimizations";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";

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
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // CRITICAL: Global modal cleanup to prevent frozen UI
  useModalCleanup();

  // SEO Manager - Dynamic title and metadata
  const seoManager = <SEOManager />;

  // Impersonation check
  const impersonationData = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('impersonation') || 'null');
    } catch {
      return null;
    }
  }, []);

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

        // XP is managed in UserProfile entity only - read from there
        if (userData?.email) {
          try {
            const profiles = await base44.entities.UserProfile.filter({ user_email: userData.email });
            if (profiles.length > 0) {
              userData.gamification_xp = profiles[0].gamification_xp || 0;
              userData.gamification_level = profiles[0].gamification_level || 1;
            }
          } catch (e) {
            console.log('XP read skipped');
          }
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



  const { data: ownerSubscription } = useQuery({
    queryKey: ['ownerSubscription'],
    queryFn: async () => {
      if (!authUser?.email) return null;
      try {
        const subs = await base44.entities.OwnerSubscription.filter({
          owner_email: authUser.email,
          is_active: true
        }, '-created_date', 1);
        return Array.isArray(subs) ? subs[0] : null;
      } catch (error) {
        return null;
      }
    },
    enabled: !!authUser?.email,
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const unreadCount = notifications?.length || 0;

  // Realtime notifications disabled to improve performance
  // useRealtimeNotifications(authUser);

  // CRITICAL: Close notification panel and search on route change
  React.useEffect(() => {
    setIsNotificationPanelOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut for search (Ctrl/Cmd + K)
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

  // Definição clara dos grupos de menu para evitar problemas de índice
  const mainMenu = [
    { 
      title: language === 'pt' ? 'Profissionais' : language === 'es' ? 'Profesionales' : 'Professionals', 
      url: createPageUrl("Home"), 
      icon: Users, 
      id: "nav-home" 
    },
    { 
      title: language === 'pt' ? 'Comunidade' : language === 'es' ? 'Comunidad' : 'Community', 
      url: createPageUrl("SocialFeed"), 
      icon: Globe 
    },
    { 
      title: language === 'pt' ? 'Loja & Parceiros' : 'Shop & Partners',
      url: createPageUrl("Shop"),
      icon: ShoppingBag
    },
    { 
      title: language === 'pt' ? 'Passeio de Emergência' : (t('postEmergency', language) || 'Emergency Walk'), 
      url: createPageUrl("PostEmergency"), 
      icon: Zap, 
      className: "text-red-600 font-bold bg-red-50 hover:bg-red-100" 
    },
    { 
      title: language === 'pt' ? 'Painel Profissional' : (t('professionalDashboard', language) || 'Professional Dashboard'), 
      url: (authUser?.account_type === 'walker' || authUser?.account_type === 'trainer' || authUser?.account_type === 'both') 
        ? createPageUrl("ProfessionalDashboard") 
        : createPageUrl("BecomeProfessional"), 
      icon: BarChart3 
    }
  ];

  const myActivityMenu = [
    { title: t('myFavorites', language), url: createPageUrl("Favorites"), icon: Heart },
    { title: t('myBookings', language), url: createPageUrl("MyBookings"), icon: Calendar },
    { title: language === 'pt' ? 'Painel Cliente' : 'Client Dashboard', url: createPageUrl("ClientDashboard"), icon: BarChart3 },
    { title: language === 'pt' ? 'Mensagens' : 'Messages', url: createPageUrl("Chat"), icon: MessageCircle },
    { title: t('walkHistory', language), url: createPageUrl("WalkHistory"), icon: History },
    { title: language === 'pt' ? 'Minhas Encomendas' : 'My Orders', url: createPageUrl("MyOrders"), icon: ShoppingBag },
    { title: language === 'pt' ? 'Lista de Desejos' : 'Wishlist', url: createPageUrl("MyWishlist"), icon: Heart },
    { title: t('notifications', language), url: createPageUrl("Notifications"), icon: Bell, hasNotifications: true },
    { title: language === 'pt' ? 'Hall da Fama' : language === 'es' ? 'Salón de la Fama' : 'Hall of Fame', url: createPageUrl("Gamification"), icon: Trophy, id: "nav-gamification" },
    { title: language === 'pt' ? 'Programa Afiliados' : language === 'es' ? 'Programa de Afiliados' : 'Affiliate Program', url: createPageUrl("AffiliateDashboard"), icon: Users },
  ];

  const professionalMenu = [
    { title: t('ownerMembership', language), url: createPageUrl("OwnerSubscriptions"), icon: Crown }
  ];

  const adminMenu = authUser?.role === 'admin' ? [
          { title: t('adminDashboard', language), url: createPageUrl("AdminDashboard"), icon: ShieldCheck },
          { title: "Teste Pagamentos", url: createPageUrl("TestPayments"), icon: CreditCard },
          { title: getMenuText('verifyWalkers'), url: createPageUrl("AdminDashboard?tab=applications"), icon: User },
          { title: "Shop Hub", url: createPageUrl("AdminShopHub"), icon: Store },
          { title: language === 'pt' ? 'Gestão de Loja' : 'Shop Management', url: createPageUrl("AdminProductManagement"), icon: ShoppingBag },
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

  // RESET SYSTEM: Welcome badge sem XP automático (sistema começa do zero)
  // Badge de boas-vindas apenas se não tiver nenhum badge ainda
  const welcomeBadgeAwardedRef = React.useRef(false);
  
  React.useEffect(() => {
    const awardWelcomeBadge = async () => {
      if (!authUser?.email || welcomeBadgeAwardedRef.current) return;

      const badges = authUser.achievements_badges || [];
      const hasWelcomeBadge = badges.some(b => b.badge_id === 'welcome');

      // Só dar badge de boas-vindas se ainda não tiver NENHUM badge
      if (!hasWelcomeBadge && badges.length === 0) {
        welcomeBadgeAwardedRef.current = true;
        try {
          const badge = {
            badge_id: 'welcome',
            name: language === 'pt' ? 'Bem-vindo à PawCão!' : (language === 'es' ? '¡Bienvenido a PawCão!' : 'Welcome to PawCão!'),
            description: language === 'pt' ? 'Obrigado por se juntar à nossa comunidade!' : (language === 'es' ? '¡Gracias por unirte a nuestra comunidad!' : 'Thanks for joining our community!'),
            icon: 'Award',
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

  // Ensure Dog Connect profile and UserProfile entity for every user + Sync XP bidirectionally
  const profileSetupRef = React.useRef({ initialized: false, syncedXP: null });
  
  React.useEffect(() => {
    const setupProfiles = async () => {
      if (!authUser?.email || profileSetupRef.current.initialized) return;
      
      profileSetupRef.current.initialized = true;

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

      // 2. Ensure UserProfile Entity exists + Sync XP bidirectionally
      try {
        const profiles = await base44.entities.UserProfile.filter({ user_email: authUser.email });
        if (!profiles || profiles.length === 0) {
          console.log("Creating missing UserProfile entity...");
          await base44.entities.UserProfile.create({
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
            is_verified: authUser.is_verified || false
          });
        } else {
          // 3. SYNC: UserProfile -> Auth User (if different)
          const profile = profiles[0];
          const currentXPKey = `${profile.gamification_xp}_${profile.gamification_level}`;
          
          if (profileSetupRef.current.syncedXP !== currentXPKey &&
              (authUser.gamification_xp !== profile.gamification_xp || 
               authUser.gamification_level !== profile.gamification_level)) {
            console.log('🔄 Syncing XP from UserProfile to Auth:', profile.gamification_xp);
            profileSetupRef.current.syncedXP = currentXPKey;
            await base44.auth.updateMe({
              gamification_xp: profile.gamification_xp || 0,
              gamification_level: profile.gamification_level || 1
            });
            queryClient.invalidateQueries(['currentUser']);
          }
        }
      } catch (err) {
        console.error("Error ensuring UserProfile entity:", err);
      }
    };

    setupProfiles();
  }, [authUser?.email]);
  
  // Reset initialization when user changes
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

  const getPlanBadge = () => {
    if (!ownerSubscription) return null;
    const planColors = {
      free: "bg-gray-500",
      basic: "bg-blue-500",
      premium: "bg-purple-500",
      vip: "bg-yellow-500"
    };
    const planIcons = {
      free: "Free",
      basic: "Basic",
      premium: "Premium",
      vip: "VIP"
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
  

  
  const prefetchBookings = usePrefetchOnHover(() => 
    prefetchQueries.bookings(queryClient, base44, authUser?.email)
  );

  const getPrefetchHandlers = (item) => {
    if (item.url === createPageUrl("Home")) return prefetchWalkers;
    if (item.url === createPageUrl("Trainers")) return prefetchTrainers;
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

  // Global unhandled rejection handler with safety checks
  React.useEffect(() => {
    const handleUnhandledRejection = (event) => {
      try {
        const reason = event.reason;
        console.error('🔴 Unhandled Promise Rejection:', reason);
        
        // Prevent generic "Script error." or empty stack traces from crashing error reporters
        if (!reason || typeof reason !== 'object' || !reason.stack) {
          // If reason is not an error with stack, we log it but don't let it bubble as a crash
          // This helps prevent "undefined is not an object (evaluating 'stack.match')" in some parsers
          console.warn('Promise rejected with non-error reason:', reason);
        }
        
        event.preventDefault(); // Prevent default browser error UI
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

  console.log('🎨 Layout render - User:', authUser?.email || 'none', 'Loading:', isLoadingUser);

  return (
    <SidebarProvider>
      <MobileOptimizations />
      {seoManager}
      <ImpersonationBanner />
      <Helmet>
        <title>
          {language === 'pt' ? 'PawCão - O melhor para o seu Pet' :
           language === 'es' ? 'PawCão - Lo mejor para tu Mascota' :
           language === 'fr' ? 'PawCão - Le meilleur pour votre Animal' :
           'PawCão - The best for your Pet'}
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/logo.png" />

        {/* SEO Meta Tags */}
        <meta name="description" content={
          language === 'pt' ? 'Encontre Dog Walkers, Pet Sitters, Seguros e Produtos exclusivos em Portugal, Espanha e França.' :
          language === 'es' ? 'Encuentra Paseadores, Entrenadores, Seguros y Productos exclusivos en Portugal, España y Francia.' :
          language === 'fr' ? 'Trouvez des Promeneurs, Garde d\'animaux, Assurances et Produits exclusifs au Portugal, Espagne et France.' :
          'Find Dog Walkers, Pet Sitters, Insurance and Exclusive Products in Portugal, Spain and France.'
        } />
        <meta name="keywords" content="Passeador de cães, Treinador de cães, Pet Sitter Portugal, Cuidador de animais exóticos, Paseador de perros, Adiestrador canino, Cuidadores de mascotas España, Promeneur de chien, Garde d'animaux, Pet Sitter France, Dressage canin, Pension pour animaux" />
        <meta name="author" content="PawCão" />
        <link rel="canonical" href="https://pawcao.net" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="PawCão" />
        <meta property="og:title" content="PawCão - O melhor cuidado para o seu animal" />
        <meta property="og:description" content="Encontre passeadores, treinadores e cuidadores de exóticos de confiança em Portugal, Espanha e França. Rastreamento GPS e pagamentos seguros." />
        <meta property="og:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907b3be1ec43db5676a2085/22126cf76_Gemini_Generated_Image_6i8f4m6i8f4m6i8f.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${window.location.protocol}//${window.location.host}${window.location.pathname}`} />
        <meta property="og:locale" content="pt_PT" />
        <meta property="og:locale:alternate" content="es_ES" />
        <meta property="og:locale:alternate" content="fr_FR" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PawCão - O melhor cuidado para o seu animal" />
        <meta name="twitter:description" content="Encontre passeadores, treinadores e cuidadores de exóticos de confiança em PT, ES e FR." />
        <meta name="twitter:image" content="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907b3be1ec43db5676a2085/22126cf76_Gemini_Generated_Image_6i8f4m6i8f4m6i8f.jpg" />
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
        --color-orb-1: #fb923c;
        --color-orb-2: #fdba74;
        --color-primary: #f97316;
        --background: transparent;
      }

      body, #root {
      background: #f8fafc;
      }

      /* CRITICAL: Prevent click blocking from overlays */
      .fixed {
      pointer-events: auto;
      }

      .fixed > * {
      pointer-events: auto;
      }

      .glass-panel-dark {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.6);
      }

      .dark-cosmos .glass-panel-dark {
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(147, 51, 234, 0.6);
      }

      /* Fix for transparent forms/dialogs */
      [role="dialog"], 
      .dialog-content,
      form {
        background: rgba(255, 255, 255, 0.98) !important;
        backdrop-filter: blur(20px);
      }

      .dark-cosmos [role="dialog"], 
      .dark-cosmos .dialog-content,
      .dark-cosmos form {
        background: rgba(15, 23, 42, 0.98) !important;
      }

      /* === SAPPHIRE PREMIUM THEME === */

      /* --- 1. MELHORIA NOS BOTÕES (Micro-interações) --- */
        /* Aplica-se a qualquer botão do shadcn ou html padrão */
        button, .button-premium, a[role="button"] {
          transition: all 0.1s ease-out !important;
          position: relative;
          cursor: pointer !important;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        /* Estado Hover: Sobe levemente */
        button:hover:not(:disabled),
        a[role="button"]:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        /* Estado Active (Clique): Resposta instantânea */
        button:active:not(:disabled),
        a[role="button"]:active {
          transform: translateY(0px) scale(0.98) !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.05s ease-out !important;
        }

        /* CRITICAL: Garante que todos os elementos dentro de botões/links ativos permaneçam 100% visíveis */
        button:active:not(:disabled) *,
        button:active:not(:disabled) span,
        button:active:not(:disabled) svg,
        button:active:not(:disabled) path,
        a:active *,
        a:active span,
        a:active svg,
        a:active path {
          opacity: 1 !important;
          color: inherit !important;
        }

        /* CRITICAL: Force ALL sidebar elements to stay 100% visible on ALL states */
        [data-sidebar] a,
        [data-sidebar] a *,
        [data-sidebar] a > *,
        [data-sidebar] a span,
        [data-sidebar] a svg,
        [data-sidebar] a svg *,
        [data-sidebar] a path,
        [data-sidebar] button,
        [data-sidebar] button *,
        [data-sidebar] button > *,
        [data-sidebar] button span,
        [data-sidebar] button svg,
        [data-sidebar] button svg *,
        [data-sidebar] button path {
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Force visibility on interaction states - preserve text color */
        [data-sidebar] a:hover,
        [data-sidebar] a:hover > *,
        [data-sidebar] a:hover span,
        [data-sidebar] a:hover svg,
        [data-sidebar] a:hover svg *,
        [data-sidebar] a:hover path,
        [data-sidebar] button:hover,
        [data-sidebar] button:hover *,
        [data-sidebar] button:hover > *,
        [data-sidebar] a:focus,
        [data-sidebar] a:focus *,
        [data-sidebar] a:focus > *,
        [data-sidebar] button:focus,
        [data-sidebar] button:focus *,
        [data-sidebar] button:focus > * {
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Active state - only force visibility, not color */
        [data-sidebar] a:active,
        [data-sidebar] a:active > *,
        [data-sidebar] button:active,
        [data-sidebar] button:active > * {
          opacity: 1 !important;
          visibility: visible !important;
          transition: transform 0.1s !important;
        }

        /* Links ativos na sidebar sempre com texto e ícones BRANCOS */
        [data-sidebar] a[class*="from-blue-600"],
        [data-sidebar] a[class*="from-blue-600"] *,
        [data-sidebar] a[class*="from-blue-600"] span,
        [data-sidebar] a[class*="from-blue-600"] svg,
        [data-sidebar] a[class*="from-blue-600"] path,
        [data-sidebar] a[class*="bg-gradient"],
        [data-sidebar] a[class*="bg-gradient"] *,
        [data-sidebar] a[class*="bg-gradient"] span,
        [data-sidebar] a[class*="bg-gradient"] svg,
        [data-sidebar] a[class*="bg-gradient"] path {
          opacity: 1 !important;
          color: white !important;
        }

        /* Links vermelhos (emergency) sempre com texto BRANCO quando ativos */
        [data-sidebar] a[class*="from-red-"],
        [data-sidebar] a[class*="from-red-"] *,
        [data-sidebar] a[class*="from-red-"] span,
        [data-sidebar] a[class*="from-red-"] svg,
        [data-sidebar] a[class*="from-red-"] path,
        [data-sidebar] a[class*="bg-red-6"],
        [data-sidebar] a[class*="bg-red-6"] *,
        [data-sidebar] a[class*="bg-red-6"] span,
        [data-sidebar] a[class*="bg-red-6"] svg,
        [data-sidebar] a[class*="bg-red-6"] path {
          opacity: 1 !important;
          color: white !important;
        }

        /* Badge de notificação sempre visível */
        .bg-red-500,
        .bg-red-500 * {
          opacity: 1 !important;
        }

        /* Estado Disabled: Mantém visibilidade */
        button:disabled {
          cursor: not-allowed !important;
          opacity: 0.7 !important;
        }

        /* Força renderização de SVGs em Windows/todos dispositivos */
        svg {
          display: block !important;
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

        /* --- 4. MOTOR DE 3 ORBS COM ROTAÇÃO COMPLEXA --- */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes blob-rotate {
          0% { transform: translate(0px, 0px) rotate(0deg) scale(1); }
          33% { transform: translate(30px, -50px) rotate(120deg) scale(1.2); }
          66% { transform: translate(-20px, 20px) rotate(240deg) scale(0.9); }
          100% { transform: translate(0px, 0px) rotate(360deg) scale(1); }
        }

        .animate-spin-slow {
          animation: spin-slow 60s linear infinite;
        }

        .animate-blob-1 {
          animation: blob-rotate 23s infinite ease-in-out;
        }

        .animate-blob-2 {
          animation: blob-rotate 29s infinite ease-in-out reverse;
        }

        .animate-blob-3 {
          animation: blob-rotate 31s infinite ease-in-out;
        }

        /* Legacy animations for compatibility */
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        .animate-blob {
          animation: blob 20s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @media (max-width: 768px) {
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
        
        /* Sidebar glassmorphism - consistent across all devices */
        [data-sidebar="sidebar"] {
          background: rgba(255, 255, 255, 0.92) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
        }
        
        /* Mobile sidebar sheet/drawer - extra specificity */
        [data-state="open"][role="dialog"] {
          background: transparent !important;
        }
        
        [data-state="open"][role="dialog"] > div:last-child,
        [vaul-drawer] {
          background: rgba(255, 255, 255, 0.96) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
        }
        
        /* Sidebar scroll area */
        [data-radix-scroll-area-viewport] {
          background: transparent !important;
        }
        
        /* CRITICAL: Remove any background overrides that might block gradients */
        [data-sidebar] button[class*="bg-gradient"],
        [data-sidebar] a[class*="bg-gradient"],
        [data-sidebar] button[class*="from-"],
        [data-sidebar] a[class*="from-"],
        [data-sidebar] button[class*="bg-red"],
        [data-sidebar] a[class*="bg-red"] {
          background: revert !important;
        }

        /* Default state for non-gradient items */
        [data-sidebar] button:not([class*="bg-gradient"]):not([class*="from-"]):not([class*="bg-red"]),
        [data-sidebar] a:not([class*="bg-gradient"]):not([class*="from-"]):not([class*="bg-red"]) {
          background-color: transparent;
        }

        /* Hover for non-gradient items */
        [data-sidebar] button:not([class*="bg-gradient"]):not([class*="from-"]):not([class*="bg-red"]):hover,
        [data-sidebar] a:not([class*="bg-gradient"]):not([class*="from-"]):not([class*="bg-red"]):hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        `}</style>
      {/* Dynamic Background - Orbs that change color based on user tier */}
      <DynamicBackground />

      {/* ========== HEADER PREMIUM FLUTUANTE ========== */}
      {/* Desktop Header - Flutuante ao lado da Sidebar */}
      <header 
        className="hidden md:block fixed top-[10px] z-[99999] px-3 py-1.5 right-[15px]"
        style={{
          left: authUser ? '295px' : '15px',
          background: authUser ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: authUser ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          boxShadow: authUser ? '0 2px 15px rgba(0, 0, 0, 0.06)' : '0 1px 10px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 w-full h-9">
          {/* Menu de Navegação Desktop */}
          <nav className="flex items-center justify-center flex-1 px-2">
            <div className="flex items-center gap-1 lg:gap-2">
              {authUser ? (
                // Menu completo para usuários logados
                mainMenu.map((item) => (
                <Link
                  key={item.url}
                  id={item.id}
                  to={item.url}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.url);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 whitespace-nowrap ${
                    isRouteActive(item.url)
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${isRouteActive(item.url) ? "text-white" : item.icon === Zap ? "text-red-500" : ""}`} />
                    <span className="hidden lg:inline">{item.title}</span>
                  </Link>
                ))
              ) : (
                // Menu simplificado para visitantes (não logados)
                <>
                  <button
                    onClick={() => navigate(createPageUrl("Home"))}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      location.pathname === createPageUrl("Home") && !location.search.includes('tab=')
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden lg:inline">{language === 'pt' ? 'Início' : language === 'es' ? 'Inicio' : 'Home'}</span>
                  </button>
                  <button
                    onClick={() => navigate(createPageUrl("Shop"))}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      location.pathname === createPageUrl("Shop")
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="hidden lg:inline">{language === 'pt' ? 'Loja' : 'Shop'}</span>
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* Ações Direita */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="h-8 w-8 rounded-lg"
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </Button>
            {!authUser && (
              <Button 
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="bg-gray-800 text-white hover:bg-gray-900 shadow-sm text-xs px-3 h-8"
                size="sm"
              >
                {getMenuText('login')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Header - Minimalista com glassmorphism */}
      <header 
        className="md:hidden fixed top-0 left-0 right-0 z-[99999] px-3 py-1.5"
        style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="flex items-center justify-between h-10">
          {/* Logo + Menu Trigger */}
          <div className="flex items-center gap-2">
            {authUser && (
              <SidebarTrigger 
                className="h-9 w-9 p-2 rounded-xl transition-all active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
                aria-label="Menu" 
              />
            )}
            <Link to={createPageUrl("Home")} className="hover:opacity-80 transition-opacity">
              <PawCaoLogo size="small" showText={false} />
            </Link>
          </div>

          {/* Direita - Pesquisa, Login/Notificações */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="h-8 w-8 rounded-lg active:scale-95 transition-transform"
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}
              aria-label="Search"
            >
              <Search className="w-3.5 h-3.5 text-gray-700" />
            </Button>
            {authUser ? (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 relative rounded-lg active:scale-95 transition-transform"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
                onClick={() => setIsNotificationPanelOpen(true)}
              >
                <Bell className="w-3.5 h-3.5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            ) : (
              <Button 
                onClick={() => base44.auth.redirectToLogin(window.location.href)}
                className="bg-gray-800 text-white text-xs px-3 h-8 rounded-lg shadow-sm active:scale-95 transition-transform"
                size="sm"
              >
                {getMenuText('login')}
              </Button>
            )}
          </div>
        </div>
      </header>
      {/* ========== FIM HEADER ========== */}

      <div className="flex flex-col w-full max-w-[100vw] min-h-screen relative z-10" style={{ marginTop: '64px' }}>
        {/* Espaçamento extra para desktop onde o header é flutuante */}
        <div className="hidden md:block" style={{ height: '26px' }} />
        {/* Container para sidebar e conteúdo */}
        <div className="flex flex-1 w-full">
        {authUser && (
                      <Sidebar 
                        className="border transition-colors duration-300 md:ml-4 md:mr-4 md:mb-4 md:mt-8 shadow-lg overflow-hidden shrink-0"
                        style={{ 
                          height: 'calc(100vh - 130px)',
                          background: 'rgba(255, 255, 255, 0.96)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          borderColor: 'rgba(0, 0, 0, 0.08)',
                          borderRadius: 0,
                          '--sidebar-background': 'rgba(255, 255, 255, 0.96)',
                        }}>
          <SidebarContent className="p-0">
            <SidebarNav 
              user={authUser} 
              unreadCount={unreadCount} 
              onLogout={handleLogout} 
            />
            </SidebarContent>
            </Sidebar>
            )}

            {/* Push Notification Manager */}
            <PushNotificationManager user={authUser} />

            {/* Notification Triggers (invisible) */}
            <NotificationTriggers user={authUser} />

          {/* Main Content Area with bottom padding for mobile nav */}
          <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0 relative z-10 bg-transparent w-full overflow-x-hidden">
            {/* Breadcrumbs */}
            <Breadcrumbs />

            <div className="flex-1 relative pb-24 md:pb-8 px-0">
              <div className="md:hidden">
                <PullToRefresh>
                  <div className="relative mb-24" style={{ zIndex: 1 }}>
                    {children}
                  </div>
                </PullToRefresh>
              </div>
              <div className="hidden md:block h-full">
                <div className="relative mb-8" style={{ zIndex: 1 }}>
                  {children}
                </div>
              </div>
            </div>

            {/* Mobile Navigation Bar */}
            {authUser && (
              <MobileNavBar user={authUser} unreadCount={unreadCount} onNotificationsClick={() => setIsNotificationPanelOpen(true)} />
            )}

            {/* Global Search Modal */}
            <GlobalSearch 
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
            />

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
                    title: language === 'pt' ? 'Bem-vindo à PawCão!' : 'Welcome to PawCão!',
                    content: language === 'pt' 
                      ? 'Encontra passeadores e treinadores verificados perto de ti. Todos passam por verificação de segurança!'
                      : 'Find verified walkers and trainers near you. All go through security verification!'
                  },
                  {
                    targetId: '#header-profile',
                    title: language === 'pt' ? 'O Teu Perfil' : 'Your Profile',
                    content: language === 'pt'
                      ? 'Adiciona os teus cães, edita preferências e acompanha o teu nível e estatísticas.'
                      : 'Add your dogs, edit preferences and track your level and stats.'
                  },
                  {
                    targetId: '#nav-gamification',
                    title: language === 'pt' ? 'Ganha Prémios!' : 'Earn Rewards!',
                    content: language === 'pt'
                      ? 'Acumula XP em cada passeio, desbloqueia emblemas e sobe no ranking da comunidade!'
                      : 'Earn XP on every walk, unlock badges and climb the community ranking!'
                  }
                ]}
              />
            )}

            <footer className="mt-16 backdrop-blur-2xl border-t transition-colors duration-300 relative z-0 bg-white/30 border-white/40 w-full">
              <div className="max-w-7xl mx-auto px-6 py-8 w-full">
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
                      <li><Link to={createPageUrl("Shop")} className="hover:text-green-600 transition-colors">{language === 'pt' ? 'Loja' : language === 'es' ? 'Tienda' : 'Shop'}</Link></li>
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
                    <div className="flex items-center gap-1 text-green-700 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-sm">{t('verifiedProfessionals', language)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          </div>
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
              <ErrorBoundary>
                <LayoutContent children={children} currentPageName={currentPageName} />
              </ErrorBoundary>
            </ToastProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </LanguageProvider>
    </HelmetProvider>
  );
}