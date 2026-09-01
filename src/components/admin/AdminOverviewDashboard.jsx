import React from 'react';
import KpiCards from './KpiCards';
import WalkStatusDonutChart from './WalkStatusDonutChart';
import RevenuePayoutsChart from './RevenuePayoutsChart';
import { useLanguage } from "@/components/LanguageContext";
import { TrendingUp, Wallet, Clock, CheckCircle2, Euro, Activity, ArrowUpRight, Sparkles } from "lucide-react";

export default function AdminOverviewDashboard({
  bookings = [],
  users = [],
  walkers = [],
  trainers = [],
  payments = [],
  isLoading = false
}) {
  const { language } = useLanguage();
  const t = (pt, en) => (language === 'pt' ? pt : en);

  const metrics = React.useMemo(() => {
    const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.total_amount) || 0), 0);
    const totalPayouts = payments.reduce((acc, p) => acc + (Number(p.service_amount) || 0), 0);
    const platformFees = payments.reduce((acc, p) => acc + (Number(p.platform_fee) || 0), 0);
    const pending = bookings.filter(b => b.status === 'pending').length;
    const completed = bookings.filter(b => b.status === 'completed' || b.status === 'service_completed').length;
    const conversionRate = bookings.length > 0 ? Math.round((completed / bookings.length) * 100) : 0;

    return { totalRevenue, totalPayouts, platformFees, pending, completed, conversionRate };
  }, [payments, bookings]);

  const recentBookings = React.useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 5);
  }, [bookings]);

  const secondaryStats = [
    {
      label: t('Receita Total', 'Total Revenue'),
      value: `€${metrics.totalRevenue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`,
      icon: Euro,
      tint: 'from-teal-50 to-teal-100/40',
      iconColor: 'text-teal-600',
      border: 'border-teal-100',
    },
    {
      label: t('Comissão Plataforma', 'Platform Fees'),
      value: `€${metrics.platformFees.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}`,
      icon: Wallet,
      tint: 'from-violet-50 to-violet-100/40',
      iconColor: 'text-violet-600',
      border: 'border-violet-100',
    },
    {
      label: t('Reservas Pendentes', 'Pending Bookings'),
      value: metrics.pending,
      icon: Clock,
      tint: 'from-amber-50 to-amber-100/40',
      iconColor: 'text-amber-600',
      border: 'border-amber-100',
    },
    {
      label: t('Taxa de Conversão', 'Conversion Rate'),
      value: `${metrics.conversionRate}%`,
      icon: TrendingUp,
      tint: 'from-emerald-50 to-emerald-100/40',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-100',
    },
  ];

  const today = new Date().toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-violet-50/50" />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-teal-100/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full bg-violet-100/20 blur-3xl" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700">
                <Sparkles className="w-3 h-3" />
                {t('Resumo operacional', 'Operational summary')}
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                {t('Visão Geral', 'Overview')}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {t('Indicadores essenciais da atividade da plataforma.', 'Key indicators of platform activity.')}
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('Hoje', 'Today')}</p>
              <p className="mt-0.5 text-sm font-bold capitalize text-slate-700">{today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 1. KPIs */}
      <KpiCards bookings={bookings} users={users} walkers={walkers} isLoading={isLoading} />

      {/* 2. Secondary metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {secondaryStats.map((stat, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.tint} p-4 transition-transform hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{stat.value}</p>
              </div>
              <div className="shrink-0 rounded-xl bg-white/70 p-2 shadow-sm">
                <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <WalkStatusDonutChart bookings={bookings} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-2">
          <RevenuePayoutsChart payments={payments} isLoading={isLoading} />
        </div>
      </div>

      {/* 4. Recent activity */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-teal-50 p-2">
              <Activity className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{t('Atividade Recente', 'Recent Activity')}</h3>
              <p className="text-xs text-slate-500">{t('Últimas reservas registadas', 'Latest registered bookings')}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            {t('Sem reservas recentes para exibir', 'No recent bookings to display')}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentBookings.map((b) => {
              const isCompleted = b.status === 'completed' || b.status === 'service_completed';
              const isPending = b.status === 'pending';
              const isCancelled = b.status === 'cancelled' || b.status === 'rejected';
              return (
                <div key={b.id} className="flex items-center gap-3 py-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isCompleted ? 'bg-emerald-50' : isPending ? 'bg-amber-50' : isCancelled ? 'bg-red-50' : 'bg-blue-50'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                     isPending ? <Clock className="w-4 h-4 text-amber-600" /> :
                     isCancelled ? <ArrowUpRight className="w-4 h-4 text-red-500 rotate-45" /> :
                     <Activity className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {b.owner_name || b.dog_name || t('Reserva', 'Booking')}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {b.entityType === 'training' ? t('Treino', 'Training')
                        : b.entityType === 'hotel' ? t('Hotel', 'Hotel')
                        : t('Passeio', 'Walk')}
                      {b.walker_name || b.trainer_name || b.hotel_name ? ` · ${b.walker_name || b.trainer_name || b.hotel_name}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isCompleted ? 'bg-emerald-50 text-emerald-700' :
                      isPending ? 'bg-amber-50 text-amber-700' :
                      isCancelled ? 'bg-red-50 text-red-600' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {b.status}
                    </span>
                    {b.total_amount ? (
                      <p className="mt-0.5 text-xs font-bold text-slate-700">€{Number(b.total_amount).toFixed(0)}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}