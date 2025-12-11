import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, Heart, Calendar } from "lucide-react";
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

  if (loadingUser || !user) return null;

  return (
    <div className="space-y-4">
      {/* Linha 1: Boas-vindas */}
      <div>
        <h2 className="text-2xl font-sans text-gray-800">
          Olá, {user.full_name?.split(' ')[0] || 'Utilizador'}
        </h2>
      </div>

      {/* Linha 2: Barra de Progresso Slim + Tier */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">
            Nível {currentLevel} • {tierNames[userTier]}
          </span>
          <span className="text-xs text-gray-500">{Math.round(xpProgress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${tierColors[userTier]} transition-all duration-500`}
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Linha 3: Hall da Fama (5 Emblemas Mais Recentes) */}
      {user?.achievements_badges && user.achievements_badges.length > 0 && (
        <div className="flex items-center gap-2">
          {user.achievements_badges
            .sort((a, b) => new Date(b.earned_date) - new Date(a.earned_date))
            .slice(0, 5)
            .map((badge, i) => (
              <div 
                key={i} 
                className="text-2xl"
                title={badge.name}
              >
                {badge.icon || '🏅'}
              </div>
            ))}
        </div>
      )}

      {/* Linha 4: Grid de Ações (Botões Horizontais) */}
      <div className="grid grid-cols-3 gap-4 w-full">
        <button
          onClick={() => navigate(createPageUrl('Home'))}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100"
        >
          <Search className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
          <span className="text-xs font-medium text-gray-700">Explorar</span>
        </button>

        <button
          onClick={() => navigate(createPageUrl('Favorites'))}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100"
        >
          <Heart className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
          <span className="text-xs font-medium text-gray-700">Favoritos</span>
        </button>

        <button
          onClick={() => navigate(createPageUrl('MyBookings'))}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-100"
        >
          <Calendar className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
          <span className="text-xs font-medium text-gray-700">Reservas</span>
        </button>
      </div>
    </div>
  );
}