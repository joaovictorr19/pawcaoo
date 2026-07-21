import React from 'react';
import { Users, Calendar, UserCheck } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function KpiCards({
  bookings = [],
  users = [],
  walkers = [],
  isLoading = false
}) {
  const { language } = useLanguage();
  const t = (pt, en) => (language === 'pt' ? pt : en);

  const stats = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const ridesToday = bookings.filter(b => {
      const date = b.walk_date || b.session_date || b.created_date?.split('T')[0];
      return date === today;
    }).length;

    const activeWalkers = walkers.filter(w => w.is_active && w.verification_status === 'verified').length;

    const newClients = users.filter(u => {
      if (!u.created_date) return false;
      const date = new Date(u.created_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && u.role === 'user';
    }).length;

    return { ridesToday, activeWalkers, newClients };
  }, [bookings, users, walkers]);

  const cards = [
    {
      title: t("Passeios Hoje", "Walks Today"),
      value: stats.ridesToday,
      icon: Calendar,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      tint: "from-blue-50/50 to-white",
      desc: t("Agendados para hoje", "Scheduled for today"),
    },
    {
      title: t("Passeadores Ativos", "Active Walkers"),
      value: stats.activeWalkers,
      icon: UserCheck,
      iconColor: "text-teal-600",
      iconBg: "bg-teal-50",
      tint: "from-teal-50/50 to-white",
      desc: t("Verificados e disponíveis", "Verified and available"),
    },
    {
      title: t("Novos Clientes", "New Clients"),
      value: stats.newClients,
      icon: Users,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50",
      tint: "from-violet-50/50 to-white",
      desc: t("Este mês", "This month"),
    },
  ];

  if (isLoading) {
    return (
      <div className="mb-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${card.tint} p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:p-6`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-600">{card.title}</p>
              <h3 className="mt-1.5 text-4xl font-black tracking-tight text-slate-950">{card.value}</h3>
              <p className="mt-1 text-xs text-slate-500">{card.desc}</p>
            </div>
            <div className={`shrink-0 rounded-2xl ${card.iconBg} p-3.5 shadow-sm`}>
              <card.icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}