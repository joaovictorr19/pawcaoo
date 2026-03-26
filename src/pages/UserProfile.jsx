import React, { useState, useEffect, useMemo } from "react";
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
  CheckCircle, Shield, ShieldCheck, Users, User, Plus, MessageCircle, BarChart2, Sparkles, Star
} from "lucide-react";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import BookingForm from "../components/booking/BookingForm";
import ReviewCard from "../components/reviews/ReviewCard";
import { pt } from "date-fns/locale";
import { t } from "@/components/translations";
import { useLanguage } from "@/components/LanguageContext";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import AdminBadgeGlass from "@/components/ui/AdminBadgeGlass";
import TrainerVerifiedBadge from "@/components/ui/TrainerVerifiedBadge";
import PawCaoEmployeeStamp from "@/components/ui/PawCaoEmployeeStamp";
import BadgeSelectionModal from "@/components/gamification/BadgeSelectionModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCreateNotification } from "@/components/NotificationService";
import { calculateTier, getLevelFromXP, getXPForLevel } from "@/components/gamification/tierSystem";
import ProfileAnimalsBar from "../components/profile/ProfileAnimalsBar";
import AnimalManagerModal from "../components/profile/AnimalManagerModal";
import PinnedBadgesDisplay from "../components/profile/PinnedBadgesDisplay";
import { EditableAvatar } from "@/components/ui/EditableAvatar";
import { calculateCompatibilityScore } from "@/utils/recommendationEngine";
import { ProfessionalHeader } from "@/components/professionals/ProfessionalHeader";
import ServiceCard from "../components/profile/ServiceCard";

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

  const urlParams = new URLSearchParams(window.location.search);
  const rawEmail = urlParams.get('email');
  let profileEmailParam = rawEmail;
  if (rawEmail) {
    try {
      profileEmailParam = decodeURIComponent(rawEmail);
      if (profileEmailParam.includes('%40')) {
        profileEmailParam = decodeURIComponent(profileEmailParam);
      }
    } catch (e) {}
  }
  
  const profileIdParam = urlParams.get('id');
  const profileNameParam = urlParams.get('name');
  const profileUsernameParam = urlParams.get('username');
  const serviceParam = urlParams.get('service');

  useEffect(() => {
    if (serviceParam) {
      setActiveTab("pawgo");
    }
  }, [serviceParam]);

  const createNotification = useCreateNotification();

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

      if (targetUsername) {
        try {
          const byUsername = await base44.entities.UserProfile.filter({ username: targetUsername });
          if (byUsername && byUsername.length > 0) {
            userProfile = byUsername[0];
          }
        } catch (e) {}
      }

      if (isSelfView) {
        if (currentUser?.email) {
          try {
            const byEmail = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
            if (byEmail && byEmail.length > 0) {
              userProfile = byEmail[0];
            }
          } catch (e) {}
        }
      }

      if (!userProfile && targetId) {
        try {
          const byEntityId = await base44.entities.UserProfile.filter({ id: targetId });
          if (byEntityId && byEntityId.length > 0) userProfile = byEntityId[0];

          if (!userProfile) {
            const byUserId = await base44.entities.UserProfile.filter({ user_id: targetId });
            if (byUserId && byUserId.length > 0) userProfile = byUserId[0];
          }

          if (!userProfile) {
             let walkerMatch = await base44.entities.WalkerProfile.filter({ id: targetId });

             if (!walkerMatch || walkerMatch.length === 0) {
                try {
                  walkerMatch = await base44.entities.WalkerProfile.filter({ user_id: targetId });
                } catch (e) {}
             }

             if (walkerMatch && walkerMatch.length > 0) {
               const w = walkerMatch[0];
               userProfile = {
                  id: w.id, 
                  user_id: w.user_id || targetId,
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

          if (!userProfile && currentUser?.role === 'admin') {
             try {
                const sysUsers = await base44.entities.User.filter({ id: targetId });
                if (sysUsers && sysUsers.length > 0) {
                  const sysUser = sysUsers[0];
                  userProfile = {
                     ...sysUser,
                     user_email: sysUser.email,
                     user_id: sysUser.id,
                     full_name: sysUser.full_name || sysUser.email.split('@')[0],
                     is_virtual_profile: true
                  };
                }
             } catch (err) {}
          }

        } catch (e) {}
      }

      if (!userProfile && targetName) {
        try {
           const byName = await base44.entities.UserProfile.filter({ full_name: targetName });
           if (byName && byName.length > 0) userProfile = byName[0];

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
        } catch (e) {}
      }

      if (!userProfile) {
        const emailToSearch = targetEmail || (isSelfView ? currentUser?.email : null);

        if (emailToSearch) {
          try {
            const byEmail = await base44.entities.UserProfile.filter({ user_email: emailToSearch });
            if (byEmail && byEmail.length > 0) {
              userProfile = byEmail[0];
            } 

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
               } catch(err) {}
            }

          } catch (e) {}
        }
      }

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
            is_verified: false
          };
          userProfile = await base44.entities.UserProfile.create(payload);
        } catch (error) {
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

    React.useEffect(() => {
      if (isSelfView && !currentUser && !loadingUser && !authLoading) {
        base44.auth.redirectToLogin();
      }
    }, [isSelfView, currentUser, loadingUser, authLoading]);

  const profileEmail = profileUser?.user_email || profileUser?.email;
  const isOwnProfile = currentUser?.id === profileUser?.user_id || currentUser?.email === profileEmail;

  const { data: earnedBadges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['userBadges', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const badgesFromTable = await base44.entities.UserBadge.filter({ user_email: profileEmail }, '-earned_date');
      const uniqueBadges = new Map();
      badgesFromTable.forEach((badge) => {
        const uniqueKey = badge.badge_id;
        if (uniqueKey && !uniqueBadges.has(uniqueKey)) {
          uniqueBadges.set(uniqueKey, {
            ...badge,
            _uniqueId: uniqueKey
          });
        }
      });
      return Array.from(uniqueBadges.values());
    },
    enabled: !!profileEmail,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  const { data: allBadgeDefinitions = [] } = useQuery({
    queryKey: ['allBadgeDefinitions'],
    queryFn: () => base44.entities.BadgeDefinition.list(null, 1000),
    staleTime: 300000 
  });

  const displayBadges = earnedBadges;

  const galleryBadges = React.useMemo(() => {
    return earnedBadges.sort((a, b) => {
      const rarityOrder = { legendary: 3, epic: 2, rare: 1, common: 0 };
      return (rarityOrder[b.rarity?.toLowerCase()] || 0) - (rarityOrder[a.rarity?.toLowerCase()] || 0);
    });
  }, [earnedBadges]);

  React.useEffect(() => {
    if (!profileUser?.id || profileUser.is_virtual_profile || !isOwnProfile) return;
    const updateCount = async () => {
      try {
        if ((profileUser.badges_count || 0) !== earnedBadges.length) {
          await base44.entities.UserProfile.update(profileUser.id, {
            badges_count: earnedBadges.length
          });
        }
      } catch (e) {
        console.error("Failed to update badge count", e);
      }
    };
    updateCount();
  }, [earnedBadges.length, profileUser?.id, profileUser?.is_virtual_profile, isOwnProfile]);

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

  const displayPhotoUrl = profileUser?.profile_photo_url || walkerProfile?.photo_url || trainerProfile?.photo_url;
  const displayCoverUrl = profileUser?.cover_photo_url || walkerProfile?.cover_photo_url || trainerProfile?.cover_photo_url;
  const displayName = profileUser?.full_name || walkerProfile?.walker_name || trainerProfile?.trainer_name || "Utilizador";
  const displayBio = profileUser?.bio || walkerProfile?.bio || trainerProfile?.bio || "";
  const displayCity = profileUser?.city || walkerProfile?.location || trainerProfile?.location || "";

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedService, setSelectedService] = useState(serviceParam);

  const handleBookingClick = (service) => {
    setSelectedService(service.service_name);
    const calendarEl = document.getElementById('calendar-section');
    if (calendarEl) {
      calendarEl.scrollIntoView({ behavior: 'smooth' });
    }
    toast.info(`Serviço "${service.service_name}" selecionado.`);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (!currentUser) {
      toast.error('Faça login para agendar');
    }
  };

  const handleBookingInitiated = async (booking) => {
    setSelectedDate(null);
    try {
      createNotification.mutate({
        recipient_email: profileEmail,
        title: 'Nova Solicitação de Agendamento',
        message: `${currentUser.full_name} solicitou um agendamento.`,
        type: 'booking',
        related_id: booking.id,
        priority: 'high'
      });
    } catch (e) {}
    toast.success("Solicitação Enviada!");
    queryClient.invalidateQueries({ queryKey: ['walkerBookings'] });
  };

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['professionalReviews', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const wId = walkerProfile?.id;
      const tId = trainerProfile?.id;
      if (!wId && !tId) return [];
      let allReviews = [];
      if (wId) {
         allReviews = [...allReviews, ...await base44.entities.Review.filter({ walker_id: wId }, '-created_date')];
      }
      if (tId) {
         allReviews = [...allReviews, ...await base44.entities.Review.filter({ trainer_id: tId }, '-created_date')];
      }
      return allReviews;
    },
    enabled: !!profileEmail && (!!walkerProfile || !!trainerProfile),
  });

  const { data: availability = [] } = useQuery({
    queryKey: ['professionalAvailability', profileEmail],
    queryFn: () => base44.entities.CalendarAvailability.filter({
      professional_email: profileEmail
    }),
    enabled: !!profileEmail && (!!walkerProfile || !!trainerProfile),
  });

  const { data: walkerBookings = [] } = useQuery({
    queryKey: ['walkerBookings', profileEmail],
    queryFn: async () => {
       const wId = walkerProfile?.id;
       if (!wId) return [];
       return await base44.entities.Booking.filter({ walker_id: wId });
    },
    enabled: !!walkerProfile?.id,
  });

  React.useEffect(() => {
    const syncVerification = async () => {
      const canUpdate = isOwnProfile || (currentUser?.role === 'admin');
      if (!canUpdate || !profileUser?.id) return;

      const authVerified = isOwnProfile && currentUser?.is_verified;
      const walkerVerified = walkerProfile?.verification_status === 'verified';
      const trainerVerified = trainerProfile?.verification_status === 'verified';
      
      const shouldBeVerified = authVerified || walkerVerified || trainerVerified;
      
      if (shouldBeVerified && !profileUser.is_verified && !profileUser.is_virtual_profile) {
        try {
          await base44.entities.UserProfile.update(profileUser.id, { is_verified: true });
          queryClient.invalidateQueries(['profileUser']);
        } catch(e) {}
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

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.DogProfile.filter({ owner_email: currentUser.email });
    },
    enabled: !!currentUser?.email && !isOwnProfile,
    initialData: [],
  });

  const { data: myFavorites = [] } = useQuery({
    queryKey: ['myFavorites', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Favorite.filter({ created_by: currentUser.email });
    },
    enabled: !!currentUser?.email && !isOwnProfile,
    initialData: [],
  });

  const { data: myPastBookings = [] } = useQuery({
    queryKey: ['myPastBookings', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Booking.filter({ created_by: currentUser.email });
    },
    enabled: !!currentUser?.email && !isOwnProfile,
    initialData: [],
  });

  const matchScore = useMemo(() => {
    if (isOwnProfile || !currentUser) return null;
    const pro = walkerProfile || trainerProfile;
    if (!pro) return null;
    return calculateCompatibilityScore(pro, {
      myDogs,
      favorites: myFavorites,
      pastBookings: myPastBookings,
      userEmail: currentUser.email
    });
  }, [walkerProfile, trainerProfile, myDogs, myFavorites, myPastBookings, currentUser, isOwnProfile]);

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
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);

  const updatePinnedBadgesMutation = useMutation({
    mutationFn: async ({ slotIndex, badgeId }) => {
      if (!profileUser?.id || profileUser.is_virtual_profile) throw new Error("Virtual profile");
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
    if (!profileUser?.id || profileUser.is_virtual_profile) return;
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
      toast.error("Erro: Usuário não autenticado.");
      return;
    }
    try {
      const existingChats = await base44.entities.ChatConversation.filter({});
      const myChat = existingChats.find(c => 
        c.participants?.includes(currentUser.email) && 
        c.participants?.includes(targetEmail) &&
        !c.booking_id
      );
      
      if (myChat) {
        navigate(createPageUrl('Chat') + `?id=${myChat.id}`);
      } else {
        const newChat = await base44.entities.ChatConversation.create({
          participants: [currentUser.email, targetEmail],
          tags: ['general'],
          last_message: 'Nova conversa iniciada.',
          last_message_date: new Date().toISOString(),
          unread_counts: { [currentUser.email]: 0, [targetEmail]: 1 }
        });
        navigate(createPageUrl('Chat') + `?id=${newChat.id}`);
      }
    } catch (error) {
      toast.error(`Erro ao abrir chat: ${error?.message}`);
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
        throw new Error('Usuário não autenticado');
      }
      const existing = await base44.entities.SocialFollow.filter({
        follower_email: currentUser.email,
        following_email: profileEmail
      });
      if (existing.length > 0) return;
      await base44.entities.SocialFollow.create({
        follower_email: currentUser.email,
        follower_name: currentUser.full_name,
        follower_photo_url: currentUser.profile_photo_url,
        following_email: profileEmail,
        following_name: profileUser.full_name,
        status: 'accepted'
      });
      queryClient.invalidateQueries({ queryKey: ['followersCount'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      if (profileUser.id && !profileUser.is_virtual_profile) {
        try {
          await base44.entities.UserProfile.update(profileUser.id, {
            followers_count: (profileUser.followers_count || 0) + 1
          });
        } catch (e) {}
      }
    },
    onSuccess: () => {
      toast.success('Agora você está seguindo!');
    },
    onError: (error) => {
      toast.error(`Erro ao seguir: ${error?.message}`);
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser?.email || !profileEmail) {
        throw new Error('Usuário não autenticado');
      }
      const follows = await base44.entities.SocialFollow.filter({
        follower_email: currentUser.email,
        following_email: profileEmail
      });
      if (follows[0]) {
        await base44.entities.SocialFollow.delete(follows[0].id);
        if (profileUser.id && !profileUser.is_virtual_profile) {
          try {
            await base44.entities.UserProfile.update(profileUser.id, {
              followers_count: Math.max(0, (profileUser.followers_count || 0) - 1)
            });
          } catch(e) {}
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followersCount'] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing'] });
      toast.success('Deixou de seguir');
    },
    onError: (error) => {
      toast.error(`Erro: ${error?.message}`);
    }
  });

  const updateProfileMediaMutation = useMutation({
    mutationFn: async ({ type, url }) => {
      if (!profileUser?.id) throw new Error("No profile found");
      const updateData = {};
      if (type === 'avatar') {
        updateData.profile_photo_url = url;
        if (isOwnProfile) await base44.auth.updateMe({ profile_photo_url: url });
      } else if (type === 'cover') {
        updateData.cover_photo_url = url;
        if (isOwnProfile) await base44.auth.updateMe({ cover_photo_url: url });
      }
      if (!profileUser.is_virtual_profile) {
        return await base44.entities.UserProfile.update(profileUser.id, updateData);
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileUser'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success("Imagem atualizada!");
    },
    onError: () => toast.error("Falha ao sincronizar imagem.")
  });

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Enviando capa...");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: reader.result });
          updateProfileMediaMutation.mutate({ type: 'cover', url: file_url });
          toast.success("Upload concluído!", { id: toastId });
        } catch (err) {
          toast.error("Erro no upload", { id: toastId });
        }
      }
    } catch (e) {
      toast.error("Erro ao processar imagem", { id: toastId });
    }
  };

  const banUserMutation = useMutation({
    mutationFn: async (id) => {
      if (profileUser.is_virtual_profile) throw new Error("Cannot modify virtual profile");
      return await base44.entities.UserProfile.update(id, { role: 'banned', is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileUser'] });
      toast.success("Usuário banido.");
    }
  });

  const toggleVerificationMutation = useMutation({
    mutationFn: async (id) => {
      if (profileUser.is_virtual_profile) throw new Error("Cannot modify virtual profile");
      return await base44.entities.UserProfile.update(id, { is_verified: !profileUser.is_verified });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileUser'] });
      toast.success("Status atualizado.");
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
                : "O perfil que você está procurando não está disponível."}
            </p>
            {!currentUser ? (
              <Button onClick={() => base44.auth.redirectToLogin(window.location.origin)} className="w-full bg-green-600 hover:bg-green-700">
                Entrar
              </Button>
            ) : (
              <Button onClick={() => window.location.href = '/'} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* HEADER COM CAPA */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <img 
          src={displayCoverUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop"} 
          className="w-full h-full object-cover" 
          alt="Capa"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-black/20" />
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all">
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="relative -mt-20 px-6">
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-white shadow-2xl rounded-[2.5rem]">
              <AvatarImage src={displayPhotoUrl} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-black">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {profileUser?.is_verified && (
              <div className="absolute -bottom-2 -right-2 bg-blue-500 p-1.5 rounded-full border-4 border-white">
                <CheckCircle size={16} className="text-white" />
              </div>
            )}
          </div>
          <h1 className="mt-4 text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{displayName}</h1>
          {displayCity && (
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
              <MapPin size={12} /> {displayCity}
            </div>
          )}
        </div>

        {/* TABS */}
        <Tabs defaultValue={serviceParam ? "pawgo" : "badges"} className="mt-8">
          <TabsList className="grid grid-cols-3 bg-white/50 backdrop-blur-md rounded-2xl p-1 shadow-sm w-full mb-6">
            <TabsTrigger value="badges" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Conquistas</TabsTrigger>
            <TabsTrigger value="pawgo" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Serviços</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Feedback</TabsTrigger>
          </TabsList>

          {/* SERVIÇOS */}
          <TabsContent value="pawgo" className="space-y-4">
            {(walkerProfile || trainerProfile) ? (
              <div className="space-y-4 animate-in fade-in">
                {(walkerProfile?.services_offered || trainerProfile?.services_offered || []).slice(0, 3).map((service, idx) => (
                  <ServiceCard
                    key={idx}
                    title={service.service_name}
                    price={service.price}
                    desc={service.description || "Serviço profissional"}
                    promo={`€${service.price}/hora`}
                    icon={<Dog className="w-6 h-6 text-orange-500" />}
                    onClick={() => handleBookingClick(service)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12"><p className="text-slate-500">Sem serviços</p></div>
            )}
          </TabsContent>

          {/* CONQUISTAS */}
          <TabsContent value="badges">
            {earnedBadges.length > 0 ? (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {earnedBadges.slice(0, 12).map((badge, idx) => (
                  <motion.div key={badge._uniqueId} initial={{opacity: 0, scale: 0.5}} animate={{opacity: 1, scale: 1}} transition={{delay: idx * 0.05}} className="text-center">
                    <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-2xl shadow-lg">
                      {badge.image_url ? <img src={badge.image_url} alt="" className="w-full h-full object-contain p-2" /> : getBadgeImage(badge.badge_id)}
                    </div>
                    <p className="text-[8px] font-bold mt-1 text-slate-600 line-clamp-2">{badge.name}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12"><p className="text-slate-500">Sem conquistas</p></div>
            )}
          </TabsContent>

          {/* AVALIAÇÕES */}
          <TabsContent value="reviews" className="space-y-4">
            {reviews.length > 0 ? reviews.slice(0, 3).map(r => <ReviewCard key={r.id} review={r} />) : <div className="text-center py-12"><p className="text-slate-500">Sem avaliações</p></div>}
          </TabsContent>
        </Tabs>
      </div>

      {/* BOTÕES FIXOS */}
      {!isOwnProfile && (walkerProfile || trainerProfile) && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 flex gap-3">
          <Button onClick={() => handleMessageUser(profileEmail)} className="flex-1 h-14 bg-slate-100 text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200">
            <MessageCircle className="mr-2" size={18} /> Chat
          </Button>
          <Button onClick={() => navigate(createPageUrl('Dashboard'))} className="flex-[2] h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-500/20">
            Reservar Agora
          </Button>
        </div>
      )}

      {/* Admin */}
      {currentUser?.role === 'admin' && (
        <div className="bg-red-600 text-white p-2 text-xs font-bold flex justify-center gap-4 z-40 relative shadow-md">
          <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> ADMIN</span>
          <button onClick={() => banUserMutation.mutate(profileUser.id)} className="underline hover:text-red-200">Banir</button>
          <button onClick={() => toggleVerificationMutation.mutate(profileUser.id)} className="underline hover:text-red-200">{profileUser.is_verified ? 'Remover' : 'Verificar'}</button>
        </div>
      )}

      {/* Modals */}
      <BadgeSelectionModal isOpen={isBadgeModalOpen} onClose={() => setIsBadgeModalOpen(false)} earnedBadges={earnedBadges} onSelectBadge={handleBadgeSelect} currentlyPinnedIds={profileUser?.pinned_badge_ids || []} maxSlots={4} currentSlotIndex={activeSlotIndex} />
      <AnimalManagerModal isOpen={isAnimalModalOpen} onClose={() => setIsAnimalModalOpen(false)} userEmail={profileEmail} />
    </div>
  );
}