
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Trophy, Star, TrendingUp, Award, Zap, Sparkles, Crown, Target } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function LoyaltyRewards() {
  const queryClient = useQueryClient();
  const [selectedReward, setSelectedReward] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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
        total_redeemed: 0 // Added this line as per the instructions
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
      // Create redemption transaction
      await base44.entities.PointsTransaction.create({
        user_email: user?.email,
        transaction_type: 'redeemed',
        points_amount: -reward.points,
        description: `Redeemed: ${reward.discount}`,
        balance_after: loyaltyPoints.points_balance - reward.points
      });

      // Update loyalty points
      await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
        points_balance: loyaltyPoints.points_balance - reward.points,
        total_redeemed: loyaltyPoints.total_redeemed + reward.points,
        lifetime_redemptions: (loyaltyPoints.lifetime_redemptions || 0) + 1
      });

      // Check for achievements
      checkAchievements(loyaltyPoints.lifetime_redemptions + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyPoints'] });
      queryClient.invalidateQueries({ queryKey: ['pointsTransactions'] });
      toast.success("Reward redeemed successfully!");
      setSelectedReward(null);
    },
  });

  const checkAchievements = async (redemptions) => {
    const newAchievements = [];
    const existingIds = loyaltyPoints.achievements?.map(a => a.achievement_id) || [];

    // First Redemption
    if (redemptions === 1 && !existingIds.includes('first_redemption')) {
      newAchievements.push({
        achievement_id: 'first_redemption',
        name: 'First Reward',
        description: 'Redeemed your first reward',
        icon: '🎁',
        earned_date: new Date().toISOString()
      });
    }

    // Frequent Redeemer
    if (redemptions >= 5 && !existingIds.includes('frequent_redeemer')) {
      newAchievements.push({
        achievement_id: 'frequent_redeemer',
        name: 'Frequent Redeemer',
        description: 'Redeemed 5+ rewards',
        icon: '⭐',
        earned_date: new Date().toISOString()
      });
    }

    // Super Saver
    if (redemptions >= 10 && !existingIds.includes('super_saver')) {
      newAchievements.push({
        achievement_id: 'super_saver',
        name: 'Super Saver',
        description: 'Redeemed 10+ rewards',
        icon: '💎',
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
    // Regular discounts
    { id: 1, category: "walk", points: 100, discount: "€5 off", description: "Your next walk booking", icon: "🐕" },
    { id: 2, category: "walk", points: 250, discount: "€15 off", description: "Any walk service", icon: "🦮" },
    { id: 3, category: "walk", points: 500, discount: "€35 off", description: "Premium walk service", icon: "🌟" },
    { id: 4, category: "walk", points: 1000, discount: "€80 off", description: "Any walk booking", icon: "💫" },
    
    // NEW: Training discounts
    { id: 5, category: "training", points: 150, discount: "€10 off", description: "Single training session", icon: "🎓", isNew: true },
    { id: 6, category: "training", points: 400, discount: "€30 off", description: "5-session training package", icon: "📚", isNew: true },
    { id: 7, category: "training", points: 750, discount: "€60 off", description: "10-session training package", icon: "🏆", isNew: true },
    
    // NEW: Premium services
    { id: 8, category: "premium", points: 200, discount: "Free", description: "GPS tracking upgrade", icon: "📍", isNew: true },
    { id: 9, category: "premium", points: 300, discount: "Free", description: "Walk photo updates", icon: "📸", isNew: true },
    { id: 10, category: "premium", points: 600, discount: "€50 off", description: "Dog sitting service", icon: "🏠", isNew: true },
    { id: 11, category: "premium", points: 1500, discount: "Free", description: "1-month premium membership", icon: "👑", isNew: true },
  ];

  const rewardCategories = [
    { name: "All Rewards", value: "all", icon: Gift },
    { name: "Walk Discounts", value: "walk", icon: Zap },
    { name: "Training Discounts", value: "training", icon: Award },
    { name: "Premium Services", value: "premium", icon: Crown },
  ];

  const [activeCategory, setActiveCategory] = useState("all");

  const filteredRewards = activeCategory === "all" 
    ? allRewards 
    : allRewards.filter(r => r.category === activeCategory);

  const progressToNext = nextTier 
    ? ((loyaltyPoints?.total_earned || 0) / nextTier.min) * 100
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Gift className="w-10 h-10 text-purple-600" />
            PawPoints Loyalty Rewards
          </h1>
          <p className="text-gray-600 text-lg">Earn points with every service and redeem for amazing rewards</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 rounded-2xl mb-8" />
        ) : (
          <>
            {/* Points Balance Card with Enhanced Progress */}
            <Card className={`border-0 shadow-2xl mb-8 bg-gradient-to-r ${currentTier.color} text-white overflow-hidden relative`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
              
              <CardContent className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-white/80 text-lg mb-2">Your Points Balance</p>
                    <p className="text-6xl font-bold mb-4">{loyaltyPoints?.points_balance || 0}</p>
                    <Badge className="bg-white/20 text-white text-lg px-4 py-2">
                      {currentTier.icon} {currentTier.name} Tier
                    </Badge>
                  </div>
                  <div className="text-right">
                    <Trophy className="w-20 h-20 text-white/30 mb-4" />
                    <p className="text-white/80">Total Earned</p>
                    <p className="text-3xl font-bold">{loyaltyPoints?.total_earned || 0}</p>
                  </div>
                </div>

                {/* Tier Benefits */}
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold mb-2 text-white">Your Benefits:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentTier.benefits.map((benefit, idx) => (
                      <Badge key={idx} className="bg-white/20 text-white">
                        ✓ {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Enhanced Progress Bar */}
                {nextTier && (
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Progress to {nextTier.name} {nextTier.icon}</span>
                      <span className="font-bold">{loyaltyPoints?.total_earned || 0} / {nextTier.min} points</span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-white/20 rounded-full h-4 mb-2">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, progressToNext)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="bg-white h-4 rounded-full relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                        </motion.div>
                      </div>
                      <p className="text-white/80 text-sm">
                        {nextTier.min - (loyaltyPoints?.total_earned || 0)} points until next tier!
                      </p>
                    </div>
                  </div>
                )}

                {/* Mini Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{loyaltyPoints?.lifetime_bookings || 0}</p>
                    <p className="text-white/80 text-sm">Total Bookings</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold">{loyaltyPoints?.lifetime_redemptions || 0}</p>
                    <p className="text-white/80 text-sm">Rewards Redeemed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NEW: Achievements Section */}
            {loyaltyPoints?.achievements && loyaltyPoints.achievements.length > 0 && (
              <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl mb-8">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    Your Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {loyaltyPoints.achievements.map((achievement, idx) => (
                      <motion.div
                        key={achievement.achievement_id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-xl transition-all"
                      >
                        <div className="text-5xl mb-2">{achievement.icon}</div>
                        <h4 className="font-bold text-gray-900 mb-1">{achievement.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                        <p className="text-xs text-purple-600">
                          {format(new Date(achievement.earned_date), "MMM d, yyyy")}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Achievements to Unlock */}
            <Card className="border-2 border-gray-200 bg-white shadow-xl mb-8">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Target className="w-6 h-6 text-gray-600" />
                  Achievements to Unlock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'first_redemption', name: 'First Reward', desc: 'Redeem your first reward', icon: '🎁', requirement: '1 redemption' },
                    { id: 'frequent_redeemer', name: 'Frequent Redeemer', desc: 'Redeem 5+ rewards', icon: '⭐', requirement: '5 redemptions' },
                    { id: 'super_saver', name: 'Super Saver', desc: 'Redeem 10+ rewards', icon: '💎', requirement: '10 redemptions' },
                    { id: 'platinum_member', name: 'Platinum Member', desc: 'Reach Platinum tier', icon: '👑', requirement: '2500 points earned' },
                  ].map((achievement) => {
                    const isUnlocked = loyaltyPoints?.achievements?.some(a => a.achievement_id === achievement.id);
                    return (
                      <div
                        key={achievement.id}
                        className={`rounded-xl p-4 text-center transition-all ${
                          isUnlocked 
                            ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300' 
                            : 'bg-gray-100 opacity-60'
                        }`}
                      >
                        <div className={`text-5xl mb-2 ${isUnlocked ? '' : 'grayscale'}`}>
                          {achievement.icon}
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">{achievement.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{achievement.desc}</p>
                        <Badge variant="outline" className="text-xs">
                          {isUnlocked ? '✓ Unlocked' : achievement.requirement}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              {rewardCategories.map((category) => (
                <Button
                  key={category.value}
                  variant={activeCategory === category.value ? "default" : "outline"}
                  onClick={() => setActiveCategory(category.value)}
                  className={activeCategory === category.value ? "bg-purple-600" : ""}
                >
                  <category.icon className="w-4 h-4 mr-2" />
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Rewards Catalog */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Redeem Your Points</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {filteredRewards.map((reward, index) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all h-full relative overflow-hidden">
                    {reward.isNew && (
                      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-red-500 text-white z-10">
                        NEW
                      </Badge>
                    )}
                    <CardHeader className="text-center">
                      <div className="text-6xl mb-4">{reward.icon}</div>
                      <CardTitle className="text-2xl font-bold text-purple-600">
                        {reward.discount}
                      </CardTitle>
                      <p className="text-gray-600">{reward.description}</p>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-lg font-semibold mb-4">{reward.points} points</p>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        disabled={!loyaltyPoints || loyaltyPoints.points_balance < reward.points || redeemMutation.isPending}
                        onClick={() => redeemMutation.mutate(reward)}
                      >
                        {loyaltyPoints && loyaltyPoints.points_balance >= reward.points ? 'Redeem Now' : 'Need more points'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* How to Earn Points */}
            <Card className="border-2 border-purple-200 bg-purple-50 mb-8">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  How to Earn PawPoints
                </h3>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">10-20</div>
                    <p className="text-gray-700 font-semibold mb-1">Per €1 spent</p>
                    <p className="text-sm text-gray-600">On any service</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">50</div>
                    <p className="text-gray-700 font-semibold mb-1">Leave a review</p>
                    <p className="text-sm text-gray-600">After each booking</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">100</div>
                    <p className="text-gray-700 font-semibold mb-1">Refer a friend</p>
                    <p className="text-sm text-gray-600">First booking bonus</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">200</div>
                    <p className="text-gray-700 font-semibold mb-1">Monthly bonus</p>
                    <p className="text-sm text-gray-600">For active members</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Points History</h2>
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No transactions yet</p>
                    <p className="text-sm text-gray-500">Start booking services to earn points!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-semibold text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(transaction.created_date), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            transaction.transaction_type === 'earned' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.transaction_type === 'earned' ? '+' : '-'}{Math.abs(transaction.points_amount)}
                          </p>
                          <p className="text-sm text-gray-600">Balance: {transaction.balance_after}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
