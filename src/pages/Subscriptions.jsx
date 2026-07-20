import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star, TrendingUp, Calculator, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export default function Subscriptions() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [walksPerMonth, setWalksPerMonth] = useState(20);
  const [avgWalkPrice, setAvgWalkPrice] = useState(25);
  const [showComparison, setShowComparison] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  const { data: subscription } = useQuery({
    queryKey: ['walkerSubscription'],
    queryFn: async () => {
      const subs = await base44.entities.WalkerSubscription.filter({
        walker_email: user?.email,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!user,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (plan) => {
      if (subscription) {
        return await base44.entities.WalkerSubscription.update(subscription.id, {
          plan_type: plan.type,
          monthly_fee: plan.fee,
          commission_rate: plan.commission,
          features: plan.features,
        });
      } else {
        return await base44.entities.WalkerSubscription.create({
          walker_email: user?.email,
          walker_name: user?.full_name,
          plan_type: plan.type,
          monthly_fee: plan.fee,
          commission_rate: plan.commission,
          start_date: new Date().toISOString().split('T')[0],
          features: plan.features,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkerSubscription'] });
      toast.success("Subscription updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update subscription", {
        description: error.message
      });
    }
  });

  const plans = [
    {
      type: "free",
      name: "Free",
      fee: 0,
      commission: 15,
      icon: Zap,
      color: "from-gray-500 to-gray-600",
      features: [
        "€0/mês",
        "15% comissão",
        "Até 10 reservas/mês",
        "1 foto",
        "Pagamento em 5 dias",
        "Suporte por email"
      ]
    },
    {
      type: "basic",
      name: "Basic",
      fee: 19,
      commission: 10,
      icon: Check,
      color: "from-blue-500 to-blue-600",
      popular: true,
      features: [
        "€19/mês",
        "10% comissão (poupe 5%)",
        "Reservas ilimitadas",
        "5 fotos/vídeos",
        "Pagamento em 48h",
        "Suporte prioritário"
      ]
    },
    {
      type: "premium",
      name: "Premium",
      fee: 39,
      commission: 5,
      icon: Star,
      color: "from-purple-500 to-purple-600",
      features: [
        "€39/mês",
        "5% comissão (poupe 10%)",
        "Tudo ilimitado",
        "Pagamento instantâneo",
        "Suporte 24/7",
        "Selo Top PawCão"
      ]
    },
    {
      type: "pro",
      name: "Pro",
      fee: 79,
      commission: 0,
      icon: Crown,
      color: "from-yellow-500 to-yellow-600",
      features: [
        "€79/mês",
        "0% comissão - 100% seu!",
        "Tudo Premium +",
        "Perfil VIP homepage",
        "Seguro incluído",
        "Badge Pro dourado"
      ]
    }
  ];

  const calculateEarnings = (commissionRate, monthlyFee) => {
    const monthlyRevenue = walksPerMonth * avgWalkPrice;
    const commissionPaid = monthlyRevenue * (commissionRate / 100);
    const netEarnings = monthlyRevenue - commissionPaid - monthlyFee;
    const freeCommission = monthlyRevenue * 0.15;
    const savings = freeCommission - commissionPaid - monthlyFee;
    
    return {
      monthlyRevenue,
      commissionPaid,
      netEarnings,
      monthlySavings: savings,
      annualSavings: savings * 12
    };
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {t('walkerSubscriptionsTitle', language)}
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            {t('saveCommissions', language)}
          </p>
          {subscription && (
            <Badge className="mt-2 text-sm px-4 py-1 bg-green-500">
              {t('currentPlanLabel', language)}: {subscription.plan_type.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Compact Calculator */}
        <Card className="glass-panel border-2 border-purple-200 shadow-xl mb-6">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              {t('calculateEarnings', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  {t('walksPerMonth', language)}: {walksPerMonth}
                </label>
                <Slider
                  value={[walksPerMonth]}
                  onValueChange={([value]) => setWalksPerMonth(value)}
                  min={5}
                  max={100}
                  step={5}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  {t('averageWalkPrice', language)}: €{avgWalkPrice}
                </label>
                <Slider
                  value={[avgWalkPrice]}
                  onValueChange={([value]) => setAvgWalkPrice(value)}
                  min={10}
                  max={50}
                  step={5}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {plans.map((plan) => {
                const earnings = calculateEarnings(plan.commission, plan.fee);
                return (
                  <div key={plan.type} className={`text-center p-3 bg-white rounded-xl shadow-md border-2 ${
                    plan.popular ? 'border-blue-400' : 'border-gray-200'
                  }`}>
                    <div className="text-xs font-semibold text-gray-600 mb-1">{plan.name}</div>
                    <div className="text-xl md:text-2xl font-bold text-green-600">
                      €{earnings.netEarnings.toFixed(0)}
                    </div>
                    {plan.type !== 'free' && (
                      <div className="text-sm font-bold text-purple-600 mt-1">
                        +€{earnings.monthlySavings.toFixed(0)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Compact Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const earnings = calculateEarnings(plan.commission, plan.fee);

            return (
              <motion.div
                key={plan.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`glass-panel border-0 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden h-full ${
                  plan.popular ? 'ring-2 ring-blue-400' : ''
                }`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white px-2 py-1 text-xs font-bold z-10 rounded-bl-lg">
                      Popular
                    </div>
                  )}
                  <div className={`h-2 bg-gradient-to-r ${plan.color}`} />
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      €{plan.fee}
                      <span className="text-sm text-gray-600">/mês</span>
                    </div>
                    <Badge variant="outline" className={`text-xs mb-3 ${plan.commission === 0 ? 'bg-green-100 text-green-700' : ''}`}>
                      {plan.commission}% comissão
                    </Badge>
                    
                    {plan.type !== 'free' && (
                      <div className="mb-3 p-2 bg-green-50 rounded-lg">
                        <div className="text-base font-bold text-green-600">
                          +€{earnings.monthlySavings.toFixed(0)}/mês
                        </div>
                        <div className="text-xs text-gray-600">poupança vs Free</div>
                      </div>
                    )}

                    <ul className="space-y-1.5 mb-3 min-h-[120px]">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-gray-700">
                          <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white shadow-lg h-9 text-sm`}
                      onClick={() => subscribeMutation.mutate(plan)}
                      disabled={subscription?.plan_type === plan.type || subscribeMutation.isPending}
                    >
                      {subscription?.plan_type === plan.type ? 'Plano Atual' : 'Subscrever'}
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
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowComparison(!showComparison)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('planComparisonTitle', language)}</CardTitle>
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
                          <th className="text-left py-2 px-2 font-semibold">{t('featureLabel', language)}</th>
                          <th className="text-center py-2 px-2 font-semibold">Free</th>
                          <th className="text-center py-2 px-2 font-semibold bg-blue-50">Basic</th>
                          <th className="text-center py-2 px-2 font-semibold">Premium</th>
                          <th className="text-center py-2 px-2 font-semibold">Pro</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">{t('monthlyFeeLabel', language)}</td>
                          <td className="text-center py-2 px-2">€0</td>
                          <td className="text-center py-2 px-2 bg-blue-50">€19</td>
                          <td className="text-center py-2 px-2">€39</td>
                          <td className="text-center py-2 px-2">€79</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2 font-semibold">{t('commissionLabel', language)}</td>
                          <td className="text-center py-2 px-2">15%</td>
                          <td className="text-center py-2 px-2 bg-blue-50">10%</td>
                          <td className="text-center py-2 px-2">5%</td>
                          <td className="text-center py-2 px-2 text-green-600 font-bold">0%</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">{t('bookingsPerMonthLabel', language)}</td>
                          <td className="text-center py-2 px-2">10</td>
                          <td className="text-center py-2 px-2 bg-blue-50">∞</td>
                          <td className="text-center py-2 px-2">∞</td>
                          <td className="text-center py-2 px-2">∞</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-2">{t('paymentSpeedLabel', language)}</td>
                          <td className="text-center py-2 px-2">5d</td>
                          <td className="text-center py-2 px-2 bg-blue-50">48h</td>
                          <td className="text-center py-2 px-2">Instant</td>
                          <td className="text-center py-2 px-2">Instant</td>
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
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
              {t('whySubscribePaid', language)}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "15%", label: t('saveOnCommissionsTitle', language) },
                { value: "10x", label: t('moreVisibilityTitle', language) },
                { value: "48h→0h", label: t('fasterPaymentsTitle', language) },
                { value: "24/7", label: t('betterSupportTitle', language) }
              ].map((benefit, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">{benefit.value}</div>
                  <p className="text-xs md:text-sm text-gray-700">{benefit.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}