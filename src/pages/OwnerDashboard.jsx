import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Heart, Calendar, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { calculateTier } from "@/components/gamification/gamificationRules";
import { toast } from "sonner";

export default function OwnerDashboard({ user: propUser }) {
  const navigate = useNavigate();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    enabled: !propUser,
    initialData: propUser
  });

  const { data: loyaltyPoints, refetch: refetchLoyalty } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({ user_email: user.email });
      return points[0] || { points_balance: 0, total_earned: 0, tier: 'bronze' };
    },
    enabled: !!user,
  });

  // AUTO-FIX: Correct tier based on level AND points
  React.useEffect(() => {
    const fixTier = async () => {
      if (!loyaltyPoints || !user?.email) return;
      
      const currentPoints = loyaltyPoints.points_balance || 0;
      const currentLevel = user?.gamification_level || 1;
      const currentTier = loyaltyPoints.tier?.toLowerCase() || 'bronze';
      
      // Determine correct tier based on level OR points (whichever is higher)
      let correctTier = 'bronze';
      if (currentLevel >= 15 || currentPoints >= 6000) {
        correctTier = 'gold';
      } else if (currentLevel >= 5 || currentPoints >= 2000) {
        correctTier = 'silver';
      }
      
      // Also check points-based tiers from calculateTier
      const pointsBasedTier = calculateTier(currentPoints);
      if (pointsBasedTier === 'gold' || pointsBasedTier === 'sapphire' || pointsBasedTier === 'diamond') {
        correctTier = pointsBasedTier;
      } else if (correctTier === 'bronze' && pointsBasedTier === 'silver') {
        correctTier = 'silver';
      }
      
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
  }, [loyaltyPoints?.points_balance, user?.gamification_level, user?.email]);

  // Gamification Data
  const currentXP = user?.gamification_xp || 0;
  const currentLevel = user?.gamification_level || 1;
  const points = loyaltyPoints?.points_balance || 0;
  
  // Determine tier based on level OR points
  let userTier = 'bronze';
  if (currentLevel >= 15 || points >= 6000) {
    userTier = 'gold';
  } else if (currentLevel >= 5 || points >= 2000) {
    userTier = 'silver';
  }
  
  // Also check points-based calculation
  const pointsBasedTier = calculateTier(points);
  if (['sapphire', 'diamond', 'platinum'].includes(pointsBasedTier)) {
    userTier = pointsBasedTier;
  } else if (userTier === 'bronze' && pointsBasedTier === 'silver') {
    userTier = 'silver';
  } else if ((userTier === 'bronze' || userTier === 'silver') && pointsBasedTier === 'gold') {
    userTier = 'gold';
  }

  // XP Progress
  const nextLevelXP = currentLevel * 500;
  const currentLevelStartXP = (currentLevel - 1) * 500;
  const xpInCurrentLevel = currentXP - currentLevelStartXP;
  const xpNeededForNext = nextLevelXP - currentLevelStartXP;
  const xpProgress = Math.min((xpInCurrentLevel / xpNeededForNext) * 100, 100);
  
  // Tier Names
  const tierNames = {
    bronze: 'Bronze',
    silver: 'Prata',
    gold: 'Ouro',
    sapphire: 'Safira',
    diamond: 'Diamante',
    platinum: 'Platina'
  };
  
  // Tier Colors for Progress Bar
  const tierColors = {
    bronze: 'from-orange-400 to-yellow-500',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    sapphire: 'from-blue-400 to-cyan-500',
    diamond: 'from-purple-400 to-pink-500',
    platinum: 'from-purple-500 to-pink-600'
  };

  // Count-up animation state
  const [displayedXP, setDisplayedXP] = React.useState(0);
  const [progressWidth, setProgressWidth] = React.useState(0);

  // Animated count-up effect for XP
  React.useEffect(() => {
    if (!currentXP) return;
    const duration = 1000;
    const steps = 60;
    const increment = currentXP / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= currentXP) {
        setDisplayedXP(currentXP);
        clearInterval(timer);
      } else {
        setDisplayedXP(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [currentXP]);

  // Animated progress bar
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setProgressWidth(xpProgress);
    }, 100);
    return () => clearTimeout(timer);
  }, [xpProgress]);

  if (loadingUser || !user) return null;

  // FORCE tier calculation based on points (Frontend Override)
  const getTierData = (points) => {
    if (points >= 6000) return { name: 'Safira', color: 'from-blue-700 via-indigo-600 to-purple-700', icon: '💎' };
    if (points >= 3000) return { name: 'Ouro', color: 'from-yellow-500 via-amber-400 to-yellow-600', icon: '👑' };
    if (points >= 1000) return { name: 'Prata', color: 'from-slate-400 via-gray-300 to-slate-500', icon: '⚔️' };
    return { name: 'Bronze', color: 'from-orange-600 to-orange-400', icon: '🛡️' };
  };
  
  const currentTier = getTierData(points || 0);
  const cardGradient = `bg-gradient-to-r ${currentTier.color}`;

  return (
    <div className="space-y-4">
      {/* Hero Gamification Card - Vibrant Gradient with Decorative Bubbles */}
      <div className={`${cardGradient} text-white rounded-2xl shadow-lg p-6 relative overflow-hidden`}>
        {/* Decorative Bubbles (Glassmorphism Effect) */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white opacity-5 rounded-full blur-xl"></div>
        
        {/* Content Layer (above bubbles) */}
        <div className="relative z-10">
          {/* Linha 1: Boas-vindas + XP */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-white mb-1">
              Olá, {user.full_name?.split(' ')[0] || 'Utilizador'} {currentTier.icon}
            </h2>
            <p className="text-sm text-white/80">
              Nível {currentLevel} • {displayedXP.toLocaleString()} XP • {currentTier.name}
            </p>
          </div>

          {/* Linha 2: Barra de Progresso Slim com Animação */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-white/70">
                Progresso para Nível {currentLevel + 1}
              </span>
              <span className="text-xs text-white/90 font-semibold">{Math.round(xpProgress)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white/90 transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>

          {/* Linha 3: Hall da Fama (5 Emblemas) */}
          {user?.achievements_badges && user.achievements_badges.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-white/70 uppercase font-semibold tracking-wide mb-2">
                Conquistas Recentes
              </p>
              <div className="flex flex-row gap-3 overflow-x-auto pb-1">
                {user.achievements_badges
                  .sort((a, b) => new Date(b.earned_date) - new Date(a.earned_date))
                  .slice(0, 5)
                  .map((badge, i) => (
                    <div 
                      key={i} 
                      className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl ring-2 ring-white/30 hover:ring-white/60 transition-all cursor-default"
                      title={badge.name}
                    >
                      {badge.icon || '🏅'}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Linha 4: Grid de Ações (Botões Dark Slate Premium - SEMPRE 3 COLUNAS) */}
      <div className="grid grid-cols-3 gap-4 w-full">
        <button
          onClick={() => navigate(createPageUrl('Favorites'))}
          className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-slate-700 to-slate-800 hover:bg-slate-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 border-t border-slate-600"
        >
          <Heart className="w-5 h-5 text-white" strokeWidth={1.5} />
          <span className="text-xs font-medium text-white">Favoritos</span>
        </button>

        <button
          onClick={() => navigate(createPageUrl('Gamification'))}
          className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-slate-700 to-slate-800 hover:bg-slate-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 border-t border-slate-600"
        >
          <Trophy className="w-5 h-5 text-white" strokeWidth={1.5} />
          <span className="text-xs font-medium text-white">Conquistas</span>
        </button>

        <button
          onClick={() => navigate(createPageUrl('MyBookings'))}
          className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-slate-700 to-slate-800 hover:bg-slate-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 border-t border-slate-600"
        >
          <Calendar className="w-5 h-5 text-white" strokeWidth={1.5} />
          <span className="text-xs font-medium text-white">Histórico</span>
        </button>
      </div>
    </div>
  );
}