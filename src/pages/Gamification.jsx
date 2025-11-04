
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trophy, Star, Target, TrendingUp, Award, Zap, Crown, 
  Heart, Users, MessageCircle, Calendar, Gift, Shield,
  Flame, CheckCircle, Lock, Sparkles, ChevronRight, Camera,
  Upload, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner"; // Changed toast import to sonner

export default function Gamification() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userComments = [] } = useQuery({
    queryKey: ['userComments', user?.email],
    queryFn: () => base44.entities.SocialComment.filter({ author_email: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ['userLikes', user?.email],
    queryFn: () => base44.entities.SocialLike.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const completeQuestMutation = useMutation({
    mutationFn: async ({ xpReward }) => {
      const newXP = (user?.gamification_xp || 0) + xpReward;
      // Recalculate level based on new XP, assuming 500 XP per level starting from level 1
      const newLevel = Math.floor(newXP / 500) + 1; 
      
      return await base44.auth.updateMe({
        gamification_xp: newXP,
        gamification_level: newLevel,
        last_activity_date: new Date().toISOString().split('T')[0] // Update last activity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      toast.success("Missão completa!", {
        description: `Você ganhou XP! 🎉`,
      });
    },
    onError: (error) => {
      toast.error("Erro ao completar missão", {
        description: error.message || "Tente novamente mais tarde.",
      });
    },
  });

  // Calculate XP needed for next level
  const xpForNextLevel = (level) => level * 500;
  const currentLevelXP = user?.gamification_xp || 0;
  const currentLevel = user?.gamification_level || 1;
  const xpNeeded = xpForNextLevel(currentLevel);
  const xpProgress = (currentLevelXP % xpNeeded) / xpNeeded * 100;

  // All possible badges (truncated from outline)
  const allBadges = [
    { id: "first_post", name: "First Post", desc: "Publique seu primeiro post", icon: "📝", category: "social", rarity: "common", requirement: 1, current: user?.profile_stats?.total_posts || 0, stat: "total_posts", xp: 50 },
    { id: "social_butterfly", name: "Social Butterfly", desc: "50+ posts publicados", icon: "🦋", category: "social", rarity: "rare", requirement: 50, current: user?.profile_stats?.total_posts || 0, stat: "total_posts", xp: 500 },
    { id: "content_king", name: "Content King", desc: "100+ posts publicados", icon: "👑", category: "social", rarity: "epic", requirement: 100, current: user?.profile_stats?.total_posts || 0, stat: "total_posts", xp: 1000 },
    { id: "popular", name: "Popular", desc: "Receba 100+ curtidas", icon: "❤️", category: "social", rarity: "rare", requirement: 100, current: user?.profile_stats?.total_likes_received || 0, stat: "total_likes_received", xp: 300 },
    { id: "influencer", name: "Influencer", desc: "500+ curtidas recebidas", icon: "⭐", category: "social", rarity: "epic", requirement: 500, current: user?.profile_stats?.total_likes_received || 0, stat: "total_likes_received", xp: 800 },
    { id: "community_helper", name: "Community Helper", desc: "50+ comentários escritos", icon: "💬", category: "social", rarity: "rare", requirement: 50, current: user?.profile_stats?.total_comments_made || 0, stat: "total_comments_made", xp: 400 },
    { id: "first_booking", name: "First Booking", desc: "Faça sua primeira reserva", icon: "🎫", category: "activity", rarity: "common", requirement: 1, current: user?.profile_stats?.total_bookings || 0, stat: "total_bookings", xp: 100 },
    { id: "regular_user", name: "Regular User", desc: "10+ reservas realizadas", icon: "📅", category: "activity", rarity: "rare", requirement: 10, current: user?.profile_stats?.total_bookings || 0, stat: "total_bookings", xp: 500 },
    { id: "streak_starter", name: "Streak Starter", desc: "7 dias consecutivos", icon: "🔥", category: "activity", rarity: "common", requirement: 7, current: user?.daily_streak || 0, stat: "daily_streak", xp: 200 },
    { id: "streak_master", name: "Streak Master", desc: "30 dias consecutivos", icon: "🔥", category: "activity", rarity: "epic", requirement: 30, current: user?.daily_streak || 0, stat: "daily_streak", xp: 1000 },
    { id: "profile_complete", name: "Profile Complete", desc: "Complete 100% do perfil", icon: "✅", category: "milestone", rarity: "common", requirement: 100, current: user?.profile_completion_percentage || 0, stat: "profile_completion_percentage", xp: 150 },
    { id: "adoption_hero", name: "Adoption Hero", desc: "Adote um pet resgatado", icon: "🏠", category: "milestone", rarity: "epic", requirement: 1, current: user?.profile_stats?.total_adoptions || 0, stat: "total_adoptions", xp: 2000 },
  ];

  // Filter earned badges
  const earnedBadges = user?.public_badges || [];
  const earnedBadgeIds = earnedBadges.map(b => b.badge_id);

  // Available badges (not earned yet, can be earned)
  const availableBadges = allBadges.filter(b => 
    !earnedBadgeIds.includes(b.id) && 
    (activeCategory === "all" || b.category === activeCategory)
  );

  // Photo Challenges (truncated from outline)
  const photoChallenges = [
    { id: "beach_day", title: "Dia de Praia", desc: "Tire uma foto do seu cão na praia", icon: "🏖️", reward: 150 },
    { id: "park_adventure", title: "Aventura no Parque", desc: "Capture um momento no parque", icon: "🌳", reward: 100 },
    { id: "mountain_hike", title: "Trilha na Montanha", desc: "Leve seu cão numa trilha", icon: "⛰️", reward: 200 },
    { id: "first_swim", title: "Primeiro Mergulho", desc: "Foto do cão nadando", icon: "🏊", reward: 150 },
    { id: "new_friend", title: "Novo Amigo", desc: "Foto com outro cão", icon: "🐕‍🦺", reward: 100 },
    { id: "trick_master", title: "Truque Novo", desc: "Mostre um truque que ensinou", icon: "🎪", reward: 150 },
  ];

  // Daily quests with real-time data
  const dailyQuests = [
    { 
      id: 1, 
      title: "Publicar 1 foto", 
      desc: "Compartilhe um momento do seu pet", 
      reward: 50, 
      icon: "📸", 
      completed: (user?.profile_stats?.total_posts || 0) > 0 
    },
    { 
      id: 2, 
      title: "Dar 5 curtidas", 
      desc: "Apoie outros donos de pets", 
      reward: 25, 
      icon: "❤️", 
      completed: userLikes.length >= 5 
    },
    { 
      id: 3, 
      title: "Escrever 3 comentários", 
      desc: "Participe das conversas", 
      reward: 30, 
      icon: "💬", 
      completed: userComments.length >= 3 
    },
    { 
      id: 4, 
      title: "Visitar o Dog Connect", 
      desc: "Mantenha sua streak ativa", 
      reward: 20, 
      icon: "🔥", 
      completed: true 
    },
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoPreview(file_url);
    } catch (error) {
      toast.error("Erro ao carregar foto", {
        description: error.message || "Não foi possível enviar a imagem.",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const completePhotoChallenge = async () => {
    if (!photoPreview || !selectedChallenge) return;

    await completeQuestMutation.mutateAsync({ xpReward: selectedChallenge.reward });
    
    setShowPhotoUpload(false);
    setSelectedChallenge(null);
    setPhotoPreview(null);
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
                Gamificação & Emblemas
              </h1>
              <p className="text-gray-600">Complete desafios, ganhe emblemas raros e suba de nível!</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('Leaderboard'))}
              className="hidden md:flex"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Ver Ranking
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
                <div className="text-3xl font-bold">{user?.gamification_xp || 0}</div>
                <div className="text-white/80 text-sm">XP Total</div>
              </div>
            </div>
            
            <Progress value={xpProgress} className="h-4 bg-white/20 mb-6" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl font-bold">{earnedBadges.length}</div>
                <div className="text-xs text-white/80">Emblemas</div>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl font-bold flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-300 mr-1" />
                  {user?.daily_streak || 0}
                </div>
                <div className="text-xs text-white/80">Streak</div>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl font-bold">{user?.profile_completion_percentage || 0}%</div>
                <div className="text-xs text-white/80">Perfil</div>
              </div>
              <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="text-2xl font-bold">{user?.profile_stats?.total_posts || 0}</div>
                <div className="text-xs text-white/80">Posts</div>
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
                <p className="text-sm text-gray-600 mt-1">Resetam a cada 24 horas</p>
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

            {/* Photo Challenges */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-pink-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-orange-600" />
                      Desafios de Fotos
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Capture momentos especiais e ganhe XP!
                    </p>
                  </div>
                  <Badge className="bg-orange-600 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Novo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {photoChallenges.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-xl border-2 bg-white border-orange-200 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all"
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setShowPhotoUpload(true);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{challenge.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm mb-1 text-gray-900">
                            {challenge.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">{challenge.desc}</p>
                          <Badge className="bg-orange-600 text-white text-xs">
                            +{challenge.reward} XP
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Minhas Badges */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Meus Emblemas ({earnedBadges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {earnedBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Você ainda não tem emblemas</p>
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
                        {badge.image_url ? (
                          <img 
                            src={badge.image_url} 
                            alt={badge.name}
                            className="w-16 h-16 mx-auto mb-2 rounded-lg object-cover"
                            style={{imageRendering: 'pixelated'}}
                          />
                        ) : (
                          <div className="text-5xl mb-2">{badge.icon}</div>
                        )}
                        <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                        <p className="text-xs opacity-90">{badge.description}</p>
                        <Badge className="mt-2 bg-white/20 text-white text-xs">
                          {badge.rarity?.toUpperCase()}
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
                  Emblemas Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    <TabsTrigger value="social">Social</TabsTrigger>
                    <TabsTrigger value="activity">Atividade</TabsTrigger>
                    <TabsTrigger value="milestone">Marcos</TabsTrigger>
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
                    <Camera className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">Posts</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    {user?.profile_stats?.total_posts || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    <span className="text-sm font-medium">Curtidas Dadas</span>
                  </div>
                  <span className="text-lg font-bold text-pink-600">
                    {userLikes.length}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium">Comentários</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {userComments.length}
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
              </CardContent>
            </Card>

            {/* Leaderboard Preview */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Ranking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-4">
                  Compete com outros membros da comunidade por emblemas exclusivos!
                </p>
                <Button
                  onClick={() => navigate(createPageUrl('Leaderboard'))}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Ver Ranking Completo
                </Button>
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
                  Convide amigos e ganhe <strong>500 XP</strong> para cada amigo que se registar!
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
          </div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <AnimatePresence>
        {showPhotoUpload && selectedChallenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowPhotoUpload(false);
              setPhotoPreview(null);
              setSelectedChallenge(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="text-center mb-4">
                <div className="text-6xl mb-3">{selectedChallenge.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedChallenge.title}
                </h3>
                <p className="text-gray-600 mb-4">{selectedChallenge.desc}</p>
                <Badge className="bg-orange-600 text-white">
                  Recompensa: +{selectedChallenge.reward} XP
                </Badge>
              </div>

              <div className="space-y-4">
                {photoPreview ? (
                  <div className="relative">
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors cursor-pointer block">
                    {uploadingPhoto ? (
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-bounce" />
                    ) : (
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    )}
                    <p className="text-sm text-gray-600">
                      {uploadingPhoto ? "Carregando..." : "Clique para fazer upload da foto"}
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPhotoUpload(false);
                      setPhotoPreview(null);
                      setSelectedChallenge(null);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={completePhotoChallenge}
                    disabled={!photoPreview || completeQuestMutation.isPending}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {completeQuestMutation.isPending ? "A enviar..." : "Completar Desafio"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
