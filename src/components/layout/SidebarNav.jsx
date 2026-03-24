import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Users, ShoppingBag, Zap, Heart, Building2, BarChart3,
  Calendar, MessageCircle, History, Bell, Trophy, Crown,
  ShieldCheck, CreditCard, User, Store, Megaphone, Shield,
  Download, LogOut, ChevronDown, Package
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import PawCaoLogo from "@/components/PawCaoLogo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAvailableLanguages } from "@/components/translations";

function NavItem({ item, isActive, compact }) {
  const activeClass = item.danger 
    ? "bg-red-50 text-red-700 border-l-2 border-red-500" 
    : "bg-gray-100 text-gray-900 border-l-2 border-gray-900";
  const inactiveClass = item.danger
    ? "text-gray-600 hover:bg-red-50/50 hover:text-red-600 border-l-2 border-transparent"
    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-2 border-transparent";
  const emergencyClass = item.emergency 
    ? "text-red-600 font-semibold" 
    : "";

  return (
    <Link
      to={item.url}
      id={item.id}
      className={`flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors ${isActive ? activeClass : inactiveClass} ${emergencyClass}`}
      style={{ borderRadius: 0 }}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate flex-1">{item.title}</span>
      {item.badge && (
        <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-[18px] flex items-center justify-center" style={{ borderRadius: '2px' }}>
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

function NavSection({ title, items, isRouteActive, defaultOpen = true, danger }) {
  const [expanded, setExpanded] = React.useState(defaultOpen);

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${danger ? 'text-red-500' : 'text-gray-400'} hover:text-gray-600`}
        style={{ borderRadius: 0 }}
      >
        <span>{title}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? '' : '-rotate-90'}`} />
      </button>
      {expanded && (
        <div className="space-y-px">
          {items.map((item) => (
            <NavItem 
              key={item.url + item.title} 
              item={item} 
              isActive={isRouteActive(item.url)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SidebarNav({ user, unreadCount, onLogout }) {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const availableLanguages = getAvailableLanguages();

  const isRouteActive = (path) => {
    if (!path) return false;
    if (path === createPageUrl("Home") && location.pathname === path) return true;
    if (path !== createPageUrl("Home") && location.pathname.startsWith(path)) return true;
    return location.pathname === path;
  };

  const isProfessional = ['walker', 'trainer', 'both'].includes(user?.account_type);

  // === NAVIGATION SECTIONS (no duplicates) ===

  const exploreItems = [
    { title: language === 'pt' ? 'Profissionais' : 'Professionals', url: createPageUrl("Home"), icon: Users, id: "nav-home" },
    { title: language === 'pt' ? 'Loja & Parceiros' : 'Shop & Partners', url: createPageUrl("Shop"), icon: ShoppingBag },
    { title: 'PawGo', url: createPageUrl("Dashboard"), icon: Zap, emergency: true },
    { title: language === 'pt' ? 'Adoção' : 'Adoption', url: createPageUrl("AdoptionListings"), icon: Heart },
    { title: language === 'pt' ? 'Abrigos' : 'Shelters', url: createPageUrl("Shelters"), icon: Building2 },
  ];

  const myItems = [
    { title: language === 'pt' ? 'Reservas' : 'Bookings', url: createPageUrl("MyBookings"), icon: Calendar },
    { title: language === 'pt' ? 'Painel Cliente' : 'Client Panel', url: createPageUrl("ClientDashboard"), icon: BarChart3 },
    { title: language === 'pt' ? 'Mensagens' : 'Messages', url: createPageUrl("Chat"), icon: MessageCircle },
    { title: language === 'pt' ? 'Histórico' : 'History', url: createPageUrl("WalkHistory"), icon: History },
    { title: language === 'pt' ? 'Encomendas' : 'Orders', url: createPageUrl("MyOrders"), icon: Package },
    { title: language === 'pt' ? 'Notificações' : 'Notifications', url: createPageUrl("Notifications"), icon: Bell, badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : null },
    { title: language === 'pt' ? 'Legado' : 'Legacy', url: createPageUrl("Gamification"), icon: Trophy, id: "nav-gamification" },
  ];

  const proItems = [
    { 
      title: language === 'pt' ? 'Painel Profissional' : 'Pro Dashboard', 
      url: isProfessional ? createPageUrl("ProfessionalDashboard") : createPageUrl("BecomeProfessional"), 
      icon: BarChart3 
    },
    { title: language === 'pt' ? 'Subscrição' : 'Membership', url: createPageUrl("OwnerSubscriptions"), icon: Crown },
  ];

  const companyItems = user?.account_type === 'company' ? [
    { title: language === 'pt' ? 'Minha Empresa' : 'My Company', url: createPageUrl("PartnerDashboard"), icon: Store },
  ] : [];

  const adminItems = user?.role === 'admin' ? [
    { title: 'Dashboard', url: createPageUrl("AdminDashboard"), icon: ShieldCheck, danger: true },
    { title: language === 'pt' ? 'Pagamentos' : 'Payments', url: createPageUrl("TestPayments"), icon: CreditCard, danger: true },
    { title: language === 'pt' ? 'Verificações' : 'Verifications', url: createPageUrl("AdminDashboard?tab=applications"), icon: User, danger: true },
    { title: 'Shop Hub', url: createPageUrl("AdminShopHub"), icon: Store, danger: true },
    { title: language === 'pt' ? 'Gestão Loja' : 'Shop Mgmt', url: createPageUrl("AdminProductManagement"), icon: ShoppingBag, danger: true },
    { title: language === 'pt' ? 'Anúncios' : 'Announcements', url: createPageUrl("ApproveAnnouncements"), icon: Megaphone, danger: true },
    { title: language === 'pt' ? 'Pagamentos' : 'Payments Setup', url: createPageUrl("PaymentSetup"), icon: Shield, danger: true },
    { title: language === 'pt' ? 'Abrigos' : 'Shelters', url: createPageUrl("AdminShelterVerification"), icon: Building2, danger: true },
    { title: language === 'pt' ? 'Moderação' : 'Moderation', url: createPageUrl("ModerationPanel"), icon: Shield, danger: true },
    { title: 'Export', url: createPageUrl("StaticExport"), icon: Download, danger: true },
  ] : [];

  const langFlags = availableLanguages.reduce((a, l) => ({ ...a, [l.code]: l.flag }), {});
  const langNames = availableLanguages.reduce((a, l) => ({ ...a, [l.code]: l.name }), {});

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-gray-200/60">
        <Link to={createPageUrl("Home")} className="block mb-3 hover:opacity-80 transition-opacity">
          <PawCaoLogo size="default" />
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-7 text-gray-500 font-medium px-2" style={{ borderRadius: '4px' }}>
              {langFlags[language]} {langNames[language]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            {availableLanguages.map(lang => (
              <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)} className="cursor-pointer text-sm">
                <span className="mr-2">{lang.flag}</span> {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        <NavSection 
          title={language === 'pt' ? 'Explorar' : 'Explore'} 
          items={exploreItems} 
          isRouteActive={isRouteActive} 
          defaultOpen={true}
        />
        
        <NavSection 
          title={language === 'pt' ? 'Minha Atividade' : 'My Activity'} 
          items={myItems} 
          isRouteActive={isRouteActive} 
          defaultOpen={true}
        />

        <NavSection 
          title={language === 'pt' ? 'Profissional' : 'Professional'} 
          items={proItems} 
          isRouteActive={isRouteActive} 
          defaultOpen={false}
        />

        {companyItems.length > 0 && (
          <NavSection 
            title={language === 'pt' ? 'Empresa' : 'Company'} 
            items={companyItems} 
            isRouteActive={isRouteActive} 
            defaultOpen={false}
          />
        )}

        {adminItems.length > 0 && (
          <NavSection 
            title={language === 'pt' ? 'Admin' : 'Admin'} 
            items={adminItems} 
            isRouteActive={isRouteActive} 
            defaultOpen={false}
            danger
          />
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200/60 p-2 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 transition-colors"
          style={{ borderRadius: 0 }}
        >
          <LogOut className="w-4 h-4" />
          <span>{language === 'pt' ? 'Sair' : language === 'es' ? 'Salir' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}