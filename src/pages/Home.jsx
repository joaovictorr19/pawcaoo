import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Zap, Star, Shield, Heart, TrendingUp, Users, Sliders, Award, Home as HomeIcon, PlusCircle, Calendar, MessageCircle, Clock, CheckCircle, ShieldCheck, PlayCircle, StarHalf } from "lucide-react";
import WalkerCard from "../components/marketplace/WalkerCard";
import ReviewModal from "../components/reviews/ReviewModal";
import { LEVEL_THRESHOLDS } from "../components/gamification/gamificationRules";
import EmergencyDogCard from "../components/emergency/EmergencyDogCard";
import TrainerCard from "../components/trainers/TrainerCard";
import AdvancedWalkerFilters from "../components/search/AdvancedWalkerFilters";
import AdvancedTrainerFilters from "../components/search/AdvancedTrainerFilters";
import AdoptionListings from "./AdoptionListings";
import AISearchAssistant from "../components/ai/AISearchAssistant";
import PersonalizedRecommendations from "../components/ai/PersonalizedRecommendations";
import TestimonialsSection from "../components/home/TestimonialsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PawCaoLogo from "@/components/PawCaoLogo";
import { motion, AnimatePresence } from "framer-motion";
import LocationSearch, { calculateDistance } from "../components/search/LocationSearch";
const InteractiveMap = React.lazy(() => import("../components/search/InteractiveMap"));
import { Map as MapIcon, List, ChevronLeft, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import SEO from "../components/SEO";
import { generateWebSiteSchema, generateOrganizationSchema } from "../components/seoHelpers";
import LaunchBanner from "../components/marketing/LaunchBanner";

export default function Home() {
  const { language } = useLanguage();
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

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        console.error("Home auth error:", err);
        return null;
      }
    },
    retry: false,
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
        console.error("Active bookings fetch error:", error);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const getLevelInfo = (xp = 0) => {
      return LEVEL_THRESHOLDS.slice().reverse().find(t => xp >= t.min) || LEVEL_THRESHOLDS[0];
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

  const { data: walkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['walkers'],
    queryFn: async () => {
      try {
        const res = await base44.entities.WalkerProfile.filter({ is_active: true }, '-rating', 100);
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
        const res = await base44.entities.TrainerProfile.filter({ is_active: true }, '-rating');
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <SEO 
        title={t('seoTitle', language)}
        description={t('seoDescription', language)}
        schema={[generateWebSiteSchema(), generateOrganizationSchema()]}
      />
      <LaunchBanner />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 z-0">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
          {user ? (
            <div className="relative z-20">
              {/* Header Mobile Clean */}
              <div className="md:hidden flex items-center gap-3 mb-6 text-white">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <PawCaoLogo size="small" showText={false} />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold leading-tight">Olá, {user.full_name?.split(' ')[0]}!</h1>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-[10px]">
                    {getLevelInfo(user.gamification_xp).title} • {user.gamification_xp || 0} XP
                  </Badge>
                </div>
              </div>

              {/* Grid Layout 1x3 (Desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                
                {/* 1. Widget de Gamificação (Esquerda) */}
                <div className="hidden md:flex flex-col justify-between h-full text-white">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                        <PawCaoLogo size="small" showText={false} />
                      </div>
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                        Área do Cliente
                      </Badge>
                    </div>
                    <h1 className="text-4xl font-extrabold mb-2 leading-tight">
                      Olá, {user.full_name?.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-green-50 text-lg mb-6">
                      Seu centro de comando pet.
                    </p>
                  </div>

                  <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white p-5 mt-auto">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-green-200 uppercase font-bold tracking-wider">Nível Atual</p>
                        <h3 className="text-2xl font-bold text-yellow-300 flex items-center gap-2">
                          <Award className="w-6 h-6" />
                          {getLevelInfo(user.gamification_xp).title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-mono font-bold">{user.gamification_xp || 0}</p>
                        <p className="text-xs text-green-200">Total XP</p>
                      </div>
                    </div>
                    
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500" 
                        style={{ width: `${Math.min(((user.gamification_xp || 0) / 7500) * 100, 100)}%` }}
                      />
                    </div>

                    {(user.achievements_badges || user.public_badges) && (user.achievements_badges || user.public_badges).length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
                        {(user.achievements_badges || user.public_badges).slice(0, 3).map((badge, i) => (
                          <TooltipProvider key={i}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg border border-white/10 shadow-sm cursor-default">
                                  {badge.icon || '🏅'}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent><p>{badge.name}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>

                {/* 2. Painel de Status Dinâmico (Centro) */}
                <div className="flex flex-col justify-center">
                  {priorityData ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring" }}
                    >
                      {/* CASO A: Live Walk */}
                      {priorityData.type === 'live' && (
                        <Card className="bg-red-600/90 border-red-400/50 backdrop-blur-md text-white p-6 shadow-[0_0_30px_rgba(220,38,38,0.4)] relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20 animate-pulse"></div>
                          <div className="relative z-10 text-center">
                            <div className="inline-flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full text-xs font-bold mb-4 animate-bounce">
                              <div className="w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                              AO VIVO AGORA
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Passeio em Andamento!</h3>
                            <p className="text-red-100 mb-6 text-sm">
                              {priorityData.booking.walker_name} está a passear o {priorityData.booking.dog_name}.
                            </p>
                            <Button 
                              onClick={() => navigate(`/walk/live/${priorityData.booking.id}`)}
                              className="w-full bg-white text-red-600 hover:bg-red-50 font-bold h-12 text-lg shadow-lg"
                            >
                              <PlayCircle className="w-5 h-5 mr-2" />
                              Acompanhar ao Vivo
                            </Button>
                          </div>
                        </Card>
                      )}

                      {/* CASO B: Review Pendente */}
                      {priorityData.type === 'review' && (
                        <Card className="bg-orange-500/90 border-orange-300/50 backdrop-blur-md text-white p-6 shadow-xl relative overflow-hidden">
                          <div className="relative z-10 text-center">
                            <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                              <StarHalf className="w-6 h-6 text-yellow-300" />
                            </div>
                            <h3 className="text-xl font-bold mb-1">Passeio Concluído!</h3>
                            <p className="text-orange-100 mb-4 text-sm">
                              Como foi a experiência com {priorityData.booking.walker_name}?
                            </p>
                            <Button 
                              onClick={() => setReviewBooking(priorityData.booking)}
                              className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold h-10 shadow-md"
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Deixar Review
                            </Button>
                          </div>
                        </Card>
                      )}

                      {/* CASO C: Próximo Evento */}
                      {priorityData.type === 'next' && (
                        <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white p-6 shadow-xl">
                          <div className="flex items-start gap-4">
                            <div className="bg-green-500 p-3 rounded-xl shadow-lg shrink-0">
                              <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-green-200 font-bold uppercase tracking-wide mb-1">Próximo Agendamento</p>
                              <h3 className="font-bold text-xl leading-tight mb-1">
                                {priorityData.booking.walk_date} às {priorityData.booking.walk_time}
                              </h3>
                              <p className="text-sm text-green-100 mb-3">
                                com {priorityData.booking.walker_name}
                              </p>
                              {priorityData.booking.pickup_address && (
                                <div className="flex items-center gap-2 text-xs bg-black/20 p-2 rounded-lg">
                                  <MapPin className="w-3 h-3 text-green-300" />
                                  <span className="truncate max-w-[180px]">{priorityData.booking.pickup_address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )}
                    </motion.div>
                  ) : (
                    // Fallback se não houver nada urgente
                    <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white p-6 text-center">
                      <div className="mb-4 bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-white/80" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">Vamos agendar algo?</h3>
                      <p className="text-sm text-white/70 mb-4">Seu pet merece um passeio hoje!</p>
                      <Button 
                        onClick={() => {
                          setActiveTab('walkers');
                          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 border-0"
                      >
                        Encontrar Passeador
                      </Button>
                    </Card>
                  )}
                </div>

                {/* 3. Ações Rápidas (Direita) */}
                <div className="flex flex-col gap-4 justify-center">
                  <motion.div whileHover={{ scale: 1.02 }} onClick={() => {
                    setActiveTab('walkers');
                    document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                  }} className="cursor-pointer">
                    <Card className="bg-white/90 hover:bg-white backdrop-blur-md border-0 p-4 shadow-lg group transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-xl group-hover:bg-green-600 transition-colors">
                          <Search className="w-6 h-6 text-green-600 group-hover:text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{t('findWalkers', language)}</h3>
                          <p className="text-xs text-gray-500">Buscar profissionais perto de si</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} onClick={() => navigate(createPageUrl('Inbox'))} className="cursor-pointer">
                    <Card className="bg-white/90 hover:bg-white backdrop-blur-md border-0 p-4 shadow-lg group transition-all">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-xl group-hover:bg-blue-600 transition-colors">
                          <MessageCircle className="w-6 h-6 text-blue-600 group-hover:text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Mensagens & Suporte</h3>
                          <p className="text-xs text-gray-500">Fale com passeadores ou suporte</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} onClick={() => navigate(createPageUrl('OwnerDashboard'))} className="cursor-pointer">
                    <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 border-0 p-4 shadow-lg text-white">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white">Dashboard Completo</h3>
                          <p className="text-xs text-blue-100">Ver estatísticas e histórico</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-sm font-medium mb-6 border border-white/20 animate-fade-in">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                #1 Plataforma de Pet Services em Portugal
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-xl leading-tight">
                {t('homeTitle', language)}
              </h1>

              <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto font-medium">
                Passeadores verificados, treinadores experientes e muito carinho.
                Comece agora mesmo a sua busca.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl mx-auto flex flex-col gap-4 border-4 border-white/20 bg-clip-padding"
              >
                <h3 className="text-gray-800 font-bold text-lg text-left mb-1 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Onde procura um Walker?
                </h3>
                <div className="flex flex-col md:flex-row gap-4 items-center w-full">
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
                  <div className="w-full md:w-auto flex gap-2">
                    <Button 
                      id="find-walker-btn"
                      size="lg" 
                      onClick={() => {
                        setActiveTab('walkers');
                        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-14 px-8 shadow-lg shadow-green-600/20 text-lg rounded-xl transition-transform hover:scale-105"
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

              <div className="mt-12 flex flex-wrap justify-center gap-8 text-white font-semibold">
                <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-default">
                  <div className="bg-green-500 p-1 rounded-full">
                     <Shield className="w-4 h-4 text-white" />
                  </div>
                  {t('verifiedProfessionals', language)}
                </div>
                <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-default">
                  <div className="bg-green-500 p-1 rounded-full">
                     <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  {t('securePayment', language)}
                </div>
                <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-default">
                  <div className="bg-green-500 p-1 rounded-full">
                     <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  {t('support247', language)}
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

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-10">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="border-2 border-green-200 hover:bg-green-50"
          >
            <Sliders className="w-4 h-4 mr-2" />
            {showAdvancedFilters ? t('hideAdvancedFilters', language) : t('showAdvancedFilters', language)}
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              size="sm"
            >
              <List className="w-4 h-4 mr-2" />
              {t('list', language)}
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              onClick={() => setViewMode("map")}
              size="sm"
              className={`bg-gradient-to-r from-green-600 to-emerald-600 text-white ${viewMode === "map" ? 'opacity-100' : 'opacity-80 hover:opacity-90'} `}
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
                  className="text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-lg transition-all"
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
                        <Card className="border-0 shadow-xl py-12 md:py-16 text-center">
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
                              className="bg-green-600 hover:bg-green-700 text-white"
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
                                className="border-green-200 hover:bg-green-50 hover:text-green-700"
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
                                          ? 'bg-green-600 text-white hover:bg-green-700' 
                                          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                                      }`}
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
                                className="border-green-200 hover:bg-green-50 hover:text-green-700"
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
                <AdoptionListings isEmbedded={true} />
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