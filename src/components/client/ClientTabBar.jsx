import { motion } from "framer-motion";
import { BarChart3, CalendarDays, PawPrint, Settings, Bell } from "lucide-react";

export function ClientTabBar({ active, onChange, unreadCount = 0 }) {
  const tabs = [
    { id: "overview", label: "Resumo", icon: BarChart3 },
    { id: "bookings", label: "Reservas", icon: CalendarDays },
    { id: "dogs", label: "Animais", icon: PawPrint },
    { id: "notifications", label: "Avisos", icon: Bell, badge: unreadCount },
    { id: "client_data", label: "Perfil", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex items-center px-2 py-2 gap-1 w-full justify-around">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className="relative flex flex-col items-center justify-center min-w-[56px] h-14 rounded-2xl transition-colors flex-shrink-0 px-2"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabClient"
                    className="absolute inset-0 bg-white/10 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <tab.icon
                    className={`w-5 h-5 mb-1 relative z-10 transition-colors ${
                      isActive ? "text-orange-500" : "text-slate-500"
                    }`}
                  />
                  {tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center z-20">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold relative z-10 transition-colors whitespace-nowrap ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}