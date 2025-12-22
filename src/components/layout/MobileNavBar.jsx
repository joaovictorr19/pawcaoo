import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Calendar, Store, Bell, User } from "lucide-react";
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
      label: "Home",
      icon: Home,
      path: createPageUrl("Home"),
      id: "nav-home"
    },
    {
      label: "Reservas",
      icon: Calendar,
      path: createPageUrl("MyBookings"),
    },
    {
      label: "Loja",
      icon: Store,
      path: createPageUrl("Partners"),
    },
    {
      label: "Alertas",
      icon: Bell,
      path: createPageUrl("Notifications"),
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      label: "Perfil",
      icon: User,
      path: user ? (user?.username ? createPageUrl(`UserProfile?username=${user.username}`) : createPageUrl(`UserProfile?id=${user?.id}`)) : createPageUrl("Home"),
      isProfile: true,
      id: "header-profile"
    }
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 w-full z-50 h-16 flex justify-around items-center bg-neutral-900/95 backdrop-blur-md border-t border-white/10"
      style={{ 
        boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.3)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
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
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative ${
              active 
                ? "text-amber-500" 
                : "text-gray-500 hover:text-gray-300"
            }`}
            style={active ? { filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.5))' } : {}}
          >
            <div className="relative">
              {item.isProfile && user?.profile_photo_url ? (
                <Avatar 
                  className={`w-6 h-6 ${active ? "ring-2 ring-amber-500 ring-offset-1 ring-offset-neutral-900" : ""}`}
                >
                  <AvatarImage src={user.profile_photo_url} className="aspect-square object-cover object-center" />
                  <AvatarFallback className="text-[9px] bg-neutral-700 text-white">
                    {user.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Icon 
                  className={`w-6 h-6 transition-transform duration-200 ${active ? "scale-110" : ""}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              )}

              {item.badge && (
                <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white animate-pulse">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>

            <span className={`text-[10px] mt-1 font-medium ${active ? "text-amber-500" : "text-gray-500"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}