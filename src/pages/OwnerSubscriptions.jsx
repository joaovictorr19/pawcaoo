import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Heart, Star, Check, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function OwnerSubscriptions() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [billingCycle, setBillingCycle] = useState("monthly");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success("✅ Pagamento processado! A sua subscrição será ativada em breve.");
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('canceled') === 'true') {
      toast.info("Pagamento cancelado. Pode tentar novamente quando quiser.");
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
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

      if (actionType === 'same') {
        throw new Error('Já tem este plano ativo');
      }

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

      if (plan.type === 'free') {
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
      type: "basic",
      name: "Basic",
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      icon: Heart,
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      rarity: "common",
      pointsMultiplier: 1.5,
      cashbackRate: 5,
      freeWalksPerMonth: 1,
      freeCancellations: 2,
      priorityBooking: false,
      freeInsurance: false,
      prioritySupport: false,
      exclusiveWalkers: false,
      features: [
        "1.5 pontos por €1",
        "5% cashback",
        "1 passeio grátis/mês",
        "2 cancelamentos grátis",
        "Suporte rápido"
      ]
    },
    {
      type: "premium",
      name: "Premium",
      monthlyPrice: 44.99,
      annualPrice: 449.99,
      icon: Star,
      gradient: "from-purple-500 via-purple-600 to-pink-600",
      rarity: "rare",
      pointsMultiplier: 2,
      cashbackRate: 10,
      freeWalksPerMonth: 2,
      freeCancellations: 5,
      priorityBooking: true,
      freeInsurance: true,
      prioritySupport: true,
      exclusiveWalkers: false,
      features: [
        "2 pontos por €1",
        "10% cashback",
        "2 passeios grátis/mês",
        "5 cancelamentos/mês",
        "Reembolso 100%",
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
      gradient: "from-yellow-500 via-orange-500 to-red-500",
      rarity: "legendary",
      pointsMultiplier: 3,
      cashbackRate: 15,
      freeWalksPerMonth: 3,
      freeCancellations: 999,
      priorityBooking: true,
      freeInsurance: true,
      prioritySupport: true,
      exclusiveWalkers: true,
      features: [
        "3 pontos por €1",
        "15% cashback",
        "3 passeios grátis/mês",
        "Cancelamentos ilimitados",
        "Reembolso 100%",
        "1 banho grátis/mês",
        "Prioridade máxima",
        "Suporte dedicado",
        "Dog Walkers VIP"
      ]
    }
  ];

  const rarityStyles = {
    common: {
      border: "border-blue-500/50",
      glow: "shadow-blue-500/30",
      bg: "from-blue-950/80 to-slate-900/80"
    },
    rare: {
      border: "border-purple-500/50",
      glow: "shadow-purple-500/30",
      bg: "from-purple-950/80 to-slate-900/80"
    },
    legendary: {
      border: "border-amber-500/50",
      glow: "shadow-amber-500/50",
      bg: "from-amber-950/80 to-slate-900/80"
    }
  };

  const nextCard = () => {
    setCarouselIndex((prev) => (prev + 1) % plans.length);
  };

  const prevCard = () => {
    setCarouselIndex((prev) => (prev - 1 + plans.length) % plans.length);
  };

  const getPrice = (plan) => {
    const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
    const period = billingCycle === "monthly" ? "/mês" : "/ano";
    return `€${price}${period}`;
  };

  const getSavings = (plan) => {
    if (billingCycle === "monthly") return null;
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = (monthlyTotal - plan.annualPrice).toFixed(2);
    return savings;
  };

  return (
    <div className="min-h-screen bg-neutral-950 relative overflow-hidden rounded-3xl mx-2 md:mx-4 my-2">
      {/* Nevoeiro animado */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]"
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px]"
          animate={{ 
            x: [0, -80, 0], 
            y: [0, -60, 0],
            opacity: [0.1, 0.15, 0.1] 
          }}
          transition={{ duration: 12, repeat: Infinity, delay: 2 }}
        />
      </div>

      {/* Botão Voltar */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 text-white hover:bg-white/10 z-20"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      {/* Plano Atual Badge */}
      {subscription && (
        <div className="absolute top-4 right-4 z-20">
          <Badge className="bg-white/20 backdrop-blur text-white border-white/40">
            <CheckCircle className="w-3 h-3 mr-1" />
            Plano Atual: {subscription.plan_type.toUpperCase()}
          </Badge>
          {subscription.plan_type !== 'free' && subscription.stripe_customer_id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={openBillingPortal}
              className="ml-2 text-white hover:bg-white/10"
            >
              <CreditCard className="w-3 h-3 mr-1" />
              Gerir
            </Button>
          )}
        </div>
      )}

      {/* Conteúdo Principal */}
      <section className="relative pt-12 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Título */}
          <motion.h2
            className="text-center text-purple-500/60 uppercase tracking-[0.3em] text-sm font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Planos Premium
          </motion.h2>
          <p className="text-center text-gray-600 text-xs mb-8">
            Deslize para ver os planos disponíveis
          </p>

          {/* Seletor de Ciclo */}
          <div className="flex justify-center gap-2 mb-12">
            <Button
              variant={billingCycle === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBillingCycle("monthly")}
              className={billingCycle === "monthly" ? "bg-white text-purple-900" : "text-white hover:bg-white/10"}
            >
              Mensal
            </Button>
            <Button
              variant={billingCycle === "annual" ? "default" : "ghost"}
              size="sm"
              onClick={() => setBillingCycle("annual")}
              className={billingCycle === "annual" ? "bg-white text-purple-900" : "text-white hover:bg-white/10"}
            >
              Anual <Badge className="ml-1 bg-green-500 text-white text-xs">-17%</Badge>
            </Button>
          </div>

          {/* Carrossel de Planos */}
          <div className="relative">
            {/* Botões de navegação */}
            <Button
              variant="ghost"
              size="icon"
              onClick={prevCard}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 h-12 w-12 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={nextCard}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-black/50 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 h-12 w-12 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>

            {/* Container das cartas */}
            <div className="flex justify-center items-center gap-4 overflow-hidden px-16 py-8">
              <AnimatePresence mode="popLayout">
                {plans.slice(carouselIndex, carouselIndex + 3).concat(
                  plans.slice(0, Math.max(0, carouselIndex + 3 - plans.length))
                ).slice(0, 3).map((plan, idx) => {
                  const PlanIcon = plan.icon;
                  const planStyle = rarityStyles[plan.rarity];
                  const planIsActive = subscription?.plan_type === plan.type;
                  const planSavings = getSavings(plan);

                  return (
                    <motion.div
                      key={plan.type}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: idx === 1 ? 1 : 0.6, 
                        scale: idx === 1 ? 1 : 0.85,
                        zIndex: idx === 1 ? 10 : 0
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                      className={idx === 1 ? '' : 'hidden md:block'}
                    >
                      <div className={`relative w-80 min-h-[600px] rounded-2xl border-2 ${planStyle.border} bg-gradient-to-br ${planStyle.bg} shadow-2xl ${planStyle.glow} overflow-hidden`}>
                        {/* Padrão decorativo */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-4 left-4 w-8 h-8 border border-purple-500/50 rotate-45" />
                          <div className="absolute top-4 right-4 w-8 h-8 border border-purple-500/50 rotate-45" />
                          <div className="absolute bottom-4 left-4 w-8 h-8 border border-purple-500/50 rotate-45" />
                          <div className="absolute bottom-4 right-4 w-8 h-8 border border-purple-500/50 rotate-45" />
                        </div>

                        {/* Conteúdo */}
                        <div className="relative h-full flex flex-col items-center p-6">
                          {/* Raridade */}
                          <Badge className={`uppercase tracking-widest text-[10px] font-bold mb-4 ${
                            plan.rarity === 'legendary' ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black' :
                            plan.rarity === 'rare' ? 'bg-purple-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                            {plan.rarity}
                          </Badge>

                          {planIsActive && (
                            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 text-xs font-bold shadow-lg border-0">
                              Plano Atual
                            </Badge>
                          )}

                          {/* Ícone Central */}
                          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 shadow-xl`}>
                            <PlanIcon className="w-10 h-10 text-white" />
                          </div>

                          {/* Título */}
                          <h2 className="text-3xl font-black text-white text-center mb-4">
                            {plan.name}
                          </h2>

                          {/* Preço */}
                          <div className="text-center mb-4">
                            <div className="text-4xl font-black text-white">
                              {getPrice(plan)}
                            </div>
                            {planSavings && (
                              <Badge className="mt-2 bg-green-500 text-white border-0">
                                Poupe €{planSavings}
                              </Badge>
                            )}
                          </div>

                          {/* Benefícios Destacados */}
                          {plan.cashbackRate > 0 && (
                            <div className="mb-3 p-3 bg-green-500/20 border border-green-400/50 rounded-xl backdrop-blur w-full">
                              <p className="text-sm font-bold text-green-300 text-center">
                                {plan.cashbackRate}% Cashback
                              </p>
                            </div>
                          )}

                          {plan.freeWalksPerMonth > 0 && (
                            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-400/50 rounded-xl backdrop-blur w-full">
                              <p className="text-sm font-bold text-blue-300 text-center">
                                {plan.freeWalksPerMonth} Passeio{plan.freeWalksPerMonth > 1 ? 's' : ''} Grátis/Mês
                              </p>
                            </div>
                          )}

                          {/* Features */}
                          <ul className="space-y-2 mb-6 flex-1">
                            {plan.features.map((feature, featureIdx) => (
                              <li key={featureIdx} className="flex items-start gap-2 text-sm text-white/90">
                                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Botão */}
                          <Button
                            className={`w-full bg-gradient-to-r ${plan.gradient} hover:opacity-90 text-white font-bold h-12 rounded-xl shadow-xl`}
                            onClick={() => subscribeMutation.mutate({ plan, billingCycle })}
                            disabled={planIsActive || subscribeMutation.isPending}
                          >
                            {planIsActive ? 'Plano Atual' : subscribeMutation.isPending ? 'Processando...' : 'Subscrever'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Indicadores */}
            <div className="flex justify-center gap-2 mt-6">
              {plans.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === carouselIndex ? 'bg-purple-500 w-6' : 'bg-neutral-700 hover:bg-neutral-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}