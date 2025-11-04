import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, Users, Calendar, Heart, MessageCircle, 
  UserPlus, UserCheck, Grid, Bookmark, Shield, ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ['profileUser', profileEmail],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.email === profileEmail);
    },
    enabled: !!profileEmail,
  });

  const { data: userPosts, isLoading: loadingPosts } = useQuery({
    queryKey: ['userPosts', profileEmail],
    queryFn: () => base44.entities.SocialPost.filter({ 
      author_email: profileEmail,
      moderation_status: 'approved'
    }, '-created_date'),
    enabled: !!profileEmail,
    initialData: [],
  });

  const { data: userDogs } = useQuery({
    queryKey: ['userDogs', profileEmail],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: profileEmail }),
    enabled: !!profileEmail,
    initialData: [],
  });

  const { data: followData } = useQuery({
    queryKey: ['followData', profileEmail],
    queryFn: async () => {
      const followers = await base44.entities.SocialFollow.filter({ following_email: profileEmail });
      const following = await base44.entities.SocialFollow.filter({ follower_email: profileEmail });
      const isFollowing = followers.some(f => f.follower_email === currentUser?.email);
      return { followers, following, isFollowing };
    },
    enabled: !!profileEmail && !!currentUser,
    initialData: { followers: [], following: [], isFollowing: false },
  });

  const { data: savedPosts } = useQuery({
    queryKey: ['userSavedPosts', currentUser?.email],
    queryFn: async () => {
      const saved = await base44.entities.SocialSavedPost.filter({ user_email: currentUser?.email });
      return saved;
    },
    enabled: !!currentUser && profileEmail === currentUser?.email,
    initialData: [],
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
      toast.success(followData.isFollowing ? "Deixou de seguir" : "Agora você segue este usuário!");
    },
  });

  const isOwnProfile = currentUser?.email === profileEmail;

  if (loadingUser || !profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-64 w-full rounded-2xl mb-6" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const getRoleBadge = () => {
    const role = profileUser.social_role || profileUser.role;
    
    if (role === 'admin') {
      return (
        <Badge className="bg-gradient-to-r from-red-600 to-pink-600 text-white border-0 shadow-lg">
          <Shield className="w-3 h-3 mr-1" />
          ADMIN
        </Badge>
      );
    }
    
    if (role === 'moderator') {
      return (
        <Badge className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0 shadow-lg">
          <Shield className="w-3 h-3 mr-1" />
          MODERADOR
        </Badge>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <Button
          variant="outline"
          className="mb-6 border-purple-200 hover:bg-purple-50"
          onClick={() => navigate(createPageUrl('SocialFeed'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Feed
        </Button>

        {/* Profile Header */}
        <Card className="border-0 shadow-2xl mb-6 bg-gradient-to-br from-white to-purple-50">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-32 h-32 border-4 border-purple-200 shadow-xl">
                <AvatarImage src={profileUser.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-4xl font-bold">
                  {profileUser.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profileUser.full_name}
                  </h1>
                  {getRoleBadge()}
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{profileUser.city || 'Localização não informada'}</span>
                </div>

                <div className="flex gap-6 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{userPosts.length}</div>
                    <div className="text-sm text-gray-600">Posts</div>
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
                    <div className="text-2xl font-bold text-gray-900">{userDogs.length}</div>
                    <div className="text-sm text-gray-600">Pets</div>
                  </div>
                </div>

                {!isOwnProfile && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => followMutation.mutate(followData.isFollowing)}
                      className={`${
                        followData.isFollowing
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                      } rounded-xl shadow-lg`}
                    >
                      {followData.isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Seguindo
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Seguir
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl border-2 border-purple-300 hover:bg-purple-50"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Mensagem
                    </Button>
                  </div>
                )}

                {isOwnProfile && (
                  <Button
                    onClick={() => navigate(createPageUrl('MyProfile'))}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl shadow-lg"
                  >
                    Editar Perfil
                  </Button>
                )}
              </div>
            </div>

            {/* Dogs Section */}
            {userDogs.length > 0 && (
              <div className="mt-6 pt-6 border-t border-purple-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🐾 Pets de {isOwnProfile ? 'você' : profileUser.full_name?.split(' ')[0]}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {userDogs.map(dog => (
                    <div key={dog.id} className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-200 shadow-lg">
                        {dog.photo_url ? (
                          <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl">
                            🐕
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center mt-1 font-semibold text-gray-700">{dog.dog_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl h-14 p-2">
            <TabsTrigger value="posts" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Grid className="w-5 h-5 mr-2" />
              <span className="font-bold">Posts</span>
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <Bookmark className="w-5 h-5 mr-2" />
                <span className="font-bold">Salvos</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts Grid */}
          <TabsContent value="posts" className="mt-6">
            {loadingPosts ? (
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3,4,5,6].map(i => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : userPosts.length === 0 ? (
              <Card className="border-0 shadow-xl">
                <CardContent className="p-12 text-center">
                  <Grid className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {isOwnProfile ? 'Você ainda não publicou nada' : 'Nenhum post ainda'}
                  </h3>
                  <p className="text-gray-600">
                    {isOwnProfile && 'Compartilhe momentos especiais do seu pet!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {userPosts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="aspect-square relative group cursor-pointer overflow-hidden rounded-xl"
                    onClick={() => {
                      // Navigate to post details or open modal
                    }}
                  >
                    {post.media_urls?.[0] ? (
                      <img
                        src={post.media_urls[0]}
                        className="w-full h-full object-cover"
                        alt="Post"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <span className="text-4xl">📝</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <Heart className="w-5 h-5 fill-white" />
                          <span className="font-bold">{post.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-5 h-5" />
                          <span className="font-bold">{post.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    {post.media_urls?.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        📷 {post.media_urls.length}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved Posts */}
          {isOwnProfile && (
            <TabsContent value="saved" className="mt-6">
              {savedPosts.length === 0 ? (
                <Card className="border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Nenhum post salvo
                    </h3>
                    <p className="text-gray-600">
                      Salve posts que você gosta para ver mais tarde
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {savedPosts.map((saved, idx) => (
                    <motion.div
                      key={saved.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="aspect-square bg-gray-200 rounded-xl"
                    >
                      {/* Load post details here */}
                    </motion.div>
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