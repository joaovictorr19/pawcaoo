import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Trophy, Star, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoyaltyRewards() {
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
      return points[0] || { points_balance: 0, total_earned: 0, tier: 'bronze' };
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

  const tiers = [
    { name: "Bronze", min: 0, color: "from-orange-400 to-orange-600", icon: "🥉" },
    { name: "Silver", min: 500, color: "from-gray-300 to-gray-500", icon: "🥈" },
    { name: "Gold", min: 1000, color: "from-yellow-400 to-yellow-600", icon: "🥇" },
    { name: "Platinum", min: 2500, color: "from-purple-400 to-purple-600", icon: "💎" }
  ];

  const currentTier = tiers.find(t => t.name.toLowerCase() === loyaltyPoints?.tier) || tiers[0];
  const nextTier = tiers[tiers.findIndex(t => t.name === currentTier.name) + 1];

  const rewards = [
    { points: 100, discount: "€5 off", description: "Your next booking" },
    { points: 250, discount: "€15 off", description: "Any service" },
    { points: 500, discount: "€35 off", description: "Premium service" },
    { points: 1000, discount: "€80 off", description: "Any booking" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Gift className="w-10 h-10 text-purple-600" />
            Loyalty Rewards
          </h1>
          <p className="text-gray-600 text-lg">Earn points with every walk and redeem for discounts</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-64 rounded-2xl mb-8" />
        ) : (
          <>
            {/* Points Balance Card */}
            <Card className={`border-0 shadow-2xl mb-8 bg-gradient-to-r ${currentTier.color} text-white overflow-hidden`}>
              <CardContent className="p-8">
                <div className="flex justify-between items-start">
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
                
                {nextTier && (
                  <div className="mt-6 bg-white/10 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span>Progress to {nextTier.name}</span>
                      <span>{loyaltyPoints?.total_earned || 0} / {nextTier.min} points</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                      <div 
                        className="bg-white h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((loyaltyPoints?.total_earned || 0) / nextTier.min) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rewards Catalog */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Redeem Your Points</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {rewards.map((reward, index) => (
                <Card key={index} className="border-0 shadow-xl hover:shadow-2xl transition-all">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-purple-600">
                      {reward.discount}
                    </CardTitle>
                    <p className="text-gray-600">{reward.description}</p>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-lg font-semibold mb-4">{reward.points} points</p>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!loyaltyPoints || loyaltyPoints.points_balance < reward.points}
                    >
                      {loyaltyPoints && loyaltyPoints.points_balance >= reward.points ? 'Redeem' : 'Need more points'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* How to Earn Points */}
            <Card className="border-2 border-purple-200 bg-purple-50 mb-8">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  How to Earn Points
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">10 points</div>
                    <p className="text-gray-700">Per €1 spent on walks</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">50 points</div>
                    <p className="text-gray-700">Leave a review</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">100 points</div>
                    <p className="text-gray-700">Refer a friend</p>
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
                    <p className="text-sm text-gray-500">Start booking walks to earn points!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(transaction.created_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            transaction.transaction_type === 'earned' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.transaction_type === 'earned' ? '+' : '-'}{transaction.points_amount}
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