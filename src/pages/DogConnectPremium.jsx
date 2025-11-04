import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Check, Crown, Sparkles, Zap, Star, TrendingUp, Camera, 
  Shield, BarChart3, Palette, Gift, Award, ChevronRight, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DogConnectLogo from "../components/social/DogConnectLogo";

export default function DogConnectPremium() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showComparison, setShowComparison] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: subscription } = useQuery({
    queryKey: ['socialSubscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.SocialSubscription.filter({
        user_email: user.email,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!user,
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      if (!user?.email) return { points_balance: 0 };
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user.email
      });
      return points[0] || { points_balance: 0 };
    },
    enabled: !!user,
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ plan }) => {
      const features = {
        ad_free: plan.type !== 'free',
        advanced_filters: plan.type !== 'free',
        unlimited_posts: plan.type !== 'free',
        custom_profile_themes: plan.type === 'pro',
        verified_badge: plan.type === 'pro',
        priority_support: plan.type !== 'free',
        analytics_dashboard: plan.type === 'pro',
        event_promotion: plan.type === 'pro',
        custom_stickers: plan.type === 'pro',
        video_posts_duration: plan.type === 'free' ? 60 : plan.type === 'premium' ? 180 : 300,
        max_photos_per_post: plan.type === 'free' ? 5 : plan.type === 'premium' ? 10 : 20,
        points_multiplier: plan.type === 'free' ? 1 : plan.type === 'premium' ? 2 : 3
      };

      if (subscription) {
        return await base44.entities.SocialSubscription.update(subscription.id, {
          plan_type: plan.type,
          billing_cycle: billingCycle,
          monthly_price: billingCycle === 'monthly' ? plan.monthlyPrice : 0,
          annual_price: billingCycle === 'annual' ? plan.annualPrice : 0,
          features,
          start_date: new Date().toISOString().split('T')[0]
        });
      } else {
        return await base44.entities.SocialSubscription.create({
          user_email: user.email,
          user_name: user.full_name,
          plan_type: plan.type,
          billing_cycle: billingCycle,
          monthly_price: billingCycle === 'monthly' ? plan.monthlyPrice : 0,
          annual_price: billingCycle === 'annual' ? plan.annualPrice : 0,
          features,
          start_date: new Date().toISOString().split('T')[0]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialSubscription'] });
      toast.success("✨ Subscrição Dog Connect atualizada!");
      setSelectedPlan(null);
    },
  });

  const plans = [
    {
      type: "free",
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      icon: Camera,
      color: "from-gray-500 to-gray-600",
      features: [
        "Posts ilimitados com texto e fotos",
        "Até 5 fotos por post",
        "Vídeos até 1 minuto",
        "Stories 24h",
        "1x PawPoints por atividade",
        "Anúncios ocasionais",
        "Filtros básicos"
      ]
    },
    {
      type: "premium",
      name: "Premium",
      monthlyPrice: 4.99,
      annualPrice: 49.99,
      icon: Star,
      color: "from-blue-500 via-purple-500 to-pink-500",
      popular: true,
      features: [
        "✨ Sem anúncios",
        "Até 10 fotos por post",
        "Vídeos até 3 minutos",
        "2x PawPoints",
        "Filtros avançados de busca",
        "Suporte prioritário",
        "Estatísticas de posts",
        "Temas personalizados (3 opções)"
      ]
    },
    {
      type: "pro",
      name: "Pro",
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      icon: Crown,
      color: "from-yellow-400 via-orange-500 to-red-500",
      features: [
        "🔥 Tudo do Premium +",
        "Até 20 fotos por post",
        "Vídeos até 5 minutos",
        "3x PawPoints",
        "Badge verificado ✓",
        "Dashboard de analytics completo",
        "Promoção de eventos destacada",
        "Stickers e frames exclusivos",
        "Temas ilimitados",
        "Suporte dedicado 24/7"
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
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <DogConnectLogo size="large" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dog Connect Premium
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Desbloqueie recursos exclusivos e ganhe mais PawPoints! 🐾
          </p>
          {subscription && (
            <Badge className="text-lg px-6 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg">
              <Crown className="w-5 h-5 mr-2" />
              Plano {subscription.plan_type.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* PawPoints Balance */}
        <div className="flex justify-center mb-8">
          <Card className="border-2 border-purple-300 shadow-xl bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Seus PawPoints</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {loyaltyPoints?.points_balance?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {subscription?.features?.points_multiplier || 1}x multiplicador
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(createPageUrl('DogConnectRewards'))}
                  className="ml-4 border-purple-300 hover:bg-purple-50"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Resgatar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <Tabs value={billingCycle} onValueChange={setBillingCycle} className="w-auto">
            <TabsList className="bg-white border-2 border-purple-200 shadow-lg p-1">
              <TabsTrigger 
                value="monthly" 
                className="text-sm px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
              >
                Mensal
              </TabsTrigger>
              <TabsTrigger 
                value="annual" 
                className="text-sm px-6 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
              >
                Anual 
                <Badge className="ml-2 bg-orange-500 text-white text-xs">-17%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const savings = getSavings(plan);
            const isCurrentPlan = subscription?.plan_type === plan.type;

            return (
              <motion.div
                key={plan.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 shadow-lg">
                      ⭐ Mais Popular
                    </Badge>
                  </div>
                )}
                <Card className={`border-0 shadow-2xl hover:shadow-3xl transition-all h-full ${
                  plan.popular ? 'ring-2 ring-purple-400 scale-105' : ''
                } ${isCurrentPlan ? 'ring-2 ring-green-400' : ''}`}>
                  <div className={`h-3 bg-gradient-to-r ${plan.color}`} />
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    
                    <div className="mb-4">
                      <div className="text-4xl font-bold text-gray-900">
                        {getPrice(plan)}
                      </div>
                      {savings && (
                        <Badge className="mt-2 bg-green-500 text-white">
                          Poupe €{savings.amount.toFixed(2)} ({savings.percentage}%)
                        </Badge>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full h-12 text-lg font-semibold shadow-lg transition-all ${
                        isCurrentPlan 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : `bg-gradient-to-r ${plan.color} hover:opacity-90`
                      } text-white`}
                      onClick={() => setSelectedPlan(plan)}
                      disabled={isCurrentPlan || subscribeMutation.isPending}
                    >
                      {isCurrentPlan ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Plano Atual
                        </>
                      ) : (
                        <>
                          {plan.type === 'free' ? 'Começar Grátis' : 'Assinar Agora'}
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <Card className="border-2 border-purple-300 shadow-2xl mb-12 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6">
            <h2 className="text-3xl font-bold text-white text-center mb-2">
              Por que Dog Connect Premium?
            </h2>
            <p className="text-white/90 text-center">
              Mais recursos, mais diversão, mais PawPoints! 🎉
            </p>
          </div>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Sparkles,
                  title: "Ganhe Mais PawPoints",
                  description: "Até 3x mais pontos por cada interação no Dog Connect",
                  color: "purple"
                },
                {
                  icon: Shield,
                  title: "Experiência Premium",
                  description: "Sem anúncios, filtros avançados e recursos exclusivos",
                  color: "blue"
                },
                {
                  icon: Award,
                  title: "Badge Verificado",
                  description: "Destaque seu perfil com o badge verificado (Pro)",
                  color: "pink"
                }
              ].map((benefit, idx) => (
                <div key={idx} className="text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br from-${benefit.color}-500 to-${benefit.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <benefit.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How PawPoints Work */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <TrendingUp className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Como Ganhar PawPoints no Dog Connect
              </h3>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { action: "Publicar Post", points: "10", icon: Camera },
                { action: "Receber Like", points: "2", icon: Star },
                { action: "Comentar", points: "5", icon: BarChart3 },
                { action: "Participar Evento", points: "50", icon: Award }
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
                  <item.icon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    +{item.points}
                  </div>
                  <div className="text-sm text-gray-700">{item.action}</div>
                  {subscription?.features?.points_multiplier > 1 && (
                    <Badge className="mt-2 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {subscription.features.points_multiplier}x = {item.points * subscription.features.points_multiplier}pts
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setSelectedPlan(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-8"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPlan(null)}
                className="absolute top-4 right-4"
              >
                <X className="w-5 h-5" />
              </Button>

              <div className="text-center mb-6">
                <div className={`w-20 h-20 bg-gradient-to-br ${selectedPlan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <selectedPlan.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedPlan.name}
                </h3>
                <div className="text-3xl font-bold text-purple-600 mb-4">
                  {getPrice(selectedPlan)}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {selectedPlan.features.slice(0, 5).map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full h-12 bg-gradient-to-r ${selectedPlan.color} hover:opacity-90 text-white text-lg font-semibold shadow-lg`}
                onClick={() => subscribeMutation.mutate({ plan: selectedPlan })}
                disabled={subscribeMutation.isPending}
              >
                {subscribeMutation.isPending ? 'Processando...' : 'Confirmar Assinatura'}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}