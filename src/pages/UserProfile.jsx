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

function BadgeItem({ badge, idx, getBadgeImage, locked = false }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      key={badge.id || badge.badge_id || idx}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ delay: idx * 0.03 }}
      className={`flex flex-col items-center cursor-pointer relative p-2 rounded-xl transition-all ${showDetails ? 'bg-white/10 z-10' : ''} ${locked ? 'opacity-60 grayscale' : ''}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-3 border-2 shadow-lg relative overflow-hidden ${
        locked 
          ? 'border-gray-700 bg-gray-800/50 border-dashed' 
          : badge.rarity === 'legendary' ? 'border-yellow-400/50 bg-gradient-to-br from-yellow-900/40 to-orange-900/40' 
          : badge.rarity === 'epic' ? 'border-purple-400/50 bg-gradient-to-br from-purple-900/40 to-pink-900/40'
          : badge.rarity === 'rare' ? 'border-blue-400/50 bg-gradient-to-br from-blue-900/40 to-cyan-900/40'
          : 'border-white/20 bg-white/5'
      }`}>
        {/* Glow Effect */}
        {!locked && <div className="absolute inset-0 bg-white/5 blur-xl rounded-full transform scale-75" />}
        
        {badge.image_png_file ? (
          <img src={badge.image_png_file} alt={badge.name} className="w-14 h-14 object-contain z-10 drop-shadow-lg" />
        ) : badge.image_url ? (
          <img 
            src={badge.image_url} 
            alt={badge.name}
            className="w-14 h-14 object-contain z-10 drop-shadow-lg rounded-md"
          />
        ) : (
          <span className="text-4xl z-10 drop-shadow-md filter">{badge.icon || getBadgeImage(badge.badge_id || badge.id)}</span>
        )}

        {/* Locked Overlay */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
            <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center">
              <div className="w-1 h-3 bg-white/30 rotate-45 transform translate-x-0.5 -translate-y-0.5" />
            </div>
          </div>
        )}
      </div>

      <div className="text-center w-full">
        <p className={`text-xs font-bold leading-tight line-clamp-2 ${locked ? 'text-gray-500' : 'text-gray-100'}`}>
          {badge.name}
        </p>
        
        {/* XP Pill */}
        {badge.xp > 0 && (
          <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded-full bg-black/30 border border-white/10">
            <Zap className="w-2 h-2 text-yellow-400 mr-1" />
            <span className="text-[10px] font-mono text-yellow-400">{badge.xp} XP</span>
          </div>
        )}
      </div>

      {/* Popover Details */}
      {showDetails && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl z-50 text-center"
        >
          <div className="text-xs text-gray-300 mb-2">{badge.description}</div>
          <Badge className={`text-[10px] px-2 h-5 capitalize ${
            badge.rarity === 'legendary' ? 'bg-yellow-500 text-black' :
            badge.rarity === 'epic' ? 'bg-purple-500 text-white' :
            badge.rarity === 'rare' ? 'bg-blue-500 text-white' :
            'bg-gray-600 text-white'
          }`}>
            {badge.rarity || 'comum'}
          </Badge>
          {badge.earnedDate && (
            <div className="text-[10px] text-gray-500 mt-2">
              Conquistado em {new Date(badge.earnedDate).toLocaleDateString()}
            </div>
          )}
        </motion.div>
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
  // Handle potentially double-encoded emails from redirect loops
  const rawEmail = urlParams.get('email');
  let profileEmailParam = rawEmail;
  if (rawEmail) {
    try {
      profileEmailParam = decodeURIComponent(rawEmail);
      // Try decoding again if it still looks encoded (contains %40)
      if (profileEmailParam.includes('%40')) {
        profileEmailParam = decodeURIComponent(profileEmailParam);
      }
    } catch (e) {
      console.error("Error decoding email:", e);
    }
  }
  
  const profileIdParam = urlParams.get('id');
  const profileNameParam = urlParams.get('name');
  const profileUsernameParam = urlParams.get('username');

  const { data: currentUser, isLoading: authLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const targetId = profileIdParam;
  const targetName = profileNameParam;
  const targetUsername = profileUsernameParam;
  const targetEmail = !targetId && !targetName && !targetUsername ? profileEmailParam : null;

  const isSelfView = (!targetId && !targetEmail && !targetName && !targetUsername) || 
                     (currentUser && targetId === currentUser.id) || 
                     (currentUser && targetEmail === currentUser.email) ||
                     (currentUser && targetUsername === currentUser.username);

  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ['profileUser', targetId, targetEmail, targetName, targetUsername, isSelfView, currentUser?.id],
    queryFn: async () => {
      let userProfile = null;

      // 0. Priority: Search by Username (@handle) - Identificador principal
      if (targetUsername) {
        try {
          const byUsername = await base44.entities.UserProfile.filter({ username: targetUsername });
          if (byUsername && byUsername.length > 0) {
            userProfile = byUsername[0];
          }
        } catch (e) {
          console.error('Error fetching by Username:', e);
        }
      }

      // 1. Priority: Self View by Email
      if (isSelfView) {
        if (currentUser?.email) {
          try {
            const byEmail = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
            if (byEmail && byEmail.length > 0) {
              userProfile = byEmail[0];
            }
          } catch (e) {
            console.error('Error fetching self profile:', e);
          }
        } else {
           // If trying to view own profile but not logged in, we can't show it.
           // However, if we are here, it means no ID/Email was passed.
        }
      }

      // 2. Search by ID (UserProfile ID or User ID)
      if (!userProfile && targetId) {
        try {
          // 2a. Try finding by UserProfile Entity ID
          const byEntityId = await base44.entities.UserProfile.filter({ id: targetId });
          if (byEntityId && byEntityId.length > 0) userProfile = byEntityId[0];

          // 2b. Try finding by UserProfile user_id (Auth ID)
          if (!userProfile) {
            const byUserId = await base44.entities.UserProfile.filter({ user_id: targetId });
            if (byUserId && byUserId.length > 0) userProfile = byUserId[0];
          }

          // 2c. Fallback: WalkerProfile
          if (!userProfile) {
             // Try WalkerProfile by Entity ID
             let walkerMatch = await base44.entities.WalkerProfile.filter({ id: targetId });

             // Try WalkerProfile by user_id (Auth ID) - if field exists and is populated
             if (!walkerMatch || walkerMatch.length === 0) {
                try {
                  walkerMatch = await base44.entities.WalkerProfile.filter({ user_id: targetId });
                } catch (e) { console.log('WalkerProfile user_id filter not supported yet or failed'); }
             }

             if (walkerMatch && walkerMatch.length > 0) {
               const w = walkerMatch[0];
               userProfile = {
                  id: w.id, 
                  user_id: w.user_id || targetId, // Assume targetId is auth ID if we found it via user_id filter, or best guess
                  user_email: w.created_by,
                  full_name: w.walker_name,
                  profile_photo_url: w.photo_url,
                  bio: w.bio,
                  city: w.location,
                  role: 'walker',
                  is_verified: w.verification_status === 'verified',
                  is_virtual_profile: true
               };
             }
          }

          // 2d. Admin Super Fallback: Search User Table (Auth) directly by ID
          // This covers cases where UserProfile doesn't exist yet, but the User exists.
          if (!userProfile && currentUser?.role === 'admin') {
             try {
                const sysUsers = await base44.entities.User.filter({ id: targetId });
                if (sysUsers && sysUsers.length > 0) {
                  const sysUser = sysUsers[0];
                  userProfile = {
                     ...sysUser,
                     user_email: sysUser.email,
                     user_id: sysUser.id,
                     full_name: sysUser.full_name || sysUser.email.split('@')[0], // Fallback name
                     is_virtual_profile: true
                  };
                }
             } catch (err) { console.log('Admin User ID lookup failed', err); }
          }

        } catch (e) {
          console.error('Error fetching by ID:', e);
        }
      }

      // 3. Search by Name
      if (!userProfile && targetName) {
        try {
           // Try UserProfile full_name
           const byName = await base44.entities.UserProfile.filter({ full_name: targetName });
           if (byName && byName.length > 0) userProfile = byName[0];

           // Fallback: Try WalkerProfile walker_name
           if (!userProfile) {
              const byWalkerName = await base44.entities.WalkerProfile.filter({ walker_name: targetName });
              if (byWalkerName && byWalkerName.length > 0) {
                 const w = byWalkerName[0];
                 userProfile = {
                    id: w.id,
                    user_email: w.created_by,
                    full_name: w.walker_name,
                    profile_photo_url: w.photo_url,
                    bio: w.bio,
                    city: w.location,
                    role: 'walker',
                    is_verified: w.verification_status === 'verified',
                    is_virtual_profile: true
                 };
              }
           }
        } catch (e) {
          console.error('Error fetching by Name:', e);
        }
      }

      // 4. Search by Email (Explicit or Fallback)
      if (!userProfile) {
        const emailToSearch = targetEmail || (isSelfView ? currentUser?.email : null);

        if (emailToSearch) {
          try {
            // 4a. UserProfile by email
            const byEmail = await base44.entities.UserProfile.filter({ user_email: emailToSearch });
            if (byEmail && byEmail.length > 0) {
              userProfile = byEmail[0];
            } 

            // 4b. WalkerProfile fallback
            if (!userProfile) {
              const walkers = await base44.entities.WalkerProfile.filter({ created_by: emailToSearch });
              if (walkers && walkers.length > 0) {
                const w = walkers[0];
                userProfile = {
                  id: w.id, 
                  user_id: null,
                  user_email: w.created_by,
                  full_name: w.walker_name,
                  profile_photo_url: w.photo_url,
                  bio: w.bio,
                  city: w.location,
                  role: 'walker',
                  is_verified: w.verification_status === 'verified',
                  is_virtual_profile: true
                };
              }
            }

            // 4c. Admin Fallback (System User Table)
            if (!userProfile && currentUser?.role === 'admin') {
               try {
                 const sysUsers = await base44.entities.User.filter({ email: emailToSearch });
                 if (sysUsers && sysUsers.length > 0) {
                   const sysUser = sysUsers[0];
                   userProfile = {
                     ...sysUser,
                     user_email: sysUser.email,
                     user_id: sysUser.id,
                     is_virtual_profile: true
                   };
                 }
               } catch(err) { console.log('Admin fetch fallback failed'); }
            }

          } catch (e) {
            console.error('Error fetching by Email:', e);
          }
        }
      }

      // 5. Create if Self View and Missing
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

    // Redirecionar para login se for SelfView e não estiver logado
    React.useEffect(() => {
      if (isSelfView && !currentUser && !loadingUser && !authLoading) {
        base44.auth.redirectToLogin();
      }
    }, [isSelfView, currentUser, loadingUser, authLoading]);

  const profileEmail = profileUser?.user_email || profileUser?.email;
  const isOwnProfile = currentUser?.id === profileUser?.user_id || currentUser?.email === profileEmail;

  const { data: earnedBadges = [] } = useQuery({
    queryKey: ['userBadges', profileEmail, profileUser?.public_badges, currentUser?.public_badges],
    queryFn: async () => {
      const badgesMap = new Map();

      // 1. Adicionar badges do objeto UserProfile/User (Legacy/Sessão)
      const userBadges = profileUser?.public_badges || (isSelfView ? currentUser?.public_badges : []) || [];

      userBadges.forEach(b => {
        // Use badge_id if available, otherwise use name (legacy support)
        const key = b.badge_id || b.name;
        if (key) badgesMap.set(key, b);
      });

      // 2. Adicionar badges da tabela UserBadge (Source of Truth)
      if (profileEmail) {
        try {
          const fromTable = await base44.entities.UserBadge.filter({ user_email: profileEmail }, '-earned_date');
          fromTable.forEach(b => {
            const key = b.badge_id || b.name;
            if (key) badgesMap.set(key, { ...badgesMap.get(key), ...b });
          });
        } catch (e) {
          console.error("Error fetching badges table:", e);
        }
      }

      return Array.from(badgesMap.values());
    },
    enabled: !!profileEmail || !!profileUser,
    staleTime: 0,
    refetchOnWindowFocus: true
  });

  // Fetch ALL Badge Definitions to show what's possible
  const { data: allBadgeDefinitions = [] } = useQuery({
    queryKey: ['allBadgeDefinitions'],
    queryFn: () => base44.entities.BadgeDefinition.list(null, 100), // Fetch all
    staleTime: 300000 // 5 minutes cache
  });

  const displayBadges = earnedBadges;

  // Merge earned with definitions for Gallery View, handling Legacy Badges
  const galleryBadges = React.useMemo(() => {
    // 1. Process definitions (New System)
    const processedDefinitions = allBadgeDefinitions.map(def => {
      const earnedMatch = earnedBadges.find(b => 
        (b.badge_id && b.badge_id === def.id) || 
        (b.name && b.name === def.name)
      );
      
      return {
        ...def,
        isEarned: !!earnedMatch,
        earnedDate: earnedMatch?.earned_date || null
      };
    });

    // 2. Find Earned Badges that didn't match any definition (Legacy System)
    const definitionIds = new Set(processedDefinitions.map(d => d.id));
    const definitionNames = new Set(processedDefinitions.map(d => d.name));

    const legacyBadges = earnedBadges.filter(b => {
      const matchId = b.badge_id && definitionIds.has(b.badge_id);
      const matchName = b.name && definitionNames.has(b.name);
      return !matchId && !matchName;
    }).map(b => ({
      ...b,
      id: b.badge_id || `legacy-${b.name ? b.name.replace(/\s+/g, '-').toLowerCase() : Math.random()}`,
      isEarned: true,
      rarity: b.rarity || 'common',
      description: b.description || 'Emblema Especial',
      xp: b.xp || 0
    }));

    // 3. Combine and Sort: Earned First, then by Rarity, then Name
    const combined = [...legacyBadges, ...processedDefinitions];
    
    return combined.sort((a, b) => {
      // 1. Earned status (Earned first)
      if (a.isEarned !== b.isEarned) return b.isEarned ? 1 : -1;
      
      // 2. Rarity (Legendary > Epic > Rare > Common)
      const rarityOrder = { legendary: 3, epic: 2, rare: 1, common: 0 };
      const rA = rarityOrder[a.rarity?.toLowerCase()] || 0;
      const rB = rarityOrder[b.rarity?.toLowerCase()] || 0;
      if (rA !== rB) return rB - rA;

      // 3. XP (Higher first)
      if ((a.xp || 0) !== (b.xp || 0)) return (b.xp || 0) - (a.xp || 0);

      return 0;
    });
  }, [allBadgeDefinitions, earnedBadges]);

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

  // Real-time Followers Count
  const { data: followersCount = 0 } = useQuery({
    queryKey: ['followersCount', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return 0;
      // Fetch actual records to ensure accuracy (limit 1000 for performance)
      const res = await base44.entities.SocialFollow.filter({ following_email: profileEmail }, '-created_date', 1000);
      return res.length;
    },
    enabled: !!profileEmail,
  });

  // Real-time Following Count
  const { data: followingCount = 0 } = useQuery({
    queryKey: ['followingCount', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return 0;
      const res = await base44.entities.SocialFollow.filter({ follower_email: profileEmail }, '-created_date', 1000);
      return res.length;
    },
    enabled: !!profileEmail,
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

  const totalBadges = displayBadges.length;

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
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isSelfView && !currentUser ? "Faça Login" : "Perfil Não Encontrado"}
            </h2>
            <p className="text-gray-600 mb-6">
              {isSelfView && !currentUser 
                ? "Para visualizar seu próprio perfil, você precisa entrar na sua conta." 
                : "O perfil que você está procurando não está disponível publicamente ou não existe."}
            </p>
            
            {!currentUser ? (
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    // Use redirect with explicit URL to handle custom domains correctly
                    base44.auth.redirectToLogin(window.location.origin);
                  }} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Entrar na minha conta
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'} 
                  className="w-full"
                >
                  Voltar ao Início
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
                  Dica: Se você é o administrador, vá ao Painel Admin &gt; Contas e clique em "Sincronizar Perfis" para garantir que todos os usuários tenham perfis públicos.
                </p>
                <Button onClick={() => window.location.href = '/'} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              </div>
            )}
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
              <img src={profileUser.cover_photo_url} alt="Cover" className="w-full h-full object-cover object-center" />
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
                  <AvatarImage src={profileUser.profile_photo_url} className="object-cover object-center" />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-4xl">
                    {profileUser.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center md:text-left mb-4 md:mb-6">
                  <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {profileUser.full_name}
                    </h1>
                    
                    {(profileUser.is_verified || walkerProfile?.verification_status === 'verified') && (
                      <Badge className="bg-blue-500 text-white" title="Verificado">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                    {(profileUser.role === 'admin' || (isSelfView && currentUser?.role === 'admin')) && (
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
            <Card className="bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white border-0 shadow-2xl">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-400" />
                    Galeria de Conquistas
                  </CardTitle>
                  <div className="text-xs font-mono text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {earnedBadges.length} / {galleryBadges.length > 0 ? galleryBadges.length : displayBadges.length} Desbloqueados
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-1">Colecione todos para se tornar uma lenda!</p>
              </CardHeader>
              <CardContent className="pt-6">
                {galleryBadges.length > 0 ? (
                  <div>
                    {/* Group by Rarity if needed, or just grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-2 gap-y-6">
                      {galleryBadges.map((badge, idx) => (
                        <BadgeItem 
                          key={badge.id || idx} 
                          badge={badge} 
                          idx={idx} 
                          getBadgeImage={getBadgeImage}
                          locked={!badge.isEarned} 
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Fallback for legacy view if definitions not loaded */
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {displayBadges.map((badge, idx) => (
                      <BadgeItem key={badge.id || badge.badge_id || idx} badge={badge} idx={idx} getBadgeImage={getBadgeImage} />
                    ))}
                    {displayBadges.length === 0 && (
                      <div className="col-span-full text-center py-12">
                        <Award className="w-16 h-16 text-gray-700 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-500">Nenhum emblema conquistado ainda.</p>
                      </div>
                    )}
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