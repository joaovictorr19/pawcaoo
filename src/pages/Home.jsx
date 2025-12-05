import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card"; // Added import for Card
import { Search, MapPin, Zap, Star, Shield, Heart, TrendingUp, Users, Sliders, Award, Home as HomeIcon, PlusCircle, Calendar, MessageCircle, Clock, CheckCircle } from "lucide-react";
import WalkerCard from "../components/marketplace/WalkerCard";
import EmergencyDogCard from "../components/emergency/EmergencyDogCard";
import TrainerCard from "../components/trainers/TrainerCard";
import AdvancedWalkerFilters from "../components/search/AdvancedWalkerFilters";
import AdvancedTrainerFilters from "../components/search/AdvancedTrainerFilters";
import AdoptionListings from "./AdoptionListings"; // Import full Adoption page component for reuse
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PawCaoLogo from "@/components/PawCaoLogo";
import { motion, AnimatePresence } from "framer-motion";
import LocationSearch, { calculateDistance } from "../components/search/LocationSearch";
import InteractiveMap from "../components/search/InteractiveMap";
import { Map as MapIcon, List } from "lucide-react";
import { Label } from "@/components/ui/label"; // NEW
import { Badge } from "@/components/ui/badge"; // NEW
import SEO from "../components/SEO";

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
  
  // NOVO: Filtros principais de serviços e especializações
  const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    radius: 50,
    languages: [],
    specializations: [],
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

  // State for Trainer Filters
  const [trainerFilters, setTrainerFilters] = useState({
    specialties: [],
    methodologies: [],
    consultationTypes: [],
    minExperience: 0,
    minRating: 0,
    verifiedOnly: false,
    availableDate: null
  });

  // Active Tab State (moved from Tabs to managed state for better control)
  const [activeTab, setActiveTab] = useState("walkers");

  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "map"

  // Check authentication
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Quick stats for logged in user (Efficiency)
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
    queryFn: async () => {
      const allWalkers = await base44.entities.WalkerProfile.list('-rating', 100);
      
      console.log('🔍 HOME - TODOS OS PASSEADORES:', {
        total: allWalkers.length,
        walkers: allWalkers.map(w => ({
          name: w.walker_name,
          is_active: w.is_active,
          verification_status: w.verification_status,
          created_by: w.created_by
        }))
      });

      // Filtrar APENAS ativos E verificados
      const active = allWalkers.filter(w => 
        w.is_active === true && w.verification_status === 'verified'
      );
      
      console.log('✅ PASSEADORES ATIVOS E VERIFICADOS:', {
        count: active.length,
        walkers: active.map(w => w.walker_name)
      });
      
      return active;
    },
    initialData: [],
    // enabled: true, // Always fetch
    staleTime: 0, // ZERO CACHE
    refetchOnMount: 'always',
  });

  // Fetch Trainers
  const { data: trainers, isLoading: loadingTrainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => base44.entities.TrainerProfile.filter({ is_active: true }, '-rating'),
    initialData: [],
    // enabled: true, 
  });

  const { data: emergencyWalks, isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: () => base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date', 20), // Added limit
    initialData: [],
    // enabled: true,
    staleTime: 30000,
  });

  // Update filter when URL param changes
  useEffect(() => {
    if (dogSittingServiceFilter) {
      setFilterDogSitting(dogSittingServiceFilter);
    }
  }, [dogSittingServiceFilter]);

  // Show loading while checking auth
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

  // If not logged in, redirect to landing
  // if (!user) {
  //   navigate(createPageUrl("Landing"), { replace: true });
  //   return null;
  // }

  // Distance calculation using actual coordinates
  const getWalkerDistance = (walker) => {
    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      return null;
    }
    
    // Assume walker has coordinates in service_areas or location
    // For demo, we'll use a simplified approach or default to Lisbon if coordinates aren't explicitly in the walker object.
    // In production, you'd store lat/lng directly in the walker profile or fetch from their service_areas.
    const walkerLat = walker.latitude || 38.7223; // Default to Lisbon if not set
    const walkerLng = walker.longitude || -9.1393;
    
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      walkerLat,
      walkerLng
    );
  };

  // Calculate distance for trainer (similar to walker)
  const getTrainerDistance = (trainer) => {
    if (!userLocation || !userLocation.lat || !userLocation.lng) return null;
    // Assuming trainer has coordinates or defaulting to Lisbon
    const trainerLat = trainer.latitude || 38.7223;
    const trainerLng = trainer.longitude || -9.1393;
    
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      trainerLat,
      trainerLng
    );
  };

  // NOVO: Função de cálculo de match score
  const calculateMatchScore = (walker) => {
    let score = 0;
    let totalPossibleScore = 0;

    // Service Types Match (weight: 40 points)
    if (selectedServiceTypes.length > 0) {
      totalPossibleScore += 40;
      const matchedServices = selectedServiceTypes.filter(type =>
        walker.services_offered?.some(s =>
          s.service_name?.toLowerCase().includes(type.toLowerCase().replace('_', ' '))
        )
      );
      if (selectedServiceTypes.length > 0) { // Avoid division by zero
        score += (matchedServices.length / selectedServiceTypes.length) * 40;
      }
    }

    // Specializations Match (weight: 30 points)
    if (selectedSpecializations.length > 0) {
      totalPossibleScore += 30;
      const matchedSpecs = selectedSpecializations.filter(spec =>
        walker.specializations?.includes(spec)
      );
      if (selectedSpecializations.length > 0) { // Avoid division by zero
        score += (matchedSpecs.length / selectedSpecializations.length) * 30;
      }
    }

    // General Quality Metrics (always contribute to score and totalPossibleScore)
    // Rating (weight: 15 points)
    totalPossibleScore += 15;
    score += ((walker.rating || 0) / 5) * 15;

    // Experience (weight: 10 points)
    totalPossibleScore += 10;
    score += Math.min(((walker.experience_years || 0) / 10), 1) * 10; // Cap experience at 10 years for score calculation

    // Verification Status (weight: 5 points)
    totalPossibleScore += 5;
    if (walker.verification_status === 'verified') score += 5;

    if (totalPossibleScore === 0) return 0; // Should not happen if general quality metrics always contribute

    return Math.round((score / totalPossibleScore) * 100);
  };

  const filteredWalkers = walkers
    .map(walker => ({
      ...walker,
      distance: getWalkerDistance(walker),
      matchScore: calculateMatchScore(walker)
    }))
    .filter(walker => {
      const matchesLocation = !searchLocation || 
        walker.location?.toLowerCase().includes(searchLocation.toLowerCase());
      const matchesSize = filterSize === "all" || 
        walker.dog_sizes?.includes(filterSize);
      const matchesTime = filterTime === "all" || 
        walker.availability?.includes(filterTime);
      const matchesAvailability = filterAvailability === "all" || filterAvailability === "available";
      
      // Dog Sitting Service Filter
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
      
      // MELHORADO: Service Types - Match mais inteligente (Quick filter)
      const matchesServiceTypesQuick = selectedServiceTypes.length === 0 ||
        selectedServiceTypes.every(type =>
          walker.services_offered?.some(s =>
            s.service_name?.toLowerCase().includes(type.toLowerCase().replace('_', ' ')) ||
            type.toLowerCase().replace('_', ' ').includes(s.service_name?.toLowerCase())
          )
        );

      // MELHORADO: Specializations - Match exato (Quick filter)
      const matchesSpecializationsQuick = selectedSpecializations.length === 0 ||
        selectedSpecializations.every(spec =>
          walker.specializations?.includes(spec)
        );

      // Advanced filters - Distance
      const matchesRadius = !userLocation || walker.distance === null || 
        walker.distance <= (advancedFilters.radius || 50);
      
      // Languages filter
      const matchesLanguages = !advancedFilters.languages || advancedFilters.languages.length === 0 ||
        advancedFilters.languages.some(lang => walker.languages_spoken?.includes(lang));
      
      // Advanced Specializations (do filtro avançado)
      const matchesAdvancedSpecializations = !advancedFilters.specializations || advancedFilters.specializations.length === 0 ||
        advancedFilters.specializations.some(spec => walker.specializations?.includes(spec));
      
      // Certifications filter
      const matchesCertifications = !advancedFilters.certifications || advancedFilters.certifications.length === 0 ||
        advancedFilters.certifications.some(cert => 
          walker.certifications_detailed?.some(wCert => 
            wCert.name?.toLowerCase().includes(cert.toLowerCase())
          )
        );
      
      // Advanced Service Types (do filtro avançado)
      const matchesAdvancedServiceTypes = !advancedFilters.serviceTypes || advancedFilters.serviceTypes.length === 0 ||
        advancedFilters.serviceTypes.some(type => 
          walker.services_offered?.some(s => 
            s.service_name?.toLowerCase().includes(type.replace('_', ' '))
          )
        );
      
      // Time Slots filter
      const matchesTimeSlots = !advancedFilters.timeSlots || advancedFilters.timeSlots.length === 0 ||
        advancedFilters.timeSlots.some(slot => walker.availability?.includes(slot));
      
      // Date availability filter
      const matchesDate = !advancedFilters.availableDate; // TODO: Check calendar availability
      
      // Experience, rating, price
      const matchesExperience = (walker.experience_years || 0) >= (advancedFilters.minExperience || 0);
      const matchesRating = (walker.rating || 0) >= (advancedFilters.minRating || 0);
      const matchesPrice = (walker.hourly_rate || 0) >= (advancedFilters.minPrice || 0) && 
                           (walker.hourly_rate || 0) <= (advancedFilters.maxPrice || 100);
      
      // Verification filters
      const matchesBackgroundCheck = !advancedFilters.backgroundCheck || 
                                     walker.background_check_status === 'verified';
      
      const matchesVerifiedOnly = !advancedFilters.verifiedOnly ||
                                   walker.verification_status === 'verified';
      
      const matchesInstantBooking = !advancedFilters.instantBooking ||
                                     walker.instant_booking === true;
      
      return matchesLocation && matchesSize && matchesTime && matchesAvailability &&
             matchesDogSitting && matchesServiceTypesQuick && matchesSpecializationsQuick &&
             matchesRadius && matchesLanguages && matchesAdvancedSpecializations &&
             matchesCertifications && matchesAdvancedServiceTypes && matchesTimeSlots && matchesDate &&
             matchesExperience && matchesRating && matchesPrice && matchesBackgroundCheck &&
             matchesVerifiedOnly && matchesInstantBooking;
    })
    .sort((a, b) => {
      // NOVO: Ordenar por match score se há filtros de serviços/especializações
      if (selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) {
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore; // Maior score primeiro
        }
      }

      // Sort by distance if user location is available and distances are calculated
      if (userLocation && a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      
      // Otherwise sort by rating (descending)
      return (b.rating || 0) - (a.rating || 0);
    });

  const filteredEmergencyWalks = emergencyWalks.filter(walk => {
    const matchesLocation = !searchLocation || 
      walk.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSize = filterSize === "all" || walk.dog_size === filterSize;
    
    return matchesLocation && matchesSize;
  });

  // Filtered Trainers Logic
  const filteredTrainers = trainers
    .map(trainer => ({
      ...trainer,
      distance: getTrainerDistance(trainer)
    }))
    .filter(trainer => {
      // Text Search (Location or Name)
      const matchesSearch = !searchLocation ||
        trainer.location?.toLowerCase().includes(searchLocation.toLowerCase()) ||
        trainer.trainer_name?.toLowerCase().includes(searchLocation.toLowerCase());

      // Quick Filters (reusing some state variables for simplicity, or could add dedicated ones)
      // For now, using advanced filters primarily
      
      // Advanced Filters
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
      
      // Distance Filter (using the same radius as walkers for consistency in UX)
      const matchesRadius = !userLocation || trainer.distance === null || 
        trainer.distance <= (advancedFilters.radius || 50);

      return matchesSearch && matchesSpecialties && matchesMethodologies && 
             matchesConsultation && matchesExperience && matchesRating && 
             matchesVerified && matchesRadius;
    })
    .sort((a, b) => {
      // Sort by distance if available
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

  const stats = [
    { icon: Users, value: walkers.length, label: "Profissionais", color: "from-blue-500 to-blue-600" },
    { icon: Star, value: "4.9", label: "Rating", color: "from-yellow-500 to-yellow-600" },
    { icon: Shield, value: "100%", label: "Seguro", color: "from-green-500 to-green-600" },
    { icon: Heart, value: "50k+", label: "Pets", color: "from-pink-500 to-pink-600" }
  ];

  // Function to get Tailwind color classes dynamically
  const getServiceBadgeClasses = (color, isSelected) => {
    let classes = "cursor-pointer transition-all hover:scale-105 ";
    if (isSelected) {
      classes += `bg-${color}-600 text-white border-${color}-600`;
    } else {
      classes += `border-${color}-300 hover:bg-${color}-50 text-gray-700`;
    }
    return classes;
  };

  const quickServiceTypes = [
    { id: "regular_walks", label: "Passeios", icon: "🚶", color: "blue" },
    { id: "boarding", label: "Alojamento", icon: "🏠", color: "purple" },
    { id: "house_sitting", label: "Casa-Sitting", icon: "🏡", color: "green" },
    { id: "drop_in", label: "Visitas", icon: "🚪", color: "orange" },
    { id: "training", label: "Treino", icon: "🎓", color: "indigo" },
    { id: "grooming", label: "Grooming", icon: "✂️", color: "pink" },
  ];

  const quickSpecializations = [
    { id: "puppies", label: "Filhotes", icon: "🐶" },
    { id: "senior_dogs", label: "Idosos", icon: "🦴" },
    { id: "large_breeds", label: "Grandes", icon: "🐕" },
    { id: "small_breeds", label: "Pequenos", icon: "🐩" },
    { id: "reactive_dogs", label: "Reativos", icon: "⚡" },
    { id: "anxious_dogs", label: "Ansiosos", icon: "😰" },
  ];

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
      />
      {/* Smart Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background with pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-teal-600 to-blue-600 z-0">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16">
          {user ? (
            // LOGGED IN VIEW - Dashboard Lite
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
                      Encontrar Passeador
                    </Button>
                    <Button 
                      onClick={() => navigate(createPageUrl('OwnerDashboard'))} 
                      variant="outline" 
                      className="border-white text-white bg-transparent hover:bg-white/10 hover:text-white"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Meu Painel
                    </Button>
                  </div>
                )}
              </div>

              {/* Quick Actions Grid for User */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setActiveTab('walkers')}>
                  <Card className="h-full bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all p-5 group">
                    <div className="bg-green-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                      <Search className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Passeadores</h3>
                    <p className="text-sm text-gray-500">Encontre profissionais verificados perto de você.</p>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate(createPageUrl('AdoptionListings'))}>
                  <Card className="h-full bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all p-5 group">
                    <div className="bg-pink-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-pink-600 transition-colors">
                      <Heart className="w-6 h-6 text-pink-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Adotar</h3>
                    <p className="text-sm text-gray-500">Dê um lar para um pet que precisa de amor.</p>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => setActiveTab('emergency')}>
                  <Card className="h-full bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all p-5 group">
                    <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-600 transition-colors">
                      <Zap className="w-6 h-6 text-orange-600 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-1">Emergência</h3>
                    <p className="text-sm text-gray-500">Precisa de ajuda agora? Publique um alerta.</p>
                  </Card>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer" onClick={() => navigate(createPageUrl('OwnerDashboard'))}>
                  <Card className="h-full bg-gradient-to-br from-blue-500 to-indigo-600 border-0 shadow-xl hover:shadow-2xl transition-all p-5 text-white">
                    <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-1">Meu Painel</h3>
                    <p className="text-sm text-blue-100">Gerencie reservas, pets e pagamentos.</p>
                  </Card>
                </motion.div>
              </div>
            </div>
          ) : (
            // VISITOR VIEW - Landing Page Style
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-sm font-medium mb-6 border border-white/20">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                #1 Plataforma de Pet Services em Portugal
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-xl leading-tight">
                O Melhor Cuidado para o <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">Seu Melhor Amigo</span>
              </h1>
              
              <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto">
                Conectamos donos de pets a passeadores, treinadores e veterinários de confiança. 
                Seguro, rápido e com muito amor.
              </p>

              {/* Unified Search Bar */}
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
                    Buscar Passeador
                  </Button>
                </div>
              </motion.div>

              {/* Trust Indicators */}
              <div className="mt-12 flex flex-wrap justify-center gap-6 text-white/80 text-sm font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  Profissionais Verificados
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  Pagamento Seguro
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  Suporte 24/7
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-10">
        {/* View Mode Toggle */}
        <div className="flex justify-between items-center mb-4">
          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="border-2 border-green-200 hover:bg-green-50"
          >
            <Sliders className="w-4 h-4 mr-2" />
            {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} Filtros Avançados
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              size="sm"
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              onClick={() => setViewMode("map")}
              size="sm"
              className={`bg-gradient-to-r from-green-600 to-emerald-600 text-white ${viewMode === "map" ? 'opacity-100' : 'opacity-80 hover:opacity-90'} `}
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Mapa
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
                  />
                ) : activeTab === 'trainers' ? (
                  <AdvancedTrainerFilters
                    filters={trainerFilters}
                    onFiltersChange={setTrainerFilters}
                    onReset={resetTrainerFilters}
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
                  Passeadores
                </TabsTrigger>
                
                <TabsTrigger 
                  value="adoption" 
                  className="text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all"
                >
                  <Heart className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  Adotar
                </TabsTrigger>

                <TabsTrigger 
                  value="emergency" 
                  className="text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg transition-all"
                >
                  <Zap className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  Emergência
                </TabsTrigger>
              </TabsList>

              {/* Regular Walkers Tab */}
              <TabsContent value="walkers">
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                        {filterDogSitting !== "all" ? (
                          <>
                            {filterDogSitting === "boarding" && (language === 'pt' ? 'Passeadores com Alojamento' : language === 'es' ? 'Paseadores con Alojamento' : 'Walkers with Boarding')}
                            {filterDogSitting === "house_sitting" && (language === 'pt' ? 'Passeadores para Casa-Sitting' : language === 'es' ? 'Paseadores para Cuidado en Casa' : 'Walkers for House Sitting')}
                            {filterDogSitting === "drop_in" && (language === 'pt' ? 'Passeadores para Visitas' : language === 'es' ? 'Paseadores para Visitas' : 'Walkers for Drop-in Visits')}
                          </>
                        ) : (
                          language === 'pt' ? 'Passeadores Disponíveis' : language === 'es' ? 'Paseadores Disponibles' : 'Available Walkers'
                        )}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <p className="text-xs md:text-base text-gray-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                          {filteredWalkers.length} {language === 'pt' ? 'encontrados' : language === 'es' ? 'encontrados' : 'found'}
                        </p>
                        
                        {/* NOVO: Active Filters Display */}
                        {selectedServiceTypes.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {selectedServiceTypes.length} serviço{selectedServiceTypes.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {selectedSpecializations.length > 0 && (
                          <Badge className="bg-purple-100 text-purple-800 text-xs">
                            {selectedSpecializations.length} especialização{selectedSpecializations.length > 1 ? 'ões' : ''}
                          </Badge>
                        )}
                        
                        {/* NOVO: Sort indicator */}
                        {(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            📊 Ordenado por Match
                          </Badge>
                        )}
                        
                        {filterDogSitting !== "all" && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {filterDogSitting === "boarding" && "🏠 Alojamento"}
                            {filterDogSitting === "house_sitting" && "🏡 Casa-Sitting"}
                            {filterDogSitting === "drop_in" && "🚪 Visitas"}
                          </span>
                        )}
                        {showAdvancedFilters && advancedFilters.radius < 50 && userLocation && (
                          <span className="text-purple-600 font-semibold ml-2">
                            ({language === 'pt' ? 'até' : language === 'es' ? 'hasta' : 'up to'} {advancedFilters.radius}km)
                          </span>
                        )}
                        {filteredWalkers.some(w => w.distance !== null) && 
                         !(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                          <span className="text-purple-600 font-semibold ml-2">
                            ({language === 'pt' ? 'ordenado por distância' : language === 'es' ? 'ordenado por distancia' : 'sorted by distance'})
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
                        {language === 'pt' ? 'Ver Todos' : language === 'es' ? 'Ver Todos' : 'View All'}
                      </Button>
                    )}
                  </div>

                  {/* Map View */}
                  {viewMode === "map" ? (
                    <div className="mb-6 h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
                      <InteractiveMap
                        walkers={filteredWalkers}
                        userLocation={userLocation}
                        radiusKm={advancedFilters.radius || 50}
                        onWalkerClick={(walker) => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
                      />
                    </div>
                  ) : ( // List View
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
                          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Nenhum passeador encontrado</h3>
                          <p className="text-sm md:text-base text-gray-600 mb-4">Tente ajustar os filtros</p>
                          
                          {/* NOVO: Reset suggestions */}
                          {(selectedServiceTypes.length > 0 || selectedSpecializations.length > 0) && (
                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedServiceTypes([])}
                                className="text-xs"
                              >
                                Limpar Serviços ({selectedServiceTypes.length})
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSpecializations([])}
                                className="text-xs"
                              >
                                Limpar Especializações ({selectedSpecializations.length})
                              </Button>
                            </div>
                          )}
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                          {filteredWalkers.map((walker) => (
                            <WalkerCard 
                              key={walker.id} 
                              walker={walker}
                              distance={walker.distance}
                              matchScore={walker.matchScore}
                              showMatchScore={selectedServiceTypes.length > 0 || selectedSpecializations.length > 0}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Adoption Tab */}
              <TabsContent value="adoption">
                <AdoptionListings isEmbedded={true} />
              </TabsContent>

              {/* Emergency Walks Tab */}
              <TabsContent value="emergency">
                <div>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Zap className="w-6 h-6 md:w-7 md:h-7 text-orange-500" />
                        Cães Precisando Urgente
                      </h2>
                      <p className="text-xs md:text-base text-gray-600 mt-1">
                        {filteredEmergencyWalks.length} cães precisam de ajuda
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
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Sem emergências no momento</h3>
                      <p className="text-sm md:text-base text-gray-600">Verifique mais tarde</p>
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