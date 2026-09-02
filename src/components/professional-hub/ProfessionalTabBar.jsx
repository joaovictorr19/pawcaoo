import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Package, Calendar, QrCode, Wallet, Zap, TrendingUp, Star, Image, ShieldCheck, Bell, ChevronDown, User, Store } from "lucide-react";

const TABS = [
  { id: "overview", label: "Resumo", icon: BarChart3 },
  { id: "requests", label: "Pedidos", icon: Bell },
  { id: "active", label: "Ativos", icon: Zap },
  { id: "calendar", label: "Agenda", icon: Calendar },
  { id: "profile", label: "Perfil", icon: User },
  { id: "services", label: "Serviços", icon: Package },
  { id: "portfolio", label: "Portfólio", icon: Image },
  { id: "documents", label: "Documentos", icon: ShieldCheck },
  { id: "reviews", label: "Avaliações", icon: Star },
  { id: "finances", label: "Finanças", icon: TrendingUp },
  { id: "wallet", label: "Carteira", icon: Wallet },
  { id: "store", label: "Loja", icon: Store },
  { id: "tools", label: "Ferramentas", icon: QrCode },
];

export function ProfessionalTabBar({ active, onChange }) {
  const [open, setOpen] = useState(false);
  const activeTab = TABS.find((t) => t.id === active) || TABS[0];
  const ActiveIcon = activeTab.icon;

  const handleSelect = (id) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pb-4 w-full">
      {/* Desktop: pills no topo */}
      <div className="hidden md:flex flex-wrap items-center gap-1 bg-slate-900 border border-white/10 rounded-2xl p-1.5">
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className="relative flex items-center gap-1.5 h-10 rounded-xl transition-colors px-3"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPro"
                  className="absolute inset-0 bg-white/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className={`w-4 h-4 relative z-10 ${isActive ? "text-orange-500" : "text-slate-500"}`} />
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
            <ActiveIcon className="w-5 h-5 text-orange-500" />
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
              <div className="border-t border-white/10 py-1 grid grid-cols-2">
                {TABS.filter((t) => t.id !== active).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleSelect(tab.id)}
                    className="flex items-center gap-2.5 px-4 py-3 text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    <tab.icon className="w-5 h-5" />
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