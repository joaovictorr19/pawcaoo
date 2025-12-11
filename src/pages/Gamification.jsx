import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, Crown, Medal, Award, Lock, Sparkles, 
  Star, TrendingUp, Users, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function Gamification() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users
        .filter(u => u.gamification_xp > 0)
        .sort((a, b) => (b.gamification_xp || 0) - (a.gamification_xp || 0));
    },
  });

  // Tier calculation based on XP
  const getTierData = (xp) => {
    if (xp >= 6000) return { name: 'Safira', color: 'from-blue-700 via-indigo-600 to-purple-700', bgColor: 'from-blue-600 to-purple-600', icon: '💎', chartColor: '#3b82f6' };
    if (xp >= 3000) return { name: 'Ouro', color: 'from-yellow-500 via-amber-400 to-yellow-600', bgColor: 'from-yellow-500 to-orange-500', icon: '👑', chartColor: '#f59e0b' };
    if (xp >= 1000) return { name: 'Prata', color: 'from-slate-400 via-gray-300 to-slate-500', bgColor: 'from-gray-400 to-slate-500', icon: '⚔️', chartColor: '#94a3b8' };
    return { name: 'Bronze', color: 'from-orange-600 to-orange-400', bgColor: 'from-orange-500 to-orange-400', icon: '🛡️', chartColor: '#f97316' };
  };

  const currentXP = user?.gamification_xp || 0;
  const currentLevel = user?.gamification_level || 1;
  const currentTier = getTierData(currentXP);

  // XP Progress calculation
  const xpPerLevel = 500;
  const xpInCurrentLevel = currentXP - ((currentLevel - 1) * xpPerLevel);
  const xpProgressPercentage = Math.min((xpInCurrentLevel / xpPerLevel) * 100, 100);

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

  // Combine system badges with earned custom badges for display
  const customEarnedBadges = (user?.public_badges || []).map(badge => ({
    id: badge.badge_id,
    name: badge.name,
    desc: badge.description,
    icon: badge.icon,
    image_url: badge.image_url,
    category: badge.category || 'special',
    rarity: badge.rarity || 'rare'
  }));

  const allBadgesForDisplay = [...allPossibleBadges, ...customEarnedBadges];

  // Filter by category
  const filteredBadges = activeCategory === "all" 
    ? allBadgesForDisplay 
    : allBadgesForDisplay.filter(b => b.category === activeCategory);

  // User rank
  const userRank = allUsers.findIndex(u => u.email === user?.email) + 1;

  // Donut chart data
  const chartData = [
    { name: 'Progress', value: xpInCurrentLevel },
    { name: 'Remaining', value: Math.max(0, xpPerLevel - xpInCurrentLevel) }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pb-8">
      {/* 1. HERO SECTION - Motor de Pontos */}
      <div className={`bg-gradient-to-r ${currentTier.bgColor} text-white relative overflow-hidden`}>
        {/* Decorative bubbles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Esquerda: Donut Chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="rgba(255,255,255,0.9)" />
                      <Cell fill="rgba(255,255,255,0.2)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl mb-1">{currentTier.icon}</div>
                    <div className="text-xs font-semibold opacity-90">{Math.round(xpProgressPercentage)}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Meio: Stats Principais */}
            <div className="text-center">
              <h1 className="text-5xl font-black mb-2">Nível {currentLevel}</h1>
              <p className="text-2xl font-bold mb-1">{currentTier.icon} {currentTier.name}</p>
              <p className="text-lg opacity-90">{currentXP.toLocaleString()} XP</p>
              <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                <p className="text-sm font-semibold">
                  {xpInCurrentLevel}/{xpPerLevel} XP para Nível {currentLevel + 1}
                </p>
              </div>
            </div>

            {/* Direita: Resumo Rápido */}
            <div className="text-center md:text-right">
              <div className="inline-block bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <Award className="w-12 h-12 mx-auto md:ml-auto md:mr-0 mb-2" />
                <p className="text-4xl font-black mb-1">{allEarnedBadges.length}</p>
                <p className="text-sm opacity-90">Emblemas Desbloqueados</p>
                <div className="mt-2 text-xs">
                  <span className="opacity-75">de {allPossibleBadges.length} totais</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 2. PÓDIO (Ranking Global) */}
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-yellow-50 to-orange-50 overflow-hidden">
          <CardHeader className="border-b bg-white/50 backdrop-blur-sm">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-7 h-7 text-yellow-600" />
              Ranking Global
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Pódio Visual */}
            <div className="flex items-end justify-center gap-4 mb-8">
              {/* 2º Lugar */}
              {allUsers[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-gray-400 overflow-hidden shadow-lg bg-white">
                      {allUsers[1].profile_photo_url ? (
                        <img src={allUsers[1].profile_photo_url} className="w-full h-full object-cover" alt={allUsers[1].full_name} />
                      ) : (
                        <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-2xl font-bold">
                          {allUsers[1].full_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      2
                    </div>
                  </div>
                  <div className="mt-3 bg-gradient-to-b from-gray-400 to-gray-500 text-white rounded-xl px-6 py-4 text-center shadow-lg h-32 flex flex-col justify-center">
                    <Medal className="w-6 h-6 mx-auto mb-1" />
                    <p className="font-bold text-sm truncate max-w-[100px]">{allUsers[1].full_name}</p>
                    <p className="text-xs opacity-90">{allUsers[1].gamification_xp?.toLocaleString()} XP</p>
                  </div>
                </motion.div>
              )}

              {/* 1º Lugar (Centro, Mais Alto) */}
              {allUsers[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center relative -mt-8"
                >
                  <Crown className="w-10 h-10 text-yellow-500 fill-yellow-400 mb-2 animate-pulse" />
                  <div className="relative">
                    <div className="w-28 h-28 rounded-full border-4 border-yellow-500 overflow-hidden shadow-2xl bg-white ring-4 ring-yellow-200">
                      {allUsers[0].profile_photo_url ? (
                        <img src={allUsers[0].profile_photo_url} className="w-full h-full object-cover" alt={allUsers[0].full_name} />
                      ) : (
                        <div className="w-full h-full bg-yellow-500 flex items-center justify-center text-white text-3xl font-bold">
                          {allUsers[0].full_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-black shadow-lg text-lg">
                      1
                    </div>
                  </div>
                  <div className="mt-4 bg-gradient-to-b from-yellow-400 to-yellow-600 text-white rounded-2xl px-8 py-6 text-center shadow-2xl h-40 flex flex-col justify-center">
                    <Trophy className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-black text-lg truncate max-w-[120px]">{allUsers[0].full_name}</p>
                    <p className="text-sm opacity-95 font-bold">{allUsers[0].gamification_xp?.toLocaleString()} XP</p>
                    <Badge className="mt-2 bg-white/30 text-white border-0">
                      {getTierData(allUsers[0].gamification_xp || 0).icon} {getTierData(allUsers[0].gamification_xp || 0).name}
                    </Badge>
                  </div>
                </motion.div>
              )}

              {/* 3º Lugar */}
              {allUsers[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-orange-600 overflow-hidden shadow-lg bg-white">
                      {allUsers[2].profile_photo_url ? (
                        <img src={allUsers[2].profile_photo_url} className="w-full h-full object-cover" alt={allUsers[2].full_name} />
                      ) : (
                        <div className="w-full h-full bg-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                          {allUsers[2].full_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      3
                    </div>
                  </div>
                  <div className="mt-3 bg-gradient-to-b from-orange-500 to-orange-600 text-white rounded-xl px-6 py-4 text-center shadow-lg h-32 flex flex-col justify-center">
                    <Medal className="w-6 h-6 mx-auto mb-1" />
                    <p className="font-bold text-sm truncate max-w-[100px]">{allUsers[2].full_name}</p>
                    <p className="text-xs opacity-90">{allUsers[2].gamification_xp?.toLocaleString()} XP</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Resto do Ranking (4º-10º) */}
            <div className="space-y-2">
              {allUsers.slice(3, 10).map((rankUser, idx) => (
                <div
                  key={rankUser.id}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                    {idx + 4}
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                    {rankUser.profile_photo_url ? (
                      <img src={rankUser.profile_photo_url} className="w-full h-full object-cover" alt={rankUser.full_name} />
                    ) : (
                      <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold">
                        {rankUser.full_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{rankUser.full_name}</p>
                    <p className="text-xs text-gray-600">Nível {rankUser.gamification_level || 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{rankUser.gamification_xp?.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">XP</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Posição do Usuário (se fora do Top 10) */}
            {userRank > 10 && (
              <div className="mt-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                    {userRank}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Você está em {userRank}º lugar</p>
                    <p className="text-sm opacity-90">{currentXP.toLocaleString()} XP</p>
                  </div>
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            )}

            <Button
              onClick={() => navigate(createPageUrl('Leaderboard'))}
              className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg"
              size="lg"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Ver Ranking Completo
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 3. GALERIA DE EMBLEMAS */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="w-7 h-7 text-purple-600" />
                Galeria de Emblemas
              </CardTitle>
              <Badge className="bg-purple-600 text-white">
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
                  className={activeCategory === cat ? "bg-purple-600" : ""}
                >
                  {cat === 'all' && '🌟 Todos'}
                  {cat === 'social' && '💬 Social'}
                  {cat === 'activity' && '🎯 Atividade'}
                  {cat === 'milestone' && '🏆 Marcos'}
                  {cat === 'special' && '✨ Especial'}
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
                      
                      {badge.image_url ? (
                        <img src={badge.image_url} className="w-16 h-16 mx-auto mb-2 rounded-lg object-cover" alt={badge.name} />
                      ) : (
                        <div className="text-4xl mb-2">{badge.icon}</div>
                      )}
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

        {/* Call to Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('SocialFeed'))}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Explorar Comunidade</h3>
                  <p className="text-sm text-gray-600">Ganhe XP publicando e interagindo</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl('Home'))}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Agendar Passeio</h3>
                  <p className="text-sm text-gray-600">Ganhe +100 XP por passeio completo</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}