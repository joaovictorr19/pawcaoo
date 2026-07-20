import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { PawPrint, CalendarDays, Wallet, User } from "lucide-react";

const TABS = [
  { to: "/", label: "Profissionais", icon: PawPrint, exact: true },
  { to: "/MyBookings", label: "Reservas", icon: CalendarDays },
  { to: "/MyWallet", label: "Wallet", icon: Wallet },
  { to: "/MyProfile", label: "Perfil", icon: User },
];

export default function BottomTabBar() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[9990] pb-[env(safe-area-inset-bottom)]"
      style={{
        background: "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 -4px 24px rgba(0, 0, 0, 0.06)",
      }}
      aria-label="Navegação principal"
    >
      <div className="flex items-stretch justify-around h-16">
        {TABS.map(({ to, label, icon: Icon, exact }) => {
          const isActive = exact
            ? location.pathname === to || location.pathname === "/Home"
            : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 rounded-none min-h-0 transition-colors"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <div
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200 ${
                  isActive ? "bg-teal-500/12" : ""
                }`}
                style={isActive ? { background: "rgba(13, 148, 131, 0.12)" } : undefined}
              >
                <Icon
                  className={`w-[22px] h-[22px] transition-colors ${
                    isActive ? "text-[#0d9483]" : "text-slate-400"
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
              </div>
              <span
                className={`text-[10px] leading-none tracking-tight transition-colors ${
                  isActive ? "text-[#0d9483] font-bold" : "text-slate-400 font-medium"
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}