import React, { useState, useMemo } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, ArrowLeft, Dog, CheckCircle, Shield, User,
  MessageCircle, Award, Star, Calendar, Zap
} from "lucide-react";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import ReviewCard from "../components/reviews/ReviewCard";
import { useLanguage } from "@/components/LanguageContext";
import BadgeSelectionModal from "@/components/gamification/BadgeSelectionModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useCreateNotification } from "@/components/NotificationService";
import { calculateTier } from "@/components/gamification/tierSystem";
import AnimalManagerModal from "../components/profile/AnimalManagerModal";
import { calculateCompatibilityScore } from "@/utils/recommendationEngine";
import ServiceCard from "../components/profile/ServiceCard";
import ProfileActions from "../components/profile/ProfileActions";

export default function UserProfile() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

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

  React.useEffect(() => {
    if (isSelfView && !currentUser && !authLoading) {
      base44.auth.redirectToLogin();
    }
  }, [isSelfView, currentUser, authLoading]);

  const { data: profileUser, isLoading: loadingUser } = useQuery({
    queryKey: ['profileUser', targetId, targetEmail, targetName, targetUsername, isSelfView, currentUser?.id],
    queryFn: async () => {
      let userProfile = null;

      if (targetUsername) {
        try {
          const r = await base44.entities.UserProfile.filter({ username: targetUsername });
          if (r?.length > 0) userProfile = r[0];
        } catch (e) {}
      }

      if (isSelfView && currentUser?.email) {
        try {
          const r = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
          if (r?.length > 0) userProfile = r[0];
        } catch (e) {}
      }

      if (!userProfile && targetId) {
        try {
          const r1 = await base44.entities.UserProfile.filter({ id: targetId });
          if (r1?.length > 0) userProfile = r1[0];

          if (!userProfile) {
            const r2 = await base44.entities.UserProfile.filter({ user_id: targetId });
            if (r2?.length > 0) userProfile = r2[0];
          }

          if (!userProfile) {
            let wm = await base44.entities.WalkerProfile.filter({ id: targetId });
            if (!wm?.length) {
              try { wm = await base44.entities.WalkerProfile.filter({ user_id: targetId }); } catch (e) {}
            }
            if (wm?.length > 0) {
              const w = wm[0];
              userProfile = { id: w.id, user_id: w.user_id || targetId, user_email: w.created_by, full_name: w.walker_name, profile_photo_url: w.photo_url, bio: w.bio, city: w.location, role: 'walker', is_verified: w.verification_status === 'verified', is_virtual_profile: true };
            }
          }

          if (!userProfile && currentUser?.role === 'admin') {
            try {
              const su = await base44.entities.User.filter({ id: targetId });
              if (su?.length > 0) userProfile = { ...su[0], user_email: su[0].email, user_id: su[0].id, full_name: su[0].full_name || su[0].email.split('@')[0], is_virtual_profile: true };
            } catch (e) {}
          }
        } catch (e) {}
      }

      if (!userProfile && targetName) {
        try {
          const r = await base44.entities.UserProfile.filter({ full_name: targetName });
          if (r?.length > 0) userProfile = r[0];
          if (!userProfile) {
            const rw = await base44.entities.WalkerProfile.filter({ walker_name: targetName });
            if (rw?.length > 0) {
              const w = rw[0];
              userProfile = { id: w.id, user_email: w.created_by, full_name: w.walker_name, profile_photo_url: w.photo_url, bio: w.bio, city: w.location, role: 'walker', is_verified: w.verification_status === 'verified', is_virtual_profile: true };
            }
          }
        } catch (e) {}
      }

      if (!userProfile) {
        const emailToSearch = targetEmail || (isSelfView ? currentUser?.email : null);
        if (emailToSearch) {
          try {
            const r = await base44.entities.UserProfile.filter({ user_email: emailToSearch });
            if (r?.length > 0) userProfile = r[0];

            if (!userProfile) {
              const rw = await base44.entities.WalkerProfile.filter({ created_by: emailToSearch });
              if (rw?.length > 0) {
                const w = rw[0];
                userProfile = { id: w.id, user_id: null, user_email: w.created_by, full_name: w.walker_name, profile_photo_url: w.photo_url, bio: w.bio, city: w.location, role: 'walker', is_verified: w.verification_status === 'verified', is_virtual_profile: true };
              }
            }

            if (!userProfile && currentUser?.role === 'admin') {
              try {
                const su = await base44.entities.User.filter({ email: emailToSearch });
                if (su?.length > 0) userProfile = { ...su[0], user_email: su[0].email, user_id: su[0].id, is_virtual_profile: true };
              } catch (e) {}
            }
          } catch (e) {}
        }
      }

      if (isSelfView && currentUser && !userProfile) {
        try {
          userProfile = await base44.entities.UserProfile.create({
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
          });
        } catch (error) {
          userProfile = { ...currentUser, user_email: currentUser.email, user_id: currentUser.id };
        }
      }

      return userProfile;
    },
    enabled: !!targetId || !!targetEmail || (isSelfView && !!currentUser),
    retry: false,
  });

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
          uniqueBadges.set(uniqueKey, { ...badge, _uniqueId: uniqueKey });
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

  React.useEffect(() => {
    if (!profileUser?.id || profileUser.is_virtual_profile || !isOwnProfile) return;
    const updateCount = async () => {
      try {
        if ((profileUser.badges_count || 0) !== earnedBadges.length) {
          await base44.entities.UserProfile.update(profileUser.id, { badges_count: earnedBadges.length });
        }
      } catch (e) {}
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
  const displayCity = profileUser?.city || walkerProfile?.location || trainerProfile?.location || "";

  const [selectedService, setSelectedService] = useState(serviceParam);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleBookingClick = (service) => {
    setSelectedService(service.service_name);
    toast.info(`Serviço "${service.service_name}" selecionado.`);
  };

  const handleTabChange = () => {
    setSelectedService(null);
  };

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['professionalReviews', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const wId = walkerProfile?.id;
      const tId = trainerProfile?.id;
      if (!wId && !tId) return [];
      let allReviews = [];
      if (wId) allReviews = [...allReviews, ...await base44.entities.Review.filter({ walker_id: wId }, '-created_date')];
      if (tId) allReviews = [...allReviews, ...await base44.entities.Review.filter({ trainer_id: tId }, '-created_date')];
      return allReviews;
    },
    enabled: !!profileEmail && (!!walkerProfile || !!trainerProfile),
  });

  React.useEffect(() => {
    if (!profileUser?.id || profileUser.is_virtual_profile) return;
    const canUpdate = isOwnProfile || currentUser?.role === 'admin';
    if (!canUpdate) return;
    const syncV = async () => {
      const shouldBeVerified = (isOwnProfile && currentUser?.is_verified) || walkerProfile?.verification_status === 'verified' || trainerProfile?.verification_status === 'verified';
      if (shouldBeVerified && !profileUser.is_verified) {
        try {
          await base44.entities.UserProfile.update(profileUser.id, { is_verified: true });
          queryClient.invalidateQueries(['profileUser']);
        } catch (e) {}
      }
    };
    syncV();
  }, [profileUser, walkerProfile, trainerProfile, isOwnProfile, currentUser, queryClient]);

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
    return calculateCompatibilityScore(pro, { myDogs, favorites: myFavorites, pastBookings: myPastBookings, userEmail: currentUser.email });
  }, [walkerProfile, trainerProfile, myDogs, myFavorites, myPastBookings, currentUser, isOwnProfile]);

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

  const updatePinnedBadgesMutation = useMutation({
    mutationFn: async ({ slotIndex, badgeId }) => {
      if (!profileUser?.id || profileUser.is_virtual_profile) throw new Error("Virtual profile");
      const currentPinned = Array(4).fill(null);
      (profileUser.pinned_badge_ids || []).slice(0, 4).forEach((id, idx) => { currentPinned[idx] = id; });
      for (let i = 0; i < 4; i++) {
        if (i !== slotIndex && currentPinned[i] === badgeId) currentPinned[i] = null;
      }
      currentPinned[slotIndex] = badgeId;
      await base44.entities.UserProfile.update(profileUser.id, { pinned_badge_ids: currentPinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileUser'] });
      setIsBadgeModalOpen(false);
      toast.success('Destaques atualizados!');
    },
    onError: () => toast.error('Erro ao atualizar destaques.')
  });

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

  const getBadgeImage = (badgeId) => {
    const m = { welcome: '🎉', first_post: '✍️', social_butterfly: '🦋', community_helper: '🤝', verified: '✓', adoption_advocate: '💖', event_organizer: '🎪', top_contributor: '⭐' };
    return m[badgeId] || '🏆';
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 text-center">
          <User className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isSelfView && !currentUser ? "Faça Login" : "Perfil Não Encontrado"}
          </h2>
          <p className="text-gray-600 mb-6">
            {isSelfView && !currentUser ? "Para visualizar o seu perfil, entre na sua conta." : "Este perfil não está disponível."}
          </p>
          {!currentUser ? (
            <Button onClick={() => base44.auth.redirectToLogin(window.location.origin)} className="w-full bg-green-600 hover:bg-green-700">Entrar</Button>
          ) : (
            <Button onClick={() => window.location.href = '/'} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* CAPA */}
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

      {/* CONTEÚDO */}
      <div className="relative -mt-20 px-6">
        {/* AVATAR + NOME */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-white shadow-2xl rounded-[2.5rem]">
              <AvatarImage src={displayPhotoUrl} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-black">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {(walkerProfile || trainerProfile) && (
              <div className={`absolute -bottom-1 -right-1 px-3 py-1 rounded-full border-2 border-white shadow-lg flex items-center gap-1.5 transition-all ${walkerProfile?.is_online ? 'bg-green-500' : 'bg-slate-300'}`}>
                <div className={`w-2 h-2 rounded-full bg-white ${walkerProfile?.is_online ? 'animate-ping' : ''}`} />
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">
                  {walkerProfile?.is_online ? 'Disponível' : 'Offline'}
                </span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 mt-6 text-center">{displayName}</h1>
          {displayCity && <p className="text-slate-500 flex items-center gap-1 mt-2"><MapPin size={14} /> {displayCity}</p>}
        </div>

        {/* TABS */}
        <Tabs defaultValue={serviceParam ? "pawgo" : "badges"} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-3 bg-white/50 backdrop-blur-md rounded-2xl p-1 shadow-sm w-full mb-6">
            <TabsTrigger value="badges" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Conquistas</TabsTrigger>
            <TabsTrigger value="pawgo" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Serviços</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Feedback</TabsTrigger>
          </TabsList>

          {/* CONQUISTAS */}
          <TabsContent value="badges" className="space-y-6 pb-6">
            {/* --- SEÇÃO 1: EMBLEMAS REAIS (Hospedados no Admin) --- */}
            <div className="mt-4 px-0">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic">Conquistas Reais</h3>
              {loadingBadges ? (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {[1, 2, 3].map(i => <div key={i} className="w-20 h-20 bg-slate-200 rounded-2xl flex-shrink-0 animate-pulse" />)}
                </div>
              ) : earnedBadges.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {earnedBadges.map((badge) => (
                    <div key={badge._uniqueId} className="flex flex-col items-center min-w-[80px]">
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-lg border-2 border-slate-50 flex items-center justify-center overflow-hidden">
                        {(badge.image_png_file || badge.image_url) ? (
                          <img 
                            src={badge.image_png_file || badge.image_url} 
                            alt={badge.name}
                            className="w-12 h-12 object-contain"
                          />
                        ) : (
                          <div className="text-2xl">{getBadgeImage(badge.badge_id)}</div>
                        )}
                      </div>
                      <p className="text-[9px] font-black uppercase mt-2 text-slate-900 text-center leading-tight">
                        {badge.name || badge.badge_id}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-300 font-bold italic">Sem emblemas atribuídos ainda.</p>
              )}
            </div>
          </TabsContent>

          {/* SERVIÇOS */}
          <TabsContent value="pawgo" className="space-y-4 pb-6">
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
                    isOnline={walkerProfile?.is_online}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                <p className="text-slate-500 text-sm">Sem serviços disponíveis</p>
              </div>
            )}
          </TabsContent>

          {/* AVALIAÇÕES */}
          <TabsContent value="reviews" className="space-y-4">
            {loadingReviews ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse" />)}
              </div>
            ) : reviews.length > 0 ? (
              reviews.slice(0, 3).map(r => <ReviewCard key={r.id} review={r} />)
            ) : (
              <div className="text-center py-12">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                <p className="text-slate-500 text-sm">Sem avaliações</p>
              </div>
            )}
          </TabsContent>
          </Tabs>

          {/* --- SEÇÃO 2: AGENDA E SERVIÇOS --- */}
          {(walkerProfile || trainerProfile) && (
          <div className="mt-10 space-y-8 pb-32">

            {/* LISTA DE SERVIÇOS */}
            <div>
              <h3 className="text-sm font-black uppercase italic mb-4 text-slate-900">Serviços Disponíveis</h3>
              <div className="space-y-3">
                {(walkerProfile?.services_offered || trainerProfile?.services_offered || []).map((service, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 flex justify-between items-center">
                    <div>
                      <h4 className="font-black text-xs uppercase text-slate-900">{service.service_name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{service.duration || 60} min</p>
                    </div>
                    <span className="text-orange-500 font-black italic text-lg">{service.price}€</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CALENDÁRIO */}
            <div className="bg-slate-900 rounded-[3rem] p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/10 p-2 rounded-xl text-white">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-white font-black uppercase italic text-xs">Agenda & Folgas</h4>
                  <p className="text-[9px] text-white/40 font-bold uppercase">Reserva para o futuro</p>
                </div>
              </div>
              <div className="bg-white rounded-[2rem] p-4">
                <AvailabilityCalendar 
                  availability={walkerProfile?.availability || trainerProfile?.availability}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setShowBookingModal(true);
                  }}
                />
              </div>
            </div>
          </div>
          )}
          </div>

      {/* PROFILE ACTIONS SECTION */}
      {!isOwnProfile && (walkerProfile || trainerProfile) && (
        <div className="mx-6 mb-32">
          <ProfileActions 
            walker={walkerProfile || trainerProfile}
            currentUser={currentUser}
          />
        </div>
      )}

      {/* ADMIN */}
      {currentUser?.role === 'admin' && (
        <div className="bg-red-600 text-white p-2 text-xs font-bold flex justify-center gap-4 z-40 relative shadow-md">
          <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> ADMIN</span>
          <button onClick={() => banUserMutation.mutate(profileUser.id)} className="underline hover:text-red-200">Banir</button>
          <button onClick={() => toggleVerificationMutation.mutate(profileUser.id)} className="underline hover:text-red-200">
            {profileUser.is_verified ? 'Remover' : 'Verificar'}
          </button>
        </div>
      )}

      {/* MODALS */}
      <BadgeSelectionModal
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
        earnedBadges={earnedBadges}
        onSelectBadge={(badgeId) => {
          if (activeSlotIndex !== null) updatePinnedBadgesMutation.mutate({ slotIndex: activeSlotIndex, badgeId });
        }}
        currentlyPinnedIds={profileUser?.pinned_badge_ids || []}
        maxSlots={4}
        currentSlotIndex={activeSlotIndex}
      />
      <AnimalManagerModal
        isOpen={isAnimalModalOpen}
        onClose={() => setIsAnimalModalOpen(false)}
        userEmail={profileEmail}
      />
    </div>
  );
}