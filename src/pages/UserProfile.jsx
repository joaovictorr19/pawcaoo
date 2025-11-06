
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, Calendar, Heart, MessageCircle, Camera, Edit, Share2,
  Award, TrendingUp, Bookmark, Grid, ArrowLeft, Dog, Zap, Crown,
  CheckCircle, Shield, ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import NotificationService from "@/components/NotificationService"; // Updated import path

function BadgeItem({ badge, idx, getBadgeImage }) {
  const [transparentBg, setTransparentBg] = useState(false);

  return (
    <motion.div
      key={badge.badge_id || idx}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ delay: idx * 0.05 }}
      className="flex flex-col items-center cursor-pointer"
      onClick={() => setTransparentBg(!transparentBg)}
    >
      {/* CORRIGIDO: Apenas o container do badge fica transparente, não afeta a foto de perfil */}
      <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-2 border-2 border-white/20 hover:border-yellow-400 transition-all shadow-lg relative group ${
        transparentBg ? 'bg-transparent' : 'bg-white/10'
      }`}>
        {badge.image_url ? (
          <img 
            src={badge.image_url} 
            alt={badge.name}
            className="w-16 h-16 object-contain rounded-lg"
            style={{imageRendering: 'pixelated'}}
          />
        ) : (
          <span className="text-4xl">{badge.icon || getBadgeImage(badge.badge_id)}</span>
        )}
        <div className={`absolute inset-0 rounded-xl ${
          badge.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400/20 to-orange-400/20' :
          badge.rarity === 'epic' ? 'bg-gradient-to-br from-purple-400/20 to-pink-400/20' :
          badge.rarity === 'rare' ? 'bg-gradient-to-br from-blue-400/20 to-cyan-400/20' :
          'bg-white/5'
        } group-hover:opacity-100 opacity-0 transition-opacity`} />
      </div>
      <p className="text-xs text-center font-bold text-white line-clamp-2 px-1">
        {badge.name}
      </p>
      <p className="text-xs text-center text-gray-400 line-clamp-1 px-1">
        {badge.description}
      </p>
      {badge.rarity && (
        <Badge className={`mt-1 text-xs capitalize ${
          badge.rarity === 'legendary' ? 'bg-yellow-500' :
          badge.rarity === 'epic' ? 'bg-purple-500' :
          badge.rarity === 'rare' ? 'bg-blue-500' :
          'bg-gray-500'
        }`}>
          {badge.rarity}
        </Badge>
      )}
    </motion.div>
  );
}

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("posts");

  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');

  console.log('\n🔍 === USERPROFILE - INÍCIO ===');
  console.log('📧 URL Email:', profileEmail);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  console.log('👤 Current User:', currentUser?.email);

  const isOwnProfile = currentUser?.email === profileEmail;

  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ['profileUser', profileEmail],
    queryFn: async () => {
      if (!profileEmail) {
        console.log('❌ ERRO: Nenhum email na URL');
        return null;
      }
      
      console.log('🔎 Iniciando busca por:', profileEmail);
      
      try {
        const users = await base44.entities.User.list();
        console.log('📊 Total de usuários:', users.length);
        
        // Buscar com comparação case-insensitive
        const found = users.find(u => u.email?.toLowerCase() === profileEmail.toLowerCase());
        
        if (found) {
          console.log('✅ USUÁRIO ENCONTRADO!');
          console.log('📋 Dados:', {
            email: found.email,
            nome: found.full_name,
            foto: found.profile_photo_url ? '✓ Tem foto' : '✗ Sem foto',
            cidade: found.city || 'Não definida',
            bio: found.bio ? '✓ Tem bio' : '✗ Sem bio',
            verificado: found.is_verified ? '✓' : '✗',
            role: found.role,
            social_role: found.social_role,
            achievements: found.achievements_badges?.length || 0,
            public_badges: found.public_badges?.length || 0
          });
          return found;
        } else {
          console.log('❌ USUÁRIO NÃO ENCONTRADO!');
          console.log('📧 Email procurado:', profileEmail);
          console.log('📋 Emails disponíveis:', users.map(u => u.email).slice(0, 10));
          return null;
        }
      } catch (error) {
        console.error('❌ ERRO na busca:', error);
        return null;
      }
    },
    enabled: !!profileEmail,
    retry: 3,
    retryDelay: 1000,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const profileBadges = profileUser?.profile_badges || [];
  const achievementsBadges = profileUser?.achievements_badges || [];
  const publicBadges = profileUser?.public_badges || [];

  const { data: userPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['userPosts', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      
      console.log('📝 Buscando posts de:', profileEmail);
      const posts = await base44.entities.SocialPost.list('-created_date');
      const userPosts = posts.filter(p => p.author_email === profileEmail);
      
      console.log('✅ Posts encontrados:', userPosts.length);
      userPosts.forEach((p, i) => {
        console.log(`  ${i+1}. "${p.content?.substring(0, 30)}..." | moderation: ${p.moderation_status} | public: ${p.is_public}`);
      });
      
      return userPosts;
    },
    enabled: !!profileEmail,
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: userDogs = [] } = useQuery({
    queryKey: ['userDogs', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const dogs = await base44.entities.DogProfile.filter({ owner_email: profileEmail });
      return dogs;
    },
    enabled: !!profileEmail,
    initialData: [],
  });

  const { data: followers = [], isLoading: loadingFollowers } = useQuery({
    queryKey: ['followers', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      
      console.log('👥 Buscando seguidores de:', profileEmail);
      const all = await base44.entities.SocialFollow.list();
      const followers = all.filter(f => f.following_email === profileEmail);
      
      console.log('✅ Seguidores encontrados:', followers.length);
      followers.forEach((f, i) => {
        console.log(`  ${i+1}. ${f.follower_name} (${f.follower_email})`);
      });
      
      return followers;
    },
    enabled: !!profileEmail,
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: following = [], isLoading: loadingFollowing } = useQuery({
    queryKey: ['following', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      
      console.log('👤 Buscando quem está seguindo:', profileEmail);
      const all = await base44.entities.SocialFollow.list();
      const following = all.filter(f => f.follower_email === profileEmail);
      
      console.log('✅ Seguindo:', following.length);
      
      return following;
    },
    enabled: !!profileEmail,
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const recentPhotos = userPosts.filter(p => p.media_urls?.length > 0).slice(0, 9);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.email || !profileEmail) {
        console.log('❌ Não pode seguir: currentUser ou profileEmail vazio');
        return;
      }
      
      console.log('💫 SEGUINDO:', {
        follower: currentUser.email,
        following: profileEmail
      });
      
      const newFollow = await base44.entities.SocialFollow.create({
        follower_email: currentUser.email,
        follower_name: currentUser.full_name,
        follower_photo_url: currentUser.profile_photo_url,
        following_email: profileEmail,
        following_name: profileUser.full_name,
        status: 'accepted'
      });

      console.log('✅ Follow criado:', newFollow.id);

      // ENVIAR NOTIFICAÇÃO
      console.log('📬 Enviando notificação de novo seguidor...');
      await NotificationService.newFollower({
        followerName: currentUser.full_name,
        followerEmail: currentUser.email,
        recipientEmail: profileEmail
      });

      return newFollow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('✅ Agora você está seguindo!');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.email || !profileEmail) return;
      const existingFollow = followers.find(f => f.follower_email === currentUser.email);
      if (existingFollow) {
        await base44.entities.SocialFollow.delete(existingFollow.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Deixou de seguir');
    },
  });

  const isFollowing = followers.some(f => f.follower_email === currentUser?.email);

  const getBadgeImage = (badgeId) => {
    const badgeImages = {
      welcome: '🎉',
      first_post: '✍️',
      social_butterfly: '🦋',
      community_helper: '🤝',
      verified: '✓',
      adoption_advocate: '💖',
      event_organizer: '🎪',
      top_contributor: '⭐',
    };
    return badgeImages[badgeId] || '🏆';
  };

  console.log('\n📊 === DADOS FINAIS ===');
  console.log('Profile User:', profileUser ? '✅ OK' : '❌ NULL');
  console.log('Email:', profileUser?.email);
  console.log('Nome:', profileUser?.full_name);
  console.log('Foto:', profileUser?.profile_photo_url);
  console.log('Posts:', userPosts.length);
  console.log('Seguidores:', followers.length);
  console.log('Seguindo:', following.length);
  console.log('=======================\n');

  if (loadingUser || loadingPosts || loadingFollowers || loadingFollowing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <Dog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil não encontrado</h2>
            <p className="text-gray-600 mb-4">Este perfil não está disponível ou foi removido.</p>
            <Button onClick={() => navigate(createPageUrl('SocialFeed'))} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Feed
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <Button variant="outline" className="mb-6" onClick={() => navigate(createPageUrl('SocialFeed'))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-0 shadow-xl mb-6 overflow-hidden bg-white">
          {/* Cover Photo */}
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            {profileUser.cover_photo_url && (
              <img 
                src={profileUser.cover_photo_url} 
                alt="Cover" 
                className="w-full h-full object-cover"
              />
            )}
            {isOwnProfile && (
              <Button
                size="sm"
                variant="outline"
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white"
                onClick={() => navigate(createPageUrl('AccountSettings'))}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            )}
          </div>

          <CardContent className="pt-6 pb-6">
            {/* Avatar and Name */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-20 md:-mt-24">
                {/* FOTO DE PERFIL - SEM TRANSPARÊNCIA */}
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl ring-4 ring-purple-100 bg-white">
                  <AvatarImage src={profileUser.profile_photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-4xl">
                    {profileUser.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center md:text-left mb-4 md:mb-6">
                  <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {profileUser.full_name}
                    </h1>
                    
                    {/* APENAS DISTINTIVOS DE SISTEMA */}
                    {profileUser.is_verified && (
                      <div className="w-6 h-6" title="Verificado">
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#1d9bf0">
                          <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
                        </svg>
                      </div>
                    )}
                    {profileUser.role === 'admin' && (
                      <Badge className="bg-red-600 text-white flex items-center gap-1" title="Administrador">
                        <Shield className="w-3 h-3" />
                        Admin
                      </Badge>
                    )}
                    {profileUser.social_role === 'moderator' && (
                      <Badge className="bg-blue-600 text-white flex items-center gap-1" title="Moderador">
                        <ShieldCheck className="w-3 h-3" />
                        Mod
                      </Badge>
                    )}
                    {profileUser.social_role === 'admin' && (
                      <Badge className="bg-purple-600 text-white flex items-center gap-1" title="Admin Social">
                        <Crown className="w-3 h-3" />
                        Admin
                      </Badge>
                    )}
                    {profileUser.is_adoption_advocate && (
                      <Badge className="bg-pink-600 text-white flex items-center gap-1" title="Defensor de Adoção">
                        <Heart className="w-3 h-3" />
                        Defensor
                      </Badge>
                    )}
                  </div>
                  
                  {profileUser.bio && (
                    <p className="text-gray-600 mt-2 max-w-2xl">
                      {profileUser.bio}
                    </p>
                  )}
                  
                  {profileUser.city && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-2 justify-center md:justify-start">
                      <MapPin className="w-4 h-4" />
                      {profileUser.city}
                    </div>
                  )}
                </div>
              </div>

              {!isOwnProfile && currentUser && (
                <div className="flex gap-2 mb-6 mt-4 md:mt-0">
                  <Button
                    onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className={isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                  >
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </Button>
                  <Button variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mensagem
                  </Button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 py-4 border-t border-b border-gray-200 mt-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{userPosts.length}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              <div className="text-center cursor-pointer hover:bg-gray-50 rounded-lg py-2 transition">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{followers.length}</div>
                <div className="text-sm text-gray-600">Seguidores</div>
              </div>
              <div className="text-center cursor-pointer hover:bg-gray-50 rounded-lg py-2 transition">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{following.length}</div>
                <div className="text-sm text-gray-600">Seguindo</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fotos Recentes - Grid Visual */}
        {recentPhotos.length > 0 && (
          <Card className="border-0 shadow-xl mb-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                Fotos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {recentPhotos.map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
                    onClick={() => {/* TODO: Open post modal */}}
                  >
                    {post.media_urls?.[0] && (
                      <img
                        src={post.media_urls[0]}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Pets Section */}
        {userDogs.length > 0 && (
          <Card className="border-0 shadow-xl mb-6">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Dog className="w-5 h-5 text-green-600" />
                Meus Pets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {userDogs.map(dog => (
                  <Card key={dog.id} className="border-2 border-gray-200 hover:border-purple-300 transition-colors">
                    <CardContent className="p-3">
                      <div className="relative mb-2">
                        {dog.photo_url ? (
                          <img src={dog.photo_url} alt={dog.dog_name} className="w-full aspect-square object-cover rounded-lg" />
                        ) : (
                          <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                            🐕
                          </div>
                        )}
                        {dog.is_adopted && (
                          <Badge className="absolute top-1 right-1 bg-pink-500 text-white text-xs">
                            <Heart className="w-2 h-2 mr-1" />
                            Adotado
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-bold text-sm truncate">{dog.dog_name}</h4>
                      <p className="text-xs text-gray-600 truncate">{dog.breed}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-lg rounded-xl p-1 h-12 mb-4">
            <TabsTrigger value="posts"><Grid className="w-4 h-4 mr-1" />Posts</TabsTrigger>
            <TabsTrigger value="gamification"><Zap className="w-4 h-4 mr-1" />XP</TabsTrigger>
            <TabsTrigger value="badges"><Award className="w-4 h-4 mr-1" />Emblemas</TabsTrigger>
            <TabsTrigger value="activity"><TrendingUp className="w-4 h-4 mr-1" />Stats</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="saved"><Bookmark className="w-4 h-4 mr-1" />Salvos</TabsTrigger>}
          </TabsList>

          {/* Gamification Tab */}
          <TabsContent value="gamification">
            <Card className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  Level {profileUser.gamification_level || 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>XP: {profileUser.gamification_xp || 0} / {((profileUser.gamification_level || 1) * 1000)}</span>
                      <span>{Math.floor((profileUser.gamification_xp || 0) / ((profileUser.gamification_level || 1) * 1000) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full transition-all"
                        style={{ width: `${Math.min((profileUser.gamification_xp || 0) / ((profileUser.gamification_level || 1) * 1000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <div className="text-3xl font-bold text-yellow-400">{profileUser.daily_streak || 0}</div>
                      <div className="text-sm text-gray-300">Dias Seguidos</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <div className="text-3xl font-bold text-green-400">{profileUser.profile_stats?.total_posts || 0}</div>
                      <div className="text-sm text-gray-300">Total Posts</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <div className="text-3xl font-bold text-pink-400">{profileUser.profile_stats?.total_likes_received || 0}</div>
                      <div className="text-sm text-gray-300">Likes</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                      <div className="text-3xl font-bold text-purple-400">{achievementsBadges.length + publicBadges.length}</div>
                      <div className="text-sm text-gray-300">Emblemas</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <div className="grid grid-cols-3 gap-2">
              {userPosts.map(post => (
                <div key={post.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition">
                  {post.media_urls?.[0] ? (
                    <img src={post.media_urls[0]} alt="Post" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {userPosts.length === 0 && (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum post ainda</p>
              </div>
            )}
          </TabsContent>

          {/* Badges Tab - USANDO TODOS OS BADGES (achievements + public) */}
          <TabsContent value="badges">
            <Card className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-400" />
                  Emblemas Conquistados
                  <Badge className="ml-2 bg-yellow-500 text-gray-900">
                    {achievementsBadges.length + publicBadges.length}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 mt-2">
                  Clique no emblema para alternar fundo transparente
                </p>
              </CardHeader>
              <CardContent>
                {(achievementsBadges.length === 0 && publicBadges.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-white/20">
                      <Award className="w-12 h-12 text-gray-500" />
                    </div>
                    <p className="text-gray-400">Nenhum emblema conquistado</p>
                    <p className="text-sm text-gray-500 mt-2">Participe da comunidade para ganhar emblemas!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Achievements Badges */}
                    {achievementsBadges.map((badge, idx) => (
                      <BadgeItem key={`achievement-${badge.badge_id || idx}`} badge={badge} idx={idx} getBadgeImage={getBadgeImage} />
                    ))}
                    {/* Public Badges (admin-granted) */}
                    {publicBadges.map((badge, idx) => (
                      <BadgeItem key={`public-${badge.badge_id || idx}`} badge={badge} idx={idx + achievementsBadges.length} getBadgeImage={getBadgeImage} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Estatísticas de Atividade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{profileUser.profile_stats?.total_comments_made || 0}</div>
                    <div className="text-sm text-gray-600">Comentários</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{profileUser.profile_stats?.total_bookings || 0}</div>
                    <div className="text-sm text-gray-600">Reservas</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{profileUser.profile_stats?.total_events_attended || 0}</div>
                    <div className="text-sm text-gray-600">Eventos</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-pink-600">{profileUser.profile_stats?.total_adoptions || 0}</div>
                    <div className="text-sm text-gray-600">Adoções</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">{profileUser.longest_streak || 0}</div>
                    <div className="text-sm text-gray-600">Maior Streak</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-indigo-600">{profileUser.profile_stats?.total_reviews_written || 0}</div>
                    <div className="text-sm text-gray-600">Avaliações</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Posts Tab */}
          {isOwnProfile && (
            <TabsContent value="saved">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bookmark className="w-5 h-5 text-blue-600" />
                    Posts Salvos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum post salvo ainda</p>
                    <p className="text-sm text-gray-500 mt-2">Posts que você salvar aparecerão aqui</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
