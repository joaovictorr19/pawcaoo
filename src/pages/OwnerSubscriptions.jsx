import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Crown, Zap, Star, Sparkles, Shield, Heart, TrendingUp, Gift, Award, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function OwnerSubscriptions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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

  const subscribeMutation = useMutation({
    mutationFn: async ({ plan, billingCycle }) => {
      if (plan.type === 'free') {
        // Free plan - just create/update subscription
        if (subscription) {
          return await base44.entities.OwnerSubscription.update(subscription.id, {
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
          });
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
      const { data } = await base44.functions.invoke('createOwnerSubscriptionCheckout', {
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

      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onSuccess: (result) => {
      if (result) {
        queryClient.invalidateQueries({ queryKey: ['ownerSubscription'] });
        toast.success("Subscrição atualizada com sucesso!");
      }
    },
  });

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
        "1 ponto por cada €1 gasto na loja",
        "Sem cashback",
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
        "1.5 pontos por cada €1 na loja",
        "5% cashback em compras",
        "1 passeio grátis/mês (até €15)",
        "2 cancelamentos grátis/mês",
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
        "2 pontos por cada €1 na loja",
        "10% cashback em compras",
        "2 passeios grátis/mês (até €15)",
        "5 cancelamentos/mês",
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
        "3 pontos por cada €1 na loja",
        "15% cashback em compras",
        "3 passeios grátis/mês (até €15)",
        "Cancelamentos ilimitados",
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
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Planos para Proprietários
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Economize em passeios e ganhe benefícios exclusivos
          </p>
          {subscription && (
            <Badge className="mt-2 px-4 py-1 bg-green-500">
              {subscription.plan_type.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Billing Toggle - Modern */}
        <div className="flex justify-center mb-8">
          <div className="backdrop-blur-xl bg-white/80 border border-white/40 rounded-2xl shadow-xl p-1.5">
            <Tabs value={billingCycle} onValueChange={setBillingCycle} className="w-auto">
              <TabsList className="bg-transparent p-0 gap-2">
                <TabsTrigger 
                  value="monthly" 
                  className="text-sm px-6 py-2.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  💳 Mensal
                </TabsTrigger>
                <TabsTrigger 
                  value="annual" 
                  className="text-sm px-6 py-2.5 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                >
                  💎 Anual <Badge className="ml-2 bg-orange-500 text-white text-xs animate-pulse">Poupe 17%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Plans Grid - Modern Glass Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan, index) => {
            const savings = getSavings(plan);
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.plan_type === plan.type;

            return (
              <motion.div
                key={plan.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative"
              >
                <Card className={`relative overflow-hidden backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 h-full ${
                  plan.popular ? 'ring-2 ring-blue-400 scale-105' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                  style={{
                    background: plan.popular 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239,246,255,0.9) 100%)'
                      : 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 text-xs font-bold z-10 rounded-bl-lg shadow-lg">
                      ⭐ Popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 text-xs font-bold z-10 rounded-br-lg shadow-lg">
                      ✓ Ativo
                    </div>
                  )}
                  
                  <div className={`h-1 bg-gradient-to-r ${plan.color}`} />
                  
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg transform hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-black mb-2 text-gray-900">{plan.name}</h3>
                    
                    <div className="mb-3">
                      <div className="text-3xl font-black text-gray-900">
                        {getPrice(plan)}
                      </div>
                      {savings && (
                        <div className="mt-2 space-y-1">
                          <Badge className="text-xs bg-green-500 text-white shadow-md">
                            Economize €{savings.amount}
                          </Badge>
                          <p className="text-xs text-green-600 font-semibold">
                            {savings.percent}% de desconto
                          </p>
                        </div>
                      )}
                    </div>

                    {plan.cashbackRate > 0 && (
                      <div className="mb-4 p-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                        <p className="text-sm font-bold text-green-700 text-center">
                          💰 {plan.cashbackRate}% Cashback em Compras
                        </p>
                      </div>
                    )}
                    
                    {plan.freeWalksPerMonth > 0 && (
                      <div className="mb-4 p-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-300 rounded-lg">
                        <p className="text-sm font-bold text-blue-700 text-center">
                          🐕 {plan.freeWalksPerMonth} Passeio{plan.freeWalksPerMonth > 1 ? 's' : ''} Grátis/Mês
                        </p>
                      </div>
                    )}
                    
                    <ul className="space-y-2 mb-6 min-h-[140px]">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white shadow-lg h-11 text-sm font-bold rounded-xl transform hover:scale-105 transition-all active:scale-95`}
                      onClick={() => subscribeMutation.mutate({ plan, billingCycle })}
                      disabled={isCurrentPlan || subscribeMutation.isPending}
                    >
                      {isCurrentPlan ? '✓ Plano Atual' : subscribeMutation.isPending ? 'Processando...' : 'Subscrever Agora'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Collapsible Comparison Table */}
        <Card className="glass-panel border-0 shadow-xl mb-6">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors p-4"
            onClick={() => setShowComparison(!showComparison)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Comparação Detalhada</CardTitle>
              {showComparison ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          <AnimatePresence>
            {showComparison && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-2 px-2 font-semibold">Funcionalidade</th>
                          <th className="text-center py-2 px-2 font-semibold">Free</th>
                          <th className="text-center py-2 px-2 font-semibold bg-blue-50">Basic</th>
                          <th className="text-center py-2 px-2 font-semibold">Premium</th>
                          <th className="text-center py-2 px-2 font-semibold">VIP</th>
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
                          <td className="py-2 px-2">Cancelamentos</td>
                          <td className="text-center py-2 px-2">0</td>
                          <td className="text-center py-2 px-2 bg-blue-50">2/mês</td>
                          <td className="text-center py-2 px-2">5/mês</td>
                          <td className="text-center py-2 px-2 text-green-600 font-bold">∞</td>
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

        {/* Benefits - Glass Design */}
        <Card className="backdrop-blur-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-white/40 shadow-xl mb-8">
          <CardContent className="p-6 md:p-8">
            <h3 className="text-2xl font-black text-gray-900 mb-6 text-center">
              ✨ Porquê Ser Membro PawCão?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Gift, label: "Até 15% Cashback", color: "from-green-500 to-emerald-600" },
                { icon: Sparkles, label: "3x PawPoints", color: "from-purple-500 to-pink-600" },
                { icon: Heart, label: "Passeios Grátis", color: "from-blue-500 to-cyan-600" },
                { icon: Crown, label: "Tratamento VIP", color: "from-yellow-500 to-orange-600" }
              ].map((benefit, idx) => (
                <motion.div 
                  key={idx} 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-br ${benefit.color} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">{benefit.label}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Elite Partner for Companies */}
        <Card className="relative overflow-hidden border-0 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-100" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
          
          <CardContent className="relative p-8 md:p-10 text-center text-white">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 mx-auto mb-4"
            >
              <Award className="w-full h-full drop-shadow-2xl" />
            </motion.div>
            
            <h2 className="text-3xl md:text-4xl font-black mb-3 drop-shadow-lg">
              Elite Partner
            </h2>
            <div className="text-5xl font-black mb-2 drop-shadow-lg">
              €149<span className="text-2xl font-normal">/mês</span>
            </div>
            <p className="text-lg text-white/95 mb-6 drop-shadow">
              Para empresas que querem vender produtos e serviços no PawCão
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
              {[
                "📦 Produtos ilimitados",
                "🛍️ Loja própria",
                "📊 Analytics avançado",
                "🎯 Promoções destacadas"
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2 text-sm bg-white/20 backdrop-blur px-3 py-2 rounded-lg">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{feat}</span>
                </div>
              ))}
            </div>

            <Button
              size="lg"
              className="bg-white text-indigo-700 hover:bg-gray-100 shadow-2xl font-bold text-base px-8 h-12 rounded-xl transform hover:scale-105 transition-all active:scale-95"
              onClick={() => navigate(createPageUrl(user?.account_type === 'company' ? 'PartnerDashboard' : 'RegisterCompany'))}
            >
              {user?.account_type === 'company' ? '🏪 Ir para o Painel' : '🚀 Registrar Empresa'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}