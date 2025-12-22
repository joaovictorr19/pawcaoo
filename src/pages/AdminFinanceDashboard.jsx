import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, DollarSign, Users, Zap, Gift, ShoppingBag, 
  AlertCircle, CheckCircle, Clock, ArrowUpRight, ArrowDownRight,
  PieChart, BarChart3, Calendar, Crown, Wallet
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, BarChart, Bar, Legend } from "recharts";

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function AdminFinanceDashboard() {
  const navigate = useNavigate();
  const [periodFilter, setPeriodFilter] = useState('month');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Redirect if not admin
  if (user && user.role !== 'admin') {
    navigate(createPageUrl('Home'));
    return null;
  }

  const { data: revenue = [], isLoading: loadingRevenue } = useQuery({
    queryKey: ['platformRevenue', periodFilter],
    queryFn: () => base44.entities.PlatformRevenue.list('-created_date', 500),
    enabled: user?.role === 'admin'
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ['allMemberships'],
    queryFn: () => base44.entities.MembershipPlan.filter({ status: 'active' }),
    enabled: user?.role === 'admin'
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['allWallets'],
    queryFn: () => base44.entities.UserWallet.list(),
    enabled: user?.role === 'admin'
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['walkerPayouts'],
    queryFn: () => base44.entities.WalkerPayout.list('-created_date', 100),
    enabled: user?.role === 'admin'
  });

  // Calculate metrics
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthRevenue = revenue.filter(r => r.period_month === currentMonth);
  
  const metrics = {
    // Total revenue by type
    subscriptions: monthRevenue.filter(r => r.revenue_type === 'subscription').reduce((sum, r) => sum + r.gross_amount, 0),
    breakage: monthRevenue.filter(r => r.revenue_type === 'breakage').reduce((sum, r) => sum + r.net_profit, 0),
    shopMargin: monthRevenue.filter(r => r.revenue_type === 'shop_margin').reduce((sum, r) => sum + r.net_profit, 0),
    commissions: monthRevenue.filter(r => r.revenue_type === 'commission').reduce((sum, r) => sum + r.net_profit, 0),
    
    // Net profit
    totalNetProfit: monthRevenue.reduce((sum, r) => sum + r.net_profit, 0),
    totalGross: monthRevenue.reduce((sum, r) => sum + r.gross_amount, 0),
    totalCosts: monthRevenue.reduce((sum, r) => sum + r.cost_amount, 0),
    
    // Active subscriptions by plan
    planCounts: {
      BASIC: memberships.filter(m => m.plan_type === 'BASIC').length,
      PREMIUM: memberships.filter(m => m.plan_type === 'PREMIUM').length,
      VIP: memberships.filter(m => m.plan_type === 'VIP').length
    },
    
    // Escrow and pending
    totalEscrow: wallets.reduce((sum, w) => sum + (w.escrow_balance || 0), 0),
    totalPendingPayouts: wallets.reduce((sum, w) => sum + (w.pending_walker_payments || 0), 0),
    totalCashbackLiability: wallets.reduce((sum, w) => sum + (w.cashback_balance || 0), 0),
    
    // Potential breakage (unused tokens value)
    potentialBreakage: wallets.reduce((sum, w) => sum + (w.escrow_balance || 0), 0),
    
    // Payout stats
    pendingPayouts: payouts.filter(p => p.status === 'pending').length,
    completedPayouts: payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.net_amount, 0)
  };

  // Revenue by type chart data
  const revenueByType = [
    { name: 'Subscrições', value: metrics.subscriptions, color: '#3b82f6' },
    { name: 'Breakage', value: metrics.breakage, color: '#10b981' },
    { name: 'Loja', value: metrics.shopMargin, color: '#f59e0b' },
    { name: 'Comissões', value: metrics.commissions, color: '#8b5cf6' }
  ].filter(r => r.value > 0);

  // Plan distribution
  const planDistribution = [
    { name: 'Basic', value: metrics.planCounts.BASIC, color: '#3b82f6' },
    { name: 'Premium', value: metrics.planCounts.PREMIUM, color: '#8b5cf6' },
    { name: 'VIP', value: metrics.planCounts.VIP, color: '#f59e0b' }
  ];

  // Monthly MRR
  const monthlyMRR = 
    (metrics.planCounts.BASIC * 19.99) + 
    (metrics.planCounts.PREMIUM * 44.99) + 
    (metrics.planCounts.VIP * 79.99);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Dashboard Financeiro</h1>
            <p className="text-slate-400">Análise de receitas, margens e métricas da plataforma</p>
          </div>
          <div className="flex gap-3">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white">MRR</Badge>
                </div>
                <p className="text-3xl font-black">€{monthlyMRR.toFixed(2)}</p>
                <p className="text-sm opacity-80">Receita Recorrente Mensal</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-green-600 to-emerald-700 border-0 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white">Lucro</Badge>
                </div>
                <p className="text-3xl font-black">€{metrics.totalNetProfit.toFixed(2)}</p>
                <p className="text-sm opacity-80">Lucro Líquido (Mês)</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-0 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Gift className="w-8 h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white">Extra</Badge>
                </div>
                <p className="text-3xl font-black">€{metrics.breakage.toFixed(2)}</p>
                <p className="text-sm opacity-80">Breakage (Tokens Expirados)</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-gradient-to-br from-orange-500 to-amber-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="w-8 h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white">Potencial</Badge>
                </div>
                <p className="text-3xl font-black">€{metrics.potentialBreakage.toFixed(2)}</p>
                <p className="text-sm opacity-80">Breakage Potencial</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Type */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Receita por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={revenueByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: €${value.toFixed(0)}`}
                    >
                      {revenueByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions by Plan */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Subscrições Ativas por Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-400">{metrics.planCounts.BASIC}</p>
                  <p className="text-xs text-slate-400">Basic (€19.99)</p>
                </div>
                <div className="text-center p-3 bg-purple-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-400">{metrics.planCounts.PREMIUM}</p>
                  <p className="text-xs text-slate-400">Premium (€44.99)</p>
                </div>
                <div className="text-center p-3 bg-amber-500/20 rounded-lg">
                  <p className="text-2xl font-bold text-amber-400">{metrics.planCounts.VIP}</p>
                  <p className="text-xs text-slate-400">VIP (€79.99)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Health */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Escrow Status */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-400" />
                Cofre (Escrow)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-500/20 rounded-lg">
                <span className="text-slate-300">Total Reservado</span>
                <span className="text-xl font-bold text-blue-400">€{metrics.totalEscrow.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-500/20 rounded-lg">
                <span className="text-slate-300">Pagamentos Pendentes</span>
                <span className="text-xl font-bold text-yellow-400">€{metrics.totalPendingPayouts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg">
                <span className="text-slate-300">Breakage Potencial</span>
                <span className="text-xl font-bold text-green-400">€{metrics.potentialBreakage.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Liabilities */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-400" />
                Passivos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-orange-500/20 rounded-lg">
                <span className="text-slate-300">Cashback Acumulado</span>
                <span className="text-xl font-bold text-orange-400">€{metrics.totalCashbackLiability.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-500">
                * Cashback só pode ser usado dentro da loja PawCão, garantindo retorno ao ecossistema
              </p>
            </CardContent>
          </Card>

          {/* Walker Payouts */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                Pagamentos a Walkers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-yellow-500/20 rounded-lg">
                <span className="text-slate-300">Pendentes</span>
                <span className="text-xl font-bold text-yellow-400">{metrics.pendingPayouts}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-500/20 rounded-lg">
                <span className="text-slate-300">Total Pago (Mês)</span>
                <span className="text-xl font-bold text-green-400">€{metrics.completedPayouts.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Transações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenue.slice(0, 10).map((tx) => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tx.revenue_type === 'subscription' ? 'bg-blue-500/20' :
                      tx.revenue_type === 'breakage' ? 'bg-green-500/20' :
                      tx.revenue_type === 'shop_margin' ? 'bg-orange-500/20' :
                      'bg-purple-500/20'
                    }`}>
                      {tx.revenue_type === 'subscription' && <Crown className="w-5 h-5 text-blue-400" />}
                      {tx.revenue_type === 'breakage' && <Gift className="w-5 h-5 text-green-400" />}
                      {tx.revenue_type === 'shop_margin' && <ShoppingBag className="w-5 h-5 text-orange-400" />}
                      {tx.revenue_type === 'commission' && <DollarSign className="w-5 h-5 text-purple-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-white">{tx.description}</p>
                      <p className="text-xs text-slate-400">
                        {tx.user_email} • {format(new Date(tx.created_date), "dd/MM HH:mm", { locale: pt })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">+€{tx.net_profit.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">Bruto: €{tx.gross_amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}