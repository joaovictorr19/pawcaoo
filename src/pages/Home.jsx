import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Zap, Star, Shield, Heart, TrendingUp, Users, Sliders, Award, Home as HomeIcon, PlusCircle, Calendar, MessageCircle, Clock, CheckCircle } from "lucide-react";
import WalkerCard from "../components/marketplace/WalkerCard";
import EmergencyDogCard from "../components/emergency/EmergencyDogCard";
import TrainerCard from "../components/trainers/TrainerCard";
import AdvancedWalkerFilters from "../components/search/AdvancedWalkerFilters";
import AdvancedTrainerFilters from "../components/search/AdvancedTrainerFilters";
import AdoptionListings from "./AdoptionListings";
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
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: upcomingWalk } = useQuery({
    queryKey: ['nextWalk', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const bookings = await base44.entities.Booking.filter({
        created_by: user.email,
        status: 'confirmed',
        walk_date: { '$gte': new Date().toISOString().split('T')[0] }
      }, 'walk_date', 1);
      return bookings[0];
    },
    enabled: !!user?.email,
  });

  const { data: walkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['walkers'],
    queryFn: () => base44.entities.WalkerProfile.filter({ is_active: true }, '-rating', 100),
    initialData: [],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: trainers, isLoading: loadingTrainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => base44.entities.TrainerProfile.filter({ is_active: true }, '-rating'),
    initialData: [],
  });

  const { data: emergencyWalks, isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: () => base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date', 20),
    initialData: [],
    staleTime: 30000,
  });

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

  const filteredWalkers = walkers
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

      const matchesRadius = !userLocation || isInServiceArea || (walker.distance !== null && walker.distance <= (advancedFilters.radius || 50));
      
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
          walker.services_offered?.some(s => 
            s.service_name?.toLowerCase().includes(type.replace('_', ' '))
          )
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

// Removed useEffect from here to fix hook order issue

  const filteredTrainers = trainers
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
        title={language === 'pt' ? 'Passeadores, Treinadores e Adoção de Pets' : 'Dog Walkers, Trainers & Pet Adoption'}
        description="Encontre passeadores de cães confiáveis, treinadores e pets para adoção em Portugal. A comunidade PawCão conecta donos de pets a profissionais verificados."
        schema={[generateWebSiteSchema(), generateOrganizationSchema()]}
      />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 z-0">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
          {user ? (
            <div className="grid md:grid-cols-2 gap-8 items-center relative z-20">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <PawCaoLogo size="small" showText={false} />
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">
                    Área do Cliente
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                  Olá, {user.full_name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-green-50 text-lg mb-8 max-w-md">
                  O que o seu pet precisa hoje? Estamos aqui para ajudar com passeios, companhia ou emergências.
                </p>
                
                {upcomingWalk ? (
                  <Card className="bg-white/10 border-white/20 backdrop-blur-md text-white p-4 max-w-md mb-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500 p-3 rounded-xl shadow-lg">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-100 font-medium uppercase tracking-wide">Próximo Passeio</p>
                        <h3 className="font-bold text-lg">{upcomingWalk.walk_date} às {upcomingWalk.walk_time}</h3>
                        <p className="text-sm text-green-50">com {upcomingWalk.walker_name}</p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="flex flex-wrap gap-3 mb-8">
                    <Button 
                      onClick={() => setActiveTab('walkers')} 
                      className="bg-white text-green-700 hover:bg-green-50 border-0 font-bold"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {t('findWalkerBtn', language)}
                    </Button>
                    <Button 
                      onClick={() => navigate(createPageUrl('OwnerDashboard'))} 
                      variant="outline" 
                      className="border-white text-white bg-transparent hover:bg-white/10 hover:text-white"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {t('myDashboard', language)}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setActiveTab('walkers')}>
                  <Card className="h-full bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all p-5 group">
                    <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                      <Search className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg mb-1">{t('findWalkers', language)}</h2>
                    <p className="text-sm text-gray-500">{t('homeSubtitle', language)}</p>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate(createPageUrl('AdoptionListings'))}>
                  <Card className="h-full bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all p-5 group">
                    <div className="bg-pink-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-pink-600 transition-colors">
                      <Heart className="w-6 h-6 text-pink-600 group-hover:text-white transition-colors" />
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg mb-1">{t('adoptAPet', language)}</h2>
                    <p className="text-sm text-gray-500">{t('helpFindHome', language)}</p>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setActiveTab('emergency')}>
                  <Card className="h-full bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all p-5 group">
                    <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors">
                      <Zap className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg mb-1">{t('emergency', language)}</h2>
                    <p className="text-sm text-gray-500">{t('dogsNeedingHelp', language)}</p>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate(createPageUrl('OwnerDashboard'))}>
                  <Card className="h-full bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-xl hover:shadow-2xl transition-all p-5 text-white">
                    <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="font-bold text-white text-lg mb-1">{t('myDashboard', language)}</h2>
                    <p className="text-sm text-blue-100">{t('yourCompleteDashboard', language)}</p>
                  </Card>
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-sm font-medium mb-6 border border-white/20">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                #1 Plataforma de Pet Services em Portugal
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-xl leading-tight">
                Passeadores, Treinadores e <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">Cuidados para o Seu Pet</span>
              </h1>
              
              <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto">
                {t('connectOwners', language)}
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-2xl p-4 max-w-3xl mx-auto flex flex-col md:flex-row gap-4 items-center"
              >
                <div className="flex-1 w-full">
                  <LocationSearch
                    onLocationChange={setUserLocation}
                    currentLocation={userLocation}
                    className="border-0 shadow-none bg-gray-50"
                  />
                </div>
                <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                <div className="w-full md:w-auto flex gap-2">
                  <Button 
                    size="lg" 
                    onClick={() => setActiveTab('walkers')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-8 shadow-lg shadow-green-600/20"
                  >
                    {t('findWalkerBtn', language)}
                  </Button>
                </div>
              </motion.div>

              <div className="mt-12 flex flex-wrap justify-center gap-6 text-white/80 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  {t('verifiedProfessionals', language)}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  {t('securePayment', language)}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  {t('support247', language)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

        <div className="grid lg:grid-cols-4 gap-6 mb-6">
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
                          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">{t('noWalkersFound', language)}</h3>
                          <p className="text-sm md:text-base text-gray-600 mb-4">{t('tryAdjustingFilters', language)}</p>
                          
                          {(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                            <div className="flex flex-wrap gap-2 justify-center mt-4">
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