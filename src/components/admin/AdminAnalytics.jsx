import React, { useMemo } from 'react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, subDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import {
  CheckCircle2, XCircle, Clock, Activity, TrendingUp,
  Trophy, Users, Wallet, Euro, Sparkles, BarChart3, UserCheck
} from "lucide-react";

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  in_progress: '#8b5cf6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

export default function AdminAnalytics({
  users = [],
  walkers = [],
  bookings = [],
  payments = [],
}) {
  const { language } = useLanguage();
  const t = (pt, en) => (language === 'pt' ? pt : en);

  const statusBreakdown = useMemo(() => {
    const pending = bookings.filter(b => b.status === 'pending').length;
    const accepted = bookings.filter(b => b.status === 'confirmed').length;
    const active = bookings.filter(b => ['in_progress', 'checked_in'].includes(b.status)).length;
    const completed = bookings.filter(b => ['completed', 'service_completed', 'checked_out'].includes(b.status)).length;
    const rejected = bookings.filter(b => ['cancelled', 'rejected'].includes(b.status)).length;
    const total = bookings.length;
    return { pending, accepted, active, completed, rejected, total };
  }, [bookings]);

  const revenueMetrics = useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.total_amount) || 0), 0);
    const platformFees = payments.reduce((acc, p) => acc + (Number(p.platform_fee) || 0), 0);
    const payouts = payments.reduce((acc, p) => acc + (Number(p.service_amount) || 0), 0);
    const avgTicket = payments.length > 0 ? totalRevenue / payments.length : 0;
    return { totalRevenue, platformFees, payouts, avgTicket };
  }, [payments]);

  const completionRate = useMemo(() => {
    const relevant = bookings.filter(b => ['confirmed', 'completed', 'service_completed', 'in_progress', 'checked_in', 'checked_out'].includes(b.status));
    const completed = bookings.filter(b => ['completed', 'service_completed', 'checked_out'].includes(b.status)).length;
    return relevant.length > 0 ? Math.round((completed / relevant.length) * 100) : 0;
  }, [bookings]);

  const bookingsTrendData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });
    return last6Months.map(date => {
      const monthStr = format(date, 'MMM', { locale: ptBR });
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const count = bookings.filter(b => {
        const created = new Date(b.created_date);
        return created >= start && created <= end;
      }).length;
      return { name: monthStr, Reservas: count };
    });
  }, [bookings]);

  const statusData = useMemo(() => [
    { name: t('Pendentes', 'Pending'), value: statusBreakdown.pending, color: STATUS_COLORS.pending },
    { name: t('Aceites', 'Accepted'), value: statusBreakdown.accepted, color: STATUS_COLORS.confirmed },
    { name: t('Ativas', 'Active'), value: statusBreakdown.active, color: STATUS_COLORS.in_progress },
    { name: t('Concluídas', 'Completed'), value: statusBreakdown.completed, color: STATUS_COLORS.completed },
    { name: t('Rejeitadas', 'Rejected'), value: statusBreakdown.rejected, color: STATUS_COLORS.cancelled },
  ].filter(item => item.value > 0), [statusBreakdown, language]);

  const topWalkers = useMemo(() => {
    const ninetyDaysAgo = subDays(new Date(), 90);
    const recentCompleted = bookings.filter(b => {
      const date = new Date(b.walk_date || b.session_date || b.created_date);
      return isAfter(date, ninetyDaysAgo) && (b.status === 'completed' || b.status === 'service_completed');
    });
    const walkerCounts = {};
    recentCompleted.forEach(b => {
      const id = b.walker_id || b.walker_email;
      const name = b.walker_name || t('Desconhecido', 'Unknown');
      if (!id) return;
      if (!walkerCounts[id]) walkerCounts[id] = { name, count: 0, id };
      walkerCounts[id].count += 1;
    });
    return Object.values(walkerCounts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [bookings, language]);

  const userGrowth = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });
    return last6Months.map(date => {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const count = users.filter(u => {
        const created = new Date(u.created_date);
        return created >= start && created <= end;
      }).length;
      return { name: format(date, 'MMM', { locale: ptBR }), Utilizadores: count };
    });
  }, [users]);

  const statusCards = [
    { label: t('Reservas Totais', 'Total Bookings'), value: statusBreakdown.total, icon: BarChart3, tint: 'from-slate-50 to-white', iconColor: 'text-slate-700', iconBg: 'bg-slate-100', border: 'border-slate-200' },
    { label: t('Pendentes', 'Pending'), value: statusBreakdown.pending, icon: Clock, tint: 'from-amber-50/50 to-white', iconColor: 'text-amber-600', iconBg: 'bg-amber-50', border: 'border-amber-100' },
    { label: t('Aceites', 'Accepted'), value: statusBreakdown.accepted, icon: CheckCircle2, tint: 'from-blue-50/50 to-white', iconColor: 'text-blue-600', iconBg: 'bg-blue-50', border: 'border-blue-100' },
    { label: t('Ativas', 'Active'), value: statusBreakdown.active, icon: Activity, tint: 'from-violet-50/50 to-white', iconColor: 'text-violet-600', iconBg: 'bg-violet-50', border: 'border-violet-100' },
    { label: t('Concluídas', 'Completed'), value: statusBreakdown.completed, icon: CheckCircle2, tint: 'from-emerald-50/50 to-white', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: t('Rejeitadas', 'Rejected'), value: statusBreakdown.rejected, icon: XCircle, tint: 'from-red-50/50 to-white', iconColor: 'text-red-600', iconBg: 'bg-red-50', border: 'border-red-100' },
  ];

  const financialStats = [
    { label: t('Receita Total', 'Total Revenue'), value: `€${revenueMetrics.totalRevenue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`, icon: Euro, iconColor: 'text-teal-600', iconBg: 'bg-teal-50' },
    { label: t('Comissão Plataforma', 'Platform Fees'), value: `€${revenueMetrics.platformFees.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`, icon: Wallet, iconColor: 'text-violet-600', iconBg: 'bg-violet-50' },
    { label: t('Pagamentos a Profs', 'Payouts'), value: `€${revenueMetrics.payouts.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`, icon: UserCheck, iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
    { label: t('Ticket Médio', 'Avg Ticket'), value: `€${revenueMetrics.avgTicket.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`, icon: TrendingUp, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-blue-50/50" />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-teal-100/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full bg-blue-100/20 blur-3xl" />
        <div className="relative p-5 md:p-7">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700">
            <Sparkles className="w-3 h-3" />
            {t('Desempenho da plataforma', 'Platform performance')}
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{t('Análise', 'Analytics')}</h2>
          <p className="mt-1 text-sm text-slate-600">
            {t('Visão 360° da atividade, reservas e receita da plataforma.', '360° view of platform activity, bookings and revenue.')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <TrendingUp className="w-3 h-3" /> {t('Taxa de conclusão', 'Completion rate')}: {completionRate}%
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Users className="w-3 h-3" /> {walkers.filter(w => w.is_active).length} {t('profissionais ativos', 'active professionals')}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Booking status breakdown — 360° view */}
      <div>
        <h3 className="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-slate-500">
          {t('Estado das Reservas', 'Booking Status Breakdown')}
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {statusCards.map((card, idx) => (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-br ${card.tint} p-4 transition-transform hover:-translate-y-0.5`}
            >
              <div className="flex flex-col gap-2">
                <div className={`inline-flex w-fit rounded-xl ${card.iconBg} p-2 shadow-sm`}>
                  <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-black tracking-tight text-slate-900">{card.value}</p>
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Financial metrics */}
      <div>
        <h3 className="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-slate-500">
          {t('Métricas Financeiras', 'Financial Metrics')}
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {financialStats.map((stat, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className={`shrink-0 rounded-xl ${stat.iconBg} p-2.5`}>
                  <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-500">{stat.label}</p>
                  <p className="text-lg font-black tracking-tight text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Bookings trend */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <div className="rounded-xl bg-blue-50 p-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">{t('Tendência de Reservas', 'Bookings Trend')}</h4>
              <p className="text-xs text-slate-500">{t('Últimos 6 meses', 'Last 6 months')}</p>
            </div>
          </div>
          <div className="h-[300px] p-4 md:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingsTrendData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#ffffff', color: '#0f172a' }} />
                <Area type="monotone" dataKey="Reservas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBookings)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status distribution donut */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <div className="rounded-xl bg-violet-50 p-2">
              <Activity className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">{t('Distribuição', 'Distribution')}</h4>
              <p className="text-xs text-slate-500">{t('Por estado', 'By status')}</p>
            </div>
          </div>
          <div className="h-[300px] p-4 md:p-6">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#ffffff', color: '#0f172a' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                {t('Sem dados para exibir', 'No data to display')}
              </div>
            )}
            {statusData.length > 0 && (
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {statusData.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    {item.name}: {item.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Top walkers + user growth */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Top walkers */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <div className="rounded-xl bg-amber-50 p-2">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">{t('Top Profissionais', 'Top Professionals')}</h4>
              <p className="text-xs text-slate-500">{t('Últimos 90 dias', 'Last 90 days')}</p>
            </div>
          </div>
          <div className="p-4 md:p-5">
            {topWalkers.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">{t('Sem dados suficientes recentes.', 'Not enough recent data.')}</p>
            ) : (
              <div className="space-y-2.5">
                {topWalkers.map((walker, idx) => (
                  <div key={walker.id || idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="max-w-[120px] truncate font-semibold text-slate-800">{walker.name}</span>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-600 shadow-sm">
                      {walker.count} {t('serviços', 'services')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User growth chart */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <div className="rounded-xl bg-emerald-50 p-2">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">{t('Crescimento de Utilizadores', 'User Growth')}</h4>
              <p className="text-xs text-slate-500">{t('Novos registos por mês', 'New registrations per month')}</p>
            </div>
          </div>
          <div className="h-[280px] p-4 md:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: '#ffffff', color: '#0f172a' }} />
                <Area type="monotone" dataKey="Utilizadores" stroke="#22c55e" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}