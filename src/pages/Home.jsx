import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Heart, Users, Award, Calendar, ShieldCheck, Wallet, AlertCircle, RefreshCw, PawPrint, Bone, Hotel } from "lucide-react";
const ProfessionalCard = React.lazy(() => import("../components/marketplace/ProfessionalCard").then(m => ({ default: m.ProfessionalCard })));
const AdvancedWalkerFilters = React.lazy(() => import("../components/search/AdvancedWalkerFilters"));
const AdvancedTrainerFilters = React.lazy(() => import("../components/search/AdvancedTrainerFilters"));

const TestimonialsSection = React.lazy(() => import("../components/home/TestimonialsSection"));
import UnauthenticatedHero from "../components/home/UnauthenticatedHero";
import { ProfessionalCardSkeleton } from "../components/marketplace/ProfessionalCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { calculateTier } from "@/components/gamification/tierSystem";
import { calculateCompatibilityScore } from "@/utils/recommendationEngine";

import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeContext";
import { Trophy, ArrowRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";



export default function Home() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(window.location.search);
  const dogSittingServiceFilter = urlParams.get('dogSittingService');
  const professionalTypeFilter = urlParams.get('professional_type');
  
  const [searchLocation, setSearchLocation] = useState("");
  const [filterSize, setFilterSize] = useState("all");
  const [filterTime, setFilterTime] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterDogSitting, setFilterDogSitting] = useState(dogSittingServiceFilter || "all");
  const [filterAnimalType, setFilterAnimalType] = useState("all");
  const [filterProfessionalType, setFilterProfessionalType] = useState(professionalTypeFilter || "all");
  
  const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    radius: 50,
    languages: [],
    specializations: [],
    breeds: [],
    certifications: [], 
    serviceTypes: [],   
    timeSlots: [],      
    availableDate: null, 
    minExperience: 0,
    minRating: 0,
    minPrice: 0,
    maxPrice: 100,
    backgroundCheck: false,
    verifiedOnly: false, 
    instantBooking: false 
  });

  const [trainerFilters, setTrainerFilters] = useState({
    specialties: [],
    specializations: [],
    methodologies: [],
    consultationTypes: [],
    minExperience: 0,
    minRating: 0,
    verifiedOnly: false,
    availableDate: null
  });

  const urlTabParam = new URLSearchParams(window.location.search).get('tab');
  const [activeTab, setActiveTab] = useState(urlTabParam || "professionals");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    retry: false,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs', user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
    initialData: [],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['myFavorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ created_by: user?.email }),
    enabled: !!user?.email,
    initialData: [],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const userPets = myDogs;

  const toggleOnlineMutation = useMutation({
    mutationFn: async (checked) => {
      await base44.auth.updateMe({
        preferences: { ...user?.preferences, current_mode: checked ? 'professional' : 'owner' },
        pawgo_status: {
          ...(user?.pawgo_status || {}),
          is_online: checked,
          last_active: new Date().toISOString()
        }
      });

      if (currentUserProfile?.id) {
        await base44.entities.UserProfile.update(currentUserProfile.id, {
          profile_stats: {
            ...(currentUserProfile?.profile_stats || {}),
            is_online: checked,
            last_active: new Date().toISOString()
          }
        });
      }

      if (professionalProfile) {
        const entity = professionalProfile.walker_name ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
        await entity.update(professionalProfile.id, { is_online: checked });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['currentUserProfileXP']);
      queryClient.invalidateQueries(['profileUser']);
      queryClient.invalidateQueries(['walkerProfile']);
      queryClient.invalidateQueries(['trainerProfile']);
      queryClient.invalidateQueries(['allWalkers']);
      queryClient.invalidateQueries(['allTrainers']);
      queryClient.invalidateQueries(['myProfessionalProfile']);
      toast.success('Estado online atualizado.');
    },
    onError: () => {
      toast.error('Erro ao atualizar estado online.');
    }
  });

  const { data: activeBookings = [] } = useQuery({
    queryKey: ['activeBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const res = await base44.entities.Booking.filter({
          created_by: user.email,
          status: { '$in': ['confirmed', 'in_progress', 'completed'] }
        }, '-walk_date', 10);
        return Array.isArray(res) ? res : [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: pendingBookings = [] } = useQuery({
    queryKey: ['pendingBookingsCount', user?.email],
    queryFn: async () => {
      if (!user?.email || !['walker', 'trainer', 'both'].includes(user?.account_type)) return [];
      try {
        const res = await base44.entities.Booking.filter({
          $or: [
            { walker_email: user.email, status: 'pending' },
            { trainer_email: user.email, status: 'pending' }
          ]
        }, '-created_date', 20);
        return Array.isArray(res) ? res : [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!user?.email && ['walker', 'trainer', 'both'].includes(user?.account_type),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const pendingBookingsCount = pendingBookings.length;

  const priorityData = React.useMemo(() => {
      const live = activeBookings.find(b => b.status === 'in_progress');
      if (live) return { type: 'live', booking: live };

      const reviewPending = activeBookings.find(b => b.status === 'completed' && !b.review_id);
      if (reviewPending) return { type: 'review', booking: reviewPending };

      const upcoming = activeBookings
          .filter(b => b.status === 'confirmed')
          .sort((a, b) => new Date(a.walk_date + 'T' + a.walk_time) - new Date(b.walk_date + 'T' + b.walk_time))
          .find(b => new Date(b.walk_date) >= new Date().setHours(0,0,0,0));
      
      if (upcoming) return { type: 'next', booking: upcoming };

      return null;
  }, [activeBookings]);

  const { data: currentUserProfile } = useQuery({
    queryKey: ['currentUserProfileXP', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: professionalProfile } = useQuery({
    queryKey: ['myProfessionalProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      let profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email }, '-created_date');
      // Contas com perfil profissional E hotel/loja: usar o perfil profissional
      // (o hotel tem o seu próprio dashboard — HotelDashboard)
      const professionalOnly = profiles.filter(p => !['hotel', 'shop'].includes(p.professional_type));
      if (professionalOnly.length > 0) return professionalOnly[0];
      if (profiles.length === 0) {
        profiles = await base44.entities.TrainerProfile.filter({ created_by: user.email }, '-created_date');
      }
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const hasProfessionalProfile = !!professionalProfile;
  const isProfileOnline = !!(user?.pawgo_status?.is_online || professionalProfile?.is_online);

  const currentXP = currentUserProfile?.gamification_xp || 0;
  const [displayedXP, setDisplayedXP] = useState(currentXP);
  
  useEffect(() => {
    if (!currentXP) {
      setDisplayedXP(0);
      return;
    }
    const dur = 1500;
    const startTime = performance.now();
    let rafId;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / dur, 1);
      setDisplayedXP(Math.floor(progress * currentXP));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setDisplayedXP(currentXP);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [currentXP]);

  const { data: earnedBadgesData = [] } = useQuery({
    queryKey: ['userBadges', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const badgesFromTable = await base44.entities.UserBadge.filter({ user_email: user.email }, '-earned_date');
      const uniqueBadges = new Map();
      badgesFromTable.forEach((badge) => {
        const uniqueKey = badge.badge_definition_id || badge.badge_id || badge.id;
        if (uniqueKey && !uniqueBadges.has(uniqueKey)) {
          uniqueBadges.set(uniqueKey, { ...badge, _uniqueId: uniqueKey });
        }
      });
      return Array.from(uniqueBadges.values());
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  const { data: walkers = [], isLoading: loadingWalkers, refetch: refetchWalkers, isFetching: isFetchingWalkers } = useQuery({
    queryKey: ['allWalkers'],
    queryFn: async () => {
      try {
        const result = await base44.entities.WalkerProfile.filter(
          { is_active: true },
          '-created_date',
          50
        );
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error("Erro walkers:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: emergencyWalks, isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: async () => {
      try {
        const res = await base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date', 15);
        if (!Array.isArray(res)) return [];

        const uniqueMap = new Map();
        res.forEach(walk => {
          if (walk.id && !uniqueMap.has(walk.id)) {
            uniqueMap.set(walk.id, walk);
          }
        });

        return Array.from(uniqueMap.values());
      } catch (error) {
        console.error("Emergency walks fetch error:", error);
        return [];
      }
    },
    enabled: activeTab === 'emergency' || user?.preferences?.current_mode === 'professional',
    initialData: [],
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const { data: communityPosts = [], isLoading: loadingCommunity } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: async () => {
      try {
        const posts = await base44.entities.SocialPost.filter({ 
          moderation_status: 'approved',
          is_public: true
        }, '-created_date', 20);
        return Array.isArray(posts) ? posts : [];
      } catch (error) {
        return [];
      }
    },
    enabled: activeTab === 'comunidade',
    initialData: [],
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: publishersData = [] } = useQuery({
    queryKey: ['externalPublishers'],
    queryFn: async () => {
      const publishers = await base44.entities.ExternalPublisher.list();
      return publishers;
    },
    enabled: activeTab === 'comunidade',
    staleTime: 5 * 60 * 1000,
  });

  const { data: featuredWalkers = [] } = useQuery({
    queryKey: ['featuredWalkers'],
    queryFn: async () => {
      const walkers = await base44.entities.WalkerProfile.filter({ 
        is_active: true
      }, '-rating', 6);
      return walkers.filter(w => w.photo_url);
    },
    enabled: !user,
    initialData: [],
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: featuredDogs = [] } = useQuery({
    queryKey: ['featuredDogs'],
    queryFn: async () => {
      const dogs = await base44.entities.DogProfile.list('-created_date', 6);
      return dogs.filter(d => d.photo_url);
    },
    enabled: !user,
    initialData: [],
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const featuredAdoptions = [];

  // platformStats query removida — descarregava 400 entidades completas só para .length



  const calculateMatchScore = (walker) => {
    return calculateCompatibilityScore(walker, {
      myDogs: myDogs,
      favorites: favorites,
      userEmail: user?.email,
      pastBookings: activeBookings
    });
  };

  const filteredProfessionals = React.useMemo(() => {
    const validWalkers = walkers.filter(w => w?.id && w?.walker_name && w?.is_active !== false && w.verification_status === 'verified' && ['walker', 'trainer', 'both', 'hotel'].includes(w.professional_type));
    
    const processed = validWalkers.map(w => ({
      ...w,
      matchScore: calculateMatchScore(w)
    }));

    let result = processed;

    if (searchLocation?.trim()) {
      const term = searchLocation.toLowerCase();
      result = result.filter(w => 
        w.location?.toLowerCase().includes(term) || 
        w.walker_name?.toLowerCase().includes(term)
      );
    }

    if (filterSize !== "all") {
      result = result.filter(w => w.dog_sizes?.includes(filterSize));
    }

    if (filterTime !== "all") {
      result = result.filter(w => w.availability?.includes(filterTime));
    }

    if (filterAnimalType !== "all") {
      result = result.filter(w => (w.accepted_animals || ['dogs']).includes(filterAnimalType));
    }

    if (filterProfessionalType !== "all") {
      result = result.filter(w => {
        const pt = w.professional_type;
        if (filterProfessionalType === "walker") return pt === "walker" || pt === "both";
        if (filterProfessionalType === "trainer") return pt === "trainer" || pt === "both" || w.is_verified_trainer === true;
        if (filterProfessionalType === "hotel") return pt === "hotel";
        return true;
      });
    }

    if (filterDogSitting !== "all") {
      result = result.filter(w => {
        const services = w.services_offered || [];
        if (filterDogSitting === "boarding") return services.some(s => s.service_name?.toLowerCase().includes('boarding'));
        if (filterDogSitting === "house_sitting") return services.some(s => s.service_name?.toLowerCase().includes('house'));
        if (filterDogSitting === "drop_in") return services.some(s => s.service_name?.toLowerCase().includes('drop'));
        return true;
      });
    }

    return result.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
      if (b.matchScore !== a.matchScore && a.matchScore > 0 && b.matchScore > 0) return b.matchScore - a.matchScore;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [walkers, searchLocation, filterSize, filterTime, filterAnimalType, filterDogSitting, filterProfessionalType, myDogs, favorites, activeBookings]);

  const filteredEmergencyWalks = React.useMemo(() => {
    if (!Array.isArray(emergencyWalks)) return [];

    return emergencyWalks
      .filter(walk => {
        const matchesLocation = !searchLocation || 
          (walk.location && walk.location.toLowerCase().includes(searchLocation.toLowerCase()));
        const matchesSize = filterSize === "all" || 
          walk.dog_size === filterSize || 
          (Array.isArray(walk.dogs) && walk.dogs.some(d => d.dog_size === filterSize));
        return matchesLocation && matchesSize;
      })
      .sort((a, b) => {
        const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
        const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
        return dateB - dateA;
      });
  }, [emergencyWalks, searchLocation, filterSize]);

  const totalPages = Math.ceil(filteredProfessionals.length / itemsPerPage);
  const paginatedProfessionals = filteredProfessionals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (dogSittingServiceFilter) {
      setFilterDogSitting(dogSittingServiceFilter);
    }
  }, [dogSittingServiceFilter]);

  useEffect(() => {
    if (professionalTypeFilter) {
      setFilterProfessionalType(professionalTypeFilter);
    }
  }, [professionalTypeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchLocation, filterSize, filterTime, filterAvailability, filterDogSitting, filterAnimalType, filterProfessionalType, selectedServiceTypes, selectedSpecializations, advancedFilters, activeTab]);

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      radius: 50,
      languages: [],
      specializations: [],
      breeds: [],
      certifications: [],
      serviceTypes: [],
      timeSlots: [],
      availableDate: null,
      minExperience: 0,
      minRating: 0,
      minPrice: 0,
      maxPrice: 100,
      backgroundCheck: false,
      verifiedOnly: false,
      instantBooking: false
    });
    setCurrentPage(1);
  };

  const resetTrainerFilters = () => {
    setTrainerFilters({
      specialties: [],
      specializations: [],
      methodologies: [],
      consultationTypes: [],
      minExperience: 0,
      minRating: 0,
      verifiedOnly: false,
      availableDate: null
    });
  };

  const toggleServiceType = (type) => {
    setSelectedServiceTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleSpecialization = (spec) => {
    setSelectedSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleLogin = () => {
    navigate('/register');
  };

  const handleBecomePro = () => {
    if (user && hasProfessionalProfile) {
      navigate(createPageUrl('ProfessionalHubV2'));
    } else {
      navigate(createPageUrl('ProfessionalTypeSelect'));
    }
  };

  // Ambos os botões (Sou Profissional / Sou Cliente) iniciam pelo ProfessionalTypeSelect
  const handleStartOnboarding = () => {
    navigate(createPageUrl('ProfessionalTypeSelect'));
  };

  const handleClientRegister = () => {
    if (user) {
      navigate(createPageUrl('ClientSetup'));
    } else {
      navigate('/register?from=' + encodeURIComponent(createPageUrl('ClientSetup')));
    }
  };

  const handleScrollToProfessionals = () => {
    const el = document.getElementById('results-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };





  return (
    <div className="min-h-screen relative w-full">

      <div className="relative z-10">
            

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          {userLoading ? (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="h-32 md:h-40 bg-slate-200/50 rounded-3xl animate-pulse" />
            </div>
          ) : user ? (
            <div className="max-w-4xl mx-auto relative mb-6">
              <div className={`absolute -inset-1 bg-gradient-to-br ${colors?.gradient || 'from-blue-900 via-indigo-700 to-purple-800'} opacity-20 blur-2xl rounded-3xl pointer-events-none`} />
              <div className="relative bg-white/35 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-4 md:p-6 overflow-hidden">
              {/* Embedded Owner Dashboard */}
              {(() => {
                const currentTier = calculateTier(currentXP);
                const currentLevel = currentTier.level;
                const tierProgressPercentage = currentTier.progress || 0;
                const xpRemainingForNextTier = currentTier.max !== Infinity ? currentTier.max - currentXP : 0;
                
                return (
                  <div className="space-y-3 mb-6 relative">
                    <div className={`bg-gradient-to-br ${colors?.gradient || 'from-blue-900 via-indigo-700 to-purple-800'} text-white rounded-2xl shadow-2xl p-4 md:p-5 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(user?.username ? createPageUrl(`UserProfile?username=${user.username}`) : createPageUrl(`UserProfile?id=${user.id}`))}
                            className="w-16 h-16 rounded-xl border-2 border-white/50 shadow-xl overflow-hidden cursor-pointer bg-white/10 backdrop-blur-sm aspect-square"
                          >
                            {user.profile_photo_url ? (
                              <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover aspect-square" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                {user.full_name?.charAt(0) || 'U'}
                              </div>
                            )}
                          </motion.div>
                          <div>
                            <h2 className="text-2xl font-bold text-white mb-0.5">
                              Olá, {user.full_name?.split(' ')[0] || 'Utilizador'}
                            </h2>
                            <p className="text-sm text-white/80 flex items-center gap-2 cursor-pointer hover:underline" onClick={() => navigate(createPageUrl('Gamification'))}>
                              <span>Nível {currentLevel}</span>
                              <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                              <span>{displayedXP.toLocaleString('pt-PT')} XP</span>
                              <span className="w-1 h-1 bg-white/50 rounded-full"></span>
                              <span>{currentTier.icon} {currentTier.name}</span>
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white/70">
                              Progresso para {currentTier.max !== Infinity ? currentTier.next : 'Máximo'}
                            </span>
                            <span className="text-xs text-white/90 font-semibold">{Math.round(tierProgressPercentage)}%</span>
                          </div>
                          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white/90 transition-all duration-1000 ease-out rounded-full"
                              style={{ width: `${tierProgressPercentage}%` }}
                            />
                          </div>
                          {xpRemainingForNextTier > 0 && (
                            <p className="text-[10px] text-white/70 mt-1">
                              Faltam {xpRemainingForNextTier.toLocaleString('pt-PT')} XP
                            </p>
                          )}
                        </div>
                        
                        {earnedBadgesData.length > 0 && (
                          <div className="mb-3 pt-3">
                            <p className="text-xs text-white/70 uppercase font-semibold tracking-wide mb-3">
                              Conquistas Recentes
                            </p>
                            <div className="flex flex-row gap-3 overflow-x-auto pb-2 pt-1 px-2">
                              {earnedBadgesData.slice(0, 5).map((badge, i) => (
                                <div key={`badge-${badge._uniqueId || badge.id || i}`} className="relative group flex-shrink-0">
                                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl ring-2 ring-white/30 hover:ring-white/60 transition-all cursor-pointer overflow-hidden hover:scale-110">
                                    {badge.image_png_file || badge.image_url ? (
                                      <img src={badge.image_png_file || badge.image_url} alt={badge.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xl">{badge.icon || '🏅'}</span>
                                    )}
                                  </div>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] min-w-[140px] max-w-[200px] pointer-events-none">
                                    <p className="font-bold text-xs mb-1 leading-tight text-center">{badge.name}</p>
                                    {badge.description && (
                                      <p className="text-[10px] text-gray-300 leading-snug text-center">{badge.description}</p>
                                    )}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mode Toggle & Quick Actions */}
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button
                        onClick={() => navigate(createPageUrl('Favorites'))}
                        className="flex items-center gap-2 p-2 rounded-2xl transition-all active:scale-95 touch-manipulation"
                        style={{ background: 'linear-gradient(to right, #34827d, #e8f3f2)', boxShadow: '0 4px 16px rgba(52,130,125,0.18)' }}
                      >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(52,130,125,0.18)' }}>
                          <Heart className="w-4 h-4" style={{ color: '#ff6b8a' }} strokeWidth={2} />
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: '#33414a' }}>Favoritos</span>
                      </button>
                      <button
                        onClick={() => navigate(createPageUrl('MyWallet'))}
                        className="flex items-center gap-2 p-2 rounded-2xl transition-all active:scale-95 touch-manipulation"
                        style={{ background: 'linear-gradient(to right, #34827d, #e8f3f2)', boxShadow: '0 4px 16px rgba(52,130,125,0.18)' }}
                      >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(52,130,125,0.18)' }}>
                          <Wallet className="w-4 h-4" style={{ color: '#59d68c' }} strokeWidth={2} />
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: '#33414a' }}>Wallet</span>
                      </button>
                      <button
                        onClick={() => navigate(createPageUrl('Gamification'))}
                        className="flex items-center gap-2 p-2 rounded-2xl transition-all active:scale-95 touch-manipulation"
                        style={{ background: 'linear-gradient(to right, #34827d, #e8f3f2)', boxShadow: '0 4px 16px rgba(52,130,125,0.18)' }}
                      >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(52,130,125,0.18)' }}>
                          <Trophy className="w-4 h-4" style={{ color: '#f5b74b' }} strokeWidth={2} />
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: '#33414a' }}>Legado</span>
                      </button>
                      <button
                        onClick={() => navigate(createPageUrl('ClientDashboard'))}
                        className="flex items-center gap-2 p-2 rounded-2xl transition-all active:scale-95 touch-manipulation"
                        style={{ background: 'linear-gradient(to right, #34827d, #e8f3f2)', boxShadow: '0 4px 16px rgba(52,130,125,0.18)' }}
                      >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(52,130,125,0.18)' }}>
                          <Calendar className="w-4 h-4" style={{ color: '#5887e8' }} strokeWidth={2} />
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: '#33414a' }}>Histórico</span>
                      </button>
                    </div>

                    {['walker', 'trainer', 'both'].includes(user?.account_type) && pendingBookingsCount > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(createPageUrl('ProfessionalHubV2?tab=requests'))}
                        className="mt-3 w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold">Agendamentos Pendentes</p>
                            <p className="text-[10px] opacity-90">Clique para responder</p>
                          </div>
                        </div>
                        <div className="bg-white text-blue-600 font-bold text-sm px-3 py-1 rounded-full group-hover:scale-110 transition-transform">
                          {pendingBookingsCount}
                        </div>
                      </motion.button>
                    )}

                    {['walker', 'trainer', 'both'].includes(user?.account_type) && user.preferences?.current_mode === 'professional' && filteredEmergencyWalks.length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setActiveTab('emergency');
                          setTimeout(() => {
                            document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="mt-3 w-full bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center relative">
                            <MapPin className="w-4 h-4 z-10" />
                            <div className="absolute inset-0 border-2 border-white rounded-full animate-ping opacity-50"></div>
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold">Pedidos PawGo Ativos</p>
                            <p className="text-[10px] opacity-90">Cães precisam de si agora mesmo!</p>
                          </div>
                        </div>
                        <div className="bg-white text-red-600 font-bold text-sm px-3 py-1 rounded-full group-hover:scale-110 transition-transform">
                          {filteredEmergencyWalks.length}
                        </div>
                      </motion.button>
                    )}
                  </div>
                );
              })()}

              {/* Animals Section */}
              {myDogs && myDogs.length > 0 && (
                <div className="bg-white/30 backdrop-blur-lg border border-white/40 shadow-xl rounded-3xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-500" />
                      Meus Animais ({myDogs.length})
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(createPageUrl('EditAnimalProfile'))}
                      className="text-xs h-7 px-3 hover:bg-white/50"
                    >
                      + Adicionar
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {myDogs?.map((dog) => (
                      <motion.div
                        key={dog.id}
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="cursor-pointer"
                        onClick={() => navigate(createPageUrl(`AnimalProfile?id=${dog.id}`))}
                      >
                        <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 text-center border border-white/30 hover:border-blue-300 hover:bg-white/40 transition-all shadow-md hover:shadow-lg aspect-square flex flex-col items-center justify-center">
                          <div className="w-12 h-12 mx-auto mb-1 rounded-full border-2 border-white shadow-md overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100">
                            {dog.photo_url ? (
                              <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-200"></div>
                            )}
                          </div>
                          <p className="font-bold text-[10px] text-gray-900 truncate w-full px-1">{dog.dog_name}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {hasProfessionalProfile && (
                    <button
                      onClick={() => toggleOnlineMutation.mutate(!isProfileOnline)}
                      disabled={toggleOnlineMutation.isPending}
                      className={`mt-4 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed ${
                        isProfileOnline
                          ? 'bg-emerald-500/95 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500'
                          : 'bg-white/60 backdrop-blur-md border border-white/50 text-slate-800 hover:bg-white/80'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`relative flex h-3 w-3 ${isProfileOnline ? '' : 'opacity-70'}`}>
                          <span className={`absolute inline-flex h-full w-full rounded-full ${isProfileOnline ? 'animate-ping bg-white/70' : 'bg-slate-400/40'}`}></span>
                          <span className={`relative inline-flex h-3 w-3 rounded-full ${isProfileOnline ? 'bg-white' : 'bg-slate-500'}`}></span>
                        </span>
                        <span>
                          {toggleOnlineMutation.isPending
                            ? 'A atualizar estado...'
                            : isProfileOnline
                              ? 'Perfil online'
                              : 'Colocar perfil online'}
                        </span>
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        isProfileOnline ? 'bg-white/20 text-white' : 'bg-slate-900/10 text-slate-700'
                      }`}>
                        {isProfileOnline ? 'Ativo' : 'Offline'}
                      </span>
                    </button>
                  )}
                </div>
              )}
              </div>
            </div>
          ) : (
            /* --- CONTEÚDO PARA USUÁRIOS NÃO LOGADOS (HERO PREMIUM) --- */
            <UnauthenticatedHero
              onEntrar={handleStartOnboarding}
              onEncontrar={handleScrollToProfessionals}
              onRegistar={handleBecomePro}
              dogImageUrl="https://media.base44.com/images/public/6907b3be1ec43db5676a2085/6f5a681b3_generated_image.png"
            />
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Tabs Section */}
        <div id="results-section" className="grid lg:grid-cols-4 gap-6 mb-6">
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="lg:col-span-1"
              >
                <Suspense fallback={<div className="p-4"><Skeleton className="h-96 w-full" /></div>}>
                  {activeTab === 'walkers' ? (
                    <AdvancedWalkerFilters
                      filters={advancedFilters}
                      onFiltersChange={setAdvancedFilters}
                      onReset={resetAdvancedFilters}
                      onClose={() => setShowAdvancedFilters(false)}
                    />
                  ) : activeTab === 'trainers' ? (
                    <AdvancedTrainerFilters
                      filters={trainerFilters}
                      onFiltersChange={setTrainerFilters}
                      onReset={resetTrainerFilters}
                      onClose={() => setShowAdvancedFilters(false)}
                    />
                  ) : null}
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={showAdvancedFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div
                className="flex items-center max-w-2xl mx-auto p-1.5 rounded-full mb-6 border border-[#e0f2ef]"
                style={{
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,166,153,0.06)",
                }}
              >
                <button
                  onClick={() => setActiveTab('professionals')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all flex-1 font-heading ${
                    activeTab === 'professionals'
                      ? 'bg-[#0e9485] text-white shadow-[0_4px_14px_rgba(14,148,133,0.35)]'
                      : 'text-[#597670] hover:bg-white/40'
                  }`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{language === 'pt' ? 'Profissionais' : 'Professionals'}</span>
                </button>
                <button
                  onClick={() => navigate(createPageUrl('Shop'))}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all flex-1 font-heading text-[#597670] hover:bg-white/40"
                >
                  <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">Loja</span>
                </button>
              </div>

              <TabsContent value="professionals">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="relative rounded-2xl p-6 md:p-8 overflow-hidden"
                >
                  <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: "#009b93" }} />
                  <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "#ff6622" }} />

                  <div className="relative z-10 flex items-center justify-between gap-3 mb-6">
                    <h2 className="font-heading text-xl md:text-3xl font-bold drop-shadow-lg flex items-center gap-2 tracking-tight" style={{ color: "#009b93" }}>
                      <PawPrint className="w-5 h-5 md:w-6 md:h-6" />
                      {language === 'pt' ? 'Profissionais Disponíveis' : 
                       language === 'es' ? 'Profesionales Disponibles' : 
                       'Available Professionals'}
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.08, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => refetchWalkers()}
                      disabled={isFetchingWalkers}
                      className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center border border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors disabled:opacity-50"
                      title="Recarregar"
                      aria-label="Recarregar profissionais"
                    >
                      <RefreshCw className={`w-4 h-4 text-white ${isFetchingWalkers ? "animate-spin" : ""}`} />
                    </motion.button>
                  </div>

                  <div className="relative z-10">
                  {loadingWalkers ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <ProfessionalCardSkeleton key={`pro-skeleton-${i}`} />
                      ))}
                    </div>
                  ) : filteredProfessionals.length === 0 ? (
                    <Card className="border-0 shadow-xl py-12 md:py-16 text-center rounded-3xl overflow-hidden bg-white/90">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                        <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
                        {language === 'pt' ? 'Nenhum profissional encontrado' : 'No professionals found'}
                      </h3>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSearchLocation("");
                          setCurrentPage(1);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {language === 'pt' ? 'Limpar Filtros' : 'Clear Filters'}
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                      {paginatedProfessionals.map((pro, index) => (
                        <motion.div
                          key={pro.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.18), ease: "easeOut" }}
                        >
                          <Suspense fallback={<ProfessionalCardSkeleton />}>
                            <ProfessionalCard walker={pro} />
                          </Suspense>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  </div>

                  <div className="relative z-10 flex justify-center mt-8 mb-2">
                    <Link
                      to={createPageUrl("AboutUs")}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-[#0d9483] font-heading font-bold text-sm tracking-tight transition-all duration-300 hover:scale-105 active:scale-95"
                      style={{ boxShadow: "0 4px 20px rgba(13,148,131,0.18)", background: "transparent" }}
                    >
                      {language === 'pt' ? 'Sobre Nós' : language === 'es' ? 'Sobre Nosotros' : 'About Us'}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              </TabsContent>

              <TabsContent value="emergency">
                <div className="p-3 sm:p-6 animate-in fade-in duration-500">
                  <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">PawGo em Manutenção</h3>
                    <p className="text-sm text-gray-600 mb-4">Estamos a refazer o PawGo do zero!</p>
                  </div>
                  {!user && (
                    <div className="text-center py-12 md:py-16 bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100 mt-4">
                      <Button 
                        onClick={handleLogin}
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-full shadow-xl"
                      >
                        Entrar Agora
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

            </Tabs>
          </div>
        </div>

        {/* Professional Call-to-Action Section — Glass Premium */}
        <div className="mt-16 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-[2rem] overflow-hidden"
            style={{ background: "#0f8674", boxShadow: "0 24px 64px rgba(15,134,116,0.35), 0 4px 16px rgba(0,0,0,0.08)" }}
          >
            {/* Glass card overlay */}
            <div
              className="relative rounded-[2rem] border border-white/30 m-0"
              style={{
                background: "rgba(23,147,129,0.55)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
              }}
            >
              {/* Faint paw/bone pattern */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                {[
                  { Icon: PawPrint, pos: "top-[12%] left-[8%]", size: 36, rot: -15 },
                  { Icon: Bone, pos: "top-[22%] right-[10%]", size: 30, rot: 20 },
                  { Icon: PawPrint, pos: "bottom-[18%] left-[12%]", size: 28, rot: 10 },
                  { Icon: Bone, pos: "bottom-[12%] right-[14%]", size: 32, rot: -25 },
                  { Icon: PawPrint, pos: "top-[45%] left-[4%]", size: 22, rot: 5 },
                  { Icon: Bone, pos: "top-[8%] left-[40%]", size: 24, rot: -10 },
                  { Icon: PawPrint, pos: "bottom-[35%] right-[6%]", size: 26, rot: 15 },
                ].map((item, i) => (
                  <div key={i} className={`absolute ${item.pos}`} style={{ transform: `rotate(${item.rot}deg)`, opacity: 0.08 }}>
                    <item.Icon size={item.size} color="#ffffff" strokeWidth={1.5} fill="none" />
                  </div>
                ))}
              </div>

              {/* Radial glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[80%] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(255,255,255,0.12), transparent 70%)" }} />

              <div className="relative z-10 text-center px-6 py-10 md:py-14">
                <h2 className="font-heading text-2xl md:text-4xl font-bold mb-3 text-white tracking-tight">
                  {language === 'pt' ? 'Junte-se aos Melhores Profissionais' : 'Join the Best Professionals'}
                </h2>
                <p className="text-sm md:text-base text-white/85 mb-7 max-w-2xl mx-auto leading-relaxed">
                  {language === 'pt'
                    ? 'Ganhe dinheiro fazendo o que ama. Torne-se um Dog Walker ou treinador certificado.'
                    : 'Earn money doing what you love. Become a certified walker or trainer.'}
                </p>

                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (user && hasProfessionalProfile) {
                        navigate(createPageUrl('ProfessionalHubV2'));
                      } else {
                        navigate(createPageUrl('ProfessionalTypeSelect'));
                      }
                    }}
                    className="hero-cta-glass-premium inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold transition-all"
                  >
                    <Users className="w-4 h-4" strokeWidth={2.5} />
                    {language === 'pt' ? 'Tornar-me Profissional' : 'Become a Professional'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Testimonials Section */}
        {!userLoading && !user && (
          <Suspense fallback={null}>
            <TestimonialsSection />
          </Suspense>
        )}

        {/* Trust Badges Section */}
        <div className="mt-12 mb-8">
          <div className="flex items-center justify-center gap-6 md:gap-12 max-w-2xl mx-auto px-4">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 cursor-default group">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                <Award className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-900 drop-shadow-sm">{t('verifiedProfessionals', language)}</span>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 cursor-default group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-900 drop-shadow-sm">{t('securePayment', language)}</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}