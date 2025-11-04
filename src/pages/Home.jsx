
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Zap, Star, Shield, Heart, TrendingUp, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WalkerCard from "../components/marketplace/WalkerCard";
import EmergencyDogCard from "../components/emergency/EmergencyDogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PawCaoLogo from "@/components/PawCaoLogo";

export default function Home() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState("");
  const [filterSize, setFilterSize] = useState("all");
  const [filterTime, setFilterTime] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");

  // Check authentication
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: walkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['walkers'],
    queryFn: () => base44.entities.WalkerProfile.filter({ is_active: true }, '-rating'),
    initialData: [],
    enabled: !!user,
  });

  const { data: emergencyWalks, isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: () => base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date'),
    initialData: [],
    enabled: !!user,
  });

  const { data: availability } = useQuery({
    queryKey: ['allAvailability'],
    queryFn: () => base44.entities.CalendarAvailability.list(),
    initialData: [],
    enabled: !!user,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup function
    };
  }, []);

  // Show loading while checking auth
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <PawCaoLogo size="large" animated={true} />
          <p className="text-gray-600 text-center mt-4">A carregar...</p>
        </motion.div>
      </div>
    );
  }

  // If not logged in, redirect to landing
  if (!user) {
    navigate(createPageUrl("Landing"), { replace: true });
    return null;
  }

  const getWalkerAvailability = (walker) => {
    const today = new Date().toISOString().split('T')[0];
    const walkerAvailability = availability.filter(a => 
      a.professional_email === walker.created_by && 
      a.date >= today
    );
    return walkerAvailability.length > 0;
  };

  const filteredWalkers = walkers.filter(walker => {
    const matchesLocation = !searchLocation || 
      walker.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSize = filterSize === "all" || 
      walker.dog_sizes?.includes(filterSize);
    const matchesTime = filterTime === "all" || 
      walker.availability?.includes(filterTime);
    const matchesAvailability = filterAvailability === "all" ||
      (filterAvailability === "available" && getWalkerAvailability(walker)) ||
      (filterAvailability === "unavailable" && !getWalkerAvailability(walker));
    
    return matchesLocation && matchesSize && matchesTime && matchesAvailability;
  });

  const filteredEmergencyWalks = emergencyWalks.filter(walk => {
    const matchesLocation = !searchLocation || 
      walk.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSize = filterSize === "all" || walk.dog_size === filterSize;
    
    return matchesLocation && matchesSize;
  });

  const stats = [
    { icon: Users, value: walkers.length, label: "Profissionais", color: "from-blue-500 to-blue-600" },
    { icon: Star, value: "4.9", label: "Rating", color: "from-yellow-500 to-yellow-600" },
    { icon: Shield, value: "100%", label: "Seguro", color: "from-green-500 to-green-600" },
    { icon: Heart, value: "50k+", label: "Pets", color: "from-pink-500 to-pink-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Hero Section - Enhanced with Logo */}
      <div className="relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 20, -20, 0],
              y: [0, -30, 30, 0],
              scale: [1, 1.1, 0.9, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-10 left-5 w-40 h-40 md:w-72 md:h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          />
          <motion.div
            animate={{
              x: [0, -20, 20, 0],
              y: [0, 30, -30, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute top-20 right-5 w-40 h-40 md:w-72 md:h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          />
          <motion.div
            animate={{
              x: [0, 15, -15, 0],
              y: [0, -20, 20, 0],
              scale: [1, 1.05, 0.95, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-20 left-1/2 w-40 h-40 md:w-72 md:h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          />
        </div>

        <div className="relative bg-gradient-to-br from-green-600/90 via-green-500/90 to-blue-600/90 backdrop-blur-sm py-8 md:py-16 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-6 md:mb-10"
            >
              {/* Animated Logo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                className="flex justify-center mb-6"
              >
                <PawCaoLogo size="large" animated={true} />
              </motion.div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="inline-block mb-3 md:mb-4"
              >
                <motion.span 
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 rgba(255, 255, 255, 0.4)",
                      "0 0 0 10px rgba(255, 255, 255, 0)",
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="px-3 py-1 md:px-4 md:py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs md:text-sm font-semibold border border-white/30 shadow-lg"
                >
                  🐕 #1 em Portugal
                </motion.span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 md:mb-5 leading-tight px-2 drop-shadow-lg"
              >
                Encontre o{" "}
                <motion.span 
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300"
                >
                  Passeador Perfeito
                </motion.span>
                <br className="hidden md:block" />
                <span className="block md:inline"> Para o Seu Pet</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm md:text-xl text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4"
              >
                Profissionais verificados e apaixonados por cães. 🐾
              </motion.p>

              {/* Animated Stats */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="grid grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-10 max-w-4xl mx-auto"
              >
                {stats.map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.7 + idx * 0.1,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ 
                      scale: 1.1,
                      rotate: [0, -5, 5, 0],
                      transition: { duration: 0.3 }
                    }}
                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg cursor-pointer"
                  >
                    <motion.div 
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                      className={`w-6 h-6 md:w-10 md:h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 shadow-lg`}
                    >
                      <stat.icon className="w-3 h-3 md:w-5 md:h-5 text-white" />
                    </motion.div>
                    <div className="text-lg md:text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] md:text-xs text-white/80 truncate">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Enhanced Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="relative max-w-5xl mx-auto"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-3 md:p-6 border-2 border-white/50"
              >
                <div className="flex flex-col gap-2 md:gap-3">
                  {/* Location Search */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 w-4 h-4 md:w-5 md:h-5" />
                    <Input
                      placeholder="Localização..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="pl-9 md:pl-11 h-10 md:h-12 text-sm md:text-base border-2 border-transparent focus:border-green-500 rounded-xl bg-white shadow-sm"
                    />
                  </div>
                  
                  {/* Filters - Stack on Mobile */}
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
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-10">
        <Tabs defaultValue="walkers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 h-12 md:h-14 bg-white/80 backdrop-blur-lg shadow-lg rounded-xl border-2 border-white/50 p-1 transition-colors">
            <TabsTrigger 
              value="walkers" 
              className="text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              Passeadores
            </TabsTrigger>
            <TabsTrigger 
              value="emergency" 
              className="text-xs md:text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg transition-all"
            >
              <Zap className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              Emergências
            </TabsTrigger>
          </TabsList>

          {/* Regular Walkers Tab */}
          <TabsContent value="walkers">
            <AnimatePresence mode="wait">
              <motion.div
                key="walkers-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div>
                    <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                      Passeadores Disponíveis
                    </h2>
                    <p className="text-xs md:text-base text-gray-600 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                      {filteredWalkers.length} encontrados
                    </p>
                  </div>
                </div>

                {loadingWalkers ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-xl p-4 space-y-3 shadow-md"
                      >
                        <Skeleton className="w-full h-48 md:h-56 rounded-lg bg-gray-200" />
                        <Skeleton className="h-5 w-3/4 bg-gray-200" />
                        <Skeleton className="h-4 w-1/2 bg-gray-200" />
                      </motion.div>
                    ))}
                  </div>
                ) : filteredWalkers.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 md:py-16"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                      <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Nenhum passeador encontrado</h3>
                    <p className="text-sm md:text-base text-gray-600">Tente ajustar os filtros</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                    <AnimatePresence>
                      {filteredWalkers.map((walker, index) => (
                        <motion.div
                          key={walker.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ 
                            duration: 0.4, 
                            delay: index * 0.05,
                            type: "spring",
                            stiffness: 100
                          }}
                        >
                          <WalkerCard walker={walker} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          {/* Emergency Walks Tab */}
          <TabsContent value="emergency">
            <AnimatePresence mode="wait">
              <motion.div
                key="emergency-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
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
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-xl p-4 space-y-3 shadow-md"
                      >
                        <Skeleton className="w-full h-48 md:h-56 rounded-lg bg-gray-200" />
                        <Skeleton className="h-5 w-3/4 bg-gray-200" />
                        <Skeleton className="h-4 w-1/2 bg-gray-200" />
                      </motion.div>
                    ))}
                  </div>
                ) : filteredEmergencyWalks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12 md:py-16"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                      <Zap className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Sem emergências no momento</h3>
                    <p className="text-sm md:text-base text-gray-600">Verifique mais tarde</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                    <AnimatePresence>
                      {filteredEmergencyWalks.map((walk, index) => (
                        <motion.div
                          key={walk.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: index * 0.04,
                            type: "spring",
                            stiffness: 100
                          }}
                        >
                          <EmergencyDogCard walk={walk} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
