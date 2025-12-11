import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  TrendingUp, Calendar, Heart, Award, Target, Dog, Activity, Star, BarChart3, 
  Search, List, Zap, Crown, CheckCircle, Plus, DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewModal from "@/components/reviews/ReviewModal";
import { motion } from "framer-motion";
import { calculateTier } from "@/components/gamification/gamificationRules";
import { toast } from "sonner";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [pendingReviewBooking, setPendingReviewBooking] = React.useState(null);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allOwnerBookings', user?.email],
    queryFn: async () => {
      const walkerBookings = await base44.entities.Booking.filter({ created_by: user.email });
      const trainerBookings = await base44.entities.TrainingBooking.filter({ owner_email: user.email });
      const serviceBookings = await base44.entities.ServiceBooking.filter({ owner_email: user.email });
      return [...walkerBookings, ...trainerBookings, ...serviceBookings];
    },
    enabled: !!user,
    initialData: []
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs'],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user,
    initialData: []
  });

  const { data: loyaltyPoints, refetch: refetchLoyalty } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({ user_email: user.email });
      return points[0] || { points_balance: 0, total_earned: 0, tier: 'bronze' };
    },
    enabled: !!user,
  });

  // AUTO-FIX: Correct tier based on points
  React.useEffect(() => {
    const fixTier = async () => {
      if (!loyaltyPoints || !user?.email) return;
      
      const currentPoints = loyaltyPoints.points_balance || 0;
      const correctTier = calculateTier(currentPoints);
      const currentTier = loyaltyPoints.tier?.toLowerCase() || 'bronze';
      
      if (correctTier !== currentTier) {
        try {
          await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
            tier: correctTier
          });
          refetchLoyalty();
          toast.success(`🎉 Tier atualizado para ${correctTier.toUpperCase()}!`);
        } catch (error) {
          console.error('Error fixing tier:', error);
        }
      }
    };
    
    fixTier();
  }, [loyaltyPoints?.points_balance, user?.email]);

  // Auto-open review modal
  React.useEffect(() => {
    if (allBookings.length > 0) {
      const needsReview = allBookings.find(b => b.status === 'completed' && !b.review_id && b.walker_id);
      if (needsReview) setPendingReviewBooking(needsReview);
    }
  }, [allBookings]);

  // Statistics
  const totalSpent = allBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const walksThisMonth = allBookings.filter(b => {
    const bookingDate = new Date(b.created_date);
    return bookingDate >= startOfMonth(new Date());
  }).length;
  
  const walkGoal = 12;
  const goalProgress = Math.min((walksThisMonth / walkGoal) * 100, 100);

  // Gamification Data (with fallback)
  const currentXP = user?.gamification_xp || 0;
  const currentLevel = user?.gamification_level || 1;
  const userTier = loyaltyPoints?.tier || 'bronze';
  const points = loyaltyPoints?.points_balance || 0;

  // XP Progress Calculation
  const nextLevelXP = currentLevel * 500; // Simplified: 500 XP per level
  const currentLevelStartXP = (currentLevel - 1) * 500;
  const xpInCurrentLevel = currentXP - currentLevelStartXP;
  const xpNeededForNext = nextLevelXP - currentLevelStartXP;
  const xpProgress = Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100);

  // Tier Config (CRITICAL: Exact Gradients)
  const getTierStyles = (tier) => {
    switch(tier.toLowerCase()) {
      case 'bronze':
        return {
          gradient: 'bg-gradient-to-br from-orange-700 via-orange-600 to-yellow-700',
          name: 'Aprendiz Bronze',
          textColor: 'text-white'
        };
      case 'silver':
        return {
          gradient: 'bg-gradient-to-br from-gray-300 via-gray-100 to-gray-400',
          name: 'Guardião Prata',
          textColor: 'text-gray-800'
        };
      case 'gold':
        return {
          gradient: 'bg-gradient-to-br from-yellow-500 via-yellow-200 to-yellow-600',
          name: 'Mestre Ouro',
          textColor: 'text-yellow-900',
          shimmer: true
        };
      case 'sapphire':
        return {
          gradient: 'bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700',
          name: 'Guardião Safira',
          textColor: 'text-white',
          shimmer: true
        };
      case 'diamond':
      case 'platinum':
        return {
          gradient: 'bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700',
          name: 'Lenda Diamante',
          textColor: 'text-white',
          shimmer: true
        };
      default:
        return {
          gradient: 'bg-gradient-to-br from-orange-700 via-orange-600 to-yellow-700',
          name: 'Aprendiz Bronze',
          textColor: 'text-white'
        };
    }
  };

  const tierStyles = getTierStyles(userTier);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <ErrorBoundary>
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
            Dashboard Premium
          </h1>
          <p className="text-gray-600 text-sm md:text-base">Acompanhe seu progresso e gerencie seus pets 🐾</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* 🎮 GAMIFICATION HERO CARD - "Living Status" */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className={`border-0 shadow-2xl overflow-hidden ${tierStyles.gradient} ${tierStyles.textColor} relative h-full min-h-[300px]`}>
              
              {/* Glassmorphism Overlay */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
              
              {/* Shimmer Effect (Gold Only) */}
              {tierStyles.shimmer && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute -inset-full animate-shimmer bg-gradient-to-r from-transparent via-white/30 to-transparent" 
                       style={{ transform: 'skewX(-20deg)', animationDuration: '3s' }}></div>
                </div>
              )}
              
              <CardContent className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-between">
                
                {/* Top Section: Tier Info */}
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className={`text-xs ${tierStyles.textColor} opacity-60 uppercase font-bold tracking-widest mb-2`}>
                        Seu Nível
                      </p>
                      <h2 className="text-4xl md:text-5xl font-black mb-2 flex items-center gap-3">
                        <Crown className="w-10 h-10 md:w-12 md:h-12 text-yellow-300 drop-shadow-lg" />
                        {tierStyles.name}
                      </h2>
                      <p className={`${tierStyles.textColor} opacity-80 font-semibold text-lg`}>
                        Nível {currentLevel}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl md:text-5xl font-mono font-black drop-shadow-md">{currentXP}</div>
                      <p className={`text-xs ${tierStyles.textColor} opacity-60 uppercase tracking-wide`}>Total XP</p>
                    </div>
                  </div>

                  {/* XP Progress Bar - ANIMATED */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2 font-semibold">
                      <span className={`${tierStyles.textColor} opacity-80`}>
                        Progresso para Nível {currentLevel + 1}
                      </span>
                      <span className="font-bold">{Math.round(xpProgress)}%</span>
                    </div>
                    <div className="h-4 bg-black/20 rounded-full overflow-hidden shadow-inner border border-white/10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-full shadow-lg"
                        style={{ boxShadow: '0 0 15px rgba(251, 191, 36, 0.6)' }}
                      />
                    </div>
                    <p className={`text-xs ${tierStyles.textColor} opacity-60 mt-1`}>
                      {Math.max(0, nextLevelXP - currentXP)} XP para o próximo nível
                    </p>
                  </div>
                </div>

                {/* Bottom Section: Points Display */}
                <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 p-2.5 rounded-lg shadow-md">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className={`text-xs ${tierStyles.textColor} opacity-60 uppercase font-bold tracking-wide`}>
                        PawPoints
                      </p>
                      <p className="text-3xl font-black">{points.toLocaleString()}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                    className="bg-white text-purple-600 hover:bg-gray-100 font-bold shadow-lg transition-transform hover:scale-105"
                    size="sm"
                  >
                    Resgatar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 🎯 QUICK ACTIONS GRID - Compact 3-Button Layout */}
          <div>
            <Card className="border-0 shadow-xl h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-3 w-full">
                  
                  {/* Action 1: Explorar */}
                  <motion.button
                    whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(createPageUrl('Home'))}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all group active:scale-95"
                  >
                    <div className="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-gray-100 transition-all duration-300">
                      <Search className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 group-hover:text-gray-900 leading-tight transition-colors">
                      Explorar
                    </span>
                  </motion.button>

                  {/* Action 2: Favoritos */}
                  <motion.button
                    whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(createPageUrl('Favorites'))}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all group active:scale-95"
                  >
                    <div className="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-gray-100 transition-all duration-300">
                      <Heart className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 group-hover:text-gray-900 leading-tight transition-colors">
                      Favoritos
                    </span>
                  </motion.button>

                  {/* Action 3: Reservas */}
                  <motion.button
                    whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(createPageUrl('MyBookings'))}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all group active:scale-95"
                  >
                    <div className="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-gray-100 transition-all duration-300">
                      <List className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors" strokeWidth={1.5} />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 group-hover:text-gray-900 leading-tight transition-colors">
                      Reservas
                    </span>
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 🐕 MY PACK - Horizontal Dog Scroll */}
        <Card className="border-0 shadow-xl mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dog className="w-5 h-5 text-orange-600" />
              My Pack
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {myDogs && myDogs.length > 0 && myDogs.map((dog) => (
                <motion.div
                  key={dog.id}
                  whileHover={{ scale: 1.05 }}
                  className="flex-shrink-0 w-28 cursor-pointer"
                >
                  <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl p-3 text-center border-2 border-orange-200 hover:border-orange-400 transition-all shadow-md hover:shadow-lg">
                    <Avatar className="w-16 h-16 mx-auto mb-2 border-4 border-white shadow-lg">
                      <AvatarImage src={dog.photo_url} className="object-cover" />
                      <AvatarFallback className="bg-orange-300 text-white text-xl font-bold">
                        {dog.dog_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-sm text-gray-900 truncate">{dog.dog_name}</p>
                    <p className="text-xs text-gray-600 truncate">{dog.breed}</p>
                  </div>
                </motion.div>
              ))}
              
              {/* Add Dog Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate(createPageUrl('AccountSettings'))}
                className="flex-shrink-0 w-28 cursor-pointer"
              >
                <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-3 h-full flex flex-col items-center justify-center hover:bg-gray-200 hover:border-gray-400 transition-all shadow-md">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2 group-hover:bg-gray-300 transition-colors">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-xs font-bold text-gray-500">Adicionar</p>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* 📊 ACTIVITY FEED */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left: Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Nenhuma atividade ainda</p>
                    <Button onClick={() => navigate(createPageUrl('Home'))} className="bg-green-600 hover:bg-green-700">
                      <Search className="w-4 h-4 mr-2" />
                      Encontrar Passeador
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {allBookings.slice(0, 10).map((booking, idx) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-white to-gray-50 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md border border-gray-100"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                            booking.status === 'completed' ? 'bg-green-100' :
                            booking.status === 'pending' ? 'bg-orange-100' :
                            booking.status === 'confirmed' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            {booking.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                             booking.status === 'pending' ? <Zap className="w-5 h-5 text-orange-600" /> :
                             <Calendar className="w-5 h-5 text-blue-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">{booking.dog_name}</p>
                            <p className="text-xs text-gray-600">
                              {format(new Date(booking.walk_date || booking.session_date || booking.created_date), 'dd MMM yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-green-600 text-lg">€{booking.total_amount}</p>
                          <Badge className={`text-xs ${
                            booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {booking.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Stats & Goals */}
          <div className="space-y-6">
            
            {/* Quick Stats - Spending */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white border-0">Total</Badge>
                </div>
                <div className="text-4xl font-bold mb-1">€{totalSpent.toFixed(0)}</div>
                <div className="text-sm opacity-90">Investido</div>
              </CardContent>
            </Card>

            {/* Quick Stats - Walks */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-8 h-8 opacity-80" />
                  <Badge className="bg-white/20 text-white border-0">Este Mês</Badge>
                </div>
                <div className="text-4xl font-bold mb-1">{walksThisMonth}</div>
                <div className="text-sm opacity-90">Passeios</div>
              </CardContent>
            </Card>

            {/* Monthly Goal */}
            <Card className="border-2 border-green-300 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Meta Mensal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center mb-3">
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    {walksThisMonth}/{walkGoal}
                  </div>
                  <p className="text-xs text-gray-600">passeios</p>
                </div>
                
                <Progress value={goalProgress} className="h-3 mb-3" />
                
                {goalProgress >= 100 ? (
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3 text-center">
                    <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="font-bold text-green-900 text-sm">Meta Alcançada! 🎉</p>
                  </div>
                ) : (
                  <p className="text-xs text-center text-gray-600">
                    <strong>Faltam {walkGoal - walksThisMonth}</strong> para a meta!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Review Modal */}
        {pendingReviewBooking && (
          <ReviewModal 
            booking={pendingReviewBooking} 
            isOpen={!!pendingReviewBooking} 
            onClose={() => setPendingReviewBooking(null)} 
          />
        )}
        
        </ErrorBoundary>
      </div>

      {/* Shimmer Animation Keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}