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
  CheckCircle, Shield, ShieldCheck, Users, User
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useCreateNotification } from "@/components/NotificationService";

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
  const [activeTab, setActiveTab] = useState("badges");
  const createNotification = useCreateNotification();

  const urlParams = new URLSearchParams(window.location.search);
  const profileEmailParam = urlParams.get('email');
  const profileIdParam = urlParams.get('id');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const targetId = profileIdParam;
  const targetEmail = !targetId ? profileEmailParam : null;
  
  const isSelfView = (!targetId && !targetEmail) || 
                     (currentUser && targetId === currentUser.id) || 
                     (currentUser && targetEmail === currentUser.email);

  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ['profileUser', targetId, targetEmail, isSelfView, currentUser?.id],
    queryFn: async () => {
      let userProfile = null;
      
      // 1. Priority: Self View by Email
      if (isSelfView && currentUser?.email) {
        try {
          const byEmail = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
          if (byEmail && byEmail.length > 0) {
            userProfile = byEmail[0];
          }
        } catch (e) {
          console.error('Error fetching self profile:', e);
        }
      }

      // 2. Search by ID
      if (!userProfile && targetId) {
        try {
          const byEntityId = await base44.entities.UserProfile.filter({ id: targetId });
          if (byEntityId && byEntityId.length > 0) userProfile = byEntityId[0];
          
          if (!userProfile) {
            const byUserId = await base44.entities.UserProfile.filter({ user_id: targetId });
            if (byUserId && byUserId.length > 0) userProfile = byUserId[0];
          }
        } catch (e) {
          console.error('Error fetching by ID:', e);
        }
      }

      // 3. Search by Email
      if (!userProfile) {
        const emailToSearch = targetEmail || (isSelfView ? currentUser?.email : null);
        if (emailToSearch) {
          try {
            const byEmail = await base44.entities.UserProfile.filter({ user_email: emailToSearch });
            if (byEmail && byEmail.length > 0) userProfile = byEmail[0];
          } catch (e) {
            console.error('Error fetching by Email:', e);
          }
        }
      }

      // 4. Create if Self View and Missing
      if (isSelfView && currentUser && !userProfile) {
        try {
          const payload = {
            user_email: currentUser.email,
            user_id: currentUser.id,
            full_name: currentUser.full_name || 'Utilizador',
            profile_photo_url: currentUser.profile_photo_url,
            cover_photo_url: currentUser.cover_photo_url,
            bio: currentUser.bio || '',
            city: currentUser.city || '',
            role: currentUser.role || 'user',
            gamification_xp: currentUser.gamification_xp || 0,
            gamification_level: currentUser.gamification_level || 1,
            followers_count: 0,
            following_count: 0,
            is_verified: currentUser.is_verified || false
          };
          userProfile = await base44.entities.UserProfile.create(payload);
        } catch (error) {
          console.error("Profile creation failed:", error);
          // Fallback to basic user data if creation fails
          userProfile = {
            ...currentUser,
            user_email: currentUser.email,
            user_id: currentUser.id
          };
        }
      }

      return userProfile;
    },
    enabled: !!targetId || !!targetEmail || (isSelfView && !!currentUser),
    retry: false,
  });

  const profileEmail = profileUser?.user_email || profileUser?.email;
  const isOwnProfile = currentUser?.id === profileUser?.user_id || currentUser?.email === profileEmail;

  const { data: earnedBadges = [] } = useQuery({
    queryKey: ['userBadges', profileEmail, isSelfView, currentUser?.achievements_badges],
    queryFn: async () => {
      // Use isSelfView (calculated from URL) instead of waiting for profileUser to load
      const memoryBadges = (isSelfView && currentUser?.achievements_badges) ? currentUser.achievements_badges : [];
      
      // If we don't have a profile email yet, return memory badges if it's self view
      if (!profileEmail) return memoryBadges;
      
      try {
        // Fetch from DB
        const fromTable = await base44.entities.UserBadge.filter({ user_email: profileEmail }, '-earned_date');
        
        // Robust merge: always ensure we show everything from both sources (deduplicated by badge_id)
        if (fromTable && fromTable.length > 0) {
          const tableBadgeIds = new Set(fromTable.map(b => b.badge_id));
          const missingBadges = memoryBadges.filter(b => !tableBadgeIds.has(b.badge_id));
          
          if (missingBadges.length > 0) {
            return [...missingBadges, ...fromTable]; 
          }
          return fromTable;
        }
      } catch (e) {
        console.error("Error fetching badges table:", e);
      }

      return memoryBadges;
    },
    enabled: true,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // Sync embedded badges (from Auth User) to UserBadge table if needed
  React.useEffect(() => {
    const syncBadges = async () => {
      if (!isOwnProfile || !currentUser?.achievements_badges || !profileEmail) return;
      
      const embeddedBadges = currentUser.achievements_badges || [];
      if (embeddedBadges.length === 0) return;

      // We need to wait for earnedBadges to be loaded
      // But we can just check existence to avoid duplicates
      try {
        const existingBadges = await base44.entities.UserBadge.filter({ user_email: profileEmail });
        const existingIds = new Set(existingBadges.map(b => b.badge_id));
        
        const badgesToCreate = embeddedBadges.filter(b => !existingIds.has(b.badge_id));
        
        if (badgesToCreate.length > 0) {
          console.log(`Syncing ${badgesToCreate.length} badges to table...`);
          await Promise.all(badgesToCreate.map(badge => 
            base44.entities.UserBadge.create({
              user_email: profileEmail,
              badge_id: badge.badge_id,
              name: badge.name,
              description: badge.description,
              icon: badge.icon,
              image_url: badge.image_url,
              rarity: badge.rarity || 'common',
              earned_date: badge.earned_date || new Date().toISOString()
            })
          ));
          queryClient.invalidateQueries({ queryKey: ['userBadges'] });
        }
      } catch (err) {
        console.error("Error syncing badges:", err);
      }
    };

    syncBadges();
  }, [isOwnProfile, currentUser, profileEmail, queryClient]);

  const { data: walkerProfile } = useQuery({
    queryKey: ['walkerProfile', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return null;
      const walkers = await base44.entities.WalkerProfile.filter({ created_by: profileEmail });
      return walkers[0] || null;
    },
    enabled: !!profileEmail,
  });

  const { data: userDogs = [] } = useQuery({
    queryKey: ['userDogs', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      return await base44.entities.DogProfile.filter({ owner_email: profileEmail });
    },
    enabled: !!profileEmail,
    initialData: [],
  });

  // Optimized Followers Count (Direct Count from Relation Table)
  const { data: followersCount = 0 } = useQuery({
    queryKey: ['followersCount', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return 0;
      try {
        const list = await base44.entities.SocialFollow.filter({ following_email: profileEmail });
        return list.length;
      } catch (e) {
        return profileUser?.followers_count || 0;
      }
    },
    enabled: !!profileEmail,
    initialData: 0,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // Optimized Following Count (Direct Count)
  const { data: followingCount = 0 } = useQuery({
    queryKey: ['followingCount', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return 0;
      try {
        const list = await base44.entities.SocialFollow.filter({ follower_email: profileEmail });
        return list.length;
      } catch (e) {
        return profileUser?.following_count || 0;
      }
    },
    enabled: !!profileEmail,
    initialData: 0,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const { data: followersList = [] } = useQuery({
    queryKey: ['followersList', profileEmail],
    queryFn: () => base44.entities.SocialFollow.filter({ following_email: profileEmail }),
    enabled: showFollowers && !!profileEmail,
  });

  const { data: followingList = [] } = useQuery({
    queryKey: ['followingList', profileEmail],
    queryFn: () => base44.entities.SocialFollow.filter({ follower_email: profileEmail }),
    enabled: showFollowing && !!profileEmail,
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ['isFollowing', currentUser?.email, profileEmail],
    queryFn: async () => {
      if (!currentUser?.email || !profileEmail) return false;
      const follows = await base44.entities.SocialFollow.filter({
        follower_email: currentUser.email,
        following_email: profileEmail
      });
      return follows.length > 0;
    },
    enabled: !!currentUser?.email && !!profileEmail && !isOwnProfile
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.email || !profileEmail) return;
      
      await base44.entities.SocialFollow.create({
        follower_email: currentUser.email,
        follower_name: currentUser.full_name,
        follower_photo_url: currentUser.profile_photo_url,
        following_email: profileEmail,
        following_name: profileUser.full_name,
        status: 'accepted'
      });

      // Invalidate queries to force refresh counts
      queryClient.invalidateQueries({ queryKey: ['followersCount'] });
      queryClient.invalidateQueries({ queryKey: ['followingCount'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      
      // Update stats (Legacy/Backup)
      if (profileUser.id) {
        try {
          await base44.entities.UserProfile.update(profileUser.id, {
            followers_count: (profileUser.followers_count || 0) + 1
          });
        } catch (e) { console.error(e); }
      }

      // Notify
      await createNotification.mutateAsync({
        recipient_email: profileEmail,
        title: "Novo Seguidor!",
        message: `${currentUser.full_name} começou a seguir-te.`,
        type: "social",
        action_url: `/UserProfile?email=${currentUser.email}`
      });
    },
    onSuccess: () => {
      toast.success('Agora você está seguindo!');
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.email || !profileEmail) return;
      const follows = await base44.entities.SocialFollow.filter({
        follower_email: currentUser.email,
        following_email: profileEmail
      });
      
      if (follows[0]) {
        await base44.entities.SocialFollow.delete(follows[0].id);
        
        if (profileUser.id) {
          try {
            await base44.entities.UserProfile.update(profileUser.id, {
              followers_count: Math.max(0, (profileUser.followers_count || 0) - 1)
            });
          } catch(e) { console.error(e); }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followersCount'] });
      queryClient.invalidateQueries({ queryKey: ['followingCount'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      toast.success('Deixou de seguir');
    },
  });

  const totalBadges = earnedBadges.length;

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

  if (loadingUser) {
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
            <Button onClick={() => navigate(createPageUrl('Home'))} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <Button variant="outline" className="mb-6" onClick={() => navigate(createPageUrl('Home'))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-0 shadow-xl mb-6 overflow-hidden bg-white">
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            {profileUser.cover_photo_url && (
              <img src={profileUser.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
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
            <div className="flex flex-col md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-20 md:-mt-24">
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
                    
                    {profileUser.is_verified && (
                      <Badge className="bg-blue-500 text-white" title="Verificado">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                    {profileUser.role === 'admin' && (
                      <Badge className="bg-red-600 text-white" title="Administrador">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {walkerProfile && (
                      <Badge 
                        className="bg-green-600 text-white cursor-pointer hover:bg-green-700" 
                        onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walkerProfile.id}`))}
                      >
                        <Dog className="w-3 h-3 mr-1" />
                        Passeador
                      </Badge>
                    )}
                  </div>
                  
                  {profileUser.bio && (
                    <p className="text-gray-600 mt-2 max-w-2xl">{profileUser.bio}</p>
                  )}
                  
                  {profileUser.city && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-2 justify-center md:justify-start">
                      <MapPin className="w-4 h-4" />
                      {profileUser.city}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6 mt-4 md:mt-0">
                {!isOwnProfile && currentUser && (
                  <>
                    <Button
                      onClick={() => isFollowing ? unfollowMutation.mutate() : followMutation.mutate()}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className={isFollowing ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'}
                    >
                      {isFollowing ? 'Seguindo' : 'Seguir'}
                    </Button>
{/* Mensagem button removed per request */}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 md:gap-8 py-4 border-t border-b border-gray-200 mt-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{totalBadges}</div>
                <div className="text-sm text-gray-600">Emblemas</div>
              </div>
              <div className="text-center cursor-pointer hover:bg-gray-50 rounded-lg py-2" onClick={() => setShowFollowers(true)}>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{followersCount}</div>
                <div className="text-sm text-gray-600">Seguidores</div>
              </div>
              <div className="text-center cursor-pointer hover:bg-gray-50 rounded-lg py-2" onClick={() => setShowFollowing(true)}>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{followingCount}</div>
                <div className="text-sm text-gray-600">Seguindo</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="badges">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg rounded-xl p-1 h-12 mb-4">
            <TabsTrigger value="badges"><Award className="w-4 h-4 mr-1" />Emblemas</TabsTrigger>
            <TabsTrigger value="about"><User className="w-4 h-4 mr-1" />Sobre</TabsTrigger>
            <TabsTrigger value="gamification"><Zap className="w-4 h-4 mr-1" />XP</TabsTrigger>
            <TabsTrigger value="activity"><TrendingUp className="w-4 h-4 mr-1" />Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="badges">
            <Card className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-400" />
                  Emblemas Conquistados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {earnedBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Nenhum emblema conquistado ainda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {earnedBadges.map((badge, idx) => (
                      <BadgeItem key={badge.id || idx} badge={badge} idx={idx} getBadgeImage={getBadgeImage} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardContent className="pt-6">
                {profileUser.about_me || profileUser.bio ? (
                  <p className="text-gray-700">{profileUser.about_me || profileUser.bio}</p>
                ) : (
                  <p className="text-gray-500 text-center italic">Nenhuma informação adicional.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gamification">
            <Card className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  Nível {profileUser.gamification_level || 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>XP: {profileUser.gamification_xp || 0}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 h-4 rounded-full"
                        style={{ width: `${Math.min(((profileUser.gamification_xp || 0) / ((profileUser.gamification_level || 1) * 1000)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader><CardTitle>Estatísticas</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{profileUser.profile_stats?.total_posts || 0}</div>
                    <div className="text-sm text-gray-600">Posts</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{profileUser.profile_stats?.total_bookings || 0}</div>
                    <div className="text-sm text-gray-600">Reservas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
          <DialogContent>
            <DialogHeader><DialogTitle>Seguidores</DialogTitle></DialogHeader>
            <ScrollArea className="h-[300px]">
              {followersList.map(f => (
                <div key={f.id} className="p-2 border-b">{f.follower_name}</div>
              ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
          <DialogContent>
            <DialogHeader><DialogTitle>Seguindo</DialogTitle></DialogHeader>
            <ScrollArea className="h-[300px]">
              {followingList.map(f => (
                <div key={f.id} className="p-2 border-b">{f.following_name}</div>
              ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}