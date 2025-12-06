import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dog, Home, Calendar, User, PlusCircle, Zap, Heart, MessageCircle, CalendarClock, HomeIcon, Bell, History, Crown, Gift, Store, Award, Globe, TrendingUp, Camera, Shield, ShieldCheck, BarChart3, Trophy, GraduationCap, CreditCard, Megaphone, ShoppingBag, Sparkles, Users, LogOut, Building2, Download } from "lucide-react";
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
import PawCaoLogo from "@/components/PawCaoLogo";
import { toast, Toaster } from "sonner";
import { HelmetProvider } from 'react-helmet-async';

// Query optimization configs
const queryConfig = {
  user: {
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  },
  notifications: {
    staleTime: 10 * 1000,
    cacheTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  },
  static: {
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
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
  const { language, setLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [myActivityExpanded, setMyActivityExpanded] = React.useState(false);
  const [professionalServicesExpanded, setProfessionalServicesExpanded] = React.useState(false);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    ...queryConfig.user,
    retry: 1,
  });

  const { data: notifications } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      if (!user?.email) return [];
      const allNotifications = await base44.entities.Notification.filter({ 
        recipient_email: user.email,
        is_read: false 
      });
      return allNotifications;
    },
    enabled: !!user,
    initialData: [],
    ...queryConfig.notifications,
  });

  const { data: ownerSubscription } = useQuery({
    queryKey: ['ownerSubscription'],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.OwnerSubscription.filter({
        owner_email: user.email,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!user,
    ...queryConfig.static,
  });

  const unreadCount = notifications?.length || 0;

  const navigationItems = [
    // MENU PRINCIPAL - Serviços core
    { title: t('findWalkers', language), url: createPageUrl("Home"), icon: Dog },
    // { title: t('findTrainers', language), url: createPageUrl("Trainers"), icon: Award },
    // { title: t('dogSitting', language), url: createPageUrl("DogSittingServices"), icon: HomeIcon },
    // { title: language === 'pt' ? 'Loja' : language === 'es' ? 'Tienda' : 'Shop', url: createPageUrl("Partners"), icon: ShoppingBag },
    // { title: language === 'pt' ? 'Serviços' : language === 'es' ? 'Servicios' : 'Services', url: createPageUrl("PartnerServices"), icon: Store },
    // { title: t('loyaltyRewards', language), url: createPageUrl("LoyaltyRewards"), icon: Gift },
    { title: t('adoptAPet', language), url: createPageUrl("AdoptionListings"), icon: Home },

    // Shelter Dashboard (Visible to all for easy access in this demo, typically would be conditional)
    { title: language === 'pt' ? 'Área de Abrigos' : language === 'es' ? 'Área de Refugios' : 'Shelter Area', url: createPageUrl("ShelterDashboard"), icon: Building2 },

    // MENSAGENS (especial)
    { title: t('messages', language), url: createPageUrl("Messages"), icon: MessageCircle, isSpecial: true },

    // CONNECT - Rede Social (now a highlighted button)
    // { title: "Connect", url: createPageUrl("SocialFeed"), icon: Users },

    // MINHA ATIVIDADE
    { title: language === 'pt' ? 'Meu Dashboard' : language === 'es' ? 'Mi Panel' : 'My Dashboard', url: createPageUrl("OwnerDashboard"), icon: BarChart3 },
    { title: t('myFavorites', language), url: createPageUrl("Favorites"), icon: Heart },
    { title: t('myBookings', language), url: createPageUrl("MyBookings"), icon: Calendar },
    { title: t('scheduledWalks', language), url: createPageUrl("ScheduledWalks"), icon: CalendarClock },
    { title: t('walkHistory', language), url: createPageUrl("WalkHistory"), icon: History },
    { title: t('notifications', language), url: createPageUrl("Notifications"), icon: Bell, hasNotifications: true },
    { title: t('leaderboard', language), url: createPageUrl("Leaderboard"), icon: Trophy },
    { title: language === 'pt' ? 'Emblemas' : language === 'es' ? 'Emblemas' : 'Badges', url: createPageUrl("Gamification"), icon: Award },
    { title: t('postEmergency', language), url: createPageUrl("PostEmergency"), icon: Zap },
    
    // SERVIÇOS PROFISSIONAIS
    { title: t('becomeWalker', language), url: createPageUrl("BecomeWalker"), icon: PlusCircle },
    // { title: t('becomeTrainer', language), url: createPageUrl("BecomeTrainer"), icon: GraduationCap },
    { title: t('professionalDashboard', language), url: createPageUrl("ProfessionalDashboard"), icon: BarChart3 },
    { title: t('manageAvailability', language), url: createPageUrl("ManageAvailability"), icon: CalendarClock },
    { title: t('walkerSubscriptions', language), url: createPageUrl("Subscriptions"), icon: Crown },
    { title: t('ownerMembership', language), url: createPageUrl("OwnerSubscriptions"), icon: Crown },
  ];

  const adminItem = user?.role === 'admin' ? [
    { title: t('adminDashboard', language), url: createPageUrl("AdminDashboard"), icon: ShieldCheck },
    { title: language === 'pt' ? 'Verificar Passeadores' : 'Verify Walkers', url: createPageUrl("AdminDashboard?tab=applications"), icon: User },
    { title: language === 'pt' ? 'Aprovar Anúncios' : language === 'es' ? 'Aprobar Anuncios' : 'Approve Ads', url: createPageUrl("ApproveAnnouncements"), icon: Megaphone },
    { title: language === 'pt' ? 'Config. Pagamentos' : language === 'es' ? 'Config. Pagos' : 'Payment Setup', url: createPageUrl("PaymentSetup"), icon: Shield },
    { title: language === 'pt' ? 'Verificar Abrigos' : language === 'es' ? 'Verificar Refugios' : 'Verify Shelters', url: createPageUrl("AdminShelterVerification"), icon: Building2 },
    { title: "Static Export", url: createPageUrl("StaticExport"), icon: Download }
    ] : [];

  const moderatorItem = (user?.social_role === 'moderator' || user?.social_role === 'admin') ? [
    { title: language === 'pt' ? 'Moderação' : language === 'es' ? 'Moderación' : 'Moderation', url: createPageUrl("ModerationPanel"), icon: Shield }
  ] : [];

  const companyItem = user?.account_type === 'company' ? [
    { title: language === 'pt' ? 'Minha Empresa' : 'My Company', url: createPageUrl("PartnerDashboard"), icon: Store } 
  ] : [];

  const veterinaryItem = user?.account_type === 'company' && user?.company_type === 'veterinary' ? [
    { title: language === 'pt' ? 'Painel Veterinário' : 'Vet Dashboard', url: createPageUrl("VeterinaryDashboard"), icon: Award }
  ] : [];

  const stripeConnectItem = (user?.account_type === 'walker' || user?.account_type === 'trainer' || user?.account_type === 'both') ? [
    { title: "Stripe Connect", url: createPageUrl("StripeConnectSetup"), icon: CreditCard }
  ] : [];

  const allNavigationItems = [...navigationItems, ...adminItem, ...moderatorItem, ...companyItem, ...veterinaryItem, ...stripeConnectItem];

  const mainMenuCount = 2; // Apenas Passeadores e Adotar
  const messagesIndex = mainMenuCount;
  const connectIndex = messagesIndex + 1; // Renamed from dogConnectIndex
  const myActivityStartIndex = connectIndex + 1;
  const myActivityCount = 9; // Dashboard + 8 items (includes Badges)
  const professionalServicesStartIndex = myActivityStartIndex + myActivityCount;
  const professionalServicesCount = 6;
  
  const mainMenuStartIndex = 0;
  const mainMenuEndIndex = mainMenuStartIndex + mainMenuCount;
  const myActivityEndIndex = myActivityStartIndex + myActivityCount;
  const professionalServicesEndIndex = professionalServicesStartIndex + professionalServicesCount;
  const adminAndOtherStartIndex = professionalServicesEndIndex;

  // Award welcome badge on mount if user doesn't have it
  React.useEffect(() => {
    const awardWelcomeBadge = async () => {
      if (!user?.email) return;
      
      const badges = user.achievements_badges || [];
      const hasWelcomeBadge = badges.some(b => b.badge_id === 'welcome');
      
      if (!hasWelcomeBadge) {
        try {
          const newBadge = {
            badge_id: 'welcome',
            name: language === 'pt' ? 'Bem-vindo à PawCão!' : (language === 'es' ? '¡Bienvenido a PawCão!' : 'Welcome to PawCão!'),
            description: language === 'pt' ? 'Obrigado por se juntar à nossa comunidade!' : (language === 'es' ? '¡Gracias por unirte a nuestra comunidad!' : 'Thanks for joining our community!'),
            icon: '🎉',
            rarity: 'common',
            earned_date: new Date().toISOString(),
            category: 'milestone'
          };
          
          await base44.auth.updateMe({
            achievements_badges: [...badges, newBadge],
            gamification_xp: (user.gamification_xp || 0) + 50
          });
          
          queryClient.invalidateQueries(['currentUser']);
          toast.success(language === 'pt' ? '🎉 Emblema de Boas-Vindas conquistado! +50 XP' : (language === 'es' ? '🎉 ¡Emblema de Bienvenida obtenido! +50 XP' : '🎉 Welcome Badge earned! +50 XP'));
        } catch (error) {
          console.error('Error awarding welcome badge:', error);
        }
      }
    };
    
    // Delay to ensure user data is loaded and badges are initialized
    if (user?.email && user.achievements_badges !== undefined) {
      awardWelcomeBadge();
    }
  }, [user?.email, user?.achievements_badges, language, queryClient]);

  // Ensure Dog Connect profile for every user
  React.useEffect(() => {
    const setupDogConnectProfile = async () => {
      if (!user?.email) return;
      
      // Check if user has Dog Connect stats
      if (user.profile_stats === undefined || user.profile_stats === null) {
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
    };
    
    setupDogConnectProfile();
  }, [user?.email, queryClient]);


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
    prefetchQueries.bookings(queryClient, base44, user?.email)
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
    window.location.href = url;
  };

  const handleNavigationToProfile = (e) => {
    e.preventDefault();
    if (user?.id) {
      // Usando ID para maior privacidade na URL
      const profileUrl = createPageUrl(`UserProfile?id=${user.id}`);
      console.log('Navigating to profile:', profileUrl);
      window.location.href = profileUrl;
    } else {
      toast.error('Erro ao carregar perfil. Faça login novamente.');
    }
  };

  const handleLogout = () => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja sair?' : language === 'es' ? '¿Estás seguro de que quieres cerrar sesión?' : 'Are you sure you want to log out?')) {
      base44.auth.logout();
    }
  };

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary: 142 76% 36%;
          --primary-foreground: 0 0% 100%;
          --accent: 142 76% 92%;
          --accent-foreground: 142 76% 20%;
        }
        
        @media (max-width: 768px) {
          [data-sidebar="sidebar"] {
            width: 280px !important;
          }
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
        {user && (
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-200 p-4 md:p-6">
            <a 
              href={createPageUrl("Home")} 
              className="block hover:opacity-80 transition-opacity"
              onClick={handleNavigation(createPageUrl("Home"))}
            >
              <PawCaoLogo size="default" />
            </a>

            {planBadge && (
              <div className={`mt-3 ${planBadge.color} text-white rounded-lg px-3 py-2 text-center shadow-lg`}>
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

          <SidebarContent className="p-3 md:p-4">
            {/* My Profile - Now redirects to UserProfile */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      className={`hover:bg-gray-100 transition-all duration-200 rounded-lg mb-3 ${
                        location.pathname.includes('UserProfile') ? 'bg-green-600 text-white' : 'border border-gray-200 text-gray-700'
                      }`}
                    >
                      <a 
                        href={user?.id ? createPageUrl(`UserProfile?id=${user.id}`) : '#'} 
                        className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3"
                        onClick={handleNavigationToProfile}
                      >
                        <User className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="font-semibold text-xs md:text-sm truncate">{t('myProfile', language)}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* MENU PRINCIPAL - PROFISSIONAL */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] md:text-xs text-gray-600 px-2 mb-2 font-semibold uppercase">
                {t('mainMenu', language)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allNavigationItems.slice(mainMenuStartIndex, mainMenuEndIndex).map((item) => ( 
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`mb-1.5 rounded-lg transition-colors ${
                          location.pathname === item.url 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <a 
                          href={item.url} 
                          className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3"
                          onClick={handleNavigation(item.url)}
                          {...getPrefetchHandlers(item)}
                        >
                          <item.icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                          <span className="font-medium text-xs md:text-sm truncate">{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* MENSAGENS - BOTÃO DESTACADO */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      className={`mb-3 rounded-lg ${
                        location.pathname === allNavigationItems[messagesIndex].url 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      <a 
                        href={allNavigationItems[messagesIndex].url} 
                        className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-3.5"
                        onClick={handleNavigation(allNavigationItems[messagesIndex].url)}
                      >
                        <MessageCircle className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                        <span className="font-bold text-sm md:text-base truncate">{allNavigationItems[messagesIndex].title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* CONNECT - Botão Destacado */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      className={`mb-3 rounded-lg ${
                        location.pathname === allNavigationItems[connectIndex].url 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700' 
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 border border-blue-200'
                      }`}
                    >
                      <a 
                        href={allNavigationItems[connectIndex].url} 
                        className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-3 md:py-3.5"
                        onClick={handleNavigation(allNavigationItems[connectIndex].url)}
                      >
                        <Users className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                        <span className="font-bold text-sm md:text-base truncate">{allNavigationItems[connectIndex].title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* MINHA ATIVIDADE */}
            <SidebarGroup>
              <SidebarGroupLabel 
                className="text-[10px] md:text-xs text-gray-600 px-2 cursor-pointer hover:text-gray-900 flex items-center justify-between group transition-all py-2 font-semibold uppercase"
                onClick={() => setMyActivityExpanded(!myActivityExpanded)}
              >
                <span>{t('myActivity', language)}</span>
                <span className={`transition-transform duration-300 ${myActivityExpanded ? 'rotate-90' : ''}`}>▶</span>
              </SidebarGroupLabel>
              {myActivityExpanded && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {allNavigationItems.slice(myActivityStartIndex, myActivityEndIndex).map((item) => ( 
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-gray-100 transition-all duration-200 rounded-lg mb-1 ${
                            location.pathname === item.url ? 'bg-green-600 text-white' : 'text-gray-700'
                          } ${item.icon === Zap ? 'border border-orange-300 bg-orange-50 hover:bg-orange-100' : ''}`}
                        >
                          <Link to={item.url} className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5">
                            <item.icon className={`w-4 h-4 md:w-4 md:h-4 flex-shrink-0 ${item.icon === Zap ? 'text-orange-600' : ''}`} />
                            <span className="font-medium text-xs md:text-sm truncate">{item.title}</span>
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

            {/* TORNAR-ME PROFISSIONAL */}
            <SidebarGroup>
              <SidebarGroupLabel 
                className="text-[10px] md:text-xs text-gray-600 px-2 cursor-pointer hover:text-gray-900 flex items-center justify-between group transition-all py-2 font-semibold uppercase"
                onClick={() => setProfessionalServicesExpanded(!professionalServicesExpanded)}
              >
                <span>{language === 'pt' ? 'Tornar-me Profissional' : language === 'es' ? 'Ser Profesional' : 'Become Professional'}</span>
                <span className={`transition-transform duration-300 ${professionalServicesExpanded ? 'rotate-90' : ''}`}>▶</span>
              </SidebarGroupLabel>
              {professionalServicesExpanded && (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {allNavigationItems.slice(professionalServicesStartIndex, professionalServicesEndIndex).map((item) => ( 
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-gray-100 transition-all duration-200 rounded-lg mb-1 ${
                            location.pathname === item.url ? 'bg-green-600 text-white' : 'text-gray-700'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5">
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

            {allNavigationItems.slice(adminAndOtherStartIndex).length > 0 && ( 
              <SidebarGroup>
                <SidebarGroupLabel className="text-[10px] md:text-xs text-gray-600 px-2 font-semibold uppercase">{language === 'pt' ? 'Administração' : 'Administration'}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {allNavigationItems.slice(adminAndOtherStartIndex).map((item) => ( 
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-gray-100 transition-all duration-200 rounded-lg mb-1 ${
                            location.pathname === item.url ? 'bg-green-600 text-white' : 'text-gray-700'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-2.5">
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
            <SidebarGroup className="mt-auto border-t border-gray-200 pt-3">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={handleLogout}
                      className="hover:bg-red-50 text-red-600 rounded-lg transition-colors w-full"
                    >
                      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3">
                        <LogOut className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="font-semibold text-xs md:text-sm truncate">
                          {language === 'pt' ? 'Sair' : language === 'es' ? 'Salir' : 'Logout'}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            </SidebarContent>
            </Sidebar>
            )}

            <main className="flex-1 flex flex-col min-w-0">
            <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 px-3 md:px-6 py-2.5 md:py-4 sticky top-0 z-10">
            <div className="flex items-center gap-2 md:gap-4">
              {user && (
                <SidebarTrigger className="md:hidden hover:bg-green-100 p-2 rounded-lg transition-colors flex-shrink-0" aria-label="Toggle sidebar" />
              )}

              <a 
                href={createPageUrl("Home")} 
                className={`${user ? "md:hidden" : ""} flex-shrink-0 hover:opacity-80 transition-opacity`}
                onClick={handleNavigation(createPageUrl("Home"))}
              >
                <PawCaoLogo size="small" showText={!user} />
              </a>

              {user && currentPageName !== 'Home' && (
                <div className="hidden md:flex items-center gap-3 flex-1 min-w-0">
                  <a 
                    href={createPageUrl("Home")}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={handleNavigation(createPageUrl("Home"))}
                  >
                    <PawCaoLogo size="small" showText={false} />
                  </a>
                  <h1 className="text-base md:text-lg font-semibold text-gray-900 truncate">
                    {currentPageName && currentPageName.replace(/([A-Z])/g, ' $1').trim()}
                  </h1>
                </div>
              )}

              {!user && (
                <div className="flex-1"></div>
              )}

              {planBadge && (
                <Badge className={`${planBadge.color} text-white text-[10px] md:text-sm shadow-lg flex-shrink-0 px-2 md:px-3 py-1`}>
                  <span className="hidden sm:inline">{planBadge.icon} </span>
                  {planBadge.name}
                </Badge>
              )}

              {unreadCount > 0 && (
                <Link to={createPageUrl("Notifications")} className="ml-auto md:ml-0 flex-shrink-0">
                  <Badge className="bg-red-500 text-white px-2 md:px-3 py-1 hover:bg-red-600 transition-colors cursor-pointer shadow-lg">
                    <Bell className="w-3 h-3 md:w-4 h-4 md:mr-1" />
                    <span className="hidden sm:inline ml-1">{unreadCount}</span>
                  </Badge>
                </Link>
              )}

              {!user && !isLoadingUser && (
                <Button 
                  onClick={() => window.location.href = base44.auth.getLoginUrl()}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
                  size="sm"
                >
                  {language === 'pt' ? 'Entrar' : language === 'es' ? 'Entrar' : 'Login'}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className={`${user ? "md:hidden" : ""} h-8 w-8 flex-shrink-0 ml-2`} aria-label="Change language">
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

          <div className="flex-1 overflow-auto">
            {children}
          </div>

          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                  <PawCaoLogo size="default" className="mb-4" />
                  <p className="text-sm text-gray-600">
                    {t('footerTagline', language)}
                  </p>
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
                    <li><Link to={createPageUrl("Subscriptions")} className="hover:text-green-600 transition-colors">{t('walkerSubscriptions', language)}</Link></li>
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
        <LayoutContent children={children} currentPageName={currentPageName} />
        <Toaster />
      </LanguageProvider>
    </HelmetProvider>
  );
}