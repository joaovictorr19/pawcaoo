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

import PawGoFab from "@/components/ui/PawGoFab";
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
        // 1. Check for impersonation
        const impersonation = JSON.parse(localStorage.getItem('impersonation'));
        let userData = null;

        if (impersonation?.targetUserId) {
          // Verify real admin session first
          const realUser = await base44.auth.me();
          if (realUser?.role === 'admin') {
            const targets = await base44.entities.User.filter({ id: impersonation.targetUserId });
            if (targets.length > 0) {
              userData = { ...targets[0], isImpersonating: true };
            }
          } else {
            // If not admin anymore, clear impersonation
            localStorage.removeItem('impersonation');
          }
        }

        // 2. Normal login if not impersonating or failed
        if (!userData) {
          userData = await base44.auth.me();
        }

        // XP is managed in UserProfile entity only - read from there
        if (userData?.email) {
          try {
            const profiles = await base44.entities.UserProfile.filter({ user_email: userData.email });
            if (profiles.length > 0) {
              userData.gamification_xp = profiles[0].gamification_xp || 0;
              userData.gamification_level = profiles[0].gamification_level || 1;
            }
          } catch (e) {
            // XP read skipped — non-critical
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

  const adminMenu = authUser?.role === 'admin' ? [
          { title: t('adminDashboard', language), url: createPageUrl("AdminDashboard"), icon: ShieldCheck },
          { title: "Aprovações Profissionais", url: createPageUrl("AdminProfessionalApprovals"), icon: ShieldCheck },
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

      // 2. Ensure UserProfile Entity exists + Sync XP bidirectionally + Global Data Sync
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
            is_verified: authUser.is_verified || false
          });
        } else {
          // 3. SYNC: UserProfile -> Auth User (XP if different)
          const currentXPKey = `${userProfile.gamification_xp}_${userProfile.gamification_level}`;
          
          if (profileSetupRef.current.syncedXP !== currentXPKey &&
              (authUser.gamification_xp !== userProfile.gamification_xp || 
               authUser.gamification_level !== userProfile.gamification_level)) {
            profileSetupRef.current.syncedXP = currentXPKey;
            await base44.auth.updateMe({
              gamification_xp: userProfile.gamification_xp || 0,
              gamification_level: userProfile.gamification_level || 1
            });
            queryClient.invalidateQueries(['currentUser']);
          }
        }

        // 4. UNIFIED SYNC MODEL: Ensure info is shared across all profiles (User, UserProfile, Walker, Trainer)
        try {
          const walkers = await base44.entities.WalkerProfile.filter({ created_by: authUser.email });
          const trainers = await base44.entities.TrainerProfile.filter({ created_by: authUser.email });

          const w = walkers[0];
          const t = trainers[0];

          // Determine best available info
          const bestPhoto = userProfile?.profile_photo_url || authUser.profile_photo_url || w?.photo_url || t?.photo_url;
          const bestCover = userProfile?.cover_photo_url || authUser.cover_photo_url || w?.cover_photo_url || t?.cover_photo_url;
          const bestName = userProfile?.full_name && userProfile.full_name !== 'Utilizador' ? userProfile.full_name : 
                           authUser.full_name && authUser.full_name !== 'Utilizador' ? authUser.full_name : 
                           w?.walker_name || t?.trainer_name || 'Utilizador';
          const bestBio = userProfile?.bio || authUser.bio || w?.bio || t?.bio;
          const bestCity = userProfile?.city || authUser.city || w?.location || t?.location;

          let didUpdates = false;

          // Sync back to UserProfile
          if (userProfile && userProfile.id) {
            const profileUpdates = {};
            if (bestPhoto && userProfile.profile_photo_url !== bestPhoto) profileUpdates.profile_photo_url = bestPhoto;
            if (bestCover && userProfile.cover_photo_url !== bestCover) profileUpdates.cover_photo_url = bestCover;
            if (bestName && userProfile.full_name !== bestName) profileUpdates.full_name = bestName;
            if (bestBio && userProfile.bio !== bestBio) profileUpdates.bio = bestBio;
            if (bestCity && userProfile.city !== bestCity) profileUpdates.city = bestCity;

            if (Object.keys(profileUpdates).length > 0) {
              try {
                await base44.entities.UserProfile.update(userProfile.id, profileUpdates);
                didUpdates = true;
              } catch (e) {
                console.error("Failed to update UserProfile:", e);
              }
            }
          }

          // Sync back to Auth User
          const authUpdates = {};
          if (bestPhoto && authUser.profile_photo_url !== bestPhoto) authUpdates.profile_photo_url = bestPhoto;
          if (bestCover && authUser.cover_photo_url !== bestCover) authUpdates.cover_photo_url = bestCover;
          if (bestName && authUser.full_name !== bestName) authUpdates.full_name = bestName;

          if (Object.keys(authUpdates).length > 0) {
            try {
              await base44.auth.updateMe(authUpdates);
              didUpdates = true;
            } catch (e) {
              console.error("Failed to update AuthUser:", e);
            }
          }

          // Sync back to WalkerProfile
          if (w && w.id) {
            const walkerUpdates = {};
            if (bestPhoto && w.photo_url !== bestPhoto) walkerUpdates.photo_url = bestPhoto;
            if (bestCover && w.cover_photo_url !== bestCover) walkerUpdates.cover_photo_url = bestCover;
            if (bestName && w.walker_name !== bestName) walkerUpdates.walker_name = bestName;
            if (bestBio && !w.bio) walkerUpdates.bio = bestBio;
            if (bestCity && !w.location) walkerUpdates.location = bestCity;

            if (Object.keys(walkerUpdates).length > 0) {
              try {
                await base44.entities.WalkerProfile.update(w.id, walkerUpdates);
                didUpdates = true;
              } catch (e) {
                console.error("Failed to update WalkerProfile:", e);
              }
            }
          }

          // Sync back to TrainerProfile
          if (t && t.id) {
            const trainerUpdates = {};
            if (bestPhoto && t.photo_url !== bestPhoto) trainerUpdates.photo_url = bestPhoto;
            if (bestCover && t.cover_photo_url !== bestCover) trainerUpdates.cover_photo_url = bestCover;
            if (bestName && t.trainer_name !== bestName) trainerUpdates.trainer_name = bestName;
            if (bestBio && !t.bio) trainerUpdates.bio = bestBio;
            if (bestCity && !t.location) trainerUpdates.location = bestCity;

            if (Object.keys(trainerUpdates).length > 0) {
              try {
                await base44.entities.TrainerProfile.update(t.id, trainerUpdates);
                didUpdates = true;
              } catch (e) {
                console.error("Failed to update TrainerProfile:", e);
              }
            }
          }

          if (didUpdates) {
            queryClient.invalidateQueries(['currentUser']);
            queryClient.invalidateQueries(['profileUser']);
            queryClient.invalidateQueries(['myProfessionalProfile']);
          }

        } catch (syncErr) {
          console.error("Error syncing unified profile data:", syncErr);
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
          // Non-error rejection — silently handled
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

  return (
    <SidebarProvider>
      <MobileOptimizations />
      {seoManager}
      <ImpersonationBanner />
      <LayoutSEO />
      {/* GA tag loaded in LayoutSEO. Original Helmet block removed — see LayoutSEO.jsx */}
      <LayoutStyles />
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

                </>
              )}
            </div>
          </nav>

          {/* Ações Direita */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Role Switcher Componentizado */}
            <div className="hidden lg:block">
              <RoleSwitcher authUser={authUser} />
            </div>
            
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
        className="md:hidden fixed top-0 left-0 right-0 z-[99999] px-3 py-2"
        style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="flex items-center justify-center h-12 gap-2 relative">
          {/* Menu Trigger - Left Side */}
          {authUser && (
            <div className="absolute left-0">
              <SidebarTrigger 
                className="h-9 w-9 p-2 rounded-xl transition-all active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0, 0, 0, 0.05)'
                }}
                aria-label="Menu" 
              />
            </div>
          )}

          {/* Centered Logo */}
          <Link 
            to={createPageUrl("Home")} 
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Go to home"
          >
            <PawCaoLogo size="medium" showText={false} />
          </Link>

          {/* Direita - Pesquisa, Login/Notificações */}
          <div className="absolute right-0 flex items-center gap-1 justify-end">
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
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white" aria-label={`${unreadCount} unread notifications`}>
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

            {/* New Notification System (Alerts & Updates) */}
            <NotificationManager />

          {/* Main Content Area with bottom padding for mobile nav */}
          <div className="flex-1 flex flex-col min-w-0 pb-32 md:pb-0 relative z-10 bg-transparent w-full overflow-x-hidden">
            {/* Mobile Header for Child Routes (Back Button + Title) */}
            <MobileHeader />
            
            {/* Breadcrumbs */}
            <Breadcrumbs />

            <div className="flex-1 relative pb-32 md:pb-8 px-0">
              <div className="md:hidden">
                <PullToRefresh>
                  <div className="relative mb-32" style={{ zIndex: 1 }}>
                    <ErrorBoundary>{children}</ErrorBoundary>
                  </div>
                </PullToRefresh>
              </div>
              <div className="hidden md:block h-full">
                <div className="relative mb-8" style={{ zIndex: 1 }}>
                  <ErrorBoundary>{children}</ErrorBoundary>
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

            <div aria-live="polite" aria-label="Notifications">
              <NotificationArea
                isOpen={isNotificationPanelOpen}
                onClose={() => setIsNotificationPanelOpen(false)}
              />
            </div>

            {/* Badge Notification */}
            {newBadge && (
              <BadgeNotification 
                badge={newBadge}
                onClose={() => setNewBadge(null)}
              />
            )}





            <LayoutFooter />
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
                <LayoutContent children={children} currentPageName={currentPageName} />
            </ToastProvider>
          </ThemeProvider>
        </LocalizationProvider>
      </LanguageProvider>
      <PawGoFab />
    </HelmetProvider>
  );
}