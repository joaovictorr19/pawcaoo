import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dog, Home, Calendar, User, PlusCircle, Zap, Heart, CalendarClock, Bell, History, Crown, Store, Award, Globe, Camera, Shield, ShieldCheck, BarChart3, Trophy, Megaphone, Users, LogOut, Building2, Download, MessageCircle, ChevronRight, ChevronLeft } from "lucide-react";
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
import { toast, Toaster } from "sonner";
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

// Query optimization configs
const queryConfig = {
  user: {
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  },
  notifications: {
    staleTime: 30 * 1000,
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 60 * 1000,
  },
  static: {
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  },
};

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = React.useState(false);
  const [myActivityExpanded, setMyActivityExpanded] = React.useState(true);
  const [professionalServicesExpanded, setProfessionalServicesExpanded] = React.useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = React.useState(false);
  const [newBadge, setNewBadge] = React.useState(null);

  // Dictionary for menu translations
  const menuTranslations = {
    shelterArea: { pt: 'Área de Abrigos', es: 'Área de Refugios', en: 'Shelter Area' },
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

  const isRouteActive = (path) => {
    if (!path) return false;
    if (path === createPageUrl("Home") && location.pathname === path) return true;
    if (path !== createPageUrl("Home") && location.pathname.startsWith(path)) return true;
    return location.pathname === path;
  };

  React.useEffect(() => {
    if (location.pathname === '/login' || location.pathname === '/login/') {
      navigate(createPageUrl('Home'), { replace: true });
      toast.info("Redirecionando para a página inicial...");
    }
  }, [location.pathname, navigate]);

  const { data: authUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
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
        return null;
      }
    },
    enabled: !!authUser,
    ...queryConfig.static,
  });

  const unreadCount = notifications?.length || 0;

  useRealtimeNotifications(authUser);

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
    { title: getMenuText('moderation'), url: createPageUrl("ModerationPanel"), icon: Shield }
  ] : [];

  const companyMenu = authUser?.account_type === 'company' ? [
    { title: getMenuText('myCompany'), url: createPageUrl("PartnerDashboard"), icon: Store },
    ...(authUser?.company_type === 'veterinary' ? [{ title: getMenuText('vetDashboard'), url: createPageUrl("VeterinaryDashboard"), icon: Award }] : [])
  ] : [];

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

  const handleLogout = () => {
    if (confirm(language === 'pt' ? 'Tem certeza que deseja sair?' : language === 'es' ? '¿Estás seguro de que quieres cerrar sesión?' : 'Are you sure you want to log out?')) {
      base44.auth.logout();
    }
  };

  return (
    <SidebarProvider>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
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

      <div className="flex w-full h-screen overflow-hidden relative bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Aurora Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className={`absolute top-20 -left-32 w-96 h-96 ${colors?.orb1 || 'bg-blue-400'} rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob`}></div>
          <div className={`absolute top-40 -right-32 w-96 h-96 ${colors?.orb2 || 'bg-indigo-400'} rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000`}></div>
          <div className={`absolute -bottom-32 left-1/3 w-96 h-96 ${colors?.orb1 || 'bg-blue-300'} rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000`}></div>
        </div>

        <div className="flex w-full h-full p-2 gap-2 relative z-10">
          {authUser && (
            <aside 
              className={`backdrop-blur-xl border transition-all duration-500 ease-in-out rounded-2xl shadow-xl flex-shrink-0 flex flex-col overflow-hidden relative ${
                collapsed ? 'w-20' : 'w-80'
              } ${
                colors?.isDarkMode 
                  ? 'bg-slate-900/60' 
                  : 'bg-white/60'
              }`}
              style={{
                borderColor: colors?.isDarkMode ? 'rgba(167, 139, 250, 0.3)' : 'rgba(255, 255, 255, 0.4)',
                boxShadow: colors?.isDarkMode 
                  ? '0 20px 60px rgba(139, 92, 246, 0.15)' 
                  : '0 20px 60px rgba(0, 0, 0, 0.08)'
              }}
            >
              <button 
                onClick={() => setCollapsed(prev => !prev)}
                className={`absolute top-8 -right-3 p-2 rounded-full shadow-lg z-50 cursor-pointer transition-all hover:scale-110 ${
                  colors?.isDarkMode 
                    ? 'bg-violet-600 text-white hover:bg-violet-500' 
                    : 'text-white hover:opacity-90'
                }`}
                style={{
                  backgroundColor: colors?.isDarkMode ? '#8b5cf6' : 'var(--tier-primary, #2563eb)'
                }}
                aria-label="Toggle sidebar"
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              <Sidebar className="flex-1 flex flex-col h-full">
                <SidebarHeader className={`border-b p-4 md:p-6 rounded-t-2xl ${
                  colors?.isDarkMode ? 'border-slate-700/60' : 'border-white/30'
                }`}>
                  {collapsed ? (
                    <div className="flex justify-center">
                      <PawCaoLogo size="small" showText={false} />
                    </div>
                  ) : (
                    <Link to={createPageUrl("Home")} className="block hover:opacity-80 transition-opacity">
                      <PawCaoLogo size="default" />
                    </Link>
                  )}

                  {!collapsed && (
                    <>
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
                            {language === 'pt' ? '🇵🇹 Português' : language === 'es' ? '🇪🇸 Español' : '🇬🇧 English'}
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
                    </>
                  )}
                </SidebarHeader>

                <SidebarContent className="p-3 md:p-4">
                  {/* Menu items - keeping existing implementation */}
                  <SidebarGroup className="md:hidden">
                    {!collapsed && (
                      <SidebarGroupLabel className="text-[10px] md:text-xs text-gray-600 px-2 mb-2 font-semibold uppercase">
                        {t('mainMenu', language)}
                      </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {mainMenu.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild className={`mb-1.5 rounded-lg transition-all ${collapsed ? 'justify-center' : ''} ${isRouteActive(item.url) ? `bg-gradient-to-r ${colors?.gradient || 'from-blue-600 to-indigo-600'} text-white hover:opacity-90 shadow-md` : (item.className || (colors?.isDarkMode ? 'hover:bg-slate-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'))}`}>
                              <Link to={item.url} className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 md:gap-4 px-4 md:px-5'} py-2.5 md:py-3 relative`}>
                                {!collapsed && isRouteActive(item.url) && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full" style={{ backgroundColor: colors?.primary || '#3b82f6' }} />
                                )}
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${item.icon === Zap ? 'text-red-500' : ''}`} />
                                {!collapsed && <span className="font-medium text-xs md:text-sm flex-1 min-w-0 truncate">{item.title}</span>}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>

                  {/* Logout Button */}
                  <SidebarGroup className={`mt-auto border-t pt-3 ${colors?.isDarkMode ? 'border-slate-700/60' : 'border-gray-200'}`}>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton onClick={handleLogout} className={`text-red-600 rounded-lg transition-colors w-full ${collapsed ? 'justify-center' : ''} ${colors?.isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-red-50'}`}>
                            <div className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-2 md:gap-3 px-3 md:px-4'} py-2.5 md:py-3`}>
                              <LogOut className="w-5 h-5 flex-shrink-0" />
                              {!collapsed && <span className="font-semibold text-xs md:text-sm truncate">{getMenuText('logout')}</span>}
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </aside>
          )}

          <main className={`flex-1 flex flex-col min-w-0 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${colors?.isDarkMode ? 'bg-slate-900/60' : 'bg-white/60'}`}
            style={{
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderColor: colors?.isDarkMode ? 'rgba(167, 139, 250, 0.3)' : 'rgba(255, 255, 255, 0.4)',
              border: '1px solid',
              boxShadow: colors?.isDarkMode ? '0 20px 60px rgba(139, 92, 246, 0.15)' : '0 20px 60px rgba(0, 0, 0, 0.08)'
            }}>
            <PushNotificationManager user={authUser} />
            <NotificationTriggers user={authUser} />

            <header className={`px-3 md:px-6 py-2.5 md:py-4 sticky top-0 z-50 transition-all duration-300 backdrop-blur-xl border-b ${colors?.isDarkMode ? 'bg-slate-900/60 border-slate-700/40' : 'bg-white/40 border-white/30'}`}>
              <div className="flex items-center gap-2 md:gap-4">
                {authUser && (
                  <SidebarTrigger className="md:hidden hover:bg-green-100 h-12 w-12 p-3 rounded-xl transition-colors flex-shrink-0 mr-1" aria-label="Toggle sidebar" />
                )}

                <Link to={createPageUrl("Home")} className={`${authUser ? "md:hidden" : ""} flex-shrink-0 hover:opacity-80 transition-opacity`}>
                  <PawCaoLogo size="small" showText={!authUser} />
                </Link>

                {authUser && (
                  <div className="hidden md:flex items-center justify-center gap-2 flex-1">
                    {mainMenu.map((item) => (
                      <Link key={item.url} id={item.id} to={item.url} className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${isRouteActive(item.url) ? `bg-gradient-to-r ${colors?.gradient || 'from-blue-600 to-indigo-600'} text-white shadow-md` : (colors?.isDarkMode ? "text-gray-300 hover:bg-slate-800" : "text-gray-600 hover:bg-gray-100")}`}>
                        <item.icon className={`w-4 h-4 ${isRouteActive(item.url) ? "text-white" : item.icon === Zap ? "text-red-500" : "text-gray-500"}`} />
                        <span>{item.title}</span>
                      </Link>
                    ))}
                    <Link id="header-profile" to={authUser.username ? createPageUrl(`UserProfile?username=${authUser.username}`) : createPageUrl(`UserProfile?id=${authUser.id}`)} className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${location.pathname.includes('UserProfile') ? `bg-gradient-to-r ${colors?.gradient || 'from-blue-600 to-indigo-600'} text-white shadow-md` : (colors?.isDarkMode ? "text-gray-300 hover:bg-slate-800" : "text-gray-600 hover:bg-gray-100")}`}>
                      <User className={`w-4 h-4 ${location.pathname.includes('UserProfile') ? "text-white" : "text-gray-500"}`} />
                      <span>{t('myProfile', language)}</span>
                    </Link>
                  </div>
                )}

                {!authUser && <div className="flex-1"></div>}

                {planBadge && (
                  <Badge className={`${planBadge.color} text-white text-[10px] md:text-sm shadow-lg flex-shrink-0 px-2 md:px-3 py-1`}>
                    <span className="hidden sm:inline">{planBadge.icon} </span>
                    {planBadge.name}
                  </Badge>
                )}

                <div className="relative flex-shrink-0 cursor-pointer mr-2 group" onClick={() => setIsNotificationPanelOpen(true)}>
                  <div className="p-2.5 rounded-full hover:bg-red-50 transition-all duration-200 active:scale-95">
                    <Bell className={`w-5 h-5 md:w-6 md:h-6 transition-colors ${unreadCount > 0 ? 'text-red-500 fill-red-100/50' : 'text-gray-500 group-hover:text-red-500'}`} />
                  </div>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 border-[2px] border-white rounded-full transform translate-x-1/4 -translate-y-1/4 shadow-sm">
                      {unreadCount}
                    </span>
                  )}
                </div>

                {!authUser && (
                  <Button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="btn-sapphire shadow-sm" size="sm">
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

            <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
              <div className="md:hidden">
                <PullToRefresh>
                  {children}
                </PullToRefresh>
              </div>
              <div className="hidden md:block">
                {children}
              </div>
            </div>

            <MobileNavBar user={authUser} unreadCount={unreadCount} onNotificationsClick={() => setIsNotificationPanelOpen(true)} />

            <NotificationArea isOpen={isNotificationPanelOpen} onClose={() => setIsNotificationPanelOpen(false)} />

            {newBadge && <BadgeNotification badge={newBadge} onClose={() => setNewBadge(null)} />}

            {authUser && (
              <OnboardingWizard 
                user={authUser}
                steps={[
                  { targetId: '#nav-home', title: 'Encontre Ajuda', content: 'Aqui podes encontrar passeadores e treinadores verificados perto de ti.' },
                  { targetId: '#nav-gamification', title: 'Ganhe Prémios', content: 'Acumule XP em cada passeio e desbloqueie emblemas exclusivos para o teu perfil!' },
                  { targetId: '#header-profile', title: 'O Teu Perfil', content: 'Aqui vês o teu nível, estatísticas e podes editar as tuas preferências.' }
                ]}
              />
            )}

            <footer className={`backdrop-blur-xl border-t transition-colors duration-300 ${colors?.isDarkMode ? 'bg-slate-900/60 border-slate-700/40' : 'bg-white/40 border-white/30'}`}>
              <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                  <div>
                    <PawCaoLogo size="default" className="mb-4" />
                    <p className="text-sm text-gray-600 mb-4">{t('footerTagline', language)}</p>
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
                  <p className="text-sm text-gray-600">© 2025 PawCão. {t('allRightsReserved', language)}.</p>
                  <div className="flex items-center gap-2">
                    <PawCaoLogo size="small" showText={false} />
                    <span className="text-sm text-green-700 font-semibold">✓ {t('verifiedProfessionals', language)}</span>
                  </div>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <HelmetProvider>
      <LanguageProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <LayoutContent children={children} currentPageName={currentPageName} />
          </ErrorBoundary>
        </ThemeProvider>
        <Toaster position="top-right" duration={3000} visibleToasts={3} closeButton richColors toastOptions={{style: {zIndex: 9999}}} />
      </LanguageProvider>
    </HelmetProvider>
  );
}