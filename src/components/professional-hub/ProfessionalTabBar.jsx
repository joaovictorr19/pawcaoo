import {
  BarChart3, Package, Calendar, QrCode, Wallet, Zap, TrendingUp, Star,
  Image, ShieldCheck, Bell, User, Store,
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

export function ProfessionalTabBar({ active, onChange, pendingCount = 0 }) {
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 py-2.5 space-y-2.5">
        {TAB_GROUPS.map((group) => (
          <div key={group.label} className="flex flex-col gap-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((tab) => {
                const Icon = tab.icon;
                const isActive = active === tab.id;
                const count = tab.id === "requests" ? pendingCount : 0;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}