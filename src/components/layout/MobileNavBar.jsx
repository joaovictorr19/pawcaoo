import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Calendar, Trophy, Bell, User, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";

export default function MobileNavBar({ user, unreadCount = 0, onNotificationsClick }) {
  const location = useLocation();
  const { colors, isDarkMode } = useTheme();
  const { language } = useLanguage();

  const isActive = (path) => {
    if (path === createPageUrl("Home") && location.pathname === path) return true;
    if (path !== createPageUrl("Home") && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Labels traduzidos
  const labels = {
    explore: { pt: 'Explorar', es: 'Explorar', en: 'Explore' },
    bookings: { pt: 'Reservas', es: 'Reservas', en: 'Bookings' },
    hallOfFame: { pt: 'Fama', es: 'Fama', en: 'Fame' },
    alerts: { pt: 'Alertas', es: 'Alertas', en: 'Alerts' },
    profile: { pt: 'Perfil', es: 'Perfil', en: 'Profile' }
  };

  const getLabel = (key) => labels[key]?.[language] || labels[key]?.en;

  const navItems = [
    {
      label: getLabel('explore'),
      icon: Search,
      path: createPageUrl("Home"),
      activeColor: "text-green-600",
      id: "nav-home"
    },
    {
      label: language === 'pt' ? 'Painel' : language === 'es' ? 'Panel' : 'Panel',
      icon: Calendar,
      path: createPageUrl("ProfessionalDashboard"),
      activeColor: "text-green-600"
    },
    {
      label: getLabel('hallOfFame'),
      icon: Trophy,
      path: createPageUrl("Gamification"),
      activeColor: "text-yellow-500",
      isSpecial: true,
      id: "nav-gamification"
    },
    {
      label: getLabel('alerts'),
      icon: Bell,
      path: createPageUrl("Notifications"),
      activeColor: "text-red-500",
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      label: getLabel('profile'),
      icon: User,
      path: user ? (user?.username ? createPageUrl(`UserProfile?username=${user.username}`) : createPageUrl(`UserProfile?id=${user?.id}`)) : createPageUrl("Login"),
      activeColor: "text-purple-600",
      isProfile: true,
      id: "header-profile"
    }
  ];

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe mb-3 mx-3 rounded-2xl shadow-2xl border"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.5)',
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.1)'
      }}
    >
      <nav className="flex justify-around items-center h-14 px-1">
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={index}
              id={item.id}
              to={item.path}
              onClick={(e) => {
                if (item.label === getLabel('alerts') && onNotificationsClick) {
                  e.preventDefault();
                  onNotificationsClick();
                }
              }}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 relative group ${
                active ? "transform -translate-y-1" : (isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700")
              }`}
            >
              {/* Glow Effect for Active - Dynamic Color */}
              {active && (
                <div 
                  className="absolute -top-2 w-8 h-1 rounded-full opacity-60 blur-sm"
                  style={{ backgroundColor: colors?.primary || '#16a34a' }}
                />
              )}

              <div className="relative">
                {item.isProfile && user ? (
                  <Avatar 
                    className={`w-5 h-5 ${active ? "ring-2 ring-offset-1" : ""}`}
                    style={active ? { '--tw-ring-color': colors?.primary || '#16a34a' } : {}}
                  >
                    <AvatarImage src={user.profile_photo_url} className="aspect-square object-cover object-center" />
                    <AvatarFallback className="text-[8px] bg-gray-200">
                      {user.full_name?.[0] || "EU"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon 
                    className={`w-5 h-5 ${item.isSpecial && active ? "fill-current" : ""}`}
                    style={active ? { color: colors?.primary || '#16a34a' } : {}}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                )}

                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>

              <span 
                className={`text-[9px] mt-0.5 font-medium truncate max-w-[50px] ${!active && "text-gray-500"}`}
                style={active ? { color: colors?.primary || '#16a34a' } : {}}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}