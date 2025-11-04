
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, Users, Heart, MessageCircle, 
  UserPlus, UserCheck, Grid, Bookmark, Shield, ArrowLeft,
  Link as LinkIcon, CheckCircle, AtSign
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog, ] = useState(false);

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
      const followers = await base44.entities.SocialFollow.filter({ following_email: profileEmail, status: 'accepted' });
      const following = await base44.entities.SocialFollow.filter({ follower_email: profileEmail, status: 'accepted' });
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
        if (follow) {
          await base44.entities.SocialFollow.delete(follow.id);
          // Update counts
          await base44.entities.User.update(profileUser.id, {
            followers_count: Math.max(0, (profileUser.followers_count || 0) - 1)
          });
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
        // Update counts
        await base44.entities.User.update(profileUser.id, {
          followers_count: (profileUser.followers_count || 0) + 1
        });

        // Create notification
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
      queryClient.invalidateQueries(['profileUser']);
      toast.success(followData.isFollowing ? "Deixou de seguir" : "Agora você segue este usuário!");
    },
  });

  const isOwnProfile = currentUser?.email === profileEmail;

  if (loadingUser || !profileUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-64 w-full rounded-2xl mb-6" />
        </div>
      </div>
    );
  }

  const getRoleBadge = () => {
    const role = profileUser.social_role || profileUser.role;
    
    if (profileUser.is_verified) {
      return (
        <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg">
          <CheckCircle className="w-3 h-3 mr-1" />
          VERIFICADO
        </Badge>
      );
    }
    
    if (profileUser.is_adoption_advocate) {
      return (
        <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg">
          <Heart className="w-3 h-3 mr-1" />
          DEFENSOR DE ADOÇÃO
        </Badge>
      );
    }
    
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

  const getPetIcon = (petType) => {
    const icons = {
      dog: "🐕",
      cat: "🐱",
      bird: "🦜",
      rabbit: "🐰",
      hamster: "🐹",
      guinea_pig: "🐹",
      turtle: "🐢",
      fish: "🐠",
      other: "🐾"
    };
    return icons[petType] || "🐾";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header - Instagram Style */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl('SocialFeed'))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="font-semibold text-gray-900">{profileUser.full_name}</h2>
            <div className="w-10" />
          </div>
        </div>

        {/* Profile Header - Instagram Style */}
        <div className="px-4 py-8">
          <div className="flex items-start gap-8 mb-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="w-32 h-32 border border-gray-200">
                <AvatarImage src={profileUser.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-4xl font-bold">
                  {profileUser.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Stats & Actions */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-xl font-normal text-gray-900">
                  {profileUser.full_name}
                </h1>
                
                {!isOwnProfile ? (
                  <>
                    <Button
                      onClick={() => followMutation.mutate(followData.isFollowing)}
                      size="sm"
                      className={followData.isFollowing 
                        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 font-semibold'
                        : 'bg-blue-500 hover:bg-blue-600 text-white font-semibold'
                      }
                    >
                      {followData.isFollowing ? 'Seguindo' : 'Seguir'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-semibold"
                    >
                      Mensagem
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(createPageUrl('MyProfile'))}
                    className="font-semibold"
                  >
                    Editar perfil
                  </Button>
                )}

                {getRoleBadge()}
              </div>

              {/* Stats */}
              <div className="flex gap-10 mb-4">
                <div>
                  <span className="font-semibold text-gray-900">{userPosts.length}</span>
                  <span className="text-gray-900 ml-1">publicações</span>
                </div>
                <button
                  onClick={() => setShowFollowersDialog(true)}
                  className="hover:opacity-70"
                >
                  <span className="font-semibold text-gray-900">{profileUser.followers_count || followData.followers.length}</span>
                  <span className="text-gray-900 ml-1">seguidores</span>
                </button>
                <button
                  onClick={() => setShowFollowingDialog(true)}
                  className="hover:opacity-70"
                >
                  <span className="font-semibold text-gray-900">{profileUser.following_count || followData.following.length}</span>
                  <span className="text-gray-900 ml-1">seguindo</span>
                </button>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{profileUser.full_name}</p>
                {profileUser.bio && (
                  <p className="text-gray-900 whitespace-pre-wrap">{profileUser.bio}</p>
                )}
                {profileUser.city && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{profileUser.city}</span>
                  </div>
                )}
                {profileUser.website && (
                  <a 
                    href={profileUser.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-semibold"
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
                    className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-semibold"
                  >
                    <AtSign className="w-4 h-4" />
                    @{profileUser.instagram_handle.replace('@', '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Pets Highlights - Instagram Story Style */}
          {userDogs.length > 0 && (
            <div className="mb-8">
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {userDogs.map(pet => (
                  <div key={pet.id} className="flex-shrink-0 text-center">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 mb-2">
                        {pet.photo_url ? (
                          <img src={pet.photo_url} alt={pet.dog_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-3xl">
                            {getPetIcon(pet.pet_type)}
                          </div>
                        )}
                      </div>
                      {pet.is_adopted && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center border-2 border-white">
                          <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-normal text-gray-900 truncate w-20">
                      {pet.dog_name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs - Instagram Style */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-2 border-t border-gray-200 bg-white h-auto p-0">
            <TabsTrigger 
              value="posts" 
              className="data-[state=active]:border-t data-[state=active]:border-t-black border-t border-t-transparent h-14 rounded-none"
            >
              <Grid className="w-6 h-6" />
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger 
                value="saved" 
                className="data-[state=active]:border-t data-[state=active]:border-t-black border-t border-t-transparent h-14 rounded-none"
              >
                <Bookmark className="w-6 h-6" />
              </TabsTrigger>
            )}
          </TabsList>

          {/* Posts Grid */}
          <TabsContent value="posts" className="mt-0">
            {loadingPosts ? (
              <div className="grid grid-cols-3 gap-1">
                {[1,2,3,4,5,6].map(i => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : userPosts.length === 0 ? (
              <div className="py-24 text-center">
                <div className="w-16 h-16 border-2 border-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Grid className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-light text-gray-900 mb-1">
                  Sem publicações ainda
                </h3>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square relative group cursor-pointer overflow-hidden bg-gray-100"
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-6 text-white">
                        <div className="flex items-center gap-2">
                          <Heart className="w-6 h-6 fill-white" />
                          <span className="font-semibold">{post.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-6 h-6 fill-white" />
                          <span className="font-semibold">{post.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    {post.media_urls?.length > 1 && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-black/60 rounded-sm flex items-center justify-center">
                          <span className="text-white text-xs font-bold">▢</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved Posts */}
          {isOwnProfile && (
            <TabsContent value="saved" className="mt-0">
              {savedPosts.length === 0 ? (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 border-2 border-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bookmark className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-light text-gray-900 mb-1">
                    Guardar
                  </h3>
                  <p className="text-gray-600">
                    Guarde fotos e vídeos que queira ver novamente
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {/* Render saved posts grid */}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Followers Dialog */}
        <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Seguidores</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {followData.followers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum seguidor ainda</p>
              ) : (
                <div className="space-y-3">
                  {followData.followers.map((follower) => (
                    <div key={follower.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src={follower.follower_photo_url} />
                          <AvatarFallback className="bg-gray-200">
                            {follower.follower_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {follower.follower_name}
                          </p>
                          <p className="text-xs text-gray-500">{follower.follower_email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(createPageUrl(`UserProfile?email=${follower.follower_email}`))}
                      >
                        Ver perfil
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Following Dialog */}
        <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Seguindo</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {followData.following.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Não segue ninguém ainda</p>
              ) : (
                <div className="space-y-3">
                  {followData.following.map((following) => (
                    <div key={following.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-11 h-11">
                          <AvatarImage src={following.following_photo_url} />
                          <AvatarFallback className="bg-gray-200">
                            {following.following_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {following.following_name}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gray-200 text-gray-900 hover:bg-gray-300 font-semibold"
                        onClick={() => followMutation.mutate(true)}
                      >
                        Seguindo
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
