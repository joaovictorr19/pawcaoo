import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star, Sparkles, TrendingUp, Calculator, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { Slider } from "@/components/ui/slider";

export default function Subscriptions() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [walksPerMonth, setWalksPerMonth] = useState(20);
  const [avgWalkPrice, setAvgWalkPrice] = useState(25);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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
    },
  });

  const plans = [
    {
      type: "free",
      name: "Free",
      fee: 0,
      commission: 15,
      icon: Zap,
      color: "from-gray-500 to-gray-600",
      subtitle: t('freeForStarters', language),
      features: [
        `€0 ${t('perMonthLabel', language)}`,
        `15% ${t('commissionLabel', language)}`,
        `${t('upToLabel', language)} 10 ${t('bookingsPerMonthLabel', language).toLowerCase()}`,
        "1 foto de perfil",
        `${t('paymentSpeedLabel', language)}: 5 ${t('daysLabel', language)}`,
        `${t('supportLabel', language)}: ${t('emailSupport', language)}`,
        "Perfeito para testar a plataforma"
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
      subtitle: t('regularCustomers', language),
      features: [
        `€19 ${t('perMonthLabel', language)}`,
        `10% ${t('commissionLabel', language)} (poupe 5%)`,
        `${t('unlimitedLabel', language)} ${t('bookingsPerMonthLabel', language).toLowerCase()}`,
        `5 ${t('photosVideosLabel', language)}`,
        `${t('paymentSpeedLabel', language)}: 48 ${t('hoursLabel', language)}`,
        `${t('supportLabel', language)}: ${t('fastSupport', language)}`,
        "Destaque em campanhas locais",
        "Ferramentas de crescimento"
      ]
    },
    {
      type: "premium",
      name: "Premium",
      fee: 39,
      commission: 5,
      icon: Star,
      color: "from-purple-500 to-purple-600",
      subtitle: t('activeWantVisibility', language),
      features: [
        `€39 ${t('perMonthLabel', language)}`,
        `5% ${t('commissionLabel', language)} (poupe 10%)`,
        `${t('unlimitedLabel', language)} ${t('bookingsPerMonthLabel', language).toLowerCase()}`,
        `${t('unlimitedLabel', language)} ${t('photosVideosLabel', language)}`,
        `${t('paymentSpeedLabel', language)}: ${t('instantLabel', language)}`,
        `${t('supportLabel', language)}: ${t('prioritySupport', language)} 24/7`,
        'Selo "Top PawCão"',
        "Prioridade nas pesquisas",
        "Estatísticas de performance",
        "Badge verificado"
      ]
    },
    {
      type: "pro",
      name: "Pro",
      fee: 79,
      commission: 0,
      icon: Crown,
      color: "from-yellow-500 to-yellow-600",
      subtitle: t('liveFromPetWorld', language),
      features: [
        `€79 ${t('perMonthLabel', language)}`,
        `0% ${t('commissionLabel', language)} - Fique com 100%!`,
        `${t('unlimitedLabel', language)} ${t('bookingsPerMonthLabel', language).toLowerCase()}`,
        `${t('unlimitedLabel', language)} ${t('photosVideosLabel', language)}`,
        `${t('paymentSpeedLabel', language)}: ${t('instantLabel', language)}`,
        `${t('supportLabel', language)}: Equipa PawCão directa`,
        "Perfil VIP na homepage",
        "Seguro de responsabilidade incluído",
        "Eventos e parcerias exclusivas",
        'Badge "Profissional Pro" dourado',
        "Programa de afiliados",
        "Membro core da marca premium"
      ]
    },
    {
      type: "elite",
      name: "Elite Partner",
      fee: 149,
      commission: 0,
      icon: Sparkles,
      color: "from-pink-500 to-pink-600",
      subtitle: t('forSchoolsAndCompanies', language),
      comingSoon: true,
      features: [
        `€149 ${t('perMonthLabel', language)}`,
        `0% ${t('commissionLabel', language)}`,
        "Página personalizada na app",
        "Campanhas publicitárias grátis",
        "Gestão de equipa",
        `${t('supportLabel', language)}: 24/7 dedicado`,
        "Showcase de marca oficial",
        "Recursos de parceria corporativa",
        "Gestão multi-localização"
      ]
    }
  ];

  // Earnings Calculator
  const calculateEarnings = (commissionRate, monthlyFee) => {
    const monthlyRevenue = walksPerMonth * avgWalkPrice;
    const commissionPaid = monthlyRevenue * (commissionRate / 100);
    const netEarnings = monthlyRevenue - commissionPaid - monthlyFee;
    
    const freeCommission = monthlyRevenue * 0.15;
    const savings = freeCommission - commissionPaid - monthlyFee;
    
    const paybackMonths = monthlyFee > 0 ? (monthlyFee / (freeCommission - commissionPaid)).toFixed(1) : 0;
    
    return {
      monthlyRevenue,
      commissionPaid,
      netEarnings,
      monthlySavings: savings,
      annualSavings: savings * 12,
      paybackMonths
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">{t('walkerSubscriptionsTitle', language)}</h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            {t('saveCommissions', language)}
          </p>
          {subscription && (
            <Badge className="text-base md:text-lg px-4 md:px-6 py-2 bg-green-500">
              {t('currentPlanLabel', language)}: {subscription.plan_type.toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Earnings Calculator */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 shadow-2xl mb-8 md:mb-12">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-xl md:text-2xl flex items-center gap-2 justify-center">
              <Calculator className="w-6 h-6 md:w-7 md:h-7" />
              {t('calculateEarnings', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8">
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-6">
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
                  className="mb-2"
                />
                <p className="text-xs text-gray-600">5 - 100 passeios</p>
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
                  className="mb-2"
                />
                <p className="text-xs text-gray-600">€10 - €50</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
              {plans.filter(p => !p.comingSoon).map((plan) => {
                const earnings = calculateEarnings(plan.commission, plan.fee);
                return (
                  <div key={plan.type} className={`text-center p-3 md:p-4 bg-white rounded-xl shadow-md border-2 ${
                    plan.popular ? 'border-blue-400' : 'border-gray-200'
                  }`}>
                    <div className="text-xs md:text-sm font-semibold text-gray-600 mb-2">{plan.name}</div>
                    <div className="text-xl md:text-3xl font-bold text-green-600 mb-1">
                      €{earnings.netEarnings.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">{t('netEarnings', language)}</div>
                    {plan.type !== 'free' && (
                      <>
                        <div className="text-base md:text-lg font-bold text-purple-600">
                          +€{earnings.monthlySavings.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-600">{t('monthlySavings', language)}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl">
              <p className="text-center text-sm md:text-base text-gray-800">
                💡 <strong>Com {walksPerMonth} passeios/mês a €{avgWalkPrice}:</strong>
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-center">
                <div>
                  <div className="text-lg md:text-2xl font-bold text-gray-900">
                    €{(walksPerMonth * avgWalkPrice).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">{t('monthlyRevenue', language)}</div>
                </div>
                <div>
                  <div className="text-lg md:text-2xl font-bold text-blue-600">
                    €{calculateEarnings(10, 19).monthlySavings.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">Basic {t('monthlySavings', language)}</div>
                </div>
                <div>
                  <div className="text-lg md:text-2xl font-bold text-purple-600">
                    €{calculateEarnings(5, 39).monthlySavings.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">Premium {t('monthlySavings', language)}</div>
                </div>
                <div>
                  <div className="text-lg md:text-2xl font-bold text-yellow-600">
                    €{calculateEarnings(0, 79).monthlySavings.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600">Pro {t('monthlySavings', language)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const earnings = calculateEarnings(plan.commission, plan.fee);

            return (
              <motion.div
                key={plan.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={plan.type === "elite" ? "lg:col-span-3 max-w-2xl mx-auto w-full" : ""}
              >
                <Card className={`border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden h-full ${
                  plan.popular ? 'ring-4 ring-blue-400 scale-105' : ''
                } ${plan.comingSoon ? 'opacity-90' : ''}`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 md:px-4 py-1 text-xs md:text-sm font-bold z-10">
                      {t('mostPopularBadge', language)}
                    </div>
                  )}
                  {plan.comingSoon && (
                    <div className="absolute top-0 left-0 bg-pink-500 text-white px-3 md:px-4 py-1 text-xs md:text-sm font-bold z-10">
                      {t('comingSoonLabel', language).toUpperCase()}
                    </div>
                  )}
                  <div className={`h-3 bg-gradient-to-r ${plan.color}`} />
                  <CardHeader className="text-center pt-6 md:pt-8">
                    <div className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4`}>
                      <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl mb-2">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-600 mb-3 min-h-[40px] px-2">{plan.subtitle}</p>
                    <div className="text-3xl md:text-4xl font-bold text-gray-900">
                      €{plan.fee}
                      <span className="text-base md:text-lg text-gray-600">/{t('month', language)}</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className={`text-sm ${plan.commission === 0 ? 'bg-green-100 text-green-700 border-green-300' : ''}`}>
                        {plan.commission}% {t('commissionLabel', language)}
                      </Badge>
                    </div>
                    {!plan.comingSoon && plan.type !== 'free' && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <div className="text-lg md:text-2xl font-bold text-green-600">
                          +€{earnings.monthlySavings.toFixed(0)}/mês
                        </div>
                        <div className="text-xs text-gray-600">{t('monthlySavings', language)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          €{earnings.annualSavings.toFixed(0)}/{t('year', language)}
                        </div>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pb-6 md:pb-8">
                    <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6 min-h-[280px] md:min-h-[320px]">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-gray-700">
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 text-white shadow-lg h-10 md:h-12 text-sm md:text-base`}
                      onClick={() => subscribeMutation.mutate(plan)}
                      disabled={subscription?.plan_type === plan.type || subscribeMutation.isPending || plan.comingSoon}
                    >
                      {plan.comingSoon ? t('comingSoonLabel', language) : subscription?.plan_type === plan.type ? t('currentPlanButton', language) : t('subscribeNow', language)}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <Card className="border-0 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl text-center">{t('planComparisonTitle', language)}</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-base">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 md:py-4 px-2 md:px-4 font-semibold">{t('featureLabel', language)}</th>
                    <th className="text-center py-3 md:py-4 px-2 md:px-4 font-semibold">Free</th>
                    <th className="text-center py-3 md:py-4 px-2 md:px-4 font-semibold bg-blue-50">Basic</th>
                    <th className="text-center py-3 md:py-4 px-2 md:px-4 font-semibold">Premium</th>
                    <th className="text-center py-3 md:py-4 px-2 md:px-4 font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 md:py-3 px-2 md:px-4">{t('monthlyFeeLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">€0</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4 bg-blue-50">€19</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">€39</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">€79</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 md:py-3 px-2 md:px-4 font-semibold">{t('commissionLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">15%</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4 bg-blue-50">10%</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">5%</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4 text-green-600 font-bold">0%</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 md:py-3 px-2 md:px-4">{t('bookingsPerMonthLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">{t('upToLabel', language)} 10</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4 bg-blue-50">{t('unlimitedLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">{t('unlimitedLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">{t('unlimitedLabel', language)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 md:py-3 px-2 md:px-4">{t('paymentSpeedLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">5 {t('daysLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4 bg-blue-50">48 {t('hoursLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">{t('instantLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">{t('instantLabel', language)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 md:py-3 px-2 md:px-4">{t('supportLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">{t('emailSupport', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4 bg-blue-50">{t('fastSupport', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">{t('prioritySupport', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">{t('directTeamSupport', language)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 md:py-3 px-2 md:px-4">{t('profilePhotosLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">1 {t('photoLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4 bg-blue-50">5 {t('photosVideosLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">{t('unlimitedLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">{t('unlimitedLabel', language)}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 md:py-3 px-2 md:px-4">{t('specialBadgesLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">-</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4 bg-blue-50">-</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">Top PawCão</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">Pro Badge</td>
                  </tr>
                  <tr>
                    <td className="py-2 md:py-3 px-2 md:px-4">{t('insuranceLabel', language)}</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">-</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4 bg-blue-50">-</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">-</td>
                    <td className="text-center py-2 md:py-3 px-2 md:px-4">✓ {t('includedLabel', language)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Why Subscribe */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 text-center">{t('whySubscribePaid', language)}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-green-600 mb-2">{t('upToLabel', language)} 15%</div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">{t('saveOnCommissionsTitle', language)}</h4>
                <p className="text-xs md:text-sm text-gray-700">{t('commissionRange', language)}</p>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-blue-600 mb-2">10x</div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">{t('moreVisibilityTitle', language)}</h4>
                <p className="text-xs md:text-sm text-gray-700">{t('prioritySearches', language)}</p>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-2">48h → 0h</div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">{t('fasterPaymentsTitle', language)}</h4>
                <p className="text-xs md:text-sm text-gray-700">{t('instantPayments', language)}</p>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-orange-600 mb-2">24/7</div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm md:text-base">{t('betterSupportTitle', language)}</h4>
                <p className="text-xs md:text-sm text-gray-700">{t('priorityWhenNeeded', language)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}