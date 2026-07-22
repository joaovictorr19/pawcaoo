import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from "recharts";
import {
  Wallet, Zap, Star, TrendingUp, Clock, ArrowUpRight,
  Gift, Dog, CreditCard, DollarSign, Plus, Loader2,
  Banknote, PiggyBank, Receipt
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, eachMonthOfInterval } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import BankCard from "@/components/wallet/BankCard";
import TransactionItem from "@/components/wallet/TransactionItem";
import WithdrawalHistory from "@/components/wallet/WithdrawalHistory";
import TopUpModal from "@/components/wallet/TopUpModal";

const TX_FILTERS = [
  { key: "all", label: "Todas" },
  { key: "incoming", label: "Entradas" },
  { key: "outgoing", label: "Saídas" },
  { key: "tokens", label: "Tokens" },
  { key: "points", label: "Pontos" },
];

const INCOMING_TYPES = ["cashback_earned", "token_credited", "points_earned", "escrow_released", "walker_payment_pending", "walker_payment_completed"];
const OUTGOING_TYPES = ["cashback_used", "token_used", "token_expired", "points_redeemed", "escrow_reserved", "surcharge_paid"];
const TOKEN_TYPES = ["token_credited", "token_used", "token_expired"];
const POINT_TYPES = ["points_earned", "points_redeemed"];

export default function MyWallet() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("client");
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [credits, setCredits] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [txFilter, setTxFilter] = useState("all");

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: wallet } = useQuery({
    queryKey: ['myWallet', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
      const w = wallets[0] || null;
      return {
        user_email: user.email,
        cashback_balance: w?.cashback_balance || 0,
        service_tokens: w?.service_tokens || 0,
        total_points: w?.total_points || 0,
        escrow_balance: w?.escrow_balance || 0,
        pending_walker_payments: w?.pending_walker_payments || 0,
        available_balance: w?.available_balance || 0,
        pending_balance: w?.pending_balance || 0,
        total_earnings: w?.total_earnings || 0,
        tokens_expiry_date: w?.tokens_expiry_date || null,
        last_renewal_date: w?.last_renewal_date || null,
        cycle_start_date: w?.cycle_start_date || null,
      };
    },
    enabled: !!user?.email
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['walletTransactions', user?.email],
    queryFn: () => base44.entities.WalletTransaction.filter({ user_email: user.email }, '-created_date', 100),
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

  const { data: withdrawals = [] } = useQuery({
    queryKey: ['myWithdrawals', user?.email],
    queryFn: () => base44.entities.IbanWithdrawalRequest.filter({ user_email: user.email }, '-created_date', 20),
    enabled: !!user?.email,
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

    const thisMonth = now.getMonth();
    const thisMonthEarnings = allBookings
      .filter(b => b.completed_date && new Date(b.completed_date).getMonth() === thisMonth)
      .reduce((sum, b) => sum + (b.service_amount || 0), 0);

    return {
      totalActivities: allBookings.length,
      avgRating,
      monthlyChartData,
      totalEarnings: monthlyChartData.reduce((sum, m) => sum + m.earnings, 0).toFixed(2),
      thisMonthEarnings
    };
  }, [walkerBookings, trainerBookings, reviews]);

  const clientFunds = wallet?.cashback_balance || 0;
  const clientTotalValue = clientFunds + (wallet?.service_tokens || 0) * 12 + (wallet?.total_points || 0) * 0.01;
  const professionalAvailable = (wallet?.available_balance || 0) + (wallet?.pending_walker_payments || 0);
  const professionalPendingHotel = wallet?.pending_balance || 0;
  const professionalTotalBalance = professionalAvailable + professionalPendingHotel;

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
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email });
      const trainerProfiles = await base44.entities.TrainerProfile.filter({ created_by: user.email });
      const iban = profiles[0]?.bank_account_number || trainerProfiles[0]?.bank_account_number;
      if (!iban) throw new Error('Adicione o IBAN primeiro nas definições fiscais');
      const response = await base44.functions.invoke('requestWalletWithdrawal', { amount, iban });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Pedido de saque enviado com sucesso');
      setShowWithdraw(false);
      setWithdrawAmount('');
      queryClient.invalidateQueries({ queryKey: ['myWallet'] });
      queryClient.invalidateQueries({ queryKey: ['myWithdrawals'] });
    },
    onError: (error) => toast.error(error?.response?.data?.error || error.message || 'Erro ao processar saque')
  });

  const isProfessional = walkerProfile || trainerProfile;

  const filteredTx = useMemo(() => {
    if (txFilter === "all") return transactions;
    if (txFilter === "incoming") return transactions.filter(t => INCOMING_TYPES.includes(t.transaction_type));
    if (txFilter === "outgoing") return transactions.filter(t => OUTGOING_TYPES.includes(t.transaction_type));
    if (txFilter === "tokens") return transactions.filter(t => TOKEN_TYPES.includes(t.transaction_type));
    if (txFilter === "points") return transactions.filter(t => POINT_TYPES.includes(t.transaction_type));
    return transactions;
  }, [transactions, txFilter]);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      {/* Sticky header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-teal-600" />
          </div>
          <h1 className="text-base font-bold text-slate-900">Minha Wallet</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-5">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full mb-5 h-11 bg-white border border-slate-200 rounded-xl shadow-sm" style={{ gridTemplateColumns: isProfessional ? '1fr 1fr' : '1fr' }}>
            <TabsTrigger value="client" className="rounded-lg text-sm font-semibold data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Wallet className="w-3.5 h-3.5 mr-1.5" /> Cliente
            </TabsTrigger>
            {isProfessional && (
              <TabsTrigger value="pro" className="rounded-lg text-sm font-semibold data-[state=active]:bg-teal-600 data-[state=active]:text-white">
                <Banknote className="w-3.5 h-3.5 mr-1.5" /> Profissional
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── CLIENT TAB ── */}
          <TabsContent value="client" className="space-y-5">
            {/* Main bank card */}
            <BankCard
              balance={`€${clientFunds.toFixed(2)}`}
              label="PawCão Wallet"
              subtitle="Saldo Disponível"
              icon={Wallet}
              variant="teal"
              footer={
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70">Valor total estimado</span>
                  <span className="font-bold text-white">€{clientTotalValue.toFixed(2)}</span>
                </div>
              }
            />

            {/* Balance breakdown */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Tokens", value: wallet?.service_tokens || 0, icon: <Zap className="w-4 h-4 text-orange-500" />, bg: "bg-orange-50 border-orange-100",
                  sub: wallet?.tokens_expiry_date
                    ? (new Date(wallet.tokens_expiry_date) < new Date() ? 'Expirado' : `Expira ${format(new Date(wallet.tokens_expiry_date), 'dd/MM')}`)
                    : 'Passeios grátis' },
                { label: "Cashback", value: `€${clientFunds.toFixed(2)}`, icon: <PiggyBank className="w-4 h-4 text-blue-500" />, bg: "bg-blue-50 border-blue-100", sub: "Para serviços" },
                { label: "Pontos", value: (wallet?.total_points || 0).toLocaleString(), icon: <Star className="w-4 h-4 text-yellow-500" />, bg: "bg-yellow-50 border-yellow-100", sub: "Troque por prémios" },
              ].map(item => (
                <div key={item.label} className={`${item.bg} border rounded-2xl p-3.5`}>
                  <div className="mb-2">{item.icon}</div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{item.label}</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Escrow info */}
            {(wallet?.escrow_balance || 0) > 0 && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <PiggyBank className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Cofre de Reserva</p>
                  <p className="text-xs text-slate-400">Valor cativo para pagar Dog Walkers</p>
                </div>
                <p className="text-lg font-bold text-blue-600">€{(wallet?.escrow_balance || 0).toFixed(2)}</p>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={() => setShowAddCredits(true)} className="h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm">
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    Transações
                  </h3>
                </div>
                {/* Filter pills */}
                <div className="flex gap-1.5 overflow-x-auto">
                  <div className="flex gap-1.5 bg-slate-50 border border-slate-200 rounded-full p-1">
                    {TX_FILTERS.map(f => (
                      <button
                        key={f.key}
                        onClick={() => setTxFilter(f.key)}
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                          txFilter === f.key
                            ? "bg-teal-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {filteredTx.length === 0 ? (
                <div className="p-10 text-center">
                  <Wallet className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                  <p className="text-sm text-slate-400">Nenhuma transação encontrada</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                  {filteredTx.slice(0, 30).map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── PRO TAB ── */}
          {isProfessional && (
            <TabsContent value="pro" className="space-y-5">
              {/* Main bank card */}
              <BankCard
                balance={`€${professionalAvailable.toFixed(2)}`}
                label="Conta Profissional"
                subtitle="Disponível para Saque"
                icon={Banknote}
                variant="dark"
                footer={
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-white/50 block">Pendente (Hotel)</span>
                      <span className="font-bold text-amber-300">€{professionalPendingHotel.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white/50 block">Saldo Total</span>
                      <span className="font-bold text-white">€{professionalTotalBalance.toFixed(2)}</span>
                    </div>
                  </div>
                }
              />

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Este Mês", value: `€${metrics.thisMonthEarnings.toFixed(2)}`, icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, bg: "bg-emerald-50 border-emerald-100" },
                  { label: "Total Ganho", value: `€${(wallet?.total_earnings || 0).toFixed(2)}`, icon: <DollarSign className="w-4 h-4 text-teal-500" />, bg: "bg-teal-50 border-teal-100" },
                  { label: "Pendente Walker", value: `€${(wallet?.pending_walker_payments || 0).toFixed(2)}`, icon: <Clock className="w-4 h-4 text-amber-500" />, bg: "bg-amber-50 border-amber-100" },
                  { label: "Avaliação", value: `⭐ ${metrics.avgRating}`, icon: <Star className="w-4 h-4 text-yellow-500" />, bg: "bg-yellow-50 border-yellow-100" },
                ].map(item => (
                  <div key={item.label} className={`${item.bg} border rounded-2xl p-3.5`}>
                    <div className="mb-2">{item.icon}</div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{item.label}</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => setShowWithdraw(true)} disabled={professionalAvailable <= 0}
                  className="h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold disabled:opacity-40">
                  <ArrowUpRight className="w-4 h-4 mr-2" /> Solicitar Saque
                </Button>
                <Button onClick={() => navigate(createPageUrl('WalkerWallet'))} variant="outline"
                  className="h-11 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold">
                  <Receipt className="w-4 h-4 mr-2" /> Ver Extrato
                </Button>
              </div>

              {/* Earnings chart */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 text-sm mb-4">Ganhos — Últimos 6 Meses</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={metrics.monthlyChartData}>
                    <defs>
                      <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0d9488" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '11px' }} />
                    <ChartTooltip
                      formatter={(v) => [`€${v.toFixed(2)}`, 'Ganhos']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="earnings" stroke="#0d9488" strokeWidth={2.5}
                      fill="url(#earningsGrad)" dot={{ fill: '#0d9488', r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Activity stats */}
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

              {/* Withdrawal history */}
              <WithdrawalHistory withdrawals={withdrawals} />

              {/* Pro transactions */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    Transações Profissionais
                  </h3>
                </div>
                {transactions.filter(t => ["walker_payment_pending", "walker_payment_completed", "escrow_released", "surcharge_paid"].includes(t.transaction_type)).length === 0 ? (
                  <div className="p-10 text-center">
                    <Banknote className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="text-sm text-slate-400">Sem transações profissionais</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                    {transactions
                      .filter(t => ["walker_payment_pending", "walker_payment_completed", "escrow_released", "surcharge_paid"].includes(t.transaction_type))
                      .slice(0, 20)
                      .map((tx) => (
                        <TransactionItem key={tx.id} tx={tx} />
                      ))}
                    </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Top Up Modal */}
      <TopUpModal
        open={showAddCredits}
        onOpenChange={setShowAddCredits}
        onConfirm={(amount) => addCreditsMutation.mutate(amount)}
        isLoading={addCreditsMutation.isPending}
      />

      {/* Withdraw Modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="max-w-sm rounded-3xl border border-slate-200 bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <ArrowUpRight className="w-5 h-5 text-teal-600" /> Solicitar Saque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100">
              <p className="text-xs text-slate-400 font-medium">Saldo Disponível</p>
              <p className="text-2xl font-bold text-teal-600 mt-1">€{professionalAvailable.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Valor (€)</label>
              <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                max={professionalAvailable || 0} step="0.01" className="h-11 rounded-xl border-slate-200" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowWithdraw(false)} className="flex-1 rounded-xl border-slate-200">Cancelar</Button>
              <Button onClick={() => {
                const amount = parseFloat(withdrawAmount);
                if (!amount || amount <= 0) { toast.error('Valor inválido'); return; }
                withdrawMutation.mutate(amount);
              }} disabled={withdrawMutation.isPending} className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white">
                {withdrawMutation.isPending ? 'A processar...' : 'Sacar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}