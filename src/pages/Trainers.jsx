import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Award, Star, Sliders, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TrainerCard from "../components/trainers/TrainerCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import AdvancedTrainerFilters from "../components/search/AdvancedTrainerFilters";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge"; // Assuming this path for Badge

export default function Trainers() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchLocation, setSearchLocation] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [filterConsultation, setFilterConsultation] = useState("all"); // Renamed from filterMethod
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    specialties: [],
    methodologies: [],
    consultationTypes: [],
    minExperience: 0,
    minRating: 0,
    verifiedOnly: false,
    availableDate: null
  });

  const { data: trainers, isLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const walkers = await base44.entities.WalkerProfile.filter({ 
        is_active: true, 
        is_verified_trainer: true 
      }, '-rating', 100);
      return Array.isArray(walkers) ? walkers : [];
    },
    initialData: [],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Removed allReviews query and trainersWithRatings calculation as per new outline

  const filteredTrainers = trainers
    .filter(trainer => {
      const matchesLocation = !searchLocation ||
        trainer.location?.toLowerCase().includes(searchLocation.toLowerCase()) ||
        trainer.walker_name?.toLowerCase().includes(searchLocation.toLowerCase());

      const matchesSpecialty = filterSpecialty === "all" ||
        trainer.training_specializations?.some(spec => spec.specialty_id === filterSpecialty);
      
      // filterMethodology, filterRating, filterSuccessRate removed from primary filters
      // filterMethod is now filterConsultation
      const matchesConsultation = filterConsultation === "all" ||
        trainer.consultation_options?.includes(filterConsultation);

      // Advanced filters
      const matchesAdvSpecialties = advancedFilters.specialties.length === 0 ||
        advancedFilters.specialties.some(spec => 
          trainer.training_specializations?.some(s => s.specialty_id === spec)
        );
      
      const matchesAdvMethodologies = advancedFilters.methodologies.length === 0 || true;
      
      const matchesAdvConsultation = advancedFilters.consultationTypes.length === 0 ||
        advancedFilters.consultationTypes.some(type => trainer.consultation_options?.includes(type));
      
      const matchesExperience = (trainer.experience_years || 0) >= (advancedFilters.minExperience || 0);
      const matchesAdvRating = (trainer.rating || 0) >= (advancedFilters.minRating || 0); // Using trainer.rating directly
      
      const matchesVerified = !advancedFilters.verifiedOnly || trainer.verification_status === 'verified';
      
      // Placeholder for availableDate filtering logic
      const matchesAvailableDate = !advancedFilters.availableDate || true; 

      return matchesLocation && matchesSpecialty && matchesConsultation &&
             matchesAdvSpecialties && matchesAdvMethodologies && matchesAdvConsultation &&
             matchesExperience && matchesAdvRating && matchesVerified && matchesAvailableDate;
    })
    .sort((a, b) => {
      // Sort by trainer.rating (descending) as a default
      return (b.rating || 0) - (a.rating || 0);
    });

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      specialties: [],
      methodologies: [],
      consultationTypes: [],
      minExperience: 0,
      minRating: 0,
      verifiedOnly: false,
      availableDate: null
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      {/* Hero Section - Mobile Optimized */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-5 w-40 h-40 md:w-72 md:h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-20 right-5 w-40 h-40 md:w-72 md:h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative bg-gradient-to-br from-purple-600/90 via-purple-500/90 to-blue-600/90 backdrop-blur-sm py-8 md:py-16 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-6 md:mb-10"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Award className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              
              <h1 className="text-2xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 md:mb-5 leading-tight px-2">
                {language === 'pt' ? 'Encontre Treinadores' : language === 'es' ? 'Encuentra Entrenadores' : 'Find Trainers'}
                <br className="hidden md:block" />
                <span className="block md:inline text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400"> Certificados</span>
              </h1>
              <p className="text-sm md:text-xl text-white/90 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
                {language === 'pt' 
                  ? 'Profissionais certificados para obediência, comportamento e treino especializado' 
                  : language === 'es'
                  ? 'Profesionales certificados para obediencia, comportamiento y entrenamiento especializado'
                  : 'Certified trainers for obedience, behavior, and specialized training'}
              </p>
            </motion.div>

            {/* Search Bar - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative max-w-5xl mx-auto"
            >
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl p-3 md:p-6 border border-white/50">
                <div className="flex flex-col gap-2 md:gap-3">
                  {/* Search Input for Location/Name */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={language === 'pt' ? 'Pesquisar por localização ou nome...' : language === 'es' ? 'Buscar por ubicación o nombre...' : 'Search by location or name...'}
                      className="pl-9 h-10 md:h-12 text-xs md:text-sm border-2 border-transparent focus:border-purple-500 rounded-xl bg-white"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                    />
                  </div>
                  
                  {/* Filters - Stack on Mobile */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Training Specialty */}
                    <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                      <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm border-2 border-transparent focus:border-purple-500 rounded-xl bg-white">
                        <SelectValue placeholder={language === 'pt' ? 'Especialidade' : language === 'es' ? 'Especialidad' : 'Specialty'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'pt' ? 'Todas' : language === 'es' ? 'Todas' : 'All'}</SelectItem>
                        <SelectItem value="basic_obedience">{language === 'pt' ? 'Obediência Básica' : language === 'es' ? 'Obediencia Básica' : 'Basic Obedience'}</SelectItem>
                        <SelectItem value="advanced_obedience">{language === 'pt' ? 'Obediência Avançada' : language === 'es' ? 'Obediência Avanzada' : 'Advanced Obedience'}</SelectItem>
                        <SelectItem value="behavior_modification">{language === 'pt' ? 'Modificação de Comportamento' : language === 'es' ? 'Modificación de Comportamiento' : 'Behavior Modification'}</SelectItem>
                        <SelectItem value="puppy_training">{language === 'pt' ? 'Treino de Cachorros' : language === 'es' ? 'Entrenamiento de Cachorros' : 'Puppy Training'}</SelectItem>
                        <SelectItem value="aggression">{language === 'pt' ? 'Agressão' : language === 'es' ? 'Agresión' : 'Aggression'}</SelectItem>
                        <SelectItem value="anxiety">{language === 'pt' ? 'Ansiedade' : language === 'es' ? 'Ansiedad' : 'Anxiety'}</SelectItem>
                        <SelectItem value="socialization">{language === 'pt' ? 'Socialização' : language === 'es' ? 'Socialización' : 'Socialization'}</SelectItem>
                        <SelectItem value="service_dog">{language === 'pt' ? 'Cão de Serviço' : language === 'es' ? 'Perro de Servicio' : 'Service Dog'}</SelectItem>
                        <SelectItem value="agility">{language === 'pt' ? 'Agilidade' : language === 'es' ? 'Agilidad' : 'Agility'}</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Consultation Method */}
                    <Select value={filterConsultation} onValueChange={setFilterConsultation}>
                      <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm border-2 border-transparent focus:border-purple-500 rounded-xl bg-white">
                        <SelectValue placeholder={language === 'pt' ? 'Tipo Consulta' : language === 'es' ? 'Tipo Consulta' : 'Consultation'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'pt' ? 'Todos' : language === 'es' ? 'Todos' : 'All'}</SelectItem>
                        <SelectItem value="in_person">{language === 'pt' ? 'Presencial' : language === 'es' ? 'Presencial' : 'In-Person'}</SelectItem>
                        <SelectItem value="online">{language === 'pt' ? 'Online' : language === 'es' ? 'En Línea' : 'Online'}</SelectItem>
                        <SelectItem value="hybrid">{language === 'pt' ? 'Híbrido' : language === 'es' ? 'Híbrido' : 'Hybrid'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Trainers List */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-12">
        {/* Advanced Filters Toggle */}
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="border-2 border-green-200 hover:bg-green-50"
          >
            <Sliders className="w-4 h-4 mr-2" />
            {showAdvancedFilters 
              ? (language === 'pt' ? 'Ocultar Filtros Avançados' : language === 'es' ? 'Ocultar Filtros Avanzados' : 'Hide Advanced Filters') 
              : (language === 'pt' ? 'Mostrar Filtros Avançados' : language === 'es' ? 'Mostrar Filtros Avançados' : 'Show Advanced Filters')}
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="lg:col-span-1"
              >
                <AdvancedTrainerFilters
                  filters={advancedFilters}
                  onFiltersChange={setAdvancedFilters}
                  onReset={resetAdvancedFilters}
                  language={language}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className={showAdvancedFilters ? "lg:col-span-3" : "lg:col-span-4"}>
            <div className="flex items-center justify-between mb-4 md:mb-8">
              <div>
                <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                  {language === 'pt' ? 'Treinadores Disponíveis' : language === 'es' ? 'Entrenadores Disponibles' : 'Available Trainers'}
                </h2>
                <p className="text-xs md:text-base text-gray-600 mt-1 flex items-center gap-1">
                  {filteredTrainers.length} {language === 'pt' ? 'treinadores encontrados' : language === 'es' ? 'entrenadores encontrados' : 'trainers found'}
                  {advancedFilters.verifiedOnly && (
                    <Badge className="bg-green-500 text-white ml-2">
                      <Shield className="w-3 h-3 mr-1" />
                      {language === 'pt' ? 'Certificados' : language === 'es' ? 'Certificados' : 'Certified'}
                    </Badge>
                  )}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-4 space-y-4">
                    <Skeleton className="w-full h-48 md:h-64 rounded-xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredTrainers.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <Search className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                  {language === 'pt' ? 'Nenhum treinador encontrado' : language === 'es' ? 'No se encontraron entrenadores' : 'No trainers found'}
                </h3>
                <p className="text-sm md:text-base text-gray-600">
                  {language === 'pt' ? 'Tente ajustar os filtros' : language === 'es' ? 'Intenta ajustar los filtros' : 'Try adjusting your filters'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {filteredTrainers.map((trainer, index) => (
                  <motion.div
                    key={trainer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <TrainerCard trainer={trainer} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Section - Compact */}
      <div className="bg-white border-t border-gray-200 py-8 md:py-16 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 text-center">
            {language === 'pt' 
              ? 'Por Que Escolher PawCão?' 
              : language === 'es' 
              ? '¿Por Qué Elegir PawCão?'
              : 'Why Choose PawCão?'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                {language === 'pt' ? 'Certificados' : language === 'es' ? 'Certificados' : 'Certified'}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                {language === 'pt' ? 'Profissionais verificados' : language === 'es' ? 'Profesionales verificados' : 'Verified professionals'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                {language === 'pt' ? 'Métodos Comprovados' : language === 'es' ? 'Métodos Probados' : 'Proven Methods'}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                {language === 'pt' ? 'Reforço positivo' : language === 'es' ? 'Refuerzo positivo' : 'Positive reinforcement'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                {language === 'pt' ? 'Opções Flexíveis' : language === 'es' ? 'Opciones Flexibles' : 'Flexible Options'}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                {language === 'pt' ? 'Presencial ou online' : language === 'es' ? 'Presencial u online' : 'In-person or online'}
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                {language === 'pt' ? 'Garantia' : language === 'es' ? 'Garantía' : 'Guaranteed'}
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                {language === 'pt' ? 'Satisfação garantida' : language === 'es' ? 'Satisfacción garantizada' : 'Satisfaction guaranteed'}
              </p>
            </div>
          </div>
        </div>
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