import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Package, Calendar, QrCode, Wallet, Zap, TrendingUp, Star,
  Image, ShieldCheck, Bell, ChevronDown, User, Store,
} from "lucide-react";

const TAB_GROUPS = [
  {
    label: "Operação",
    items: [
      { id: "overview", label: "Resumo", icon: BarChart3 },
      { id: "requests", label: "Pedidos", icon: Bell },
      { id: "active", label: "Ativos", icon: Zap },
      { id: "calendar", label: "Agenda", icon: Calendar },
    ],
  },
  {
    label: "Clientes",
    items: [
      { id: "reviews", label: "Avaliações", icon: Star },
    ],
  },
  {
    label: "Gestão",
    items: [
      { id: "services", label: "Serviços", icon: Package },
      { id: "portfolio", label: "Portfólio", icon: Image },
      { id: "finances", label: "Finanças", icon: TrendingUp },
      { id: "wallet", label: "Carteira", icon: Wallet },
      { id: "store", label: "Loja", icon: Store },
      { id: "tools", label: "Ferramentas", icon: QrCode },
    ],
  },
  {
    label: "Configurações",
    items: [
      { id: "profile", label: "Perfil", icon: User },
      { id: "documents", label: "Documentos", icon: ShieldCheck },
    ],
  },
];

const ALL_TABS = TAB_GROUPS.flatMap((g) => g.items);

export function ProfessionalTabBar({ active, onChange }) {
  const [openGroup, setOpenGroup] = useState(null);

  const activeTab = ALL_TABS.find((t) => t.id === active) || ALL_TABS[0];
  const ActiveIcon = activeTab.icon;

  const handleSelect = (id) => {
    onChange(id);
    setOpenGroup(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pb-4 w-full">
      {/* Desktop: pills agrupadas por categoria — tema claro */}
      <div className="hidden md:flex flex-wrap items-center gap-4 bg-white border border-slate-200 rounded-2xl p-2 shadow-sm">
        {TAB_GROUPS.map((group) => (
          <div key={group.label} className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              {group.label}
            </span>
            {group.items.map((tab) => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelect(tab.id)}
                  className="relative flex items-center gap-1.5 h-9 rounded-xl transition-colors px-2.5"
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPro"
                      className="absolute inset-0 bg-orange-100 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon className={`w-4 h-4 relative z-10 ${isActive ? "text-orange-600" : "text-slate-400"}`} />
                  <span className={`text-xs font-bold relative z-10 whitespace-nowrap ${isActive ? "text-orange-700" : "text-slate-500"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Mobile: acordeão por categoria — tema claro */}
      <div className="md:hidden bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setOpenGroup(openGroup ? null : "all")}
          className="w-full flex items-center justify-between px-4 py-3.5"
        >
          <span className="flex items-center gap-2.5">
            <ActiveIcon className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-bold text-slate-900">{activeTab.label}</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openGroup ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {openGroup && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-100 py-1">
                {TAB_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300 px-4 pt-2 pb-0.5">
                      {group.label}
                    </p>
                    {group.items.filter((t) => t.id !== active).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleSelect(tab.id)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-slate-500 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      >
                        <tab.icon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}