
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin, Users, Heart, MessageCircle, ArrowLeft,
  Link as LinkIcon, CheckCircle, Dog, Calendar,
  Award, TrendingUp, Bookmark, Grid, Shield, ShieldCheck, Star,
  Target, Zap, Flame, Sparkles, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');
  const [activeTab, setActiveTab] = useState("posts");

  const { data: currentUser, isLoading: loadingCurrentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!profileEmail && currentUser?.email) {
      navigate(createPageUrl(`UserProfile?email=${currentUser.email}`), { replace: true });
    }
  }, [profileEmail, currentUser, navigate]);

  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ['profileUser', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return null;
      const users = await base44.entities.User.list();
      return users.find(u => u.email === profileEmail) || null;
    },
    enabled: !!profileEmail,
    retry: 1,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['userPosts', profileEmail],
    queryFn: () => base44.entities.SocialPost.filter({
      author_email: profileEmail,
      moderation_status: 'approved'
    }, '-created_date'),
    enabled: !!profileEmail,
    initialData: [],
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: userDogs = [] } = useQuery({
    queryKey: ['userDogs', profileEmail],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: profileEmail }),
    enabled: !!profileEmail,
    initialData: [],
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const { data: followData = { followers: [], following: [], isFollowing: false } } = useQuery({
    queryKey: ['followData', profileEmail],
    queryFn: async () => {
      const followers = await base44.entities.SocialFollow.filter({ following_email: profileEmail, status: 'accepted' });
      const following = await base44.entities.SocialFollow.filter({ follower_email: profileEmail, status: 'accepted' });
      const isFollowing = currentUser ? followers.some(f => f.follower_email === currentUser.email) : false;
      return { followers, following, isFollowing };
    },
    enabled: !!profileEmail && !!currentUser,
    initialData: { followers: [], following: [], isFollowing: false },
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const { data: savedPosts = [] } = useQuery({
    queryKey: ['userSavedPosts', currentUser?.email],
    queryFn: async () => {
      const saved = await base44.entities.SocialSavedPost.filter({ user_email: currentUser?.email });
      const postIds = saved.map(s => s.post_id);
      if (postIds.length === 0) return [];
      const allPosts = await base44.entities.SocialPost.list();
      return allPosts.filter(p => postIds.includes(p.id));
    },
    enabled: !!currentUser && profileEmail === currentUser?.email,
    initialData: [],
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const followMutation = useMutation({
    mutationFn: async (isFollowing) => {
      if (isFollowing) {
        const follow = followData.followers.find(f => f.follower_email === currentUser.email);
        if (follow) await base44.entities.SocialFollow.delete(follow.id);
      } else {
        await base44.entities.SocialFollow.create({
          follower_email: currentUser.email,
          follower_name: currentUser.full_name,
          follower_photo_url: currentUser.profile_photo_url,
          following_email: profileEmail,
          following_name: profileUser.full_name,
          status: 'accepted'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['followData']);
      toast.success(followData.isFollowing ? "Deixou de seguir" : "Agora segue");
    },
  });

  const isOwnProfile = currentUser?.email === profileEmail;

  // Gamification
  const xpForNextLevel = (level) => level * 500;
  const currentLevelXP = profileUser?.gamification_xp || 0;
  const currentLevel = profileUser?.gamification_level || 1;
  const xpNeeded = xpForNextLevel(currentLevel);
  const xpProgress = ((currentLevelXP % xpNeeded) / xpNeeded) * 100;

  const dailyQuests = [
    { id: 1, title: "Publicar 1 foto", reward: 50, completed: (profileUser?.profile_stats?.total_posts || 0) > 0 },
    { id: 2, title: "Dar 5 curtidas", reward: 25, completed: false },
    { id: 3, title: "3 comentários", reward: 30, completed: (profileUser?.profile_stats?.total_comments_made || 0) >= 3 },
    { id: 4, title: "Visitar Dog Connect", reward: 20, completed: true },
  ];

  // Pixel Art Badge Generator
  const getPixelBadge = (type) => {
    const badges = {
      admin: `data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='48' height='48' fill='%23dc2626'/%3E%3Crect x='8' y='8' width='32' height='32' fill='%23991b1b'/%3E%3Crect x='12' y='12' width='24' height='24' fill='%23fca5a5'/%3E%3Crect x='16' y='16' width='16' height='16' fill='%23dc2626'/%3E%3Crect x='20' y='20' width='8' height='8' fill='%23fef2f2'/%3E%3C/svg%3E`,
      moderator: `data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='48' height='48' fill='%232563eb'/%3E%3Crect x='8' y='8' width='32' height='32' fill='%231e40af'/%3E%3Crect x='12' y='12' width='24' height='24' fill='%2393c5fd'/%3E%3Crect x='16' y='16' width='16' height='16' fill='%232563eb'/%3E%3Crect x='20' y='20' width='8' height='8' fill='%23eff6ff'/%3E%3C/svg%3E`,
      verified: `data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='48' height='48' fill='%2310b981'/%3E%3Crect x='8' y='8' width='32' height='32' fill='%23059669'/%3E%3Crect x='12' y='12' width='24' height='24' fill='%236ee7b7'/%3E%3Crect x='18' y='20' width='4' height='12' fill='%23fff'/%3E%3Crect x='22' y='16' width='4' height='8' fill='%23fff'/%3E%3C/svg%3E`,
      adoption: `data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='48' height='48' fill='%23ec4899'/%3E%3Crect x='8' y='8' width='32' height='32' fill='%23be185d'/%3E%3Crect x='12' y='12' width='24' height='24' fill='%23fbcfe8'/%3E%3Crect x='14' y='18' width='8' height='8' fill='%23ec4899'/%3E%3Crect x='26' y='18' width='8' height='8' fill='%23ec4899'/%3E%3Crect x='18' y='26' width='12' height='8' fill='%23ec4899'/%3E%3C/svg%3E`,
      level: (level) => `data:image/svg+xml,%3Csvg width='48' height='48' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='48' height='48' fill='%23f59e0b'/%3E%3Crect x='8' y='8' width='32' height='32' fill='%23d97706'/%3E%3Crect x='12' y='12' width='24' height='24' fill='%23fef3c7'/%3E%3Ctext x='24' y='32' font-family='monospace' font-size='20' font-weight='bold' fill='%23f59e0b' text-anchor='middle'%3E${level}%3C/text%3E%3C/svg%3E`,
      community: (badge) => {
        const colors = {
          legendary: { bg: '#eab308', mid: '#ca8a04', light: '#fef9c3', text: '#713f12' },
          epic: { bg: '#a855f7', mid: '#7c3aed', light: '#f3e8ff', text: '#581c87' },
          rare: { bg: '#3b82f6', mid: '#1d4ed8', light: '#dbeafe', text: '#1e3a8a' },
          common: { bg: '#6b7280', mid: '#4b5563', light: '#e5e7eb', text: '#1f2937' }
        };
        const c = colors[badge.rarity] || colors.common;
        return `data:image/svg+xml,%3Csvg width='64' height='64' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='64' height='64' fill='${encodeURIComponent(c.bg)}'/%3E%3Crect x='8' y='8' width='48' height='48' fill='${encodeURIComponent(c.mid)}'/%3E%3Crect x='12' y='12' width='40' height='40' fill='${encodeURIComponent(c.light)}'/%3E%3Ctext x='32' y='40' font-family='monospace' font-size='32' text-anchor='middle'%3E${badge.icon || '?'}%3C/text%3E%3C/svg%3E`;
      }
    };
    return badges[type] || null;
  };

  if (loadingCurrentUser || loadingUser || !profileEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">A carregar perfil...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="outline" className="mb-6" onClick={() => navigate(createPageUrl('SocialFeed'))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Usuário não encontrado</h3>
              <p className="text-gray-600 mb-6">O perfil não existe ou foi removido</p>
              <Button onClick={() => navigate(createPageUrl('SocialFeed'))}>Voltar</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getBadges = () => {
    const badges = [];
    if (profileUser.role === 'admin') {
      badges.push(
        <div key="admin" className="relative w-8 h-8">
          <img src={getPixelBadge('admin')} alt="Admin" className="w-8 h-8 pixelated" style={{imageRendering: 'pixelated'}} />
        </div>
      );
    }
    if (profileUser.social_role === 'moderator') {
      badges.push(
        <div key="mod" className="relative w-8 h-8">
          <img src={getPixelBadge('moderator')} alt="Moderator" className="w-8 h-8 pixelated" style={{imageRendering: 'pixelated'}} />
        </div>
      );
    }
    if (profileUser.is_verified) {
      badges.push(
        <div key="verified" className="relative w-8 h-8">
          <img src={getPixelBadge('verified')} alt="Verificado" className="w-8 h-8 pixelated" style={{imageRendering: 'pixelated'}} />
        </div>
      );
    }
    if (profileUser.is_adoption_advocate) {
      badges.push(
        <div key="advocate" className="relative w-8 h-8">
          <img src={getPixelBadge('adoption')} alt="Adoção" className="w-8 h-8 pixelated" style={{imageRendering: 'pixelated'}} />
        </div>
      );
    }
    return badges;
  };

  const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <Button variant="outline" className="mb-6" onClick={() => navigate(createPageUrl('SocialFeed'))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-0 shadow-2xl mb-6 overflow-hidden">
          <div className="relative h-48 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600">
            {profileUser.cover_photo_url && (
              <img src={profileUser.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>

          <CardContent className="relative px-6 md:px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-6 -mt-16">
              <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                <AvatarImage src={profileUser.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-4xl font-bold">
                  {profileUser.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 md:mt-16">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{profileUser.full_name}</h1>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {getBadges()}
                      
                      <div className="relative w-10 h-10">
                        <img 
                          src={getPixelBadge('level')(currentLevel)} 
                          alt={`Nível ${currentLevel}`} 
                          className="w-10 h-10 pixelated" 
                          style={{imageRendering: 'pixelated'}}
                        />
                      </div>
                    </div>
                  </div>

                  {!isOwnProfile && currentUser && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => followMutation.mutate(followData.isFollowing)}
                        disabled={followMutation.isPending}
                        className={followData.isFollowing ? 'bg-gray-200 text-gray-900' : 'bg-purple-600 text-white'}
                        size="sm"
                      >
                        {followData.isFollowing ? 'Seguindo' : 'Seguir'}
                      </Button>
                    </div>
                  )}

                  {isOwnProfile && (
                    <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl('MyProfile'))}>
                      Editar
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-xl font-bold">{userPosts.length}</div>
                    <div className="text-xs text-gray-600">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{followData.followers.length}</div>
                    <div className="text-xs text-gray-600">Seguidores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{followData.following.length}</div>
                    <div className="text-xs text-gray-600">Seguindo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{totalLikes}</div>
                    <div className="text-xs text-gray-600">Curtidas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-600 flex items-center justify-center">
                      <Flame className="w-4 h-4 mr-1" />
                      {profileUser.daily_streak || 0}
                    </div>
                    <div className="text-xs text-gray-600">Streak</div>
                  </div>
                </div>

                <Separator className="mb-4" />

                {profileUser.bio && <p className="text-gray-700 mb-3">{profileUser.bio}</p>}
              </div>
            </div>

            {userDogs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-bold mb-3">Meus Pets</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {userDogs.map(dog => (
                    <Card key={dog.id} className="border-2 border-purple-100">
                      <CardContent className="p-3">
                        <div className="relative mb-2">
                          {dog.photo_url ? (
                            <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-24 object-cover rounded-lg" />
                          ) : (
                            <div className="w-full h-24 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">🐕</div>
                          )}
                          {dog.is_adopted && (
                            <Badge className="absolute top-1 right-1 bg-pink-500 text-white text-xs">
                              <Heart className="w-2 h-2 mr-1" />Adotado
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-sm">{dog.dog_name}</h4>
                        <p className="text-xs text-gray-600">{dog.breed}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-lg rounded-xl p-1 h-12 mb-4">
            <TabsTrigger value="posts"><Grid className="w-4 h-4 mr-1" />Posts</TabsTrigger>
            <TabsTrigger value="gamification"><Zap className="w-4 h-4 mr-1" />XP</TabsTrigger>
            <TabsTrigger value="badges"><Award className="w-4 h-4 mr-1" />Badges</TabsTrigger>
            <TabsTrigger value="activity"><TrendingUp className="w-4 h-4 mr-1" />Stats</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="saved"><Bookmark className="w-4 h-4 mr-1" />Salvos</TabsTrigger>}
          </TabsList>

          <TabsContent value="posts">
            {userPosts.length === 0 ? (
              <Card><CardContent className="p-8 text-center"><Grid className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-600">Nenhum post</p></CardContent></Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-3">
                {userPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition">
                    <div className="h-48 bg-purple-100">
                      {post.media_urls?.[0] && <img src={post.media_urls[0]} className="w-full h-full object-cover" alt="Post" />}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-xs text-gray-700 line-clamp-2">{post.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="gamification">
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
                      <img 
                        src={getPixelBadge('level')(currentLevel)} 
                        alt={`Nível ${currentLevel}`} 
                        className="w-16 h-16 pixelated"
                        style={{imageRendering: 'pixelated'}}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Nível {currentLevel}</h2>
                      <p className="text-white/80 text-sm">{currentLevelXP % xpNeeded} / {xpNeeded} XP</p>
                    </div>
                  </div>
                  <Progress value={xpProgress} className="h-3 bg-white/20 mb-4" />
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-white/10 rounded">
                      <div className="text-lg font-bold">{profileUser?.public_badges?.length || 0}</div>
                      <div className="text-xs text-white/80">Badges</div>
                    </div>
                    <div className="text-center p-2 bg-white/10 rounded">
                      <div className="text-lg font-bold flex items-center justify-center">
                        <Flame className="w-4 h-4 mr-1" />{profileUser?.daily_streak || 0}
                      </div>
                      <div className="text-xs text-white/80">Streak</div>
                    </div>
                    <div className="text-center p-2 bg-white/10 rounded">
                      <div className="text-lg font-bold">{profileUser?.profile_completion_percentage || 0}%</div>
                      <div className="text-xs text-white/80">Perfil</div>
                    </div>
                    <div className="text-center p-2 bg-white/10 rounded">
                      <div className="text-lg font-bold">{profileUser?.gamification_xp || 0}</div>
                      <div className="text-xs text-white/80">XP</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {isOwnProfile && (
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4" />Missões Diárias</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {dailyQuests.map((quest) => (
                      <div key={quest.id} className={`p-3 rounded-lg border ${quest.completed ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${quest.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>{quest.title}</span>
                          {quest.completed ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Badge className="bg-purple-600 text-xs">+{quest.reward} XP</Badge>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-10 h-10 mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Mais Desafios?</h3>
                  <Button onClick={() => navigate(createPageUrl('Gamification'))} className="bg-white text-purple-600">
                    Ver Gamificação Completa <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader><CardTitle className="text-base">Coleção de Badges Pixel Art</CardTitle></CardHeader>
              <CardContent>
                {(!profileUser.public_badges || profileUser.public_badges.length === 0) ? (
                  <div className="text-center py-8"><Award className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-600">Nenhuma badge</p></div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {profileUser.public_badges.map((badge, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative group"
                      >
                        <div className={`p-3 bg-white rounded-xl border-4 ${
                          badge.rarity === 'legendary' ? 'border-yellow-400' :
                          badge.rarity === 'epic' ? 'border-purple-400' :
                          badge.rarity === 'rare' ? 'border-blue-400' :
                          'border-gray-300'
                        } hover:scale-110 transition-transform cursor-pointer shadow-lg`}>
                          <img 
                            src={getPixelBadge('community')(badge)} 
                            alt={badge.name} 
                            className="w-full h-16 pixelated mx-auto"
                            style={{imageRendering: 'pixelated'}}
                          />
                          <p className="text-center text-xs font-bold mt-2 truncate">{badge.name}</p>
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 whitespace-nowrap shadow-xl">
                            <p className="font-bold">{badge.name}</p>
                            <p className="text-gray-300">{badge.description}</p>
                            {badge.earned_date && (
                              <p className="text-gray-400 mt-1">
                                {format(new Date(badge.earned_date), "d MMM yyyy", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader><CardTitle className="text-base">Estatísticas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm">Posts</span>
                  <span className="font-bold">{profileUser?.profile_stats?.total_posts || 0}</span>
                </div>
                <div className="flex justify-between p-3 bg-pink-50 rounded-lg">
                  <span className="text-sm">Curtidas Recebidas</span>
                  <span className="font-bold">{profileUser?.profile_stats?.total_likes_received || 0}</span>
                </div>
                <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm">Seguidores</span>
                  <span className="font-bold">{followData.followers.length}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved">
              {savedPosts.length === 0 ? (
                <Card><CardContent className="p-8 text-center"><Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-600">Nenhum post salvo</p></CardContent></Card>
              ) : (
                <div className="grid md:grid-cols-3 gap-3">
                  {savedPosts.map((post) => (
                    <Card key={post.id}>
                      <div className="h-48 bg-purple-100">
                        {post.media_urls?.[0] && <img src={post.media_urls[0]} className="w-full h-full object-cover" alt="Post" />}
                      </div>
                      <CardContent className="p-3">
                        <p className="text-xs line-clamp-2">{post.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
