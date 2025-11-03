
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Dog, Home, Calendar, User, PlusCircle, Zap, Heart, MessageCircle, CalendarClock, HomeIcon, Bell, History, Crown, Gift, Store, Award, Globe, TrendingUp, Camera, Shield, ShieldCheck, BarChart3, Trophy, GraduationCap, CreditCard, Moon, Sun } from "lucide-react";
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
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

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
    { title: "💬 Community Forum", url: createPageUrl("Community"), icon: MessageCircle },
    { title: "🐾 Social Feed", url: createPageUrl("SocialFeed"), icon: Camera },
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
    // Removed: { title: t('partnerDashboard', language), url: createPageUrl("PartnerDashboard"), icon: Store },
  ];

  const adminItem = user?.role === 'admin' ? [
    { title: t('adminDashboard', language), url: createPageUrl("AdminDashboard"), icon: ShieldCheck },
    { title: "🏢 " + (language === 'pt' ? 'Painel Parceiros' : 'Partner Dashboard'), url: createPageUrl("PartnerDashboard"), icon: Store },
    { title: "⚙️ " + (language === 'pt' ? 'Config. Pagamentos' : 'Payment Setup'), url: createPageUrl("PaymentSetup"), icon: Shield }
  ] : [];

  const stripeConnectItem = (user?.account_type === 'walker' || user?.account_type === 'trainer' || user?.account_type === 'both') ? [
    { title: "💰 Stripe Connect", url: createPageUrl("StripeConnectSetup"), icon: CreditCard }
  ] : [];

  const allNavigationItems = [...navigationItems, ...adminItem, ...stripeConnectItem];

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
        
        .dark {
          --background: 222 47% 11%;
          --foreground: 213 31% 91%;
          --card: 217 33% 17%;
          --card-foreground: 213 31% 91%;
          --popover: 217 33% 17%;
          --popover-foreground: 213 31% 91%;
          --primary: 142 76% 36%;
          --primary-foreground: 0 0% 100%;
          --secondary: 217 33% 20%;
          --secondary-foreground: 213 31% 91%;
          --muted: 217 33% 17%;
          --muted-foreground: 215 20% 65%;
          --accent: 142 76% 36%;
          --accent-foreground: 0 0% 100%;
          --destructive: 0 63% 31%;
          --destructive-foreground: 213 31% 91%;
          --border: 216 34% 25%;
          --input: 216 34% 25%;
          --ring: 142 76% 36%;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        <Sidebar className="border-r border-green-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors shadow-lg dark:shadow-gray-900/50">
          <SidebarHeader className="border-b border-green-100 dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
            <Link to={createPageUrl("Home")} className="block hover:opacity-80 transition-opacity">
              <PawCaoLogo size="default" />
            </Link>
            
            {planBadge && (
              <div className={`mt-3 ${planBadge.color} text-white rounded-lg px-3 py-2 text-center shadow-lg`}>
                <div className="text-xs font-semibold">
                  {planBadge.icon} {planBadge.name} MEMBER
                </div>
              </div>
            )}
            
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="mt-3 w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Modo Escuro
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Modo Claro
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3 w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100">
                  <Globe className="w-4 h-4 mr-2" />
                  {languageFlags[language]} {languageNames[language]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuItem onClick={() => setLanguage('pt')} className="cursor-pointer dark:hover:bg-gray-700 dark:text-gray-100">
                  🇵🇹 Português
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')} className="cursor-pointer dark:hover:bg-gray-700 dark:text-gray-100">
                  🇬🇧 English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('es')} className="cursor-pointer dark:hover:bg-gray-700 dark:text-gray-100">
                  🇪🇸 Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarHeader>
          
          <SidebarContent className="p-4 dark:bg-gray-800">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      className={`hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-200 rounded-xl mb-3 ${
                        location.pathname === createPageUrl("MyProfile") 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm' 
                          : 'dark:text-gray-300'
                      } border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20`}
                    >
                      <Link to={createPageUrl("MyProfile")} className="flex items-center gap-3 px-4 py-3">
                        <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="font-semibold">{t('myProfile', language)} & {language === 'pt' ? 'Config.' : 'Settings'}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500 dark:text-gray-400 px-2">{t('mainMenu', language)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allNavigationItems.slice(0, 7).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-sm' 
                            : 'dark:text-gray-300'
                        } ${item.icon === Zap ? 'border-2 border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-700 dark:hover:text-orange-300' : ''}`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className={`w-5 h-5 ${item.icon === Zap ? 'text-orange-500 dark:text-orange-400' : ''}`} />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs text-gray-500 dark:text-gray-400 px-2">{t('myActivity', language)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allNavigationItems.slice(7, 15).map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-sm' 
                            : 'dark:text-gray-300'
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
              <SidebarGroupLabel className="text-xs text-gray-500 dark:text-gray-400 px-2">{t('professionalServices', language)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allNavigationItems.slice(15, 21).map((item) => ( /* Adjusted slice end index from 22 to 21 */
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-300 transition-all duration-200 rounded-xl mb-2 ${
                          location.pathname === item.url 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-sm' 
                            : 'dark:text-gray-300'
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

            {allNavigationItems.length > 21 && ( /* Adjusted condition from 22 to 21 */
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs text-gray-500 dark:text-gray-400 px-2">{language === 'pt' ? 'Administração' : 'Administration'}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {allNavigationItems.slice(21).map((item) => ( /* Adjusted slice start index from 22 to 21 */
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-200 rounded-xl mb-2 ${
                            location.pathname === item.url 
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm' 
                              : 'dark:text-gray-300'
                          } border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
          <header className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm border-b border-green-100 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-10 transition-colors shadow-sm dark:shadow-gray-900/50">
            <div className="flex items-center gap-3 md:gap-4">
              <SidebarTrigger className="md:hidden hover:bg-green-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors" />

              <Link to={createPageUrl("Home")} className="md:hidden">
                <PawCaoLogo size="small" showText={false} />
              </Link>

              <div className="hidden md:flex items-center gap-3 flex-1">
                <PawCaoLogo size="small" showText={false} />
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
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
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hidden md:flex h-9 w-9 dark:hover:bg-gray-700 dark:text-gray-100"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 dark:hover:bg-gray-700 dark:text-gray-100">
                    <Globe className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="dark:bg-gray-800 dark:border-gray-700">
                  <DropdownMenuItem onClick={() => setLanguage('pt')} className="dark:hover:bg-gray-700 dark:text-gray-100">🇵🇹 PT</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')} className="dark:hover:bg-gray-700 dark:text-gray-100">🇬🇧 EN</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('es')} className="dark:hover:bg-gray-700 dark:text-gray-100">🇪🇸 ES</DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme} className="dark:hover:bg-gray-700 dark:text-gray-100">
                    {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                    {theme === 'light' ? 'Escuro' : 'Claro'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>

          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto transition-colors">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                  <PawCaoLogo size="default" className="mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('footerTagline', language)}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('services', language)}</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li><Link to={createPageUrl("Home")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('findWalkers', language)}</Link></li>
                    <li><Link to={createPageUrl("Trainers")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('findTrainers', language)}</Link></li>
                    <li><Link to={createPageUrl("DogSittingServices")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('dogSitting', language)}</Link></li>
                    <li><Link to={createPageUrl("Partners")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('pawcaoShop', language)}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('forProfessionals', language)}</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li><Link to={createPageUrl("BecomeWalker")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('becomeWalker', language)}</Link></li>
                    <li><Link to={createPageUrl("BecomeTrainer")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('becomeTrainer', language)}</Link></li>
                    <li><Link to={createPageUrl("Subscriptions")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('walkerSubscriptions', language)}</Link></li>
                    <li><Link to={createPageUrl("ProfessionalDashboard")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('professionalDashboard', language)}</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('company', language)}</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li><Link to={createPageUrl("AboutUs")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('aboutUs', language)}</Link></li>
                    <li><Link to={createPageUrl("Contact")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('contactUs', language)}</Link></li>
                    <li><Link to={createPageUrl("FAQ")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">FAQ</Link></li>
                    <li><Link to={createPageUrl("TermsOfService")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('termsOfService', language)}</Link></li>
                    <li><Link to={createPageUrl("PrivacyPolicy")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('privacyPolicy', language)}</Link></li>
                    <li><Link to={createPageUrl("CookiesPolicy")} className="hover:text-green-600 dark:hover:text-green-400 transition-colors">{t('cookiesPolicy', language)}</Link></li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  © 2025 PawCão. {t('allRightsReserved', language)}.
                </p>
                <div className="flex items-center gap-2">
                  <PawCaoLogo size="small" showText={false} />
                  <span className="text-sm text-green-700 dark:text-green-400 font-semibold">
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
    <ThemeProvider>
      <LanguageProvider>
        <LayoutContent children={children} currentPageName={currentPageName} />
      </LanguageProvider>
    </ThemeProvider>
  );
}
