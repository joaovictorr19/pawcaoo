import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  TrendingUp, DollarSign, Calendar, Heart, Award, Target,
  Dog, Activity, Star, BarChart3, Search, List, Zap, Crown, CheckCircle, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewModal from "@/components/reviews/ReviewModal";
import { motion } from "framer-motion";
import { getTierName, getTierColor, getXPForLevel } from "@/components/gamification/gamificationRules";

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
      const walkerBookings = await base44.entities.Booking.filter({
        created_by: user.email
      });
      const trainerBookings = await base44.entities.TrainingBooking.filter({
        owner_email: user.email
      });
      const serviceBookings = await base44.entities.ServiceBooking.filter({
        owner_email: user.email
      });
      
      const all = [...walkerBookings, ...trainerBookings, ...serviceBookings];
      return all;
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

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user.email
      });
      return points[0] || { points_balance: 0, total_earned: 0, tier: 'bronze' };
    },
    enabled: !!user,
  });

  const { data: scheduledWalks = [] } = useQuery({
    queryKey: ['scheduledAppointments', user?.email],
    queryFn: () => base44.entities.ScheduledAppointment.filter({
      created_by: user.email,
      is_active: true
    }),
    enabled: !!user,
    initialData: []
  });

  // Auto-open review modal for pending reviews
  React.useEffect(() => {
    if (allBookings.length > 0) {
      const needsReview = allBookings.find(b => b.status === 'completed' && !b.review_id && b.walker_id);
      if (needsReview) {
        setPendingReviewBooking(needsReview);
      }
    }
  }, [allBookings]);

  // Calculate statistics
  const totalSpent = allBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const completedBookings = allBookings.filter(b => b.status === 'completed');

  // Goals and recommendations
  const walksThisMonth = allBookings.filter(b => {
    const bookingDate = new Date(b.created_date);
    return bookingDate >= startOfMonth(new Date());
  }).length;
  
  const walkGoal = 12; // 3x per week
  const goalProgress = Math.min((walksThisMonth / walkGoal) * 100, 100);

  // Tier & XP Logic
  const currentLevel = user?.gamification_level || 1;
  const currentXP = user?.gamification_xp || 0;
  const tierName = getTierName(currentLevel);
  const tierColor = getTierColor(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  const currentLevelXP = getXPForLevel(currentLevel);
  const xpProgress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-purple-600" />
            Meu Dashboard
          </h1>
          <p className="text-gray-600">
            Gerencie sua atividade e acompanhe o progresso 📊
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* GAMIFICATION HERO CARD - Mobile First */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2"
          >
            <Card className={`border-0 shadow-2xl overflow-hidden bg-gradient-to-br ${tierColor} text-white relative h-full min-h-[280px]`}>
              {/* Glassmorphism Overlay */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
              
              <CardContent className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs text-white/60 uppercase font-bold tracking-widest mb-2">Seu Nível</p>
                      <h2 className="text-4xl md:text-5xl font-black mb-2 flex items-center gap-3">
                        <Crown className="w-10 h-10 text-yellow-300" />
                        {tierName}
                      </h2>
                      <p className="text-white/80 font-semibold">Nível {currentLevel}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl md:text-4xl font-mono font-black">{currentXP}</div>
                      <p className="text-xs text-white/60 uppercase tracking-wide">Total XP</p>
                    </div>
                  </div>

                  {/* Progress Bar - Animated */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/80">Progresso para Nível {currentLevel + 1}</span>
                      <span className="font-bold">{Math.round(xpProgress)}%</span>
                    </div>
                    <div className="h-4 bg-black/20 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-full shadow-lg"
                        style={{ boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)' }}
                      />
                    </div>
                    <p className="text-xs text-white/60 mt-1">
                      {nextLevelXP - currentXP} XP para o próximo nível
                    </p>
                  </div>
                </div>

                {/* Points Display */}
                <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500 p-2 rounded-lg">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60 uppercase font-bold tracking-wide">PawPoints</p>
                      <p className="text-2xl font-black">{loyaltyPoints?.points_balance?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                    className="bg-white text-purple-600 hover:bg-gray-100 font-bold shadow-lg"
                    size="sm"
                  >
                    Resgatar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* QUICK ACTIONS GRID - Compact 3-Button Layout */}
          <div>
            <Card className="border-0 shadow-xl h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {/* Button 1: Explorar */}
                  <motion.button
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(createPageUrl('Home'))}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-green-50 border-2 border-gray-200 hover:border-green-300 rounded-xl shadow-sm transition-all group active:scale-95"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                      <Search className="w-5 h-5 text-green-600 group-hover:text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 group-hover:text-green-600 leading-tight">Explorar</span>
                  </motion.button>

                  {/* Button 2: Favoritos */}
                  <motion.button
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(createPageUrl('Favorites'))}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-pink-50 border-2 border-gray-200 hover:border-pink-300 rounded-xl shadow-sm transition-all group active:scale-95"
                  >
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-600 transition-colors">
                      <Heart className="w-5 h-5 text-pink-600 group-hover:text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 group-hover:text-pink-600 leading-tight">Favoritos</span>
                  </motion.button>

                  {/* Button 3: Reservas */}
                  <motion.button
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(createPageUrl('MyBookings'))}
                    className="flex flex-col items-center gap-2 p-3 bg-white hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-300 rounded-xl shadow-sm transition-all group active:scale-95"
                  >
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                      <List className="w-5 h-5 text-purple-600 group-hover:text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 group-hover:text-purple-600 leading-tight">Reservas</span>
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* MY DOGS SECTION - Horizontal Scroll */}
        {myDogs.length > 0 && (
          <Card className="border-0 shadow-xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dog className="w-5 h-5 text-orange-600" />
                Meus Pets
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {myDogs.map((dog) => (
                  <motion.div
                    key={dog.id}
                    whileHover={{ scale: 1.05 }}
                    className="flex-shrink-0 w-32 cursor-pointer"
                  >
                    <div className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl p-4 text-center border-2 border-orange-200 hover:border-orange-400 transition-all shadow-md">
                      <Avatar className="w-16 h-16 mx-auto mb-2 border-4 border-white shadow-lg">
                        <AvatarImage src={dog.photo_url} />
                        <AvatarFallback className="bg-orange-300 text-white text-xl">
                          {dog.dog_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-bold text-sm text-gray-900 truncate">{dog.dog_name}</p>
                      <p className="text-xs text-gray-600">{dog.breed}</p>
                    </div>
                  </motion.div>
                ))}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate(createPageUrl('AccountSettings'))}
                  className="flex-shrink-0 w-32 cursor-pointer"
                >
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-4 h-full flex flex-col items-center justify-center hover:bg-gray-200 transition-all">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                      <Dog className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-xs font-bold text-gray-500">Adicionar</p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ACTIVITY FEED */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
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
                  <div className="space-y-3">
                    {allBookings.slice(0, 8).map((booking, idx) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            booking.status === 'completed' ? 'bg-green-100' :
                            booking.status === 'pending' ? 'bg-orange-100' :
                            booking.status === 'confirmed' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            {booking.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                             booking.status === 'pending' ? <Zap className="w-5 h-5 text-orange-600" /> :
                             <Calendar className="w-5 h-5 text-blue-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{booking.dog_name}</p>
                            <p className="text-xs text-gray-600">
                              {format(new Date(booking.walk_date || booking.session_date || booking.created_date), 'dd MMM yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">€{booking.total_amount}</p>
                          <Badge className="text-xs">
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
            {/* Quick Stats */}
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
                    <strong>Faltam {walkGoal - walksThisMonth}</strong> para atingir a meta!
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
    </div>
  );
}