import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Calendar, Trophy, Bell, User, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MobileNavBar({ user, unreadCount = 0, onNotificationsClick }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === createPageUrl("Home") && location.pathname === path) return true;
    if (path !== createPageUrl("Home") && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      label: "Explorar",
      icon: Search,
      path: createPageUrl("Home"),
      activeColor: "text-green-600",
      id: "nav-home"
    },
    {
      label: "Reservas",
      icon: Calendar,
      path: createPageUrl("MyBookings"),
      activeColor: "text-blue-600"
    },
    {
      label: "Ranking",
      icon: Trophy,
      path: createPageUrl("Leaderboard"),
      activeColor: "text-yellow-500",
      isSpecial: true,
      id: "nav-gamification"
    },
    {
      label: "Alertas",
      icon: Bell,
      path: createPageUrl("Notifications"),
      activeColor: "text-red-500",
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      label: "Perfil",
      icon: User, // Fallback icon, logic handles Avatar below
      path: user ? (user.username ? createPageUrl(`UserProfile?username=${user.username}`) : createPageUrl(`UserProfile?id=${user.id}`)) : createPageUrl("Login"),
      activeColor: "text-purple-600",
      isProfile: true,
      id: "header-profile"
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/40 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <nav className="flex justify-around items-center h-16 px-2">
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={index}
              id={item.id}
              to={item.path}
              onClick={(e) => {
                if (item.label === "Alertas" && onNotificationsClick) {
                  e.preventDefault();
                  onNotificationsClick();
                }
              }}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 relative group ${
                active ? "transform -translate-y-1" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {/* Glow Effect for Active */}
              {active && (
                <div className={`absolute -top-2 w-8 h-1 rounded-full bg-current opacity-50 blur-sm ${item.activeColor}`} />
              )}

              <div className="relative">
                {item.isProfile && user ? (
                  <Avatar className={`w-6 h-6 ${active ? "ring-2 ring-offset-1 " + item.activeColor.replace('text-', 'ring-') : ""}`}>
                    <AvatarImage src={user.profile_photo_url} />
                    <AvatarFallback className="text-[9px] bg-gray-200">
                      {user.full_name?.[0] || "EU"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon 
                    className={`w-6 h-6 ${active ? item.activeColor : ""} ${item.isSpecial && active ? "fill-current" : ""}`} 
                    strokeWidth={active ? 2.5 : 2}
                  />
                )}

                {item.badge && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-bounce border-2 border-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] mt-1 font-medium ${active ? item.activeColor : "text-gray-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}