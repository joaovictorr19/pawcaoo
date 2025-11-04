import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Gift, Sparkles, Star, Award, Palette, Camera, Shield, 
  Crown, Heart, TrendingUp, ChevronRight, Tag, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DogConnectLogo from "../components/social/DogConnectLogo";

export default function DogConnectRewards() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedReward, setSelectedReward] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      if (!user?.email) return { points_balance: 0 };
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user.email
      });
      return points[0] || { points_balance: 0 };
    },
    enabled: !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ['socialSubscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.SocialSubscription.filter({
        user_email: user.email,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!user,
  });

  const { data: myRedemptions = [] } = useQuery({
    queryKey: ['myRedemptions', user?.email],
    queryFn: () => base44.entities.SocialRedemption.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: allRewards = [] } = useQuery({
    queryKey: ['socialRewards'],
    queryFn: () => base44.entities.SocialReward.filter({ is_active: true }),
    initialData: [],
  });

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      // Create redemption
      await base44.entities.SocialRedemption.create({
        user_email: user.email,
        user_name: user.full_name,
        reward_id: reward.id,
        reward_name: reward.reward_name,
        reward_type: reward.reward_type,
        points_spent: reward.points_cost,
        redemption_code: `DC${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        reward_data: reward.reward_data,
        discount_code: reward.discount_code,
        partner_name: reward.partner_name,
        status: 'redeemed'
      });

      // Deduct points
      await base44.entities.PointsTransaction.create({
        user_email: user.email,
        transaction_type: 'redeemed',
        points_amount: -reward.points_cost,
        description: `Resgatou: ${reward.reward_name}`,
        balance_after: loyaltyPoints.points_balance - reward.points_cost
      });

      await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
        points_balance: loyaltyPoints.points_balance - reward.points_cost,
        total_redeemed: (loyaltyPoints.total_redeemed || 0) + reward.points_cost
      });

      // Update reward quantity if limited
      if (reward.is_limited) {
        await base44.entities.SocialReward.update(reward.id, {
          quantity_redeemed: (reward.quantity_redeemed || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltyPoints'] });
      queryClient.invalidateQueries({ queryKey: ['myRedemptions'] });
      queryClient.invalidateQueries({ queryKey: ['socialRewards'] });
      setSelectedReward(null);
      toast.success("🎉 Recompensa resgatada com sucesso!");
    },
  });

  const filteredRewards = activeCategory === "all" 
    ? allRewards 
    : allRewards.filter(r => r.category === activeCategory);

  const getRarityColor = (rarity) => {
    const colors = {
      common: "from-gray-500 to-gray-600",
      rare: "from-blue-500 to-blue-600",
      epic: "from-purple-500 to-purple-600",
      legendary: "from-yellow-500 to-orange-600"
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBadge = (rarity) => {
    const colors = {
      common: "bg-gray-500",
      rare: "bg-blue-500",
      epic: "bg-purple-500",
      legendary: "bg-gradient-to-r from-yellow-500 to-orange-500"
    };
    return colors[rarity] || colors.common;
  };

  const canRedeem = (reward) => {
    if (!loyaltyPoints) return false;
    if (loyaltyPoints.points_balance < reward.points_cost) return false;
    if (reward.subscription_tier_required && subscription?.plan_type !== reward.subscription_tier_required) return false;
    if (reward.is_limited && reward.quantity_redeemed >= reward.quantity_available) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <DogConnectLogo size="default" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Recompensas Dog Connect
          </h1>
          <p className="text-lg text-gray-600">
            Troque seus PawPoints por recompensas exclusivas! 🎁
          </p>
        </div>

        {/* Points Balance */}
        <Card className="border-2 border-purple-300 shadow-2xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-white/90">Saldo PawPoints</p>
                  <p className="text-4xl font-bold">
                    {loyaltyPoints?.points_balance?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate(createPageUrl('DogConnectPremium'))}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                <Crown className="w-4 h-4 mr-2" />
                Ganhe Mais
              </Button>
            </div>
          </div>
          {subscription && (
            <div className="bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {subscription.plan_type.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Multiplicador: {subscription.features?.points_multiplier || 1}x
                  </span>
                </div>
                {subscription.plan_type !== 'pro' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(createPageUrl('DogConnectPremium'))}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="bg-white border-2 border-purple-200 shadow-lg flex-wrap h-auto">
            {[
              { id: "all", name: "Todas", icon: Gift },
              { id: "profile", name: "Perfil", icon: Camera },
              { id: "themes", name: "Temas", icon: Palette },
              { id: "badges", name: "Badges", icon: Award },
              { id: "discounts", name: "Descontos", icon: Tag },
              { id: "features", name: "Recursos", icon: Star }
            ].map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:via-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
              >
                <cat.icon className="w-4 h-4 mr-2" />
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Rewards Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {filteredRewards.map((reward, index) => {
            const canIRedeem = canRedeem(reward);
            const alreadyRedeemed = myRedemptions.some(r => r.reward_id === reward.id);

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all cursor-pointer h-full ${
                  !canIRedeem ? 'opacity-60' : ''
                }`}
                onClick={() => canIRedeem && setSelectedReward(reward)}
                >
                  <div className={`h-2 bg-gradient-to-r ${getRarityColor(reward.rarity)}`} />
                  <CardContent className="p-4">
                    {reward.image_url ? (
                      <div className="relative h-40 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        <img
                          src={reward.image_url}
                          alt={reward.reward_name}
                          className="w-full h-full object-cover"
                        />
                        <Badge className={`absolute top-2 right-2 ${getRarityBadge(reward.rarity)} text-white`}>
                          {reward.rarity}
                        </Badge>
                      </div>
                    ) : (
                      <div className={`h-40 bg-gradient-to-br ${getRarityColor(reward.rarity)} rounded-lg mb-3 flex items-center justify-center`}>
                        <Gift className="w-16 h-16 text-white" />
                      </div>
                    )}

                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                      {reward.reward_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {reward.description}
                    </p>

                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-purple-600">
                        {reward.points_cost}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {reward.category}
                      </Badge>
                    </div>

                    {reward.is_limited && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Disponível</span>
                          <span>{reward.quantity_available - (reward.quantity_redeemed || 0)} restantes</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                            style={{
                              width: `${((reward.quantity_redeemed || 0) / reward.quantity_available) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {alreadyRedeemed && (
                      <Badge className="w-full bg-green-500 text-white mb-2">
                        ✓ Resgatado
                      </Badge>
                    )}

                    {reward.subscription_tier_required && (
                      <Badge className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white mb-2">
                        <Crown className="w-3 h-3 mr-1" />
                        {reward.subscription_tier_required.toUpperCase()} necessário
                      </Badge>
                    )}

                    <Button
                      className={`w-full ${
                        canIRedeem
                          ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90'
                          : 'bg-gray-300 cursor-not-allowed'
                      } text-white`}
                      disabled={!canIRedeem || alreadyRedeemed}
                    >
                      {alreadyRedeemed ? 'Já Resgatado' : canIRedeem ? 'Resgatar' : 'Pontos Insuficientes'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredRewards.length === 0 && (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma recompensa disponível
              </h3>
              <p className="text-gray-600">
                Volte em breve para ver novas recompensas!
              </p>
            </CardContent>
          </Card>
        )}

        {/* My Redemptions */}
        {myRedemptions.length > 0 && (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-600" />
                Minhas Recompensas Resgatadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {myRedemptions.slice(0, 6).map((redemption) => (
                  <div
                    key={redemption.id}
                    className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200"
                  >
                    <h4 className="font-bold text-gray-900 mb-1">{redemption.reward_name}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {redemption.points_spent} pontos
                    </p>
                    {redemption.discount_code && (
                      <div className="bg-white rounded-lg p-2 border border-purple-300">
                        <p className="text-xs text-gray-600">Código:</p>
                        <p className="font-mono font-bold text-purple-600">
                          {redemption.discount_code}
                        </p>
                      </div>
                    )}
                    <Badge className="mt-2 bg-green-500 text-white text-xs">
                      {redemption.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Redemption Confirmation Modal */}
      <AnimatePresence>
        {selectedReward && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setSelectedReward(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-8"
            >
              <div className="text-center mb-6">
                {selectedReward.image_url ? (
                  <img
                    src={selectedReward.image_url}
                    alt={selectedReward.reward_name}
                    className="w-32 h-32 object-cover rounded-xl mx-auto mb-4"
                  />
                ) : (
                  <div className={`w-32 h-32 bg-gradient-to-br ${getRarityColor(selectedReward.rarity)} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Gift className="w-16 h-16 text-white" />
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedReward.reward_name}
                </h3>
                <p className="text-gray-600 mb-4">{selectedReward.description}</p>
                
                <div className="bg-purple-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Custo</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {selectedReward.points_cost} pontos
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Saldo após resgate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(loyaltyPoints?.points_balance - selectedReward.points_cost).toLocaleString()} pontos
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedReward(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white"
                  onClick={() => redeemMutation.mutate(selectedReward)}
                  disabled={redeemMutation.isPending}
                >
                  {redeemMutation.isPending ? 'Resgatando...' : 'Confirmar Resgate'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}