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
    <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,12px)+8px)] bg-white/90 backdrop-blur-xl border-t border-slate-100">
      <div className="grid grid-cols-4 rounded-lg overflow-hidden border border-[#D1D5DB] bg-[#F9FAFB]">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-1 px-2 py-2.5 border-r border-b border-[#D1D5DB] [&:nth-child(4n)]:border-r-0 [&:nth-child(n+9)]:border-b-0 transition-colors ${
                isActive ? "bg-[#167A71] text-white" : "bg-[#F9FAFB] text-[#1F2937] hover:bg-slate-100"
              }`}
            >
              <tab.icon
                className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-[#1F2937]"}`}
                strokeWidth={1.5}
              />
              <span className="text-[9px] font-medium leading-none whitespace-nowrap truncate">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}