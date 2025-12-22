import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, Crown, Medal, Award, Lock, Sparkles, 
  Star, TrendingUp, Users, ChevronRight, Dog, Wallet, Coins
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTheme } from "@/components/ThemeContext";
import { calculateTier, getLevelFromXP, TIER_COLORS_BY_LEVEL } from "@/components/gamification/tierSystem";

export default function Gamification() {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeRanking, setActiveRanking] = useState("global"); // global, walkers, quality

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch wallet data for cashback display
  const { data: userWallet } = useQuery({
    queryKey: ['userWallet', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
      return wallets[0] || null;
    },
    enabled: !!user?.email,
  });

  // Fetch all users for Global Ranking - UserProfile is single source of truth
  const { data: allUsers = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      // UserProfile is the ONLY source of truth for XP
      const profiles = await base44.entities.UserProfile.list('-gamification_xp', 500);
      
      return profiles
        .filter(p => (p.gamification_xp || 0) > 0)
        .map(p => ({
          email: p.user_email,
          full_name: p.full_name,
          profile_photo_url: p.profile_photo_url,
          gamification_xp: p.gamification_xp || 0,
          gamification_level: p.gamification_level || 1,
          id: p.user_id || p.id
        }))
        .sort((a, b) => (b.gamification_xp || 0) - (a.gamification_xp || 0));
    },
    enabled: activeRanking === 'global',
  });

  // Fetch walker profiles for Walker Rankings - NOVO: Baseado em Serviços Concluídos + Avaliações
  const { data: walkerProfiles = [] } = useQuery({
    queryKey: ['walkerProfiles'],
    queryFn: async () => {
      const profiles = await base44.entities.WalkerProfile.list('-rating', 500);
      return profiles.filter(p => p.is_active || p.total_walks > 0);
    },
    enabled: activeRanking === 'walkers',
  });

  // Fetch ALL completed bookings for accurate counting
  const { data: allBookings = [] } = useQuery({
    queryKey: ['allBookingsHallOfFame'],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({ status: 'completed' });
      return bookings;
    },
    enabled: activeRanking === 'walkers' || activeRanking === 'quality',
  });

  // Fetch reviews for quality ranking
  const { data: allReviews = [] } = useQuery({
    queryKey: ['allReviewsHallOfFame'],
    queryFn: async () => {
      const reviews = await base44.entities.Review.list('-created_date', 1000);
      return reviews;
    },
    enabled: activeRanking === 'walkers',
  });

  // Fetch dog profiles for Happy Dogs ranking
  const { data: dogProfiles = [] } = useQuery({
    queryKey: ['dogProfiles'],
    queryFn: async () => {
      const dogs = await base44.entities.DogProfile.list('-created_date', 500);
      return dogs;
    },
    enabled: activeRanking === 'quality',
  });

  // Process data based on active ranking
  // HALL DA FAMA: Pódio baseado em Serviços Concluídos, Cães Únicos Ajudados e Média de Avaliações
  const rankedData = React.useMemo(() => {
    if (activeRanking === 'global') {
      // Global: Ordenar por XP
      return allUsers.map(u => ({
        ...u,
        tier: calculateTier(u.gamification_xp || 0)
      }));
    }

    if (activeRanking === 'walkers') {
      // NOVO: Ranking baseado em Score Composto
      // Score = (Serviços Concluídos * 10) + (Cães Únicos * 20) + (Média Avaliações * 50)
      
      const walkerStats = {};
      
      // Contar serviços e cães únicos por walker
      allBookings.forEach(booking => {
        const walkerEmail = booking.walker_email;
        if (!walkerEmail) return;
        
        if (!walkerStats[walkerEmail]) {
          walkerStats[walkerEmail] = {
            completedServices: 0,
            uniqueDogs: new Set(),
            totalRating: 0,
            reviewCount: 0
          };
        }
        
        walkerStats[walkerEmail].completedServices++;
        if (booking.dog_name) {
          walkerStats[walkerEmail].uniqueDogs.add(booking.dog_name);
        }
      });
      
      // Adicionar avaliações
      allReviews.forEach(review => {
        const walkerEmail = walkerProfiles.find(w => w.id === review.walker_id)?.created_by;
        if (walkerEmail && walkerStats[walkerEmail]) {
          walkerStats[walkerEmail].totalRating += review.rating || 0;
          walkerStats[walkerEmail].reviewCount++;
        }
      });
      
      // Calcular score e mapear para profiles
      return walkerProfiles
        .map(profile => {
          const stats = walkerStats[profile.created_by] || { completedServices: 0, uniqueDogs: new Set(), totalRating: 0, reviewCount: 0 };
          const avgRating = stats.reviewCount > 0 ? stats.totalRating / stats.reviewCount : profile.rating || 5;
          const uniqueDogsCount = stats.uniqueDogs.size;
          
          // Score composto
          const score = (stats.completedServices * 10) + (uniqueDogsCount * 20) + (avgRating * 50);
          
          return {
            ...profile,
            completed_rides: stats.completedServices,
            unique_dogs: uniqueDogsCount,
            avg_rating: avgRating,
            hall_score: Math.round(score),
            full_name: profile.walker_name,
            profile_photo_url: profile.photo_url,
            email: profile.created_by
          };
        })
        .filter(w => w.completed_rides > 0 || w.total_walks > 0)
        .sort((a, b) => b.hall_score - a.hall_score);
    }

    if (activeRanking === 'quality') {
      // CÃES FELIZES: Ordenar por número de passeios
      const dogBookingsCount = {};
      allBookings.forEach(booking => {
        const dogName = booking.dog_name;
        const ownerEmail = booking.created_by;
        const dogKey = `${ownerEmail}-${dogName}`;
        if (dogName) {
          dogBookingsCount[dogKey] = (dogBookingsCount[dogKey] || 0) + 1;
        }
      });

      return dogProfiles
        .map(dog => {
          const dogKey = `${dog.owner_email || dog.created_by}-${dog.dog_name}`;
          return {
            ...dog,
            full_name: dog.dog_name,
            profile_photo_url: dog.photo_url,
            email: dog.owner_email || dog.created_by,
            total_walks: dogBookingsCount[dogKey] || 0
          };
        })
        .filter(d => d.total_walks > 0)
        .sort((a, b) => b.total_walks - a.total_walks);
    }

    return [];
  }, [activeRanking, allUsers, walkerProfiles, allBookings, allReviews, dogProfiles]);

  // Fetch current user's XP from UserProfile (single source of truth)
  const { data: currentUserProfile } = useQuery({
    queryKey: ['currentUserProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const currentXP = currentUserProfile?.gamification_xp || 0;
  const currentTier = calculateTier(currentXP);
  const currentLevel = currentTier.level;

  // Tier-based progress (novo sistema de 100 níveis)
  const tierProgressPercentage = currentTier.progress || 0;
  const xpRemainingForNextLevel = currentTier.xpToNextLevel || 0;

  // Badges
  const allEarnedBadges = [...(user?.achievements_badges || []), ...(user?.public_badges || [])];
  const earnedBadgeIds = allEarnedBadges.map(b => b.badge_id);

  const allPossibleBadges = [
    { id: "welcome", name: "Bem-vindo", desc: "Junte-se à comunidade", icon: "🎉", category: "milestone", rarity: "common" },
    { id: "first_post", name: "Primeiro Post", desc: "Publique seu primeiro post", icon: "📝", category: "social", rarity: "common" },
    { id: "social_butterfly", name: "Social Butterfly", desc: "50+ posts publicados", icon: "🦋", category: "social", rarity: "rare" },
    { id: "popular", name: "Popular", desc: "Receba 100+ curtidas", icon: "❤️", category: "social", rarity: "rare" },
    { id: "influencer", name: "Influencer", desc: "500+ curtidas recebidas", icon: "⭐", category: "social", rarity: "epic" },
    { id: "first_booking", name: "Primeira Reserva", desc: "Faça sua primeira reserva", icon: "🎫", category: "activity", rarity: "common" },
    { id: "regular_user", name: "Utilizador Regular", desc: "10+ reservas realizadas", icon: "📅", category: "activity", rarity: "rare" },
    { id: "profile_complete", name: "Perfil Completo", desc: "Complete 100% do perfil", icon: "✅", category: "milestone", rarity: "common" },
    { id: "streak_starter", name: "Streak Starter", desc: "7 dias consecutivos", icon: "🔥", category: "activity", rarity: "common" },
    { id: "streak_master", name: "Streak Master", desc: "30 dias consecutivos", icon: "🔥", category: "activity", rarity: "epic" },
    { id: "adoption_hero", name: "Herói de Adoção", desc: "Adote um pet resgatado", icon: "🏠", category: "milestone", rarity: "epic" },
    { id: "community_legend", name: "Lenda Comunitária", desc: "Membro lendário", icon: "👑", category: "special", rarity: "legendary" },
  ];

  // Combine system badges with earned custom badges for display (remove duplicates by id)
  const customEarnedBadges = (user?.public_badges || []).map(badge => ({
    id: badge.badge_id,
    name: badge.name,
    desc: badge.description,
    icon: badge.icon,
    image_url: badge.image_url,
    category: badge.category || 'special',
    rarity: badge.rarity || 'rare'
  }));

  // Remove duplicates - keep only unique badge IDs
  const uniqueCustomBadges = customEarnedBadges.filter((badge, index, self) => 
    index === self.findIndex(b => b.id === badge.id)
  );

  const allBadgesForDisplay = [...allPossibleBadges, ...uniqueCustomBadges];

  // Filter by category
  const filteredBadges = activeCategory === "all" 
    ? allBadgesForDisplay 
    : allBadgesForDisplay.filter(b => b.category === activeCategory);

  // User rank
  const userRank = rankedData.findIndex(u => u.email === user?.email) + 1;

  // Ranking configuration - ATUALIZADO com Hall Score
  const rankingConfig = {
    global: {
      title: 'Rank Global',
      podiumColor: 'from-yellow-400 to-yellow-600',
      accentColor: 'text-blue-600',
      bgGradient: 'from-yellow-50 to-orange-50',
      metricKey: 'gamification_xp',
      metricLabel: 'XP',
      formatMetric: (value) => `${(value || 0).toLocaleString('pt-PT')} XP`
    },
    walkers: {
      title: 'Hall da Fama',
      podiumColor: 'from-green-400 to-green-600',
      accentColor: 'text-green-600',
      bgGradient: 'from-green-50 to-emerald-50',
      metricKey: 'hall_score',
      metricLabel: 'Score',
      formatMetric: (value, item) => {
        if (item?.completed_rides !== undefined) {
          return `${item.completed_rides} 🐕 ${item.unique_dogs || 0} ⭐ ${(item.avg_rating || 5).toFixed(1)}`;
        }
        return `${value || 0} pts`;
      }
    },
    quality: {
      title: 'Cães Felizes',
      podiumColor: 'from-pink-400 to-pink-600',
      accentColor: 'text-pink-600',
      bgGradient: 'from-pink-50 to-rose-50',
      metricKey: 'total_walks',
      metricLabel: 'Passeios',
      formatMetric: (value) => `${value || 0} 🦴`
    }
  };

  const currentConfig = rankingConfig[activeRanking];

  // Donut chart data for level progress
  const donutData = [
    { name: 'Progresso', value: tierProgressPercentage, color: currentTier.primary },
    { name: 'Restante', value: 100 - tierProgressPercentage, color: '#e5e7eb' }
  ];

  return (
    <div className="min-h-screen pb-8 relative">
    {/* 1. HERO SECTION - Modern Transparent */}
    <div className="relative overflow-hidden">
        {/* Transparent glass background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-purple-50/30 to-blue-50/40 backdrop-blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative z-10">
          {/* Header Title - Professional with Context */}
          <motion.div 
            className="text-left mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 bg-clip-text text-transparent">
                  Hall da Fama
                </h1>
                <p className="text-sm md:text-base text-gray-600 font-medium mt-1">
                  Sistema de Recompensas e Rankings da Comunidade
                </p>
              </div>
            </div>
            
            <div className="max-w-3xl">
              <p className="text-gray-700 leading-relaxed">
                Acompanhe o seu progresso, desbloqueie conquistas exclusivas e compare-se com outros membros da comunidade. 
                Cada interação, passeio e atividade contribui para o seu crescimento na plataforma.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-stretch mb-8">
            {/* Card 1: Donut Chart de Nível - MODERNO SEM EMOJI */}
            <motion.div 
              className="glass-panel p-4 md:p-6 rounded-2xl relative overflow-hidden shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" 
                   style={{ background: colors?.primary }}></div>
              <div className="relative z-10">
                <h3 className="text-[10px] md:text-xs font-black text-gray-900 mb-3 md:mb-4 flex items-center gap-1.5 uppercase tracking-wide">
                  <Star className="w-3 h-3 md:w-4 md:h-4" style={{ color: colors?.primary }} />
                  <span className="hidden sm:inline">Nível</span>
                </h3>
                
                {/* Donut Chart */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="85%"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        strokeWidth={0}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Center Content - Sem Emoji */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter" style={{ color: colors?.primary }}>
                      {currentLevel}
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 font-bold uppercase tracking-wider mt-0.5">
                      Nível
                    </div>
                    <div className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-500 font-semibold mt-1">
                      {Math.round(tierProgressPercentage)}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 md:mt-4 text-center">
                  <div className="text-xs md:text-sm font-bold truncate" style={{ color: colors?.primary }}>
                    {currentTier.name}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: XP Total */}
            <motion.div 
              className="glass-panel p-4 md:p-6 rounded-2xl relative overflow-hidden shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" 
                   style={{ background: colors?.primary }}></div>
              <div className="relative z-10">
                <h3 className="text-[10px] md:text-xs font-black text-gray-900 mb-3 md:mb-4 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" style={{ color: colors?.primary }} />
                  <span className="hidden sm:inline">XP Total</span>
                </h3>
                <div className="relative text-center rounded-2xl p-3 md:p-4 overflow-hidden border border-gray-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100"></div>
                  <div className="relative z-10">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter leading-none" style={{ color: colors?.primary }}>
                      {currentXP.toLocaleString('pt-PT')}
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 font-bold uppercase tracking-wide mt-1">XP</div>
                  </div>
                </div>
                {xpRemainingForNextLevel > 0 && currentLevel < 100 && (
                  <div className="mt-2 md:mt-3 text-center">
                    <div className="text-xs md:text-sm font-bold text-gray-700">
                      +{xpRemainingForNextLevel.toLocaleString('pt-PT')}
                    </div>
                    <div className="text-[9px] md:text-xs text-gray-500">próximo nível</div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Card 3: Cashback - PERFEITO MOBILE/DESKTOP */}
            <motion.div 
              className="glass-panel p-4 md:p-6 rounded-2xl relative overflow-hidden shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-green-500"></div>
              <div className="relative z-10">
                <h3 className="text-[10px] md:text-xs font-black text-gray-900 mb-3 md:mb-4 flex items-center gap-1.5 uppercase tracking-wide">
                  <Wallet className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                  <span className="hidden sm:inline">Cashback</span>
                </h3>
                
                <div className="relative text-center rounded-2xl p-3 md:p-4 overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="relative z-10">
                    <div className="flex items-baseline justify-center gap-1 mb-1">
                      <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-green-700">
                        €
                      </span>
                      <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-green-700">
                        {Math.floor(userWallet?.cashback_balance || 0)}
                      </span>
                      <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-green-600">
                        .{((userWallet?.cashback_balance || 0) % 1).toFixed(2).substring(2)}
                      </span>
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs text-green-700 font-bold uppercase tracking-wide">Saldo</div>
                  </div>
                </div>
                
                <div className="mt-2 md:mt-3 text-center">
                  <div className="text-[9px] md:text-xs text-gray-600 font-medium">
                    💳 Use na Shop
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Badges */}
            <motion.div 
              className="glass-panel p-4 md:p-6 rounded-2xl text-center relative overflow-hidden shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-20 bg-purple-500"></div>
              <div className="relative z-10">
                <h3 className="text-[10px] md:text-xs font-black text-gray-900 mb-3 md:mb-4 flex items-center justify-center gap-1.5 uppercase tracking-wide">
                  <Award className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                  <span className="hidden sm:inline">Emblemas</span>
                </h3>
                <motion.div 
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4 relative shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${colors?.orb1 || colors?.primary}, ${colors?.primary})` }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-white opacity-20 rounded-2xl"></div>
                  <Trophy className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white relative z-10 filter drop-shadow-lg" />
                </motion.div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-1" style={{ color: colors?.primary }}>
                  {allEarnedBadges.length}
                </div>
                <p className="text-[9px] md:text-xs text-gray-500 font-medium">de {allPossibleBadges.length}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 2. TAB SWITCHER - Sistema de Abas */}
        <div className="flex justify-center">
          <div className="inline-flex bg-white rounded-2xl p-2 shadow-xl border border-gray-200">
            <button
              onClick={() => setActiveRanking('global')}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all ${
                activeRanking === 'global'
                  ? `bg-gradient-to-r ${colors?.gradient || 'from-yellow-400 to-orange-500'} text-white shadow-lg`
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Rank Global
            </button>
            <button
              onClick={() => setActiveRanking('walkers')}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all ${
                activeRanking === 'walkers'
                  ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Top Passeadores
            </button>
            <button
              onClick={() => setActiveRanking('quality')}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all ${
                activeRanking === 'quality'
                  ? 'bg-gradient-to-r from-pink-400 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Cães Felizes
            </button>
          </div>
        </div>

        {/* 3. PÓDIO ADAPTATIVO */}
        <Card className="glass-panel border-0 shadow-2xl overflow-hidden">
          <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Trophy className={`w-7 h-7 ${currentConfig.accentColor}`} />
              {currentConfig.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {/* Pódio Visual Adaptativo */}
            {rankedData.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">Nenhum dado disponível para este ranking</p>
              </div>
            ) : (
            <div className="flex items-end justify-center gap-3 md:gap-6 mb-8 mt-6 md:mt-8 max-w-5xl mx-auto px-2">
              {/* 2º Lugar */}
              {rankedData[1] && (
                <motion.div
                  key={`second-${activeRanking}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center w-32"
                >
                  <div className="relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-4 border-gray-400 overflow-hidden shadow-lg bg-white aspect-square">
                      {rankedData[1].profile_photo_url ? (
                        <img src={rankedData[1].profile_photo_url} className="w-full h-full object-cover aspect-square" alt={rankedData[1].full_name} />
                      ) : (
                        <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-xl md:text-2xl font-bold">
                          {rankedData[1].full_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 md:w-8 md:h-8 bg-gray-400 rounded-lg flex items-center justify-center text-white font-bold shadow-lg text-sm">
                      2
                    </div>
                  </div>
                  <div className="mt-2 md:mt-3 bg-gradient-to-b from-gray-400 to-gray-500 text-white rounded-xl px-3 md:px-6 py-3 md:py-4 text-center shadow-lg h-28 md:h-32 flex flex-col justify-center w-full">
                    <Medal className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1" />
                    <p className="font-bold text-xs md:text-sm truncate">{rankedData[1].full_name}</p>
                    <p className="text-[10px] md:text-xs opacity-90">{currentConfig.formatMetric(rankedData[1][currentConfig.metricKey], rankedData[1])}</p>
                  </div>
                </motion.div>
              )}

              {/* 1º Lugar (Centro, Mais Alto) */}
              {rankedData[0] && (
                <motion.div
                  key={`first-${activeRanking}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center relative w-40"
                >
                  {/* Royal Crown - Emoji Style */}
                  <div className="absolute -top-10 md:-top-12 left-1/2 -translate-x-1/2 z-30">
                    <motion.div
                      className="relative w-12 h-12 md:w-14 md:h-14"
                      animate={{
                        y: [-3, 0, -3]
                      }}
                      transition={{
                        y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }}
                    >
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-yellow-400 opacity-40 blur-xl rounded-full"></div>
                      
                      {/* Crown SVG */}
                      <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-2xl relative z-10">
                        <defs>
                          <linearGradient id="gold-main" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FFD700"/>
                            <stop offset="50%" stopColor="#FFC700"/>
                            <stop offset="100%" stopColor="#FFA500"/>
                          </linearGradient>
                          <radialGradient id="jewel-red">
                            <stop offset="0%" stopColor="#FF6B9D"/>
                            <stop offset="100%" stopColor="#DC143C"/>
                          </radialGradient>
                        </defs>
                        
                        {/* Crown base/band */}
                        <ellipse cx="32" cy="48" rx="22" ry="5" fill="#B8860B" opacity="0.4"/>
                        <rect x="10" y="40" width="44" height="8" fill="url(#gold-main)" rx="2" stroke="#DAA520" strokeWidth="1"/>
                        
                        {/* Crown points/peaks */}
                        <path d="M 10 40 L 15 18 L 20 40" fill="url(#gold-main)" stroke="#DAA520" strokeWidth="1"/>
                        <path d="M 20 40 L 27 22 L 34 40" fill="url(#gold-main)" stroke="#DAA520" strokeWidth="1"/>
                        <path d="M 34 40 L 37 22 L 44 40" fill="url(#gold-main)" stroke="#DAA520" strokeWidth="1"/>
                        <path d="M 44 40 L 49 18 L 54 40" fill="url(#gold-main)" stroke="#DAA520" strokeWidth="1"/>
                        
                        {/* Center peak (tallest) */}
                        <path d="M 27 22 L 32 12 L 37 22" fill="url(#gold-main)" stroke="#DAA520" strokeWidth="1"/>
                        
                        {/* Precious gems */}
                        <circle cx="32" cy="12" r="3.5" fill="url(#jewel-red)" opacity="0.95"/>
                        <circle cx="32" cy="12" r="1.5" fill="#FFD1DC" opacity="0.8"/>
                        <circle cx="15" cy="18" r="2.5" fill="#4169E1" opacity="0.9"/>
                        <circle cx="49" cy="18" r="2.5" fill="#32CD32" opacity="0.9"/>
                        
                        {/* Decorative shine */}
                        <path d="M 32 10 L 32.5 12 L 32 14" stroke="white" strokeWidth="0.5" opacity="0.8"/>
                        <circle cx="28" cy="15" r="0.5" fill="white" opacity="0.7"/>
                        <circle cx="36" cy="15" r="0.5" fill="white" opacity="0.7"/>
                      </svg>
                    </motion.div>
                  </div>
                  
                  <div className="relative">
                    <div className={`w-20 h-20 md:w-28 md:h-28 rounded-xl border-4 overflow-hidden shadow-2xl bg-white ring-4 aspect-square ${
                      activeRanking === 'global' ? 'border-yellow-500 ring-yellow-200' :
                      activeRanking === 'walkers' ? 'border-green-500 ring-green-200' :
                      'border-pink-500 ring-pink-200'
                    }`}>
                      {rankedData[0].profile_photo_url ? (
                        <img src={rankedData[0].profile_photo_url} className="w-full h-full object-cover aspect-square" alt={rankedData[0].full_name} />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold ${
                          activeRanking === 'global' ? 'bg-yellow-500' :
                          activeRanking === 'walkers' ? 'bg-green-500' :
                          'bg-pink-500'
                        }`}>
                          {rankedData[0].full_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br ${currentConfig.podiumColor} rounded-lg flex items-center justify-center text-white font-black shadow-lg text-base md:text-lg`}>
                      1
                    </div>
                  </div>
                  <div className={`mt-2 md:mt-4 bg-gradient-to-b ${currentConfig.podiumColor} text-white rounded-2xl px-4 md:px-8 py-4 md:py-6 text-center shadow-2xl h-36 md:h-40 flex flex-col justify-center w-full`}>
                    <Trophy className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2" />
                    <p className="font-black text-sm md:text-lg truncate">{rankedData[0].full_name}</p>
                    <p className="text-xs md:text-sm opacity-95 font-bold">{currentConfig.formatMetric(rankedData[0][currentConfig.metricKey], rankedData[0])}</p>
                    {activeRanking === 'global' && (
                      <Badge className="mt-1 md:mt-2 bg-white/30 text-white border-0 text-xs">
                        {calculateTier(rankedData[0].gamification_xp || 0).icon} Nv.{calculateTier(rankedData[0].gamification_xp || 0).level} {calculateTier(rankedData[0].gamification_xp || 0).name}
                      </Badge>
                    )}
                    {activeRanking === 'walkers' && rankedData[0].unique_dogs > 0 && (
                      <Badge className="mt-1 md:mt-2 bg-white/30 text-white border-0 text-xs">
                        🐕 {rankedData[0].unique_dogs} cães únicos
                      </Badge>
                    )}
                  </div>
                </motion.div>
              )}

              {/* 3º Lugar */}
              {rankedData[2] && (
                <motion.div
                  key={`third-${activeRanking}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center w-32"
                >
                  <div className="relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border-4 border-orange-600 overflow-hidden shadow-lg bg-white aspect-square">
                      {rankedData[2].profile_photo_url ? (
                        <img src={rankedData[2].profile_photo_url} className="w-full h-full object-cover aspect-square" alt={rankedData[2].full_name} />
                      ) : (
                        <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white text-xl md:text-2xl font-bold">
                          {rankedData[2].full_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 md:w-8 md:h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg text-sm">
                      3
                    </div>
                  </div>
                  <div className="mt-2 md:mt-3 bg-gradient-to-b from-orange-500 to-orange-600 text-white rounded-xl px-3 md:px-6 py-3 md:py-4 text-center shadow-lg h-28 md:h-32 flex flex-col justify-center w-full">
                    <Medal className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1" />
                    <p className="font-bold text-xs md:text-sm truncate">{rankedData[2].full_name}</p>
                    <p className="text-[10px] md:text-xs opacity-90">{currentConfig.formatMetric(rankedData[2][currentConfig.metricKey], rankedData[2])}</p>
                  </div>
                </motion.div>
              )}
            </div>
            )}

            {/* Resto do Ranking (4º-10º) */}
            {rankedData.length > 3 && (
            <div className="space-y-2">
              {rankedData.slice(3, 10).map((rankUser, idx) => (
                <div
                  key={rankUser.id || rankUser.email}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-bold text-gray-600">
                    {idx + 4}
                  </div>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200 aspect-square">
                    {rankUser.profile_photo_url ? (
                      <img src={rankUser.profile_photo_url} className="w-full h-full object-cover aspect-square" alt={rankUser.full_name} />
                    ) : (
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {rankUser.full_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{rankUser.full_name}</p>
                    {activeRanking === 'global' && (
                      <p className="text-xs text-gray-600">Nível {rankUser.gamification_level || 1}</p>
                    )}
                    {activeRanking === 'walkers' && (
                      <p className="text-xs text-gray-600">Walker Verificado</p>
                    )}
                    {activeRanking === 'quality' && (
                      <p className="text-xs text-gray-600">🐾 Cão Feliz</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${currentConfig.accentColor}`}>
                      {currentConfig.formatMetric(rankUser[currentConfig.metricKey], rankUser)}
                    </p>
                    <p className="text-xs text-gray-500">{currentConfig.metricLabel}</p>
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* Posição do Usuário (se fora do Top 10) */}
            {rankedData.length > 0 && userRank > 10 && (
              <div className="mt-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold">
                    {userRank}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Você está em {userRank}º lugar</p>
                    <p className="text-sm opacity-90">{currentXP.toLocaleString('pt-PT')} XP</p>
                  </div>
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. GALERIA DE EMBLEMAS */}
        <Card className="glass-panel border-0 shadow-2xl">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-gray-900">Galeria de Emblemas</h2>
                  <p className="text-xs text-gray-600 font-medium">Desbloqueie conquistas através das suas atividades</p>
                </div>
              </CardTitle>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg px-4 py-2 text-sm font-bold">
                {allEarnedBadges.length}/{allPossibleBadges.length}
              </Badge>
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {['all', 'social', 'activity', 'milestone', 'special'].map(cat => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={activeCategory === cat ? `bg-gradient-to-r ${colors?.gradient || 'from-purple-600 to-purple-600'} text-white border-0 shadow-lg font-bold` : "font-semibold"}
                >
                  {cat === 'all' && 'Todos'}
                  {cat === 'social' && 'Social'}
                  {cat === 'activity' && 'Atividade'}
                  {cat === 'milestone' && 'Marcos'}
                  {cat === 'special' && 'Especial'}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {filteredBadges.map((badge) => {
                const isEarned = earnedBadgeIds.includes(badge.id);
                const earnedBadge = allEarnedBadges.find(b => b.badge_id === badge.id);
                
                return (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: isEarned ? 1.05 : 1 }}
                    className={`relative group ${!isEarned ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`p-4 rounded-2xl text-center transition-all ${
                      isEarned 
                        ? 'bg-gradient-to-br from-white to-purple-50 border-2 border-purple-300 shadow-md hover:shadow-xl' 
                        : 'bg-gray-100 border-2 border-gray-300 grayscale opacity-50'
                    }`}>
                      {/* Lock icon for locked badges */}
                      {!isEarned && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                          <Lock className="w-4 h-4 text-white" />
                        </div>
                      )}
                      
                      <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                        {badge.image_url ? (
                          <img src={badge.image_url} className="w-full h-full rounded-lg object-cover" alt={badge.name} />
                        ) : (
                          <div className="text-4xl">{badge.icon}</div>
                        )}
                      </div>
                      <p className="font-bold text-xs mb-1 line-clamp-1">{badge.name}</p>
                      
                      {/* Rarity Badge */}
                      <Badge className={`text-[10px] ${
                        badge.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        badge.rarity === 'epic' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                        badge.rarity === 'rare' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                        'bg-gray-400'
                      } text-white border-0`}>
                        {badge.rarity}
                      </Badge>
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-[200px]">
                          <p className="font-bold mb-1">{badge.name}</p>
                          <p className="text-[10px] opacity-90 mb-2">{badge.desc}</p>
                          {isEarned && earnedBadge?.earned_date && (
                            <p className="text-[10px] text-green-300">
                              ✓ Conquistado: {new Date(earnedBadge.earned_date).toLocaleDateString('pt-PT')}
                            </p>
                          )}
                          {!isEarned && (
                            <p className="text-[10px] text-yellow-300">
                              🔒 Como ganhar: {badge.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Call to Actions - Professional */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="glass-panel border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => navigate(createPageUrl('SocialFeed'))}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg mb-1 text-gray-900">Explorar Comunidade</h3>
                  <p className="text-sm text-gray-600 font-medium">Interaja e ganhe experiência</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => navigate(createPageUrl('Home'))}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg mb-1 text-gray-900">Agendar Passeio</h3>
                  <p className="text-sm text-gray-600 font-medium">+100 XP por passeio completo</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}