import { motion } from "framer-motion";
import { BarChart3, History, PawPrint } from "lucide-react";

export function ClientTabBar({ active, onChange }) {
  const tabs = [
    { id: "overview", label: "Resumo", icon: BarChart3 },
    { id: "history", label: "Histórico", icon: History },
    { id: "dogs", label: "Animais", icon: PawPrint },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-white/10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex items-center px-2 py-2 gap-1 w-max mx-auto min-w-full justify-around">
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
                <tab.icon
                  className={`w-5 h-5 mb-1 relative z-10 transition-colors ${
                    isActive ? "text-orange-500" : "text-slate-500"
                  }`}
                />
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