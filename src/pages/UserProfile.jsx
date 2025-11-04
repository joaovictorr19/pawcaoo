
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

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 300000,
  });

  // Redirect to own profile if no email provided
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
      const user = users.find(u => u.email === profileEmail);
      if (!user) {
        throw new Error("Usuário não encontrado");
      }
      return user;
    },
    enabled: !!profileEmail,
    retry: 1,
  });

  const { data: userPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ['userPosts', profileEmail],
    queryFn: () => base44.entities.SocialPost.filter({
      author_email: profileEmail,
      moderation_status: 'approved'
    }, '-created_date'),
    enabled: !!profileEmail,
    initialData: [],
    staleTime: 60000,
  });

  const { data: userDogs } = useQuery({
    queryKey: ['userDogs', profileEmail],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: profileEmail }),
    enabled: !!profileEmail,
    initialData: [],
    staleTime: 60000,
  });

  const { data: followData } = useQuery({
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
  });

  const { data: savedPosts } = useQuery({
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
  });

  const { data: earnedBadges } = useQuery({
    queryKey: ['userBadges', profileEmail],
    queryFn: async () => {
      return profileUser?.public_badges || [];
    },
    enabled: !!profileUser,
    initialData: [],
  });

  const followMutation = useMutation({
    mutationFn: async (isFollowing) => {
      if (isFollowing) {
        const follow = followData.followers.find(f => f.follower_email === currentUser.email);
        if (follow) {
          await base44.entities.SocialFollow.delete(follow.id);
        }
      } else {
        await base44.entities.SocialFollow.create({
          follower_email: currentUser.email,
          follower_name: currentUser.full_name,
          follower_photo_url: currentUser.profile_photo_url,
          following_email: profileEmail,
          following_name: profileUser.full_name,
          status: 'accepted'
        });

        await base44.entities.SocialNotification.create({
          recipient_email: profileEmail,
          sender_email: currentUser.email,
          sender_name: currentUser.full_name,
          sender_photo_url: currentUser.profile_photo_url,
          notification_type: 'new_follower',
          related_content_type: 'user'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['followData']);
      toast.success(followData.isFollowing ? "Deixou de seguir" : "Agora segue este usuário!");
    },
  });

  const isOwnProfile = currentUser?.email === profileEmail;

  // Gamification calculations
  const xpForNextLevel = (level) => level * 500;
  const currentLevelXP = profileUser?.gamification_xp || 0;
  const currentLevel = profileUser?.gamification_level || 1;
  const xpNeeded = xpForNextLevel(currentLevel);
  const xpProgress = ((currentLevelXP % xpNeeded) / xpNeeded) * 100;

  // Daily quests
  const dailyQuests = [
    { id: 1, title: "Publicar 1 foto", reward: 50, icon: "📸", completed: (profileUser?.profile_stats?.total_posts || 0) > 0 },
    { id: 2, title: "Dar 5 curtidas", reward: 25, icon: "❤️", completed: false },
    { id: 3, title: "Escrever 3 comentários", reward: 30, icon: "💬", completed: (profileUser?.profile_stats?.total_comments_made || 0) >= 3 },
    { id: 4, title: "Visitar o Dog Connect", reward: 20, icon: "🔥", completed: true },
  ];

  // Loading state
  if (loadingUser || !profileEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  // Error state - user not found
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            className="mb-6"
            onClick={() => navigate(createPageUrl('SocialFeed'))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dog Connect
          </Button>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Usuário não encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                O perfil que você procura não existe ou foi removido.
              </p>
              <Button onClick={() => navigate(createPageUrl('SocialFeed'))}>
                Voltar ao Dog Connect
              </Button>
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
        <Badge key="admin" className="bg-gradient-to-r from-red-600 to-pink-600 text-white border-0 shadow-lg">
          <Shield className="w-4 h-4 mr-1" />
          Admin
        </Badge>
      );
    }

    if (profileUser.social_role === 'moderator') {
      badges.push(
        <Badge key="mod" className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 shadow-lg">
          <ShieldCheck className="w-4 h-4 mr-1" />
          Moderador
        </Badge>
      );
    }

    if (profileUser.is_verified) {
      badges.push(
        <Badge key="verified" className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg">
          <CheckCircle className="w-4 h-4 mr-1" />
          Verificado
        </Badge>
      );
    }

    if (profileUser.is_adoption_advocate) {
      badges.push(
        <Badge key="advocate" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg">
          <Heart className="w-4 h-4 mr-1" />
          Defensor de Adoção
        </Badge>
      );
    }

    return badges;
  };

  const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const totalComments = userPosts.reduce((sum, p) => sum + (p.comments_count || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate(createPageUrl('SocialFeed'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dog Connect
        </Button>

        {/* Profile Header Card */}
        <Card className="border-0 shadow-2xl mb-6 overflow-hidden">
          {/* Cover Photo */}
          <div className="relative h-48 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600">
            {profileUser.cover_photo_url && (
              <img
                src={profileUser.cover_photo_url}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/10" />
          </div>

          <CardContent className="relative px-6 md:px-8 pb-8">
            {/* Avatar */}
            <div className="flex flex-col md:flex-row gap-6 -mt-16 relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-2xl">
                <AvatarImage src={profileUser.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-4xl font-bold">
                  {profileUser.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 md:mt-16">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {profileUser.full_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {getBadges()}

                      {/* Gamification Level Badge */}
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
                        <Zap className="w-4 h-4 mr-1" />
                        Nível {currentLevel}
                      </Badge>
                    </div>

                    {/* Public Badges */}
                    {profileUser.public_badges && profileUser.public_badges.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profileUser.public_badges.slice(0, 4).map((badge, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={`${
                              badge.rarity === 'legendary' ? 'border-yellow-400 text-yellow-700 bg-yellow-50' :
                              badge.rarity === 'epic' ? 'border-purple-400 text-purple-700 bg-purple-50' :
                              badge.rarity === 'rare' ? 'border-blue-400 text-blue-700 bg-blue-50' :
                              'border-gray-400 text-gray-700 bg-gray-50'
                            }`}
                            title={badge.description}
                          >
                            <span className="mr-1">{badge.icon}</span>
                            {badge.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {!isOwnProfile && currentUser && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => followMutation.mutate(followData.isFollowing)}
                        disabled={followMutation.isPending}
                        className={followData.isFollowing
                          ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        }
                      >
                        {followData.isFollowing ? 'Seguindo' : 'Seguir'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(createPageUrl(`Messages?user=${profileEmail}`))}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mensagem
                      </Button>
                    </div>
                  )}

                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(createPageUrl('MyProfile'))}
                    >
                      Editar Perfil
                    </Button>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{userPosts.length}</div>
                    <div className="text-sm text-gray-600">Publicações</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{followData.followers.length}</div>
                    <div className="text-sm text-gray-600">Seguidores</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{followData.following.length}</div>
                    <div className="text-sm text-gray-600">Seguindo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{totalLikes}</div>
                    <div className="text-sm text-gray-600">Curtidas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
                      <Flame className="w-5 h-5 mr-1" />
                      {profileUser.daily_streak || 0}
                    </div>
                    <div className="text-sm text-gray-600">Streak</div>
                  </div>
                </div>

                <Separator className="mb-4" />

                {/* Bio & Info */}
                <div className="space-y-3">
                  {profileUser.bio && (
                    <p className="text-gray-700 leading-relaxed">{profileUser.bio}</p>
                  )}

                  {/* Favorite Breeds */}
                  {profileUser.favorite_dog_breeds && profileUser.favorite_dog_breeds.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Dog className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Raças Favoritas:</span>
                      {profileUser.favorite_dog_breeds.map((breed, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          {breed}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Interests */}
                  {profileUser.interests && profileUser.interests.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Star className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Interesses:</span>
                      {profileUser.interests.map((interest, idx) => (
                        <Badge key={idx} variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 capitalize">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Location & Links */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {profileUser.city && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {profileUser.city}
                      </div>
                    )}
                    {profileUser.website && (
                      <a
                        href={profileUser.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <LinkIcon className="w-4 h-4" />
                        {profileUser.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {profileUser.instagram_handle && (
                      <a
                        href={`https://instagram.com/${profileUser.instagram_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-pink-600 hover:underline"
                      >
                        📷 Instagram
                      </a>
                    )}
                    {profileUser.facebook_handle && (
                      <a
                        href={`https://facebook.com/${profileUser.facebook_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-700 hover:underline"
                      >
                        📘 Facebook
                      </a>
                    )}
                    {profileUser.twitter_handle && (
                      <a
                        href={`https://twitter.com/${profileUser.twitter_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sky-600 hover:underline"
                      >
                        🐦 Twitter
                      </a>
                    )}
                    {profileUser.tiktok_handle && (
                      <a
                        href={`https://tiktok.com/@${profileUser.tiktok_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-900 hover:underline"
                      >
                        🎵 TikTok
                      </a>
                    )}
                    {profileUser.youtube_handle && (
                      <a
                        href={`https://youtube.com/@${profileUser.youtube_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-red-600 hover:underline"
                      >
                        📺 YouTube
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Pets Section */}
            {userDogs.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Meus Pets</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {userDogs.map(dog => (
                    <Card key={dog.id} className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="relative mb-3">
                          {dog.photo_url ? (
                            <img
                              src={dog.photo_url}
                              alt={dog.dog_name}
                              className="w-full h-32 object-cover rounded-xl"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center text-4xl">
                              🐕
                            </div>
                          )}
                          {dog.is_adopted && (
                            <Badge className="absolute top-2 right-2 bg-pink-500 text-white">
                              <Heart className="w-3 h-3 mr-1" />
                              Adotado
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-gray-900 mb-1">{dog.dog_name}</h4>
                        <p className="text-sm text-gray-600">{dog.breed}</p>
                        {dog.age && (
                          <p className="text-xs text-gray-500">{dog.age} anos</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-lg rounded-xl p-2 h-14 mb-6">
            <TabsTrigger value="posts" className="rounded-lg">
              <Grid className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="gamification" className="rounded-lg">
              <Zap className="w-4 h-4 mr-2" />
              Gamificação
            </TabsTrigger>
            <TabsTrigger value="badges" className="rounded-lg">
              <Award className="w-4 h-4 mr-2" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="activity" className="rounded-lg">
              <TrendingUp className="w-4 h-4 mr-2" />
              Atividade
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="rounded-lg">
                <Bookmark className="w-4 h-4 mr-2" />
                Salvos
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts">
            {loadingPosts ? (
              <div className="grid md:grid-cols-3 gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <Skeleton key={i} className="h-64 rounded-xl" />
                ))}
              </div>
            ) : userPosts.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhuma publicação
                  </h3>
                  <p className="text-gray-600">
                    {isOwnProfile ? 'Compartilhe momentos especiais do seu pet!' : 'Este usuário ainda não publicou nada.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {userPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    className="cursor-pointer"
                  >
                    <Card className="border-0 shadow-lg hover:shadow-2xl transition-all overflow-hidden">
                      <div className="relative h-64 bg-gradient-to-br from-purple-100 to-pink-100">
                        {post.media_urls?.[0] ? (
                          <img
                            src={post.media_urls[0]}
                            className="w-full h-full object-cover"
                            alt="Post"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MessageCircle className="w-16 h-16 text-gray-300" />
                          </div>
                        )}

                        {/* Overlay with stats */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-4">
                          <div className="flex gap-4 text-white w-full justify-between">
                            <div className="flex items-center gap-1">
                              <Heart className="w-5 h-5" />
                              <span className="font-semibold">{post.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-5 h-5" />
                              <span className="font-semibold">{post.comments_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(post.created_date), "d MMM", { locale: ptBR })}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* NEW: Gamification Tab */}
          <TabsContent value="gamification">
            <div className="space-y-6">
              {/* Level Progress */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-blue-600 text-white">
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
                      <div className="text-3xl font-bold">{profileUser?.gamification_points || 0}</div>
                      <div className="text-white/80 text-sm">Pontos Totais</div>
                    </div>
                  </div>

                  <Progress value={xpProgress} className="h-4 bg-white/20 mb-6" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                      <div className="text-2xl font-bold">{(profileUser.public_badges?.length || 0)}</div>
                      <div className="text-xs text-white/80">Badges</div>
                    </div>
                    <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                      <div className="text-2xl font-bold flex items-center justify-center">
                        <Flame className="w-6 h-6 text-orange-300 mr-1" />
                        {profileUser?.daily_streak || 0}
                      </div>
                      <div className="text-xs text-white/80">Dia Streak</div>
                    </div>
                    <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                      <div className="text-2xl font-bold">{profileUser?.profile_completion_percentage || 0}%</div>
                      <div className="text-xs text-white/80">Perfil</div>
                    </div>
                    <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                      <div className="text-2xl font-bold">{profileUser?.gamification_xp || 0}</div>
                      <div className="text-xs text-white/80">Total XP</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Quests (only for own profile) */}
              {isOwnProfile && (
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
                            : 'bg-white border-gray-200'
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
              )}

              {/* Gamification Stats Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Estatísticas de Jogo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium">Posts Publicados</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        {profileUser?.profile_stats?.total_posts || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-pink-600" />
                        <span className="text-sm font-medium">Curtidas Recebidas</span>
                      </div>
                      <span className="text-lg font-bold text-pink-600">
                        {profileUser?.profile_stats?.total_likes_received || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Seguidores</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {followData.followers.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium">Reservas Feitas</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {profileUser?.profile_stats?.total_bookings || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg">Conquistas Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {userPosts.length >= 10 && (
                        <div className="p-4 bg-yellow-50 rounded-xl text-center border-2 border-yellow-200">
                          <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-900">Criador Ativo</p>
                          <p className="text-xs text-gray-600">10+ posts</p>
                        </div>
                      )}
                      {followData.followers.length >= 50 && (
                        <div className="p-4 bg-pink-50 rounded-xl text-center border-2 border-pink-200">
                          <Users className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-900">Popular</p>
                          <p className="text-xs text-gray-600">50+ seguidores</p>
                        </div>
                      )}
                      {totalLikes >= 100 && (
                        <div className="p-4 bg-rose-50 rounded-xl text-center border-2 border-rose-200">
                          <Heart className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-900">Muito Curtido</p>
                          <p className="text-xs text-gray-600">100+ curtidas</p>
                        </div>
                      )}
                      {profileUser.is_adoption_advocate && (
                        <div className="p-4 bg-rose-50 rounded-xl text-center border-2 border-rose-200">
                          <Heart className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-gray-900">Defensor</p>
                          <p className="text-xs text-gray-600">Adoção</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CTA to Full Gamification Page */}
              <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Quer Mais Desafios?</h3>
                  <p className="text-white/90 mb-4">
                    Veja todos os desafios de foto, conquistas e suba no leaderboard!
                  </p>
                  <Button
                    onClick={() => navigate(createPageUrl('Gamification'))}
                    className="bg-white text-purple-600 hover:bg-gray-100"
                  >
                    Ver Gamificação Completa
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges">
            <div className="space-y-6">
              {/* System Badges */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    Badges do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {profileUser.role === 'admin' && (
                      <div className="p-6 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-2xl shadow-xl">
                        <Shield className="w-12 h-12 mb-3" />
                        <h4 className="font-bold text-2xl mb-2">Administrador</h4>
                        <p className="text-sm text-white/90">Controle total do sistema PawCão</p>
                      </div>
                    )}
                    {profileUser.social_role === 'moderator' && (
                      <div className="p-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl shadow-xl">
                        <ShieldCheck className="w-12 h-12 mb-3" />
                        <h4 className="font-bold text-2xl mb-2">Moderador</h4>
                        <p className="text-sm text-white/90">Moderador do Dog Connect</p>
                      </div>
                    )}
                    {profileUser.is_verified && (
                      <div className="p-6 bg-gradient-to-br from-blue-400 to-cyan-400 text-white rounded-2xl shadow-xl">
                        <CheckCircle className="w-12 h-12 mb-3" />
                        <h4 className="font-bold text-2xl mb-2">Verificado</h4>
                        <p className="text-sm text-white/90">Perfil verificado pela PawCão</p>
                      </div>
                    )}
                    {profileUser.is_adoption_advocate && (
                      <div className="p-6 bg-gradient-to-br from-pink-400 to-rose-500 text-white rounded-2xl shadow-xl">
                        <Heart className="w-12 h-12 mb-3" />
                        <h4 className="font-bold text-2xl mb-2">Defensor de Adoção</h4>
                        <p className="text-sm text-white/90">Ativo na causa da adoção de pets</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Community Badges */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Conquistas da Comunidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {profileUser.public_badges && profileUser.public_badges.length > 0 ? (
                    <div className="grid md:grid-cols-3 gap-4">
                      {profileUser.public_badges.map((badge, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`p-5 rounded-2xl border-2 shadow-lg ${
                            badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400' :
                            badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-400' :
                            badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-400' :
                            'bg-gray-50 border-gray-300'
                          }`}
                        >
                          <div className="text-5xl mb-3">{badge.icon}</div>
                          <h4 className="font-bold text-lg mb-1">{badge.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                          {badge.rarity && (
                            <Badge className={`text-xs ${
                              badge.rarity === 'legendary' ? 'bg-yellow-500' :
                              badge.rarity === 'epic' ? 'bg-purple-500' :
                              badge.rarity === 'rare' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}>
                              {badge.rarity.toUpperCase()}
                            </Badge>
                          )}
                          {badge.earned_date && (
                            <p className="text-xs text-gray-500 mt-2">
                              Conquistado em {format(new Date(badge.earned_date), "d MMM yyyy", { locale: ptBR })}
                            </p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhuma badge conquistada ainda</p>
                      <p className="text-sm text-gray-500">Participe da comunidade para ganhar badges!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Auto-earned Achievements based on stats */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Conquistas Automáticas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {userPosts.length >= 10 && (
                      <div className="p-4 bg-white rounded-xl border-2 border-blue-200">
                        <div className="text-3xl mb-2">📝</div>
                        <h4 className="font-bold">Criador Ativo</h4>
                        <p className="text-sm text-gray-600">10+ publicações</p>
                      </div>
                    )}
                    {followData.followers.length >= 50 && (
                      <div className="p-4 bg-white rounded-xl border-2 border-pink-200">
                        <div className="text-3xl mb-2">👥</div>
                        <h4 className="font-bold">Popular</h4>
                        <p className="text-sm text-gray-600">50+ seguidores</p>
                      </div>
                    )}
                    {totalLikes >= 100 && (
                      <div className="p-4 bg-white rounded-xl border-2 border-rose-200">
                        <div className="text-3xl mb-2">❤️</div>
                        <h4 className="font-bold">Muito Curtido</h4>
                        <p className="text-sm text-gray-600">100+ curtidas recebidas</p>
                      </div>
                    )}
                    {userDogs.filter(d => d.is_adopted).length > 0 && (
                      <div className="p-4 bg-white rounded-xl border-2 border-green-200">
                        <div className="text-3xl mb-2">🏠</div>
                        <h4 className="font-bold">Herói da Adoção</h4>
                        <p className="text-sm text-gray-600">Adotou um pet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Estatísticas</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-rose-500" />
                        <span className="text-gray-700">Total de Curtidas</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">{totalLikes}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        <span className="text-gray-700">Total de Comentários</span>
                      </div>
                      <span className="text-xl font-bold text-gray-900">{totalComments}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">Membro desde</span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {format(new Date(profileUser.created_date), "MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Conquistas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {userPosts.length >= 10 && (
                      <div className="p-4 bg-yellow-50 rounded-xl text-center border-2 border-yellow-200">
                        <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-900">Criador Ativo</p>
                        <p className="text-xs text-gray-600">10+ posts</p>
                      </div>
                    )}
                    {followData.followers.length >= 50 && (
                      <div className="p-4 bg-pink-50 rounded-xl text-center border-2 border-pink-200">
                        <Users className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-900">Popular</p>
                        <p className="text-xs text-gray-600">50+ seguidores</p>
                      </div>
                    )}
                    {profileUser.is_adoption_advocate && (
                      <div className="p-4 bg-rose-50 rounded-xl text-center border-2 border-rose-200">
                        <Heart className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-gray-900">Defensor</p>
                        <p className="text-xs text-gray-600">Adoção</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Saved Tab */}
          {isOwnProfile && (
            <TabsContent value="saved">
              {savedPosts.length === 0 ? (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Nenhum post salvo
                    </h3>
                    <p className="text-gray-600">
                      Salve posts para vê-los mais tarde
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {savedPosts.map((post) => (
                    <Card key={post.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                      <div className="relative h-64">
                        {post.media_urls?.[0] ? (
                          <img src={post.media_urls[0]} className="w-full h-full object-cover" alt="Post" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                            <MessageCircle className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
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
