import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, Wallet, Percent, Euro, RefreshCw, Users, Banknote } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import CompanyVaultPanel from "./CompanyVaultPanel";
import AdminHotelCommissionManager from "./AdminHotelCommissionManager";
import AdminWithdrawalsPanel from "./AdminWithdrawalsPanel";

const euro = (v) => (v || 0).toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

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
      const label = format(date, "MMM yyyy", { locale: pt });
      if (!monthlyMap[key]) monthlyMap[key] = { key, label, revenue: 0, fees: 0, earnings: 0, count: 0 };
      monthlyMap[key].revenue += p.total_amount || 0;
      monthlyMap[key].fees += p.platform_fee || 0;
      monthlyMap[key].earnings += p.service_amount || 0;
      monthlyMap[key].count += 1;
    });
    const monthly = Object.values(monthlyMap).sort((a, b) => b.key.localeCompare(a.key));

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

    return { totalRevenue, totalPlatformFees, totalProEarnings, totalRefunded, monthly, professionals, txCount: valid.length };
  }, [payments]);

  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const kpiCards = [
    { icon: Euro, label: "Faturação Total", value: euro(stats.totalRevenue), sub: `${stats.txCount} transações`, color: "from-emerald-500 to-teal-600" },
    { icon: Percent, label: "Comissões Plataforma", value: euro(stats.totalPlatformFees), sub: `${stats.totalRevenue > 0 ? ((stats.totalPlatformFees / stats.totalRevenue) * 100).toFixed(1) : 0}% do total`, color: "from-blue-500 to-indigo-600" },
    { icon: Wallet, label: "Ganhos Profissionais", value: euro(stats.totalProEarnings), sub: `${stats.professionals.length} profissionais`, color: "from-violet-500 to-purple-600" },
    { icon: TrendingUp, label: "Reembolsos", value: euro(stats.totalRefunded), sub: "valor devolvido", color: "from-rose-500 to-red-600" },
  ];

  const monthsToShow = showAllMonths ? stats.monthly : stats.monthly.slice(0, 6);
  const maxRevenue = Math.max(...stats.monthly.map((m) => m.revenue), 1);

  return (
    <div className="mt-6 space-y-8">
      {/* Company Vault */}
      <CompanyVaultPanel />

      {/* Finance Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Faturação & Ganho dos Profissionais</h2>
          <p className="text-sm text-slate-500">Acompanha a receita acumulada e os ganhos mensais dos profissionais</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <Card key={i} className="border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-sm`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</span>
              </div>
              <div className="text-2xl font-black text-slate-900 leading-none mb-1">{kpi.value}</div>
              <div className="text-xs text-slate-400">{kpi.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card className="border border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Faturação Mensal</h3>
              {stats.monthly.length > 6 && (
                <button onClick={() => setShowAllMonths(!showAllMonths)} className="text-xs font-semibold text-blue-600 hover:underline">
                  {showAllMonths ? "Ver menos" : "Ver tudo"}
                </button>
              )}
            </div>
            {stats.monthly.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Sem dados de faturação</p>
            ) : (
              <div className="space-y-3">
                {monthsToShow.map((m) => (
                  <div key={m.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-600 capitalize">{m.label}</span>
                      <span className="text-xs font-bold text-slate-900">{euro(m.revenue)}</span>
                    </div>
                    <div className="h-7 bg-slate-100 rounded-lg overflow-hidden flex">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full flex items-center justify-end pr-2" style={{ width: `${(m.revenue / maxRevenue) * 100}%` }}>
                        <span className="text-[10px] font-bold text-white">{m.count} tx</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-slate-400">
                      <span>Comissão: {euro(m.fees)}</span>
                      <span>Pro: {euro(m.earnings)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Earnings */}
        <Card className="border border-slate-200 shadow-sm rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900">Ganhos por Profissional</h3>
            </div>
            {stats.professionals.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Sem dados de profissionais</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {stats.professionals.map((pro, idx) => (
                  <div key={pro.email} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{pro.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{pro.email} · {pro.count} pagamentos</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 shrink-0">{euro(pro.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Comissões de Hotéis</h3>
          <span className="text-xs text-slate-400">— a comissão é retirada do hotel; o cliente paga só o serviço</span>
        </div>
        <AdminHotelCommissionManager />
      </div>

      {/* Withdrawal Requests Management */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Banknote className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900">Gestão de Saques</h3>
          <span className="text-xs text-slate-400">— aprovar, rejeitar ou marcar como pago os pedidos de levantamento dos profissionais</span>
        </div>
        <AdminWithdrawalsPanel />
      </div>
    </div>
  );
}