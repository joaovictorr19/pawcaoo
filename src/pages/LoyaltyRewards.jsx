import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gift, TrendingUp, Target, ShoppingBag, Dog, Crown, Star, 
  Clock, CheckCircle, ArrowRight, Info, Zap
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LoyaltyRewards() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedReward, setSelectedReward] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
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
        lifetime_redemptions: 0,
        total_redeemed: 0
      };
    },
    enabled: !!user?.email,
  });

  const { data: ownerSubscription } = useQuery({
    queryKey: ['ownerSubscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.OwnerSubscription.filter({
        owner_email: user.email,
        is_active: true
      });
      return subs[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['pointsTransactions', user?.email],
    queryFn: () => base44.entities.PointsTransaction.filter(
      { user_email: user?.email },
      '-created_date',
      20
    ),
    enabled: !!user?.email,
  });

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      const tierDiscount = currentTier.discount || 0;
      const finalPoints = Math.round(reward.points * (1 - tierDiscount / 100));
      
      if (loyaltyPoints.points_balance < finalPoints) {
        throw new Error('Pontos insuficientes');
      }

      // Calcular valor em euros: 400 pontos = €1
      const euroValue = (finalPoints / 400).toFixed(2);

      // Criar checkout via Stripe
      const checkoutResponse = await base44.functions.invoke('createPawPointsCheckout', {
        reward_id: reward.id,
        final_points: finalPoints,
        euro_value: parseFloat(euroValue),
        description: reward.description,
        tier_discount: tierDiscount
      });

      if (checkoutResponse?.data?.url) {
        window.location.href = checkoutResponse.data.url;
      } else {
        throw new Error('Erro ao criar sessão de pagamento');
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao processar resgate');
    }
  });

  const handleRedeemClick = (reward) => {
    setSelectedReward(reward);
    setShowConfirmDialog(true);
  };

  const confirmRedeem = () => {
    setShowConfirmDialog(false);
    redeemMutation.mutate(selectedReward);
  };

  const calculateTier = (totalEarned) => {
    const tier = tiers.find(t => totalEarned >= t.min && totalEarned <= t.max);
    return tier?.name || 'bronze';
  };

  const tiers = [
    { 
      name: "bronze", 
      min: 0, 
      max: 499, 
      color: "from-orange-400 to-orange-600", 
      benefits: ["1x pontos", "Resgates básicos"], 
      multiplier: 1 
    },
    { 
      name: "silver", 
      min: 500, 
      max: 999, 
      color: "from-gray-300 to-gray-500", 
      benefits: ["1.2x pontos", "Suporte prioritário", "5% desconto resgates"], 
      multiplier: 1.2, 
      discount: 5 
    },
    { 
      name: "gold", 
      min: 1000, 
      max: 2499, 
      color: "from-yellow-400 to-yellow-600", 
      benefits: ["1.5x pontos", "Ofertas exclusivas", "10% desconto resgates"], 
      multiplier: 1.5, 
      discount: 10 
    },
    { 
      name: "platinum", 
      min: 2500, 
      max: 99999, 
      color: "from-purple-400 to-purple-600", 
      benefits: ["2x pontos", "Acesso VIP", "15% desconto resgates"], 
      multiplier: 2, 
      discount: 15 
    }
  ];

  const currentTier = tiers.find(t => t.name === (loyaltyPoints?.tier || 'bronze')) || tiers[0];
  const currentTierIndex = tiers.findIndex(t => t.name === currentTier.name);
  const nextTier = tiers[currentTierIndex + 1];
  const tierDiscount = currentTier.discount || 0;

  // Rewards ajustados: 400 pontos = €1
  const allRewards = [
    { id: 's1', category: "subscription", points: 2000, description: "Desconto €5 subscrição", value: 5 },
    { id: 's2', category: "subscription", points: 4000, description: "Desconto €10 subscrição", value: 10 },
    { id: 's3', category: "subscription", points: 6000, description: "Desconto €15 subscrição", value: 15 },
    
    { id: 'p1', category: "product", points: 2000, description: "Vale €5 loja", value: 5 },
    { id: 'p2', category: "product", points: 4000, description: "Vale €10 loja", value: 10 },
    { id: 'p3', category: "product", points: 8000, description: "Vale €20 loja", value: 20 },
    
    { id: 'w1', category: "service", points: 2000, description: "Desconto €5 passeio", value: 5 },
    { id: 'w2', category: "service", points: 4000, description: "Desconto €10 passeio", value: 10 },
    { id: 'w3', category: "service", points: 6000, description: "Desconto €15 passeio", value: 15 },
    
    { id: 'v1', category: "vip", points: 4000, description: "Crédito €10 serviços VIP", value: 10 },
    { id: 'v2', category: "vip", points: 8000, description: "Crédito €20 serviços premium", value: 20 },
  ];

  const filteredRewards = activeCategory === "all" 
    ? allRewards 
    : allRewards.filter(r => r.category === activeCategory);

  const progressToNext = nextTier 
    ? Math.min(100, ((loyaltyPoints?.total_earned || 0) / nextTier.min) * 100)
    : 100;

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="h-64 rounded-2xl mb-8" />
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
            <Star className="w-10 h-10 text-purple-600" />
            Resgatar PawPoints
          </h1>
          <p className="text-lg text-gray-600">
            Troque seus pontos por descontos e benefícios exclusivos
          </p>
        </motion.div>

        {/* User Stats Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-2xl mb-8 overflow-hidden">
            <div className={`bg-gradient-to-r ${currentTier.color} p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm uppercase tracking-wider mb-1">Seu Saldo</p>
                  <p className="text-5xl font-black">{loyaltyPoints?.points_balance?.toLocaleString() || 0}</p>
                  <p className="text-white/90 text-sm mt-1">PawPoints disponíveis</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-white/20 text-white border-0 mb-2 text-sm px-3 py-1">
                    Tier {currentTier.name.toUpperCase()}
                  </Badge>
                  {tierDiscount > 0 && (
                    <p className="text-2xl font-bold">{tierDiscount}% OFF</p>
                  )}
                </div>
              </div>
              
              {/* Tier Progress */}
              {nextTier && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-white/80 mb-2">
                    <span>Progresso para {nextTier.name}</span>
                    <span>{loyaltyPoints?.total_earned || 0} / {nextTier.min} pts</span>
                  </div>
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToNext}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Conversion Rate */}
            <CardContent className="p-6 bg-blue-50">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-black text-purple-600">400</p>
                  <p className="text-xs text-gray-600">Pontos</p>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-400" />
                <div className="text-center">
                  <p className="text-3xl font-black text-green-600">€1</p>
                  <p className="text-xs text-gray-600">Em resgates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Filters */}
        <motion.div 
          className="flex gap-3 mb-8 overflow-x-auto pb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {[
            { id: "all", label: "Todas", icon: Target },
            { id: "subscription", label: "Subscrições", icon: Crown },
            { id: "product", label: "Loja", icon: ShoppingBag },
            { id: "service", label: "Serviços", icon: Dog },
            { id: "vip", label: "VIP", icon: Star }
          ].map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id ? "bg-purple-600 hover:bg-purple-700" : ""}
            >
              <cat.icon className="w-4 h-4 mr-2" />
              {cat.label}
            </Button>
          ))}
        </motion.div>

        {/* Rewards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredRewards.map((reward, index) => {
            const finalPoints = Math.round(reward.points * (1 - tierDiscount / 100));
            const canAfford = (loyaltyPoints?.points_balance || 0) >= finalPoints;
            const originalValue = reward.value;
            const discountedValue = (originalValue * (1 - tierDiscount / 100)).toFixed(2);

            return (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className={`border-0 shadow-lg hover:shadow-2xl transition-all ${!canAfford && 'opacity-50'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        reward.category === 'subscription' ? 'bg-purple-100' :
                        reward.category === 'product' ? 'bg-green-100' :
                        reward.category === 'service' ? 'bg-blue-100' :
                        'bg-yellow-100'
                      }`}>
                        {reward.category === 'subscription' && <Crown className="w-6 h-6 text-purple-600" />}
                        {reward.category === 'product' && <ShoppingBag className="w-6 h-6 text-green-600" />}
                        {reward.category === 'service' && <Dog className="w-6 h-6 text-blue-600" />}
                        {reward.category === 'vip' && <Star className="w-6 h-6 text-yellow-600" />}
                      </div>
                      
                      {tierDiscount > 0 && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          -{tierDiscount}%
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {reward.description}
                    </h3>

                    <div className="flex items-baseline gap-2 mb-4">
                      <p className="text-3xl font-black text-purple-600">{finalPoints}</p>
                      {tierDiscount > 0 && (
                        <p className="text-sm text-gray-400 line-through">{reward.points}</p>
                      )}
                      <p className="text-sm text-gray-600">pontos</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <ArrowRight className="w-4 h-4" />
                      <span>Vale €{discountedValue}</span>
                    </div>

                    <Button
                      className="w-full"
                      disabled={!canAfford || redeemMutation.isPending}
                      onClick={() => handleRedeemClick(reward)}
                    >
                      {!canAfford ? 'Pontos insuficientes' : 'Resgatar Agora'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* How to Earn */}
        <Card className="border-0 shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              Como Ganhar Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-3xl font-black text-purple-600 mb-1">10</p>
                <p className="text-sm text-gray-600">Pontos por cada €1 gasto</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-3xl font-black text-blue-600 mb-1">50</p>
                <p className="text-sm text-gray-600">Pontos por deixar review</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-3xl font-black text-green-600 mb-1">100</p>
                <p className="text-sm text-gray-600">Pontos por indicar amigo</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-3xl font-black text-yellow-600 mb-1">x{currentTier.multiplier}</p>
                <p className="text-sm text-gray-600">Multiplicador do seu tier</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-gray-600" />
              Histórico de Pontos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma transação ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{tx.description}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(tx.created_date), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        tx.transaction_type === 'earned' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.transaction_type === 'earned' ? '+' : '-'}{Math.abs(tx.points_amount)}
                      </p>
                      <p className="text-xs text-gray-500">Saldo: {tx.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Resgate</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja resgatar esta recompensa?
            </DialogDescription>
          </DialogHeader>
          
          {selectedReward && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="font-semibold text-gray-900 mb-2">{selectedReward.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">Custo:</p>
                  <p className="text-xl font-bold text-purple-600">
                    {Math.round(selectedReward.points * (1 - tierDiscount / 100))} pontos
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-600">Valor:</p>
                  <p className="text-lg font-semibold text-green-600">
                    €{(selectedReward.value * (1 - tierDiscount / 100)).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  Será redirecionado para o checkout seguro Stripe para confirmar o resgate.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmRedeem} disabled={redeemMutation.isPending}>
              {redeemMutation.isPending ? 'Processando...' : 'Confirmar Resgate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}