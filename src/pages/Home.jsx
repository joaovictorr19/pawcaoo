
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Zap, Star, Shield, Heart, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import WalkerCard from "../components/marketplace/WalkerCard";
import EmergencyDogCard from "../components/emergency/EmergencyDogCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PawCaoLogo from "@/components/PawCaoLogo"; // Added import for PawCaoLogo

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

  // Show loading while checking auth
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors duration-300">
        <p className="text-gray-600 dark:text-gray-300">A carregar...</p>
      </div>
    );
  }

  // If not logged in, redirect to landing using navigate
  if (!user) {
    navigate(createPageUrl("Landing"));
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Hero Section - Enhanced with Logo */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-5 w-40 h-40 md:w-72 md:h-72 bg-green-400 dark:bg-green-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 dark:opacity-10 animate-blob"></div>
          <div className="absolute top-20 right-5 w-40 h-40 md:w-72 md:h-72 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative bg-gradient-to-br from-green-600/90 via-green-500/90 to-blue-600/90 dark:from-green-800/90 dark:via-green-700/90 dark:to-blue-800/90 backdrop-blur-sm py-8 md:py-16 px-4 md:px-6 transition-colors">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-6 md:mb-10"
            >
              {/* Logo animado no topo */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex justify-center mb-6"
              >
                <PawCaoLogo size="large" animated={true} />
              </motion.div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-block mb-3 md:mb-4"
              >
                <span className="px-3 py-1 md:px-4 md:py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs md:text-sm font-semibold border border-white/30 shadow-lg animate-pulse">
                  🐕 #1 em Portugal
                </span>
              </motion.div>
              
              <h1 className="text-2xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 md:mb-5 leading-tight px-2 drop-shadow-lg">
                Encontre o <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 drop-shadow-none">Passeador Perfeito</span>
                <br className="hidden md:block" />
                <span className="block md:inline"> Para o Seu Pet</span>
              </h1>
              <p className="text-sm md:text-xl text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
                Profissionais verificados e apaixonados por cães. 🐾
              </p>

              {/* Stats Row - Compact Mobile */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="grid grid-cols-4 gap-2 md:gap-4 mb-6 md:mb-10 max-w-4xl mx-auto"
              >
                {stats.map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg md:rounded-xl p-2 md:p-4 shadow-lg"
                  >
                    <div className={`w-6 h-6 md:w-10 md:h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 shadow-lg`}>
                      <stat.icon className="w-3 h-3 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="text-lg md:text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-[10px] md:text-xs text-white/80 truncate">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Search Bar - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="relative max-w-5xl mx-auto"
            >
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-3 md:p-6 border border-white/50">
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
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Results Section - Dark mode */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-10">
        <Tabs defaultValue="walkers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 md:mb-8 h-12 md:h-14 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg rounded-xl border-2 border-white/50 dark:border-gray-700/50 p-1 transition-colors">
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h2 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Passeadores Disponíveis
                  </h2>
                  <p className="text-xs md:text-base text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                    {filteredWalkers.length} encontrados
                  </p>
                </div>
              </div>

              {loadingWalkers ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3 shadow-md">
                      <Skeleton className="w-full h-48 md:h-56 rounded-lg bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700" />
                      <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700" />
                    </div>
                  ))}
                </div>
              ) : filteredWalkers.length === 0 ? (
                <div className="text-center py-12 md:py-16">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                    <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Nenhum passeador encontrado</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Tente ajustar os filtros</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                  {filteredWalkers.map((walker, index) => (
                    <motion.div
                      key={walker.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <WalkerCard walker={walker} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Emergency Walks Tab */}
          <TabsContent value="emergency">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Zap className="w-6 h-6 md:w-7 md:h-7 text-orange-500" />
                  Cães Precisando Urgente
                </h2>
                <p className="text-xs md:text-base text-gray-600 dark:text-gray-400 mt-1">
                  {filteredEmergencyWalks.length} cães precisam de ajuda
                </p>
              </div>
            </div>

            {loadingEmergency ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3 shadow-md">
                    <Skeleton className="w-full h-48 md:h-56 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700" />
                  </div>
                ))}
              </div>
            ) : filteredEmergencyWalks.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-sm">
                  <Zap className="w-8 h-8 md:w-10 md:h-10 text-orange-500 dark:text-orange-300" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Sem emergências no momento</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Verifique mais tarde</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                {filteredEmergencyWalks.map((walk, index) => (
                  <motion.div
                    key={walk.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    <EmergencyDogCard walk={walk} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
