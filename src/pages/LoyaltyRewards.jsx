import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, TrendingUp, Sparkles, Target } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import RewardCard from "../components/loyalty/RewardCard";
import TierProgressCard from "../components/loyalty/TierProgressCard";

export default function LoyaltyRewards() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

  const { data: loyaltyPoints, isLoading } = useQuery({
    queryKey: ['loyaltyPoints'],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user?.email
      });
      return points[0] || { 
        points_balance: 0, 
        total_earned: 0, 
        tier: 'bronze',
        achievements: [],
        lifetime_bookings: 0,
        lifetime_redemptions: 0,
        total_redeemed: 0
      };
    },
    enabled: !!user,
  });

  const { data: transactions } = useQuery({
    queryKey: ['pointsTransactions'],
    queryFn: () => base44.entities.PointsTransaction.filter(
      { user_email: user?.email },
      '-created_date'
    ),
    enabled: !!user,
    initialData: [],
  });

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      await base44.entities.PointsTransaction.create({
        user_email: user?.email,
        transaction_type: 'redeemed',
        points_amount: -reward.points,
        description: `Redeemed: ${reward.discount}`,
        balance_after: loyaltyPoints.points_balance - reward.points
      });

      await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
        points_balance: loyaltyPoints.points_balance - reward.points,
        total_redeemed: loyaltyPoints.total_redeemed + reward.points,
        lifetime_redemptions: (loyaltyPoints.lifetime_redemptions || 0) + 1
      });

      checkAchievements(loyaltyPoints.lifetime_redemptions + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyPoints'] });
      queryClient.invalidateQueries({ queryKey: ['pointsTransactions'] });
      toast.success("Reward redeemed successfully!");
    },
  });

  const checkAchievements = async (redemptions) => {
    const newAchievements = [];
    const existingIds = loyaltyPoints.achievements?.map(a => a.achievement_id) || [];

    if (redemptions === 1 && !existingIds.includes('first_redemption')) {
      newAchievements.push({
        achievement_id: 'first_redemption',
        name: 'First Reward',
        description: 'Redeemed your first reward',
        icon: '🎁',
        earned_date: new Date().toISOString()
      });
    }

    if (redemptions >= 5 && !existingIds.includes('frequent_redeemer')) {
      newAchievements.push({
        achievement_id: 'frequent_redeemer',
        name: 'Frequent Redeemer',
        description: 'Redeemed 5+ rewards',
        icon: '⭐',
        earned_date: new Date().toISOString()
      });
    }

    if (newAchievements.length > 0) {
      await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
        achievements: [...(loyaltyPoints.achievements || []), ...newAchievements]
      });
      toast.success(`🎉 Achievement unlocked: ${newAchievements[0].name}!`);
    }
  };

  const tiers = [
    { name: "Bronze", min: 0, color: "from-orange-400 to-orange-600", icon: "🥉", benefits: ["10 points per €1", "Basic rewards"] },
    { name: "Silver", min: 500, color: "from-gray-300 to-gray-500", icon: "🥈", benefits: ["12 points per €1", "Priority support"] },
    { name: "Gold", min: 1000, color: "from-yellow-400 to-yellow-600", icon: "🥇", benefits: ["15 points per €1", "Exclusive deals"] },
    { name: "Platinum", min: 2500, color: "from-purple-400 to-purple-600", icon: "💎", benefits: ["20 points per €1", "VIP perks"] }
  ];

  const currentTier = tiers.find(t => t.name.toLowerCase() === loyaltyPoints?.tier) || tiers[0];
  const currentTierIndex = tiers.findIndex(t => t.name === currentTier.name);
  const nextTier = tiers[currentTierIndex + 1];

  const allRewards = [
    { id: 1, category: "walk", points: 100, discount: "€5 off", description: "Your next walk", icon: "🐕" },
    { id: 2, category: "walk", points: 250, discount: "€15 off", description: "Any walk service", icon: "🦮" },
    { id: 3, category: "walk", points: 500, discount: "€35 off", description: "Premium walk", icon: "🌟" },
    { id: 5, category: "training", points: 150, discount: "€10 off", description: "Training session", icon: "🎓" },
    { id: 6, category: "training", points: 400, discount: "€30 off", description: "5-session package", icon: "📚" },
    { id: 8, category: "premium", points: 200, discount: "Free", description: "GPS tracking", icon: "📍" },
    { id: 9, category: "premium", points: 300, discount: "Free", description: "Photo updates", icon: "📸" },
  ];

  const filteredRewards = activeCategory === "all" 
    ? allRewards 
    : allRewards.filter(r => r.category === activeCategory);

  const progressToNext = nextTier 
    ? ((loyaltyPoints?.total_earned || 0) / nextTier.min) * 100
    : 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
        <Skeleton className="h-48 md:h-64 rounded-2xl mb-6 md:mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 md:h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2 md:gap-3">
            <Gift className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
            PawPoints Rewards
          </h1>
          <p className="text-sm md:text-lg text-gray-600">Earn points with every service</p>
        </div>

        <TierProgressCard 
          currentTier={currentTier}
          nextTier={nextTier}
          loyaltyPoints={loyaltyPoints}
          progressToNext={progressToNext}
        />

        {/* Category Filters - Mobile Optimized */}
        <div className="flex overflow-x-auto gap-2 md:gap-3 mb-4 md:mb-6 pb-2 scrollbar-hide">
          {["all", "walk", "training", "premium"].map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              onClick={() => setActiveCategory(cat)}
              className={`${activeCategory === cat ? "bg-purple-600" : ""} whitespace-nowrap text-sm md:text-base h-9 md:h-10`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>

        {/* Rewards Grid - Mobile Optimized */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Redeem Your Points</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          {filteredRewards.map((reward, index) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              index={index}
              userPoints={loyaltyPoints?.points_balance || 0}
              onRedeem={redeemMutation.mutate}
              isRedeeming={redeemMutation.isPending}
            />
          ))}
        </div>

        {/* How to Earn - Mobile Optimized */}
        <Card className="border-2 border-purple-200 bg-purple-50 mb-6 md:mb-8">
          <CardContent className="p-4 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              How to Earn Points
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">10-20</div>
                <p className="text-xs md:text-sm text-gray-700 font-semibold">Per €1 spent</p>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">50</div>
                <p className="text-xs md:text-sm text-gray-700 font-semibold">Leave review</p>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">100</div>
                <p className="text-xs md:text-sm text-gray-700 font-semibold">Refer friend</p>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">200</div>
                <p className="text-xs md:text-sm text-gray-700 font-semibold">Monthly bonus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History - Mobile Optimized */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Points History</h2>
        <Card className="border-0 shadow-xl">
          <CardContent className="p-3 md:p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <Gift className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-gray-600">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center p-3 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm md:text-base font-semibold text-gray-900 truncate">{transaction.description}</p>
                      <p className="text-xs md:text-sm text-gray-600">
                        {format(new Date(transaction.created_date), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className={`text-lg md:text-2xl font-bold ${
                        transaction.transaction_type === 'earned' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'earned' ? '+' : '-'}{Math.abs(transaction.points_amount)}
                      </p>
                      <p className="text-xs md:text-sm text-gray-600">Bal: {transaction.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}