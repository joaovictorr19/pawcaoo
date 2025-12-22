import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Crown, Zap, Star, Sparkles, Shield, Heart, TrendingUp, Gift, Award, ChevronDown, ChevronUp, CheckCircle, ArrowLeft, ArrowUp, ArrowDown, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DynamicBackground from "@/components/ui/DynamicBackground";
import { useTheme } from "@/components/ThemeContext";

export default function OwnerSubscriptions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [billingCycle, setBillingCycle] = React.useState("monthly");
  const [showComparison, setShowComparison] = React.useState(false);

  // Check URL params for success
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success("✅ Pagamento processado! A sua subscrição será ativada em breve.");
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('canceled') === 'true') {
      toast.info("Pagamento cancelado. Pode tentar novamente quando quiser.");
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: subscription } = useQuery({
    queryKey: ['ownerSubscription'],
    queryFn: async () => {
      const subs = await base44.entities.OwnerSubscription.filter({
        owner_email: user?.email,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!user,
  });

  const planOrder = ['free', 'basic', 'premium', 'vip'];

  const getActionType = (currentPlan, newPlan) => {
    const currentIdx = planOrder.indexOf(currentPlan);
    const newIdx = planOrder.indexOf(newPlan);
    if (newIdx > currentIdx) return 'upgrade';
    if (newIdx < currentIdx) return 'downgrade';
    return 'same';
  };

  const subscribeMutation = useMutation({
    mutationFn: async ({ plan, billingCycle }) => {
      const currentPlan = subscription?.plan_type || 'free';
      const actionType = getActionType(currentPlan, plan.type);

      // Se é o mesmo plano, não fazer nada
      if (actionType === 'same') {
        throw new Error('Já tem este plano ativo');
      }

      // Para upgrade/downgrade com subscrição existente
      if (subscription && subscription.plan_type !== 'free') {
        const response = await base44.functions.invoke('manageOwnerSubscription', {
          action: actionType,
          new_plan_type: plan.type,
          new_billing_cycle: billingCycle
        });

        if (response?.data?.url) {
          window.location.href = response.data.url;
          return null;
        } else if (response?.data?.success) {
          return response.data;
        } else {
          throw new Error(response?.data?.error || 'Erro ao processar');
        }
      }

      // Para nova subscrição ou upgrade do free
      if (plan.type === 'free') {
        // Downgrade para free
        if (subscription) {
          const response = await base44.functions.invoke('manageOwnerSubscription', {
            action: 'downgrade',
            new_plan_type: 'free'
          });
          return response?.data;
        } else {
          return await base44.entities.OwnerSubscription.create({
            owner_email: user?.email,
            owner_name: user?.full_name,
            plan_type: 'free',
            billing_cycle: 'monthly',
            monthly_price: 0,
            annual_price: 0,
            booking_discount_percentage: 0,
            cashback_rate: 0,
            free_walks_per_month: 0,
            points_multiplier: 1,
            free_cancellations: 0,
            priority_booking: false,
            free_insurance: false,
            priority_support: false,
            exclusive_walkers: false,
            start_date: new Date().toISOString().split('T')[0],
            is_active: true
          });
        }
      }

      // Paid plans - redirect to Stripe checkout
      const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
      const response = await base44.functions.invoke('createOwnerSubscriptionCheckout', {
        plan_type: plan.type,
        billing_cycle: billingCycle,
        amount: price,
        plan_details: {
          cashbackRate: plan.cashbackRate,
          freeWalksPerMonth: plan.freeWalksPerMonth,
          pointsMultiplier: plan.pointsMultiplier,
          freeCancellations: plan.freeCancellations,
          priorityBooking: plan.priorityBooking,
          freeInsurance: plan.freeInsurance,
          prioritySupport: plan.prioritySupport,
          exclusiveWalkers: plan.exclusiveWalkers,
        }
      });

      console.log('Checkout response:', response);

      if (response?.data?.url) {
        window.location.href = response.data.url;
        return null;
      } else {
        throw new Error('Erro ao criar sessão de pagamento');
      }
    },
    onSuccess: (result) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['ownerSubscription'] });
        toast.success("Subscrição atualizada com sucesso!");
      }
    },
    onError: (error) => {
      console.error('Subscription error:', error);
      toast.error("Erro ao processar: " + error.message);
    },
  });

  const openBillingPortal = async () => {
    try {
      const response = await base44.functions.invoke('manageOwnerSubscription', {
        action: 'get_portal'
      });
      if (response?.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error('Erro ao abrir portal de pagamentos');
    }
  };

  const plans = [
    {
      type: "free",
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      icon: Zap,
      color: "from-gray-500 to-gray-600",
      bookingDiscount: 0,
      pointsMultiplier: 1,
      cashbackRate: 0,
      freeWalksPerMonth: 0,
      freeCancellations: 0,
      priorityBooking: false,
      freeInsurance: false,
      prioritySupport: false,
      exclusiveWalkers: false,
      features: [
        "Perfil completo",
        "1 ponto por €1 na loja",
        "Sem cashback",
        "80% reembolso confirmados",
        "Suporte email"
      ]
    },
    {
      type: "basic",
      name: "Basic",
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      icon: Heart,
      color: "from-blue-500 to-blue-600",
      popular: true,
      bookingDiscount: 0,
      pointsMultiplier: 1.5,
      cashbackRate: 5,
      freeWalksPerMonth: 1,
      freeCancellations: 2,
      priorityBooking: false,
      freeInsurance: false,
      prioritySupport: false,
      exclusiveWalkers: false,
      features: [
        "1.5 pontos por €1 na loja",
        "5% cashback em compras",
        "1 passeio grátis/mês",
        "2 cancelamentos grátis/mês",
        "80% reembolso confirmados",
        "Suporte rápido"
      ]
    },
    {
      type: "premium",
      name: "Premium",
      monthlyPrice: 44.99,
      annualPrice: 449.99,
      icon: Star,
      color: "from-purple-500 to-purple-600",
      bookingDiscount: 0,
      pointsMultiplier: 2,
      cashbackRate: 10,
      freeWalksPerMonth: 2,
      freeCancellations: 5,
      priorityBooking: true,
      freeInsurance: true,
      prioritySupport: true,
      exclusiveWalkers: false,
      features: [
        "2 pontos por €1 na loja",
        "10% cashback em compras",
        "2 passeios grátis/mês",
        "5 cancelamentos/mês",
        "Reembolso 100% sempre",
        "Prioridade agenda",
        "Seguro incluído",
        "Suporte 24/7"
      ]
    },
    {
      type: "vip",
      name: "VIP",
      monthlyPrice: 79.99,
      annualPrice: 799.99,
      icon: Crown,
      color: "from-yellow-500 to-yellow-600",
      bookingDiscount: 0,
      pointsMultiplier: 3,
      cashbackRate: 15,
      freeWalksPerMonth: 3,
      freeCancellations: 999,
      priorityBooking: true,
      freeInsurance: true,
      prioritySupport: true,
      exclusiveWalkers: true,
      features: [
        "3 pontos por €1 na loja",
        "15% cashback em compras",
        "3 passeios grátis/mês",
        "Cancelamentos ilimitados",
        "Reembolso 100% sempre",
        "1 banho grátis/mês",
        "Prioridade máxima",
        "Suporte dedicado",
        "Passeadores VIP exclusivos"
      ]
    }
  ];

  const getPrice = (plan) => {
    if (plan.type === "free") return "Grátis";
    const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
    const period = billingCycle === "monthly" ? "/mês" : "/ano";
    return `€${price}${period}`;
  };

  const getSavings = (plan) => {
    if (plan.type === "free" || billingCycle === "monthly") return null;
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = (monthlyTotal - plan.annualPrice).toFixed(2);
    const percentSaved = ((savings / monthlyTotal) * 100).toFixed(0);
    return { amount: savings, percent: percentSaved };
  };

  return (
    <div className="min-h-screen p-4 md:p-6 relative overflow-hidden">
      <DynamicBackground />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="glass-panel border-white/40 hover:opacity-80 h-10 px-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </motion.div>

        {/* Modern Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 md:gap-3 glass-panel rounded-3xl px-4 md:px-6 py-2 md:py-3 shadow-2xl mb-3 md:mb-4"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
              }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Crown className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </motion.div>
            <h1 className={`text-2xl md:text-5xl font-black ${colors?.isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Planos Premium
            </h1>
          </motion.div>
          <p className={`text-sm md:text-xl font-medium max-w-2xl mx-auto px-4 ${colors?.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Economize em passeios e ganhe benefícios exclusivos
          </p>
          {subscription && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              className="flex flex-col items-center gap-2"
            >
              <Badge 
                className="px-6 py-2 text-white shadow-lg text-sm"
                style={{
                  background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Plano Ativo: {subscription.plan_type.toUpperCase()}
              </Badge>
              {subscription.plan_type !== 'free' && subscription.stripe_customer_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openBillingPortal}
                  className="text-xs"
                >
                  <CreditCard className="w-3 h-3 mr-1" />
                  Gerir Pagamentos
                </Button>
              )}
              {subscription.free_walks_per_month > 0 && (
                <p className={`text-xs ${colors?.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Passeios grátis: {subscription.free_walks_used_this_month || 0}/{subscription.free_walks_per_month} usados este mês
                </p>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Billing Toggle - Modern */}
        <motion.div 
          className="flex justify-center mb-6 md:mb-8 px-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass-panel shadow-2xl p-1 md:p-1.5 rounded-2xl">
            <Tabs value={billingCycle} onValueChange={setBillingCycle} className="w-auto">
              <TabsList className="bg-transparent p-0 gap-1 md:gap-2">
                <TabsTrigger 
                  value="monthly" 
                  className={`text-xs md:text-sm px-4 md:px-6 py-2 md:py-2.5 rounded-xl transition-all ${colors?.isDarkMode ? 'text-gray-300' : ''}`}
                  style={{
                    background: billingCycle === 'monthly' 
                      ? `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)` 
                      : 'transparent',
                    color: billingCycle === 'monthly' ? 'white' : undefined
                  }}
                >
                  Mensal
                </TabsTrigger>
                <TabsTrigger 
                  value="annual" 
                  className="text-xs md:text-sm px-4 md:px-6 py-2 md:py-2.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  Anual <Badge className="ml-1 md:ml-2 bg-orange-500 text-white text-[10px] md:text-xs animate-pulse px-1.5 py-0">-17%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Plans Grid - Modern Glass Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 px-2 md:px-0">
          {plans.map((plan, index) => {
            const savings = getSavings(plan);
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.plan_type === plan.type;

            return (
              <motion.div
                key={plan.type}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative"
              >
                <Card className={`glass-panel relative overflow-hidden border-2 shadow-2xl hover:shadow-3xl transition-all duration-300 h-full rounded-3xl ${
                  plan.popular ? 'ring-2 ring-blue-400 scale-105 border-blue-300/60' : 'border-white/40'
                } ${isCurrentPlan ? 'ring-2 ring-green-500 border-green-300/60' : ''}`}
                >
                  {plan.popular && (
                    <motion.div 
                      className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 text-xs font-bold z-10 rounded-bl-xl shadow-lg"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Popular
                    </motion.div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 text-xs font-bold z-10 rounded-br-xl shadow-lg">
                      Ativo
                    </div>
                  )}
                  
                  <div className={`h-1 bg-gradient-to-r ${plan.color}`} />
                  
                  <CardContent className="p-4 md:p-5">
                    <motion.div 
                      className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-2 md:mb-3 shadow-lg`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </motion.div>
                    
                    <h3 className={`text-lg md:text-xl font-black mb-2 ${colors?.isDarkMode ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                    
                    <div className="mb-2 md:mb-3">
                      <div className={`text-xl md:text-2xl font-black ${colors?.isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {getPrice(plan)}
                      </div>
                      {savings && (
                        <div className="mt-1 md:mt-2">
                          <Badge className="text-[10px] md:text-xs bg-green-500 text-white shadow-md px-2 py-0.5">
                            Poupe €{savings.amount}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {plan.cashbackRate > 0 && (
                      <div className="mb-1.5 md:mb-2 p-1.5 md:p-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-300/50 rounded-lg backdrop-blur">
                        <p className="text-[10px] md:text-xs font-bold text-green-700 text-center">
                          {plan.cashbackRate}% Cashback
                        </p>
                      </div>
                    )}

                    {plan.type === 'premium' && (
                      <div className="mb-1.5 md:mb-2 p-1.5 md:p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-300/50 rounded-lg backdrop-blur">
                        <p className="text-[10px] md:text-xs font-bold text-purple-700 text-center">
                          Reembolso Total
                        </p>
                      </div>
                    )}

                    {plan.type === 'vip' && (
                      <div className="mb-1.5 md:mb-2 p-1.5 md:p-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/50 rounded-lg backdrop-blur">
                        <p className="text-[10px] md:text-xs font-bold text-yellow-700 text-center">
                          Cancelamentos Ilimitados
                        </p>
                      </div>
                    )}
                    
                    {plan.freeWalksPerMonth > 0 && (
                      <div className="mb-2 md:mb-3 p-1.5 md:p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-300/50 rounded-lg backdrop-blur">
                        <p className="text-[10px] md:text-xs font-bold text-blue-700 text-center">
                          {plan.freeWalksPerMonth} Passeio{plan.freeWalksPerMonth > 1 ? 's' : ''} Grátis
                        </p>
                      </div>
                    )}
                    
                    <ul className="space-y-1 md:space-y-1.5 mb-4 md:mb-5 min-h-[100px] md:min-h-[120px]">
                      {plan.features.map((feature, idx) => (
                        <motion.li 
                          key={idx} 
                          className={`flex items-start gap-1.5 md:gap-2 text-[11px] md:text-xs ${colors?.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + idx * 0.05 }}
                        >
                          <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="leading-tight">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white shadow-lg h-9 md:h-10 text-xs md:text-sm font-bold rounded-xl transform hover:scale-105 transition-all active:scale-95`}
                      onClick={() => {
                        console.log('Botão clicado:', plan.type, billingCycle);
                        subscribeMutation.mutate({ plan, billingCycle });
                      }}
                      disabled={isCurrentPlan || subscribeMutation.isPending}
                    >
                      {isCurrentPlan ? (
                        'Plano Atual'
                      ) : subscribeMutation.isPending ? (
                        'Processando...'
                      ) : subscription && planOrder.indexOf(plan.type) > planOrder.indexOf(subscription.plan_type) ? (
                        <><ArrowUp className="w-4 h-4 mr-1" /> Upgrade</>
                      ) : subscription && planOrder.indexOf(plan.type) < planOrder.indexOf(subscription.plan_type) ? (
                        <><ArrowDown className="w-4 h-4 mr-1" /> Downgrade</>
                      ) : (
                        'Subscrever'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Collapsible Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-panel border-0 shadow-2xl mb-6 rounded-3xl overflow-hidden mx-2 md:mx-0">
            <CardHeader 
              className={`cursor-pointer transition-colors p-3 md:p-4 ${colors?.isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-white/50'}`}
              onClick={() => setShowComparison(!showComparison)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className={`text-base md:text-lg ${colors?.isDarkMode ? 'text-white' : 'text-gray-900'}`}>Comparação Detalhada</CardTitle>
                {showComparison ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />}
              </div>
            </CardHeader>
          <AnimatePresence>
            {showComparison && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="overflow-x-auto -mx-3 md:mx-0">
                    <table className="w-full text-xs md:text-sm min-w-[500px]">
                      <thead>
                        <tr className={`border-b-2 ${colors?.isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <th className={`text-left py-2 px-2 font-semibold ${colors?.isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Funcionalidade</th>
                          <th className={`text-center py-2 px-2 font-semibold ${colors?.isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Free</th>
                          <th className={`text-center py-2 px-2 font-semibold ${colors?.isDarkMode ? 'bg-slate-800/50 text-gray-300' : 'bg-blue-50 text-gray-900'}`}>Basic</th>
                          <th className={`text-center py-2 px-2 font-semibold ${colors?.isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>Premium</th>
                          <th className={`text-center py-2 px-2 font-semibold ${colors?.isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>VIP</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">Cashback Loja</td>
                          <td className="text-center py-2 px-2">0%</td>
                          <td className="text-center py-2 px-2 bg-blue-50">5%</td>
                          <td className="text-center py-2 px-2">10%</td>
                          <td className="text-center py-2 px-2 text-green-600 font-bold">15%</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">Passeios Grátis/Mês</td>
                          <td className="text-center py-2 px-2">0</td>
                          <td className="text-center py-2 px-2 bg-blue-50">1</td>
                          <td className="text-center py-2 px-2">2</td>
                          <td className="text-center py-2 px-2 text-green-600 font-bold">3</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">PawPoints</td>
                          <td className="text-center py-2 px-2">1x</td>
                          <td className="text-center py-2 px-2 bg-blue-50">1.5x</td>
                          <td className="text-center py-2 px-2">2x</td>
                          <td className="text-center py-2 px-2 font-bold">3x</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">Cancelamentos Grátis</td>
                          <td className="text-center py-2 px-2">0</td>
                          <td className="text-center py-2 px-2 bg-blue-50">2/mês</td>
                          <td className="text-center py-2 px-2">5/mês</td>
                          <td className="text-center py-2 px-2 text-green-600 font-bold">∞</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">Reembolso (Confirmados)</td>
                          <td className="text-center py-2 px-2">80%</td>
                          <td className="text-center py-2 px-2 bg-blue-50">80%</td>
                          <td className="text-center py-2 px-2 font-bold text-green-600">100%</td>
                          <td className="text-center py-2 px-2 font-bold text-green-600">100%</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">Reembolso (Pendentes)</td>
                          <td className="text-center py-2 px-2 font-bold text-green-600">100%</td>
                          <td className="text-center py-2 px-2 bg-blue-50 font-bold text-green-600">100%</td>
                          <td className="text-center py-2 px-2 font-bold text-green-600">100%</td>
                          <td className="text-center py-2 px-2 font-bold text-green-600">100%</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">Seguro</td>
                          <td className="text-center py-2 px-2">-</td>
                          <td className="text-center py-2 px-2 bg-blue-50">-</td>
                          <td className="text-center py-2 px-2">✓</td>
                          <td className="text-center py-2 px-2">✓</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">Suporte</td>
                          <td className="text-center py-2 px-2">Email</td>
                          <td className="text-center py-2 px-2 bg-blue-50">Rápido</td>
                          <td className="text-center py-2 px-2">24/7</td>
                          <td className="text-center py-2 px-2">Dedicado</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
          </Card>
        </motion.div>

        {/* Benefits - Glass Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-panel border-0 shadow-2xl mb-6 md:mb-8 rounded-3xl mx-2 md:mx-0">
            <CardContent className="p-5 md:p-8">
              <h3 className={`text-xl md:text-2xl font-black mb-5 md:mb-6 text-center ${colors?.isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Porquê Ser Membro PawCão?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                  { icon: Gift, label: "Até 15% Cashback", color: "from-green-500 to-emerald-600" },
                  { icon: Sparkles, label: "3x PawPoints", color: "from-purple-500 to-pink-600" },
                  { icon: Heart, label: "Passeios Grátis", color: "from-blue-500 to-cyan-600" },
                  { icon: Crown, label: "Tratamento VIP", color: "from-yellow-500 to-orange-600" }
                ].map((benefit, idx) => (
                  <motion.div 
                    key={idx} 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + idx * 0.1 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <motion.div 
                      className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg`}
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                    >
                      <benefit.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </motion.div>
                    <p className={`text-[10px] md:text-xs font-bold leading-tight ${colors?.isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>{benefit.label}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Elite Partner for Companies */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="glass-panel relative overflow-hidden border-0 shadow-2xl rounded-3xl mx-2 md:mx-0">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-100" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
            
            <CardContent className="relative p-6 md:p-8 text-center text-white">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3"
              >
                <Award className="w-full h-full drop-shadow-2xl" />
              </motion.div>
              
              <h2 className="text-xl md:text-3xl font-black mb-2 drop-shadow-lg">
                Elite Partner
              </h2>
              <div className="text-3xl md:text-4xl font-black mb-2 drop-shadow-lg">
                €149<span className="text-lg md:text-xl font-normal">/mês</span>
              </div>
              <p className="text-xs md:text-sm text-white/95 mb-4 md:mb-5 drop-shadow px-4">
                Para empresas que querem vender produtos no PawCão
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-4 md:mb-5 text-left">
                {[
                  "Produtos ilimitados",
                  "Loja própria",
                  "Analytics avançado",
                  "Promoções destacadas"
                ].map((feat, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs bg-white/20 backdrop-blur px-2 md:px-3 py-1.5 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.1 }}
                  >
                    <Check className="w-3 h-3 md:w-3.5 md:h-3.5 flex-shrink-0" />
                    <span className="font-medium leading-tight">{feat}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="bg-white text-indigo-700 hover:bg-gray-100 shadow-2xl font-bold text-xs md:text-sm px-6 md:px-8 h-10 md:h-11 rounded-xl transform hover:scale-105 transition-all active:scale-95 w-full md:w-auto"
                onClick={() => navigate(createPageUrl(user?.account_type === 'company' ? 'PartnerDashboard' : 'RegisterCompany'))}
              >
                {user?.account_type === 'company' ? 'Ir para o Painel' : 'Registrar Empresa'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}