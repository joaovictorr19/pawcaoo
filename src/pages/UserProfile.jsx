import { useState, useEffect, useLayoutEffect, useRef, Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ProfileBentoGrid from "@/components/profile/ProfileBentoGrid";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import ProfileManagementSection from "@/components/profile/ProfileManagementSection";
import ProfessionalProfileSEO from "@/components/profile/ProfessionalProfileSEO";
import GroupWalkEventsSection from "@/components/groupwalk/GroupWalkEventsSection";

const BadgeSelectionModal = lazy(() => import("@/components/gamification/BadgeSelectionModal"));
const AnimalManagerModal = lazy(() => import("../components/profile/AnimalManagerModal"));
const ProfessionalBookingModal = lazy(() => import("../components/professional/ProfessionalBookingModal"));
const HotelBookingModal = lazy(() => import("@/components/hotel/HotelBookingModal"));

export default function UserProfile({ fixedEmail, fixedId, fixedType }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  useLayoutEffect(() => {
    const el = document.scrollingElement || document.documentElement;
    if (el) el.scrollTop = 0;
    window.scrollTo(0, 0);
    if (document.body) document.body.scrollTop = 0;
  }, [location.key]);

  const urlParams = new URLSearchParams(window.location.search);
  const rawEmail = fixedEmail || urlParams.get('email') || location.state?.email;
  let profileEmailParam = rawEmail;
  if (rawEmail) {
    try {
      profileEmailParam = decodeURIComponent(rawEmail);
      if (profileEmailParam.includes('%40')) {
        profileEmailParam = decodeURIComponent(profileEmailParam);
      }
    } catch (e) {}
  }

  const profileIdParam = fixedId || urlParams.get('id');
  const profileUsernameParam = urlParams.get('username');



  const { data: currentUser, isLoading: authLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const targetId = profileIdParam;
  const targetUsername = profileUsernameParam;
  const targetEmail = !targetId && !targetUsername ? profileEmailParam : null;

  const isSelfView = (!targetId && !targetEmail && !targetUsername) ||
    (currentUser && targetId === currentUser.id) ||
    (currentUser && targetEmail === currentUser.email) ||
    (currentUser && targetUsername === currentUser.username);

  useEffect(() => {
    if (isSelfView && !currentUser && !authLoading) {
      base44.auth.redirectToLogin();
    }
  }, [isSelfView, currentUser, authLoading]);

  const { data: profileUser, isPending: loadingUser } = useQuery({
    queryKey: ['profileUser', targetId, targetEmail, targetUsername, isSelfView, currentUser?.id],
    queryFn: async () => {
      let userProfile = null;

      if (targetUsername) {
        try {
          const r = await base44.entities.UserProfile.filter({ username: targetUsername });
          if (r?.length > 0) userProfile = r[0];
        } catch (e) {}
      }

      if (isSelfView && currentUser?.email && !userProfile) {
        try {
          const r = await base44.entities.UserProfile.filter({ user_email: currentUser.email });
          if (r?.length > 0) userProfile = r[0];
        } catch (e) {}
      }

      if (!userProfile && targetId) {
        try {
          // Buscar UserProfile por id ou user_id em paralelo com WalkerProfile.get(id)
          const [r1, r2, wm] = await Promise.allSettled([
            base44.entities.UserProfile.filter({ id: targetId }),
            base44.entities.UserProfile.filter({ user_id: targetId }),
            base44.entities.WalkerProfile.get(targetId),
          ]);

          if (r1.status === 'fulfilled' && r1.value?.length > 0) {
            userProfile = r1.value[0];
          } else if (r2.status === 'fulfilled' && r2.value?.length > 0) {
            userProfile = r2.value[0];
          } else if (wm.status === 'fulfilled' && wm.value?.id) {
            const w = wm.value;
            userProfile = { id: w.id, user_id: w.user_id || targetId, user_email: w.created_by, full_name: w.walker_name, profile_photo_url: w.photo_url, bio: w.bio, city: w.location, role: w.professional_type || 'walker', is_verified: w.verification_status === 'verified', is_virtual_profile: true };
          }

          // Tentar TrainerProfile.get se ainda não encontramos
          if (!userProfile) {
            try {
              const tp = await base44.entities.TrainerProfile.get(targetId);
              if (tp?.id) {
                userProfile = { id: tp.id, user_id: tp.user_id || targetId, user_email: tp.created_by, full_name: tp.trainer_name, profile_photo_url: tp.photo_url, bio: tp.bio, city: tp.location, role: 'trainer', is_verified: tp.verification_status === 'verified', is_virtual_profile: true };
              }
            } catch (e) {}
          }

          if (!userProfile && currentUser?.role === 'admin') {
            try {
              const su = await base44.entities.User.filter({ id: targetId });
              if (su?.length > 0) userProfile = { ...su[0], user_email: su[0].email, user_id: su[0].id, full_name: su[0].full_name || su[0].email.split('@')[0], is_virtual_profile: true };
            } catch (e) {}
          }
        } catch (e) {}
      }

      if (!userProfile) {
        const emailToSearch = targetEmail || (isSelfView ? currentUser?.email : null);
        if (emailToSearch) {
          try {
            // Paralelizar buscas por email em vez de sequenciais
            const [r, rw] = await Promise.allSettled([
              base44.entities.UserProfile.filter({ user_email: emailToSearch }),
              base44.entities.WalkerProfile.filter({ created_by: emailToSearch }),
            ]);

            if (r.status === 'fulfilled' && r.value?.length > 0) {
              userProfile = r.value[0];
            } else if (rw.status === 'fulfilled' && rw.value?.length > 0) {
              const w = rw.value[0];
              userProfile = { id: w.id, user_id: null, user_email: w.created_by, full_name: w.walker_name, profile_photo_url: w.photo_url, bio: w.bio, city: w.location, role: 'walker', is_verified: w.verification_status === 'verified', is_virtual_profile: true };
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });

  const profileEmail = profileUser?.user_email || profileUser?.email;
  const isOwnProfile = currentUser?.id === profileUser?.user_id || currentUser?.email === profileEmail;
  const trackedProfileViewRef = useRef(null);

  const { data: earnedBadges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['userBadges', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const badgesFromTable = await base44.entities.UserBadge.filter({ user_email: profileEmail }, '-earned_date');
      const uniqueBadges = new Map();
      badgesFromTable.forEach((badge) => {
        const uniqueKey = badge.badge_definition_id || badge.badge_id || badge.id;
        if (uniqueKey && !uniqueBadges.has(uniqueKey)) {
          uniqueBadges.set(uniqueKey, { ...badge, _uniqueId: uniqueKey });
        }
      });
      return Array.from(uniqueBadges.values());
    },
    enabled: !!profileEmail,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false
  });

  const { data: walkerProfile, isLoading: loadingWalker } = useQuery({
    queryKey: ['walkerProfile', profileEmail, fixedType],
    queryFn: async () => {
      if (!profileEmail) return null;
      const walkers = await base44.entities.WalkerProfile.filter({ created_by: profileEmail });
      if (!walkers?.length) return null;
      // Se sabemos o tipo (hotel/trainer), priorizar esse perfil
      if (fixedType === 'hotel') {
        return walkers.find(w => w.professional_type === 'hotel') || walkers[0];
      }
      return walkers[0];
    },
    enabled: !!profileEmail,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const { data: trainerProfile, isLoading: loadingTrainer } = useQuery({
    queryKey: ['trainerProfile', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return null;
      const trainers = await base44.entities.TrainerProfile.filter({ created_by: profileEmail });
      return trainers[0] || null;
    },
    enabled: !!profileEmail,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Track professional profile views by service (analytics)
  useEffect(() => {
    const profile = walkerProfile || trainerProfile;
    if (!profile || !profileEmail) return;
    if (trackedProfileViewRef.current === profileEmail) return;
    trackedProfileViewRef.current = profileEmail;

    const isHotel = walkerProfile?.professional_type === "hotel";
    const proType = walkerProfile?.professional_type || (trainerProfile ? "trainer" : "walker");

    const services = [
      ...(walkerProfile?.services_offered || []),
      ...(walkerProfile?.hotel_details?.services || []),
      ...(trainerProfile?.services_offered || []),
    ];
    const serviceNames = services.map(s => s.service_name).filter(Boolean).slice(0, 10);

    try {
      base44.analytics.track({
        eventName: "professional_profile_viewed",
        properties: {
          professional_type: proType,
          professional_email: profileEmail,
          professional_name: walkerProfile?.walker_name || trainerProfile?.trainer_name || "",
          city: walkerProfile?.location || trainerProfile?.location || "",
          country: walkerProfile?.country_of_operation || trainerProfile?.country_of_operation || "",
          is_hotel: isHotel,
          services: serviceNames.join(", "),
          is_own_profile: isOwnProfile,
        },
      });
    } catch (e) {}
  }, [walkerProfile, trainerProfile, profileEmail, isOwnProfile]);

  const { data: daysOff = [] } = useQuery({
    queryKey: ['walkerDaysOff', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const avail = await base44.entities.CalendarAvailability.filter({ professional_email: profileEmail });
      const today = new Date().toISOString().split('T')[0];
      return avail
        .filter(a => a.is_day_off && (a.date?.split('T')[0] || '') >= today)
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    },
    enabled: !!profileEmail && !!(walkerProfile || trainerProfile),
    staleTime: 5 * 60 * 1000,
  });

  const displayPhotoUrl = profileUser?.profile_photo_url || walkerProfile?.photo_url || trainerProfile?.photo_url;
  const displayCoverUrl = profileUser?.cover_photo_url || walkerProfile?.cover_photo_url || trainerProfile?.cover_photo_url;
  const emailBase = (profileEmail || walkerProfile?.created_by || trainerProfile?.created_by || '');
  const emailPart = (emailBase.split('@')[0] || '').replace(/[._-]+/g, ' ').trim();
  const derivedName = emailPart ? emailPart.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : null;
  const displayName = walkerProfile?.hotel_details?.hotel_name || profileUser?.full_name || walkerProfile?.walker_name || trainerProfile?.trainer_name || derivedName || "Utilizador";
  const displayCity = profileUser?.city || walkerProfile?.location || trainerProfile?.location || "";

  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  const [bookingModal, setBookingModal] = useState({ isOpen: false, selectedDate: null, selectedService: null });
  const [hotelBookingModal, setHotelBookingModal] = useState({ isOpen: false, selectedService: null });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['professionalReviews', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const wId = walkerProfile?.id;
      const tId = trainerProfile?.id;
      if (!wId && !tId) return [];
      let allReviews = [];
      if (wId) allReviews = [...allReviews, ...await base44.entities.Review.filter({ walker_id: wId }, '-created_date', 50)];
      if (tId) allReviews = [...allReviews, ...await base44.entities.Review.filter({ trainer_id: tId }, '-created_date', 50)];
      return allReviews;
    },
    enabled: !!profileEmail && (!!walkerProfile || !!trainerProfile),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

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

  useEffect(() => {
    if (!loadingUser && profileUser) {
      const el = document.scrollingElement || document.documentElement;
      if (el) el.scrollTop = 0;
      window.scrollTo(0, 0);
      if (document.body) document.body.scrollTop = 0;
    }
  }, [loadingUser, profileUser?.id]);

  if (loadingUser) {
    return <ProfileSkeleton />;
  }

  // Quando sabemos o tipo de profissional (hotel/walker/trainer), aguardar
  // o perfil profissional carregar para evitar flash do nome pessoal do utilizador
  const waitingForProProfile =
    !!fixedType &&
    !!profileUser &&
    ((fixedType === 'trainer' && loadingTrainer) ||
     (fixedType !== 'trainer' && loadingWalker));
  if (waitingForProProfile) {
    return <ProfileSkeleton />;
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-12 text-center">
          <User className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isSelfView && !currentUser ? (language === 'pt' ? 'Faça Login' : language === 'es' ? 'Inicia sesión' : language === 'fr' ? 'Connectez-vous' : 'Log in') : (language === 'pt' ? 'Perfil Não Encontrado' : language === 'es' ? 'Perfil No Encontrado' : language === 'fr' ? 'Profil Introuvable' : 'Profile Not Found')}
          </h2>
          <p className="text-gray-600 mb-6">
            {isSelfView && !currentUser ? (language === 'pt' ? 'Para visualizar o seu perfil, entre na sua conta.' : language === 'es' ? 'Para ver tu perfil, inicia sesión en tu cuenta.' : language === 'fr' ? 'Pour voir votre profil, connectez-vous à votre compte.' : 'To view your profile, log in to your account.') : (language === 'pt' ? 'Este perfil não está disponível.' : language === 'es' ? 'Este perfil no está disponible.' : language === 'fr' ? 'Ce profil n’est pas disponible.' : 'This profile is not available.')}
          </p>
          {!currentUser ? (
            <Button onClick={() => base44.auth.redirectToLogin(window.location.origin)} className="w-full bg-green-600 hover:bg-green-700">{language === 'pt' ? 'Entrar' : language === 'es' ? 'Entrar' : language === 'fr' ? 'Entrer' : 'Log in'}</Button>
          ) : (
            <Button onClick={() => window.location.href = '/'} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t('back', language)}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
    {(walkerProfile || trainerProfile) && (
      <ProfessionalProfileSEO
        profileUser={profileUser}
        walkerProfile={walkerProfile}
        trainerProfile={trainerProfile}
        displayName={displayName}
        displayCity={displayCity}
        language={language}
      />
    )}
    <ProfileBentoGrid
      profileUser={profileUser}
      walkerProfile={walkerProfile}
      trainerProfile={trainerProfile}
      currentUser={currentUser}
      earnedBadges={earnedBadges}
      loadingBadges={loadingBadges}
      reviews={reviews}
      loadingReviews={loadingReviews}
      daysOff={daysOff}
      displayPhotoUrl={displayPhotoUrl}
      displayCoverUrl={displayCoverUrl}
      displayName={displayName}
      displayCity={displayCity}
      isOwnProfile={isOwnProfile}
      isHotel={walkerProfile?.professional_type === 'hotel'}
      onBack={() => navigate('/')}
      onServiceClick={(service) => setBookingModal({ isOpen: true, selectedDate: null, selectedService: service })}
      onHotelBookingClick={(service) => setHotelBookingModal({ isOpen: true, selectedService: service, selectedDate: null })}
      onHotelDateSelect={(checkin, checkout) => {
        const firstService = walkerProfile?.hotel_details?.services?.find(s => s.is_active !== false);
        setHotelBookingModal({ isOpen: true, selectedService: firstService || null, selectedDate: checkin || null, selectedCheckout: checkout || null });
      }}
      onBan={() => banUserMutation.mutate(profileUser.id)}
      onToggleVerify={() => toggleVerificationMutation.mutate(profileUser.id)}
      profileEmail={profileEmail}
    />

      <div className="max-w-4xl mx-auto px-4 pb-8">
        <ProfileManagementSection
          walkerProfile={walkerProfile}
          trainerProfile={trainerProfile}
          currentUser={currentUser}
          isOwnProfile={isOwnProfile}
          profileEmail={profileEmail}
        />
      </div>

      {profileEmail && (walkerProfile || trainerProfile) && walkerProfile?.professional_type !== 'hotel' && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <GroupWalkEventsSection professionalEmail={profileEmail} currentUser={currentUser} />
        </div>
      )}

      {isBadgeModalOpen && (
        <Suspense fallback={null}>
          <BadgeSelectionModal
            isOpen={true}
            onClose={() => setIsBadgeModalOpen(false)}
            earnedBadges={earnedBadges}
            onSelectBadge={(badgeId) => {
              if (activeSlotIndex !== null) updatePinnedBadgesMutation.mutate({ slotIndex: activeSlotIndex, badgeId });
            }}
            currentlyPinnedIds={profileUser?.pinned_badge_ids || []}
            maxSlots={4}
            currentSlotIndex={activeSlotIndex}
          />
        </Suspense>
      )}
      {isAnimalModalOpen && (
        <Suspense fallback={null}>
          <AnimalManagerModal
            isOpen={true}
            onClose={() => setIsAnimalModalOpen(false)}
            userEmail={profileEmail}
          />
        </Suspense>
      )}
      {bookingModal.isOpen && (
        <Suspense fallback={null}>
          <ProfessionalBookingModal
            isOpen={true}
            onClose={() => setBookingModal({ isOpen: false, selectedDate: null, selectedService: null })}
            walkerProfile={walkerProfile || trainerProfile}
            selectedDate={bookingModal.selectedDate}
            selectedService={bookingModal.selectedService}
            currentUser={currentUser}
          />
        </Suspense>
      )}
      {hotelBookingModal.isOpen && (
        <Suspense fallback={null}>
          <HotelBookingModal
            isOpen={true}
            onClose={() => setHotelBookingModal({ isOpen: false, selectedService: null, selectedDate: null, selectedCheckout: null })}
            hotel={walkerProfile?.professional_type === 'hotel' ? walkerProfile : null}
            selectedService={hotelBookingModal.selectedService}
            initialDate={hotelBookingModal.selectedDate}
            initialCheckout={hotelBookingModal.selectedCheckout}
            currentUser={currentUser}
          />
        </Suspense>
      )}
    </>
  );
}