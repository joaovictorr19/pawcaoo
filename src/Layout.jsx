
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dog, Home, Calendar, User, PlusCircle, Zap, Heart, MessageCircle, CalendarClock, HomeIcon, Bell, History, Crown, Gift, Store, Award, Globe, TrendingUp } from "lucide-react";
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
  });

  const { data: notifications } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const allNotifications = await base44.entities.Notification.filter({ 
        recipient_email: user?.email,
        is_read: false 
      });
      return allNotifications;
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: ownerSubscription } = useQuery({
    queryKey: ['ownerSubscription'],
    queryFn: async () => {
      const subs = await base44.entities.OwnerSubscription.filter({
        owner_email: user?.email,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!user,
  });

  const unreadCount = notifications?.length || 0;

  const navigationItems = [
    { title: t('findWalkers', language), url: createPageUrl("Home"), icon: Dog },
    { title: t('findTrainers', language), url: createPageUrl("Trainers"), icon: Award },
    { title: t('postEmergency', language), url: createPageUrl("PostEmergency"), icon: Zap },
    { title: t('dogSitting', language), url: createPageUrl("DogSittingServices"), icon: HomeIcon },
    { title: t('pawcaoShop', language), url: createPageUrl("Partners"), icon: Store },
    { title: t('myProfile', language), url: createPageUrl("MyProfile"), icon: User },
    { title: t('myFavorites', language), url: createPageUrl("Favorites"), icon: Heart },
    { title: t('myBookings', language), url: createPageUrl("MyBookings"), icon: Calendar },
    { title: t('scheduledWalks', language), url: createPageUrl("ScheduledWalks"), icon: CalendarClock },
    { title: t('walkHistory', language), url: createPageUrl("WalkHistory"), icon: History },
    { title: t('messages', language), url: createPageUrl("Messages"), icon: MessageCircle },
    { title: t('notifications', language), url: createPageUrl("Notifications"), icon: Bell, hasNotifications: true },
    { title: t('loyaltyRewards', language), url: createPageUrl("LoyaltyRewards"), icon: Gift },
    { title: t('professionalDashboard', language), url: createPageUrl("ProfessionalDashboard"), icon: TrendingUp }, // New item added here
    { title: t('becomeWalker', language), url: createPageUrl("BecomeWalker"), icon: PlusCircle },
    { title: t('becomeTrainer', language), url: createPageUrl("BecomeTrainer"), icon: Award },
    { title: t('manageAvailability', language), url: createPageUrl("ManageAvailability"), icon: CalendarClock },
    { title: t('walkerSubscriptions', language), url: createPageUrl("Subscriptions"), icon: Crown },
    { title: t('ownerMembership', language), url: createPageUrl("OwnerSubscriptions"), icon: Crown },
    { title: t('partnerDashboard', language), url: createPageUrl("PartnerDashboard"), icon: Store },
  ];

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
        <Sidebar className="border-r border-green-100">
          <SidebarHeader className="border-b border-green-100 p-6">
            <Link to={createPageUrl("Home")} className="block hover:opacity-80 transition-opacity">
              <PawCaoLogo size="default" />
            </Link>
            
            {/* Plan Badge */}
            {planBadge && (
              <div className={`mt-3 ${planBadge.color} text-white rounded-lg px-3 py-2 text-center`}>
                <div className="text-xs font-semibold">
                  {planBadge.icon} {planBadge.name} MEMBER
                </div>
              </div>
            )}
            
            {/* Language Selector */}
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
              <SidebarGroupLabel className="text-xs text-gray-500 px-2">{t('mainMenu', language)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.slice(0, 6).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 hover:text-green-700 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url ? 'bg-green-100 text-green-700 shadow-sm' : ''
                        } ${item.icon === Zap ? 'border-2 border-orange-200 hover:bg-orange-50 hover:text-orange-700' : ''}
                        ${item.icon === User ? 'border-2 border-purple-200 bg-purple-50' : ''}`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className={`w-5 h-5 ${item.icon === Zap ? 'text-orange-500' : item.icon === User ? 'text-purple-600' : ''}`} />
                          <span className="font-medium">{item.title}</span>
                        </Link>
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
                  {navigationItems.slice(6, 13).map((item) => ( /* This slice remains correct, includes items up to LoyaltyRewards (index 12) */
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
                  {navigationItems.slice(13, 18).map((item) => ( /* Adjusted slice: starts at the new item (index 13) and ends before OwnerMembership (index 18) */
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

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500 px-2">{t('account', language)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.slice(18).map((item) => ( /* Adjusted slice: starts at OwnerMembership (index 18) */
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
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-green-100 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Mobile Menu Trigger */}
              <SidebarTrigger className="md:hidden hover:bg-green-100 p-2 rounded-lg transition-colors" />

              {/* Logo for Mobile */}
              <Link to={createPageUrl("Home")} className="md:hidden">
                <PawCaoLogo size="small" showText={false} />
              </Link>

              {/* Page Title */}
              <div className="hidden md:block flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {currentPageName && currentPageName.replace(/([A-Z])/g, ' $1').trim()}
                </h1>
              </div>

              {/* Plan Badge */}
              {planBadge && (
                <Badge className={`${planBadge.color} text-white text-xs md:text-sm`}>
                  <span className="hidden sm:inline">{planBadge.icon} </span>
                  {planBadge.name}
                </Badge>
              )}

              {/* Notifications */}
              {unreadCount > 0 && (
                <Link to={createPageUrl("Notifications")} className="ml-auto md:ml-0">
                  <Badge className="bg-red-500 text-white px-2 md:px-3 py-1 hover:bg-red-600 transition-colors cursor-pointer">
                    <Bell className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                    <span className="hidden sm:inline">{unreadCount}</span>
                  </Badge>
                </Link>
              )}
              
              {/* Mobile Language Selector */}
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

          {/* Footer */}
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
                    <li><a href="#about" className="hover:text-green-600 transition-colors">{t('aboutUs', language)}</a></li>
                    <li><a href="#contact" className="hover:text-green-600 transition-colors">{t('contactUs', language)}</a></li>
                    <li><a href="#terms" className="hover:text-green-600 transition-colors">{t('termsOfService', language)}</a></li>
                    <li><a href="#privacy" className="hover:text-green-600 transition-colors">{t('privacyPolicy', language)}</a></li>
                    <li><a href="#cookies" className="hover:text-green-600 transition-colors">{t('cookiePolicy', language)}</a></li>
                  </ul>
                </div>
              </div>
              
              {/* Quick Links Bar */}
              <div className="border-t border-gray-200 pt-6 pb-4">
                <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-600 mb-4">
                  <a href="#about" className="hover:text-green-600 transition-colors font-medium">About</a>
                  <span className="text-gray-300">·</span>
                  <a href="#contact" className="hover:text-green-600 transition-colors font-medium">Contact</a>
                  <span className="text-gray-300">·</span>
                  <a href="#terms" className="hover:text-green-600 transition-colors font-medium">Terms</a>
                  <span className="text-gray-300">·</span>
                  <a href="#privacy" className="hover:text-green-600 transition-colors font-medium">Privacy</a>
                  <span className="text-gray-300">·</span>
                  <a href="#cookies" className="hover:text-green-600 transition-colors font-medium">Cookies</a>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  © 2025 PawCão. {t('allRightsReserved', language)}.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-700 font-semibold">
                  ✓ {t('verifiedProfessionals', language)}
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
