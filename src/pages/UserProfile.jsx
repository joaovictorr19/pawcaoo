import { useState, useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, ArrowLeft, Shield, User, Star, Calendar, Moon } from "lucide-react";
import ReviewCard from "../components/reviews/ReviewCard";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import BadgeSelectionModal from "@/components/gamification/BadgeSelectionModal";
import BadgeItem from "@/components/gamification/BadgeItem";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AnimalManagerModal from "../components/profile/AnimalManagerModal";
import ProfileActions from "../components/profile/ProfileActions";
import ProfessionalBookingModal from "../components/professional/ProfessionalBookingModal";

export default function UserProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  useLayoutEffect(() => {
    const resetProfileScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetProfileScroll();
    const timeoutId = window.setTimeout(resetProfileScroll, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.key, location.pathname, location.search]);

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
  const profileUsernameParam = urlParams.get('username');

  // Ensure page always opens at top when target profile changes
  useEffect(() => {
    const resetProfileScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetProfileScroll();
    const timeoutId = window.setTimeout(resetProfileScroll, 200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [profileIdParam, profileEmailParam, profileUsernameParam, location.key]);

  const { data: currentUser, isLoading: authLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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

  const { data: profileUser, isLoading: loadingUser } = useQuery({
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
        const uniqueKey = badge.badge_definition_id || badge.badge_id || badge.id;
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
    refetchInterval: false,
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
    refetchInterval: false,
  });

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
  const displayName = profileUser?.full_name || walkerProfile?.walker_name || trainerProfile?.trainer_name || derivedName || "Utilizador";
  const displayCity = profileUser?.city || walkerProfile?.location || trainerProfile?.location || "";

  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  const [isAnimalModalOpen, setIsAnimalModalOpen] = useState(false);
  const [bookingModal, setBookingModal] = useState({ isOpen: false, selectedDate: null, selectedService: null });

  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['professionalReviews', profileEmail],
    queryFn: async () => {
      if (!profileEmail) return [];
      const wId = walkerProfile?.id;
      const tId = trainerProfile?.id;
      if (!wId && !tId) return [];
      let allReviews = [];
      if (wId) allReviews = [...allReviews, ...await base44.entities.Review.filter({ walker_id: wId }, '-created_date', 10)];
      if (tId) allReviews = [...allReviews, ...await base44.entities.Review.filter({ trainer_id: tId }, '-created_date', 10)];
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
    <div id="profile-page" className="min-h-screen bg-slate-50 pb-32 pt-2">
      <div id="profile-top" className="relative h-64 md:h-80 w-full overflow-hidden">
        <img
          src={displayCoverUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop"}
          className="w-full h-full object-cover"
          alt="Capa"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=400&fit=crop";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-black/20" />
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all">
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="relative -mt-20 px-6">
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {/* Anel colorido: roxo para hotel, âmbar para PawCão, branco padrão */}
            <Avatar className={`w-32 h-32 shadow-2xl rounded-[2.5rem] border-4 ${
              walkerProfile?.professional_type === 'hotel'
                ? 'border-purple-400 ring-4 ring-purple-300/50'
                : (walkerProfile?.has_pawcao_seal || walkerProfile?.is_pawcao_employee)
                  ? 'border-amber-400 ring-4 ring-amber-300/50'
                  : 'border-white'
            }`}>
              <AvatarImage
                src={displayPhotoUrl}
                className="object-cover w-full h-full"
                style={{ objectFit: 'cover' }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=256&h=256&fit=crop';
                }}
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-black">
                {displayName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {(walkerProfile || trainerProfile) && (
              <div className={`absolute -bottom-1 -right-1 px-3 py-1 rounded-full border-2 border-white shadow-lg flex items-center gap-1.5 transition-all ${(walkerProfile?.is_online || trainerProfile?.is_online) ? 'bg-green-500' : 'bg-slate-300'}`}>
                <div className={`w-2 h-2 rounded-full bg-white ${(walkerProfile?.is_online || trainerProfile?.is_online) ? 'animate-ping' : ''}`} />
                <span className="text-[8px] font-black text-white uppercase tracking-tighter">
                  {(walkerProfile?.is_online || trainerProfile?.is_online) ? t('available', language) : t('offline', language)}
                </span>
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-slate-900 mt-6 text-center">{displayName}</h1>
          {displayCity && <p className="text-slate-500 flex items-center gap-1 mt-2"><MapPin size={14} /> {displayCity}</p>}
        </div>

        <div className="space-y-8 pb-6">
          {(walkerProfile?.bio || trainerProfile?.bio || profileUser?.bio) && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest italic">{t('aboutMe', language)}</h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                {walkerProfile?.bio || trainerProfile?.bio || profileUser?.bio}
              </p>
            </div>
          )}

          {(walkerProfile?.portfolio?.length > 0) && (
            <div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic">{language === 'pt' ? 'Portefólio' : language === 'es' ? 'Portafolio' : language === 'fr' ? 'Portfolio' : 'Portfolio'}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl">
                {walkerProfile.portfolio.filter(p => p.media_url).slice(0, 4).map((item, idx) => (
                  <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100">
                    <img
                      src={item.media_url}
                      alt={item.title || 'foto'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1558944351-c3ad969c1a63?w=600&h=600&fit=crop';
                      }}
                    />
                    {item.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-[10px] font-bold truncate">{item.title}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic">Conquistas ({earnedBadges.length})</h3>
            {loadingBadges ? (
              <div className="flex gap-3 overflow-x-auto pb-4">
                {[1, 2, 3].map(i => <div key={i} className="w-20 h-20 bg-slate-200 rounded-2xl flex-shrink-0 animate-pulse" />)}
              </div>
            ) : earnedBadges.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-4">
                {earnedBadges.map((badge) => (
                  <div key={badge._uniqueId} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-20 bg-slate-50 rounded-2xl p-2 border border-slate-100">
                    <BadgeItem badge={badge} isOwner={isOwnProfile} isEarned={true} size="md" />
                    <p className="text-[10px] font-bold text-slate-700 text-center leading-tight w-full">
                      {badge.name || badge.badge_id}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-300 font-bold italic">{language === 'pt' ? 'Sem emblemas atribuídos ainda.' : language === 'es' ? 'Aún no hay insignias asignadas.' : language === 'fr' ? 'Aucun badge attribué pour le moment.' : 'No badges assigned yet.'}</p>
            )}
          </div>

          {(walkerProfile || trainerProfile) && (
            <div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic">{language === 'pt' ? 'Folgas Agendadas' : language === 'es' ? 'Días Libres Programados' : language === 'fr' ? 'Jours de repos planifiés' : 'Scheduled Days Off'}</h3>
              {daysOff.length === 0 ? (
                <p className="text-[12px] text-slate-500">{language === 'pt' ? 'Sem folgas futuras.' : language === 'es' ? 'No hay días libres futuros.' : language === 'fr' ? 'Aucun jour de repos à venir.' : 'No upcoming days off.'}</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {daysOff.slice(0, 6).map((d) => (
                    <div key={d.id} className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5">
                      <Moon className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs font-semibold text-slate-700">
                        {new Date(d.date).toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(walkerProfile || trainerProfile) && (walkerProfile?.services_offered || trainerProfile?.services_offered || []).length > 0 && (
            <div>
              <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest italic">{language === 'pt' ? 'Serviços Oferecidos' : language === 'es' ? 'Servicios Ofrecidos' : language === 'fr' ? 'Services proposés' : 'Services Offered'}</h3>
              <div className="space-y-3">
                {(walkerProfile?.services_offered || trainerProfile?.services_offered || []).map((service, idx) => (
                  <div
                    key={idx}
                    onClick={() => !isOwnProfile && setBookingModal({ isOpen: true, selectedDate: null, selectedService: service })}
                    className={`w-full bg-white border-2 rounded-2xl overflow-hidden transition-all ${
                      !isOwnProfile ? 'border-slate-200 hover:border-blue-400 hover:shadow-md active:scale-[0.98] cursor-pointer' : 'border-slate-200'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-black text-sm text-slate-900">{service.service_name}</h4>
                          {service.description && <p className="text-xs text-slate-500 mt-1">{service.description}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-black text-blue-600">{service.price}€</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isOwnProfile && (walkerProfile || trainerProfile) && (
            <div className="mb-6">
              <ProfileActions 
                walker={walkerProfile || trainerProfile}
                currentUser={currentUser}
              />
            </div>
          )}

          {(walkerProfile || trainerProfile) && (
            <div>
              <h3 className="text-sm font-black uppercase italic mb-4 text-slate-900 tracking-widest">{language === 'pt' ? 'Feedback' : language === 'es' ? 'Opiniones' : language === 'fr' ? 'Avis' : 'Feedback'}</h3>
              {loadingReviews ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse" />)}
                </div>
              ) : reviews.length > 0 ? (
                reviews.slice(0, 3).map(r => <ReviewCard key={r.id} review={r} />)
              ) : (
                <div className="text-center py-8">
                  <Star className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                  <p className="text-slate-500 text-sm">{language === 'pt' ? 'Sem avaliações' : language === 'es' ? 'Sin reseñas' : language === 'fr' ? 'Sans avis' : 'No reviews'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {currentUser?.role === 'admin' && (
        <div className="bg-red-600 text-white p-2 text-xs font-bold flex justify-center gap-4 z-40 relative shadow-md">
          <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> ADMIN</span>
          <button onClick={() => banUserMutation.mutate(profileUser.id)} className="underline hover:text-red-200">Banir</button>
          <button onClick={() => toggleVerificationMutation.mutate(profileUser.id)} className="underline hover:text-red-200">
            {profileUser.is_verified ? 'Remover' : 'Verificar'}
          </button>
        </div>
      )}

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
      <ProfessionalBookingModal
        isOpen={bookingModal.isOpen}
        onClose={() => setBookingModal({ isOpen: false, selectedDate: null, selectedService: null })}
        walkerProfile={walkerProfile || trainerProfile}
        selectedDate={bookingModal.selectedDate}
        selectedService={bookingModal.selectedService}
        currentUser={currentUser}
      />
    </div>
  );
}