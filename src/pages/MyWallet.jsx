import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from "recharts";
import {
  Wallet, Zap, Star, TrendingUp, Clock, ArrowUpRight,
  Gift, Dog, CreditCard, DollarSign, Plus, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format, eachMonthOfInterval } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

export default function MyWallet() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("client");
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [credits, setCredits] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: wallet } = useQuery({
    queryKey: ['myWallet', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
      const savedWallet = wallets[0] || null;
      return {
        user_email: user.email,
        cashback_balance: savedWallet?.cashback_balance || 0,
        service_tokens: savedWallet?.service_tokens || 0,
        total_points: savedWallet?.total_points || 0,
        escrow_balance: savedWallet?.escrow_balance || 0,
        pending_walker_payments: savedWallet?.pending_walker_payments || 0,
        tokens_expiry_date: savedWallet?.tokens_expiry_date || null,
      };
    },
    enabled: !!user?.email
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['walletTransactions', user?.email],
    queryFn: () => base44.entities.WalletTransaction.filter({ user_email: user.email }, '-created_date', 50),
    enabled: !!user?.email
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ['walkerProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ['trainerProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.TrainerProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  const { data: walkerBookings = [] } = useQuery({
    queryKey: ['walkerCompletedBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Booking.filter({ walker_email: user.email, status: 'completed' }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: trainerBookings = [] } = useQuery({
    queryKey: ['trainerCompletedBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.TrainingBooking.filter({ trainer_email: user.email, status: 'completed' }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['professionalsReviews', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const [walkerReviews, trainerReviews] = await Promise.all([
        base44.entities.Review.filter({ walker_id: user.id }),
        base44.entities.Review.filter({ trainer_id: user.id }),
      ]);
      return [...walkerReviews, ...trainerReviews];
    },
    enabled: !!user?.id,
  });

  const metrics = useMemo(() => {
    const allBookings = [...walkerBookings, ...trainerBookings];
    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

    const monthlyData = {};
    const now = new Date();
    eachMonthOfInterval({
      start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      end: now
    }).forEach(date => {
      monthlyData[format(date, 'MMM', { locale: pt })] = 0;
    });

    allBookings.forEach(booking => {
      if (booking.completed_date) {
        const key = format(new Date(booking.completed_date), 'MMM', { locale: pt });
        if (key in monthlyData) monthlyData[key] += booking.service_amount || 0;
      }
    });

    const monthlyChartData = Object.entries(monthlyData).map(([month, amount]) => ({
      month, earnings: parseFloat(amount.toFixed(2))
    }));

    return {
      totalActivities: allBookings.length,
      avgRating,
      monthlyChartData,
      totalEarnings: monthlyChartData.reduce((sum, m) => sum + m.earnings, 0).toFixed(2)
    };
  }, [walkerBookings, trainerBookings, reviews]);

  const clientFunds = wallet?.cashback_balance || 0;
  const professionalPending = wallet?.pending_walker_payments || 0;

  const addCreditsMutation = useMutation({
    mutationFn: async (amount) => {
      const response = await base44.functions.invoke('createStripeCheckout', {
        productName: `Créditos - €${amount}`,
        amount: Math.round(amount * 100),
        quantity: 1,
        walletTopup: true,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
      else toast.error('Erro ao gerar link');
    },
    onError: () => toast.error('Erro ao processar')
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount) => {
      const payouts = await base44.entities.WalkerPayout.filter({ walker_email: user.email, status: 'pending' }, '-created_date', 100);
      const totalPending = payouts.reduce((sum, item) => sum + (item.net_amount || 0), 0);
      if (amount > totalPending) throw new Error('Saldo insuficiente');
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email });
      const trainerProfiles = await base44.entities.TrainerProfile.filter({ created_by: user.email });
      const iban = profiles[0]?.bank_account_number || trainerProfiles[0]?.bank_account_number;
      if (!iban) throw new Error('Adicione o IBAN primeiro nas definições fiscais');
      return base44.entities.IbanWithdrawalRequest.create({ user_email: user.email, iban, amount });
    },
    onSuccess: () => {
      toast.success('Pedido de saque enviado com sucesso');
      setShowWithdraw(false);
      setWithdrawAmount('');
      queryClient.invalidateQueries({ queryKey: ['myWallet'] });
    },
    onError: (error) => toast.error(error.message)
  });

  const isProfessional = walkerProfile || trainerProfile;

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 pt-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Minha Wallet</h1>
            <p className="text-slate-400 text-sm">Gerencie o seu saldo e ganhos</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full mb-6 h-10 bg-slate-100 rounded-xl" style={{ gridTemplateColumns: isProfessional ? '1fr 1fr' : '1fr' }}>
            <TabsTrigger value="client" className="rounded-lg text-sm font-medium">Cliente</TabsTrigger>
            {isProfessional && <TabsTrigger value="pro" className="rounded-lg text-sm font-medium">Profissional</TabsTrigger>}
          </TabsList>

          {/* ── CLIENT TAB ── */}
          <TabsContent value="client" className="space-y-5">

            {/* Balances */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Tokens", value: wallet?.service_tokens || 0, icon: <Zap className="w-4 h-4 text-orange-500" />, bg: "bg-orange-50 border-orange-100", val: null,
                  sub: wallet?.tokens_expiry_date
                    ? (new Date(wallet.tokens_expiry_date) < new Date() ? 'Expirado' : `Expira ${format(new Date(wallet.tokens_expiry_date), 'dd/MM')}`)
                    : 'Passeios grátis' },
                { label: "Saldo", value: `€${clientFunds.toFixed(2)}`, icon: <Wallet className="w-4 h-4 text-blue-500" />, bg: "bg-blue-50 border-blue-100", sub: "Para serviços" },
                { label: "Pontos", value: (wallet?.total_points || 0).toLocaleString(), icon: <Star className="w-4 h-4 text-yellow-500" />, bg: "bg-yellow-50 border-yellow-100", sub: "Troque por prémios" },
              ].map(item => (
                <div key={item.label} className={`${item.bg} border rounded-2xl p-4`}>
                  <div className="mb-3">{item.icon}</div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{item.label}</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{item.value}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => setShowAddCredits(true)} className="h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold text-sm">
                <Plus className="w-4 h-4 mr-1" /> Carregar
              </Button>
              <Button onClick={() => navigate(createPageUrl('Home'))} variant="outline" className="h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-sm">
                <Dog className="w-4 h-4 mr-1" /> Usar Token
              </Button>
              <Button onClick={() => navigate(createPageUrl('LoyaltyRewards'))} variant="outline" className="h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold text-sm">
                <Gift className="w-4 h-4 mr-1" /> Resgatar
              </Button>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Transações Recentes</h3>
              </div>
              {transactions.length === 0 ? (
                <div className="p-10 text-center">
                  <Wallet className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  <p className="text-sm text-slate-400">Nenhuma transação ainda</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {transactions.slice(0, 8).map((tx) => (
                    <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{tx.description}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(new Date(tx.created_date), "dd/MM/yyyy HH:mm", { locale: pt })}
                        </p>
                      </div>
                      {tx.amount > 0 && (
                        <p className={`font-semibold text-sm ${['cashback_earned', 'token_credited', 'points_earned'].includes(tx.transaction_type) ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {['cashback_earned', 'token_credited', 'points_earned'].includes(tx.transaction_type) ? '+' : '-'}€{tx.amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── PRO TAB ── */}
          {isProfessional && (
            <TabsContent value="pro" className="space-y-5">

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Disponível p/ Saque", value: `€${professionalPending.toFixed(2)}`, icon: <DollarSign className="w-4 h-4 text-emerald-500" />, bg: "bg-emerald-50 border-emerald-100" },
                  { label: "Em Cofre", value: `€${(wallet?.escrow_balance || 0).toFixed(2)}`, icon: <Clock className="w-4 h-4 text-blue-500" />, bg: "bg-blue-50 border-blue-100" },
                  { label: "Total Ganho", value: `€${metrics.totalEarnings}`, icon: <TrendingUp className="w-4 h-4 text-orange-500" />, bg: "bg-orange-50 border-orange-100" },
                  { label: "Avaliação Média", value: `⭐ ${metrics.avgRating}`, icon: <Star className="w-4 h-4 text-yellow-500" />, bg: "bg-yellow-50 border-yellow-100" },
                ].map(item => (
                  <div key={item.label} className={`${item.bg} border rounded-2xl p-4`}>
                    <div className="mb-2">{item.icon}</div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{item.label}</p>
                    <p className="text-xl font-bold text-slate-900 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => setShowAddCredits(true)} className="h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold">
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Créditos
                </Button>
                <Button onClick={() => setShowWithdraw(true)} disabled={professionalPending <= 0} variant="outline"
                  className="h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold disabled:opacity-40">
                  <ArrowUpRight className="w-4 h-4 mr-2" /> Solicitar Saque
                </Button>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-4">Ganhos — Últimos 6 Meses</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={metrics.monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <ChartTooltip
                      formatter={(v) => `€${v.toFixed(2)}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="earnings" stroke="#f97316" strokeWidth={2.5}
                      dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Activity grid */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-4">Atividade</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{walkerBookings.length}</p>
                    <p className="text-xs text-slate-400 mt-1">Passeios</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{trainerBookings.length}</p>
                    <p className="text-xs text-slate-400 mt-1">Treinos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{reviews.length}</p>
                    <p className="text-xs text-slate-400 mt-1">Avaliações</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Add Credits Modal */}
      <Dialog open={showAddCredits} onOpenChange={setShowAddCredits}>
        <DialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                Adicionar fundos
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm text-white/85">Escolha um valor para carregar a sua carteira.</p>
          </div>
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-3 gap-3">
              {[10, 25, 50].map((v) => (
                <button key={v} type="button" onClick={() => setCredits(v.toString())}
                  className={`rounded-2xl border px-4 py-4 text-center transition-all ${credits === v.toString() ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-orange-300'}`}>
                  <div className="text-xs font-medium text-slate-400">Adicionar</div>
                  <div className="mt-1 text-lg font-bold">€{v}</div>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">Outro valor</label>
              <Input type="number" placeholder="Ex: 30" value={credits} onChange={(e) => setCredits(e.target.value)}
                min="5" step="1" className="h-12 rounded-2xl border-slate-200 bg-slate-50 focus-visible:ring-orange-400" />
              <p className="text-xs text-slate-400">Valor mínimo: €5</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">Total a pagar</span>
              <span className="text-lg font-bold text-slate-900">€{(parseFloat(credits) || 0).toFixed(2)}</span>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowAddCredits(false)} className="rounded-2xl border-slate-200">Fechar</Button>
              <Button onClick={() => {
                if (!credits || parseFloat(credits) < 5) { toast.error('Mínimo €5'); return; }
                addCreditsMutation.mutate(parseFloat(credits));
              }} disabled={addCreditsMutation.isPending} className="rounded-2xl bg-orange-500 hover:bg-orange-600 text-white">
                {addCreditsMutation.isPending ? 'A abrir pagamento...' : 'Continuar para pagamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="max-w-sm rounded-3xl border border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <ArrowUpRight className="w-5 h-5 text-orange-500" /> Solicitar Saque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
              <p className="text-xs text-slate-400 font-medium">Saldo Disponível</p>
              <p className="text-2xl font-bold text-orange-500 mt-1">€{professionalPending.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Valor (€)</label>
              <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                max={professionalPending || 0} step="0.01" className="h-11 rounded-xl border-slate-200" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowWithdraw(false)} className="flex-1 rounded-xl border-slate-200">Cancelar</Button>
              <Button onClick={() => {
                const amount = parseFloat(withdrawAmount);
                if (!amount || amount <= 0) { toast.error('Valor inválido'); return; }
                withdrawMutation.mutate(amount);
              }} disabled={withdrawMutation.isPending} className="flex-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white">
                {withdrawMutation.isPending ? 'A processar...' : 'Sacar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}