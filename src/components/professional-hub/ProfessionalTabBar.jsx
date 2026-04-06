import { motion } from "framer-motion";
import { BarChart3, Package, Calendar, Settings, QrCode, Wallet, Zap } from "lucide-react";

export function ProfessionalTabBar({ active, onChange }) {
  const tabs = [
    { id: "overview", label: "Resumo", icon: BarChart3 },
    { id: "active", label: "Ativos", icon: Zap },
    { id: "services", label: "Serviços", icon: Package },
    { id: "calendar", label: "Agenda", icon: Calendar },
    { id: "wallet", label: "Carteira", icon: Wallet },
    { id: "tools", label: "Ferramentas", icon: QrCode },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPro"
                  className="absolute inset-0 bg-white/10 rounded-2xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                className={`w-5 h-5 mb-1 relative z-10 transition-colors ${
                  isActive ? "text-orange-500" : "text-slate-500"
                }`}
              />
              <span
                className={`text-[10px] font-bold relative z-10 transition-colors ${
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
  );
}