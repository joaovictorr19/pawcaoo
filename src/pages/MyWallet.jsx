import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  Wallet, Zap, Star, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft, 
  Gift, ShoppingBag, Dog, Calendar, Crown, Sparkles, HelpCircle, Info, 
  CreditCard, DollarSign, CheckCircle, AlertCircle, Download, Plus, Loader2, Award, MapPin
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { pt, ptBR } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { toast } from "sonner";

export default function MyWallet() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [showGuide, setShowGuide] = useState(false);
  const [showAddCredits, setShowAddCredits] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [credits, setCredits] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeTab, setActiveTab] = useState("client");

  // Fetch user
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Fetch client wallet
  const { data: wallet } = useQuery({
    queryKey: ['myWallet', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const wallets = await base44.entities.UserWallet.filter({ 
        user_email: user.email 
      });
      return wallets[0] || {
        cashback_balance: 0,
        service_tokens: 0,
        total_points: 0,
        escrow_balance: 0,
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0,
        monthly_earnings: 0
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

  // Fetch professional profile
  const { data: walkerProfile } = useQuery({
    queryKey: ['walkerProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.WalkerProfile.filter({ 
        created_by: user.email 
      });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  // Fetch trainer profile
  const { data: trainerProfile } = useQuery({
    queryKey: ['trainerProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.TrainerProfile.filter({ 
        created_by: user.email 
      });
      return profiles[0] || null;
    },
    enabled: !!user?.email
  });

  // Fetch completed walker bookings
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

  // Fetch completed training bookings
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

  // Fetch reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['professionalsReviews', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const walkerReviews = await base44.entities.Review.filter({ 
        walker_id: user.id 
      });
      const trainerReviews = await base44.entities.Review.filter({ 
        trainer_id: user.id 
      });
      return [...walkerReviews, ...trainerReviews];
    },
    enabled: !!user?.id,
  });

  // Fetch walk checkpoints
  const { data: walkCheckpoints = [] } = useQuery({
    queryKey: ['walkCheckpoints', user?.email],
    queryFn: async () => {
      if (!walkerBookings.length || !user?.email) return [];
      const bookingIds = walkerBookings.map(b => b.id);
      const allCheckpoints = await base44.entities.WalkCheckpoint.list();
      return allCheckpoints.filter(cp => bookingIds.includes(cp.booking_id));
    },
    enabled: !!walkerBookings.length && !!user?.email,
  });

  // Professional metrics
  const metrics = useMemo(() => {
    const allBookings = [...walkerBookings, ...trainerBookings];
    const totalActivities = allBookings.length;
    
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
      : '0.00';
    
    const totalKm = walkCheckpoints.reduce((sum, cp) => sum + (cp.distance_km || 0), 0);
    
    // Monthly data
    const monthlyData = {};
    const now = new Date();
    const last12Months = eachMonthOfInterval({
      start: new Date(now.getFullYear() - 1, now.getMonth(), 1),
      end: now
    });
    
    last12Months.forEach(date => {
      const monthKey = format(date, 'MMM/yy', { locale: pt });
      monthlyData[monthKey] = 0;
    });
    
    allBookings.forEach(booking => {
      if (booking.completed_date) {
        const monthKey = format(new Date(booking.completed_date), 'MMM/yy', { locale: pt });
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
      totalActivities,
      avgRating,
      totalKm: totalKm.toFixed(1),
      monthlyChartData,
      totalEarnings: monthlyChartData.reduce((sum, m) => sum + m.earnings, 0).toFixed(2)
    };
  }, [walkerBookings, trainerBookings, reviews, walkCheckpoints]);

  // Mutations
  const addCreditsMutation = useMutation({
    mutationFn: async (amount) => {
      const session = await base44.functions.invoke('createStripeCheckout', {
        productName: `Créditos PawCão - €${amount}`,
        amount: Math.round(amount * 100),
        quantity: 1,
        walletTopup: true,
      });
      return session;
    },
    onSuccess: (session) => {
      if (session?.url) window.location.href = session.url;
      else toast.error('Erro ao gerar link de pagamento');
    },
    onError: () => toast.error('Erro ao processar pagamento')
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
      toast.success('Pedido de saque criado! Processaremos em 24-48h.');
      setShowWithdraw(false);
      setWithdrawAmount('');
    },
    onError: (error) => toast.error(error.message || 'Erro ao solicitar saque')
  });

  const isProfessional = walkerProfile || trainerProfile;
  const planColors = {
    FREE: 'from-gray-400 to-gray-500',
    BASIC: 'from-blue-500 to-blue-600',
    PREMIUM: 'from-purple-500 to-indigo-600',
    VIP: 'from-yellow-500 to-orange-500'
  };

  const getTransactionIcon = (type) => {
    const icons = {
      cashback_earned: <Gift className="w-4 h-4 text-green-500" />,
      cashback_used: <ShoppingBag className="w-4 h-4 text-red-500" />,
      token_credited: <Zap className="w-4 h-4 text-blue-500" />,
      token_used: <Dog className="w-4 h-4 text-purple-500" />,
      service_completed: <ArrowDownLeft className="w-4 h-4 text-green-600" />,
      points_earned: <Star className="w-4 h-4 text-yellow-500" />,
    };
    return icons[type] || <Wallet className="w-4 h-4" />;
  };

  const isPositive = (type) => {
    return ['cashback_earned', 'token_credited', 'points_earned', 'service_completed'].includes(type);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 py-8 px-4 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900">Minha Wallet</h1>
                  <p className="text-gray-600 text-sm">Gerencie seus saldos, tokens, pontos e ganhos</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGuide(!showGuide)}
                className="gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Guia
              </Button>
            </div>
          </motion.div>

          {/* Quick Guide */}
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6"
            >
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Info className="w-5 h-5 text-blue-600" />
                    Guia da Wallet PawCão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="tokens">
                      <AccordionTrigger className="text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-600" />
                          Tokens de Passeio
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-700 space-y-2">
                        <p>Passeios grátis incluídos no seu plano.</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Válidos em dias úteis (9h-18h)</li>
                          <li>Fins-de-semana: +€5 | Noturno: +€3</li>
                          <li>⚠️ Expiram no fim do período</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="cashback">
                      <AccordionTrigger className="text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-green-600" />
                          Cashback
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-700 space-y-2">
                        <p>Crédito em euros que você ganha em compras.</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>5%-15% de volta (depende do plano)</li>
                          <li>Use na Loja ou serviços</li>
                          <li>Sem expiração</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="points">
                      <AccordionTrigger className="text-sm font-semibold">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-600" />
                          PawPoints
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-700 space-y-2">
                        <p>Programa de fidelidade.</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>10 pontos por €1 gasto</li>
                          <li>400 pontos = €1</li>
                          <li>Troque por descontos e produtos</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="client" className="gap-2">
                <ShoppingBag className="w-4 h-4" />
                Cliente
              </TabsTrigger>
              {isProfessional && (
                <TabsTrigger value="pro" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Profissional
                </TabsTrigger>
              )}
            </TabsList>

            {/* CLIENT TAB */}
            <TabsContent value="client" className="space-y-6">
              
              {/* Membership Status */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className={`border-0 shadow-xl overflow-hidden bg-gradient-to-r ${planColors[membership?.plan_type || 'FREE']} text-white`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-6 h-6" />
                          <span className="font-bold text-lg">Plano {membership?.plan_type || 'FREE'}</span>
                        </div>
                        <p className="text-white/80 text-sm">
                          {membership?.plan_type === 'FREE' 
                            ? 'Faça upgrade para ganhar mais benefícios!'
                            : `Próxima renovação: ${membership?.current_period_end || 'N/A'}`
                          }
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => navigate(createPageUrl('MembershipPlans'))}
                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                      >
                        {membership?.plan_type === 'FREE' ? 'Upgrade' : 'Gerenciar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Balance Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Tokens */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Zap className="w-6 h-6 text-blue-600" />
                        </div>
                        {wallet?.tokens_expiry_date && (
                          <Badge variant="outline" className="text-xs">
                            {new Date(wallet.tokens_expiry_date) < new Date() 
                              ? 'Expirado!' 
                              : `Expira ${format(new Date(wallet.tokens_expiry_date), 'dd/MM', { locale: pt })}`}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Passeios Grátis</p>
                      <p className="text-3xl font-black text-gray-900">{wallet?.service_tokens || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        = €{((wallet?.service_tokens || 0) * (membership?.token_value || 12)).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Cashback */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <Wallet className="w-6 h-6 text-green-600" />
                        </div>
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          {(membership?.cashback_rate * 100 || 0)}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Crédito Interno</p>
                      <p className="text-3xl font-black text-gray-900">€{(wallet?.cashback_balance || 0).toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">Use na Loja ou serviços</p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Points */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                          <Star className="w-6 h-6 text-yellow-600" />
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                          {membership?.points_multiplier || 1}x
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Total de Pontos</p>
                      <p className="text-3xl font-black text-gray-900">{(wallet?.total_points || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">Troque por recompensas</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate(createPageUrl('Home'))}>
                  <Dog className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">Usar Token</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate(createPageUrl('Partners'))}>
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                  <span className="text-xs">Loja</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate(createPageUrl('LoyaltyRewards'))}>
                  <Gift className="w-5 h-5 text-purple-600" />
                  <span className="text-xs">Resgatar</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate(createPageUrl('MembershipPlans'))}>
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  <span className="text-xs">Upgrade</span>
                </Button>
              </motion.div>

              {/* Transactions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-600" />
                      Histórico de Transações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactions.length === 0 ? (
                      <div className="text-center py-12">
                        <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhuma transação ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              {getTransactionIcon(tx.transaction_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{tx.description}</p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(tx.created_date), "dd/MM/yyyy HH:mm", { locale: pt })}
                              </p>
                            </div>
                            <div className="text-right">
                              {tx.amount > 0 && (
                                <p className={`font-bold ${isPositive(tx.transaction_type) ? 'text-green-600' : 'text-red-600'}`}>
                                  {isPositive(tx.transaction_type) ? '+' : '-'}€{tx.amount.toFixed(2)}
                                </p>
                              )}
                            </div>
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
                
                {/* Stats */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <Zap className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Saldo Disponível</p>
                        <p className="text-2xl font-black text-gray-900">€{(wallet?.available_balance || 0).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-orange-600" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Pendente</p>
                        <p className="text-2xl font-black text-gray-900">€{(wallet?.pending_balance || 0).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Total Ganho</p>
                        <p className="text-2xl font-black text-gray-900">€{metrics.totalEarnings}</p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-purple-600" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 font-semibold mb-1">Este Mês</p>
                        <p className="text-2xl font-black text-gray-900">€{(wallet?.monthly_earnings || 0).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid md:grid-cols-2 gap-4"
                >
                  <Button
                    onClick={() => setShowAddCredits(true)}
                    className="h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-lg flex items-center gap-3 justify-center"
                  >
                    <Plus className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-sm">Adicionar Créditos</div>
                      <div className="text-xs opacity-80">Via Stripe</div>
                    </div>
                  </Button>

                  <Button
                    onClick={() => setShowWithdraw(true)}
                    disabled={!wallet?.available_balance || wallet.available_balance <= 0}
                    className="h-16 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-2xl shadow-lg flex items-center gap-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-sm">Solicitar Saque</div>
                      <div className="text-xs opacity-80">1-2 dias úteis</div>
                    </div>
                  </Button>
                </motion.div>

                {/* Performance Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Monthly Earnings */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          Ganhos Mensais
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">Últimos 12 meses</p>
                      </CardHeader>
                      <CardContent className="p-6">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={metrics.monthlyChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <ChartTooltip 
                              formatter={(value) => `€${value.toFixed(2)}`}
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="earnings" 
                              stroke="#9333ea" 
                              strokeWidth={3}
                              dot={{ fill: '#9333ea', r: 5 }}
                              activeDot={{ r: 7 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Activity Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle>Resumo de Atividades</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-gray-600 text-sm font-medium">Passeios Concluídos</p>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{walkerBookings.length}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <p className="text-gray-600 text-sm font-medium">Sessões de Treino</p>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{trainerBookings.length}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-gray-600 text-sm font-medium">Avaliação Média</p>
                          <p className="text-2xl font-bold text-gray-900 mt-2">⭐ {metrics.avgRating}</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg">
                          <p className="text-gray-600 text-sm font-medium">KM Percorridos</p>
                          <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.totalKm} km</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Transactions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="border-b border-gray-100">
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-600" />
                        Histórico de Transações
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {transactions.length === 0 ? (
                        <div className="p-12 text-center">
                          <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-600 font-semibold">Sem transações ainda</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {transactions.map((tx) => {
                            const isIncome = ['service_completed', 'withdrawal_released', 'bonus'].includes(tx.transaction_type);
                            const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
                            const color = isIncome ? 'text-green-600' : 'text-red-600';
                            const bgColor = isIncome ? 'bg-green-50' : 'bg-red-50';

                            return (
                              <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
                                  <Icon className={`w-5 h-5 ${color}`} />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900">{tx.description}</p>
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(tx.created_date), "dd 'de' MMMM HH:mm", { locale: ptBR })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-black ${color}`}>
                                    {isIncome ? '+' : '-'}€{Math.abs(tx.amount || 0).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Add Credits Modal */}
      <Dialog open={showAddCredits} onOpenChange={setShowAddCredits}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Adicionar Créditos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold text-gray-900 block mb-2">Valor (€)</label>
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
                >
                  €{v}
                </Button>
              ))}
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Total a pagar:</strong> €{(parseFloat(credits) || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Sem taxas adicionais</p>
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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {addCreditsMutation.isPending ? 'Processando...' : 'Pagar via Stripe'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-green-600" />
              Solicitar Saque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-green-700 font-semibold">Saldo Disponível</p>
              <p className="text-2xl font-black text-green-700">€{(wallet?.available_balance || 0).toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-900 block mb-2">Valor a Sacar (€)</label>
              <Input
                type="number"
                placeholder={`Até €${(wallet?.available_balance || 0).toFixed(2)}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                max={wallet?.available_balance || 0}
                step="0.01"
                className="h-10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Processado em 1-2 dias úteis
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-900">
                <strong>Valor:</strong> €{(parseFloat(withdrawAmount) || 0).toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowWithdraw(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const amount = parseFloat(withdrawAmount);
                  if (!amount || amount <= 0) {
                    toast.error('Digite um valor válido');
                    return;
                  }
                  if (amount > wallet?.available_balance) {
                    toast.error('Saldo insuficiente');
                    return;
                  }
                  withdrawMutation.mutate(amount);
                }}
                disabled={withdrawMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {withdrawMutation.isPending ? 'Processando...' : 'Confirmar Saque'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

// Add missing useMutation import
import { useMutation } from "@tanstack/react-query";