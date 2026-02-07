import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Zap, Star, Shield, Heart, TrendingUp, Users, Sliders, Award, Home as HomeIcon, PlusCircle, Calendar, MessageCircle, Clock, CheckCircle, ShieldCheck, PlayCircle, StarHalf, Crown, Dog, BarChart3, Store, ShoppingBag, Sparkles, Wallet, GraduationCap, Rss, Map as MapIcon, List, ChevronLeft, ChevronRight, Star as StarIcon, Trophy, Plus } from "lucide-react";
import WalkerCard from "../components/marketplace/WalkerCard";
import ReviewModal from "../components/reviews/ReviewModal";
import EmergencyDogCard from "../components/emergency/EmergencyDogCard";
import TrainerCard from "../components/trainers/TrainerCard";
const AdvancedWalkerFilters = React.lazy(() => import("../components/search/AdvancedWalkerFilters"));
const AdvancedTrainerFilters = React.lazy(() => import("../components/search/AdvancedTrainerFilters"));

import TestimonialsSection from "../components/home/TestimonialsSection";
import { WalkerSearchMap } from "../components/pawcao/WalkerSearchMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PawCaoLogo from "@/components/PawCaoLogo";
import { motion, AnimatePresence } from "framer-motion";
import LocationSearch, { calculateDistance } from "../components/search/LocationSearch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ExternalPostCard from "../components/social/ExternalPostCard";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateTier } from "@/components/gamification/tierSystem";
import { useTheme } from "@/components/ThemeContext";
import { CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";



export default function Home() {
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
  breeds: [], // Added breeds
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

  // Check URL for tab parameter
  const urlTabParam = new URLSearchParams(window.location.search).get('tab');
  const [activeTab, setActiveTab] = useState(urlTabParam || "professionals");
  const [showHeroFilters, setShowHeroFilters] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
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

  // getLevelInfo removed - using calculateTier from tierSystem instead

  const priorityData = React.useMemo(() => {
      const live = activeBookings.find(b => b.status === 'in_progress');
      if (live) return { type: 'live', booking: live };

      const reviewPending = activeBookings.find(b => b.status === 'completed' && !b.review_id);
      if (reviewPending) return { type: 'review', booking: reviewPending };

      // Find next confirmed (closest date)
      const upcoming = activeBookings
          .filter(b => b.status === 'confirmed')
          .sort((a, b) => new Date(a.walk_date + 'T' + a.walk_time) - new Date(b.walk_date + 'T' + b.walk_time))
          .find(b => new Date(b.walk_date) >= new Date().setHours(0,0,0,0));
      
      if (upcoming) return { type: 'next', booking: upcoming };

      return null;
  }, [activeBookings]);

  // Fetch UserProfile as single source of truth for XP (same as Gamification page)
  const { data: currentUserProfile } = useQuery({
    queryKey: ['currentUserProfileXP', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 10 * 1000, // 10 seconds - sync with theme
    refetchOnWindowFocus: true,
  });

  // XP animation effect - UserProfile is single source of truth
  const currentXP = currentUserProfile?.gamification_xp || 0;
  const [displayedXP, setDisplayedXP] = useState(currentXP);
  
  useEffect(() => {
    if (!currentXP) {
      setDisplayedXP(0);
      return;
    }
    const duration = 1500;
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
    }, duration / steps);

    return () => clearInterval(timer);
  }, [currentXP]);



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
    enabled: !userLoading,
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Trainers integrados no WalkerProfile (is_verified_trainer = true)

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
    enabled: activeTab === 'emergency',
    initialData: [],
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  // Community Posts (SocialPost + ExternalPublisher)
  const { data: communityPosts = [], isLoading: loadingCommunity } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: async () => {
      try {
        const posts = await base44.entities.SocialPost.filter({ 
          is_public: true
        }, '-created_date', 20);
        return Array.isArray(posts) ? posts : [];
      } catch (error) {
        console.error("Community posts fetch error:", error);
        return [];
      }
    },
    initialData: [],
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 30 * 1000,
  });

  // Fetch publishers data for community posts
  const { data: publishersData = [] } = useQuery({
    queryKey: ['externalPublishers'],
    queryFn: async () => {
      const publishers = await base44.entities.ExternalPublisher.list();
      return publishers;
    },
    enabled: activeTab === 'comunidade',
    staleTime: 5 * 60 * 1000,
  });

  // Stats em tempo real
  // Featured items for floating elements
  // Only load featured items for non-logged-in users (hero section)
  const { data: featuredWalkers = [] } = useQuery({
    queryKey: ['featuredWalkers'],
    queryFn: async () => {
      const walkers = await base44.entities.WalkerProfile.filter({ 
        is_active: true, 
        verification_status: 'verified' 
      }, '-rating', 6);
      return walkers.filter(w => w.photo_url);
    },
    enabled: !user && !userLoading,
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
    enabled: !user && !userLoading,
    initialData: [],
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const featuredAdoptions = [];

  const { data: stats } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      let activeWalkers = [];
      let activeTrainers = [];

      try {
        const allWalkers = await base44.entities.WalkerProfile.filter({ is_active: true }, '-created_date', 500);
        if (Array.isArray(allWalkers)) {
          activeWalkers = allWalkers.filter(w => !w.is_verified_trainer);
          activeTrainers = allWalkers.filter(w => w.is_verified_trainer && w.verification_status === 'verified');
        }
      } catch (error) {
        console.warn("Error fetching walkers for stats:", error);
        activeWalkers = [];
        activeTrainers = [];
      }

      return {
        totalWalkers: activeWalkers.length,
        totalTrainers: activeTrainers.length,
        happyDogs: 0,
        adoptedDogs: 0
      };
    },
    enabled: !userLoading,
    initialData: { totalWalkers: 0, totalTrainers: 0, happyDogs: 0, adoptedDogs: 0 },
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const getWalkerDistance = (walker) => {
    if (!userLocation?.lat || !userLocation?.lng || !walker.latitude || !walker.longitude) {
      return null;
    }
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      walker.latitude,
      walker.longitude
    );
  };

  const getTrainerDistance = (trainer) => {
    if (!userLocation || !userLocation.lat || !userLocation.lng) return null;
    const trainerLat = trainer.latitude || 38.7223;
    const trainerLng = trainer.longitude || -9.1393;

    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      trainerLat,
      trainerLng
    );
  };

  const getEmergencyDistance = (walk) => {
    if (!userLocation || !userLocation.lat || !userLocation.lng) return null;
    if (!walk.latitude || !walk.longitude) return null;

    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      walk.latitude,
      walk.longitude
    );
  };

  const calculateMatchScore = (walker) => {
    let score = 0;
    let totalPossibleScore = 0;

    if (selectedServiceTypes.length > 0) {
      totalPossibleScore += 40;
      const matchedServices = selectedServiceTypes.filter(type =>
        walker.services_offered?.some(s =>
          s.service_name?.toLowerCase().includes(type.toLowerCase().replace('_', ' '))
        )
      );
      if (selectedServiceTypes.length > 0) {
        score += (matchedServices.length / selectedServiceTypes.length) * 40;
      }
    }

    if (selectedSpecializations.length > 0) {
      totalPossibleScore += 30;
      const matchedSpecs = selectedSpecializations.filter(spec =>
        walker.specializations?.includes(spec)
      );
      if (selectedSpecializations.length > 0) {
        score += (matchedSpecs.length / selectedSpecializations.length) * 30;
      }
    }

    totalPossibleScore += 15;
    score += ((walker.rating || 0) / 5) * 15;

    totalPossibleScore += 10;
    score += Math.min(((walker.experience_years || 0) / 10), 1) * 10;

    totalPossibleScore += 5;
    if (walker.verification_status === 'verified') score += 5;

    if (totalPossibleScore === 0) return 0;

    return Math.round((score / totalPossibleScore) * 100);
  };

  const filteredProfessionals = React.useMemo(() => {
    // SIMPLIFICADO: Mostrar TODOS os walkers válidos
    const validWalkers = walkers.filter(w => w?.id && w?.walker_name);
    
    // Adicionar distância e score
    const processed = validWalkers.map(w => ({
      ...w,
      distance: getWalkerDistance(w),
      matchScore: calculateMatchScore(w)
    }));

    // Aplicar filtros APENAS se usuário selecionou
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

    // Ordenar
    return result.sort((a, b) => {
      if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [walkers, searchLocation, filterSize, filterTime, filterAnimalType, filterDogSitting, userLocation]);

  const filteredEmergencyWalks = React.useMemo(() => {
    if (!Array.isArray(emergencyWalks)) return [];

    const filtered = emergencyWalks
      .map(walk => ({
        ...walk,
        distance: getEmergencyDistance(walk)
      }))
      .filter(walk => {
        const matchesLocation = !searchLocation || 
          walk.location?.toLowerCase().includes(searchLocation.toLowerCase());
        const matchesSize = filterSize === "all" || walk.dog_size === filterSize;

        return matchesLocation && matchesSize;
      })
      .sort((a, b) => {
        if (userLocation && a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        return new Date(b.created_date) - new Date(a.created_date);
      });

    return filtered;
  }, [emergencyWalks, searchLocation, filterSize, userLocation]);

  // Pagination Logic
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

  // Reset page when filters change
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

  return (
    <div className="min-h-screen relative w-full overflow-hidden">

      <div className="relative z-10 overflow-hidden">

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          {user ? (
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-800/20 via-slate-900/15 to-slate-800/20 backdrop-blur-sm rounded-3xl shadow-2xl p-4 md:p-6 mb-6">
              {/* Embedded Owner Dashboard */}
              {(() => {
                // Use UserProfile XP as source of truth (same as Gamification page)
                const currentTier = calculateTier(currentXP);
                const currentLevel = currentTier.level;
                
                // Tier-based progress (same as Gamification page)
                const tierProgressPercentage = currentTier.progress || 0;
                const xpRemainingForNextTier = currentTier.max !== Infinity ? currentTier.max - currentXP : 0;
                
                return (
                  <div className="space-y-3 mb-6 relative">
                    {/* Ambient glow circle */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-500 opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <div className={`bg-gradient-to-br ${colors?.gradient || 'from-blue-900 via-indigo-700 to-purple-800'} text-white rounded-2xl shadow-2xl p-4 md:p-5 relative overflow-hidden`}>
                      {/* Shimmer effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none"></div>
                      
                      {/* Decorative bubbles */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                      <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white opacity-5 rounded-full blur-xl"></div>
                      
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
                        
                        {(() => {
                          const allBadges = [...(user?.achievements_badges || []), ...(user?.public_badges || [])];
                          // Remove duplicates based on badge_id
                          const uniqueBadges = allBadges.filter((badge, index, self) => 
                            index === self.findIndex(b => b.badge_id === badge.badge_id)
                          );
                          return uniqueBadges.length > 0 && (
                            <div className="mb-3 pt-3">
                              <p className="text-xs text-white/70 uppercase font-semibold tracking-wide mb-3">
                                Conquistas Recentes
                              </p>
                              <div className="flex flex-row gap-3 overflow-x-auto pb-2 pt-1 px-2 overflow-visible">
                                {uniqueBadges
                                  .sort((a, b) => {
                                    const dateA = a.earned_date ? new Date(a.earned_date).getTime() : 0;
                                    const dateB = b.earned_date ? new Date(b.earned_date).getTime() : 0;
                                    return dateB - dateA;
                                  })
                                  .slice(0, 5)
                                  .map((badge, i) => (
                                    <div key={`badge-${i}-${badge.badge_id || badge.id || i}`} className="relative group flex-shrink-0">
                                      <div 
                                        className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl ring-2 ring-white/30 hover:ring-white/60 transition-all cursor-pointer overflow-hidden hover:scale-110"
                                      >
                                        {badge.image_url ? (
                                          <img src={badge.image_url} alt={badge.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <span>{badge.icon || '🏅'}</span>
                                        )}
                                      </div>
                                      {/* Tooltip on hover */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-2 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[9999] min-w-[140px] max-w-[200px] pointer-events-none">
                                        <p className="font-bold text-xs mb-1 leading-tight text-center">{badge.name}</p>
                                        {badge.description && (
                                          <p className="text-[10px] text-gray-300 leading-snug text-center">{badge.description}</p>
                                        )}
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 w-full">
                      <button
                        onClick={() => navigate(createPageUrl('Favorites'))}
                        className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation"
                      >
                        <Heart className="w-4 h-4 text-pink-500" strokeWidth={2} />
                        <span className="text-[9px] font-semibold text-slate-700">Favoritos</span>
                      </button>

                      <button
                      onClick={() => navigate(createPageUrl('MyWallet'))}
                      className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation"
                      >
                      <Wallet className="w-4 h-4 text-green-600" strokeWidth={2} />
                      <span className="text-[9px] font-semibold text-slate-700">Wallet</span>
                      </button>

                      <button
                      onClick={() => navigate(createPageUrl('Gamification'))}
                      className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation"
                      >
                      <Trophy className="w-4 h-4 text-amber-500" strokeWidth={2} />
                      <span className="text-[9px] font-semibold text-slate-700">Hall da Fama</span>
                      </button>

                      <button
                      onClick={() => navigate(createPageUrl('MyBookings'))}
                      className="flex flex-col items-center gap-1 p-2 bg-white/70 backdrop-blur-lg rounded-xl shadow-md active:shadow-sm ring-1 ring-white/50 active:ring-white/80 transition-all active:scale-95 touch-manipulation"
                      >
                      <Calendar className="w-4 h-4 text-blue-600" strokeWidth={2} />
                      <span className="text-[9px] font-semibold text-slate-700">Histórico</span>
                      </button>
                    </div>

                    {/* Professional Pending Bookings Alert */}
                    {['walker', 'trainer', 'both'].includes(user?.account_type) && pendingBookingsCount > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}
                        className="mt-3 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-between group"
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
                        <div className="bg-white text-red-600 font-bold text-sm px-3 py-1 rounded-full group-hover:scale-110 transition-transform">
                          {pendingBookingsCount}
                        </div>
                      </motion.button>
                    )}
                  </div>
                );
              })()}

              {/* Animals Section - Modern & Transparent */}
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
                              <div className="w-full h-full flex items-center justify-center text-xl">
                                {dog.animal_type === 'cat' ? '🐱' : dog.animal_type === 'bird' ? '🦜' : '🐕'}
                              </div>
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
            <div className="text-center max-w-6xl mx-auto relative">
              {/* Floating Interactive Elements */}
              <div className="relative mb-8">
                {/* Walkers - Top Left & Top Right */}
                {featuredWalkers.slice(0, 2).map((walker, idx) => (
                  <motion.div
                    key={`walker-${walker.id}`}
                    initial={{ opacity: 0, scale: 0.5, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.15, duration: 0.5 }}
                    className={`absolute hidden md:block ${idx === 0 ? '-left-16 top-0' : '-right-16 top-0'} cursor-pointer group z-20`}
                    onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
                      className="relative"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-green-400 shadow-2xl group-hover:border-green-600 transition-all group-hover:scale-110 aspect-square">
                        <img src={walker.photo_url} alt={walker.walker_name} className="w-full h-full object-cover aspect-square" />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-600 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap">
                        Walker
                      </div>
                    </motion.div>
                  </motion.div>
                ))}

                {/* Happy Dogs - Middle Left & Right */}
                {featuredDogs.slice(0, 2).map((dog, idx) => (
                  <motion.div
                    key={`dog-${dog.id}`}
                    initial={{ opacity: 0, scale: 0.5, x: idx === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.15, duration: 0.5 }}
                    className={`absolute hidden md:block ${idx === 0 ? '-left-24 top-32' : '-right-24 top-32'} cursor-pointer group z-20`}
                    onClick={() => {
                      if (!user) {
                        base44.auth.redirectToLogin(window.location.href);
                        return;
                      }
                      navigate(createPageUrl(`PostEmergency?dogId=${dog.id}`));
                    }}
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: idx * 0.7 }}
                      className="relative"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-4 border-green-400 shadow-2xl group-hover:border-green-600 transition-all group-hover:scale-110 aspect-square">
                        <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover aspect-square" />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-600 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-lg whitespace-nowrap">
                        {dog.dog_name}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}

                {/* Center Title with Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
                    <motion.div 
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2.5 rounded-full shadow-lg cursor-pointer min-w-[140px]"
                      onClick={() => navigate(createPageUrl('Home') + '?tab=professionals')}
                    >
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-bold">{stats.totalWalkers}</span>
                      <span className="text-xs opacity-90">Walkers</span>
                    </motion.div>

                    <motion.div 
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 text-white px-6 py-2.5 rounded-full shadow-lg cursor-pointer ring-2 ring-orange-500/50 min-w-[140px]"
                      onClick={() => navigate(createPageUrl('Trainers'))}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-sm font-bold">{stats.totalTrainers}</span>
                      <span className="text-xs opacity-90">Trainers</span>
                    </motion.div>
                   </div>
                </motion.div>
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
        {/* Tabs Section - Show for everyone */}
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
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Zap className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">SOS</span>
                </button>
                <button
                  onClick={() => setActiveTab('comunidade')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all flex-1 ${
                    activeTab === 'comunidade'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Rss className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">{language === 'pt' ? 'Comunidade' : 'Community'}</span>
                  <span className="truncate sm:hidden">Feed</span>
                  </button>

                  <div className="w-px h-6 bg-gray-300 mx-1"></div>

                  <button
                  onClick={() => setShowHeroFilters(!showHeroFilters)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                    showHeroFilters
                      ? 'bg-gray-200 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  >
                  <Sliders className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">{language === 'pt' ? 'Filtrar' : 'Filter'}</span>
                  </button>
                  </div>

                  <AnimatePresence>
                  {showHeroFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-6"
                  >
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-3 max-w-xl mx-auto border border-white/50">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <LocationSearch
                            onLocationChange={(loc) => {
                                setUserLocation(loc);
                                if(loc && loc.lat && loc.lng) {
                                  setTimeout(() => {
                                    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                                  }, 500);
                                }
                            }}
                            currentLocation={userLocation}
                            className="border-0 bg-gray-100 h-10 text-sm focus:ring-2 focus:ring-green-500 rounded-xl"
                            placeholder="📍 Onde procura?"
                          />
                        </div>
                        <Button 
                          id="find-walker-btn"
                          size="icon"
                          onClick={() => {
                            setActiveTab('professionals');
                            document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="h-10 w-10 shrink-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-md hover:scale-105 transition-all"
                        >
                          <Search className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Filtros compactos em linha */}
                      <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                        <Select value={filterSize} onValueChange={setFilterSize}>
                          <SelectTrigger className="h-8 w-auto min-w-[70px] text-xs bg-gray-100 border-0 rounded-lg px-2">
                            <SelectValue placeholder="Porte" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Porte</SelectItem>
                            <SelectItem value="small">Pequeno</SelectItem>
                            <SelectItem value="medium">Médio</SelectItem>
                            <SelectItem value="large">Grande</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={filterTime} onValueChange={setFilterTime}>
                          <SelectTrigger className="h-8 w-auto min-w-[70px] text-xs bg-gray-100 border-0 rounded-lg px-2">
                            <SelectValue placeholder="Horário" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Horário</SelectItem>
                            <SelectItem value="morning">Manhã</SelectItem>
                            <SelectItem value="afternoon">Tarde</SelectItem>
                            <SelectItem value="evening">Noite</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={filterAnimalType} onValueChange={setFilterAnimalType}>
                          <SelectTrigger className="h-8 w-auto min-w-[70px] text-xs bg-gray-100 border-0 rounded-lg px-2">
                            <SelectValue placeholder="Animal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Animal</SelectItem>
                            <SelectItem value="dogs">Cães</SelectItem>
                            <SelectItem value="cats">Gatos</SelectItem>
                            <SelectItem value="reptiles">Répteis</SelectItem>
                            <SelectItem value="rodents">Roedores</SelectItem>
                            <SelectItem value="birds">Aves</SelectItem>
                          </SelectContent>
                        </Select>

                        {(filterSize !== "all" || filterTime !== "all" || filterAnimalType !== "all") && (
                          <button
                            onClick={() => {
                              setFilterSize("all");
                              setFilterTime("all");
                              setFilterAnimalType("all");
                            }}
                            className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-all shrink-0"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  )}
                  </AnimatePresence>

              <TabsContent value="professionals">
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-900 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md inline-block">
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
                        <p className="text-xs md:text-sm text-gray-700 bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm inline-flex items-center gap-1 font-medium">
                          <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
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
                            {t('sortedByMatch', language)}
                          </Badge>
                        )}
                        
                        {filterDogSitting !== "all" && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            {filterDogSitting === "boarding" && t('dogBoarding', language)}
                            {filterDogSitting === "house_sitting" && t('houseSitting', language)}
                            {filterDogSitting === "drop_in" && t('dropInVisits', language)}
                          </span>
                        )}
                        {showAdvancedFilters && advancedFilters.radius < 50 && userLocation && (
                          <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-1 rounded-lg shadow-sm">
                            ({t('upToDistance', language)} {advancedFilters.radius}km)
                          </span>
                        )}
                        {filteredProfessionals.some(w => w.distance !== null) && 
                         !(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                          <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-1 rounded-lg shadow-sm">
                            ({t('sortedByDistance', language)})
                          </span>
                        )}
                      </div>
                    </div>
                    </div>

                    {viewMode === "map" ? (
                    <div className="mb-6 h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
                      <WalkerSearchMap
                        walkers={filteredProfessionals}
                        userLocation={userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null}
                        onWalkerClick={(walker) => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
                      />
                    </div>
                  ) : ( 
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
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                            {paginatedProfessionals.map((pro) => 
                              pro.type === 'trainer_as_walker' ? (
                                <TrainerCard 
                                  key={pro.id} 
                                  trainer={pro} 
                                  distance={pro.distance}
                                  showMatchScore={selectedServiceTypes.length > 0 || selectedSpecializations.length > 0}
                                />
                              ) : (
                                <WalkerCard 
                                  key={pro.id} 
                                  walker={pro}
                                  distance={pro.distance}
                                  matchScore={pro.matchScore}
                                  showMatchScore={selectedServiceTypes.length > 0 || selectedSpecializations.length > 0}
                                />
                              )
                            )}
                          </div>

                          {/* Pagination Controls */}
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
                                      className={`w-8 h-8 p-0 font-medium ${
                                        currentPage === pageNum 
                                          ? 'text-white' 
                                          : 'text-gray-600 hover:bg-gray-50'
                                      }`}
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
                  )}
                </div>
              </TabsContent>



              <TabsContent value="emergency">
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-md inline-block">
                      <h2 className="text-xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Zap className="w-6 h-6 md:w-7 md:h-7 text-orange-600 fill-orange-600" />
                        {t('dogsNeedingHelpTitle', language)}
                      </h2>
                      <p className="text-xs md:text-sm text-gray-700 mt-1 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-600" />
                        {filteredEmergencyWalks.length} {t('dogsNeedHelpCount', language)}
                      </p>
                    </div>
                  </div>

                  {loadingEmergency ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                      {[1, 2, 3].map(i => (
                        <div key={`emergency-skeleton-${i}`} className="bg-white rounded-xl p-4 space-y-3 shadow-md">
                          <Skeleton className="w-full h-48 md:h-56 rounded-lg bg-gray-200" />
                          <Skeleton className="h-5 w-3/4 bg-gray-200" />
                          <Skeleton className="h-4 w-1/2 bg-gray-200" />
                        </div>
                      ))}
                    </div>
                  ) : filteredEmergencyWalks.length === 0 ? (
                    <div className="text-center py-12 md:py-16">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                        <Zap className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">{t('noEmergencies', language)}</h3>
                      <p className="text-sm md:text-base text-gray-600">{t('checkBackLater', language)}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                      {filteredEmergencyWalks.map((walk) => (
                        <EmergencyDogCard key={walk.id} walk={walk} distance={walk.distance} />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comunidade">
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Rss className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
                        {language === 'pt' ? 'Comunidade PawCão' : language === 'es' ? 'Comunidad PawCão' : 'PawCão Community'}
                      </h2>
                      <p className="text-xs md:text-base text-gray-700 mt-1">
                        {language === 'pt' ? 'Partilhe momentos, notícias e conecte-se com outros amantes de pets' : 'Share moments, news and connect with pet lovers'}
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate(createPageUrl('SocialFeed'))}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                      size="sm"
                    >
                      Ver Tudo
                    </Button>
                  </div>

                  {loadingCommunity ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={`community-skeleton-${i}`} className="bg-white rounded-xl p-4 space-y-3 shadow-md">
                          <div className="flex items-center gap-2">
                            <Skeleton className="w-10 h-10 rounded-full bg-gray-200" />
                            <Skeleton className="h-4 w-32 bg-gray-200" />
                          </div>
                          <Skeleton className="w-full h-48 rounded-lg bg-gray-200" />
                          <Skeleton className="h-4 w-full bg-gray-200" />
                        </div>
                      ))}
                    </div>
                  ) : communityPosts.length === 0 ? (
                    <Card className="border-0 shadow-xl py-12 md:py-16 text-center rounded-3xl overflow-hidden bg-white/90">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                        <Rss className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
                        {language === 'pt' ? 'Nenhum post na comunidade ainda' : 'No community posts yet'}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 mb-4">
                        {language === 'pt' ? 'Seja o primeiro a partilhar!' : 'Be the first to share!'}
                      </p>
                      <Button
                        onClick={() => navigate(createPageUrl('SocialFeed'))}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        {language === 'pt' ? 'Criar Post' : 'Create Post'}
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {communityPosts.slice(0, 6).map((post) => {
                        // Check if it's an external post (partner/publisher)
                        if (post.is_external && post.external_publisher_id) {
                          const publisherData = publishersData.find(p => p.id === post.external_publisher_id);

                          return (
                            <motion.div
                              key={post.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="cursor-pointer"
                              onClick={() => navigate(createPageUrl('SocialFeed'))}
                            >
                              <Card className="border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-blue-50/30 overflow-hidden h-full flex flex-col">
                                {/* Publisher Header - Compact Editorial */}
                                <div className="bg-gradient-to-r from-slate-900 via-gray-800 to-slate-900 p-2.5 border-b-2 border-blue-500">
                                  <div className="flex items-center gap-2">
                                    {publisherData?.logo_url && (
                                      <div className="w-8 h-8 bg-white rounded-lg p-0.5 shadow-md shrink-0">
                                        <img 
                                          src={publisherData.logo_url} 
                                          alt={publisherData.publisher_name} 
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1">
                                        <h4 className="font-bold text-white text-xs truncate">
                                          {publisherData?.publisher_name || post.author_name}
                                        </h4>
                                        {publisherData?.is_verified && (
                                          <CheckCircle className="w-3 h-3 text-blue-400 fill-blue-400 shrink-0" />
                                        )}
                                      </div>
                                      <p className="text-gray-300 text-[9px] truncate">
                                        {publisherData?.category === 'news' ? 'Notícias' : 
                                         publisherData?.category === 'magazine' ? 'Revista' : 'Blog'}
                                      </p>
                                    </div>
                                    <Badge className="bg-white/10 text-white border border-white/20 text-[9px] shrink-0">
                                      Parceiro
                                    </Badge>
                                  </div>
                                </div>

                                {/* Hero Image with Title Overlay */}
                                {post.media_urls?.length > 0 && (
                                  <div className="relative w-full aspect-[3/2] bg-gray-900 overflow-hidden group">
                                    <img 
                                      src={post.media_urls[0]} 
                                      alt={post.title || "Artigo"} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                    {post.title && (
                                      <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 drop-shadow-lg">
                                          {post.title}
                                        </h3>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Content Preview */}
                                <div className="p-3 flex-1 flex flex-col">
                                  {(!post.media_urls || post.media_urls.length === 0) && post.title && (
                                    <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2">
                                      {post.title}
                                    </h3>
                                  )}
                                  <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed mb-3 flex-1">
                                    {post.content}
                                  </p>

                                  {/* Engagement Stats */}
                                  <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    <span className="flex items-center gap-1">
                                      <Heart className="w-3 h-3 text-red-500" />
                                      {post.likes_count || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="w-3 h-3 text-blue-500" />
                                      {post.comments_count || 0}
                                    </span>
                                    <span className="ml-auto text-[9px] text-gray-400 font-mono uppercase">
                                      {new Date(post.created_date).toLocaleDateString('pt-PT', {
                                        day: '2-digit',
                                        month: 'short'
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          );
                        }

                        // Standard user post - Modern compact card
                        return (
                          <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -4 }}
                            className="cursor-pointer"
                            onClick={() => navigate(createPageUrl('SocialFeed'))}
                          >
                            <Card className="border border-gray-200 shadow-md hover:shadow-xl transition-all bg-white overflow-hidden h-full flex flex-col">
                              {post.media_urls?.[0] && (
                                <div className="relative w-full aspect-[3/2] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden group">
                                  <img 
                                    src={post.media_urls[0]} 
                                    alt="Post" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  {/* Author Badge Overlay */}
                                  <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                                    <Avatar className="w-5 h-5 ring-2 ring-white/50">
                                      <AvatarImage src={post.author_photo_url} />
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white text-[9px]">
                                        {post.author_name?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold text-white text-[10px]">{post.author_name}</span>
                                  </div>
                                </div>
                              )}
                              <div className="p-3 flex-1 flex flex-col">
                                {!post.media_urls?.[0] && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="w-8 h-8 ring-2 ring-gray-200">
                                      <AvatarImage src={post.author_photo_url} />
                                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white text-xs">
                                        {post.author_name?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-semibold text-xs text-gray-900">{post.author_name}</p>
                                      <p className="text-[10px] text-gray-500">
                                        {new Date(post.created_date).toLocaleDateString('pt-PT', {
                                          day: '2-digit',
                                          month: 'short'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed mb-2 flex-1">
                                  {post.content}
                                </p>

                                {/* Tags */}
                                {post.tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {post.tags.slice(0, 2).map((tag, idx) => (
                                      <Badge key={idx} variant="outline" className="text-[9px] border-blue-200 text-blue-600">
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Engagement Bar */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <span className="flex items-center gap-1 hover:text-red-500 transition-colors">
                                      <Heart className="w-3 h-3" />
                                      {post.likes_count || 0}
                                    </span>
                                    <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                                      <MessageCircle className="w-3 h-3" />
                                      {post.comments_count || 0}
                                    </span>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-6 px-1.5 text-[9px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    Ver
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      })}
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
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                {language === 'pt' ? 'Junte-se aos Melhores Profissionais' : 'Join the Best Professionals'}
              </h2>
              <p className="text-sm md:text-base text-white/95 mb-6 max-w-2xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)] font-medium">
                {language === 'pt' 
                  ? 'Ganhe dinheiro fazendo o que ama. Torne-se um passeador ou treinador certificado.' 
                  : 'Earn money doing what you love. Become a certified walker or trainer.'}
              </p>
              
              <div className="flex justify-center">
                <Button
                  size="default"
                  onClick={() => navigate(createPageUrl('BecomeProfessional'))}
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

          {/* Trust Badges Section - Premium Minimal */}
          <div className="mt-12 mb-8">
          <div className="flex items-center justify-center gap-6 md:gap-12 max-w-2xl mx-auto px-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 cursor-default group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                <Award className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-900 drop-shadow-sm">{t('verifiedProfessionals', language)}</span>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 cursor-default group"
            >
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