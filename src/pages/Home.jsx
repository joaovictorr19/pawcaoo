import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Zap, Star, Shield, Heart, TrendingUp, Users, Sliders, Award, Home as HomeIcon, PlusCircle, Calendar, MessageCircle, Clock, CheckCircle, ShieldCheck, PlayCircle, StarHalf, Crown, Dog, BarChart3, Store, ShoppingBag, Sparkles, Wallet, GraduationCap, Rss, Briefcase, Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { ProfessionalCard } from "../components/marketplace/ProfessionalCard";
import ReviewModal from "../components/reviews/ReviewModal";
const AdvancedWalkerFilters = React.lazy(() => import("../components/search/AdvancedWalkerFilters"));
const AdvancedTrainerFilters = React.lazy(() => import("../components/search/AdvancedTrainerFilters"));

import TestimonialsSection from "../components/home/TestimonialsSection";
import { OnlineWalkersRibbon } from "../components/home/OnlineWalkersRibbon";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { calculateTier } from "@/components/gamification/tierSystem";
import { calculateCompatibilityScore } from "@/utils/recommendationEngine";

import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PawCaoLogo from "@/components/PawCaoLogo";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeContext";
import { CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { toast } from "sonner";



export default function Home() {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  const urlParams = new URLSearchParams(window.location.search);
  const dogSittingServiceFilter = urlParams.get('dogSittingService');
  
  const [searchLocation, setSearchLocation] = useState("");
  const [filterSize, setFilterSize] = useState("all");
  const [filterTime, setFilterTime] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");
  const [filterDogSitting, setFilterDogSitting] = useState(dogSittingServiceFilter || "all");
  const [filterAnimalType, setFilterAnimalType] = useState("all");
  
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

  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        let u = await base44.auth.me();
        const imp = JSON.parse(localStorage.getItem('impersonation') || 'null');
        if (imp?.targetUserId && u?.role === 'admin') {
           const t = await base44.entities.User.filter({ id: imp.targetUserId });
           if (t.length > 0) u = { ...t[0], isImpersonating: true };
        }
        return u;
      } catch (err) {
        return null;
      }
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs', user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['myFavorites', user?.email],
    queryFn: () => base44.entities.Favorite.filter({ created_by: user?.email }),
    enabled: !!user?.email,
    initialData: []
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({ user_email: user.email });
      return points[0] || { points_balance: 0, total_earned: 0, tier: 'bronze' };
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const [reviewBooking, setReviewBooking] = useState(null);
  const userPets = myDogs;

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

  const { data: pendingBookingsCount = 0 } = useQuery({
    queryKey: ['pendingBookingsCount', user?.email],
    queryFn: async () => {
      if (!user?.email || !['walker', 'trainer', 'both'].includes(user?.account_type)) return 0;
      try {
        const res = await base44.entities.Booking.filter({
          $or: [
            { walker_email: user.email, status: 'pending' },
            { trainer_email: user.email, status: 'pending' }
          ]
        });
        return Array.isArray(res) ? res.length : 0;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!user?.email && ['walker', 'trainer', 'both'].includes(user?.account_type),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

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
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const currentXP = currentUserProfile?.gamification_xp || 0;
  const [displayedXP, setDisplayedXP] = useState(currentXP);
  
  useEffect(() => {
    if (!currentXP) {
      setDisplayedXP(0);
      return;
    }
    const dur = 1500;
    const steps = 60;
    const increment = currentXP / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= currentXP) {
        setDisplayedXP(currentXP);
        clearInterval(timer);
      } else {
        setDisplayedXP(Math.floor(current));
      }
    }, dur / steps);

    return () => clearInterval(timer);
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

  const { data: walkers = [], isLoading: loadingWalkers } = useQuery({
    queryKey: ['allWalkers'],
    queryFn: async () => {
      try {
        const result = await base44.entities.WalkerProfile.list('-created_date', 500);
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
        is_active: true, 
        verification_status: 'verified' 
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

  const { data: stats } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      try {
        const [activeWalkers, activeTrainers] = await Promise.all([
          base44.entities.WalkerProfile.filter({ is_active: true }, '-created_date', 200),
          base44.entities.TrainerProfile.filter({ is_active: true }, '-created_date', 200),
        ]);

        return {
          totalWalkers: activeWalkers?.length || 0,
          totalTrainers: activeTrainers?.length || 0,
          happyDogs: 0,
          adoptedDogs: 0
        };
      } catch (error) {
        return { totalWalkers: 0, totalTrainers: 0, happyDogs: 0, adoptedDogs: 0 };
      }
    },
    initialData: { totalWalkers: 0, totalTrainers: 0, happyDogs: 0, adoptedDogs: 0 },
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const getWalkerDistance = (walker) => {
    if (!userLocation?.lat || !userLocation?.lng || !walker.latitude || !walker.longitude) {
      return null;
    }
    return calculateDistance(userLocation.lat, userLocation.lng, walker.latitude, walker.longitude);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getEmergencyDistance = (walk) => {
    if (!userLocation || !userLocation.lat || !userLocation.lng) return null;
    if (!walk.latitude || !walk.longitude) return null;
    return calculateDistance(userLocation.lat, userLocation.lng, walk.latitude, walk.longitude);
  };

  const calculateMatchScore = (walker) => {
    return calculateCompatibilityScore(walker, {
      userLocation: userLocation,
      myDogs: myDogs,
      favorites: favorites,
      userEmail: user?.email,
      pastBookings: activeBookings
    });
  };

  const filteredProfessionals = React.useMemo(() => {
    const validWalkers = walkers.filter(w => w?.id && w?.walker_name);
    
    const processed = validWalkers.map(w => ({
      ...w,
      distance: getWalkerDistance(w),
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
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [walkers, searchLocation, filterSize, filterTime, filterAnimalType, filterDogSitting, userLocation, myDogs, favorites, activeBookings]);

  const filteredEmergencyWalks = React.useMemo(() => {
    if (!Array.isArray(emergencyWalks)) return [];

    return emergencyWalks
      .map(walk => ({ ...walk, distance: getEmergencyDistance(walk) }))
      .filter(walk => {
        const matchesLocation = !searchLocation || 
          (walk.location && walk.location.toLowerCase().includes(searchLocation.toLowerCase()));
        const matchesSize = filterSize === "all" || 
          walk.dog_size === filterSize || 
          (Array.isArray(walk.dogs) && walk.dogs.some(d => d.dog_size === filterSize));
        return matchesLocation && matchesSize;
      })
      .sort((a, b) => {
        if (userLocation && a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        const dateA = a.created_date ? new Date(a.created_date).getTime() : 0;
        const dateB = b.created_date ? new Date(b.created_date).getTime() : 0;
        return dateB - dateA;
      });
  }, [emergencyWalks, searchLocation, filterSize, userLocation]);

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
    setCurrentPage(1);
  }, [searchLocation, filterSize, filterTime, filterAvailability, filterDogSitting, filterAnimalType, selectedServiceTypes, selectedSpecializations, advancedFilters, activeTab]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div>
          <PawCaoLogo size="large" animated={true} />
          <p className="text-gray-600 text-center mt-4">A carregar...</p>
        </div>
      </div>
    );
  }

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
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleBecomePro = () => {
    base44.auth.redirectToLogin(createPageUrl('BecomeProfessional'));
  };





  return (
    <div className="min-h-screen relative w-full">

      <div className="relative z-10 overflow-hidden">

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          {user ? (
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-800/20 via-slate-900/15 to-slate-800/20 backdrop-blur-sm rounded-3xl shadow-2xl p-4 md:p-6 mb-6">
              {/* Embedded Owner Dashboard */}
              {(() => {
                const currentTier = calculateTier(currentXP);
                const currentLevel = currentTier.level;
                const tierProgressPercentage = currentTier.progress || 0;
                const xpRemainingForNextTier = currentTier.max !== Infinity ? currentTier.max - currentXP : 0;
                
                return (
                  <div className="space-y-3 mb-6 relative">
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500 opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <div className={`bg-gradient-to-br ${colors?.gradient || 'from-blue-900 via-indigo-700 to-purple-800'} text-white rounded-2xl shadow-2xl p-4 md:p-5 relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                      
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
                    <div className="flex items-center justify-center mb-3">
                      {['walker', 'trainer', 'both'].includes(user?.account_type) && (
                        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20 shadow-inner">
                          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${user.preferences?.current_mode !== 'professional' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>
                            Tutor
                          </span>
                          <button
                            onClick={async () => {
                              const isProfessional = user.preferences?.current_mode !== 'professional';
                              try {
                                await base44.auth.updateMe({
                                  preferences: { ...user.preferences, current_mode: isProfessional ? 'professional' : 'owner' }
                                });
                                const walkerProfiles = await base44.entities.WalkerProfile.filter({ created_by: user.email });
                                if (walkerProfiles.length > 0) {
                                  await base44.entities.WalkerProfile.update(walkerProfiles[0].id, { is_online: isProfessional });
                                }
                                queryClient.invalidateQueries(['currentUser']);
                                queryClient.invalidateQueries(['walkers']);
                              } catch (error) {
                                console.error('Erro ao ativar modo profissional:', error);
                              }
                            }}
                            className={`relative inline-flex h-8 w-16 items-center flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none shadow-sm ${
                              user.preferences?.current_mode === 'professional' ? 'bg-[#34C759]' : 'bg-white/40'
                            }`}
                          >
                            <span className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.2)] ring-0 transition-transform duration-200 ease-in-out ${
                              user.preferences?.current_mode === 'professional' ? 'translate-x-8' : 'translate-x-0'
                            }`} />
                          </button>
                          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${user.preferences?.current_mode === 'professional' ? 'text-white drop-shadow-md' : 'text-white/50'}`}>
                            Profissional
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 w-full">
                      <button onClick={() => navigate(createPageUrl('Favorites'))} className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation">
                        <Heart className="w-4 h-4 text-pink-500" strokeWidth={2} />
                        <span className="text-[9px] font-semibold text-slate-700">Favoritos</span>
                      </button>
                      <button onClick={() => navigate(createPageUrl('MyWallet'))} className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation">
                        <Wallet className="w-4 h-4 text-green-600" strokeWidth={2} />
                        <span className="text-[9px] font-semibold text-slate-700">Wallet</span>
                      </button>
                      <button onClick={() => navigate(createPageUrl('Gamification'))} className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation">
                        <Trophy className="w-4 h-4 text-amber-500" strokeWidth={2} />
                        <span className="text-[9px] font-semibold text-slate-700">Legado</span>
                      </button>
                      <button onClick={() => navigate(createPageUrl('MyBookings'))} className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation">
                        <Calendar className="w-4 h-4 text-blue-600" strokeWidth={2} />
                        <span className="text-[9px] font-semibold text-slate-700">Histórico</span>
                      </button>
                    </div>

                    {['walker', 'trainer', 'both'].includes(user?.account_type) && pendingBookingsCount > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(createPageUrl('Dashboard'))}
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
                </div>
              )}
            </div>
          ) : (
            /* --- CONTEÚDO PARA USUÁRIOS NÃO LOGADOS --- */
            <div className="text-center max-w-6xl mx-auto relative mt-10 animate-in fade-in duration-700">
              
              <div className="mb-16">
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-6">
                  Passeios memoráveis para<br/>
                  <span className="text-orange-500">cães extraordinários</span>
                </h1>
                <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-xs">
                  A maior rede de dog walkers de Portugal
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 px-4 max-w-4xl mx-auto">
                
                <div className="group relative bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white transition-all hover:-translate-y-2">
                  <div className="relative z-10 text-left">
                    <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-200">
                      <MapPin size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Encontrar Passeador</h2>
                    <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                      Profissionais verificados prontos para dar ao seu cão o passeio que ele merece.
                    </p>
                    <button onClick={handleLogin} className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-colors">
                      Começar Agora
                    </button>
                  </div>
                </div>

                <div className="group relative bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-800 transition-all hover:-translate-y-2">
                  <div className="relative z-10 text-left">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6">
                      <Zap size={28} className="text-orange-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Ser Profissional</h2>
                    <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
                      Transforme a sua paixão por animais numa fonte de rendimento flexível.
                    </p>
                    <button onClick={handleBecomePro} className="w-full bg-orange-500 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20">
                      Fazer Registo Pro
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Avaliação */}
      {reviewBooking && (
        <ReviewModal 
          booking={reviewBooking} 
          isOpen={!!reviewBooking} 
          onClose={() => setReviewBooking(null)} 
        />
      )}



      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
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
              <div className="flex items-center justify-center gap-2 max-w-2xl mx-auto bg-white/80 backdrop-blur-lg p-2 rounded-xl mb-6 border border-white/50 shadow-lg">
                <button
                  onClick={() => setActiveTab('professionals')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex-1 ${
                    activeTab === 'professionals'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">{language === 'pt' ? 'Profissionais' : 'Professionals'}</span>
                  <span className="truncate sm:hidden">Pro</span>
                </button>
                <button
                  onClick={() => setActiveTab('emergency')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex-1 ${
                    activeTab === 'emergency'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate font-bold">PawGo</span>
                </button>
              </div>

              <TabsContent value="professionals">
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-lg">
                        {filterDogSitting !== "all" ? (
                          <>
                            {filterDogSitting === "boarding" && t('walkersWithBoarding', language)}
                            {filterDogSitting === "house_sitting" && t('walkersForHouseSitting', language)}
                            {filterDogSitting === "drop_in" && t('walkersForDropIn', language)}
                          </>
                        ) : (
                          language === 'pt' ? 'Profissionais Disponíveis' : 
                          language === 'es' ? 'Profesionales Disponibles' : 
                          'Available Professionals'
                        )}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <p className="text-xs md:text-base text-white/90 drop-shadow-md flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          {filteredProfessionals.length} {t('found', language)}
                        </p>
                        {selectedServiceTypes.length > 0 && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {selectedServiceTypes.length} {t('serviceCount', language)}
                          </Badge>
                        )}
                        {selectedSpecializations.length > 0 && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            {selectedSpecializations.length} {t('specializationCount', language)}
                          </Badge>
                        )}
                        {(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            📊 {t('sortedByMatch', language)}
                          </Badge>
                        )}
                        {filterDogSitting !== "all" && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            {filterDogSitting === "boarding" && `🏠 ${t('dogBoarding', language)}`}
                            {filterDogSitting === "house_sitting" && `🏡 ${t('houseSitting', language)}`}
                            {filterDogSitting === "drop_in" && `🚪 ${t('dropInVisits', language)}`}
                          </span>
                        )}
                        {showAdvancedFilters && advancedFilters.radius < 50 && userLocation && (
                          <span className="text-purple-600 font-semibold ml-2">
                            ({t('upToDistance', language)} {advancedFilters.radius}km)
                          </span>
                        )}
                        {filteredProfessionals.some(w => w.distance !== null) && 
                         !(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                          <span className="text-purple-600 font-semibold ml-2">
                            ({t('sortedByDistance', language)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <>
                    {loadingWalkers ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={`skeleton-${i}`} className="bg-white rounded-xl p-4 space-y-3 shadow-md">
                              <Skeleton className="w-full h-48 md:h-56 rounded-lg bg-gray-200" />
                              <Skeleton className="h-5 w-3/4 bg-gray-200" />
                              <Skeleton className="h-4 w-1/2 bg-gray-200" />
                            </div>
                          ))}
                        </div>
                      ) : filteredProfessionals.length === 0 ? (
                        <Card className="border-0 shadow-xl py-12 md:py-16 text-center rounded-3xl overflow-hidden bg-white/90">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                            <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
                            {language === 'pt' ? 'Nenhum profissional encontrado' : 
                             language === 'es' ? 'No se encontró ningún profesional' : 
                             'No professionals found'}
                          </h3>
                          <p className="text-sm md:text-base text-gray-600 mb-4">
                            {language === 'pt' ? 'Tente ajustar os filtros de pesquisa.' : 'Try adjusting the search filters.'}
                          </p>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSearchLocation("");
                              setFilterSize("all");
                              setFilterTime("all");
                              setFilterAnimalType("all");
                              setFilterDogSitting("all");
                              setCurrentPage(1);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Limpar Filtros
                          </Button>
                        </Card>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                            {paginatedProfessionals.map((pro) => (
                              <ProfessionalCard key={pro.id} walker={pro} />
                            ))}
                          </div>

                          {filteredProfessionals.length > itemsPerPage && (
                            <div className="flex justify-center items-center gap-2 mt-8">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="hover:bg-gray-50"
                              >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="sr-only">{t('previousPage', language)}</span>
                              </Button>
                              
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  let pageNum = i + 1;
                                  if (totalPages > 5 && currentPage > 3) {
                                    pageNum = currentPage - 3 + i;
                                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                  }
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={currentPage === pageNum ? "default" : "ghost"}
                                      size="sm"
                                      onClick={() => setCurrentPage(pageNum)}
                                      className={`w-8 h-8 p-0 font-medium ${currentPage === pageNum ? 'text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                                      style={currentPage === pageNum ? {
                                        background: `linear-gradient(to right, ${colors?.primary || '#16a34a'}, ${colors?.primary || '#16a34a'}dd)`
                                      } : {}}
                                    >
                                      {pageNum}
                                    </Button>
                                  );
                                })}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="hover:bg-gray-50"
                              >
                                <ChevronRight className="w-4 h-4" />
                                <span className="sr-only">{t('nextPage', language)}</span>
                              </Button>
                            </div>
                          )}
                          
                          <div className="text-center text-xs text-gray-500 mt-4">
                            {t('showingResults', language)} {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProfessionals.length)} {t('of', language)} {filteredProfessionals.length} {language === 'pt' ? 'profissionais' : language === 'es' ? 'profesionales' : 'professionals'}
                          </div>
                        </>
                      )}
                    </>
                </div>
              </TabsContent>

              <TabsContent value="emergency">
                <div className="p-3 sm:p-6 animate-in fade-in duration-500">
                  <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">PawGo em Manutenção</h3>
                    <p className="text-sm text-gray-600 mb-4">Estamos a refazer o PawGo do zero para trazer-te uma experiência ainda melhor!</p>
                  </div>
                  {!user && (
                    <div className="text-center py-12 md:py-16 bg-white/60 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100 mt-4">
                      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Faça Login para Usar PawGo</h3>
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

        {/* Professional Call-to-Action Section */}
        <div className="mt-16 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-2xl shadow-lg p-5 md:p-7 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {language === 'pt' ? 'Junte-se aos Melhores Profissionais' : 'Join the Best Professionals'}
              </h2>
              <p className="text-sm md:text-base text-white/80 mb-6 max-w-2xl mx-auto">
                {language === 'pt' 
                  ? 'Ganhe dinheiro fazendo o que ama. Torne-se um passeador ou treinador certificado.' 
                  : 'Earn money doing what you love. Become a certified walker or trainer.'}
              </p>
              
              <div className="flex justify-center">
                <Button
                  size="default"
                  onClick={() => navigate(createPageUrl('ProfessionalSetup'))}
                  className="bg-white text-slate-700 hover:bg-gray-100 shadow-md font-semibold h-11 px-6 rounded-lg"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {language === 'pt' ? 'Tornar-me Profissional' : 'Become a Professional'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Testimonials Section */}
        {!user && <TestimonialsSection />}

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