
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

export default function Home() {
  const { language } = useLanguage();
  const [searchLocation, setSearchLocation] = useState("");
  const [filterSize, setFilterSize] = useState("all");
  const [filterTime, setFilterTime] = useState("all");
  const [filterAvailability, setFilterAvailability] = useState("all");

  const { data: walkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['walkers'],
    queryFn: () => base44.entities.WalkerProfile.filter({ is_active: true }, '-rating'),
    initialData: [],
  });

  const { data: emergencyWalks, isLoading: loadingEmergency } = useQuery({
    queryKey: ['emergencyWalks'],
    queryFn: () => base44.entities.EmergencyWalk.filter({ status: 'available' }, '-created_date'),
    initialData: [],
  });

  const { data: availability } = useQuery({
    queryKey: ['allAvailability'],
    queryFn: () => base44.entities.CalendarAvailability.list(),
    initialData: [],
  });

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

  // Stats for hero section
  const stats = [
    { icon: Users, value: walkers.length, label: "Profissionais Verificados", color: "from-blue-500 to-blue-600" },
    { icon: Star, value: "4.9", label: "Rating Médio", color: "from-yellow-500 to-yellow-600" },
    { icon: Shield, value: "100%", label: "Segurança Garantida", color: "from-green-500 to-green-600" },
    { icon: Heart, value: "50k+", label: "Pets Felizes", color: "from-pink-500 to-pink-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Enhanced Hero Section with Glassmorphism */}
      <div className="relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative bg-gradient-to-br from-green-600/90 via-green-500/90 to-blue-600/90 backdrop-blur-sm py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block mb-6"
              >
                <span className="px-6 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-semibold border border-white/30 shadow-lg">
                  🐕 #1 Plataforma de Cuidados Pet em Portugal
                </span>
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
                Encontre o <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">Passeador Perfeito</span>
                <br />
                Para o Seu Pet
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Profissionais verificados, seguros e apaixonados por cães. 
                <br className="hidden md:block" />
                Agende passeios em minutos. 🐾
              </p>

              {/* Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12"
              >
                {stats.map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                      <stat.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs md:text-sm text-white/80">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Enhanced Search Bar with Glassmorphism */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-white/10 rounded-3xl blur-xl"></div>
              <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/50">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative group">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-600 w-5 h-5 group-hover:scale-110 transition-transform" />
                    <Input
                      placeholder={t('searchPlaceholder', language)}
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="pl-12 h-14 text-base border-2 border-transparent focus:border-green-500 rounded-xl bg-white shadow-sm hover:shadow-md transition-all"
                    />
                  </div>
                  <Select value={filterSize} onValueChange={setFilterSize}>
                    <SelectTrigger className="md:w-48 h-14 border-2 border-transparent focus:border-green-500 rounded-xl bg-white hover:shadow-md transition-all">
                      <SelectValue placeholder={t('allSizes', language)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allSizes', language)}</SelectItem>
                      <SelectItem value="small">{t('small', language)}</SelectItem>
                      <SelectItem value="medium">{t('medium', language)}</SelectItem>
                      <SelectItem value="large">{t('large', language)}</SelectItem>
                      <SelectItem value="extra_large">{t('extraLarge', language)}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterTime} onValueChange={setFilterTime}>
                    <SelectTrigger className="md:w-48 h-14 border-2 border-transparent focus:border-green-500 rounded-xl bg-white hover:shadow-md transition-all">
                      <SelectValue placeholder={t('anyTime', language)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('anyTime', language)}</SelectItem>
                      <SelectItem value="morning">{t('morning', language)}</SelectItem>
                      <SelectItem value="afternoon">{t('afternoon', language)}</SelectItem>
                      <SelectItem value="evening">{t('evening', language)}</SelectItem>
                      <SelectItem value="night">{t('night', language)}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                    <SelectTrigger className="md:w-48 h-14 border-2 border-transparent focus:border-green-500 rounded-xl bg-white hover:shadow-md transition-all">
                      <SelectValue placeholder={t('availability', language)} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('allWalkers', language)}</SelectItem>
                      <SelectItem value="available">{t('available', language)}</SelectItem>
                      <SelectItem value="unavailable">{t('unavailable', language)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Tabs defaultValue="walkers" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-8 h-16 bg-white/80 backdrop-blur-lg shadow-xl rounded-2xl border-2 border-white/50 p-2">
            <TabsTrigger 
              value="walkers" 
              className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg"
            >
              <Search className="w-5 h-5 mr-2" />
              {t('browseWalkers', language)}
            </TabsTrigger>
            <TabsTrigger 
              value="emergency" 
              className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-xl transition-all duration-300 data-[state=active]:shadow-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              {t('emergencyWalks', language)}
            </TabsTrigger>
          </TabsList>

          {/* Regular Walkers Tab */}
          <TabsContent value="walkers">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {t('availableWalkers', language)}
                  </h2>
                  <p className="text-gray-600 mt-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    {filteredWalkers.length} {t('walkersFound', language)}
                  </p>
                </div>
              </div>

              {loadingWalkers ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-6 space-y-4">
                      <Skeleton className="w-full h-64 rounded-xl" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : filteredWalkers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noWalkersFound', language)}</h3>
                  <p className="text-gray-600">{t('tryAdjustingFilters', language)}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWalkers.map((walker, index) => (
                    <motion.div
                      key={walker.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-orange-500" />
                  {t('dogsNeedingUrgentWalks', language)}
                </h2>
                <p className="text-gray-600 mt-1">
                  {filteredEmergencyWalks.length} {t('dogsNeedHelpNow', language)}
                </p>
              </div>
            </div>

            {loadingEmergency ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 space-y-4">
                    <Skeleton className="w-full h-64 rounded-xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredEmergencyWalks.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-12 h-12 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noEmergencyWalks', language)}</h3>
                <p className="text-gray-600">{t('checkBackSoon', language)}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmergencyWalks.map((walk, index) => (
                  <motion.div
                    key={walk.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <EmergencyDogCard walk={walk} />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
