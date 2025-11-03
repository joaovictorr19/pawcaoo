import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Crown, Zap, Star, Sparkles, Shield, Heart, TrendingUp, Gift, Award } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function OwnerSubscriptions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
      toast.success("Subscription updated successfully!");
    },
  });

  const plans = [
    {
      type: "free",
      name: "Free Plan",
      monthlyPrice: 0,
      annualPrice: 0,
      icon: Zap,
      color: "from-gray-500 to-gray-600",
      subtitle: "Para quem quer começar a usar o PawCão gratuitamente",
      bookingDiscount: 0,
      pointsMultiplier: 1,
      freeCancellations: 0,
      priorityBooking: false,
      freeInsurance: false,
      prioritySupport: false,
      exclusiveWalkers: false,
      features: [
        "Criar perfil completo",
        "Explorar a plataforma livremente",
        "Agendar serviços pontuais",
        "Acumular PawPoints (10 pontos/€1)",
        "Suporte básico por email",
        "Acesso a todos os passeadores verificados",
        "Ideal para conhecer o ecossistema"
      ]
    },
    {
      type: "basic",
      name: "Basic Plan",
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      icon: Heart,
      color: "from-blue-500 to-blue-600",
      popular: true,
      subtitle: "O próximo passo para quem já usa PawCão regularmente",
      bookingDiscount: 10,
      pointsMultiplier: 1.5,
      freeCancellations: 2,
      priorityBooking: false,
      freeInsurance: false,
      prioritySupport: false,
      exclusiveWalkers: false,
      features: [
        "10% de desconto em todas as reservas",
        "Cashback em PawPoints (15 pontos/€1)",
        "2 cancelamentos grátis por mês",
        "Suporte rápido prioritário",
        "Pequenos descontos em serviços",
        "Entrada automática no programa de fidelidade",
        "Relatório mensal de poupanças",
        "O plano certo para conforto e economia"
      ]
    },
    {
      type: "premium",
      name: "Premium Plan",
      monthlyPrice: 39.99,
      annualPrice: 399.99,
      icon: Star,
      color: "from-purple-500 to-purple-600",
      subtitle: "O plano completo do mundo digital PawCão",
      bookingDiscount: 15,
      pointsMultiplier: 2,
      freeCancellations: 5,
      priorityBooking: true,
      freeInsurance: true,
      prioritySupport: true,
      exclusiveWalkers: false,
      features: [
        "15% de desconto em todas as reservas",
        "PawPoints dobrados (20 pontos/€1)",
        "5 cancelamentos grátis por mês",
        "Prioridade nas agendas",
        "Seguro básico incluído em todos os serviços",
        "Suporte prioritário 24/7",
        "10% de desconto em pet shops parceiras",
        "10% de desconto na Loja PawCão",
        "Acesso antecipado a novos recursos"
      ]
    },
    {
      type: "vip",
      name: "VIP Plan",
      monthlyPrice: 59.99,
      annualPrice: 599.99,
      icon: Crown,
      color: "from-yellow-500 to-yellow-600",
      subtitle: "A experiência mais completa e exclusiva do Universo PawCão",
      bookingDiscount: 25,
      pointsMultiplier: 3,
      freeCancellations: 999,
      priorityBooking: true,
      freeInsurance: true,
      prioritySupport: true,
      exclusiveWalkers: true,
      features: [
        "25% de desconto em todas as reservas",
        "PawPoints triplos (30 pontos/€1)",
        "Cancelamentos ilimitados",
        "1 banho & toilette completo/mês grátis",
        "Prioridade máxima na agenda",
        "Suporte dedicado personalizado",
        "15% em serviços de grooming adicionais",
        "15% na Loja PawCão",
        "Participação automática em sorteios exclusivos",
        "Brindes periódicos (snacks, brinquedos, acessórios)",
        "Acesso a passeadores VIP exclusivos",
        "Eventos e meetups VIP PawCão"
      ]
    }
  ];

  const [billingCycle, setBillingCycle] = React.useState("monthly");

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
    const percentage = ((savings / monthlyTotal) * 100).toFixed(0);
    return { amount: savings, percentage };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Crown className="w-12 h-12 text-yellow-600" />
            Membros PawCão Universe
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Poupe dinheiro, ganhe mais pontos e obtenha benefícios exclusivos com os nossos planos de membro
          </p>
          {subscription && (
            <Badge className="text-lg px-6 py-2 bg-green-500">
              Plano Atual: {subscription.plan_type.toUpperCase()} ({subscription.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'})
            </Badge>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <Tabs value={billingCycle} onValueChange={setBillingCycle} className="w-auto">
            <TabsList className="bg-white border-2 border-green-200 shadow-lg p-2">
              <TabsTrigger value="monthly" className="text-base px-6 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Pagamento Mensal
              </TabsTrigger>
              <TabsTrigger value="annual" className="text-base px-6 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Pagamento Anual
                <Badge className="ml-2 bg-orange-500 text-white">Poupe 17%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
                <Card className={`border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden h-full ${
                  plan.popular ? 'ring-4 ring-blue-400 scale-105' : ''
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-bold z-10 rounded-bl-lg">
                      MAIS POPULAR
                    </div>
                  )}
                  <div className={`h-3 bg-gradient-to-r ${plan.color}`} />
                  <CardHeader className="text-center pt-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-600 mb-3 min-h-[60px]">{plan.subtitle}</p>
                    <div className="text-4xl font-bold text-gray-900">
                      {getPrice(plan)}
                    </div>
                    {savings && (
                      <Badge className="mt-2 bg-green-500 text-white">
                        Poupe €{savings.amount.toFixed(2)} ({savings.percentage}%)
                      </Badge>
                    )}
                    {plan.bookingDiscount > 0 && (
                      <Badge variant="outline" className="mt-2 text-sm bg-green-50 text-green-700 border-green-300">
                        {plan.bookingDiscount}% desconto em reservas
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pb-8">
                    <ul className="space-y-3 mb-6 min-h-[320px]">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white shadow-lg h-12`}
                      onClick={() => subscribeMutation.mutate({ plan, billingCycle })}
                      disabled={subscription?.plan_type === plan.type || subscribeMutation.isPending}
                    >
                      {subscription?.plan_type === plan.type ? 'Plano Atual' : plan.type === 'free' ? 'Manter Grátis' : 'Subscrever Agora'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Elite Partner Plan - Empresas */}
        <Card className="border-0 shadow-2xl mb-12 bg-gradient-to-br from-indigo-600 to-purple-600 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
          
          <CardContent className="p-12 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-4">🐕‍🦺 Elite Partner Plan — €149/mês</h2>
              <p className="text-xl text-white/90 mb-8">
                Destinado a pet shops, escolas de treino e empresas que querem fazer parte oficial do PawCão Universe
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <Sparkles className="w-8 h-8 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Página Personalizada</h4>
                  <p className="text-sm text-white/80">Destaque em campanhas e publicidade gratuita</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <TrendingUp className="w-8 h-8 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Vendas Diretas</h4>
                  <p className="text-sm text-white/80">Sem intermediários, gestão de equipa completa</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <Shield className="w-8 h-8 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Suporte 24/7</h4>
                  <p className="text-sm text-white/80">Relatórios completos e assistência dedicada</p>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-8">
                <h4 className="font-semibold mb-4 text-lg">Inclui:</h4>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  {[
                    "Página personalizada dentro da plataforma",
                    "Destaque em todas as campanhas PawCão",
                    "Publicidade gratuita nos nossos canais",
                    "Gestão completa de equipa e funcionários",
                    "Vendas diretas sem intermediários",
                    "Relatórios detalhados e analytics",
                    "Suporte dedicado 24 horas por dia",
                    "Visibilidade real no mercado pet"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-lg mb-6 text-white/90">
                É o nível corporativo do PawCão — desenhado para quem quer crescer connosco e ganhar visibilidade real no mercado.
              </p>

              <Button
                size="lg"
                className="bg-white text-indigo-700 hover:bg-gray-100 text-lg px-8 h-14 font-semibold shadow-xl"
                onClick={() => navigate(createPageUrl('PartnerDashboard'))}
              >
                Saber Mais sobre Parceria Empresarial
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Savings Calculator */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50 shadow-xl mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
              <Gift className="w-7 h-7 text-green-600" />
              Veja Quanto Pode Poupar
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="text-4xl font-bold text-gray-600 mb-2">€480</div>
                <p className="text-gray-700 font-semibold mb-1">Gasto Anual Médio</p>
                <p className="text-sm text-gray-600">Em serviços de passeio</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-md border-2 border-blue-300">
                <div className="text-4xl font-bold text-blue-600 mb-2">€48</div>
                <p className="text-gray-700 font-semibold mb-1">Basic Poupa</p>
                <p className="text-sm text-gray-600">10% desconto + cashback</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-md border-2 border-purple-300">
                <div className="text-4xl font-bold text-purple-600 mb-2">€72</div>
                <p className="text-gray-700 font-semibold mb-1">Premium Poupa</p>
                <p className="text-sm text-gray-600">15% desconto + benefícios</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-md border-2 border-yellow-300">
                <div className="text-4xl font-bold text-yellow-600 mb-2">€120</div>
                <p className="text-gray-700 font-semibold mb-1">VIP Poupa</p>
                <p className="text-sm text-gray-600">25% desconto + regalias</p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-lg text-gray-700 mb-2">
                💡 <strong>O Basic Plan paga-se após apenas 5 reservas!</strong>
              </p>
              <p className="text-lg text-gray-700">
                💎 <strong>O Premium Plan paga-se após apenas 7 reservas!</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Overview */}
        <Card className="border-0 shadow-2xl mb-8">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardTitle className="text-2xl text-center">Porquê Ser Membro PawCão?</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Poupanças Imediatas</h4>
                <p className="text-sm text-gray-700">Poupe até 25% em cada reserva</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Mais PawPoints</h4>
                <p className="text-sm text-gray-700">Ganhe até 3x pontos em compras</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Seguro Incluído</h4>
                <p className="text-sm text-gray-700">Premium+ inclui seguro de passeio</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Tratamento VIP</h4>
                <p className="text-sm text-gray-700">Prioridade e suporte dedicado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Comparação Detalhada de Planos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold">Funcionalidade</th>
                    <th className="text-center py-4 px-4 font-semibold">Free</th>
                    <th className="text-center py-4 px-4 font-semibold bg-blue-50">Basic</th>
                    <th className="text-center py-4 px-4 font-semibold">Premium</th>
                    <th className="text-center py-4 px-4 font-semibold bg-yellow-50">VIP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-semibold">Desconto em Reservas</td>
                    <td className="text-center py-3 px-4">0%</td>
                    <td className="text-center py-3 px-4 bg-blue-50">10%</td>
                    <td className="text-center py-3 px-4">15%</td>
                    <td className="text-center py-3 px-4 bg-yellow-50 text-green-600 font-bold">25%</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Multiplicador PawPoints</td>
                    <td className="text-center py-3 px-4">1x (10/€)</td>
                    <td className="text-center py-3 px-4 bg-blue-50">1.5x (15/€)</td>
                    <td className="text-center py-3 px-4">2x (20/€)</td>
                    <td className="text-center py-3 px-4 bg-yellow-50 font-bold">3x (30/€)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Cancelamentos Grátis/Mês</td>
                    <td className="text-center py-3 px-4">0</td>
                    <td className="text-center py-3 px-4 bg-blue-50">2</td>
                    <td className="text-center py-3 px-4">5</td>
                    <td className="text-center py-3 px-4 bg-yellow-50 text-green-600 font-bold">Ilimitado</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Prioridade na Agenda</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-blue-50">-</td>
                    <td className="text-center py-3 px-4">✓</td>
                    <td className="text-center py-3 px-4 bg-yellow-50">✓ Máxima</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Seguro Incluído</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-blue-50">-</td>
                    <td className="text-center py-3 px-4">✓ Básico</td>
                    <td className="text-center py-3 px-4 bg-yellow-50">✓ Premium</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Suporte</td>
                    <td className="text-center py-3 px-4">Email</td>
                    <td className="text-center py-3 px-4 bg-blue-50">Rápido</td>
                    <td className="text-center py-3 px-4">24/7</td>
                    <td className="text-center py-3 px-4 bg-yellow-50">Dedicado</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Banho & Toilette Grátis</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-blue-50">-</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-yellow-50">✓ 1/mês</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Desconto Loja PawCão</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-blue-50">-</td>
                    <td className="text-center py-3 px-4">10%</td>
                    <td className="text-center py-3 px-4 bg-yellow-50">15%</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Passeadores VIP Exclusivos</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-blue-50">-</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-yellow-50">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}