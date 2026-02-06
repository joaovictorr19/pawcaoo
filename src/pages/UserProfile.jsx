import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, Calendar, Heart, Camera, Edit, Share2,
  Award, Bookmark, Grid, ArrowLeft, Dog, Zap, Crown,
  CheckCircle, Shield, ShieldCheck, Users, User, Plus, MessageCircle, BarChart2
} from "lucide-react";
import { t } from "@/components/translations";
import { useLanguage } from "@/components/LanguageContext";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import AdminBadgeGlass from "@/components/ui/AdminBadgeGlass";
import TrainerVerifiedBadge from "@/components/ui/TrainerVerifiedBadge";
import PawCaoEmployeeStamp from "@/components/ui/PawCaoEmployeeStamp";
// ProfessionalRoleBadge removed from profile - too many badges already
import BadgeSelectionModal from "@/components/gamification/BadgeSelectionModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useCreateNotification } from "@/components/NotificationService";
import { calculateTier, getLevelFromXP, getXPForLevel } from "@/components/gamification/tierSystem";
import ProfileAnimalsBar from "../components/profile/ProfileAnimalsBar";
import AnimalManagerModal from "../components/profile/AnimalManagerModal";
import PinnedBadgesDisplay from "../components/profile/PinnedBadgesDisplay";

const BadgeItem = React.memo(({ badge, idx, getBadgeImage, locked = false }) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            key={`badge-${badge.badge_id || badge.id}-${idx}`}
            initial={false}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center cursor-pointer relative p-2 rounded-xl transition-all touch-manipulation min-w-[48px] min-h-[48px] z-10 ${locked ? 'opacity-60 grayscale' : ''}`}
          >
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-2 md:mb-3 border-2 shadow-lg relative overflow-hidden ${
              locked 
                ? 'border-gray-700 bg-gray-800/50 border-dashed' 
                : badge.rarity === 'legendary' ? 'border-yellow-400/50 bg-gradient-to-br from-yellow-900/40 to-orange-900/40' 
                : badge.rarity === 'epic' ? 'border-purple-400/50 bg-gradient-to-br from-purple-900/40 to-pink-900/40'
                : badge.rarity === 'rare' ? 'border-blue-400/50 bg-gradient-to-br from-blue-900/40 to-cyan-900/40'
                : 'border-white/20 bg-white/5'
            }`}>
              {!locked && <div className="absolute inset-0 bg-white/5 blur-xl rounded-full transform scale-75" />}
              
              {badge.image_png_file ? (
                <img 
                  src={badge.image_png_file} 
                  alt={badge.name} 
                  className="w-12 h-12 md:w-14 md:h-14 object-contain z-10 drop-shadow-lg" 
                  loading="lazy"
                  decoding="async"
                />
              ) : badge.image_url ? (
                <img 
                  src={badge.image_url} 
                  alt={badge.name}
                  className="w-12 h-12 md:w-14 md:h-14 object-contain z-10 drop-shadow-lg rounded-md"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="text-3xl md:text-4xl z-10 drop-shadow-md">{badge.icon || getBadgeImage(badge.badge_id || badge.id)}</span>
              )}

              {locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20">
                  <div className="w-6 h-6 rounded-full border-2 border-white/30 flex items-center justify-center">
                    <div className="w-1 h-3 bg-white/30 rotate-45 transform translate-x-0.5 -translate-y-0.5" />
                  </div>
                </div>
              )}
            </div>

            <div className="text-center w-full">
              <p className={`text-[10px] md:text-xs font-bold leading-tight line-clamp-2 ${locked ? 'text-gray-500' : 'text-gray-100'}`}>
                {badge.name}
              </p>
              

            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900/95 backdrop-blur-md border border-white/10 text-white rounded-xl p-3 shadow-2xl max-w-[200px] text-center z-50">
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
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

export default function UserProfile() {
  const navigate = useNavigate();
  const { language } = useLanguage();
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
      // console.error("Error decoding email:", e);
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
          // console.error('Error fetching by Username:', e);
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
            // console.error('Error fetching self profile:', e);
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
             } catch (err) { /* Admin User ID lookup failed */ }
          }

        } catch (e) {
          // console.error('Error fetching by ID:', e);
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
          // console.error('Error fetching by Name:', e);
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
               } catch(err) { /* Admin fetch fallback failed */ }
            }

          } catch (e) {
            // console.error('Error fetching by Email:', e);
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
            is_verified: false // Force false for new profiles until admin verification
          };
          userProfile = await base44.entities.UserProfile.create(payload);
        } catch (error) {
          // console.error("Profile creation failed:", error);
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

  // Centralized Badge System with Unique ID - FIXED DEDUPLICATION BY badge_id
  const { data: earnedBadges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['userBadges', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      
      console.log('🔍 Fetching badges for:', profileEmail);
      
      // SINGLE SOURCE OF TRUTH: UserBadge entity only
      const badgesFromTable = await base44.entities.UserBadge.filter({ user_email: profileEmail }, '-earned_date');
      
      console.log('📦 Raw badges fetched:', badgesFromTable.length);
      
      // CRITICAL: Deduplicate using badge_id (type of badge) to ensure only one of each type
      const uniqueBadges = new Map();
      badgesFromTable.forEach((badge) => {
        // Use badge_id as primary key for deduplication by type
        const uniqueKey = badge.badge_id;
        if (uniqueKey && !uniqueBadges.has(uniqueKey)) { // Added check for uniqueKey existence
          uniqueBadges.set(uniqueKey, {
            ...badge,
            _uniqueId: uniqueKey // Use badge_id as unique identifier
          });
        }
      });
      
      const deduped = Array.from(uniqueBadges.values());
      console.log('✅ Deduplicated badges:', deduped.length);
      
      return deduped;
    },
    enabled: !!profileEmail,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  // Fetch ALL Badge Definitions
  const { data: allBadgeDefinitions = [] } = useQuery({
    queryKey: ['allBadgeDefinitions'],
    queryFn: () => base44.entities.BadgeDefinition.list(null, 1000),
    staleTime: 300000 
  });

  const displayBadges = earnedBadges;

  // Display badges directly - no complex merging (UserBadge is source of truth)
  const galleryBadges = React.useMemo(() => {
    return earnedBadges.sort((a, b) => {
      const rarityOrder = { legendary: 3, epic: 2, rare: 1, common: 0 };
      return (rarityOrder[b.rarity?.toLowerCase()] || 0) - (rarityOrder[a.rarity?.toLowerCase()] || 0);
    });
  }, [earnedBadges]);

  // Update badge count only (no complex sync)
  React.useEffect(() => {
    if (!profileUser?.id || !isOwnProfile) return;
    
    const updateCount = async () => {
      if ((profileUser.badges_count || 0) !== earnedBadges.length) {
        await base44.entities.UserProfile.update(profileUser.id, {
          badges_count: earnedBadges.length
        });
      }
    };
    
    updateCount();
  }, [earnedBadges.length, profileUser?.id, isOwnProfile]);

  const { data: walkerProfile } = useQuery({
    queryKey: ['walkerProfile', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return null;
      const walkers = await base44.entities.WalkerProfile.filter({ created_by: profileEmail });
      return walkers[0] || null;
    },
    enabled: !!profileEmail,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ['trainerProfile', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return null;
      const trainers = await base44.entities.TrainerProfile.filter({ created_by: profileEmail });
      return trainers[0] || null;
    },
    enabled: !!profileEmail,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Sync Verification Status
  React.useEffect(() => {
    const syncVerification = async () => {
      // Only owner or admin can update
      const canUpdate = isOwnProfile || (currentUser?.role === 'admin');
      if (!canUpdate || !profileUser?.id) return;

      const authVerified = isOwnProfile && currentUser?.is_verified;
      const walkerVerified = walkerProfile?.verification_status === 'verified';
      const trainerVerified = trainerProfile?.verification_status === 'verified';
      
      const shouldBeVerified = authVerified || walkerVerified || trainerVerified;
      
      // If should be verified but profile says no
      if (shouldBeVerified && !profileUser.is_verified) {
        // console.log("Syncing verification status to true...");
        try {
          await base44.entities.UserProfile.update(profileUser.id, { is_verified: true });
          queryClient.invalidateQueries(['profileUser']);
        } catch(e) { /* Verification sync failed */ }
      }
    };
    
    if (profileUser) {
        syncVerification();
    }
  }, [profileUser, walkerProfile, trainerProfile, isOwnProfile, currentUser, queryClient]);

  const { data: userDogs = [] } = useQuery({
    queryKey: ['userDogs', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      return await base44.entities.DogProfile.filter({ owner_email: profileEmail }, '-created_date', 20);
    },
    enabled: !!profileEmail,
    initialData: [],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: followersCount = 0 } = useQuery({
    queryKey: ['followersCount', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return 0;
      const res = await base44.entities.SocialFollow.filter({ following_email: profileEmail }, '-created_date', 100);
      return res.length;
    },
    enabled: !!profileEmail,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ['followingCount', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return 0;
      const res = await base44.entities.SocialFollow.filter({ follower_email: profileEmail }, '-created_date', 100);
      return res.length;
    },
    enabled: !!profileEmail,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // Badge Selection State
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);

  const updatePinnedBadgesMutation = useMutation({
    mutationFn: async ({ slotIndex, badgeId }) => {
      if (!profileUser?.id) return;
      
      const currentPinned = Array(4).fill(null);
      (profileUser.pinned_badge_ids || []).slice(0, 4).forEach((id, idx) => {
        currentPinned[idx] = id;
      });
      
      const newBadgeId = badgeId;
      for (let i = 0; i < 4; i++) {
        if (i !== slotIndex && currentPinned[i] === newBadgeId) {
          currentPinned[i] = null;
        }
      }
      currentPinned[slotIndex] = newBadgeId;

      await base44.entities.UserProfile.update(profileUser.id, {
        pinned_badge_ids: currentPinned
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileUser'] });
      setIsBadgeModalOpen(false);
      toast.success('Destaques atualizados!');
    },
    onError: () => {
      toast.error('Erro ao atualizar destaques.');
    }
  });

  const handleReorder = async (newOrder) => {
    if (!profileUser?.id) return;
    
    try {
      await base44.entities.UserProfile.update(profileUser.id, {
        pinned_badge_ids: newOrder
      });
      queryClient.invalidateQueries({ queryKey: ['profileUser'] });
      toast.success('Ordem atualizada!');
    } catch (error) {
      toast.error('Erro ao reorganizar emblemas.');
    }
  };

  const handleSlotClick = (index) => {
    if (!isOwnProfile) return;
    setActiveSlotIndex(index);
    setIsBadgeModalOpen(true);
  };

  const handleBadgeSelect = (badgeIdToPin) => {
    if (activeSlotIndex === null) return;
    updatePinnedBadgesMutation.mutate({ slotIndex: activeSlotIndex, badgeId: badgeIdToPin });
  };

  const handleMessageUser = async (targetEmail) => {
    if (!currentUser || !targetEmail) {
      console.error('❌ Dados insuficientes para chat:', { currentUser: currentUser?.email, targetEmail });
      toast.error("Erro: Usuário não autenticado ou perfil inválido.");
      return;
    }

    console.log('📤 Abrindo/criando chat com:', targetEmail);
    
    try {
      // Check existing chat
      const existingChats = await base44.entities.ChatConversation.filter({});
      const myChat = existingChats.find(c => 
        c.participants?.includes(currentUser.email) && 
        c.participants?.includes(targetEmail) &&
        !c.booking_id // Prefer general chat
      );
      
      if (myChat) {
        console.log('✅ Chat existente encontrado:', myChat.id);
        navigate(createPageUrl('Chat') + `?id=${myChat.id}`);
      } else {
        console.log('💬 Criando nova conversa...');
        // Create new chat
        const newChat = await base44.entities.ChatConversation.create({
          participants: [currentUser.email, targetEmail],
          tags: ['general'],
          last_message: 'Nova conversa iniciada.',
          last_message_date: new Date().toISOString(),
          unread_counts: { [currentUser.email]: 0, [targetEmail]: 1 }
        });
        console.log('✅ Chat criado:', newChat.id);
        navigate(createPageUrl('Chat') + `?id=${newChat.id}`);
      }
    } catch (error) {
      console.error("❌ Erro ao abrir conversa:", error);
      const errorMsg = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao abrir chat: ${errorMsg}`);
    }
  };

  const { data: followersList = [] } = useQuery({
    queryKey: ['followersList', profileEmail],
    queryFn: () => base44.entities.SocialFollow.filter({ following_email: profileEmail }, '-created_date', 50),
    enabled: showFollowers && !!profileEmail,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: followingList = [] } = useQuery({
    queryKey: ['followingList', profileEmail],
    queryFn: () => base44.entities.SocialFollow.filter({ follower_email: profileEmail }, '-created_date', 50),
    enabled: showFollowing && !!profileEmail,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
      if (!currentUser?.email || !profileEmail) {
        console.error('❌ Dados insuficientes para seguir:', { currentUser: currentUser?.email, profileEmail });
        throw new Error('Usuário não autenticado ou perfil inválido');
      }

      console.log('📤 Criando follow:', { follower: currentUser.email, following: profileEmail });
      
      // Check for duplicates before creating
      const existing = await base44.entities.SocialFollow.filter({
        follower_email: currentUser.email,
        following_email: profileEmail
      });

      if (existing.length > 0) {
        console.log('⚠️ Follow já existe, ignorando criação duplicada');
        return;
      }

      await base44.entities.SocialFollow.create({
        follower_email: currentUser.email,
        follower_name: currentUser.full_name,
        follower_photo_url: currentUser.profile_photo_url,
        following_email: profileEmail,
        following_name: profileUser.full_name,
        status: 'accepted'
      });

      console.log('✅ Follow criado com sucesso');

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

      // Notify (Assíncrono, não bloqueia)
      createNotification.mutateAsync({
        recipient_email: profileEmail,
        title: "Novo Seguidor!",
        message: `${currentUser.full_name} começou a seguir-te.`,
        type: "social",
        action_url: `/UserProfile?email=${currentUser.email}`
      }).catch(err => console.error("Failed to send notification:", err));
    },
    onSuccess: () => {
      toast.success('Agora você está seguindo!');
    },
    onError: (error) => {
      console.error("❌ Follow mutation error:", error);
      const errorMsg = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao seguir: ${errorMsg}`);
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.email || !profileEmail) {
        console.error('❌ Dados insuficientes para unfollow:', { currentUser: currentUser?.email, profileEmail });
        throw new Error('Usuário não autenticado ou perfil inválido');
      }

      console.log('📤 Removendo follow:', { follower: currentUser.email, following: profileEmail });
      
      const follows = await base44.entities.SocialFollow.filter({
        follower_email: currentUser.email,
        following_email: profileEmail
      });
      
      if (follows[0]) {
        await base44.entities.SocialFollow.delete(follows[0].id);
        console.log('✅ Follow removido');
        
        if (profileUser.id) {
          try {
            await base44.entities.UserProfile.update(profileUser.id, {
              followers_count: Math.max(0, (profileUser.followers_count || 0) - 1)
            });
          } catch(e) { console.error(e); }
        }
      } else {
        console.warn('⚠️ Nenhum follow encontrado para remover');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followersCount'] });
      queryClient.invalidateQueries({ queryKey: ['followingCount'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      toast.success('Deixou de seguir');
    },
    onError: (error) => {
      console.error("❌ Unfollow mutation error:", error);
      const errorMsg = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao deixar de seguir: ${errorMsg}`);
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="glass-panel max-w-md w-full shadow-xl border-0">
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
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        <Button variant="outline" className="mb-6" onClick={() => navigate(createPageUrl('Home'))}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="glass-panel border-0 shadow-xl mb-6 overflow-hidden rounded-2xl md:rounded-3xl">
          <div className="relative w-full aspect-video overflow-hidden bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            {profileUser.cover_photo_url && (
              <img src={profileUser.cover_photo_url} alt="Cover" className="w-full h-full object-cover object-center" loading="lazy" decoding="async" />
            )}
            
            {/* Carimbo Oficial PawCão - Canto Superior Esquerdo */}
            {(walkerProfile?.is_pawcao_employee || trainerProfile?.is_pawcao_employee || profileUser.is_pawcao_employee) && (
              <div className="absolute top-4 left-4 z-20">
                <PawCaoEmployeeStamp />
              </div>
            )}



            {isOwnProfile && (
              <Button
                size="icon"
                variant="outline"
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg z-50 pointer-events-auto w-10 h-10 rounded-full border-2 border-white/50"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(createPageUrl('AccountSettings'));
                }}
                title="Editar Perfil"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
          </div>

          <CardContent className="pt-0 pb-6">
            <div className="flex flex-col md:flex-row w-full">
              
              {/* Avatar Column - Pulled up to overlap cover */}
              <div className="flex flex-col items-center md:items-start -mt-20 md:-mt-24 px-4 md:pl-0 z-10">
                <div className="relative">
                        <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-white shadow-xl ring-4 ring-purple-100 bg-white rounded-xl">
                          <AvatarImage src={profileUser.profile_photo_url} className="aspect-square object-cover object-center rounded-xl" loading="lazy" decoding="async" />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-3xl md:text-4xl rounded-xl">
                            {profileUser.full_name?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Trainer Verified Badge - Top Right Corner */}
                        {trainerProfile?.is_verified_trainer && (
                          <div className="absolute -top-2 -right-2 transform hover:scale-110 transition-transform">
                            <TrainerVerifiedBadge size="md" />
                          </div>
                        )}


                      </div>
              </div>

              {/* Info Column - Starts below cover photo line to prevent overlap */}
              <div className="flex-1 flex flex-col md:flex-row justify-between items-start pt-4 px-4 md:pl-6 md:pr-0 relative">
                
                {/* User Details (Left) */}
                <div className="text-center w-full md:w-auto">
                  <div className="flex items-center gap-2 justify-center">
                   <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">
                     {profileUser.full_name}
                   </h1>

                  {/* Lógica de verificação e Badges */}
                  {(profileUser.is_verified || profileUser.isVerified || (isSelfView && currentUser?.is_verified) || walkerProfile?.verification_status === 'verified' || trainerProfile?.verification_status === 'verified') && (
                    <VerifiedBadge size="md" />
                  )}
                    {(profileUser.role === 'admin' || (isSelfView && currentUser?.role === 'admin')) && (
                      <AdminBadgeGlass />
                    )}
                    {(profileUser.is_adoption_advocate || (isSelfView && currentUser?.is_adoption_advocate) || earnedBadges.some(b => b.badge_id === 'adoption_advocate' || b.id === 'adoption_advocate')) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center relative overflow-hidden shadow-sm border border-pink-400/30 cursor-help"
                              style={{
                                background: 'linear-gradient(135deg, #f472b6 0%, #e11d48 100%)',
                                boxShadow: '0 4px 6px -1px rgba(225, 29, 72, 0.3), 0 2px 4px -1px rgba(225, 29, 72, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.4)'
                              }}
                            >
                              <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-full pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)' }} />
                              <Heart className="w-3.5 h-3.5 text-white drop-shadow-md z-10 fill-white" strokeWidth={2.5} />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Defensor de Adoção</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>


                  
                  {profileUser.bio && (
                    <p className="text-gray-600 mt-2 max-w-lg mx-auto md:mx-0 leading-relaxed">{profileUser.bio}</p>
                  )}
                  
                  {profileUser.city && (
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-2 justify-center md:justify-start">
                      <MapPin className="w-4 h-4" />
                      {profileUser.city}
                    </div>
                  )}

                  {/* Actions Buttons Mobile */}
                  <div className="flex md:hidden flex-wrap gap-2 justify-center mt-4 w-full px-4">
                    {isOwnProfile && (
                      <Button
                        onClick={() => navigate(createPageUrl('AccountSettings'))}
                        className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
                        size="sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Perfil
                      </Button>
                    )}
                    {/* Botões removidos - chat apenas em contexto de reserva */}
                  </div>
                </div>

                {/* Right Column: Badge Showcase & Actions */}
                <div className="flex flex-col items-center md:items-end gap-3 mt-4 md:mt-1 w-full md:w-auto">
                  
                  {/* Badge Showcase - New Component */}
                  <PinnedBadgesDisplay
                    pinnedBadgeIds={profileUser.pinned_badge_ids || []}
                    earnedBadges={earnedBadges}
                    isOwnProfile={isOwnProfile}
                    onSlotClick={handleSlotClick}
                    onReorder={handleReorder}
                  />

                  {/* Desktop Actions */}
                  {/* Botões removidos - chat apenas em contexto de reserva */}
                </div>

              </div>
            </div>

            {/* Pinned Badges Showcase (Removed duplicate as requested) */}

            <div className="flex justify-between items-center py-3 md:py-4 border-t border-b border-gray-200 mt-4 md:mt-6 px-2 md:px-8 gap-2">
              <div className="flex-1 text-center border-r border-gray-100 last:border-0 px-2">
                <div className="text-lg md:text-3xl font-bold text-gray-900">{totalBadges}</div>
                <div className="text-[10px] md:text-sm text-gray-600">Emblemas</div>
              </div>
              <div className="flex-1 text-center border-r border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg py-2 transition-colors px-2" onClick={() => setShowFollowers(true)}>
                <div className="text-lg md:text-3xl font-bold text-gray-900">{followersCount}</div>
                <div className="text-[10px] md:text-sm text-gray-600">Seguidores</div>
              </div>
              <div className="flex-1 text-center cursor-pointer hover:bg-gray-50 rounded-lg py-2 transition-colors px-2" onClick={() => setShowFollowing(true)}>
                <div className="text-lg md:text-3xl font-bold text-gray-900">{followingCount}</div>
                <div className="text-[10px] md:text-sm text-gray-600">Seguindo</div>
              </div>
            </div>

            {/* Barra de Animais do Utilizador */}
            <ProfileAnimalsBar 
              userEmail={profileEmail}
              isOwnProfile={isOwnProfile}
              onAddDog={() => setIsAnimalModalOpen(true)}
            />
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="badges">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg rounded-xl p-1 h-11 md:h-12 mb-4">
            <TabsTrigger value="badges" className="text-xs md:text-sm">
              <Award className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden md:inline">Emblemas</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="text-xs md:text-sm">
              <User className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden md:inline">Sobre</span>
            </TabsTrigger>
            <TabsTrigger value="gamification" className="text-xs md:text-sm">
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden md:inline">XP</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs md:text-sm">
              <BarChart2 className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden md:inline">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="badges">
           <Card className="bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white border-0 shadow-2xl rounded-2xl">
             <CardHeader className="pb-2 border-b border-white/5">
               <div className="flex items-center justify-between flex-wrap gap-2">
                 <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                   <Award className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                   Galeria de Conquistas
                 </CardTitle>
                 <div className="text-[10px] md:text-xs font-mono text-gray-400 bg-white/5 px-2 md:px-3 py-1 rounded-full border border-white/10">
                   {earnedBadges.length} Desbloqueados
                 </div>
               </div>
               <p className="text-xs md:text-sm text-gray-400 mt-1">Colecione todos para se tornar uma lenda!</p>
             </CardHeader>
             <CardContent className="pt-4 md:pt-6">
               {loadingBadges ? (
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-2 gap-y-6">
                   {[...Array(6)].map((_, i) => (
                     <div key={`skeleton-${i}`} className="flex flex-col items-center">
                       <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gray-800/50 animate-pulse" />
                     </div>
                   ))}
                 </div>
               ) : earnedBadges.length > 0 ? (
               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-2 gap-y-4 md:gap-y-6">
                 {earnedBadges.map((badge, index) => (
                   <BadgeItem 
                     key={badge._uniqueId || `badge-${index}`}
                     badge={badge} 
                     idx={index}
                     getBadgeImage={getBadgeImage}
                   />
                 ))}
               </div>
               ) : (
               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-2 gap-y-4 md:gap-y-6">
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
           <Card className="glass-panel border-0 shadow-lg rounded-2xl">
             <CardContent className="pt-4 md:pt-6">
               {profileUser.about_me || profileUser.bio ? (
                 <p className="text-sm md:text-base text-gray-700">{profileUser.about_me || profileUser.bio}</p>
               ) : (
                 <p className="text-sm text-gray-500 text-center italic">Nenhuma informação adicional.</p>
               )}
             </CardContent>
           </Card>
          </TabsContent>

          <TabsContent value="gamification">
           {(() => {
              // UserProfile is single source of truth for XP
              const userXP = profileUser?.gamification_xp || 0;
              const tier = calculateTier(userXP);
             return (
               <Card className={`bg-gradient-to-br ${tier.gradient} text-white border-0 shadow-2xl rounded-2xl`}>
                 <CardHeader className="pb-3 md:pb-4">
                   <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                     <span className="text-3xl">{tier.icon}</span>
                     Nível {tier.level}
                   </CardTitle>
                   <p className="text-white/80 text-base md:text-lg font-semibold">
                     Tier: {tier.name}
                   </p>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4 md:space-y-6">
                     <div>
                       <div className="flex justify-between mb-2 text-xs md:text-sm">
                         <span>XP Atual: {userXP.toLocaleString('pt-PT')}</span>
                         <span>Próximo Nível: {tier.max !== Infinity ? tier.max.toLocaleString('pt-PT') : 'MAX'}</span>
                       </div>
                       <div className="w-full bg-white/20 rounded-full h-2.5 md:h-3">
                         <div 
                           className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2.5 md:h-3 rounded-full transition-all duration-500"
                           style={{ width: `${tier.progress}%` }}
                         />
                       </div>
                       <p className="text-[10px] md:text-xs text-white/70 mt-2">
                         {tier.xpToNextLevel > 0 ? `${tier.xpToNextLevel.toLocaleString('pt-PT')} XP para o nível ${tier.level + 1}` : '🎉 Nível Máximo Atingido!'}
                       </p>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             );
           })()}
          </TabsContent>

          <TabsContent value="activity">
           <Card className="glass-panel border-0 shadow-lg rounded-2xl">
             <CardHeader><CardTitle className="text-lg md:text-xl">Estatísticas</CardTitle></CardHeader>
             <CardContent>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                 <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
                   <div className="text-xl md:text-2xl font-bold text-blue-600">{profileUser.profile_stats?.total_posts || 0}</div>
                   <div className="text-xs md:text-sm text-gray-600">Posts</div>
                 </div>
                 <div className="bg-green-50 p-3 md:p-4 rounded-lg">
                   <div className="text-xl md:text-2xl font-bold text-green-600">{profileUser.profile_stats?.total_bookings || 0}</div>
                   <div className="text-xs md:text-sm text-gray-600">Reservas</div>
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
                <div 
                 key={f.id} 
                 className="p-2 border-b cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors"
                 onClick={() => {
                   setShowFollowers(false);
                   navigate(createPageUrl(`UserProfile?email=${f.follower_email}`));
                 }}
                >
                 <Avatar className="w-8 h-8 border border-gray-200">
                   <AvatarImage src={f.follower_photo_url} loading="lazy" decoding="async" />
                   <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                     {f.follower_name?.charAt(0).toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
                  <span className="font-medium text-sm text-gray-700 flex-1 truncate">{f.follower_name}</span>

                </div>
              ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
          <DialogContent>
            <DialogHeader><DialogTitle>Seguindo</DialogTitle></DialogHeader>
            <ScrollArea className="h-[300px]">
              {followingList.map(f => (
                <div 
                 key={f.id} 
                 className="p-2 border-b cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors"
                 onClick={() => {
                   setShowFollowing(false);
                   navigate(createPageUrl(`UserProfile?email=${f.following_email}`));
                 }}
                >
                 <Avatar className="w-8 h-8 border border-gray-200">
                   <AvatarImage src={f.following_photo_url} loading="lazy" decoding="async" />
                   <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                     {f.following_name?.charAt(0).toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
                  <span className="font-medium text-sm text-gray-700 flex-1 truncate">{f.following_name}</span>

                </div>
              ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Badge Selection Modal */}
        <BadgeSelectionModal
          isOpen={isBadgeModalOpen}
          onClose={() => setIsBadgeModalOpen(false)}
          earnedBadges={earnedBadges}
          onSelectBadge={handleBadgeSelect}
          currentlyPinnedIds={profileUser?.pinned_badge_ids || []}
          maxSlots={4}
          currentSlotIndex={activeSlotIndex}
        />

        {/* Animal Manager Modal */}
        <AnimalManagerModal
          isOpen={isAnimalModalOpen}
          onClose={() => setIsAnimalModalOpen(false)}
          userEmail={profileEmail}
        />
      </div>
    </div>
  );
}