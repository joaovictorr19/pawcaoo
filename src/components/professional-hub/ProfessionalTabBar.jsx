import { motion } from "framer-motion";
import { BarChart3, Package, Calendar, QrCode, Wallet, Zap, TrendingUp, Star, Image, ShieldCheck, Bell } from "lucide-react";

export function ProfessionalTabBar({ active, onChange }) {
  const tabs = [
    { id: "overview", label: "Resumo", icon: BarChart3 },
    { id: "requests", label: "Pedidos", icon: Bell },
    { id: "active", label: "Ativos", icon: Zap },
    { id: "calendar", label: "Agenda", icon: Calendar },
    { id: "profile", label: "Perfil", icon: Package },
    { id: "services", label: "Serviços", icon: Package },
    { id: "portfolio", label: "Portfólio", icon: Image },
    { id: "documents", label: "Documentos", icon: ShieldCheck },
    { id: "reviews", label: "Avaliações", icon: Star },
    { id: "finances", label: "Finanças", icon: TrendingUp },
    { id: "wallet", label: "Carteira", icon: Wallet },
    { id: "tools", label: "Ferramentas", icon: QrCode },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex items-center px-2 py-1.5 gap-1 w-max mx-auto min-w-full justify-around">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className="relative flex flex-col items-center justify-center min-w-[52px] h-14 rounded-xl transition-colors flex-shrink-0 px-2"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPro"
                    className="absolute inset-0 bg-orange-50 rounded-xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon
                  className={`w-5 h-5 mb-1 relative z-10 transition-colors ${
                    isActive ? "text-orange-500" : "text-slate-400"
                  }`}
                />
                <span
                  className={`text-[9px] font-semibold relative z-10 transition-colors whitespace-nowrap ${
                    isActive ? "text-orange-600" : "text-slate-400"
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