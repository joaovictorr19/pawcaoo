
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
  Upload, X, Plus, Trash, Search, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Gamification() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // New admin-related state
  const [showGrantBadgeModal, setShowGrantBadgeModal] = useState(false);
  const [showRemoveBadgeModal, setShowRemoveBadgeModal] = useState(false);
  const [selectedUserForBadge, setSelectedUserForBadge] = useState(null);
  const [selectedBadgeToRemove, setSelectedBadgeToRemove] = useState(null); // This might not be strictly needed if we pass badge_id directly
  const [userEmailSearch, setUserEmailSearch] = useState('');

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

  // New mutations for admin controls
  const grantBadgeMutation = useMutation({
    mutationFn: async ({ userEmail, badge }) => {
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length === 0) throw new Error('Usuário não encontrado');

      const targetUser = users[0];
      const currentBadges = targetUser.achievements_badges || [];

      // Check if user already has this badge
      if (currentBadges.some(b => b.badge_id === badge.id)) {
        throw new Error('Usuário já possui este emblema');
      }

      const newBadge = {
        badge_id: badge.id,
        name: badge.name,
        description: badge.desc,
        icon: badge.icon,
        rarity: badge.rarity,
        xp: badge.xp,
        image_url: badge.image_url || null,
        earned_date: new Date().toISOString(),
      };

      await base44.entities.User.update(targetUser.id, {
        achievements_badges: [...currentBadges, newBadge]
      });

      // Grant XP for the badge
      const newXP = (targetUser.gamification_xp || 0) + badge.xp;
      const newLevel = Math.floor(newXP / 500) + 1;
      await base44.entities.User.update(targetUser.id, {
        gamification_xp: newXP,
        gamification_level: newLevel,
      });

      return newBadge;
    },
    onSuccess: (newBadge) => {
      queryClient.invalidateQueries(['currentUser']); // Invalidate current user's data if it's the admin granting to themselves
      queryClient.invalidateQueries(['allUsers']); // Invalidate if there's a list of all users
      if (selectedUserForBadge && newBadge) {
        setSelectedUserForBadge(prev => ({
          ...prev,
          achievements_badges: [...(prev.achievements_badges || []), newBadge],
          gamification_xp: (prev.gamification_xp || 0) + newBadge.xp,
          gamification_level: Math.floor(((prev.gamification_xp || 0) + newBadge.xp) / 500) + 1,
        }));
      }
      toast.success(`Emblema "${newBadge.name}" concedido!`);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao conceder emblema');
    }
  });

  const removeBadgeMutation = useMutation({
    mutationFn: async ({ userEmail, badgeId }) => {
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length === 0) throw new Error('Usuário não encontrado');

      const targetUser = users[0];
      const currentBadges = targetUser.achievements_badges || [];

      const badgeToRemove = currentBadges.find(b => b.badge_id === badgeId);
      if (!badgeToRemove) {
        throw new Error('Emblema não encontrado para este usuário');
      }

      const updatedBadges = currentBadges.filter(b => b.badge_id !== badgeId);

      await base44.entities.User.update(targetUser.id, {
        achievements_badges: updatedBadges
      });

      // Revoke XP for the badge
      const newXP = Math.max(0, (targetUser.gamification_xp || 0) - badgeToRemove.xp);
      const newLevel = Math.floor(newXP / 500) + 1;
      await base44.entities.User.update(targetUser.id, {
        gamification_xp: newXP,
        gamification_level: newLevel,
      });
      return badgeToRemove;
    },
    onSuccess: (removedBadge) => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['allUsers']);
      if (selectedUserForBadge && removedBadge) {
        setSelectedUserForBadge(prev => ({
          ...prev,
          achievements_badges: (prev.achievements_badges || []).filter(b => b.badge_id !== removedBadge.badge_id),
          gamification_xp: Math.max(0, (prev.gamification_xp || 0) - removedBadge.xp),
          gamification_level: Math.floor(Math.max(0, (prev.gamification_xp || 0) - removedBadge.xp) / 500) + 1,
        }));
      }
      setShowRemoveBadgeModal(false);
      setSelectedBadgeToRemove(null);
      toast.success(`Emblema "${removedBadge.name}" removido!`);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover emblema');
    }
  });

  const searchUserMutation = useMutation({
    mutationFn: async (email) => {
      const users = await base44.entities.User.filter({ email });
      if (users.length === 0) throw new Error('Usuário não encontrado');
      return users[0];
    },
    onSuccess: (user) => {
      setSelectedUserForBadge(user);
      toast.success(`Usuário ${user.email} encontrado.`);
    },
    onError: (error) => {
      setSelectedUserForBadge(null);
      toast.error(error.message || 'Usuário não encontrado');
    }
  });

  // Calculate XP needed for next level
  const xpPerLevel = 500;
  const currentLevelXP = user?.gamification_xp || 0;
  const currentLevel = user?.gamification_level || 1;
  const xpNeededForNextLevel = currentLevel * xpPerLevel;
  const xpInCurrentLevel = currentLevelXP - ((currentLevel - 1) * xpPerLevel); // XP earned in the current level
  const xpProgressPercentage = (xpInCurrentLevel / xpPerLevel) * 100;

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

  // Filter earned badges for current user (using public_badges as per existing code)
  const earnedBadges = user?.public_badges || [];
  const earnedBadgeIds = earnedBadges.map(b => b.badge_id);

  // Available badges (not earned yet, can be earned) for user display
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Compacto */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-600" />
            Gamificação & Emblemas
          </h1>
          <p className="text-gray-600">Complete desafios e ganhe emblemas exclusivos!</p>
        </div>

        {/* XP Card Compacto */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-90 mb-1">Nível</p>
                  <p className="text-3xl font-bold">{currentLevel}</p>
                </div>
                <Trophy className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">XP Total</p>
                  <p className="text-3xl font-bold text-blue-600">{user?.gamification_xp || 0}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Emblemas</p>
                  <p className="text-3xl font-bold text-purple-600">{earnedBadges.length}</p>
                </div>
                <Award className="w-10 h-10 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progresso Compacto */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Progresso para Nível {currentLevel + 1}</p>
              <p className="text-sm text-gray-600">{xpInCurrentLevel} / {xpPerLevel} XP</p>
            </div>
            <Progress value={xpProgressPercentage} className="h-3 bg-gray-200" />
          </CardContent>
        </Card>

        {/* Admin Controls Compactos */}
        {user?.role === 'admin' && (
          <div className="grid md:grid-cols-3 gap-3 mb-6">
            <Button
              onClick={() => { setShowGrantBadgeModal(true); setSelectedUserForBadge(null); setUserEmailSearch(''); }}
              className="bg-green-600 hover:bg-green-700 h-12"
            >
              <Plus className="w-5 h-5 mr-2" />
              Conceder Emblema
            </Button>
            <Button
              onClick={() => { setShowRemoveBadgeModal(true); setSelectedUserForBadge(null); setUserEmailSearch(''); }}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 h-12"
            >
              <Trash className="w-5 h-5 mr-2" />
              Remover Emblema
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('AdminDashboard'))}
              variant="outline"
              className="h-12"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Admin Dashboard
            </Button>
          </div>
        )}

        <Tabs defaultValue="missions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="missions">Missões</TabsTrigger>
            <TabsTrigger value="badges">Meus Emblemas</TabsTrigger>
            <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
          </TabsList>

          <TabsContent value="missions">
            <div className="space-y-6">
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
          </TabsContent>


          {/* Badges Tab - Mais Compacto */}
          <TabsContent value="badges">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  Meus Emblemas ({earnedBadges.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {earnedBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Nenhum emblema ainda</p>
                    <Button onClick={() => document.querySelector('[data-state="inactive"][value="missions"]')?.click()}>
                      Ver Missões
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {earnedBadges.map((badge, idx) => {
                      const rarityColors = {
                        common: "bg-gray-100 border-gray-300",
                        rare: "bg-blue-100 border-blue-300",
                        epic: "bg-purple-100 border-purple-300",
                        legendary: "bg-yellow-100 border-yellow-300"
                      };
                      const colors = rarityColors[badge.rarity] || rarityColors.common;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`relative p-3 rounded-lg border-2 ${colors} text-center hover:scale-105 transition-transform cursor-pointer`}
                          title={badge.name}
                        >
                          {badge.image_url ? (
                            <img
                              src={badge.image_url}
                              alt={badge.name}
                              className="w-full aspect-square object-cover rounded-lg mb-2"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : (
                            <div className="text-4xl mb-2">{badge.icon}</div>
                          )}
                          <p className="text-xs font-bold truncate">{badge.name}</p>
                          {badge.earned_date && (
                            <p className="text-[10px] text-gray-500 mt-1">
                              {new Date(badge.earned_date).toLocaleDateString('pt-PT')}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
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
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-blue-50 mt-6">
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
          </TabsContent>
        </Tabs>
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

      {/* Grant Badge Modal */}
      <Dialog open={showGrantBadgeModal} onOpenChange={setShowGrantBadgeModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conceder Emblema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="user-email-search">Email do Usuário</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="user-email-search"
                  type="email"
                  value={userEmailSearch}
                  onChange={(e) => setUserEmailSearch(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="flex-1"
                />
                <Button
                  onClick={() => searchUserMutation.mutate(userEmailSearch)}
                  disabled={searchUserMutation.isPending || !userEmailSearch}
                >
                  {searchUserMutation.isPending ? "Buscando..." : <><Search className="w-4 h-4 mr-2" /> Buscar</>}
                </Button>
              </div>
            </div>

            {searchUserMutation.isError && (
                <p className="text-red-500 text-sm">
                  {searchUserMutation.error.message || 'Erro ao buscar usuário.'}
                </p>
            )}

            {selectedUserForBadge && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900">
                  {selectedUserForBadge.full_name}
                </p>
                <p className="text-sm text-blue-700">{selectedUserForBadge.email}</p>
                <p className="text-xs text-blue-600 mt-2">
                  Emblemas atuais: {selectedUserForBadge.achievements_badges?.length || 0}
                </p>
              </div>
            )}

            {selectedUserForBadge && (
              <>
                <div>
                  <Label className="mb-3 block">Selecione o Emblema para Conceder</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {allBadges.map((badge) => {
                      const alreadyHas = selectedUserForBadge.achievements_badges?.some(
                        b => b.badge_id === badge.id
                      );

                      return (
                        <Card
                          key={badge.id}
                          className={`cursor-pointer transition-all border ${
                            alreadyHas
                              ? 'opacity-50 cursor-not-allowed bg-gray-100'
                              : 'hover:shadow-lg hover:scale-105 bg-white'
                          }`}
                          onClick={() => {
                            if (!alreadyHas) {
                              grantBadgeMutation.mutate({
                                userEmail: selectedUserForBadge.email,
                                badge: badge
                              });
                            }
                          }}
                        >
                          <CardContent className="p-3 text-center">
                            <div className="text-3xl mb-2">{badge.icon}</div>
                            <p className="text-xs font-bold">{badge.name}</p>
                            {alreadyHas && (
                              <Badge className="mt-2 bg-gray-500 text-white text-[10px]">
                                Já possui
                              </Badge>
                            )}
                            {grantBadgeMutation.isPending && grantBadgeMutation.variables?.badge?.id === badge.id && (
                              <Badge className="mt-2 bg-blue-500 text-white text-[10px]">
                                Concedendo...
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Badge Modal */}
      <Dialog open={showRemoveBadgeModal} onOpenChange={setShowRemoveBadgeModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Remover Emblema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="remove-user-email-search">Email do Usuário</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="remove-user-email-search"
                  type="email"
                  value={userEmailSearch}
                  onChange={(e) => setUserEmailSearch(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="flex-1"
                />
                <Button
                  onClick={() => searchUserMutation.mutate(userEmailSearch)}
                  disabled={searchUserMutation.isPending || !userEmailSearch}
                >
                  {searchUserMutation.isPending ? "Buscando..." : <><Search className="w-4 h-4 mr-2" /> Buscar</>}
                </Button>
              </div>
            </div>

            {searchUserMutation.isError && (
                <p className="text-red-500 text-sm">
                  {searchUserMutation.error.message || 'Erro ao buscar usuário.'}
                </p>
            )}

            {selectedUserForBadge && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="font-semibold text-blue-900">
                  {selectedUserForBadge.full_name}
                </p>
                <p className="text-sm text-blue-700">{selectedUserForBadge.email}</p>
              </div>
            )}

            {selectedUserForBadge && selectedUserForBadge.achievements_badges?.length > 0 ? (
              <>
                <Label>Clique no emblema para remover</Label>
                <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {selectedUserForBadge.achievements_badges.map((badge, idx) => (
                    <Card
                      key={idx}
                      className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all hover:border-red-300"
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja remover o emblema "${badge.name}" de ${selectedUserForBadge.email}?`)) {
                          removeBadgeMutation.mutate({
                            userEmail: selectedUserForBadge.email,
                            badgeId: badge.badge_id
                          });
                        }
                      }}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="text-3xl mb-2">{badge.icon}</div>
                        <p className="text-xs font-bold truncate">{badge.name}</p>
                        {removeBadgeMutation.isPending && removeBadgeMutation.variables?.badgeId === badge.badge_id && (
                          <Badge className="mt-2 bg-red-500 text-white text-[10px]">
                            Removendo...
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : selectedUserForBadge ? (
              <p className="text-center text-gray-600 py-8">
                Este usuário não possui emblemas
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
