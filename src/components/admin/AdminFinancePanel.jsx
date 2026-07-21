import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell
} from "recharts";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Euro, Percent, Wallet, TrendingDown, TrendingUp, RefreshCw, Users,
  Receipt, Banknote, ChevronRight, ArrowDownRight
} from "lucide-react";
import { format, isAfter, subMonths, startOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import CompanyVaultPanel from "./CompanyVaultPanel";
import AdminHotelCommissionManager from "./AdminHotelCommissionManager";
import AdminWithdrawalsPanel from "./AdminWithdrawalsPanel";

const euro = (v) =>
  (v || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

const euroShort = (v) => {
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}k`;
  return `€${(v || 0).toFixed(0)}`;
};

const STATUSES = {
  pending:   "bg-amber-100 text-amber-700",
  held:      "bg-blue-100 text-blue-700",
  released:  "bg-emerald-100 text-emerald-700",
  refunded:  "bg-rose-100 text-rose-700",
  failed:    "bg-slate-200 text-slate-600",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-2 capitalize">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-500">{entry.dataKey === "revenue" ? "Faturação" : entry.dataKey === "fees" ? "Comissões" : "Pro"}: </span>
          <span className="font-bold text-slate-800">{euro(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function AdminFinancePanel() {
  const [showAllMonths, setShowAllMonths] = useState(false);

  const { data: payments = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["adminFinancePayments"],
    queryFn: async () => {
      const result = await base44.entities.Payment.list("-held_date", 500);
      return Array.isArray(result) ? result : [];
    },
    staleTime: 60 * 1000,
  });

  const stats = useMemo(() => {
    const valid = payments.filter((p) => p.status !== "refunded" && p.status !== "failed");

    const totalRevenue = valid.reduce((s, p) => s + (p.total_amount || 0), 0);
    const totalPlatformFees = valid.reduce((s, p) => s + (p.platform_fee || 0), 0);
    const totalProEarnings = valid.reduce((s, p) => s + (p.service_amount || 0), 0);
    const totalRefunded = payments.filter((p) => p.status === "refunded").reduce((s, p) => s + (p.refund_amount || 0), 0);

    // Monthly breakdown
    const monthlyMap = {};
    valid.forEach((p) => {
      const date = p.held_date ? new Date(p.held_date) : new Date(p.created_date || Date.now());
      const key = format(date, "yyyy-MM");
      const label = format(date, "MMM yy", { locale: pt });
      if (!monthlyMap[key]) monthlyMap[key] = { key, label, revenue: 0, fees: 0, earnings: 0, count: 0 };
      monthlyMap[key].revenue += p.total_amount || 0;
      monthlyMap[key].fees += p.platform_fee || 0;
      monthlyMap[key].earnings += p.service_amount || 0;
      monthlyMap[key].count += 1;
    });
    const monthly = Object.values(monthlyMap).sort((a, b) => a.key.localeCompare(b.key));

    // This month vs last month for trend
    const thisMonthStart = startOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const thisMonthRev = valid.filter(p => {
      const d = p.held_date ? new Date(p.held_date) : new Date(p.created_date || Date.now());
      return isAfter(d, thisMonthStart);
    }).reduce((s, p) => s + (p.total_amount || 0), 0);
    const lastMonthRev = valid.filter(p => {
      const d = p.held_date ? new Date(p.held_date) : new Date(p.created_date || Date.now());
      return isAfter(d, lastMonthStart) && !isAfter(d, thisMonthStart);
    }).reduce((s, p) => s + (p.total_amount || 0), 0);
    const trendPct = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev * 100) : (thisMonthRev > 0 ? 100 : 0);

    // Per-professional earnings
    const proMap = {};
    valid.forEach((p) => {
      const email = p.recipient_email || "desconhecido";
      const name = p.recipient_name || email;
      if (!proMap[email]) proMap[email] = { email, name, total: 0, count: 0 };
      proMap[email].total += p.service_amount || 0;
      proMap[email].count += 1;
    });
    const professionals = Object.values(proMap).sort((a, b) => b.total - a.total);

    // Recent transactions
    const recent = [...payments].slice(0, 8);

    return { totalRevenue, totalPlatformFees, totalProEarnings, totalRefunded, monthly, professionals, txCount: valid.length, trendPct, thisMonthRev, recent };
  }, [payments]);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      icon: Euro, label: "Faturação Total", value: euro(stats.totalRevenue),
      sub: `${stats.txCount} transações`, trend: stats.trendPct,
      gradient: "from-emerald-500 to-teal-600", ring: "ring-emerald-100",
    },
    {
      icon: Percent, label: "Comissões Plataforma", value: euro(stats.totalPlatformFees),
      sub: `${stats.totalRevenue > 0 ? ((stats.totalPlatformFees / stats.totalRevenue) * 100).toFixed(1) : 0}% do volume`,
      gradient: "from-teal-500 to-cyan-600", ring: "ring-teal-100",
    },
    {
      icon: Wallet, label: "Ganhos Profissionais", value: euro(stats.totalProEarnings),
      sub: `${stats.professionals.length} profissionais ativos`,
      gradient: "from-violet-500 to-purple-600", ring: "ring-violet-100",
    },
    {
      icon: ArrowDownRight, label: "Reembolsos", value: euro(stats.totalRefunded),
      sub: "valor devolvido",
      gradient: "from-rose-500 to-red-600", ring: "ring-rose-100",
    },
  ];

  const chartData = (showAllMonths ? stats.monthly : stats.monthly.slice(-8)).map(m => ({
    label: m.label,
    revenue: Math.round(m.revenue),
    fees: Math.round(m.fees),
    earnings: Math.round(m.earnings),
  }));

  const maxProEarning = Math.max(...stats.professionals.map(p => p.total), 1);

  return (
    <div className="space-y-5">
      {/* Company Vault */}
      <CompanyVaultPanel />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-heading font-extrabold text-slate-900">Faturação & Financeiro</h2>
          <p className="text-xs text-slate-500">Receita, comissões, ganhos e saques da plataforma</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}
          className="rounded-xl h-9 border-slate-200 text-slate-600 hover:bg-slate-50">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const isPositiveTrend = kpi.trend >= 0;
          return (
            <div key={i} className={`relative bg-white rounded-2xl p-4 border border-slate-200 shadow-sm ring-4 ${kpi.ring} overflow-hidden`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shadow-md`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {kpi.trend !== undefined && (
                  <div className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isPositiveTrend ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  }`}>
                    {isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(kpi.trend).toFixed(0)}%
                  </div>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>
              <p className="text-xl font-black text-slate-900 leading-tight">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 mt-1">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Area Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Evolução Mensal</h3>
                <p className="text-[10px] text-slate-400">Faturação, comissões e ganhos</p>
              </div>
            </div>
            {stats.monthly.length > 8 && (
              <button onClick={() => setShowAllMonths(!showAllMonths)}
                className="text-[11px] font-semibold text-blue-600 hover:underline">
                {showAllMonths ? "Ver menos" : "Ver tudo"}
              </button>
            )}
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">
              Sem dados de faturação
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} className="capitalize" />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={euroShort} width={45} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#gradRevenue)" name="Faturação" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-slate-500">Faturação</span>
            </div>
          </div>
        </div>

        {/* Professional Earnings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Profissionais</h3>
              <p className="text-[10px] text-slate-400">Por ganhos acumulados</p>
            </div>
          </div>

          {stats.professionals.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">
              Sem dados de profissionais
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {stats.professionals.slice(0, 12).map((pro, idx) => (
                <div key={pro.email} className="group">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                      idx === 0 ? "bg-amber-100 text-amber-700" :
                      idx === 1 ? "bg-slate-200 text-slate-600" :
                      idx === 2 ? "bg-orange-100 text-orange-600" :
                      "bg-slate-50 text-slate-400"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{pro.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full" style={{ width: `${(pro.total / maxProEarning) * 100}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-violet-600 shrink-0">{euroShort(pro.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transações Recentes</h3>
              <p className="text-[10px] text-slate-400">Últimos pagamentos processados</p>
            </div>
          </div>
        </div>

        {stats.recent.length === 0 ? (
          <div className="px-5 pb-5 text-sm text-slate-400 text-center py-6">Sem transações recentes</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/50">
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5 py-2">Profissional</th>
                  <th className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 hidden sm:table-cell">Cliente</th>
                  <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 hidden md:table-cell">Serviço</th>
                  <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Total</th>
                  <th className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 hidden lg:table-cell">Comissão</th>
                  <th className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider px-5 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-2.5">
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">{tx.recipient_name || tx.recipient_email}</p>
                      <p className="text-[9px] text-slate-400 truncate max-w-[120px]">{tx.recipient_email}</p>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <p className="text-xs text-slate-600 truncate max-w-[100px]">{tx.payer_name || "—"}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right hidden md:table-cell">
                      <span className="text-xs font-medium text-slate-500">{euro(tx.service_amount)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="text-xs font-bold text-slate-900">{euro(tx.total_amount)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right hidden lg:table-cell">
                      <span className="text-xs font-medium text-indigo-600">{euro(tx.platform_fee)}</span>
                    </td>
                    <td className="px-5 py-2.5 text-center">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUSES[tx.status] || STATUSES.pending}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two-column: Commissions + Withdrawals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hotel Commissions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <Percent className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Comissões de Hotéis</h3>
              <p className="text-[10px] text-slate-400">Retiradas do hotel; cliente paga só o serviço</p>
            </div>
          </div>
          <AdminHotelCommissionManager />
        </div>

        {/* Withdrawals */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Banknote className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Gestão de Saques</h3>
              <p className="text-[10px] text-slate-400">Aprovar, rejeitar ou pagar levantamentos</p>
            </div>
          </div>
          <AdminWithdrawalsPanel />
        </div>
      </div>
    </div>
  );
}