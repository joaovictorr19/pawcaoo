import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Crown, Zap, Star, Sparkles, Shield, Heart, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function OwnerSubscriptions() {
  const queryClient = useQueryClient();

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
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      icon: Zap,
      color: "from-gray-500 to-gray-600",
      subtitle: "Perfect to get started",
      bookingDiscount: 0,
      pointsMultiplier: 1,
      freeCancellations: 0,
      priorityBooking: false,
      freeInsurance: false,
      prioritySupport: false,
      exclusiveWalkers: false,
      features: [
        "Standard booking access",
        "Earn 10 PawPoints per €1",
        "Basic customer support",
        "Standard cancellation policy",
        "Access to all walkers & trainers",
        "Pay-per-use insurance",
        "Regular booking slots"
      ]
    },
    {
      type: "basic",
      name: "Basic",
      monthlyPrice: 9.99,
      annualPrice: 99.99,
      icon: Heart,
      color: "from-blue-500 to-blue-600",
      popular: true,
      subtitle: "Great for regular dog owners",
      bookingDiscount: 10,
      pointsMultiplier: 1.5,
      freeCancellations: 2,
      priorityBooking: false,
      freeInsurance: false,
      prioritySupport: false,
      exclusiveWalkers: false,
      features: [
        "10% discount on all bookings",
        "1.5x PawPoints (15 points per €1)",
        "2 free cancellations/month",
        "Extended booking window",
        "24h customer support",
        "Monthly savings report",
        "Priority in walker ratings"
      ]
    },
    {
      type: "premium",
      name: "Premium",
      monthlyPrice: 19.99,
      annualPrice: 199.99,
      icon: Star,
      color: "from-purple-500 to-purple-600",
      subtitle: "For frequent users who want more",
      bookingDiscount: 15,
      pointsMultiplier: 2,
      freeCancellations: 5,
      priorityBooking: true,
      freeInsurance: true,
      prioritySupport: true,
      exclusiveWalkers: false,
      features: [
        "15% discount on all bookings",
        "2x PawPoints (20 points per €1)",
        "5 free cancellations/month",
        "Priority booking access",
        "Free walk insurance included",
        "Priority 24/7 support",
        "Exclusive monthly rewards",
        "Early access to new features"
      ]
    },
    {
      type: "vip",
      name: "VIP",
      monthlyPrice: 39.99,
      annualPrice: 399.99,
      icon: Crown,
      color: "from-yellow-500 to-yellow-600",
      subtitle: "Ultimate experience for dog lovers",
      bookingDiscount: 25,
      pointsMultiplier: 3,
      freeCancellations: 999,
      priorityBooking: true,
      freeInsurance: true,
      prioritySupport: true,
      exclusiveWalkers: true,
      features: [
        "25% discount on all bookings",
        "3x PawPoints (30 points per €1)",
        "Unlimited free cancellations",
        "VIP priority booking",
        "Premium insurance included",
        "Dedicated account manager",
        "Access to exclusive VIP walkers",
        "Free partner products monthly",
        "VIP events & meetups",
        "Personal dog concierge service"
      ]
    }
  ];

  const [billingCycle, setBillingCycle] = React.useState("monthly");

  const getPrice = (plan) => {
    if (plan.type === "free") return "Free";
    const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
    const period = billingCycle === "monthly" ? "/month" : "/year";
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
            PawCão Owner Membership
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Save money, earn more points, and get exclusive benefits with our membership plans
          </p>
          {subscription && (
            <Badge className="text-lg px-6 py-2 bg-green-500">
              Current Plan: {subscription.plan_type.toUpperCase()} ({subscription.billing_cycle})
            </Badge>
          )}
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <Tabs value={billingCycle} onValueChange={setBillingCycle} className="w-auto">
            <TabsList className="bg-white border-2 border-green-200 shadow-lg p-2">
              <TabsTrigger value="monthly" className="text-base px-6 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="annual" className="text-base px-6 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Annual
                <Badge className="ml-2 bg-orange-500 text-white">Save 17%</Badge>
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
                    <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-bold z-10">
                      MOST POPULAR
                    </div>
                  )}
                  <div className={`h-3 bg-gradient-to-r ${plan.color}`} />
                  <CardHeader className="text-center pt-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <p className="text-sm text-gray-600 mb-3 min-h-[40px]">{plan.subtitle}</p>
                    <div className="text-4xl font-bold text-gray-900">
                      {getPrice(plan)}
                    </div>
                    {savings && (
                      <Badge className="mt-2 bg-green-500 text-white">
                        Save €{savings.amount.toFixed(2)} ({savings.percentage}%)
                      </Badge>
                    )}
                    {plan.bookingDiscount > 0 && (
                      <Badge variant="outline" className="mt-2 text-sm bg-green-50 text-green-700 border-green-300">
                        {plan.bookingDiscount}% off all bookings
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="pb-8">
                    <ul className="space-y-3 mb-6 min-h-[300px]">
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
                      {subscription?.plan_type === plan.type ? 'Current Plan' : plan.type === 'free' ? 'Keep Free' : 'Subscribe Now'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Savings Calculator */}
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50 shadow-xl mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              💰 See How Much You Could Save
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-md">
                <div className="text-4xl font-bold text-blue-600 mb-2">€480</div>
                <p className="text-gray-700 font-semibold mb-1">Average Annual Spending</p>
                <p className="text-sm text-gray-600">On dog walking services</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-md border-2 border-purple-300">
                <div className="text-4xl font-bold text-purple-600 mb-2">€72</div>
                <p className="text-gray-700 font-semibold mb-1">Premium Member Saves</p>
                <p className="text-sm text-gray-600">15% discount on all bookings</p>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-md border-2 border-yellow-300">
                <div className="text-4xl font-bold text-yellow-600 mb-2">€120</div>
                <p className="text-gray-700 font-semibold mb-1">VIP Member Saves</p>
                <p className="text-sm text-gray-600">25% discount + extra perks</p>
              </div>
            </div>
            <p className="text-center text-gray-700 mt-6 text-lg">
              💡 <strong>Premium plan pays for itself after just 3 bookings!</strong>
            </p>
          </CardContent>
        </Card>

        {/* Benefits Overview */}
        <Card className="border-0 shadow-2xl mb-8">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardTitle className="text-2xl text-center">Why Become a Member?</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Instant Savings</h4>
                <p className="text-sm text-gray-700">Save up to 25% on every booking</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">More PawPoints</h4>
                <p className="text-sm text-gray-700">Earn up to 3x points on purchases</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Free Insurance</h4>
                <p className="text-sm text-gray-700">Premium+ includes walk insurance</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">VIP Treatment</h4>
                <p className="text-sm text-gray-700">Priority booking & support</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Table */}
        <Card className="border-0 shadow-2xl">
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
                    <th className="text-center py-4 px-4 font-semibold bg-yellow-50">VIP</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-semibold">Booking Discount</td>
                    <td className="text-center py-3 px-4">0%</td>
                    <td className="text-center py-3 px-4 bg-blue-50">10%</td>
                    <td className="text-center py-3 px-4">15%</td>
                    <td className="text-center py-3 px-4 bg-yellow-50 text-green-600 font-bold">25%</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">PawPoints Multiplier</td>
                    <td className="text-center py-3 px-4">1x</td>
                    <td className="text-center py-3 px-4 bg-blue-50">1.5x</td>
                    <td className="text-center py-3 px-4">2x</td>
                    <td className="text-center py-3 px-4 bg-yellow-50 font-bold">3x</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Free Cancellations/Month</td>
                    <td className="text-center py-3 px-4">0</td>
                    <td className="text-center py-3 px-4 bg-blue-50">2</td>
                    <td className="text-center py-3 px-4">5</td>
                    <td className="text-center py-3 px-4 bg-yellow-50 text-green-600 font-bold">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Priority Booking</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-blue-50">-</td>
                    <td className="text-center py-3 px-4">✓</td>
                    <td className="text-center py-3 px-4 bg-yellow-50">✓</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Free Insurance</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-blue-50">-</td>
                    <td className="text-center py-3 px-4">✓</td>
                    <td className="text-center py-3 px-4 bg-yellow-50">✓ Premium</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4">Priority Support</td>
                    <td className="text-center py-3 px-4">-</td>
                    <td className="text-center py-3 px-4 bg-blue-50">-</td>
                    <td className="text-center py-3 px-4">✓ 24/7</td>
                    <td className="text-center py-3 px-4 bg-yellow-50">✓ Dedicated</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4">Exclusive VIP Walkers</td>
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