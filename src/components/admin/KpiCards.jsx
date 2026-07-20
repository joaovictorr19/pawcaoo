import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, TrendingUp, UserCheck } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function KpiCards({ 
  bookings = [], 
  users = [], 
  walkers = [],
  isLoading = false 
}) {
  const { language } = useLanguage();

  // Calculate KPIs
  const stats = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Total Rides Today
    const ridesToday = bookings.filter(b => {
      const date = b.walk_date || b.session_date || b.created_date?.split('T')[0];
      return date === today;
    }).length;

    // Active Walkers (Verified & Active)
    const activeWalkers = walkers.filter(w => w.is_active && w.verification_status === 'verified').length;

    // New Clients this Month
    const newClients = users.filter(u => {
      if (!u.created_date) return false;
      const date = new Date(u.created_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && u.role === 'user';
    }).length;

    return { ridesToday, activeWalkers, newClients };
  }, [bookings, users, walkers]);

  const cards = [
    {
      title: language === 'pt' ? "Passeios Hoje" : "Walks Today",
      value: stats.ridesToday,
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-100",
      desc: language === 'pt' ? "Agendados para hoje" : "Scheduled for today"
    },
    {
      title: language === 'pt' ? "Passeadores Ativos" : "Active Walkers",
      value: stats.activeWalkers,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100",
      desc: language === 'pt' ? "Verificados e disponíveis" : "Verified and available"
    },
    {
      title: language === 'pt' ? "Novos Clientes" : "New Clients",
      value: stats.newClients,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-100",
      desc: language === 'pt' ? "Este mês" : "This month"
    }
  ];

  if (isLoading) {
    return (
      <div className="mb-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, idx) => (
        <Card key={idx} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
          <CardContent className="flex min-h-36 items-center justify-between gap-4 p-5 md:p-6">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-600">{card.title}</p>
              <h3 className="mt-1 text-4xl font-black tracking-tight text-slate-950">{card.value}</h3>
              <p className="mt-1 text-xs text-slate-500">{card.desc}</p>
            </div>
            <div className={`shrink-0 rounded-2xl p-3.5 ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}