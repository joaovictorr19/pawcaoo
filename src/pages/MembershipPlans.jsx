import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap, Shield, Dog, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";

const PLANS = [
  {
    id: 'FREE',
    name: 'Gratuito',
    price: 0,
    priceLabel: '€0',
    period: '/mês',
    description: 'Para quem está começando',
    color: 'from-gray-400 to-gray-500',
    features: [
      { text: '1 ponto por euro gasto', included: true },
      { text: '0% cashback na loja', included: true },
      { text: '0 passeios inclusos', included: true },
      { text: 'Cancelamentos padrão', included: true },
      { text: 'Reembolso 80%', included: true },
    ],
    notIncluded: [
      'Seguro incluído',
      'Banho grátis mensal',
      'Passeadores VIP'
    ]
  },
  {
    id: 'BASIC',
    name: 'Basic',
    price: 19.99,
    priceLabel: '€19.99',
    period: '/mês',
    description: 'Para donos ocasionais',
    color: 'from-blue-500 to-blue-600',
    features: [
      { text: '1.5x pontos por euro', included: true, highlight: true },
      { text: '5% cashback na loja', included: true, highlight: true },
      { text: '1 passeio grátis/mês', included: true, highlight: true },
      { text: '2 cancelamentos grátis/mês', included: true },
      { text: 'Reembolso 80%', included: true },
    ],
    notIncluded: [
      'Seguro incluído',
      'Banho grátis mensal',
      'Passeadores VIP'
    ]
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: 44.99,
    priceLabel: '€44.99',
    period: '/mês',
    description: 'O mais popular',
    color: 'from-purple-500 to-indigo-600',
    popular: true,
    features: [
      { text: '2x pontos por euro', included: true, highlight: true },
      { text: '10% cashback na loja', included: true, highlight: true },
      { text: '2 passeios grátis/mês', included: true, highlight: true },
      { text: '5 cancelamentos grátis/mês', included: true },
      { text: 'Reembolso 100%', included: true, highlight: true },
      { text: 'Seguro incluído', included: true, highlight: true },
    ],
    notIncluded: [
      'Banho grátis mensal',
      'Passeadores VIP'
    ]
  },
  {
    id: 'VIP',
    name: 'VIP',
    price: 79.99,
    priceLabel: '€79.99',
    period: '/mês',
    description: 'A experiência completa',
    color: 'from-yellow-500 to-orange-500',
    icon: Crown,
    features: [
      { text: '3x pontos por euro', included: true, highlight: true },
      { text: '15% cashback na loja', included: true, highlight: true },
      { text: '3 passeios grátis/mês', included: true, highlight: true },
      { text: 'Cancelamentos ilimitados', included: true, highlight: true },
      { text: 'Reembolso 100%', included: true },
      { text: 'Seguro incluído', included: true },
      { text: '1 banho grátis/mês', included: true, highlight: true },
      { text: 'Acesso a passeadores VIP', included: true, highlight: true },
    ],
    notIncluded: []
  }
];

export default function MembershipPlans() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: currentMembership } = useQuery({
    queryKey: ['myMembership', user?.email],
    queryFn: async () => {
      const plans = await base44.entities.MembershipPlan.filter({ 
        user_email: user.email,
        status: 'active'
      });
      return plans[0] || null;
    },
    enabled: !!user?.email
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planType) => {
      const response = await base44.functions.invoke('createMembershipCheckout', { 
        plan_type: planType 
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
    onError: (error) => {
      toast.error('Erro ao processar assinatura: ' + error.message);
      setLoadingPlan(null);
    }
  });

  const handleSubscribe = async (planId) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (planId === 'FREE') {
      toast.info('Você já está no plano gratuito!');
      return;
    }

    setLoadingPlan(planId);
    subscribeMutation.mutate(planId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-4"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">Economize até 40% com assinatura</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4"
          >
            Escolha o Plano Ideal
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Passeios grátis, cashback em compras e benefícios exclusivos para você e seu pet.
          </motion.p>
        </div>

        {/* Current Plan Badge */}
        {currentMembership && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <Badge className="bg-green-100 text-green-700 text-sm px-4 py-2">
              <Check className="w-4 h-4 mr-1" />
              Seu plano atual: {currentMembership.plan_type}
            </Badge>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan, idx) => {
            const isCurrentPlan = currentMembership?.plan_type === plan.id;
            const Icon = plan.icon || Star;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg px-4 py-1">
                      ⭐ Mais Popular
                    </Badge>
                  </div>
                )}
                
                <Card className={`h-full border-2 transition-all hover:shadow-2xl ${
                  plan.popular ? 'border-purple-400 shadow-xl scale-105' : 'border-gray-200'
                } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
                  <CardHeader className={`bg-gradient-to-r ${plan.color} text-white rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <Icon className="w-8 h-8" />
                      {isCurrentPlan && (
                        <Badge className="bg-white/20 text-white">Atual</Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <p className="text-white/80 text-sm">{plan.description}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-black">{plan.priceLabel}</span>
                      <span className="text-white/80">{plan.period}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            feature.highlight ? 'text-purple-600' : 'text-green-500'
                          }`} />
                          <span className={`text-sm ${
                            feature.highlight ? 'font-semibold text-gray-900' : 'text-gray-600'
                          }`}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                      {plan.notIncluded.map((feature, i) => (
                        <li key={`not-${i}`} className="flex items-start gap-2 opacity-50">
                          <span className="w-5 h-5 flex-shrink-0 text-center text-gray-400">—</span>
                          <span className="text-sm text-gray-400 line-through">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      className={`w-full h-12 font-semibold ${
                        plan.id === 'FREE' 
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                          : `bg-gradient-to-r ${plan.color} text-white hover:opacity-90`
                      }`}
                      disabled={isCurrentPlan || loadingPlan === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {loadingPlan === plan.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isCurrentPlan ? (
                        'Plano Atual'
                      ) : plan.id === 'FREE' ? (
                        'Plano Gratuito'
                      ) : (
                        <>
                          Assinar Agora
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Como funciona o Sistema?</h2>
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Tokens Mensais</h3>
                <p className="text-sm text-gray-600">
                  Receba 1-3 passeios grátis ao pagar a assinatura
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Dog className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Pagamento Auto</h3>
                <p className="text-sm text-gray-600">
                  Ao usar token, o Walker recebe €12-15 automaticamente
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Cashback Interno</h3>
                <p className="text-sm text-gray-600">
                  5-15% volta como crédito para usar na Loja PawCão
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Validade 30 Dias</h3>
                <p className="text-sm text-gray-600">
                  Use seus tokens antes do próximo ciclo
                </p>
              </div>
            </div>
            
            {/* Restriction Note */}
            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-800">
                <strong>💡 Dica:</strong> Tokens grátis são válidos em <strong>dias úteis (9h-18h)</strong>. 
                Para fins-de-semana (+€5) ou horário noturno (+€3), aplica-se taxa adicional.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}