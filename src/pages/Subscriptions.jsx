import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Subscriptions() {
  const queryClient = useQueryClient();

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
      subtitle: "Ideal for those who are starting out",
      features: [
        "€0 per month",
        "15% commission per booking",
        "Up to 10 bookings per month",
        "Basic profile with photo",
        "Simple description",
        "Manual payment (up to 5 days after service)",
        "Standard support by email",
        "Perfect to try the platform"
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
      subtitle: "Designed for those who already have regular customers",
      features: [
        "Only 10% commission",
        "Unlimited bookings",
        "Complete profile with up to 5 photos/videos",
        "Prominent local campaigns",
        "Fast support (response within 24h)",
        "Automatic payments within 48h",
        "Professional growth tools"
      ]
    },
    {
      type: "premium",
      name: "Premium",
      fee: 39,
      commission: 5,
      icon: Star,
      color: "from-purple-500 to-purple-600",
      subtitle: "Made for active professionals who want more visibility",
      features: [
        "Only 5% commission",
        "Priority in search results",
        '"Top PawCão" seal',
        "Instant payments",
        "Priority support (AI + human chat)",
        "Profile with videos & detailed evaluations",
        "Performance statistics",
        "Verified badge"
      ]
    },
    {
      type: "pro",
      name: "Pro",
      fee: 79,
      commission: 0,
      icon: Crown,
      color: "from-yellow-500 to-yellow-600",
      subtitle: "Intended for those who live in the pet world",
      features: [
        "0% commission - Keep 100%!",
        "VIP profile on homepage",
        "Civil liability insurance included",
        "Access to exclusive events & partnerships",
        "Direct support with PawCão team",
        'Golden "Professional Pro" badge',
        "Affiliate program - earn bonuses",
        "Premium brand core member"
      ]
    },
    {
      type: "elite",
      name: "Elite Partner",
      fee: 149,
      commission: 0,
      icon: Sparkles,
      color: "from-pink-500 to-pink-600",
      subtitle: "Made for training schools, pet shops and companies",
      comingSoon: true,
      features: [
        "0% commission",
        "Personalized page within the app",
        "Free advertising campaigns",
        "Team management tools",
        "Dedicated 24-hour support",
        "Official brand showcase",
        "Corporate partnership features",
        "Multi-location management"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">PawCão Subscription Plans</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your business. Save on commissions and unlock premium features.
          </p>
          {subscription && (
            <Badge className="mt-4 text-lg px-6 py-2 bg-green-500">
              Current Plan: {subscription.plan_type.toUpperCase()}
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={plan.type === "elite" ? "lg:col-span-3 max-w-2xl mx-auto w-full" : ""}
            >
              <Card className={`border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden h-full ${
                plan.popular ? 'ring-4 ring-blue-400' : ''
              } ${plan.comingSoon ? 'opacity-90' : ''}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-bold z-10">
                    MOST POPULAR
                  </div>
                )}
                {plan.comingSoon && (
                  <div className="absolute top-0 left-0 bg-pink-500 text-white px-4 py-1 text-sm font-bold z-10">
                    COMING SOON
                  </div>
                )}
                <div className={`h-3 bg-gradient-to-r ${plan.color}`} />
                <CardHeader className="text-center pt-8">
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-600 mb-3 min-h-[40px]">{plan.subtitle}</p>
                  <div className="text-4xl font-bold text-gray-900">
                    €{plan.fee}
                    <span className="text-lg text-gray-600">/month</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className={`text-sm ${plan.commission === 0 ? 'bg-green-100 text-green-700 border-green-300' : ''}`}>
                      {plan.commission}% commission
                    </Badge>
                  </div>
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
                    onClick={() => subscribeMutation.mutate(plan)}
                    disabled={subscription?.plan_type === plan.type || subscribeMutation.isPending || plan.comingSoon}
                  >
                    {plan.comingSoon ? 'Coming Soon' : subscription?.plan_type === plan.type ? 'Current Plan' : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="border-0 shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Plan Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold">Feature</th>
                    <th className="text-center py-4 px-4 font-semibold">Free</th>
                    <th className="text-center py-4 px-4 font-semibold bg-blue-50">Basic</th>
                    <th className="text-center py-4 px-4 font-semibold">Premium</th>
                    <th className="text-center py-4 px-4 font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Monthly Fee</td>
                    <td className="text-center py-3 px-4">€0</td>
                    <td className="text-center py-3 px-4 bg-blue-50">€19</td>
                    <td className="text-center py-3 px-4">€39</td>
                    <td className="text-center py-3 px-4">€79</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-semibold">Commission</td>
                    <td className="text-center py-3 px-4">15%</td>
                    <td className="text-center py-3 px-4 bg-blue-50">10%</td>
                    <td className="text-center py-3 px-4">5%</td>
                    <td className="text-center py-3 px-4 text-green-600 font-bold">0%</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Bookings/Month</td>
                    <td className="text-center py-3 px-4">Up to 10</td>
                    <td className="text-center py-3 px-4 bg-blue-50">Unlimited</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Payment Speed</td>
                    <td className="text-center py-3 px-4">5 days</td>
                    <td className="text-center py-3 px-4 bg-blue-50">48 hours</td>
                    <td className="text-center py-3 px-4">Instant</td>
                    <td className="text-center py-3 px-4">Instant</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Support</td>
                    <td className="text-center py-3 px-4">Email</td>
                    <td className="text-center py-3 px-4 bg-blue-50">24h</td>
                    <td className="text-center py-3 px-4">Priority</td>
                    <td className="text-center py-3 px-4">Direct Team</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Profile Photos/Videos</td>
                    <td className="text-center py-3 px-4">1 photo</td>
                    <td className="text-center py-3 px-4 bg-blue-50">5 photos/videos</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                    <td className="text-center py-3 px-4">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Special Badges</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-blue-50">-</td>
                    <td className="text-center py-3 px-4">Top PawCão</td>
                    <td className="text-center py-3 px-4">Pro Badge</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Insurance</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-blue-50">-</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4">✓ Included</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Why Subscribe to a Paid Plan?</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">Up to 15%</div>
                <h4 className="font-semibold text-gray-900 mb-2">Save on Commissions</h4>
                <p className="text-sm text-gray-700">From 15% to 0% commission</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">10x</div>
                <h4 className="font-semibold text-gray-900 mb-2">More Visibility</h4>
                <p className="text-sm text-gray-700">Priority placement in searches</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">48h → 0h</div>
                <h4 className="font-semibold text-gray-900 mb-2">Faster Payments</h4>
                <p className="text-sm text-gray-700">Get paid instantly</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                <h4 className="font-semibold text-gray-900 mb-2">Better Support</h4>
                <p className="text-sm text-gray-700">Priority assistance when you need it</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}