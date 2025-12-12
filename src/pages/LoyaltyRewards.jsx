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
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      if (!user?.email) {
        return { 
          points_balance: 0, 
          total_earned: 0, 
          tier: 'bronze',
          achievements: [],
          lifetime_bookings: 0,
          lifetime_redemptions: 0,
          total_redeemed: 0
        };
      }
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user.email
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
    enabled: !!user?.email,
    staleTime: 0,
  });

  const { data: transactions } = useQuery({
    queryKey: ['pointsTransactions', user?.email],
    queryFn: () => base44.entities.PointsTransaction.filter(
      { user_email: user?.email },
      '-created_date'
    ),
    enabled: !!user?.email,
    initialData: [],
  });

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      // Aplicar desconto do tier
      const tierDiscount = currentTier.discount || 0;
      const finalPoints = Math.round(reward.points * (1 - tierDiscount / 100));
      
      // Criar código único de resgate
      const redemptionCode = `PW${Date.now().toString(36).toUpperCase()}`;
      
      // Registar transação de pontos
      await base44.entities.PointsTransaction.create({
        user_email: user?.email,
        transaction_type: 'redeemed',
        points_amount: -finalPoints,
        description: `Resgatado: ${reward.description} (${tierDiscount}% desconto tier)`,
        balance_after: loyaltyPoints.points_balance - finalPoints
      });

      // Atualizar pontos
      const newBalance = loyaltyPoints.points_balance - finalPoints;
      const newTotalRedeemed = (loyaltyPoints.total_redeemed || 0) + finalPoints;
      const newRedemptions = (loyaltyPoints.lifetime_redemptions || 0) + 1;
      
      // Calcular novo tier baseado em total_earned
      const newTier = calculateTier(loyaltyPoints.total_earned || 0);
      
      await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
        points_balance: newBalance,
        total_redeemed: newTotalRedeemed,
        lifetime_redemptions: newRedemptions,
        tier: newTier
      });

      // Criar registo de resgate (para rastreamento e validação)
      await base44.entities.Redemption.create({
        user_email: user?.email,
        user_name: user?.full_name,
        product_id: reward.id,
        product_name: reward.description,
        partner_id: 'pawcao',
        partner_name: 'PawCão',
        points_spent: finalPoints,
        euro_value: reward.value || 0,
        status: 'confirmed',
        redemption_code: redemptionCode
      });

      checkAchievements(newRedemptions, reward.category);
      
      return { code: redemptionCode, discount: tierDiscount, finalPoints };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyPoints'] });
      queryClient.invalidateQueries({ queryKey: ['pointsTransactions'] });
      toast.success(`✅ Resgate confirmado! Código: ${data.code}`, {
        description: data.discount > 0 ? `Desconto tier aplicado: ${data.discount}%` : undefined,
        duration: 5000
      });
    },
    onError: (error) => {
      toast.error('Erro ao resgatar. Tente novamente.');
      console.error('Redemption error:', error);
    }
  });
  
  const calculateTier = (totalEarned) => {
    const tier = tiers.find(t => totalEarned >= t.min && totalEarned <= t.max);
    return tier?.name || 'bronze';
  };

  const checkAchievements = async (redemptions, category) => {
    const newAchievements = [];
    const existingIds = loyaltyPoints.achievements?.map(a => a.achievement_id) || [];

    if (redemptions === 1 && !existingIds.includes('first_redemption')) {
      newAchievements.push({
        achievement_id: 'first_redemption',
        name: 'Primeiro Resgate',
        description: 'Resgatou a primeira recompensa',
        icon: '🎁',
        earned_date: new Date().toISOString()
      });
    }

    if (redemptions >= 5 && !existingIds.includes('frequent_redeemer')) {
      newAchievements.push({
        achievement_id: 'frequent_redeemer',
        name: 'Resgatador Frequente',
        description: 'Resgatou 5+ recompensas',
        icon: '⭐',
        earned_date: new Date().toISOString()
      });
    }
    
    if (redemptions >= 10 && !existingIds.includes('power_redeemer')) {
      newAchievements.push({
        achievement_id: 'power_redeemer',
        name: 'Super Resgatador',
        description: 'Resgatou 10+ recompensas',
        icon: '💎',
        earned_date: new Date().toISOString()
      });
    }
    
    if (category === 'subscription' && !existingIds.includes('subscriber')) {
      newAchievements.push({
        achievement_id: 'subscriber',
        name: 'Membro Fiel',
        description: 'Resgatou desconto de subscrição',
        icon: '👑',
        earned_date: new Date().toISOString()
      });
    }

    if (newAchievements.length > 0) {
      await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
        achievements: [...(loyaltyPoints.achievements || []), ...newAchievements]
      });
      toast.success(`🎉 Conquista desbloqueada: ${newAchievements[0].name}!`);
    }
  };

  const tiers = [
    { name: "bronze", min: 0, max: 499, color: "from-orange-400 to-orange-600", icon: "🥉", benefits: ["1x pontos", "Resgates básicos"], multiplier: 1 },
    { name: "silver", min: 500, max: 999, color: "from-gray-300 to-gray-500", icon: "🥈", benefits: ["1.2x pontos", "Suporte prioritário", "5% desconto resgates"], multiplier: 1.2, discount: 5 },
    { name: "gold", min: 1000, max: 2499, color: "from-yellow-400 to-yellow-600", icon: "🥇", benefits: ["1.5x pontos", "Ofertas exclusivas", "10% desconto resgates"], multiplier: 1.5, discount: 10 },
    { name: "platinum", min: 2500, max: 99999, color: "from-purple-400 to-purple-600", icon: "💎", benefits: ["2x pontos", "Acesso VIP", "15% desconto resgates"], multiplier: 2, discount: 15 }
  ];

  const currentTier = tiers.find(t => t.name === (loyaltyPoints?.tier || 'bronze')) || tiers[0];
  const currentTierIndex = tiers.findIndex(t => t.name === currentTier.name);
  const nextTier = tiers[currentTierIndex + 1];
  
  const tierDiscount = currentTier.discount || 0;

  const allRewards = [
    // Subscrições
    { id: 's1', category: "subscription", type: "subscription_discount", points: 500, discount: "€5", description: "Desconto subscrição Basic", icon: "💳", value: 5 },
    { id: 's2', category: "subscription", type: "subscription_discount", points: 1000, discount: "€10", description: "Desconto subscrição Premium", icon: "⭐", value: 10 },
    { id: 's3', category: "subscription", type: "subscription_discount", points: 1500, discount: "€15", description: "Desconto subscrição VIP", icon: "👑", value: 15 },
    { id: 's4', category: "subscription", type: "free_month", points: 2000, discount: "Grátis", description: "1 mês grátis qualquer plano", icon: "🎁", value: 0 },
    
    // Produtos Loja
    { id: 'p1', category: "product", type: "product_discount", points: 300, discount: "€10", description: "Desconto produtos loja", icon: "🛍️", value: 10 },
    { id: 'p2', category: "product", type: "product_discount", points: 600, discount: "€25", description: "Desconto produtos premium", icon: "✨", value: 25 },
    { id: 'p3', category: "product", type: "free_product", points: 1200, discount: "Grátis", description: "Produto grátis até €40", icon: "🎉", value: 40 },
    
    // Serviços
    { id: 'w1', category: "service", type: "walk_discount", points: 200, discount: "€5", description: "Desconto próximo passeio", icon: "🐕", value: 5 },
    { id: 'w2', category: "service", type: "walk_discount", points: 400, discount: "€15", description: "Desconto qualquer passeio", icon: "🦮", value: 15 },
    { id: 'w3', category: "service", type: "free_walk", points: 800, discount: "Grátis", description: "1 passeio grátis (até €20)", icon: "🌟", value: 20 },
    { id: 't1', category: "service", type: "training_discount", points: 300, discount: "€10", description: "Desconto treino", icon: "🎓", value: 10 },
    { id: 't2', category: "service", type: "training_discount", points: 700, discount: "€30", description: "Pacote 5 sessões", icon: "📚", value: 30 },
    
    // Extras VIP
    { id: 'v1', category: "vip", type: "premium_feature", points: 400, discount: "Grátis", description: "GPS tracking 1 mês", icon: "📍", value: 0 },
    { id: 'v2', category: "vip", type: "premium_feature", points: 500, discount: "Grátis", description: "Photo updates 1 mês", icon: "📸", value: 0 },
    { id: 'v3', category: "vip", type: "free_service", points: 1500, discount: "Grátis", description: "1 banho profissional", icon: "🛁", value: 0 }
  ];

  const filteredRewards = activeCategory === "all" 
    ? allRewards 
    : allRewards.filter(r => r.category === activeCategory);

  const progressToNext = nextTier 
    ? ((loyaltyPoints?.total_earned || 0) / nextTier.min) * 100
    : 100;

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-6">
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
          {[
            { id: "all", label: "Todos", icon: "🎯" },
            { id: "subscription", label: "Subscrições", icon: "💳" },
            { id: "product", label: "Produtos", icon: "🛍️" },
            { id: "service", label: "Serviços", icon: "🐕" },
            { id: "vip", label: "VIP", icon: "👑" }
          ].map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              onClick={() => setActiveCategory(cat.id)}
              className={`${activeCategory === cat.id ? "bg-gradient-to-r from-purple-600 to-indigo-600" : ""} whitespace-nowrap text-sm md:text-base h-9 md:h-10`}
            >
              {cat.icon} {cat.label}
            </Button>
          ))}
        </div>
        
        {/* Tier Discount Banner */}
        {tierDiscount > 0 && (
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-400 rounded-2xl p-4 mb-6">
            <p className="text-center font-bold text-green-700">
              ✨ Desconto Tier Ativo: <span className="text-2xl">{tierDiscount}%</span> em todos os resgates!
            </p>
          </div>
        )}

        {/* Rewards Grid - Mobile Optimized */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Resgatar Pontos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          {filteredRewards.map((reward, index) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              index={index}
              userPoints={loyaltyPoints?.points_balance || 0}
              onRedeem={redeemMutation.mutate}
              isRedeeming={redeemMutation.isPending}
              tierDiscount={tierDiscount}
            />
          ))}
        </div>

        {/* How to Earn - Mobile Optimized */}
        <Card className="glass-panel border-2 border-purple-200 mb-6 md:mb-8">
          <CardContent className="p-4 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              How to Earn Points
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6">
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">10</div>
                <p className="text-xs md:text-sm text-gray-700 font-semibold">Por €1 gasto</p>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">50</div>
                <p className="text-xs md:text-sm text-gray-700 font-semibold">Deixar review</p>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">100</div>
                <p className="text-xs md:text-sm text-gray-700 font-semibold">Indicar amigo</p>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">x{currentTier.multiplier}</div>
                <p className="text-xs md:text-sm text-gray-700 font-semibold">Multiplicador tier</p>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-bold text-purple-600 mb-1 md:mb-2">{tierDiscount}%</div>
                <p className="text-xs md:text-sm text-gray-700 font-semibold">Desconto resgates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History - Mobile Optimized */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Points History</h2>
        <Card className="glass-panel border-0 shadow-xl">
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