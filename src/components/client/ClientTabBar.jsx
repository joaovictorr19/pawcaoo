import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, CalendarDays, PawPrint, Settings, Bell, ChevronDown, BookOpen } from "lucide-react";

export function ClientTabBar({ active, onChange, unreadCount = 0 }) {
  const [open, setOpen] = useState(false);

  const tabs = [
    { id: "overview", label: "Resumo", icon: BarChart3 },
    { id: "diary", label: "Diário", icon: BookOpen },
    { id: "bookings", label: "Reservas", icon: CalendarDays },
    { id: "dogs", label: "Animais", icon: PawPrint },
    { id: "notifications", label: "Avisos", icon: Bell, badge: unreadCount },
    { id: "client_data", label: "Perfil", icon: Settings },
  ];

  const activeTab = tabs.find((t) => t.id === active) || tabs[0];
  const ActiveIcon = activeTab.icon;

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-4 w-full">
      {/* Desktop: barra horizontal no topo */}
      <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-white/10 rounded-2xl p-1.5">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className="relative flex-1 flex items-center justify-center gap-2 h-11 rounded-xl transition-colors px-2"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabClient"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative z-10">
                <tab.icon className={`w-4 h-4 ${isActive ? "text-orange-500" : "text-slate-500"}`} />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-xs font-bold relative z-10 whitespace-nowrap ${isActive ? "text-white" : "text-slate-500"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile: acordeão */}
      <div className="md:hidden bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3.5"
        >
          <span className="flex items-center gap-2.5">
            <div className="relative">
              <ActiveIcon className="w-5 h-5 text-orange-500" />
              {unreadCount > 0 && active !== "notifications" && (
                <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-white">{activeTab.label}</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/10 py-1">
                {tabs.filter((t) => t.id !== active).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleSelect(tab.id)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    <div className="relative">
                      <tab.icon className="w-5 h-5" />
                      {tab.badge > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {tab.badge > 9 ? "9+" : tab.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold">{tab.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}