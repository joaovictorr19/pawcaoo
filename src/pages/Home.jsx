
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card"; // Added import for Card
import { Search, MapPin, Zap, Star, Shield, Heart, TrendingUp, Users, Sliders } from "lucide-react";
import WalkerCard from "../components/marketplace/WalkerCard";
import EmergencyDogCard from "../components/emergency/EmergencyDogCard";
import AdvancedWalkerFilters from "../components/search/AdvancedWalkerFilters";
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    radius: 50,
    languages: [],
    specializations: [],
    certifications: [], // Added for new filter
    serviceTypes: [],   // Added for new filter
    timeSlots: [],      // Added for new filter
    availableDate: null, // Added for new filter
    minExperience: 0,
    minRating: 0,
    minPrice: 0,
    maxPrice: 100,
    backgroundCheck: false,
    verifiedOnly: false, // Added for new filter
    instantBooking: false // Added for new filter
  });
  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" or "map"

  // Check authentication
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: walkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['walkers'],
    queryFn: () => base44.entities.WalkerProfile.filter({ is_active: true }, '-rating', 50), // Added limit
    initialData: [],
    enabled: !!user,
    staleTime: 60000,
  });

  const { data: emergencyWalks, isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: () => base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date', 20), // Added limit
    initialData: [],
    enabled: !!user,
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
  if (!user) {
    navigate(createPageUrl("Landing"), { replace: true });
    return null;
  }

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

  const filteredWalkers = walkers
    .map(walker => ({
      ...walker,
      distance: getWalkerDistance(walker)
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
      
      // Advanced filters - Distance
      const matchesRadius = !userLocation || walker.distance === null || 
        walker.distance <= (advancedFilters.radius || 50);
      
      // Languages filter
      const matchesLanguages = !advancedFilters.languages || advancedFilters.languages.length === 0 ||
        advancedFilters.languages.some(lang => walker.languages_spoken?.includes(lang));
      
      // Specializations filter
      const matchesSpecializations = !advancedFilters.specializations || advancedFilters.specializations.length === 0 ||
        advancedFilters.specializations.some(spec => walker.specializations?.includes(spec));
      
      // Certifications filter
      const matchesCertifications = !advancedFilters.certifications || advancedFilters.certifications.length === 0 ||
        advancedFilters.certifications.some(cert => 
          walker.certifications_detailed?.some(wCert => 
            wCert.name?.toLowerCase().includes(cert.toLowerCase())
          )
        );
      
      // Service Types filter
      const matchesServiceTypes = !advancedFilters.serviceTypes || advancedFilters.serviceTypes.length === 0 ||
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
             matchesDogSitting && matchesRadius && matchesLanguages && matchesSpecializations &&
             matchesCertifications && matchesServiceTypes && matchesTimeSlots && matchesDate &&
             matchesExperience && matchesRating && matchesPrice && matchesBackgroundCheck &&
             matchesVerifiedOnly && matchesInstantBooking;
    })
    .sort((a, b) => {
      // Sort by distance if user location is available and distances are calculated
      if (userLocation && a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      // Otherwise sort by rating (descending)
      return b.rating - a.rating;
    });

  const filteredEmergencyWalks = emergencyWalks.filter(walk => {
    const matchesLocation = !searchLocation || 
      walk.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSize = filterSize === "all" || walk.dog_size === filterSize;
    
    return matchesLocation && matchesSize;
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

  const stats = [
    { icon: Users, value: walkers.length, label: "Profissionais", color: "from-blue-500 to-blue-600" },
    { icon: Star, value: "4.9", label: "Rating", color: "from-yellow-500 to-yellow-600" },
    { icon: Shield, value: "100%", label: "Seguro", color: "from-green-500 to-green-600" },
    { icon: Heart, value: "50k+", label: "Pets", color: "from-pink-500 to-pink-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Simplified Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 via-green-500 to-blue-600 backdrop-blur-sm py-8 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 md:mb-10">
            {/* Simple Logo */}
            <div className="flex justify-center mb-6">
              <PawCaoLogo size="large" />
            </div>

            <div className="inline-block mb-3 md:mb-4">
              <span className="px-3 py-1 md:px-4 md:py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs md:text-sm font-semibold border border-white/30 shadow-lg">
                🐕 #1 em Portugal
              </span>
            </div>
            
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 md:mb-5 leading-tight px-2 drop-shadow-lg">
              Encontre o{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300">
                Passeador Perfeito
              </span>
              <br className="hidden md:block" />
              <span className="block md:inline"> Para o Seu Pet</span>
            </h1>
            
            <p className="text-sm md:text-xl text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Profissionais verificados e apaixonados por cães. 🐾
            </p>

            {/* Simple Stats */}
            <div className="grid grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-10 max-w-4xl mx-auto">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg"
                >
                  <div className={`w-6 h-6 md:w-10 md:h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 shadow-lg`}>
                    <stat.icon className="w-3 h-3 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="text-lg md:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] md:text-xs text-white/80 truncate">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Simple Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative max-w-5xl mx-auto"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-3 md:p-6 border border-white/50">
              <div className="flex flex-col gap-2 md:gap-3">
                {/* Location Search with Geolocation */}
                <LocationSearch
                  onLocationChange={setUserLocation}
                  currentLocation={userLocation}
                />
                
                {/* Filters */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Select value={filterSize} onValueChange={setFilterSize}>
                    <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm border-2 border-transparent focus:border-green-500 rounded-xl bg-white">
                      <SelectValue placeholder="Tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                      <SelectItem value="extra_large">XL</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterTime} onValueChange={setFilterTime}>
                    <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm border-2 border-transparent focus:border-green-500 rounded-xl bg-white">
                      <SelectValue placeholder="Horário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Qualquer</SelectItem>
                      <SelectItem value="morning">Manhã</SelectItem>
                      <SelectItem value="afternoon">Tarde</SelectItem>
                      <SelectItem value="evening">Noite</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterAvailability} onValueChange={setFilterAvailability} className="col-span-2 md:col-span-1">
                    <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm border-2 border-transparent focus:border-green-500 rounded-xl bg-white">
                      <SelectValue placeholder="Disponível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="available">Disponíveis</SelectItem>
                      <SelectItem value="unavailable">Indisponíveis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
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
              className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white ${viewMode === "map" ? 'opacity-100' : 'opacity-80 hover:opacity-90'} `}
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
                <AdvancedWalkerFilters
                  filters={advancedFilters}
                  onFiltersChange={setAdvancedFilters}
                  onReset={resetAdvancedFilters}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className={showAdvancedFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            <Tabs defaultValue="walkers" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 h-12 md:h-14 bg-white/80 backdrop-blur-lg shadow-lg rounded-xl border-2 border-white/50 p-1 transition-colors">
                <TabsTrigger 
                  value="walkers" 
                  className="text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-lg transition-all"
                >
                  <Search className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  Buscar Passeadores
                </TabsTrigger>
                <TabsTrigger 
                  value="emergency" 
                  className="text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg transition-all"
                >
                  <Zap className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
                  Passeios Urgentes
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
                            {filterDogSitting === "boarding" && (language === 'pt' ? 'Passeadores com Alojamento' : language === 'es' ? 'Paseadores con Alojamiento' : 'Walkers with Boarding')}
                            {filterDogSitting === "house_sitting" && (language === 'pt' ? 'Passeadores para Casa-Sitting' : language === 'es' ? 'Paseadores para Cuidado en Casa' : 'Walkers for House Sitting')}
                            {filterDogSitting === "drop_in" && (language === 'pt' ? 'Passeadores para Visitas' : language === 'es' ? 'Paseadores para Visitas' : 'Walkers for Drop-in Visits')}
                          </>
                        ) : (
                          language === 'pt' ? 'Passeadores Disponíveis' : language === 'es' ? 'Paseadores Disponibles' : 'Available Walkers'
                        )}
                      </h2>
                      <p className="text-xs md:text-base text-gray-600 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                        {filteredWalkers.length} {language === 'pt' ? 'encontrados' : language === 'es' ? 'encontrados' : 'found'}
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
                        {filteredWalkers.some(w => w.distance !== null) && (
                          <span className="text-purple-600 font-semibold ml-2">
                            ({language === 'pt' ? 'ordenado por distância' : language === 'es' ? 'ordenado por distancia' : 'sorted by distance'})
                          </span>
                        )}
                      </p>
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
                          <p className="text-sm md:text-base text-gray-600">Tente ajustar os filtros</p>
                        </Card>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                          {filteredWalkers.map((walker) => (
                            <WalkerCard 
                              key={walker.id} 
                              walker={walker}
                              distance={walker.distance}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
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
