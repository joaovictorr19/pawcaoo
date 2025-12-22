import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy, Award, Lock, Sparkles, 
  Star, TrendingUp, Users, ChevronRight, Wallet
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTheme } from "@/components/ThemeContext";
import { calculateTier, getTierColor, TIER_COLORS_BY_LEVEL } from "@/components/gamification/tierSystem";
import LevelDonut from "@/components/gamification/LevelDonut";
import PodiumDisplay from "@/components/gamification/PodiumDisplay";
import RankingList from "@/components/gamification/RankingList";

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

  // DEBUG: Log tier info
  console.log('🎯 Gamification Debug:', {
    currentXP,
    currentLevel,
    tierName: currentTier.name,
    tierIcon: currentTier.icon,
    tierRange: currentTier.tierRange
  });

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

  // Cor do nível atual usando o novo sistema Espectro
  const levelColor = getTierColor(currentLevel);

  return (
    <div className="min-h-screen pb-8 relative">
    {/* 1. HERO SECTION - Modern Transparent */}
    <div className="relative overflow-hidden mb-8">
        {/* Transparent glass background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-purple-50/10 to-blue-50/10"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-16 relative z-10">
          {/* Header Title - Compacto Mobile */}
          <motion.div 
            className="text-center mb-6 md:mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Carteira flutuante - fora do fluxo do título */}
            <motion.button
              onClick={() => navigate(createPageUrl('MyWallet'))}
              className="absolute right-4 md:right-8 top-6 md:top-8 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border-2 backdrop-blur-sm z-30"
              style={{ 
                background: 'rgba(255,255,255,0.95)', 
                borderColor: `${levelColor}40`
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Wallet className="w-4 h-4" style={{ color: levelColor }} />
              <span className="text-sm font-black" style={{ color: levelColor }}>
                €{(userWallet?.cashback_balance || 0).toFixed(2)}
              </span>
            </motion.button>

            <div className="flex items-center justify-center gap-2 md:gap-3 mb-2 md:mb-4 pt-2">
              <div 
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)` }}
              >
                <Trophy className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <h1 className="text-2xl md:text-6xl font-black tracking-tight text-slate-800">
                Hall da Fama
              </h1>
            </div>
            
            <p className="text-xs md:text-base text-gray-600 font-medium max-w-2xl mx-auto">
              Recompensas e Rankings da Comunidade
            </p>
          </motion.div>

          {/* MOBILE: Layout Compacto em 1 Card Principal */}
          <div className="md:hidden mb-6">
            <motion.div 
              className="rounded-3xl relative overflow-hidden shadow-2xl"
              style={{ 
                background: `linear-gradient(135deg, ${levelColor}15, white 40%, ${levelColor}08)`,
                border: `2px solid ${levelColor}30`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Glow effects */}
              <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-30" 
                   style={{ background: levelColor }}></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" 
                   style={{ background: levelColor }}></div>
              
              <div className="relative z-10 p-5">
                {/* Linha Principal: Donut + Info */}
                <div className="flex items-center gap-4">
                  {/* Mini Donut */}
                  <div className="flex-shrink-0">
                    <LevelDonut 
                      level={currentLevel} 
                      progress={tierProgressPercentage} 
                      size={100}
                      strokeWidth={10}
                    />
                  </div>
                  
                  {/* Info Stack */}
                  <div className="flex-1 min-w-0">
                    {/* Tier Name */}
                    <div 
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black mb-2"
                      style={{ background: `${levelColor}20`, color: levelColor }}
                    >
                      <Star className="w-3 h-3" />
                      {currentTier.name}
                    </div>
                    
                    {/* XP Display */}
                    <div className="mb-2">
                      <div className="text-3xl font-black tracking-tight" style={{ color: levelColor }}>
                        {currentXP.toLocaleString('pt-PT')} <span className="text-lg opacity-70">XP</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-semibold">
                        +{xpRemainingForNextLevel} XP para Nível {currentLevel + 1}
                      </div>
                    </div>
                    
                    {/* Progress Bar Mini */}
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${tierProgressPercentage}%`,
                          background: `linear-gradient(90deg, ${levelColor}, ${levelColor}cc)`
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Linha de Conquistas */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: `${levelColor}20` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)` }}
                      >
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-semibold">Conquistas</div>
                        <div className="text-lg font-black" style={{ color: levelColor }}>
                          {allEarnedBadges.length}<span className="text-sm text-gray-400 font-medium">/{allPossibleBadges.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview das últimas 3 badges */}
                    <div className="flex -space-x-2">
                      {allEarnedBadges.slice(0, 3).map((badge, idx) => (
                        <div 
                          key={idx}
                          className="w-8 h-8 rounded-lg bg-white border-2 flex items-center justify-center text-lg shadow-sm"
                          style={{ borderColor: `${levelColor}30` }}
                        >
                          {badge.icon || '🏆'}
                        </div>
                      ))}
                      {allEarnedBadges.length > 3 && (
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm"
                          style={{ background: levelColor, color: 'white' }}
                        >
                          +{allEarnedBadges.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* DESKTOP: Grid de 4 Cards (mantém original mas melhorado) */}
          <div className="hidden md:grid md:grid-cols-4 gap-6 items-stretch mb-8 max-w-6xl mx-auto">
            {/* Card 1: Donut Chart de Nível */}
            <motion.div 
              className="rounded-3xl relative overflow-hidden shadow-xl"
              style={{ 
                background: `linear-gradient(145deg, white, ${levelColor}08)`,
                border: `2px solid ${levelColor}25`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-25" 
                   style={{ background: levelColor }}></div>
              <div className="relative z-10 p-7">
                <h3 className="text-sm font-black mb-5 flex items-center gap-2 uppercase tracking-wide" style={{ color: levelColor }}>
                  <Star className="w-5 h-5" />
                  Nível Atual
                </h3>
                
                <div className="flex justify-center">
                  <LevelDonut 
                    level={currentLevel} 
                    progress={tierProgressPercentage} 
                    size={140}
                    strokeWidth={12}
                  />
                </div>

                <div className="mt-4 text-center">
                  <div 
                    className="text-sm font-bold truncate px-4 py-1.5 rounded-full inline-block"
                    style={{ color: levelColor, backgroundColor: `${levelColor}15` }}
                  >
                    {currentTier.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    +{xpRemainingForNextLevel} XP → Nível {currentLevel + 1}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Card 2: XP Total */}
            <motion.div 
              className="rounded-3xl relative overflow-hidden shadow-xl"
              style={{ 
                background: `linear-gradient(145deg, white, ${levelColor}08)`,
                border: `2px solid ${levelColor}25`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" 
                   style={{ background: levelColor }}></div>
              <div className="relative z-10 p-7">
                <h3 className="text-sm font-black mb-5 flex items-center gap-2 uppercase tracking-wide" style={{ color: levelColor }}>
                  <Sparkles className="w-5 h-5" />
                  Experiência
                </h3>
                
                <div 
                  className="text-center rounded-2xl p-5 mb-3"
                  style={{ background: `linear-gradient(135deg, ${levelColor}12, ${levelColor}05)` }}
                >
                  <div className="text-4xl font-black tracking-tighter leading-none" style={{ color: levelColor }}>
                    {currentXP.toLocaleString('pt-PT')}
                  </div>
                  <div className="text-xs text-gray-600 font-bold uppercase tracking-wide mt-2">XP Total</div>
                </div>
                
                {/* Progress bar */}
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ 
                      width: `${tierProgressPercentage}%`,
                      background: `linear-gradient(90deg, ${levelColor}, ${levelColor}aa)`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center font-semibold">
                  {tierProgressPercentage}/100 XP neste nível
                </div>
              </div>
            </motion.div>

            {/* Card 3: Carteira */}
            <motion.div 
              className="rounded-3xl relative overflow-hidden shadow-xl cursor-pointer group"
              style={{ 
                background: `linear-gradient(145deg, white, ${levelColor}08)`,
                border: `2px solid ${levelColor}25`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate(createPageUrl('MyWallet'))}
              whileHover={{ scale: 1.02 }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: levelColor }}></div>
              <div className="relative z-10 p-7">
                <h3 className="text-sm font-black mb-5 flex items-center gap-2 uppercase tracking-wide" style={{ color: levelColor }}>
                  <Wallet className="w-5 h-5" />
                  Carteira
                </h3>
                
                <div 
                  className="text-center rounded-2xl p-5"
                  style={{ background: `linear-gradient(135deg, ${levelColor}12, ${levelColor}05)` }}
                >
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-black" style={{ color: levelColor }}>€</span>
                    <span className="text-5xl font-black tracking-tighter" style={{ color: levelColor }}>
                      {Math.floor(userWallet?.cashback_balance || 0)}
                    </span>
                    <span className="text-2xl font-bold opacity-60" style={{ color: levelColor }}>
                      .{((userWallet?.cashback_balance || 0) % 1).toFixed(2).substring(2)}
                    </span>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wide mt-2 opacity-70" style={{ color: levelColor }}>
                    Cashback
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors font-semibold flex items-center justify-center gap-1">
                    Ver Carteira <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Badges */}
            <motion.div 
              className="rounded-3xl text-center relative overflow-hidden shadow-xl"
              style={{ 
                background: `linear-gradient(145deg, white, ${levelColor}08)`,
                border: `2px solid ${levelColor}25`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ background: levelColor }}></div>
              <div className="relative z-10 p-7">
                <h3 className="text-sm font-black mb-5 flex items-center justify-center gap-2 uppercase tracking-wide" style={{ color: levelColor }}>
                  <Award className="w-5 h-5" />
                  Conquistas
                </h3>
                
                <motion.div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 relative shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)` }}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <div className="absolute inset-0 bg-white opacity-20 rounded-2xl"></div>
                  <Trophy className="w-10 h-10 text-white relative z-10" />
                </motion.div>
                
                <div className="text-5xl font-black tracking-tighter mb-1" style={{ color: levelColor }}>
                  {allEarnedBadges.length}
                </div>
                <p className="text-xs text-gray-500 font-semibold">de {allPossibleBadges.length} emblemas</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 2. TAB SWITCHER - Sistema de Abas (Mobile Friendly) */}
        <div className="flex justify-center overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="inline-flex bg-white rounded-2xl p-1.5 md:p-2 shadow-xl border border-gray-200 min-w-max">
            <button
              onClick={() => setActiveRanking('global')}
              className={`px-4 md:px-8 py-2.5 md:py-3.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                activeRanking === 'global'
                  ? `bg-gradient-to-r ${colors?.gradient || 'from-yellow-400 to-orange-500'} text-white shadow-lg`
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🏆 Global
            </button>
            <button
              onClick={() => setActiveRanking('walkers')}
              className={`px-4 md:px-8 py-2.5 md:py-3.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                activeRanking === 'walkers'
                  ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🐕 Passeadores
            </button>
            <button
              onClick={() => setActiveRanking('quality')}
              className={`px-4 md:px-8 py-2.5 md:py-3.5 rounded-xl font-bold text-xs md:text-sm transition-all whitespace-nowrap ${
                activeRanking === 'quality'
                  ? 'bg-gradient-to-r from-pink-400 to-pink-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🦴 Cães Felizes
            </button>
          </div>
        </div>

        {/* 3. PÓDIO ADAPTATIVO - NOVO DESIGN */}
        <Card className="glass-panel border-0 shadow-2xl overflow-hidden">
          <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Trophy className={`w-7 h-7 ${currentConfig.accentColor}`} />
              {currentConfig.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {/* Pódio Visual - Novo Componente */}
            {rankedData.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold">Nenhum dado disponível para este ranking</p>
              </div>
            ) : (
              <>
                <PodiumDisplay 
                  rankedData={rankedData}
                  rankingType={activeRanking}
                  formatMetric={(user) => currentConfig.formatMetric(user[currentConfig.metricKey], user)}
                />

                {/* Lista 4º-10º - Novo Componente */}
                {rankedData.length > 3 && (
                  <RankingList
                    rankedData={rankedData}
                    startRank={4}
                    endRank={10}
                    rankingType={activeRanking}
                    formatMetric={(user) => currentConfig.formatMetric(user[currentConfig.metricKey], user)}
                    metricLabel={currentConfig.metricLabel}
                  />
                )}
              </>
            )}

            {/* Posição do Usuário (se fora do Top 10) */}
            {rankedData.length > 0 && userRank > 10 && (
              <div 
                className="mt-6 text-white rounded-xl p-4 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${levelColor}, ${levelColor}cc)` }}
              >
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
                  className={activeCategory === cat ? "text-white border-0 shadow-lg font-bold" : "font-semibold"}
                  style={activeCategory === cat ? { background: levelColor } : {}}
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