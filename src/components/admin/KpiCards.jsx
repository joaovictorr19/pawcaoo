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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, idx) => (
        <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{card.value}</h3>
              <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
            </div>
            <div className={`p-3 rounded-full ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}