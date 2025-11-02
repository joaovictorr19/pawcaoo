import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
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
      features: [
        "15% commission per booking",
        "€1 transaction fee",
        "Basic profile visibility",
        "Standard support",
        "Manual payments"
      ]
    },
    {
      type: "basic",
      name: "Basic",
      fee: 29,
      commission: 10,
      icon: Check,
      color: "from-blue-500 to-blue-600",
      popular: true,
      features: [
        "10% commission per booking",
        "€1 transaction fee",
        "Priority profile listing",
        "24/7 support",
        "Automatic payments",
        "Marketing tools"
      ]
    },
    {
      type: "premium",
      name: "Premium",
      fee: 49,
      commission: 5,
      icon: Crown,
      color: "from-purple-500 to-purple-600",
      features: [
        "Only 5% commission",
        "No transaction fees",
        "Top profile placement",
        "Premium support",
        "Instant payments",
        "Advanced analytics",
        "Featured walker badge"
      ]
    },
    {
      type: "pro",
      name: "Pro",
      fee: 99,
      commission: 0,
      icon: Crown,
      color: "from-yellow-500 to-yellow-600",
      features: [
        "0% commission - Keep 100%!",
        "No transaction fees",
        "VIP profile placement",
        "Dedicated account manager",
        "Instant payments",
        "Full analytics suite",
        "Custom branding",
        "Insurance included"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Walker Subscription Plans</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the plan that fits your business. Save on commissions and unlock premium features.
          </p>
          {subscription && (
            <Badge className="mt-4 text-lg px-6 py-2 bg-green-500">
              Current Plan: {subscription.plan_type.toUpperCase()}
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden ${
                plan.popular ? 'ring-4 ring-blue-400' : ''
              }`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-bold">
                    POPULAR
                  </div>
                )}
                <div className={`h-3 bg-gradient-to-r ${plan.color}`} />
                <CardHeader className="text-center pt-8">
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-gray-900">
                    €{plan.fee}
                    <span className="text-lg text-gray-600">/month</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-sm">
                      {plan.commission}% commission
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-8">
                  <ul className="space-y-3 mb-6">
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
                    disabled={subscription?.plan_type === plan.type || subscribeMutation.isPending}
                  >
                    {subscription?.plan_type === plan.type ? 'Current Plan' : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="mt-12 border-2 border-green-200 bg-green-50">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Subscribe?</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">💰 Save Money</h4>
                <p className="text-gray-700">Reduce commissions from 15% to as low as 0%</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">⚡ Get More Bookings</h4>
                <p className="text-gray-700">Premium placement means more visibility</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Professional Tools</h4>
                <p className="text-gray-700">Access advanced features and analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}