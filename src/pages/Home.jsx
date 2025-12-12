import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Zap, Star, Shield, Heart, TrendingUp, Users, Sliders, Award, Home as HomeIcon, PlusCircle, Calendar, MessageCircle, Clock, CheckCircle, ShieldCheck, PlayCircle, StarHalf, Crown, Dog, BarChart3 } from "lucide-react";
import WalkerCard from "../components/marketplace/WalkerCard";
import ReviewModal from "../components/reviews/ReviewModal";
import EmergencyDogCard from "../components/emergency/EmergencyDogCard";
import TrainerCard from "../components/trainers/TrainerCard";
const AdvancedWalkerFilters = React.lazy(() => import("../components/search/AdvancedWalkerFilters"));
const AdvancedTrainerFilters = React.lazy(() => import("../components/search/AdvancedTrainerFilters"));
const AdoptionListings = React.lazy(() => import("./AdoptionListings"));
import AISearchAssistant from "../components/ai/AISearchAssistant";
import PersonalizedRecommendations from "../components/ai/PersonalizedRecommendations";
import TestimonialsSection from "../components/home/TestimonialsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PawCaoLogo from "@/components/PawCaoLogo";
import { motion, AnimatePresence } from "framer-motion";
import LocationSearch, { calculateDistance } from "../components/search/LocationSearch";
const InteractiveMap = React.lazy(() => import("../components/search/InteractiveMap"));
import { Map as MapIcon, List, ChevronLeft, ChevronRight, Star as StarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SEO from "../components/SEO";
import { generateWebSiteSchema, generateOrganizationSchema } from "../components/seoHelpers";
import { getLevelFromXP, calculateTier } from "@/components/gamification/gamificationRules";
import { useTheme } from "@/components/ThemeContext";
import { CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";
import { Plus } from "lucide-react";

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
    methodologies: [],
    consultationTypes: [],
    minExperience: 0,
    minRating: 0,
    verifiedOnly: false,
    availableDate: null
  });

  const [activeTab, setActiveTab] = useState("walkers");

  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Dashboard XP animation states (moved to top level)
  const [displayedXP, setDisplayedXP] = useState(0);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        // console.error("Home auth error:", err);
        return null;
      }
    },
    retry: false,
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
    enabled: !!user,
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
        }, '-walk_date', 20);
        return Array.isArray(res) ? res : [];
      } catch (error) {
        // console.error("Active bookings fetch error:", error);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const getLevelInfo = (xp = 0) => {
      const level = getLevelFromXP(xp);
      const levelNames = {
        1: { title: 'Novato', icon: '🌱' },
        5: { title: 'Bronze', icon: '🥉' },
        10: { title: 'Silver', icon: '🥈' },
        20: { title: 'Gold', icon: '🥇' },
        30: { title: 'Sapphire', icon: '💎' },
        50: { title: 'Diamond', icon: '💠' }
      };
      
      // Find the appropriate tier based on level
      const tier = Object.entries(levelNames)
        .reverse()
        .find(([lvl]) => level >= parseInt(lvl))?.[1] || levelNames[1];
      
      return { ...tier, level };
  };

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

  // XP animation effect
  const currentXP = user?.gamification_xp || 0;
  useEffect(() => {
    if (!currentXP) return;
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



  const { data: walkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['walkers'],
    queryFn: async () => {
      try {
        const res = await base44.entities.WalkerProfile.filter({ is_active: true, verification_status: 'verified' }, '-rating', 100);
        return Array.isArray(res) ? res : [];
      } catch (error) {
        console.error("Walkers fetch error:", error);
        return [];
      }
    },
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: trainers, isLoading: loadingTrainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      try {
        const res = await base44.entities.TrainerProfile.filter({ is_active: true, verification_status: 'verified' }, '-rating');
        return Array.isArray(res) ? res : [];
      } catch (error) {
        console.error("Trainers fetch error:", error);
        return [];
      }
    },
    initialData: [],
  });

  const { data: emergencyWalks, isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: async () => {
      try {
        const res = await base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date', 20);
        return Array.isArray(res) ? res : [];
      } catch (error) {
        console.error("Emergency walks fetch error:", error);
        return [];
      }
    },
    initialData: [],
    staleTime: 30000,
  });

  // Stats em tempo real
  const { data: stats } = useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      try {
        const [totalWalkers, completedBookings, adoptedDogs] = await Promise.all([
          base44.entities.WalkerProfile.filter({ is_active: true, verification_status: 'verified' }),
          base44.entities.Booking.filter({ status: 'completed' }),
          base44.entities.AdoptionApplication.filter({ status: 'approved' })
        ]);
        
        return {
          totalWalkers: totalWalkers.length || 0,
          happyDogs: completedBookings.length || 0,
          adoptedDogs: adoptedDogs.length || 0
        };
      } catch (error) {
        console.error("Stats fetch error:", error);
        return { totalWalkers: 0, happyDogs: 0, adoptedDogs: 0 };
      }
    },
    initialData: { totalWalkers: 0, happyDogs: 0, adoptedDogs: 0 },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const getWalkerDistance = (walker) => {
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      return null;
    }
    // Se o passeador não tiver coordenadas, retornamos null para não filtrar incorretamente
    if (!walker.latitude || !walker.longitude) {
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

  // Safe Memoized Walkers Filter
  const filteredWalkers = React.useMemo(() => {
    if (!Array.isArray(walkers)) return [];
    
    return walkers
      .map(walker => ({
        ...walker,
        distance: getWalkerDistance(walker),
        matchScore: calculateMatchScore(walker)
      }))
      .filter(walker => {
        // Only show active walkers for public view
        if (!walker.is_active) return false;

        const matchesLocation = !searchLocation || 
          walker.location?.toLowerCase().includes(searchLocation.toLowerCase());
        const matchesSize = filterSize === "all" || 
          walker.dog_sizes?.includes(filterSize);
        const matchesTime = filterTime === "all" || 
          walker.availability?.includes(filterTime);
        const matchesAvailability = filterAvailability === "all" || filterAvailability === "available";

        const matchesDogSitting = filterDogSitting === "all" || (() => {
          const services = walker.services_offered || [];
          if (filterDogSitting === "boarding") {
            return services.some(s => s.service_name?.toLowerCase().includes('boarding') || s.service_name?.toLowerCase().includes('alojamento'));
          }
          if (filterDogSitting === "house_sitting") {
            return services.some(s => s.service_name?.toLowerCase().includes('house sitting') || s.service_name?.toLowerCase().includes('casa'));
          }
          if (filterDogSitting === "drop_in") {
            return services.some(s => s.service_name?.toLowerCase().includes('drop') || s.service_name?.toLowerCase().includes('visit') || s.service_name?.toLowerCase().includes('alimentação'));
          }
          return true;
        })();
        
        const matchesServiceTypesQuick = selectedServiceTypes.length === 0 ||
          selectedServiceTypes.every(type =>
            walker.services_offered?.some(s =>
              s.service_name?.toLowerCase().includes(type.toLowerCase().replace('_', ' ')) ||
              type.toLowerCase().replace('_', ' ').includes(s.service_name?.toLowerCase())
            )
          );

        const matchesSpecializationsQuick = selectedSpecializations.length === 0 ||
          selectedSpecializations.every(spec =>
            walker.specializations?.includes(spec)
          );

        // Check if user is within any defined service area
        const isInServiceArea = !userLocation || (walker.service_areas?.some(area => {
          if (!area.latitude || !area.longitude || !area.radius_km) return false;
          const dist = calculateDistance(
            userLocation.lat, 
            userLocation.lng, 
            area.latitude, 
            area.longitude
          );
          return dist <= area.radius_km;
        }));

        // Fallback para match textual se o walker não tiver coordenadas ou a geolocalização falhar
        // Tenta extrair a cidade (primeira parte antes da vírgula) para aumentar a chance de match
        const userCity = userLocation ? (userLocation.label || userLocation.value || "").split(',')[0].trim() : "";
        const matchesLocationText = userLocation && userCity && 
                                    walker.location?.toLowerCase().includes(userCity.toLowerCase());

        const matchesRadius = !userLocation || isInServiceArea || 
                              (walker.distance !== null && walker.distance <= (advancedFilters.radius || 50)) ||
                              matchesLocationText;
        
        const matchesLanguages = !advancedFilters.languages || advancedFilters.languages.length === 0 ||
          advancedFilters.languages.some(lang => walker.languages_spoken?.includes(lang));
        
        const matchesAdvancedSpecializations = !advancedFilters.specializations || advancedFilters.specializations.length === 0 ||
          advancedFilters.specializations.some(spec => walker.specializations?.includes(spec));

        const matchesBreeds = !advancedFilters.breeds || advancedFilters.breeds.length === 0 ||
          advancedFilters.breeds.some(breed => walker.dog_breeds_handled?.includes(breed));
        
        const matchesCertifications = !advancedFilters.certifications || advancedFilters.certifications.length === 0 ||
          advancedFilters.certifications.some(cert => 
            walker.certifications_detailed?.some(wCert => 
              wCert.name?.toLowerCase().includes(cert.toLowerCase())
            )
          );
        
        const matchesAdvancedServiceTypes = !advancedFilters.serviceTypes || advancedFilters.serviceTypes.length === 0 ||
          advancedFilters.serviceTypes.some(type => 
            walker.services_offered?.some(s => {
              const name = s.service_name?.toLowerCase() || '';
              // Enhanced matching for PT/EN
              if (type === 'regular_walks') return name.includes('walk') || name.includes('passeio');
              if (type === 'boarding') return name.includes('boarding') || name.includes('alojamento');
              if (type === 'house_sitting') return name.includes('sitting') || name.includes('casa');
              if (type === 'drop_in') return name.includes('drop') || name.includes('visita');
              if (type === 'training') return name.includes('train') || name.includes('treino');
              if (type === 'grooming') return name.includes('groom') || name.includes('tosquia') || name.includes('banho');
              if (type === 'pet_taxi') return name.includes('taxi') || name.includes('transporte');
              if (type === 'daycare') return name.includes('day') || name.includes('creche');
              return name.includes(type.replace('_', ' '));
            })
          );
        
        const matchesTimeSlots = !advancedFilters.timeSlots || advancedFilters.timeSlots.length === 0 ||
          advancedFilters.timeSlots.some(slot => walker.availability?.includes(slot));
        
        const matchesDate = !advancedFilters.availableDate;
        
        const matchesExperience = (walker.experience_years || 0) >= (advancedFilters.minExperience || 0);
        const matchesRating = (walker.rating || 0) >= (advancedFilters.minRating || 0);
        const matchesPrice = (walker.hourly_rate || 0) >= (advancedFilters.minPrice || 0) && 
                             (walker.hourly_rate || 0) <= (advancedFilters.maxPrice || 100);
        
        const matchesBackgroundCheck = !advancedFilters.backgroundCheck || 
                                       walker.background_check_status === 'verified';
        
        const matchesVerifiedOnly = !advancedFilters.verifiedOnly ||
                                     walker.verification_status === 'verified';
        
        const matchesInstantBooking = !advancedFilters.instantBooking ||
                                       walker.instant_booking === true;
        
        return matchesLocation && matchesSize && matchesTime && matchesAvailability &&
               matchesDogSitting && matchesServiceTypesQuick && matchesSpecializationsQuick &&
               matchesRadius && matchesLanguages && matchesAdvancedSpecializations && matchesBreeds &&
               matchesCertifications && matchesAdvancedServiceTypes && matchesTimeSlots && matchesDate &&
               matchesExperience && matchesRating && matchesPrice && matchesBackgroundCheck &&
               matchesVerifiedOnly && matchesInstantBooking;
      })
      .sort((a, b) => {
        if (selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) {
          if (a.matchScore !== b.matchScore) {
            return b.matchScore - a.matchScore;
          }
        }

        if (userLocation && a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [walkers, searchLocation, filterSize, filterTime, filterAvailability, filterDogSitting, 
      selectedServiceTypes, selectedSpecializations, advancedFilters, userLocation]);

  const filteredEmergencyWalks = emergencyWalks.filter(walk => {
    const matchesLocation = !searchLocation || 
      walk.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSize = filterSize === "all" || walk.dog_size === filterSize;
    
    return matchesLocation && matchesSize;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredWalkers.length / itemsPerPage);
  const paginatedWalkers = filteredWalkers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Safe Memoized Trainers Filter
  const filteredTrainers = React.useMemo(() => {
    if (!Array.isArray(trainers)) return [];

    return trainers
      .map(trainer => ({
        ...trainer,
        distance: getTrainerDistance(trainer)
      }))
      .filter(trainer => {
        const matchesSearch = !searchLocation ||
          trainer.location?.toLowerCase().includes(searchLocation.toLowerCase()) ||
          trainer.trainer_name?.toLowerCase().includes(searchLocation.toLowerCase());

        const matchesSpecialties = trainerFilters.specialties.length === 0 ||
          trainerFilters.specialties.some(spec => trainer.training_specialties?.includes(spec));
        
        const matchesMethodologies = trainerFilters.methodologies.length === 0 ||
          trainerFilters.methodologies.some(method => 
            trainer.training_methodologies?.some(m => m.methodology_name === method)
          );
        
        const matchesConsultation = trainerFilters.consultationTypes.length === 0 ||
          trainerFilters.consultationTypes.some(type => trainer.consultation_options?.includes(type));
        
        const matchesExperience = (trainer.experience_years || 0) >= (trainerFilters.minExperience || 0);
        const matchesRating = (trainer.rating || 0) >= (trainerFilters.minRating || 0);
        const matchesVerified = !trainerFilters.verifiedOnly || trainer.verification_status === 'verified';
        
        const matchesRadius = !userLocation || trainer.distance === null || 
          trainer.distance <= (advancedFilters.radius || 50);

        return matchesSearch && matchesSpecialties && matchesMethodologies && 
               matchesConsultation && matchesExperience && matchesRating && 
               matchesVerified && matchesRadius;
      })
      .sort((a, b) => {
        if (userLocation && a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [trainers, searchLocation, trainerFilters, userLocation, advancedFilters.radius]);

  useEffect(() => {
    if (dogSittingServiceFilter) {
      setFilterDogSitting(dogSittingServiceFilter);
    }
  }, [dogSittingServiceFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchLocation, filterSize, filterTime, filterAvailability, filterDogSitting, selectedServiceTypes, selectedSpecializations, advancedFilters]);

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
    <div className="min-h-screen relative w-full overflow-hidden bg-slate-50">
      <SEO 
        title={t('seoTitle', language)}
        description={t('seoDescription', language)}
        schema={[generateWebSiteSchema(), generateOrganizationSchema()]}
      />
      {/* Aurora Animated Background */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 overflow-hidden">

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
          {user ? (
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-800/20 via-slate-900/15 to-slate-800/20 backdrop-blur-sm rounded-3xl shadow-2xl p-4 md:p-6 mb-6">
              {/* Embedded Owner Dashboard */}
              {(() => {
                const currentLevel = user?.gamification_level || 1;
                const currentTier = calculateTier(currentXP);
                
                // Tier-based progress (same as Gamification page)
                const tierProgressPercentage = currentTier.progress || 0;
                const xpRemainingForNextTier = currentTier.max !== Infinity ? currentTier.max - currentXP : 0;
                
                return (
                  <div className="space-y-3 mb-6 relative">
                    {/* Ambient glow circle */}
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500 opacity-5 blur-[100px] rounded-full pointer-events-none"></div>
                    
                    <div className={`bg-gradient-to-br ${colors?.gradient || 'from-blue-900 via-indigo-700 to-purple-800'} text-white rounded-2xl shadow-2xl p-4 md:p-5 relative overflow-hidden`}>
                      {/* Shimmer effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none"></div>
                      
                      {/* Decorative bubbles */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                      <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white opacity-5 rounded-full blur-xl"></div>
                      
                      <div className="relative z-10">
                        <div className="mb-3">
                          <h2 className="text-2xl font-bold text-white mb-1">
                            Olá, {user.full_name?.split(' ')[0] || 'Utilizador'}
                          </h2>
                          <p className="text-sm text-white/80">
                            Nível {currentLevel} • {displayedXP.toLocaleString('pt-PT')} XP • {currentTier.icon} {currentTier.name}
                          </p>
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
                          return allBadges.length > 0 && (
                            <div className="mb-3 pt-3">
                              <p className="text-xs text-white/70 uppercase font-semibold tracking-wide mb-3">
                                Conquistas Recentes
                              </p>
                              <TooltipProvider>
                                <div className="flex flex-row gap-3 overflow-x-auto pb-2 pt-1 px-2">
                                  {allBadges
                                    .sort((a, b) => {
                                      const dateA = a.earned_date ? new Date(a.earned_date).getTime() : 0;
                                      const dateB = b.earned_date ? new Date(b.earned_date).getTime() : 0;
                                      return dateB - dateA;
                                    })
                                    .slice(0, 5)
                                    .map((badge, i) => (
                                      <Tooltip key={`badge-${i}-${badge.badge_id || badge.id || i}`}>
                                        <TooltipTrigger asChild>
                                          <div 
                                            className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-xl ring-2 ring-white/30 hover:ring-white/60 transition-all cursor-pointer overflow-hidden"
                                          >
                                            {badge.image_url ? (
                                              <img src={badge.image_url} alt={badge.name} className="w-full h-full object-cover" />
                                            ) : (
                                              <span>{badge.icon || '🏅'}</span>
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-gray-900 text-white p-3 max-w-xs">
                                          <p className="font-bold text-sm mb-1">{badge.name}</p>
                                          {badge.description && (
                                            <p className="text-xs text-gray-300">{badge.description}</p>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    ))}
                                </div>
                              </TooltipProvider>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 w-full">
                      <button
                        onClick={() => navigate(createPageUrl('Favorites'))}
                        className="flex flex-col items-center gap-1.5 p-2.5 md:p-3 bg-white/70 backdrop-blur-lg rounded-xl shadow-md hover:shadow-lg ring-1 ring-white/50 hover:ring-white/80 transition-all duration-300 active:scale-95"
                      >
                        <Heart className="w-4 h-4 md:w-5 md:h-5 text-indigo-600" strokeWidth={1.5} />
                        <span className="text-[10px] md:text-xs font-semibold text-slate-700">Favoritos</span>
                      </button>

                      <button
                        onClick={() => navigate(createPageUrl('Gamification'))}
                        className="flex flex-col items-center gap-1.5 p-2.5 md:p-3 bg-white/70 backdrop-blur-lg rounded-xl shadow-md hover:shadow-lg ring-1 ring-white/50 hover:ring-white/80 transition-all duration-300 active:scale-95"
                      >
                        <Trophy className="w-4 h-4 md:w-5 md:h-5 text-purple-600" strokeWidth={1.5} />
                        <span className="text-[10px] md:text-xs font-semibold text-slate-700">Hall da Fama</span>
                      </button>

                      <button
                        onClick={() => navigate(createPageUrl('MyBookings'))}
                        className="flex flex-col items-center gap-1.5 p-2.5 md:p-3 bg-white/70 backdrop-blur-lg rounded-xl shadow-md hover:shadow-lg ring-1 ring-white/50 hover:ring-white/80 transition-all duration-300 active:scale-95"
                      >
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-600" strokeWidth={1.5} />
                        <span className="text-[10px] md:text-xs font-semibold text-slate-700">Histórico</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Dogs Carousel */}
              {myDogs && myDogs.length > 0 && (
                <Card className="glass-panel border-0 shadow-lg rounded-3xl">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Dog className="w-4 h-4 text-orange-600" />
                      <h3 className="font-bold text-sm text-gray-900">
                        {language === 'pt' ? 'Meus Cães' : language === 'es' ? 'Mis Perros' : 'My Dogs'} ({myDogs.length})
                      </h3>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {myDogs?.map((dog) => (
                        <div
                          key={dog.id}
                          onClick={() => navigate(createPageUrl(`PostEmergency?dogId=${dog.id}`))}
                          className="flex-shrink-0 w-16"
                        >
                          <motion.div
                            whileHover={{ scale: 1.05, y: -4 }}
                            className="bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl p-1.5 text-center border-2 border-orange-200 hover:border-orange-400 transition-all shadow-sm hover:shadow-md cursor-pointer"
                          >
                            <div className="w-12 h-12 mx-auto mb-1 rounded-full border-2 border-white shadow-md overflow-hidden bg-white">
                              {dog.photo_url ? (
                                <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-orange-300 flex items-center justify-center text-white text-lg font-bold">
                                  {dog.dog_name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <p className="font-bold text-[10px] text-gray-900 truncate">{dog.dog_name}</p>
                          </motion.div>
                        </div>
                      ))}
                      <div
                        onClick={() => navigate(createPageUrl('AccountSettings'))}
                        className="flex-shrink-0 w-16 cursor-pointer"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05, y: -4 }}
                          className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-1.5 h-full flex flex-col items-center justify-center hover:bg-gray-200 hover:border-gray-400 transition-all"
                        >
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-1">
                            <Plus className="w-5 h-5 text-gray-400" />
                          </div>
                          <p className="text-[10px] font-bold text-gray-500">Adicionar</p>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center max-w-4xl mx-auto">
              {/* Estatísticas em Tempo Real */}
              <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">{stats.totalWalkers}</span>
                  <span className="text-xs text-slate-600">Walkers</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                  <Dog className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-slate-700">{stats.happyDogs}</span>
                  <span className="text-xs text-slate-600">Cães Felizes</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                  <Heart className="w-4 h-4 text-pink-600 fill-pink-600" />
                  <span className="text-sm font-bold text-slate-700">{stats.adoptedDogs}</span>
                  <span className="text-xs text-slate-600">Adoções</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4 leading-tight">
                {t('homeTitle', language)}
              </h1>

              <p className="text-xl text-slate-700 mb-6 max-w-2xl mx-auto font-medium">
                Passeadores verificados, treinadores experientes e muito carinho.
                Comece agora mesmo a sua busca.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 p-4 md:p-5 max-w-3xl mx-auto flex flex-col gap-3 ring-1 ring-blue-100"
              >
                <h3 className="text-slate-900 font-bold text-lg text-left mb-1 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Onde procura um Walker?
                </h3>
                <div className="flex flex-col md:flex-row gap-3 items-center w-full">
                  <div className="flex-1 w-full relative">
                    <LocationSearch
                      onLocationChange={(loc) => {
                          setUserLocation(loc);
                          // Auto scroll to results when location is picked for instant gratification
                          if(loc && loc.lat) {
                            setTimeout(() => {
                              document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 500);
                          }
                      }}
                      currentLocation={userLocation}
                      className="border-2 border-gray-100 shadow-sm bg-gray-50 h-14 text-lg focus:border-green-500 transition-all rounded-xl"
                      placeholder="Ex: Porto, Lisboa, Matosinhos..."
                    />
                  </div>
                  <div className="w-full md:w-auto flex gap-2 flex-shrink-0">
                    <Button 
                      id="find-walker-btn"
                      size="lg" 
                      onClick={() => {
                        setActiveTab('walkers');
                        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 text-white font-bold h-14 px-8 shadow-lg text-lg rounded-xl transition-all hover:scale-105 hover:opacity-90"
                      style={{
                        background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
                      }}
                    >
                      <Search className="w-5 h-5 mr-2" />
                      {t('findWalkerBtn', language)}
                    </Button>
                  </div>
                </div>

                {/* AI Search Assistant Embedded - Compact Mode */}
                <div className="w-full border-t border-gray-100 pt-3 mt-1">
                   <AISearchAssistant 
                      currentMode="walkers"
                      onApplyFilters={(aiFilters) => {
                        if (aiFilters.location) setSearchLocation(aiFilters.location);
                        if (aiFilters.maxPrice) setAdvancedFilters(prev => ({ ...prev, maxPrice: aiFilters.maxPrice }));
                        if (aiFilters.serviceType) {
                           if (aiFilters.serviceType.includes('boarding')) setFilterDogSitting('boarding');
                           else if (aiFilters.serviceType.includes('sitting')) setFilterDogSitting('house_sitting');
                           else if (aiFilters.serviceType.includes('drop')) setFilterDogSitting('drop_in');
                        }
                        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                   />
                </div>
              </motion.div>

              <div className="mt-8 flex flex-wrap justify-center gap-4 font-semibold">
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-lg shadow-blue-900/5 ring-1 ring-blue-100 hover:shadow-xl transition-all cursor-default">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-xl shadow-inner">
                     <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-700">{t('verifiedProfessionals', language)}</span>
                </div>
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-lg shadow-blue-900/5 ring-1 ring-blue-100 hover:shadow-xl transition-all cursor-default">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2 rounded-xl shadow-inner">
                     <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-700">{t('securePayment', language)}</span>
                </div>
                <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-lg shadow-blue-900/5 ring-1 ring-blue-100 hover:shadow-xl transition-all cursor-default">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl shadow-inner">
                     <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-slate-700">{t('support247', language)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Testimonials Section */}
      {!user && <TestimonialsSection />}

      {/* Modal de Avaliação */}
      {reviewBooking && (
        <ReviewModal 
          booking={reviewBooking} 
          isOpen={!!reviewBooking} 
          onClose={() => setReviewBooking(null)} 
        />
      )}

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="hover:opacity-80"
            style={{
              borderColor: `${colors?.primary || '#3b82f6'}40`,
              color: colors?.primary || '#3b82f6'
            }}
          >
            <Sliders className="w-4 h-4 mr-2" />
            {showAdvancedFilters ? t('hideAdvancedFilters', language) : t('showAdvancedFilters', language)}
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              size="sm"
              className={viewMode === "list" ? 'text-white' : 'text-gray-700'}
              style={viewMode === "list" ? {
                background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
              } : {}}
            >
              <List className="w-4 h-4 mr-2" />
              {t('list', language)}
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              onClick={() => setViewMode("map")}
              size="sm"
              className={viewMode === "map" ? 'text-white' : 'text-gray-700'}
              style={viewMode === "map" ? {
                background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
              } : {}}
            >
              <MapIcon className="w-4 h-4 mr-2" />
              {t('map', language)}
            </Button>
          </div>
        </div>

        {/* AI Recommendations Section */}
        {user && (
          <PersonalizedRecommendations user={user} />
        )}

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
            <Tabs value={activeTab} onValueChange={(val) => {
              if (val === 'adoption') {
                navigate(createPageUrl('AdoptionListings'));
              } else {
                setActiveTab(val);
              }
            }} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-3xl mx-auto mb-6 md:mb-8 h-auto md:h-14 bg-white/80 backdrop-blur-lg shadow-lg rounded-xl border-2 border-white/50 p-1 transition-colors">
                <TabsTrigger 
                  value="walkers" 
                  className={`text-xs md:text-sm font-semibold rounded-lg transition-all ${
                    activeTab === 'walkers' ? 'text-white' : 'text-gray-700'
                  }`}
                  style={{
                    background: activeTab === 'walkers' ? `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)` : 'transparent'
                  }}
                >
                  <Search className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  {t('findWalkers', language)}
                </TabsTrigger>
                
                <TabsTrigger 
                  value="adoption" 
                  className="text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all"
                >
                  <Heart className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  {t('adoptAPet', language)}
                </TabsTrigger>

                <TabsTrigger 
                  value="emergency" 
                  className="text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg transition-all"
                >
                  <Zap className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  {t('emergency', language)}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="walkers">
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                        {filterDogSitting !== "all" ? (
                          <>
                            {filterDogSitting === "boarding" && t('walkersWithBoarding', language)}
                            {filterDogSitting === "house_sitting" && t('walkersForHouseSitting', language)}
                            {filterDogSitting === "drop_in" && t('walkersForDropIn', language)}
                          </>
                        ) : (
                          t('availableWalkersTitle', language)
                        )}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <p className="text-xs md:text-base text-gray-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                          {filteredWalkers.length} {t('found', language)}
                        </p>
                        
                        {selectedServiceTypes.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
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
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
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
                        {filteredWalkers.some(w => w.distance !== null) && 
                         !(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                          <span className="text-purple-600 font-semibold ml-2">
                            ({t('sortedByDistance', language)})
                          </span>
                        )}
                      </div>
                    </div>
                    {filterDogSitting !== "all" && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilterDogSitting("all");
                          navigate(createPageUrl("Home"));
                        }}
                        className="text-sm"
                      >
                        {t('viewAll', language)}
                      </Button>
                    )}
                  </div>

                  {viewMode === "map" ? (
                    <div className="mb-6 h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
                      <React.Suspense fallback={<Skeleton className="w-full h-full" />}>
                        <InteractiveMap
                          walkers={filteredWalkers}
                          userLocation={userLocation}
                          radiusKm={advancedFilters.radius || 50}
                          onWalkerClick={(walker) => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
                        />
                      </React.Suspense>
                    </div>
                  ) : ( 
                    <>
                      {loadingWalkers ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                          {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={`walker-skeleton-${i}`} className="bg-white rounded-xl p-4 space-y-3 shadow-md">
                              <Skeleton className="w-full h-48 md:h-56 rounded-lg bg-gray-200" />
                              <Skeleton className="h-5 w-3/4 bg-gray-200" />
                              <Skeleton className="h-4 w-1/2 bg-gray-200" />
                            </div>
                          ))}
                        </div>
                      ) : filteredWalkers.length === 0 ? (
                        <Card className="border-0 shadow-xl py-12 md:py-16 text-center rounded-3xl overflow-hidden">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                            <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Não encontrámos nenhum Passeador com os filtros selecionados.</h3>
                          <p className="text-sm md:text-base text-gray-600 mb-4">Tente alargar o raio de busca ou remover alguns filtros.</p>

                          <div className="flex flex-wrap gap-2 justify-center mt-4">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                  resetAdvancedFilters();
                                  setSelectedServiceTypes([]);
                                  setSelectedSpecializations([]);
                                  setSearchLocation("");
                                  setFilterDogSitting("all");
                              }}
                              className="text-white hover:opacity-90"
                              style={{
                                background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
                              }}
                            >
                              Limpar Todos os Filtros
                            </Button>
                          </div>

                          {(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                            <div className="flex flex-wrap gap-2 justify-center mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedServiceTypes([])}
                                className="text-xs"
                              >
                                {t('clearServices', language)} ({selectedServiceTypes.length})
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSpecializations([])}
                                className="text-xs"
                              >
                                {t('clearSpecializations', language)} ({selectedSpecializations.length})
                              </Button>
                            </div>
                          )}
                        </Card>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 mb-8">
                            {paginatedWalkers.map((walker) => (
                              <WalkerCard 
                                key={walker.id} 
                                walker={walker}
                                distance={walker.distance}
                                matchScore={walker.matchScore}
                                showMatchScore={selectedServiceTypes.length > 0 || selectedSpecializations.length > 0}
                              />
                            ))}
                          </div>

                          {/* Pagination Controls */}
                          {filteredWalkers.length > itemsPerPage && (
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
                                  // Simple pagination logic for display
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
                                        background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
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
                            {t('showingResults', language)} {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredWalkers.length)} {t('of', language)} {filteredWalkers.length} {t('findWalkers', language)}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="adoption">
                <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>}>
                  <AdoptionListings isEmbedded={true} />
                </Suspense>
              </TabsContent>

              <TabsContent value="emergency">
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Zap className="w-6 h-6 md:w-7 md:h-7 text-orange-500" />
                        {t('dogsNeedingHelpTitle', language)}
                      </h2>
                      <p className="text-xs md:text-base text-gray-600 mt-1">
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
                        <Zap className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{t('noEmergencies', language)}</h3>
                      <p className="text-sm md:text-base text-gray-600">{t('checkBackLater', language)}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                      {filteredEmergencyWalks.map((walk) => (
                        <EmergencyDogCard key={walk.id} walk={walk} />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}