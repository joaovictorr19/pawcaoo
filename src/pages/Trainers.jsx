import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Award, Star } from "lucide-react";
import { motion } from "framer-motion";
import TrainerCard from "../components/trainers/TrainerCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function Trainers() {
  const { language } = useLanguage();
  const [searchLocation, setSearchLocation] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [filterMethodology, setFilterMethodology] = useState("all");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterSuccessRate, setFilterSuccessRate] = useState("all");

  const { data: trainers, isLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => base44.entities.TrainerProfile.filter({ is_active: true }, '-rating'),
    initialData: [],
  });

  const { data: allReviews } = useQuery({
    queryKey: ['allTrainerReviews'],
    queryFn: () => base44.entities.Review.list(),
    initialData: [],
  });

  // Calculate average ratings for each trainer
  const trainersWithRatings = trainers.map(trainer => {
    const trainerReviews = allReviews.filter(r => r.trainer_id === trainer.id);
    const averageRating = trainerReviews.length > 0
      ? trainerReviews.reduce((sum, r) => sum + r.rating, 0) / trainerReviews.length
      : trainer.rating || 0;
    return {
      ...trainer,
      average_rating: averageRating,
      review_count: trainerReviews.length
    };
  });

  const filteredTrainers = trainersWithRatings.filter(trainer => {
    const matchesLocation = !searchLocation ||
      trainer.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSpecialty = filterSpecialty === "all" ||
      trainer.training_specialties?.includes(filterSpecialty);
    const matchesMethodology = filterMethodology === "all" ||
      trainer.training_methodologies?.some(m => m.methodology_name === filterMethodology);
    const matchesMethod = filterMethod === "all" ||
      trainer.consultation_options?.includes(filterMethod);
    const matchesRating = filterRating === "all" ||
      (filterRating === "4+" && trainer.average_rating >= 4) ||
      (filterRating === "4.5+" && trainer.average_rating >= 4.5) ||
      (filterRating === "5" && trainer.average_rating === 5);
    const matchesSuccessRate = filterSuccessRate === "all" ||
      (filterSuccessRate === "90+" && trainer.success_rate >= 90) ||
      (filterSuccessRate === "95+" && trainer.success_rate >= 95) ||
      (filterSuccessRate === "98+" && trainer.success_rate >= 98);

    return matchesLocation && matchesSpecialty && matchesMethodology && matchesMethod && matchesRating && matchesSuccessRate;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
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
                  {/* Location Search */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600 w-4 h-4 md:w-5 md:h-5" />
                    <Input
                      placeholder={language === 'pt' ? 'Localização...' : language === 'es' ? 'Ubicación...' : 'Location...'}
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="pl-9 md:pl-11 h-10 md:h-12 text-sm md:text-base border-2 border-transparent focus:border-purple-500 rounded-xl bg-white shadow-sm"
                    />
                  </div>
                  
                  {/* Filters - Stack on Mobile */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {/* Training Specialty */}
                    <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                      <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm border-2 border-transparent focus:border-purple-500 rounded-xl bg-white">
                        <SelectValue placeholder={language === 'pt' ? 'Especialidade' : language === 'es' ? 'Especialidad' : 'Specialty'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'pt' ? 'Todas' : language === 'es' ? 'Todas' : 'All'}</SelectItem>
                        <SelectItem value="basic_obedience">{language === 'pt' ? 'Obediência Básica' : language === 'es' ? 'Obediencia Básica' : 'Basic Obedience'}</SelectItem>
                        <SelectItem value="advanced_obedience">{language === 'pt' ? 'Obediência Avançada' : language === 'es' ? 'Obediencia Avanzada' : 'Advanced Obedience'}</SelectItem>
                        <SelectItem value="behavior_modification">{language === 'pt' ? 'Modificação de Comportamento' : language === 'es' ? 'Modificación de Comportamiento' : 'Behavior Modification'}</SelectItem>
                        <SelectItem value="puppy_training">{language === 'pt' ? 'Treino de Cachorros' : language === 'es' ? 'Entrenamiento de Cachorros' : 'Puppy Training'}</SelectItem>
                        <SelectItem value="aggression">{language === 'pt' ? 'Agressão' : language === 'es' ? 'Agresión' : 'Aggression'}</SelectItem>
                        <SelectItem value="anxiety">{language === 'pt' ? 'Ansiedade' : language === 'es' ? 'Ansiedad' : 'Anxiety'}</SelectItem>
                        <SelectItem value="socialization">{language === 'pt' ? 'Socialização' : language === 'es' ? 'Socialización' : 'Socialization'}</SelectItem>
                        <SelectItem value="service_dog">{language === 'pt' ? 'Cão de Serviço' : language === 'es' ? 'Perro de Servicio' : 'Service Dog'}</SelectItem>
                        <SelectItem value="agility">{language === 'pt' ? 'Agilidade' : language === 'es' ? 'Agilidad' : 'Agility'}</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Training Methodology */}
                    <Select value={filterMethodology} onValueChange={setFilterMethodology}>
                      <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm border-2 border-transparent focus:border-purple-500 rounded-xl bg-white">
                        <SelectValue placeholder={language === 'pt' ? 'Metodologia' : language === 'es' ? 'Metodología' : 'Method'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'pt' ? 'Todas' : language === 'es' ? 'Todas' : 'All'}</SelectItem>
                        <SelectItem value="positive_reinforcement">{language === 'pt' ? 'Reforço Positivo' : language === 'es' ? 'Refuerzo Positivo' : 'Positive Reinforcement'}</SelectItem>
                        <SelectItem value="clicker_training">{language === 'pt' ? 'Clicker' : language === 'es' ? 'Clicker' : 'Clicker'}</SelectItem>
                        <SelectItem value="science_based">{language === 'pt' ? 'Baseado em Ciência' : language === 'es' ? 'Basado en Ciencia' : 'Science-Based'}</SelectItem>
                        <SelectItem value="balanced_training">{language === 'pt' ? 'Equilibrado' : language === 'es' ? 'Equilibrado' : 'Balanced'}</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Consultation Method */}
                    <Select value={filterMethod} onValueChange={setFilterMethod} className="col-span-2 md:col-span-1">
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

                  {/* Secondary Filters */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                    {/* Success Rate */}
                    <Select value={filterSuccessRate} onValueChange={setFilterSuccessRate}>
                      <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm border-2 border-transparent focus:border-purple-500 rounded-xl bg-white">
                        <SelectValue placeholder={language === 'pt' ? 'Taxa Sucesso' : language === 'es' ? 'Tasa Éxito' : 'Success Rate'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'pt' ? 'Todas' : language === 'es' ? 'Todas' : 'All'}</SelectItem>
                        <SelectItem value="90+">90%+</SelectItem>
                        <SelectItem value="95+">95%+</SelectItem>
                        <SelectItem value="98+">98%+</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Rating */}
                    <Select value={filterRating} onValueChange={setFilterRating}>
                      <SelectTrigger className="h-10 md:h-12 text-xs md:text-sm border-2 border-transparent focus:border-purple-500 rounded-xl bg-white">
                        <SelectValue placeholder={language === 'pt' ? 'Avaliação' : language === 'es' ? 'Calificación' : 'Rating'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'pt' ? 'Todas' : language === 'es' ? 'Todas' : 'All'}</SelectItem>
                        <SelectItem value="4+">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            4.0+
                          </div>
                        </SelectItem>
                        <SelectItem value="4.5+">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            4.5+
                          </div>
                        </SelectItem>
                        <SelectItem value="5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            5.0
                          </div>
                        </SelectItem>
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
        <div className="flex items-center justify-between mb-4 md:mb-8">
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-gray-900">
              {language === 'pt' ? 'Treinadores Disponíveis' : language === 'es' ? 'Entrenadores Disponibles' : 'Available Trainers'}
            </h2>
            <p className="text-xs md:text-base text-gray-600 mt-1">
              {filteredTrainers.length} {language === 'pt' ? 'certificados encontrados' : language === 'es' ? 'certificados encontrados' : 'certified trainers found'}
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