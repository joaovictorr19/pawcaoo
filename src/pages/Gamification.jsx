
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
import { Textarea } from "@/components/ui/textarea"; // Added Textarea
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"; // Added Avatar components
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
  const [showCreateCustomBadgeModal, setShowCreateCustomBadgeModal] = useState(false); // New state
  const [selectedUserForBadge, setSelectedUserForBadge] = useState(null);
  // const [selectedBadgeToRemove, setSelectedBadgeToRemove] = useState(null); // Removed as badge_id is passed directly
  const [userEmailSearch, setUserEmailSearch] = useState('');
  const [customBadgeForm, setCustomBadgeForm] = useState({ // New state for custom badge form
    name: "",
    description: "",
    icon: "⭐",
    image_url: "",
    rarity: "common",
    category: "special"
  });
  const [uploadingCustomBadgeImage, setUploadingCustomBadgeImage] = useState(false); // New state for custom badge image upload

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

  // XP POR RARIDADE
  const getXPForRarity = (rarity) => {
    const xpByRarity = {
      common: 100,
      rare: 300,
      epic: 600,
      legendary: 1000
    };
    return xpByRarity[rarity] || 100;
  };

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

  // MUTATION CORRIGIDA - Conceder emblema com XP baseado em raridade
  const grantBadgeMutation = useMutation({
    mutationFn: async ({ userEmail, badge }) => {
      const users = await base44.entities.User.filter({ email: userEmail });
      if (users.length === 0) throw new Error('Usuário não encontrado');

      const targetUser = users[0];
      const currentBadges = targetUser.public_badges || [];

      // Gerar ID único
      const badgeId = badge.id || `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if user already has this badge
      if (currentBadges.some(b => b.badge_id === badgeId) || (targetUser.achievements_badges || []).some(b => b.badge_id === badgeId)) {
        throw new Error('Usuário já possui este emblema');
      }

      const badgeXP = getXPForRarity(badge.rarity);

      const newBadge = {
        badge_id: badgeId,
        name: badge.name,
        description: badge.description || badge.desc,
        icon: badge.icon,
        image_url: badge.image_url || null,
        rarity: badge.rarity,
        category: badge.category || "special",
        xp: badgeXP,
        earned_date: new Date().toISOString(),
      };

      await base44.entities.User.update(targetUser.id, {
        public_badges: [...currentBadges, newBadge]
      });

      // Grant XP for the badge
      const newXP = (targetUser.gamification_xp || 0) + badgeXP;
      const newLevel = Math.floor(newXP / 500) + 1;
      await base44.entities.User.update(targetUser.id, {
        gamification_xp: newXP,
        gamification_level: newLevel,
      });

      return { badge: newBadge, xp: badgeXP };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['allUsers']); // Assuming 'allUsers' query exists for admin panels
      queryClient.invalidateQueries(['profileUser', selectedUserForBadge?.id]); // Invalidate user profile if applicable
      
      if (selectedUserForBadge && data.badge) {
        setSelectedUserForBadge(prev => ({
          ...prev,
          public_badges: [...(prev.public_badges || []), data.badge],
          gamification_xp: (prev.gamification_xp || 0) + data.xp,
          gamification_level: Math.floor(((prev.gamification_xp || 0) + data.xp) / 500) + 1,
        }));
      }
      toast.success(`✅ Emblema "${data.badge.name}" concedido! +${data.xp} XP`);
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
      
      // Check both public and achievements badges
      const currentPublicBadges = targetUser.public_badges || [];
      const currentAchievementsBadges = targetUser.achievements_badges || [];

      let badgeToRemove = currentPublicBadges.find(b => b.badge_id === badgeId);
      let isPublicBadge = true;

      if (!badgeToRemove) {
        badgeToRemove = currentAchievementsBadges.find(b => b.badge_id === badgeId);
        isPublicBadge = false;
      }

      if (!badgeToRemove) {
        throw new Error('Emblema não encontrado para este usuário');
      }

      const updatedBadges = isPublicBadge
        ? currentPublicBadges.filter(b => b.badge_id !== badgeId)
        : currentAchievementsBadges.filter(b => b.badge_id !== badgeId);

      const updateField = isPublicBadge ? 'public_badges' : 'achievements_badges';

      await base44.entities.User.update(targetUser.id, {
        [updateField]: updatedBadges
      });

      // Revoke XP for the badge
      const badgeXP = badgeToRemove.xp || getXPForRarity(badgeToRemove.rarity);
      const newXP = Math.max(0, (targetUser.gamification_xp || 0) - badgeXP);
      const newLevel = Math.floor(newXP / 500) + 1;
      await base44.entities.User.update(targetUser.id, {
        gamification_xp: newXP,
        gamification_level: newLevel,
      });
      
      return { badge: badgeToRemove, xp: badgeXP, isPublicBadge };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['allUsers']);
      queryClient.invalidateQueries(['profileUser', selectedUserForBadge?.id]);
      
      if (selectedUserForBadge && data.badge) {
        setSelectedUserForBadge(prev => {
          const updatedPublicBadges = data.isPublicBadge 
            ? (prev.public_badges || []).filter(b => b.badge_id !== data.badge.badge_id)
            : (prev.public_badges || []);
          const updatedAchievementsBadges = !data.isPublicBadge
            ? (prev.achievements_badges || []).filter(b => b.badge_id !== data.badge.badge_id)
            : (prev.achievements_badges || []);
          
          return {
            ...prev,
            public_badges: updatedPublicBadges,
            achievements_badges: updatedAchievementsBadges,
            gamification_xp: Math.max(0, (prev.gamification_xp || 0) - data.xp),
            gamification_level: Math.floor(Math.max(0, (prev.gamification_xp || 0) - data.xp) / 500) + 1,
          };
        });
      }
      setShowRemoveBadgeModal(false);
      toast.success(`❌ Emblema "${data.badge.name}" removido! -${data.xp} XP`);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover emblema');
    }
  });

  const searchUserMutation = useMutation({
    mutationFn: async (email) => {
      console.log('🔍 Buscando usuário:', email);
      
      const allUsers = await base44.entities.User.list();
      console.log('👥 Total de usuários:', allUsers.length);
      
      const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        console.log('❌ Usuário não encontrado');
        throw new Error('Usuário não encontrado');
      }
      
      console.log('✅ Usuário encontrado:', {
        email: user.email,
        name: user.full_name,
        public_badges: user.public_badges?.length || 0,
        achievements_badges: user.achievements_badges?.length || 0
      });
      
      return user;
    },
    onSuccess: (user) => {
      setSelectedUserForBadge(user);
      toast.success(`✅ Usuário ${user.full_name} encontrado!`);
    },
    onError: (error) => {
      setSelectedUserForBadge(null);
      toast.error(error.message || 'Usuário não encontrado');
    }
  });

  const uploadCustomBadgeImageMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (url) => {
      setCustomBadgeForm({ ...customBadgeForm, image_url: url, icon: "" }); // Clear icon if image is uploaded
      setUploadingCustomBadgeImage(false);
      toast.success("✅ Imagem carregada!");
    },
    onError: () => {
      setUploadingCustomBadgeImage(false);
      toast.error("❌ Erro ao carregar imagem");
    }
  });

  // Calculate XP needed for next level
  const xpPerLevel = 500;
  const currentLevelXP = user?.gamification_xp || 0;
  const currentLevel = user?.gamification_level || 1;
  // const xpNeededForNextLevel = currentLevel * xpPerLevel; // This was wrong logic
  const xpNeededForNextLevel = (currentLevel * xpPerLevel) - currentLevelXP; // XP left in current level
  const xpInCurrentLevel = currentLevelXP - ((currentLevel - 1) * xpPerLevel); // XP earned in the current level
  const xpProgressPercentage = (xpInCurrentLevel / xpPerLevel) * 100;

  // All possible badges (truncated from outline)
  const allBadges = [
    { id: "first_post", name: "First Post", desc: "Publique seu primeiro post", icon: "📝", category: "social", rarity: "common", requirement: 1, current: user?.profile_stats?.total_posts || 0, stat: "total_posts", xp: getXPForRarity("common") },
    { id: "social_butterfly", name: "Social Butterfly", desc: "50+ posts publicados", icon: "🦋", category: "social", rarity: "rare", requirement: 50, current: user?.profile_stats?.total_posts || 0, stat: "total_posts", xp: getXPForRarity("rare") },
    { id: "content_king", name: "Content King", desc: "100+ posts publicados", icon: "👑", category: "social", rarity: "epic", requirement: 100, current: user?.profile_stats?.total_posts || 0, stat: "total_posts", xp: getXPForRarity("epic") },
    { id: "popular", name: "Popular", desc: "Receba 100+ curtidas", icon: "❤️", category: "social", rarity: "rare", requirement: 100, current: user?.profile_stats?.total_likes_received || 0, stat: "total_likes_received", xp: getXPForRarity("rare") },
    { id: "influencer", name: "Influencer", desc: "500+ curtidas recebidas", icon: "⭐", category: "social", rarity: "epic", requirement: 500, current: user?.profile_stats?.total_likes_received || 0, stat: "total_likes_received", xp: getXPForRarity("epic") },
    { id: "community_helper", name: "Community Helper", desc: "50+ comentários escritos", icon: "💬", category: "social", rarity: "rare", requirement: 50, current: user?.profile_stats?.total_comments_made || 0, stat: "total_comments_made", xp: getXPForRarity("rare") },
    { id: "first_booking", name: "First Booking", desc: "Faça sua primeira reserva", icon: "🎫", category: "activity", rarity: "common", requirement: 1, current: user?.profile_stats?.total_bookings || 0, stat: "total_bookings", xp: getXPForRarity("common") },
    { id: "regular_user", name: "Regular User", desc: "10+ reservas realizadas", icon: "📅", category: "activity", rarity: "rare", requirement: 10, current: user?.profile_stats?.total_bookings || 0, stat: "total_bookings", xp: getXPForRarity("rare") },
    { id: "streak_starter", name: "Streak Starter", desc: "7 dias consecutivos", icon: "🔥", category: "activity", rarity: "common", requirement: 7, current: user?.daily_streak || 0, stat: "daily_streak", xp: getXPForRarity("common") },
    { id: "streak_master", name: "Streak Master", desc: "30 dias consecutivos", icon: "🔥", category: "activity", rarity: "epic", requirement: 30, current: user?.daily_streak || 0, stat: "daily_streak", xp: getXPForRarity("epic") },
    { id: "profile_complete", name: "Profile Complete", desc: "Complete 100% do perfil", icon: "✅", category: "milestone", rarity: "common", requirement: 100, current: user?.profile_completion_percentage || 0, stat: "profile_completion_percentage", xp: getXPForRarity("common") },
    { id: "adoption_hero_auto", name: "Adoption Hero", desc: "Adote um pet resgatado", icon: "🏠", category: "milestone", rarity: "epic", requirement: 1, current: user?.profile_stats?.total_adoptions || 0, stat: "total_adoptions", xp: getXPForRarity("epic") },
  ];

  // Filter earned badges - USAR AMBOS achievements_badges E public_badges
  const earnedAchievementsBadges = user?.achievements_badges || [];
  const earnedPublicBadges = user?.public_badges || [];
  const allEarnedBadges = [...earnedAchievementsBadges, ...earnedPublicBadges];
  const earnedBadgeIds = allEarnedBadges.map(b => b.badge_id);

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
                  <p className="text-3xl font-bold text-purple-600">{allEarnedBadges.length}</p>
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

        {/* Admin Controls - APENAS ADMIN */}
        {user?.role === 'admin' && (
          <div className="grid md:grid-cols-4 gap-3 mb-6">
            <Button
              onClick={() => {
                setShowGrantBadgeModal(true);
                setSelectedUserForBadge(null);
                setUserEmailSearch('');
              }}
              className="bg-green-600 hover:bg-green-700 h-12"
            >
              <Plus className="w-5 h-5 mr-2" />
              Conceder Emblema
            </Button>
            <Button
              onClick={() => {
                setShowRemoveBadgeModal(true);
                setSelectedUserForBadge(null);
                setUserEmailSearch('');
              }}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 h-12"
            >
              <Trash className="w-5 h-5 mr-2" />
              Remover Emblema
            </Button>
            <Button
              onClick={() => {
                setShowCreateCustomBadgeModal(true);
                setCustomBadgeForm({ name: "", description: "", icon: "⭐", image_url: "", rarity: "common", category: "special" });
                setSelectedUserForBadge(null);
                setUserEmailSearch('');
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Emblema
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


          {/* Badges Tab - SINCRONIZADO */}
          <TabsContent value="badges">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  Meus Emblemas ({allEarnedBadges.length})
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {earnedAchievementsBadges.length} conquistas automáticas + {earnedPublicBadges.length} especiais
                </p>
              </CardHeader>
              <CardContent>
                {allEarnedBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Nenhum emblema ainda</p>
                    <Button onClick={() => document.querySelector('[value="missions"]')?.click()}>
                      Ver Missões
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {allEarnedBadges.map((badge, idx) => {
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
                          {badge.xp && (
                            <Badge className="mt-1 bg-green-600 text-white text-[10px]">
                              +{badge.xp} XP
                            </Badge>
                          )}
                          {badge.rarity && (
                            <Badge className={`mt-1 text-[10px] ${
                              badge.rarity === 'legendary' ? 'bg-yellow-500' :
                              badge.rarity === 'epic' ? 'bg-purple-500' :
                              badge.rarity === 'rare' ? 'bg-blue-500' :
                              'bg-gray-500'
                            } text-white`}>
                              {badge.rarity}
                            </Badge>
                          )}
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

          {/* Leaderboard Preview */}
          <TabsContent value="leaderboard">
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

      {/* Grant Badge Modal - CORRIGIDO */}
      <Dialog open={showGrantBadgeModal} onOpenChange={setShowGrantBadgeModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">🎁 Conceder Emblema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="user-email-search">Email do Usuário *</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="user-email-search"
                  type="email"
                  value={userEmailSearch}
                  onChange={(e) => setUserEmailSearch(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userEmailSearch) {
                      searchUserMutation.mutate(userEmailSearch);
                    }
                  }}
                />
                <Button
                  onClick={() => searchUserMutation.mutate(userEmailSearch)}
                  disabled={searchUserMutation.isPending || !userEmailSearch}
                >
                  {searchUserMutation.isPending ? "Buscando..." : <><Search className="w-4 h-4 mr-2" /> Buscar</>}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Digite o email completo e clique em Buscar
              </p>
            </div>

            {searchUserMutation.isError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm font-semibold">
                  ❌ {searchUserMutation.error.message || 'Erro ao buscar usuário.'}
                </p>
              </div>
            )}

            {selectedUserForBadge && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-blue-500">
                    <AvatarImage src={selectedUserForBadge.profile_photo_url} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {selectedUserForBadge.full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-blue-900">{selectedUserForBadge.full_name}</p>
                    <p className="text-sm text-blue-700">{selectedUserForBadge.email}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Emblemas: {(selectedUserForBadge.public_badges?.length || 0) + (selectedUserForBadge.achievements_badges?.length || 0)} •
                      Nível {selectedUserForBadge.gamification_level || 1} •
                      {selectedUserForBadge.gamification_xp || 0} XP
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedUserForBadge && (
              <>
                <div>
                  <Label className="mb-3 block text-lg">Selecione o Emblema (clique para conceder)</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                    {[
                      { id: "verified_pro", name: "Profissional Verificado", description: "Profissional verificado e confiável", icon: "✓", rarity: "rare", category: "professional" },
                      { id: "top_walker", name: "Top Walker", description: "Um dos melhores passeadores", icon: "🏆", rarity: "epic", category: "professional" },
                      { id: "adoption_hero_admin", name: "Herói de Adoção", description: "Ajudou em múltiplas adoções", icon: "💖", rarity: "legendary", category: "milestone" },
                      { id: "community_legend", name: "Lenda da Comunidade", description: "Membro lendário", icon: "👑", rarity: "legendary", category: "special" },
                      { id: "early_supporter", name: "Apoiador Inicial", description: "Um dos primeiros membros", icon: "⭐", rarity: "epic", category: "milestone" },
                      { id: "beta_tester", name: "Beta Tester", description: "Ajudou a testar a plataforma", icon: "🧪", rarity: "epic", category: "special" },
                      { id: "super_helper", name: "Super Helper", description: "Ajudou muitos membros", icon: "🦸", rarity: "rare", category: "social" },
                      { id: "event_master", name: "Event Master", description: "Organizou eventos incríveis", icon: "🎪", rarity: "rare", category: "social" },
                    ].map((badge) => {
                      const alreadyHas = (selectedUserForBadge.public_badges?.some(b => b.badge_id === badge.id)) || (selectedUserForBadge.achievements_badges?.some(b => b.badge_id === badge.id));

                      const badgeXP = getXPForRarity(badge.rarity);

                      return (
                        <Card
                          key={badge.id}
                          className={`cursor-pointer transition-all border-2 ${
                            alreadyHas
                              ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300'
                              : 'hover:shadow-lg hover:scale-105 bg-white border-purple-200 hover:border-purple-400'
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
                          <CardContent className="p-4 text-center">
                            <div className="text-4xl mb-2">{badge.icon}</div>
                            <p className="text-sm font-bold mb-1">{badge.name}</p>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{badge.description}</p>
                            <div className="flex gap-1 justify-center flex-wrap">
                              <Badge className={`text-xs ${
                                badge.rarity === 'legendary' ? 'bg-yellow-500' :
                                badge.rarity === 'epic' ? 'bg-purple-500' :
                                badge.rarity === 'rare' ? 'bg-blue-500' :
                                'bg-gray-500'
                              } text-white`}>
                                {badge.rarity}
                              </Badge>
                              <Badge className="bg-green-600 text-white text-xs">
                                +{badgeXP} XP
                              </Badge>
                            </div>
                            {alreadyHas && (
                              <Badge className="mt-2 bg-gray-500 text-white text-xs">
                                ✓ Já possui
                              </Badge>
                            )}
                            {grantBadgeMutation.isPending && grantBadgeMutation.variables?.badge?.id === badge.id && (
                              <Badge className="mt-2 bg-blue-500 text-white text-xs animate-pulse">
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

      {/* Remove Badge Modal - CORRIGIDO */}
      <Dialog open={showRemoveBadgeModal} onOpenChange={setShowRemoveBadgeModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">🗑️ Remover Emblema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="remove-user-email-search">Email do Usuário *</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="remove-user-email-search"
                  type="email"
                  value={userEmailSearch}
                  onChange={(e) => setUserEmailSearch(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && userEmailSearch) {
                      searchUserMutation.mutate(userEmailSearch);
                    }
                  }}
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
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm font-semibold">
                  ❌ {searchUserMutation.error.message || 'Erro ao buscar usuário.'}
                </p>
              </div>
            )}

            {selectedUserForBadge && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-blue-500">
                    <AvatarImage src={selectedUserForBadge.profile_photo_url} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {selectedUserForBadge.full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-blue-900">{selectedUserForBadge.full_name}</p>
                    <p className="text-sm text-blue-700">{selectedUserForBadge.email}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Emblemas: {(selectedUserForBadge.public_badges?.length || 0) + (selectedUserForBadge.achievements_badges?.length || 0)} •
                      Nível {selectedUserForBadge.gamification_level || 1} •
                      {selectedUserForBadge.gamification_xp || 0} XP
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedUserForBadge && (selectedUserForBadge.public_badges?.length > 0 || selectedUserForBadge.achievements_badges?.length > 0) ? (
              <>
                <Label className="text-lg">Clique no emblema para remover</Label>
                
                {selectedUserForBadge.public_badges?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 mt-4">🎁 Emblemas Especiais (Concedidos manualmente: {selectedUserForBadge.public_badges.length})</p>
                    <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 bg-purple-50 rounded-lg">
                      {selectedUserForBadge.public_badges.map((badge, idx) => (
                        <Card
                          key={idx}
                          className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all hover:border-red-400 border-2 border-purple-200"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja remover "${badge.name}" (Emblema Especial)?\n\nIsso também removerá ${badge.xp || getXPForRarity(badge.rarity)} XP`)) {
                              removeBadgeMutation.mutate({
                                userEmail: selectedUserForBadge.email,
                                badgeId: badge.badge_id
                              });
                            }
                          }}
                        >
                          <CardContent className="p-3 text-center">
                            {badge.image_url ? (
                              <img src={badge.image_url} className="w-16 h-16 mx-auto mb-2 rounded-lg" alt={badge.name} />
                            ) : (
                              <div className="text-3xl mb-2">{badge.icon}</div>
                            )}
                            <p className="text-xs font-bold truncate">{badge.name}</p>
                            <Badge className="mt-1 bg-red-600 text-white text-[10px]">
                              -{badge.xp || getXPForRarity(badge.rarity)} XP
                            </Badge>
                            {removeBadgeMutation.isPending && removeBadgeMutation.variables?.badgeId === badge.badge_id && (
                              <Badge className="mt-2 bg-orange-500 text-white text-[10px] animate-pulse">
                                Removendo...
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {selectedUserForBadge.achievements_badges?.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 mt-4">🏆 Emblemas de Conquista (Ganhos automaticamente: {selectedUserForBadge.achievements_badges.length})</p>
                    <p className="text-xs text-gray-500 mb-2">⚠️ Estes são ganhos automaticamente. Remova apenas se houver necessidade de correção manual.</p>
                    <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 bg-yellow-50 rounded-lg">
                      {selectedUserForBadge.achievements_badges.map((badge, idx) => (
                        <Card
                          key={idx}
                          className="cursor-pointer hover:shadow-lg hover:scale-105 transition-all hover:border-red-400 border-2 border-yellow-200"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja remover "${badge.name}" (Emblema de Conquista)?\n\nIsso também removerá ${badge.xp || getXPForRarity(badge.rarity)} XP`)) {
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
                            <Badge className="mt-1 bg-red-600 text-white text-[10px]">
                              -{badge.xp || getXPForRarity(badge.rarity)} XP
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : selectedUserForBadge ? (
              <p className="text-center text-gray-600 py-8 bg-gray-50 rounded-lg">
                Este usuário não possui emblemas
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* NOVO: Create Custom Badge Modal */}
      <Dialog open={showCreateCustomBadgeModal} onOpenChange={setShowCreateCustomBadgeModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-purple-500" />
              Criar Emblema Customizado
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Crie um emblema único e conceda a um usuário específico
            </p>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Buscar Usuário */}
            <Card className="bg-blue-50 border-2 border-blue-200">
              <CardContent className="p-4">
                <Label className="text-lg font-bold mb-3 block">1️⃣ Buscar Usuário</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={userEmailSearch}
                    onChange={(e) => setUserEmailSearch(e.target.value)}
                    placeholder="usuario@exemplo.com"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && userEmailSearch) {
                        searchUserMutation.mutate(userEmailSearch);
                      }
                    }}
                  />
                  <Button
                    onClick={() => searchUserMutation.mutate(userEmailSearch)}
                    disabled={searchUserMutation.isPending || !userEmailSearch}
                  >
                    {searchUserMutation.isPending ? "..." : <><Search className="w-4 h-4 mr-2" /> Buscar</>}
                  </Button>
                </div>
                
                {searchUserMutation.isError && (
                  <p className="text-red-500 text-sm mt-2">
                    {searchUserMutation.error.message || 'Erro ao buscar usuário.'}
                  </p>
                )}

                {selectedUserForBadge && (
                  <div className="mt-3 p-3 bg-white border border-blue-300 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedUserForBadge.profile_photo_url} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {selectedUserForBadge.full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{selectedUserForBadge.full_name}</p>
                        <p className="text-xs text-gray-600">{selectedUserForBadge.email}</p>
                      </div>
                      <Badge className="ml-auto bg-blue-600 text-white">
                        ✓ Selecionado
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Criar Emblema */}
            <Card className="bg-purple-50 border-2 border-purple-200">
              <CardContent className="p-4">
                <Label className="text-lg font-bold mb-3 block">2️⃣ Criar Emblema</Label>
                
                {/* Image Upload */}
                <div className="mb-4 p-4 bg-white rounded-lg border-2 border-dashed border-purple-300">
                  <Label className="text-xs font-bold mb-2 block">Imagem do Emblema (PNG 64x64px)</Label>
                  <div className="flex items-center gap-4">
                    {customBadgeForm.image_url ? (
                      <div className="relative">
                        <img
                          src={customBadgeForm.image_url}
                          alt="Badge preview"
                          className="w-20 h-20 rounded-xl object-cover border-2 border-purple-500 shadow-lg"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <button
                          type="button"
                          onClick={() => setCustomBadgeForm({...customBadgeForm, image_url: "", icon: "⭐"})}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-300 text-4xl">
                        {customBadgeForm.icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setUploadingCustomBadgeImage(true);
                            uploadCustomBadgeImageMutation.mutate(file);
                          }
                        }}
                        disabled={uploadingCustomBadgeImage}
                        className="h-9 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadingCustomBadgeImage ? "A carregar..." : "PNG ou JPG (64x64px recomendado)"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label>Nome do Emblema *</Label>
                    <Input
                      value={customBadgeForm.name}
                      onChange={(e) => setCustomBadgeForm({...customBadgeForm, name: e.target.value})}
                      placeholder="Ex: Contribuidor Top 2025"
                    />
                  </div>
                  <div>
                    <Label>Emoji (se não usar imagem)</Label>
                    <Input
                      value={customBadgeForm.icon}
                      onChange={(e) => setCustomBadgeForm({...customBadgeForm, icon: e.target.value})}
                      placeholder="⭐"
                      maxLength={2}
                      disabled={!!customBadgeForm.image_url}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <Label>Descrição *</Label>
                  <Textarea
                    value={customBadgeForm.description}
                    onChange={(e) => setCustomBadgeForm({...customBadgeForm, description: e.target.value})}
                    placeholder="Descreva o emblema e como foi conquistado..."
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Raridade</Label>
                    <select
                      value={customBadgeForm.rarity}
                      onChange={(e) => setCustomBadgeForm({...customBadgeForm, rarity: e.target.value})}
                      className="w-full h-10 px-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="common">Comum (+{getXPForRarity("common")} XP)</option>
                      <option value="rare">Raro (+{getXPForRarity("rare")} XP)</option>
                      <option value="epic">Épico (+{getXPForRarity("epic")} XP)</option>
                      <option value="legendary">Lendário (+{getXPForRarity("legendary")} XP)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Categoria</Label>
                    <select
                      value={customBadgeForm.category}
                      onChange={(e) => setCustomBadgeForm({...customBadgeForm, category: e.target.value})}
                      className="w-full h-10 px-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="social">Social</option>
                      <option value="activity">Atividade</option>
                      <option value="milestone">Marco</option>
                      <option value="special">Especial</option>
                      <option value="professional">Profissional</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            {customBadgeForm.name && customBadgeForm.description && selectedUserForBadge && (
              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300">
                <CardContent className="p-6">
                  <Label className="text-lg font-bold mb-4 block">✨ Preview</Label>
                  <div className="flex items-center gap-4">
                    <div className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center ${
                      customBadgeForm.rarity === 'legendary' ? 'border-yellow-500 bg-yellow-100' :
                      customBadgeForm.rarity === 'epic' ? 'border-purple-500 bg-purple-100' :
                      customBadgeForm.rarity === 'rare' ? 'border-blue-500 bg-blue-100' :
                      'border-gray-500 bg-gray-100'
                    }`}>
                      {customBadgeForm.image_url ? (
                        <img src={customBadgeForm.image_url} className="w-16 h-16 rounded-lg" alt="Preview" />
                      ) : (
                        <span className="text-5xl">{customBadgeForm.icon}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-xl">{customBadgeForm.name}</p>
                      <p className="text-sm text-gray-600">{customBadgeForm.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className={`${
                          customBadgeForm.rarity === 'legendary' ? 'bg-yellow-500' :
                          customBadgeForm.rarity === 'epic' ? 'bg-purple-500' :
                          customBadgeForm.rarity === 'rare' ? 'bg-blue-500' :
                          'bg-gray-500'
                        } text-white`}>
                          {customBadgeForm.rarity}
                        </Badge>
                        <Badge className="bg-green-600 text-white">
                          +{getXPForRarity(customBadgeForm.rarity)} XP
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-yellow-400">
                    <p className="text-sm">
                      <strong>Será concedido para:</strong> {selectedUserForBadge.full_name} ({selectedUserForBadge.email})
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateCustomBadgeModal(false);
                setCustomBadgeForm({
                  name: "",
                  description: "",
                  icon: "⭐",
                  image_url: "",
                  rarity: "common",
                  category: "special"
                });
                setSelectedUserForBadge(null);
                setUserEmailSearch("");
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!customBadgeForm.name || !customBadgeForm.description) {
                  toast.error("Por favor, preencha o nome e a descrição do emblema.");
                  return;
                }
                if (!customBadgeForm.image_url && !customBadgeForm.icon) {
                  toast.error("Por favor, adicione uma imagem ou um emoji para o emblema.");
                  return;
                }
                if (!selectedUserForBadge) {
                  toast.error("Por favor, selecione um usuário primeiro.");
                  return;
                }
                
                grantBadgeMutation.mutate({
                  userEmail: selectedUserForBadge.email,
                  badge: {
                    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID for custom badges
                    name: customBadgeForm.name,
                    description: customBadgeForm.description,
                    icon: customBadgeForm.icon,
                    image_url: customBadgeForm.image_url,
                    rarity: customBadgeForm.rarity,
                    category: customBadgeForm.category
                  }
                });
                
                // Reset form
                setShowCreateCustomBadgeModal(false);
                setCustomBadgeForm({
                  name: "",
                  description: "",
                  icon: "⭐",
                  image_url: "",
                  rarity: "common",
                  category: "special"
                });
                setSelectedUserForBadge(null);
                setUserEmailSearch("");
              }}
              disabled={grantBadgeMutation.isPending || !selectedUserForBadge || !customBadgeForm.name || !customBadgeForm.description || (!customBadgeForm.image_url && !customBadgeForm.icon)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {grantBadgeMutation.isPending ? (
                <>
                  <Award className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar e Conceder
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
