
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
  Target, Zap, Flame, Sparkles, ChevronRight, Settings, Camera, Crown
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

  console.log('UserProfile - Email from URL:', profileEmail);

  const { data: currentUser, isLoading: loadingCurrentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 0, // Force fresh data
    refetchOnWindowFocus: true, // Force fresh data
  });

  console.log('UserProfile - Current User:', currentUser?.email);
  console.log('UserProfile - Current User Full Data:', currentUser);

  useEffect(() => {
    if (!profileEmail && currentUser?.email) {
      console.log('UserProfile - No profileEmail, redirecting to:', currentUser.email);
      const newUrl = createPageUrl(`UserProfile?email=${currentUser.email}`);
      window.location.href = newUrl;
    }
  }, [profileEmail, currentUser, navigate]);

  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ['profileUser', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return null;
      const users = await base44.entities.User.filter({ email: profileEmail });
      console.log('UserProfile - Users found:', users);
      console.log('UserProfile - First user achievements_badges:', users[0]?.achievements_badges);
      return users[0] || null;
    },
    enabled: !!profileEmail,
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const profileBadges = profileUser?.profile_badges || [];
  const achievementsBadges = profileUser?.achievements_badges || [];

  console.log('===== PROFILE DEBUG =====');
  console.log('Profile User Email:', profileUser?.email);
  console.log('Profile User Full Name:', profileUser?.full_name);
  console.log('Profile Badges (profile_badges):', profileBadges);
  console.log('Achievements Badges (achievements_badges):', achievementsBadges);
  console.log('Achievements Badges Length:', achievementsBadges.length);
  console.log('Achievements Badges Array:', JSON.stringify(achievementsBadges, null, 2));
  console.log('========================');

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

  const { data: recentPhotos = [] } = useQuery({
    queryKey: ['recentPhotos', profileEmail],
    queryFn: async () => {
      const posts = await base44.entities.SocialPost.filter({
        author_email: profileEmail,
        moderation_status: 'approved'
      }, '-created_date', 9);
      return posts.filter(p => p.media_urls?.length > 0).slice(0, 9);
    },
    enabled: !!profileEmail,
    initialData: [],
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

  const { data: userComments = [] } = useQuery({
    queryKey: ['userComments', profileEmail],
    queryFn: () => base44.entities.SocialComment.filter({ author_email: profileEmail }),
    enabled: !!profileEmail,
    initialData: [],
  });

  const { data: userLikes = [] } = useQuery({
    queryKey: ['userLikes', profileEmail],
    queryFn: () => base44.entities.SocialLike.filter({ user_email: profileEmail }),
    enabled: !!profileEmail,
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
      toast.success(followData.isFollowing ? "Deixou de seguir" : "Agora segue");
    },
  });

  const startDirectMessage = async () => {
    if (!currentUser || !profileUser) {
      toast.error('Não foi possível iniciar a conversa. Usuário atual ou perfil não encontrado.');
      return;
    }

    try {
      // Check if conversation already exists
      const conversations = await base44.entities.ChatConversation.filter({}); // Filter by participant emails might be more efficient if available
      const existing = conversations.find(conv =>
        conv.conversation_type === 'one_on_one' &&
        conv.participants?.length === 2 &&
        conv.participants.some(p => p.email === currentUser.email) &&
        conv.participants.some(p => p.email === profileUser.email)
      );

      if (existing) {
        navigate(createPageUrl(`Messages?conversation_id=${existing.id}`));
        toast.success('Conversa existente aberta!');
        return;
      }

      // Create new conversation
      const newConv = await base44.entities.ChatConversation.create({
        conversation_type: 'one_on_one',
        participants: [
          {
            email: currentUser.email,
            name: currentUser.full_name,
            photo_url: currentUser.profile_photo_url,
            role: 'owner',
            last_read_at: new Date().toISOString()
          },
          {
            email: profileUser.email,
            name: profileUser.full_name,
            photo_url: profileUser.profile_photo_url,
            role: 'owner',
            last_read_at: new Date().toISOString()
          }
        ],
        last_message: "Nova conversa iniciada",
        last_message_sender: currentUser.email,
        last_message_date: new Date().toISOString()
      });

      navigate(createPageUrl(`Messages?conversation_id=${newConv.id}`));
      toast.success('Conversa iniciada!');
    } catch (error) {
      console.error('Error starting DM:', error);
      toast.error('Erro ao iniciar conversa. Tente novamente.');
    }
  };

  // Auto-detect and award XP for "Visit Dog Connect" quest
  useEffect(() => {
    const awardVisitXP = async () => {
      if (!currentUser || !profileEmail || profileEmail !== currentUser.email) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const lastActivity = currentUser.last_activity_date;

      // Only award once per day
      if (lastActivity === today) return;

      // Award 20 XP for daily visit
      const newXP = (currentUser.gamification_xp || 0) + 20;
      // Assuming 500 XP per level, level calculation should be based on current XP
      const newLevel = Math.floor(newXP / 500) + 1;

      try {
        await base44.auth.updateMe({
          gamification_xp: newXP,
          gamification_level: newLevel,
          last_activity_date: today,
          daily_streak: lastActivity === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') ? (currentUser.daily_streak || 0) + 1 : 1 // Increment streak if last visit was yesterday, else reset
        });

        queryClient.invalidateQueries(['currentUser']);
        queryClient.invalidateQueries(['profileUser', profileEmail]); // Invalidate specific profile if it's the current user's

        toast.success("✅ Missão Diária Completa! +20 XP por visitar o Dog Connect! 🎉");
      } catch (error) {
        console.error("Failed to update user for daily visit XP:", error);
        toast.error("Erro ao conceder XP diário. Tente novamente.");
      }
    };

    // Only run this effect if currentUser is available and it's their own profile
    if (currentUser?.email === profileEmail) {
      awardVisitXP();
    }
  }, [currentUser, profileEmail, queryClient]); // Depend on queryClient to ensure it's stable

  const isOwnProfile = currentUser?.email === profileEmail;

  // Gamification
  const xpForNextLevel = (level) => level * 500;
  const currentLevelXP = profileUser?.gamification_xp || 0;
  const currentLevel = profileUser?.gamification_level || 1;
  const xpNeeded = xpForNextLevel(currentLevel);
  const xpProgress = ((currentLevelXP % xpNeeded) / xpNeeded) * 100;

  // Real-time Daily Quests with actual data
  const dailyQuests = [
    {
      id: 1,
      title: "Publicar 1 foto",
      reward: 50,
      completed: (profileUser?.profile_stats?.total_posts || 0) > 0
    },
    {
      id: 2,
      title: "Dar 5 curtidas",
      reward: 25,
      completed: userLikes.length >= 5
    },
    {
      id: 3,
      title: "3 comentários",
      reward: 30,
      completed: userComments.length >= 3
    },
    {
      id: 4,
      title: "Visitar Dog Connect",
      reward: 20,
      completed: true // This is handled by the useEffect above
    },
  ];

  // High-Quality 3D Badges - Twitter/Premium Style
  const getBadgeImage = (type, data = {}, transparent = false) => {
    const badges = {
      // Twitter Blue Checkmark - Ultra Premium 3D
      verified: `data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='vg' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%231DA1F2;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%230A66C2;stop-opacity:1'/%3E%3C/linearGradient%3E%3CradialGradient id='vs'%3E%3Cstop offset='0%25' style='stop-color:%23fff;stop-opacity:0.5'/%3E%3Cstop offset='100%25' style='stop-color:%23fff;stop-opacity:0'/%3E%3C/radialGradient%3E%3Cfilter id='vsh'%3E%3CfeGaussianBlur stdDeviation='2'/%3E%3CfeOffset dy='2'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.25'/%3E%3C/feComponentTransfer%3E%3CfeMerge%3E%3CfeMergeNode/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Ccircle cx='24' cy='26' r='18' fill='%23000' opacity='0.1'/%3E%3Ccircle cx='24' cy='24' r='20' fill='url(%23vg)' filter='url(%23vsh)'/%3E%3Ccircle cx='24' cy='24' r='20' fill='url(%23vs)'/%3E%3Cpath d='M18 24l4 5 8-10' stroke='%23fff' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E`,

      // Red/Gold Admin Shield - Premium 3D
      admin: `data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='ag1' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23DC2626'/%3E%3Cstop offset='50%25' style='stop-color:%23B91C1C'/%3E%3Cstop offset='100%25' style='stop-color:%23991B1B'/%3E%3C/linearGradient%3E%3ClinearGradient id='ag2' x1='0%25' y1='0%25' x2='100%25' y2='0%25'%3E%3Cstop offset='0%25' style='stop-color:%23FCD34D'/%3E%3Cstop offset='50%25' style='stop-color:%23F59E0B'/%3E%3Cstop offset='100%25' style='stop-color:%23D97706'/%3E%3C/linearGradient%3E%3CradialGradient id='as'%3E%3Cstop offset='0%25' style='stop-color:%23fff;stop-opacity:0.6'/%3E%3Cstop offset='100%25' style='stop-color:%23fff;stop-opacity:0'/%3E%3C/radialGradient%3E%3Cfilter id='ash'%3E%3CfeGaussianBlur stdDeviation='2'/%3E%3CfeOffset dy='3'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.3'/%3E%3C/feComponentTransfer%3E%3CfeMerge%3E%3CfeMergeNode/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M24 6L36 12v14c0 8-12 14-12 14s-12-6-12-14V12z' fill='%23000' opacity='0.15' transform='translate(0,3)'/%3E%3Cpath d='M24 4L36 10v14c0 8-12 14-12 14s-12-6-12-14V10z' fill='url(%23ag1)' filter='url(%23ash)'/%3E%3Cpath d='M24 4L36 10v14c0 8-12 14-12 14s-12-6-12-14V10z' fill='url(%23as)' opacity='0.3'/%3E%3Cpath d='M24 10L32 14v10c0 5-8 9-8 9s-8-4-8-9V14z' fill='url(%23ag2)' opacity='0.8'/%3E%3Cpath d='M21 20l2 3 5-6' stroke='%23fff' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E`,

      // Blue Moderator Shield - Premium 3D
      moderator: `data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='mg1' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%233B82F6'/%3E%3Cstop offset='50%25' style='stop-color:%232563EB'/%3E%3Cstop offset='100%25' style='stop-color:%231D4ED8'/%3E%3C/linearGradient%3E%3CradialGradient id='ms'%3E%3Cstop offset='0%25' style='stop-color:%23fff;stop-opacity:0.5'/%3E%3Cstop offset='100%25' style='stop-color:%23fff;stop-opacity:0'/%3E%3C/radialGradient%3E%3Cfilter id='msh'%3E%3CfeGaussianBlur stdDeviation='2'/%3E%3CfeOffset dy='3'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.3'/%3E%3C/feComponentTransfer%3E%3CfeMerge%3E%3CfeMergeNode/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M24 6L36 12v14c0 8-12 14-12 14s-12-6-12-14V12z' fill='%23000' opacity='0.15' transform='translate(0,3)'/%3E%3Cpath d='M24 4L36 10v14c0 8-12 14-12 14s-12-6-12-14V10z' fill='url(%23mg1)' filter='url(%23msh)'/%3E%3Cpath d='M24 4L36 10v14c0 8-12 14-12 14s-12-6-12-14V10z' fill='url(%23ms)' opacity='0.3'/%3E%3Cpath d='M24 12L32 16v9c0 4.5-8 8-8 8s-8-3.5-8-8v-9z' fill='%2393C5FD' opacity='0.4'/%3E%3Crect x='22' y='18' width='4' height='8' fill='%23fff' rx='1'/%3E%3Crect x='20' y='22' width='8' height='4' fill='%23fff' rx='1'/%3E%3C/svg%3E`,

      // Pink Heart Adoption - 3D
      adoption: `data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='hg' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FF69B4'/%3E%3Cstop offset='100%25' style='stop-color:%23DB2777'/%3E%3C/linearGradient%3E%3CradialGradient id='hs'%3E%3Cstop offset='0%25' style='stop-color:%23fff;stop-opacity:0.6'/%3E%3Cstop offset='100%25' style='stop-color:%23fff;stop-opacity:0'/%3E%3C/radialGradient%3E%3Cfilter id='hsh'%3E%3CfeGaussianBlur stdDeviation='2'/%3E%3CfeOffset dy='3'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.25'/%3E%3C/feComponentTransfer%3E%3CfeMerge%3E%3CfeMergeNode/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M16 14c-4 0-7 3-7 7 0 8 15 19 15 19s15-11 15-19c0-4-3-7-7-7-2.5 0-4.7 1.3-6 3.3-1.3-2-3.5-3.3-6-3.3z' fill='%23000' opacity='0.12' transform='translate(0,3)'/%3E%3Cpath d='M16 12c-4 0-7 3-7 7 0 8 15 19 15 19s15-11 15-19c0-4-3-7-7-7-2.5 0-4.7 1.3-6 3.3-1.3-2-3.5-3.3-6-3.3z' fill='url(%23hg)' filter='url(%23hsh)'/%3E%3Cellipse cx='18' cy='16' rx='8' ry='6' fill='url(%23hs)'/%3E%3C/svg%3E`,

      // Golden Level Badge - 3D Coin
      level: (level) => {
        const lvl = level || 1;
        return `data:image/svg+xml,%3Csvg width='56' height='56' viewBox='0 0 56 56' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='lg' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FFD700'/%3E%3Cstop offset='50%25' style='stop-color:%23FFA500'/%3E%3Cstop offset='100%25' style='stop-color:%23FF8C00'/%3E%3C/linearGradient%3E%3CradialGradient id='ls'%3E%3Cstop offset='0%25' style='stop-color:%23fff;stop-opacity:0.7'/%3E%3Cstop offset='100%25' style='stop-color:%23fff;stop-opacity:0'/%3E%3C/radialGradient%3E%3Cfilter id='lsh'%3E%3CfeGaussianBlur stdDeviation='2'/%3E%3CfeOffset dy='3'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.3'/%3E%3C/feComponentTransfer%3E%3CfeMerge%3E%3CfeMergeNode/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Cellipse cx='28' cy='34' rx='22' ry='6' fill='%23000' opacity='0.15'/%3E%3Ccircle cx='28' cy='28' r='24' fill='url(%23lg)' filter='url(%23lsh)'/%3E%3Ccircle cx='28' cy='28' r='22' fill='%23B8860B' opacity='0.2'/%3E%3Ccircle cx='28' cy='28' r='20' fill='%23FFD700' opacity='0.4'/%3E%3Cellipse cx='23' cy='20' rx='12' ry='9' fill='url(%23ls)'/%3E%3Ctext x='28' y='35' font-family='Arial,sans-serif' font-size='20' font-weight='bold' fill='%23fff' text-anchor='middle' stroke='%23B8860B' stroke-width='0.5'%3E${lvl}%3C/text%3E%3C/svg%3E`;
      },

      // Community Badges - High Quality 3D
      community: (badge) => {
        const rarity = badge?.rarity || 'common';
        const icon = badge?.icon || '⭐';

        const colors = {
          legendary: { g1: '%23FFD700', g2: '%23FFA500', g3: '%23FF8C00', border: '%23B8860B' },
          epic: { g1: '%23C084FC', g2: '%23A855F7', g3: '%238B5CF6', border: '%236B21A8' },
          rare: { g1: '%2360A5FA', g2: '%233B82F6', g3: '%232563EB', border: '%231E40AF' },
          common: { g1: '%239CA3AF', g2: '%236B7280', g3: '%234B5563', border: '%23374151' }
        };

        const c = colors[rarity];

        return `data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='cg' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:${c.g1}'/%3E%3Cstop offset='50%25' style='stop-color:${c.g2}'/%3E%3Cstop offset='100%25' style='stop-color:${c.g3}'/%3E%3C/linearGradient%3E%3CradialGradient id='cs'%3E%3Cstop offset='0%25' style='stop-color:%23fff;stop-opacity:0.6'/%3E%3Cstop offset='100%25' style='stop-color:%23fff;stop-opacity:0'/%3E%3C/radialGradient%3E%3Cfilter id='csh'%3E%3CfeGaussianBlur stdDeviation='3'/%3E%3CfeOffset dy='4'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='linear' slope='0.3'/%3E%3C/feComponentTransfer%3E%3CfeMerge%3E%3CfeMergeNode/%3E%3CfeMergeNode in='SourceGraphic'/%3E%3C/feMerge%3E%3C/filter%3E%3C/defs%3E%3Crect x='12' y='16' width='56' height='56' rx='14' fill='%23000' opacity='0.12'/%3E%3Crect x='10' y='10' width='60' height='60' rx='16' fill='url(%23cg)' filter='url(%23csh)'/%3E%3Crect x='14' y='14' width='52' height='52' rx='14' fill='${c.border}' opacity='0.25'/%3E%3Crect x='18' y='18' width='44' height='44' rx='12' fill='url(%23cg)' opacity='0.5'/%3E%3Cellipse cx='32' cy='28' rx='16' ry='12' fill='url(%23cs)'/%3E%3Ctext x='40' y='56' font-size='34' text-anchor='middle'%3E${icon}%3C/text%3E%3C/svg%3E`;
      }
    };

    if (type === 'level') return badges.level(data);
    if (type === 'community') return badges.community(data);
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

  const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <Button variant="outline" className="mb-6" onClick={() => navigate(createPageUrl('SocialFeed'))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="border-0 shadow-xl mb-6 overflow-hidden bg-white">
          {/* Cover Photo */}
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
            {profileUser.cover_photo_url && (
              <img src={profileUser.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
            )}
            {isOwnProfile && (
              <Button variant="ghost" size="sm" className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30" onClick={() => navigate(createPageUrl('AccountSettings'))}>
                <Settings className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            )}
          </div>

          <CardContent className="relative px-6 md:px-8 pb-8">
            <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
              {/* Avatar */}
              <div className="flex flex-col items-center md:items-start">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-xl ring-4 ring-blue-100">
                  <AvatarImage src={profileUser.profile_photo_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-4xl font-bold">
                    {profileUser.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 md:mt-20">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    {/* Nome + Badges (ao lado do nome) */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <h1 className="text-3xl font-bold text-gray-900">{profileUser.full_name}</h1>
                      
                      {/* Profile Badges - aparecem ao lado do nome */}
                      {profileBadges.map((badge, idx) => (
                        <div
                          key={idx}
                          className="relative group cursor-pointer"
                          title={`${badge.name} - ${badge.description}`}
                        >
                          {badge.badge_id === 'verified' && (
                            <img 
                              src={getBadgeImage('verified')} 
                              alt="Verificado" 
                              className="w-7 h-7 hover:scale-110 transition-transform drop-shadow-lg" 
                            />
                          )}
                          {badge.badge_id === 'admin' && (
                            <img 
                              src={getBadgeImage('admin')} 
                              alt="Admin" 
                              className="w-9 h-9 hover:scale-110 transition-transform drop-shadow-lg" 
                            />
                          )}
                          {badge.badge_id === 'moderator' && (
                            <img 
                              src={getBadgeImage('moderator')} 
                              alt="Moderador" 
                              className="w-9 h-9 hover:scale-110 transition-transform drop-shadow-lg" 
                            />
                          )}
                          {badge.badge_id === 'adoption_advocate' && (
                            <img 
                              src={getBadgeImage('adoption')} 
                              alt="Defensor de Adoção" 
                              className="w-9 h-9 hover:scale-110 transition-transform drop-shadow-lg" 
                            />
                          )}
                          {badge.badge_id === 'certified_professional' && (
                            <Badge className="bg-blue-600 text-white">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Certificado
                            </Badge>
                          )}
                          {badge.badge_id === 'top_contributor' && (
                            <Badge className="bg-yellow-600 text-white">
                              <Star className="w-3 h-3 mr-1" />
                              Top
                            </Badge>
                          )}
                          {badge.badge_id === 'vip_member' && (
                            <Badge className="bg-purple-600 text-white">
                              <Crown className="w-3 h-3 mr-1" />
                              VIP
                            </Badge>
                          )}
                          {badge.badge_id === 'official_partner' && (
                            <Badge className="bg-green-600 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Parceiro
                            </Badge>
                          )}
                          {badge.badge_id === 'community_leader' && (
                            <Badge className="bg-orange-600 text-white">
                              <Users className="w-3 h-3 mr-1" />
                              Líder
                            </Badge>
                          )}
                          {badge.badge_id === 'expert_trainer' && (
                            <Badge className="bg-indigo-600 text-white">
                              <Award className="w-3 h-3 mr-1" />
                              Expert
                            </Badge>
                          )}
                          {badge.badge_id === 'trusted_walker' && (
                            <Badge className="bg-teal-600 text-white">
                              <Heart className="w-3 h-3 mr-1" />
                              Confiável
                            </Badge>
                          )}
                          {badge.badge_id === 'vet_verified' && (
                            <Badge className="bg-red-600 text-white">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              Veterinário
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>

                    {profileUser.bio && (
                      <p className="text-gray-700 mb-3">{profileUser.bio}</p>
                    )}

                    {profileUser.city && (
                      <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
                        <MapPin className="w-4 h-4" />
                        {profileUser.city}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {currentLevel > 1 && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 shadow-lg">
                        Nível {currentLevel}
                      </Badge>
                    )}

                    {!isOwnProfile && currentUser && (
                      <>
                        <Button
                          onClick={() => followMutation.mutate(followData.isFollowing)}
                          disabled={followMutation.isPending}
                          className={followData.isFollowing ? 'bg-gray-200 text-gray-900' : 'bg-purple-600 text-white'}
                          size="sm"
                        >
                          {followData.isFollowing ? 'Seguindo' : 'Seguir'}
                        </Button>
                        
                        {/* NEW: Direct Message Button */}
                        <Button
                          onClick={startDirectMessage}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Mensagem
                        </Button>
                      </>
                    )}

                    {isOwnProfile && (
                      <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl('AccountSettings'))}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                      </Button>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
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
              {recentPhotos.length >= 9 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setActiveTab('posts')}
                >
                  Ver Todas as Fotos
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
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

          <TabsContent value="gamification">
            <div className="space-y-4">
              <Card className="bg-gradient-to-br from-purple-600 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center p-2 backdrop-blur-sm border-2 border-white/20">
                      <img
                        src={getBadgeImage('level', currentLevel)}
                        alt={`Nível ${currentLevel}`}
                        className="w-full h-full drop-shadow-2xl"
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-1">Nível {currentLevel}</h2>
                      <p className="text-white/90 text-sm">{xpNeeded - (currentLevelXP % xpNeeded)} / {xpNeeded} XP para próximo nível</p>
                      <Progress value={xpProgress} className="h-3 bg-white/20 mt-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-white/10 rounded">
                      <div className="text-lg font-bold">{achievementsBadges.length || 0}</div>
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
            <Card className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-400" />
                  Emblemas Conquistados
                  <Badge className="ml-2 bg-yellow-500 text-gray-900">{achievementsBadges.length}</Badge>
                </CardTitle>
                <p className="text-sm text-gray-400 mt-2">
                  Clique no emblema para alternar fundo transparente
                </p>
              </CardHeader>
              <CardContent>
                {(!achievementsBadges || achievementsBadges.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-white/20">
                      <Award className="w-12 h-12 text-gray-500" />
                    </div>
                    <p className="text-gray-400">Nenhum emblema conquistado</p>
                    <p className="text-sm text-gray-500 mt-2">Participe da comunidade para ganhar emblemas!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {achievementsBadges.map((badge, idx) => (
                      <BadgeItem key={badge.badge_id || idx} badge={badge} idx={idx} getBadgeImage={getBadgeImage} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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

function BadgeItem({ badge, idx, getBadgeImage }) {
  const [showTransparent, setShowTransparent] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        delay: idx * 0.08,
        type: "spring",
        stiffness: 200
      }}
      className="relative group"
    >
      <div
        onClick={() => setShowTransparent(!showTransparent)}
        className={`p-3 bg-gradient-to-br rounded-2xl border-4 hover:scale-110 transition-all cursor-pointer shadow-2xl ${
          badge.rarity === 'legendary' ? 'from-yellow-400 to-orange-500 border-yellow-300 shadow-yellow-500/50' :
          badge.rarity === 'epic' ? 'from-purple-500 to-pink-500 border-purple-400 shadow-purple-500/50' :
          badge.rarity === 'rare' ? 'from-blue-400 to-cyan-500 border-blue-300 shadow-blue-500/50' :
          'from-gray-600 to-gray-700 border-gray-500 shadow-gray-500/50'
        }`}
      >
        <div className={`${showTransparent ? 'bg-transparent' : 'bg-white/90'} backdrop-blur-sm rounded-xl p-2 border-2 ${showTransparent ? 'border-white/30' : 'border-white/50'}`}>
          {badge.image_url ? (
            <img
              src={badge.image_url}
              alt={badge.name}
              className="w-full h-20 mx-auto drop-shadow-xl object-contain"
              style={{imageRendering: 'pixelated'}}
            />
          ) : (
            <img
              src={getBadgeImage('community', badge, showTransparent)}
              alt={badge.name}
              className="w-full h-20 mx-auto drop-shadow-xl"
            />
          )}
        </div>
        <p className="text-center text-xs font-black mt-2 truncate text-white drop-shadow-lg">
          {badge.name}
        </p>

        {showTransparent && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-10">
            <Badge className="bg-green-500 text-white text-xs whitespace-nowrap shadow-lg">
              Transparente
            </Badge>
          </div>
        )}
      </div>

      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-30 animate-in fade-in slide-in-from-bottom-2">
        <div className="bg-gray-900 text-white rounded-xl p-4 shadow-2xl border-2 border-gray-700 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            {badge.image_url ? (
              <img
                src={badge.image_url}
                alt={badge.name}
                className="w-8 h-8 rounded object-contain"
                style={{imageRendering: 'pixelated'}}
              />
            ) : (
              <span className="text-2xl">{badge.icon}</span>
            )}
            <p className="font-bold text-sm">{badge.name}</p>
          </div>
          <p className="text-xs text-gray-300 mb-2">{badge.description}</p>
          <div className="flex items-center justify-between mb-2">
            <Badge className={`text-xs ${
              badge.rarity === 'legendary' ? 'bg-yellow-500' :
              badge.rarity === 'epic' ? 'bg-purple-500' :
              badge.rarity === 'rare' ? 'bg-blue-500' :
              'bg-gray-500'
            }`}>
              {badge.rarity?.toUpperCase()}
            </Badge>
            {badge.earned_date && (
              <p className="text-xs text-gray-400">
                {format(new Date(badge.earned_date), "d MMM yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
            💡 Clique para alternar fundo
          </p>
        </div>
      </div>
    </motion.div>
  );
}
