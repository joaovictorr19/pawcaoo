
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dog, Home, Calendar, User, PlusCircle, Zap, Heart, MessageCircle, CalendarClock, HomeIcon, Bell, History, Crown, Gift, Store, Award, Globe, TrendingUp, Camera, Shield, ShieldCheck, BarChart3, Trophy, GraduationCap, CreditCard, Megaphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 300000, // 5 minutes - increased cache time
    retry: 1, // Only retry once
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
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes instead of constantly
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
    staleTime: 300000, // 5 minutes - increased cache time
  });

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Cleanup
    };
  }, []);

  const unreadCount = notifications?.length || 0;

  const navigationItems = [
    { title: t('findWalkers', language), url: createPageUrl("Home"), icon: Dog },
    { title: t('findTrainers', language), url: createPageUrl("Trainers"), icon: Award },
    { title: t('postEmergency', language), url: createPageUrl("PostEmergency"), icon: Zap },
    { title: t('dogSitting', language), url: createPageUrl("DogSittingServices"), icon: HomeIcon },
    { title: t('pawcaoShop', language), url: createPageUrl("Partners"), icon: Store },
    { title: "🏥 " + (language === 'pt' ? 'Serviços' : 'Services'), url: createPageUrl("PartnerServices"), icon: Award },
    { title: "🐾 Comunidade", url: createPageUrl("Community"), icon: MessageCircle },
    { title: "🐕 Dog Connect", url: createPageUrl("SocialFeed"), icon: Camera },
    { title: "📅 Eventos", url: createPageUrl("SocialEvents"), icon: Calendar },
    { title: t('myFavorites', language), url: createPageUrl("Favorites"), icon: Heart },
    { title: t('myBookings', language), url: createPageUrl("MyBookings"), icon: Calendar },
    { title: t('scheduledWalks', language), url: createPageUrl("ScheduledWalks"), icon: CalendarClock },
    { title: t('walkHistory', language), url: createPageUrl("WalkHistory"), icon: History },
    { title: t('messages', language), url: createPageUrl("Messages"), icon: MessageCircle },
    { title: t('notifications', language), url: createPageUrl("Notifications"), icon: Bell, hasNotifications: true },
    { title: t('loyaltyRewards', language), url: createPageUrl("LoyaltyRewards"), icon: Gift },
    { title: t('leaderboard', language), url: createPageUrl("Leaderboard"), icon: Trophy },
    { title: t('professionalDashboard', language), url: createPageUrl("ProfessionalDashboard"), icon: BarChart3 },
    { title: t('becomeWalker', language), url: createPageUrl("BecomeWalker"), icon: PlusCircle },
    { title: t('becomeTrainer', language), url: createPageUrl("BecomeTrainer"), icon: GraduationCap },
    { title: t('manageAvailability', language), url: createPageUrl("ManageAvailability"), icon: CalendarClock },
    { title: t('walkerSubscriptions', language), url: createPageUrl("Subscriptions"), icon: Crown },
    { title: t('ownerMembership', language), url: createPageUrl("OwnerSubscriptions"), icon: Crown },
  ];

  const adminItem = user?.role === 'admin' ? [
    { title: t('adminDashboard', language), url: createPageUrl("AdminDashboard"), icon: ShieldCheck },
    { title: "📢 " + (language === 'pt' ? 'Aprovar Anúncios' : 'Approve Ads'), url: createPageUrl("ApproveAnnouncements"), icon: Megaphone },
    { title: "⚙️ " + (language === 'pt' ? 'Config. Pagamentos' : 'Payment Setup'), url: createPageUrl("PaymentSetup"), icon: Shield }
  ] : [];

  const moderatorItem = (user?.role === 'admin' || user?.social_role === 'moderator' || user?.social_role === 'admin') ? [
    { title: "🛡️ " + (language === 'pt' ? 'Moderação' : 'Moderation'), url: createPageUrl("ModerationPanel"), icon: Shield }
  ] : [];

  const companyItem = user?.account_type === 'company' ? [
    { title: "🏢 " + (language === 'pt' ? 'Minha Empresa' : 'My Company'), url: createPageUrl("PartnerDashboard"), icon: Store } 
  ] : [];

  const veterinaryItem = user?.account_type === 'company' && user?.company_type === 'veterinary' ? [
    { title: "🏥 " + (language === 'pt' ? 'Painel Veterinário' : 'Vet Dashboard'), url: createPageUrl("VeterinaryDashboard"), icon: Award }
  ] : [];

  const stripeConnectItem = (user?.account_type === 'walker' || user?.account_type === 'trainer' || user?.account_type === 'both') ? [
    { title: "💰 Stripe Connect", url: createPageUrl("StripeConnectSetup"), icon: CreditCard }
  ] : [];

  const allNavigationItems = [...navigationItems, ...adminItem, ...moderatorItem, ...companyItem, ...veterinaryItem, ...stripeConnectItem];

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

  const handleNavigation = (url) => (e) => {
    e.preventDefault();
    window.location.href = url;
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
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
        <Sidebar className="border-r border-green-100 bg-white">
          <SidebarHeader className="border-b border-green-100 p-6">
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
                  {planBadge.icon} {planBadge.name} MEMBER
                </div>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3 w-full">
                  <Globe className="w-4 h-4 mr-2" />
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
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      className={`hover:bg-purple-100 hover:text-purple-700 transition-all duration-200 rounded-xl mb-3 ${
                        location.pathname === createPageUrl("MyProfile") ? 'bg-purple-100 text-purple-700 shadow-sm' : ''
                      } border-2 border-purple-200 bg-purple-50`}
                    >
                      <a 
                        href={createPageUrl("MyProfile")} 
                        className="flex items-center gap-3 px-4 py-3"
                        onClick={handleNavigation(createPageUrl("MyProfile"))}
                      >
                        <User className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold">{t('myProfile', language)} & {language === 'pt' ? 'Config.' : 'Settings'}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500 px-2">{t('mainMenu', language)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allNavigationItems.slice(0, 9).map((item) => ( 
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 hover:text-green-700 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url ? 'bg-green-100 text-green-700 shadow-sm' : ''
                        } ${item.icon === Zap ? 'border-2 border-orange-200 hover:bg-orange-50 hover:text-orange-700' : ''}`}
                      >
                        <a 
                          href={item.url} 
                          className="flex items-center gap-3 px-4 py-3"
                          onClick={handleNavigation(item.url)}
                        >
                          <item.icon className={`w-5 h-5 ${item.icon === Zap ? 'text-orange-500' : ''}`} />
                          <span className="font-medium">{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500 px-2">{t('myActivity', language)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allNavigationItems.slice(9, 17).map((item) => ( 
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 hover:text-green-700 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url ? 'bg-green-100 text-green-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                          {item.hasNotifications && unreadCount > 0 && (
                            <Badge className="ml-auto bg-red-500 text-white">
                              {unreadCount}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500 px-2">{t('professionalServices', language)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allNavigationItems.slice(17, 23).map((item) => ( 
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 hover:text-green-700 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url ? 'bg-green-100 text-green-700 shadow-sm' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {allNavigationItems.length > 23 && ( 
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs text-gray-500 px-2">{language === 'pt' ? 'Administração' : 'Administration'}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {allNavigationItems.slice(23).map((item) => ( 
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-purple-100 hover:text-purple-700 transition-all duration-200 rounded-xl mb-2 ${
                            location.pathname === item.url ? 'bg-purple-100 text-purple-700 shadow-sm' : ''
                          } border-2 border-purple-200 bg-purple-50`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5 text-purple-600" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              <SidebarTrigger className="md:hidden hover:bg-green-100 p-2 rounded-lg transition-colors" />

              <Link to={createPageUrl("Home")} className="md:hidden">
                <PawCaoLogo size="small" showText={false} />
              </Link>

              <div className="hidden md:flex items-center gap-3 flex-1">
                <PawCaoLogo size="small" showText={false} />
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {currentPageName && currentPageName.replace(/([A-Z])/g, ' $1').trim()}
                </h1>
              </div>

              {planBadge && (
                <Badge className={`${planBadge.color} text-white text-xs md:text-sm shadow-lg`}>
                  <span className="hidden sm:inline">{planBadge.icon} </span>
                  {planBadge.name}
                </Badge>
              )}

              {unreadCount > 0 && (
                <Link to={createPageUrl("Notifications")} className="ml-auto md:ml-0">
                  <Badge className="bg-red-500 text-white px-2 md:px-3 py-1 hover:bg-red-600 transition-colors cursor-pointer shadow-lg">
                    <Bell className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                    <span className="hidden sm:inline">{unreadCount}</span>
                  </Badge>
                </Link>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
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
                    <li><Link to={createPageUrl("Partners")} className="hover:text-green-600 transition-colors">{t('pawcaoShop', language)}</Link></li>
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
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}
