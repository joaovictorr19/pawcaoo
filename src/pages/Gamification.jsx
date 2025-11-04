import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy, Star, Target, TrendingUp, Award, Zap, Crown, 
  Heart, Users, MessageCircle, Calendar, Gift, Shield,
  Flame, CheckCircle, Lock, Sparkles, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Gamification() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Calculate XP needed for next level
  const xpForNextLevel = (level) => level * 500;
  const currentLevelXP = user?.gamification_xp || 0;
  const currentLevel = user?.gamification_level || 1;
  const xpNeeded = xpForNextLevel(currentLevel);
  const xpProgress = (currentLevelXP % xpNeeded) / xpNeeded * 100;

  // All possible badges
  const allBadges = [
    // Social Badges
    { id: "first_post", name: "First Post", desc: "Publique seu primeiro post", icon: "📝", category: "social", rarity: "common", requirement: 1, current: user?.profile_stats?.total_posts || 0, stat: "total_posts", xp: 50 },
    { id: "social_butterfly", name: "Social Butterfly", desc: "50+ posts publicados", icon: "🦋", category: "social", rarity: "rare", requirement: 50, current: user?.profile_stats?.total_posts || 0, stat: "total_posts", xp: 500 },
    { id: "content_king", name: "Content King", desc: "100+ posts publicados", icon: "👑", category: "social", rarity: "epic", requirement: 100, current: user?.profile_stats?.total_posts || 0, stat: "total_posts", xp: 1000 },
    { id: "popular", name: "Popular", desc: "Receba 100+ curtidas", icon: "❤️", category: "social", rarity: "rare", requirement: 100, current: user?.profile_stats?.total_likes_received || 0, stat: "total_likes_received", xp: 300 },
    { id: "influencer", name: "Influencer", desc: "500+ curtidas recebidas", icon: "⭐", category: "social", rarity: "epic", requirement: 500, current: user?.profile_stats?.total_likes_received || 0, stat: "total_likes_received", xp: 800 },
    { id: "community_helper", name: "Community Helper", desc: "50+ comentários escritos", icon: "💬", category: "social", rarity: "rare", requirement: 50, current: user?.profile_stats?.total_comments_made || 0, stat: "total_comments_made", xp: 400 },
    
    // Activity Badges
    { id: "first_booking", name: "First Booking", desc: "Faça sua primeira reserva", icon: "🎫", category: "activity", rarity: "common", requirement: 1, current: user?.profile_stats?.total_bookings || 0, stat: "total_bookings", xp: 100 },
    { id: "regular_user", name: "Regular User", desc: "10+ reservas realizadas", icon: "📅", category: "activity", rarity: "rare", requirement: 10, current: user?.profile_stats?.total_bookings || 0, stat: "total_bookings", xp: 500 },
    { id: "super_user", name: "Super User", desc: "50+ reservas realizadas", icon: "🌟", category: "activity", rarity: "epic", requirement: 50, current: user?.profile_stats?.total_bookings || 0, stat: "total_bookings", xp: 1500 },
    { id: "streak_starter", name: "Streak Starter", desc: "7 dias consecutivos", icon: "🔥", category: "activity", rarity: "common", requirement: 7, current: user?.daily_streak || 0, stat: "daily_streak", xp: 200 },
    { id: "streak_master", name: "Streak Master", desc: "30 dias consecutivos", icon: "🔥", category: "activity", rarity: "epic", requirement: 30, current: user?.daily_streak || 0, stat: "daily_streak", xp: 1000 },
    { id: "streak_legend", name: "Streak Legend", desc: "100 dias consecutivos", icon: "🔥", category: "activity", rarity: "legendary", requirement: 100, current: user?.daily_streak || 0, stat: "daily_streak", xp: 5000 },
    
    // Milestone Badges
    { id: "profile_complete", name: "Profile Complete", desc: "Complete 100% do perfil", icon: "✅", category: "milestone", rarity: "common", requirement: 100, current: user?.profile_completion_percentage || 0, stat: "profile_completion_percentage", xp: 150 },
    { id: "adoption_hero", name: "Adoption Hero", desc: "Adote um pet resgatado", icon: "🏠", category: "milestone", rarity: "epic", requirement: 1, current: user?.profile_stats?.total_adoptions || 0, stat: "total_adoptions", xp: 2000 },
    { id: "referral_starter", name: "Referral Starter", desc: "Refira 3 amigos", icon: "🎁", category: "milestone", rarity: "rare", requirement: 3, current: user?.profile_stats?.total_referrals || 0, stat: "total_referrals", xp: 300 },
    { id: "referral_master", name: "Referral Master", desc: "Refira 10 amigos", icon: "💎", category: "milestone", rarity: "epic", requirement: 10, current: user?.profile_stats?.total_referrals || 0, stat: "total_referrals", xp: 1000 },
    { id: "reviewer", name: "Reviewer", desc: "Escreva 10+ avaliações", icon: "⭐", category: "milestone", rarity: "rare", requirement: 10, current: user?.profile_stats?.total_reviews_written || 0, stat: "total_reviews_written", xp: 400 },
    
    // Special Badges
    { id: "early_adopter", name: "Early Adopter", desc: "Dos primeiros 100 membros", icon: "🚀", category: "special", rarity: "legendary", requirement: 1, current: 0, stat: "special", xp: 5000 },
    { id: "beta_tester", name: "Beta Tester", desc: "Testou funcionalidades beta", icon: "🧪", category: "special", rarity: "epic", requirement: 1, current: 0, stat: "special", xp: 1000 },
    { id: "event_attendee", name: "Event Attendee", desc: "Participe de 5+ eventos", icon: "🎉", category: "special", rarity: "rare", requirement: 5, current: user?.profile_stats?.total_events_attended || 0, stat: "total_events_attended", xp: 500 },
  ];

  // Filter earned badges
  const earnedBadges = user?.public_badges || [];
  const earnedBadgeIds = earnedBadges.map(b => b.badge_id);

  // Available badges (not earned yet, can be earned)
  const availableBadges = allBadges.filter(b => 
    !earnedBadgeIds.includes(b.id) && 
    b.stat !== "special" &&
    (activeCategory === "all" || b.category === activeCategory)
  );

  // Calculate daily quests
  const dailyQuests = [
    { id: 1, title: "Publicar 1 foto", desc: "Compartilhe um momento do seu pet", reward: 50, icon: "📸", completed: false },
    { id: 2, title: "Dar 5 curtidas", desc: "Apoie outros donos de pets", reward: 25, icon: "❤️", completed: false },
    { id: 3, title: "Escrever 3 comentários", desc: "Participe das conversas", reward: 30, icon: "💬", completed: false },
    { id: 4, title: "Visitar o Dog Connect", desc: "Mantenha sua streak ativa", reward: 20, icon: "🔥", completed: true },
  ];

  const getRarityColor = (rarity) => {
    const colors = {
      common: "from-gray-400 to-gray-600",
      rare: "from-blue-400 to-blue-600",
      epic: "from-purple-400 to-purple-600",
      legendary: "from-yellow-400 to-orange-600"
    };
    return colors[rarity] || colors.common;
  };

  const getRarityBorder = (rarity) => {
    const colors = {
      common: "border-gray-400",
      rare: "border-blue-400",
      epic: "border-purple-400",
      legendary: "border-yellow-400"
    };
    return colors[rarity] || colors.common;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Trophy className="w-10 h-10 text-yellow-600" />
                Gamificação & Conquistas
              </h1>
              <p className="text-gray-600">Complete desafios, ganhe badges e suba de nível!</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('Leaderboard'))}
              className="hidden md:flex"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Ver Leaderboard
            </Button>
          </div>
        </div>

        {/* Level Progress Card */}
        <Card className="border-0 shadow-2xl mb-6 bg-gradient-to-br from-purple-600 to-blue-600 text-white overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-4 border-white/40">
                  <span className="text-4xl font-black">{currentLevel}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Nível {currentLevel}</h2>
                  <p className="text-white/80 text-sm">
                    {currentLevelXP % xpNeeded} / {xpNeeded} XP para Nível {currentLevel + 1}
                  </p>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <div className="text-3xl font-bold">{user?.gamification_points || 0}</div>
                <div className="text-white/80 text-sm">Pontos Totais</div>
              </div>
            </div>
            
            <Progress value={xpProgress} className="h-4 bg-white/20" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl font-bold">{earnedBadges.length}</div>
                <div className="text-xs text-white/80">Badges</div>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl font-bold flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-300 mr-1" />
                  {user?.daily_streak || 0}
                </div>
                <div className="text-xs text-white/80">Dia Streak</div>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl font-bold">{user?.profile_completion_percentage || 0}%</div>
                <div className="text-xs text-white/80">Perfil</div>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl font-bold">{user?.gamification_xp || 0}</div>
                <div className="text-xs text-white/80">Total XP</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Quests */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Missões Diárias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dailyQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      quest.completed
                        ? 'bg-green-50 border-green-300'
                        : 'bg-white border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`text-3xl ${quest.completed ? 'opacity-50' : ''}`}>
                          {quest.icon}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${quest.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {quest.title}
                          </h4>
                          <p className="text-sm text-gray-600">{quest.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {quest.completed ? (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                          <Badge className="bg-purple-600 text-white">
                            +{quest.reward} XP
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Minhas Badges ({earnedBadges.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {earnedBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Você ainda não tem badges</p>
                    <p className="text-sm text-gray-500">Complete desafios para ganhar suas primeiras conquistas!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {earnedBadges.map((badge, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`relative p-4 rounded-2xl border-4 ${getRarityBorder(badge.rarity)} bg-gradient-to-br ${getRarityColor(badge.rarity)} text-white text-center hover:scale-105 transition-transform cursor-pointer shadow-lg`}
                      >
                        <div className="text-5xl mb-2">{badge.icon}</div>
                        <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                        <p className="text-xs opacity-90">{badge.description}</p>
                        <Badge className="mt-2 bg-white/20 text-white text-xs">
                          {badge.rarity.toUpperCase()}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Badges */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Badges Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList className="grid w-full grid-cols-5 mb-6">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
                    <TabsTrigger value="activity">Atividade</TabsTrigger>
                    <TabsTrigger value="milestone">Marcos</TabsTrigger>
                    <TabsTrigger value="special">Especial</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableBadges.map((badge) => {
                    const progress = Math.min((badge.current / badge.requirement) * 100, 100);
                    const isLocked = progress === 0;

                    return (
                      <div
                        key={badge.id}
                        className={`relative p-4 rounded-xl border-2 ${
                          isLocked ? 'bg-gray-50 border-gray-300' : 'bg-white border-purple-200'
                        }`}
                      >
                        {isLocked && (
                          <div className="absolute top-2 right-2">
                            <Lock className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`text-4xl ${isLocked ? 'grayscale opacity-50' : ''}`}>
                            {badge.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">{badge.name}</h4>
                            <p className="text-sm text-gray-600">{badge.desc}</p>
                            <Badge className={`mt-2 ${getRarityBorder(badge.rarity)}`} variant="outline">
                              {badge.rarity} • +{badge.xp} XP
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Progresso</span>
                            <span>{badge.current} / {badge.requirement}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">Posts</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {user?.profile_stats?.total_posts || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    <span className="text-sm font-medium">Curtidas</span>
                  </div>
                  <span className="text-lg font-bold text-pink-600">
                    {user?.profile_stats?.total_likes_received || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Reservas</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {user?.profile_stats?.total_bookings || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium">Referências</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {user?.profile_stats?.total_referrals || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Referral Program */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gift className="w-5 h-5 text-green-600" />
                  Programa de Referência
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">
                  Convide amigos e ganhe <strong>500 XP</strong> + <strong>100 PawPoints</strong> para cada amigo que se registar!
                </p>
                <div className="p-3 bg-white rounded-lg border-2 border-dashed border-green-300 mb-3">
                  <div className="text-xs text-gray-600 mb-1">Seu código:</div>
                  <div className="font-mono font-bold text-lg text-green-600">
                    {user?.referral_code || 'PAWCAO2025'}
                  </div>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Users className="w-4 h-4 mr-2" />
                  Compartilhar Código
                </Button>
              </CardContent>
            </Card>

            {/* Leaderboard Preview */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    Top 5 Jogadores
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(createPageUrl('Leaderboard'))}
                  >
                    Ver Todos
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div key={rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      rank === 2 ? 'bg-gray-200 text-gray-700' :
                      rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">Player {rank}</div>
                      <div className="text-xs text-gray-500">{5000 - (rank * 500)} XP</div>
                    </div>
                    {rank <= 3 && (
                      <Crown className={`w-5 h-5 ${
                        rank === 1 ? 'text-yellow-500' :
                        rank === 2 ? 'text-gray-400' :
                        'text-orange-400'
                      }`} />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}