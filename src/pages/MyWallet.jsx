import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from "recharts";
import { 
  Wallet, Zap, Star, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft, 
  Gift, Dog, Crown, Sparkles, HelpCircle, CreditCard, DollarSign, Plus, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format, eachMonthOfInterval } from "date-fns";
import { pt, ptBR } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { toast } from "sonner";

const ACCENT_COLOR = "#f97316"; // Laranja (PawGo)

export default function MyWallet() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("client");
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [credits, setCredits] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  // Fetch user
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch wallet
  const { data: wallet } = useQuery({
    queryKey: ['myWallet', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
      return wallets[0] || {
        cashback_balance: 0,
        service_tokens: 0,
        total_points: 0,
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
      };
    },
    enabled: !!user?.email
  });

  // Fetch membership
  const { data: membership } = useQuery({
    queryKey: ['myMembership', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const plans = await base44.entities.MembershipPlan.filter({ 
        user_email: user.email,
        status: 'active'
      });
      return plans[0] || null;
    },
    enabled: !!user?.email
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['walletTransactions', user?.email],
    queryFn: () => base44.entities.WalletTransaction.filter({ 
      user_email: user.email 
    }, '-created_date', 50),
    enabled: !!user?.email
  });

  // Professional profiles
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

  // Bookings
  const { data: walkerBookings = [] } = useQuery({
    queryKey: ['walkerCompletedBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Booking.filter({ 
        walker_email: user.email, 
        status: 'completed' 
      }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: trainerBookings = [] } = useQuery({
    queryKey: ['trainerCompletedBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.TrainingBooking.filter({ 
        trainer_email: user.email, 
        status: 'completed' 
      }, '-created_date');
    },
    enabled: !!user?.email,
  });

  // Reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['professionalsReviews', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const walkerReviews = await base44.entities.Review.filter({ walker_id: user.id });
      const trainerReviews = await base44.entities.Review.filter({ trainer_id: user.id });
      return [...walkerReviews, ...trainerReviews];
    },
    enabled: !!user?.id,
  });

  // Walk checkpoints
  const { data: walkCheckpoints = [] } = useQuery({
    queryKey: ['walkCheckpoints', user?.email],
    queryFn: async () => {
      if (!walkerBookings.length) return [];
      const bookingIds = walkerBookings.map(b => b.id);
      const allCheckpoints = await base44.entities.WalkCheckpoint.list();
      return allCheckpoints.filter(cp => bookingIds.includes(cp.booking_id));
    },
    enabled: !!walkerBookings.length,
  });

  // Metrics
  const metrics = useMemo(() => {
    const allBookings = [...walkerBookings, ...trainerBookings];
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0';
    
    const totalKm = walkCheckpoints.reduce((sum, cp) => sum + (cp.distance_km || 0), 0);
    
    const monthlyData = {};
    const now = new Date();
    const last6Months = eachMonthOfInterval({
      start: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      end: now
    });
    
    last6Months.forEach(date => {
      const monthKey = format(date, 'MMM', { locale: pt });
      monthlyData[monthKey] = 0;
    });
    
    allBookings.forEach(booking => {
      if (booking.completed_date) {
        const monthKey = format(new Date(booking.completed_date), 'MMM', { locale: pt });
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey] += booking.service_amount || 0;
        }
      }
    });
    
    const monthlyChartData = Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      earnings: parseFloat(amount.toFixed(2))
    }));
    
    return {
      totalActivities: allBookings.length,
      avgRating,
      totalKm: totalKm.toFixed(0),
      monthlyChartData,
      totalEarnings: monthlyChartData.reduce((sum, m) => sum + m.earnings, 0).toFixed(2)
    };
  }, [walkerBookings, trainerBookings, reviews, walkCheckpoints]);

  // Mutations
  const addCreditsMutation = useMutation({
    mutationFn: async (amount) => {
      const session = await base44.functions.invoke('createStripeCheckout', {
        productName: `Créditos - €${amount}`,
        amount: Math.round(amount * 100),
        quantity: 1,
        walletTopup: true,
      });
      return session;
    },
    onSuccess: (session) => {
      if (session?.url) window.location.href = session.url;
      else toast.error('Erro ao gerar link');
    },
    onError: () => toast.error('Erro ao processar')
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount) => {
      if (amount > wallet?.available_balance) {
        throw new Error('Saldo insuficiente');
      }
      return await base44.functions.invoke('createPayoutToWalker', {
        amount,
        email: user.email,
        name: user.full_name
      });
    },
    onSuccess: () => {
      toast.success('Saque solicitado com sucesso!');
      setShowWithdraw(false);
      setWithdrawAmount('');
    },
    onError: (error) => toast.error(error.message)
  });

  const isProfessional = walkerProfile || trainerProfile;

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: ACCENT_COLOR }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8 px-4 pb-24 md:pb-8 selection:bg-orange-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR + "15" }}>
              <Wallet className="w-7 h-7" style={{ color: ACCENT_COLOR }} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white">Minha Wallet</h1>
              <p className="text-slate-400 text-sm">Gerencie seu saldo e ganhos</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-11">
            <TabsTrigger value="client">Cliente</TabsTrigger>
            {isProfessional && <TabsTrigger value="pro">Profissional</TabsTrigger>}
          </TabsList>

          {/* CLIENT TAB */}
          <TabsContent value="client" className="space-y-6">
            
            {/* Plan Card */}
            

            {/* Balances Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Tokens */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR + "15" }}>
                        <Zap className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                      </div>
                      {wallet?.tokens_expiry_date && (
                        <span className="text-xs font-medium text-slate-500">
                          {new Date(wallet.tokens_expiry_date) < new Date() 
                            ? 'Expirado' 
                            : `Expira ${format(new Date(wallet.tokens_expiry_date), 'dd/MM')}`}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-1 font-medium">Passeios Grátis</p>
                    <p className="text-2xl font-bold text-white">{wallet?.service_tokens || 0}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      €{((wallet?.service_tokens || 0) * (membership?.token_value || 12)).toFixed(2)} em valor
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Cashback */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR + "15" }}>
                        <Wallet className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                      </div>
                      <Badge className="text-xs" style={{ backgroundColor: ACCENT_COLOR + "20", color: ACCENT_COLOR }}>
                        {(membership?.cashback_rate * 100 || 0)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-1 font-medium">Crédito Interno</p>
                    <p className="text-2xl font-bold text-white">€{(wallet?.cashback_balance || 0).toFixed(2)}</p>
                    <p className="text-xs text-slate-500 mt-2">Ganhe em compras</p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Points */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR + "15" }}>
                        <Star className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                      </div>
                      <Badge className="text-xs" style={{ backgroundColor: ACCENT_COLOR + "20", color: ACCENT_COLOR }}>
                        {membership?.points_multiplier || 1}x
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-1 font-medium">Pontos</p>
                    <p className="text-2xl font-bold text-white">{(wallet?.total_points || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-500 mt-2">Troque por recompensas</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 font-medium"
                onClick={() => navigate(createPageUrl('Home'))}
              >
                <Dog className="w-4 h-4 mr-2" />
                Usar Token
              </Button>
              <Button
                variant="outline"
                className="h-12 font-medium"
                onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
              >
                <Gift className="w-4 h-4 mr-2" />
                Resgatar
              </Button>
            </motion.div>

            {/* Transactions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-white/10 pb-4">
                  <CardTitle className="text-lg">Transações Recentes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {transactions.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                      <Wallet className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Nenhuma transação</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {transactions.slice(0, 5).map((tx) => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{tx.description}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {format(new Date(tx.created_date), "dd/MM/yyyy HH:mm", { locale: pt })}
                            </p>
                          </div>
                          {tx.amount > 0 && (
                            <p className="font-semibold text-white">
                              {['cashback_earned', 'token_credited', 'points_earned'].includes(tx.transaction_type) ? '+' : '-'}€{tx.amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* PROFESSIONAL TAB */}
          {isProfessional && (
            <TabsContent value="pro" className="space-y-6">
              
              {/* Stats Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR + "15" }}>
                          <DollarSign className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mb-1">Saldo Disponível</p>
                      <p className="text-xl font-bold text-white">€{(wallet?.available_balance || 0).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR + "15" }}>
                          <Clock className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mb-1">Pendente</p>
                      <p className="text-xl font-bold text-white">€{(wallet?.pending_balance || 0).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR + "15" }}>
                          <TrendingUp className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mb-1">Total Ganho</p>
                      <p className="text-xl font-bold text-white">€{metrics.totalEarnings}</p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: ACCENT_COLOR + "15" }}>
                          <Star className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-medium mb-1">Avaliação</p>
                      <p className="text-xl font-bold text-white">⭐ {metrics.avgRating}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setShowAddCredits(true)}
                  className="h-12 font-medium text-white"
                  style={{ backgroundColor: ACCENT_COLOR }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Créditos
                </Button>
                <Button
                  onClick={() => setShowWithdraw(true)}
                  disabled={!wallet?.available_balance || wallet.available_balance <= 0}
                  variant="outline"
                  className="h-12 font-medium"
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Solicitar Saque
                </Button>
              </motion.div>

              {/* Chart */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b border-white/10 pb-4">
                    <CardTitle className="text-lg">Ganhos (Últimos 6 Meses)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={metrics.monthlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="month" stroke="#999" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                        <ChartTooltip 
                          formatter={(value) => `€${value.toFixed(2)}`}
                          contentStyle={{ backgroundColor: '#fff', border: `1px solid ${ACCENT_COLOR}` }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="earnings" 
                          stroke={ACCENT_COLOR} 
                          strokeWidth={2.5}
                          dot={{ fill: ACCENT_COLOR, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Activity */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="border-0 shadow-sm">
                  <CardHeader className="border-b border-white/10 pb-4">
                    <CardTitle className="text-lg">Atividades</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{walkerBookings.length}</p>
                      <p className="text-xs text-slate-400 mt-1">Passeios</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{trainerBookings.length}</p>
                      <p className="text-xs text-slate-400 mt-1">Treinos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{reviews.length}</p>
                      <p className="text-xs text-slate-400 mt-1">Avaliações</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{metrics.totalKm} km</p>
                      <p className="text-xs text-slate-400 mt-1">Distância</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Add Credits Modal */}
      <Dialog open={showAddCredits} onOpenChange={setShowAddCredits}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
              Adicionar Créditos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-white block mb-2">Valor (€)</label>
              <Input
                type="number"
                placeholder="50"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                min="5"
                step="5"
                className="h-10"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[25, 50, 100].map(v => (
                <Button
                  key={v}
                  variant={credits === v.toString() ? 'default' : 'outline'}
                  onClick={() => setCredits(v.toString())}
                  className="text-sm"
                  style={credits === v.toString() ? { backgroundColor: ACCENT_COLOR } : {}}
                >
                  €{v}
                </Button>
              ))}
            </div>
            <div className="bg-slate-900/40 p-3 rounded-lg">
              <p className="text-xs text-slate-400">
                <strong>Total:</strong> €{(parseFloat(credits) || 0).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAddCredits(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!credits || parseFloat(credits) < 5) {
                    toast.error('Mínimo €5');
                    return;
                  }
                  addCreditsMutation.mutate(parseFloat(credits));
                }}
                disabled={addCreditsMutation.isPending}
                className="flex-1 text-white"
                style={{ backgroundColor: ACCENT_COLOR }}
              >
                {addCreditsMutation.isPending ? 'Processando...' : 'Pagar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5" style={{ color: ACCENT_COLOR }} />
              Solicitar Saque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: ACCENT_COLOR + "10", border: `1px solid ${ACCENT_COLOR}20` }}>
              <p className="text-xs text-slate-400 font-medium">Saldo Disponível</p>
              <p className="text-2xl font-bold mt-1" style={{ color: ACCENT_COLOR }}>
                €{(wallet?.available_balance || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-white block mb-2">Valor (€)</label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={wallet?.available_balance || 0}
                step="0.01"
                className="h-10"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowWithdraw(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const amount = parseFloat(withdrawAmount);
                  if (!amount || amount <= 0) {
                    toast.error('Valor inválido');
                    return;
                  }
                  withdrawMutation.mutate(amount);
                }}
                disabled={withdrawMutation.isPending}
                className="flex-1 text-white"
                style={{ backgroundColor: ACCENT_COLOR }}
              >
                {withdrawMutation.isPending ? 'Processando...' : 'Sacar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}