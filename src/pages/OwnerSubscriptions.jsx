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
      if (subscription) {
        return await base44.entities.OwnerSubscription.update(subscription.id, {
          plan_type: plan.type,
          billing_cycle: billingCycle,
          monthly_price: billingCycle === 'monthly' ? plan.monthlyPrice : 0,
          annual_price: billingCycle === 'annual' ? plan.annualPrice : 0,
          booking_discount_percentage: plan.bookingDiscount,
          points_multiplier: plan.pointsMultiplier,
          free_cancellations: plan.freeCancellations,
          priority_booking: plan.priorityBooking,
          free_insurance: plan.freeInsurance,
          priority_support: plan.prioritySupport,
          exclusive_walkers: plan.exclusiveWalkers,
        });
      } else {
        return await base44.entities.OwnerSubscription.create({
          owner_email: user?.email,
          owner_name: user?.full_name,
          plan_type: plan.type,
          billing_cycle: billingCycle,
          monthly_price: billingCycle === 'monthly' ? plan.monthlyPrice : 0,
          annual_price: billingCycle === 'annual' ? plan.annualPrice : 0,
          booking_discount_percentage: plan.bookingDiscount,
          points_multiplier: plan.pointsMultiplier,
          free_cancellations: plan.freeCancellations,
          priority_booking: plan.priorityBooking,
          free_insurance: plan.freeInsurance,
          priority_support: plan.prioritySupport,
          exclusive_walkers: plan.exclusiveWalkers,
          start_date: new Date().toISOString().split('T')[0],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerSubscription'] });
      toast.success("Subscrição atualizada com sucesso!");
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
      freeCancellations: 0,
      priorityBooking: false,
      freeInsurance: false,
      prioritySupport: false,
      exclusiveWalkers: false,
      features: [
        "Perfil completo",
        "10 pontos/€1",
        "Suporte email",
        "Todos os passeadores"
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
      bookingDiscount: 10,
      pointsMultiplier: 1.5,
      freeCancellations: 2,
      priorityBooking: false,
      freeInsurance: false,
      prioritySupport: false,
      exclusiveWalkers: false,
      features: [
        "10% desconto reservas",
        "15 pontos/€1",
        "2 cancelamentos grátis/mês",
        "Suporte rápido"
      ]
    },
    {
      type: "premium",
      name: "Premium",
      monthlyPrice: 39.99,
      annualPrice: 399.99,
      icon: Star,
      color: "from-purple-500 to-purple-600",
      bookingDiscount: 15,
      pointsMultiplier: 2,
      freeCancellations: 5,
      priorityBooking: true,
      freeInsurance: true,
      prioritySupport: true,
      exclusiveWalkers: false,
      features: [
        "15% desconto reservas",
        "20 pontos/€1 (2x)",
        "5 cancelamentos/mês",
        "Prioridade agenda",
        "Seguro incluído",
        "Suporte 24/7",
        "10% desconto loja"
      ]
    },
    {
      type: "vip",
      name: "VIP",
      monthlyPrice: 59.99,
      annualPrice: 599.99,
      icon: Crown,
      color: "from-yellow-500 to-yellow-600",
      bookingDiscount: 25,
      pointsMultiplier: 3,
      freeCancellations: 999,
      priorityBooking: true,
      freeInsurance: true,
      prioritySupport: true,
      exclusiveWalkers: true,
      features: [
        "25% desconto reservas",
        "30 pontos/€1 (3x)",
        "Cancelamentos ilimitados",
        "1 banho grátis/mês",
        "Prioridade máxima",
        "Suporte dedicado",
        "15% desconto loja",
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
    const savings = monthlyTotal - plan.annualPrice;
    return savings;
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Membros PawCão
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            Poupe dinheiro e ganhe benefícios exclusivos
          </p>
          {subscription && (
            <Badge className="mt-2 px-4 py-1 bg-green-500">
              {subscription.plan_type.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Billing Toggle - Compact */}
        <div className="flex justify-center mb-6">
          <Tabs value={billingCycle} onValueChange={setBillingCycle} className="w-auto">
            <TabsList className="bg-white border border-green-200 shadow-sm p-1">
              <TabsTrigger value="monthly" className="text-sm px-4 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Mensal
              </TabsTrigger>
              <TabsTrigger value="annual" className="text-sm px-4 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Anual <Badge className="ml-1 bg-orange-500 text-white text-xs">-17%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Compact Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {plans.map((plan, index) => {
            const savings = getSavings(plan);
            const Icon = plan.icon;

            return (
              <motion.div
                key={plan.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`glass-panel border-0 shadow-xl hover:shadow-2xl transition-all h-full ${
                  plan.popular ? 'ring-2 ring-blue-400' : ''
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-0.5 text-xs font-bold z-10 rounded-bl">
                      Popular
                    </div>
                  )}
                  <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
                  <CardContent className="p-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {getPrice(plan)}
                    </div>
                    {savings && (
                      <Badge className="text-xs bg-green-500 text-white mb-3">
                        Poupe €{savings.toFixed(0)}
                      </Badge>
                    )}
                    {plan.bookingDiscount > 0 && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300 mb-3">
                        {plan.bookingDiscount}% desconto
                      </Badge>
                    )}
                    
                    <ul className="space-y-1.5 mb-4 min-h-[120px]">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white shadow-lg h-9 text-sm`}
                      onClick={() => subscribeMutation.mutate({ plan, billingCycle })}
                      disabled={subscription?.plan_type === plan.type || subscribeMutation.isPending}
                    >
                      {subscription?.plan_type === plan.type ? 'Atual' : 'Subscrever'}
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
                          <td className="py-2 px-2">Desconto Reservas</td>
                          <td className="text-center py-2 px-2">0%</td>
                          <td className="text-center py-2 px-2 bg-blue-50">10%</td>
                          <td className="text-center py-2 px-2">15%</td>
                          <td className="text-center py-2 px-2 text-green-600 font-bold">25%</td>
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

        {/* Compact Benefits */}
        <Card className="border-2 border-green-200 bg-green-50 mb-6">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Porquê Ser Membro?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: TrendingUp, label: "Poupe até 25%" },
                { icon: Sparkles, label: "3x PawPoints" },
                { icon: Shield, label: "Seguro Incluído" },
                { icon: Crown, label: "Tratamento VIP" }
              ].map((benefit, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md">
                    <benefit.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs md:text-sm font-semibold text-gray-700">{benefit.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compact Elite Partner */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <CardContent className="p-4 md:p-6">
            <div className="text-center">
              <Award className="w-12 h-12 mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Elite Partner — €149/mês</h2>
              <p className="text-sm md:text-base text-white/90 mb-4">
                Para empresas que querem fazer parte do PawCão Universe
              </p>
              <Button
                size="sm"
                className="bg-white text-indigo-700 hover:bg-gray-100"
                onClick={() => navigate(createPageUrl('PartnerDashboard'))}
              >
                Saber Mais
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}