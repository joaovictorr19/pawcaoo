import React, { useState, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Clock, DollarSign, Phone, Calendar, ShieldCheck, Video, Repeat, CheckCircle, Award, PlayCircle, HelpCircle, ChevronDown, User as UserIcon, MessageCircle, Heart, Info } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BookingForm from "../components/booking/BookingForm";
import ReviewCard from "../components/reviews/ReviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import { format } from "date-fns";
import { pt, enUS, es } from "date-fns/locale";
import RecurringBookingModal from "../components/booking/RecurringBookingModal";
import { AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateNotification } from "../components/NotificationService";
import ProfessionalProfileHeader from "../components/professionals/ProfessionalProfileHeader";
import ServiceList from "../components/professionals/ServiceList";
const ServiceAreaMap = lazy(() => import("../components/professionals/ServiceAreaMap"));
import SEO from "../components/SEO";
import { useTheme } from "@/components/ThemeContext";

// Mini component for favorite button logic
function FavoriteButton({ walker, user }) {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  
  const { data: favorites = [] } = useQuery({
    queryKey: ['myFavorites'],
    queryFn: () => base44.entities.Favorite.filter({ created_by: user?.email }),
    enabled: !!user?.email
  });

  const isFavorite = favorites.some(f => f.walker_id === walker.id);
  const favoriteRecord = favorites.find(f => f.walker_id === walker.id);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
        if (!user) {
            toast.error("Faça login para adicionar aos favoritos");
            return;
        }
        if (isFavorite) {
            await base44.entities.Favorite.delete(favoriteRecord.id);
        } else {
            await base44.entities.Favorite.create({
                walker_id: walker.id,
                walker_name: walker.walker_name,
                walker_photo_url: walker.photo_url,
                walker_location: walker.location,
                walker_hourly_rate: walker.hourly_rate
            });
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['myFavorites']);
        toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: () => {
        toast.error("Erro ao atualizar favoritos");
    }
  });

  return (
      <Button
        variant="outline"
        className="h-11 w-11 p-0 hover:opacity-80"
        style={{
          borderColor: isFavorite ? '#ef4444' : `${colors?.primary || '#3b82f6'}40`,
          color: isFavorite ? '#ef4444' : colors?.primary || '#3b82f6'
        }}
        onClick={() => toggleFavoriteMutation.mutate()}
        title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
      >
         <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
      </Button>
  );
}
import { generateServiceSchema, generateBreadcrumbSchema } from "../components/seoHelpers";
import PawCaoLogo from "@/components/PawCaoLogo";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function WalkerDetails() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();
  
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedDogForRecurring, setSelectedDogForRecurring] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  // Support both 'id' and 'walker_id' parameters
  const walkerId = urlParams.get('id') || urlParams.get('walker_id');
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userDogs = [] } = useQuery({
    queryKey: ['userDogs', user?.id],
    queryFn: () => base44.entities.DogProfile.filter({ owner_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: walker, isLoading, isError, error } = useQuery({
    queryKey: ['walker', walkerId],
    queryFn: async () => {
      if (!walkerId) return null;

      try {
        // 1. Busca Prioritária: ID exato do WalkerProfile
        const results = await base44.entities.WalkerProfile.filter({ id: walkerId });
        if (results && results.length > 0) {
          return results[0];
        }

        // 2. Fallback: Busca por user_id (Auth ID)
        // Muitas vezes o ID passado é o ID do usuário, não do perfil
        const byUserId = await base44.entities.WalkerProfile.filter({ user_id: walkerId });
        if (byUserId && byUserId.length > 0) {
          return byUserId[0];
        }

        // 3. Fallback Inteligente: Busca por Email (created_by)
        if (walkerId.includes('@')) {
          const byEmail = await base44.entities.WalkerProfile.filter({ created_by: walkerId });
          if (byEmail && byEmail.length > 0) {
            return byEmail[0];
          }
        }

        return null;
      } catch (e) {
        console.error("Critical Error fetching walker profile:", e);
        return null; // Evita crash, retorna null para ativar a UI de "Não encontrado"
      }
    },
    enabled: !!walkerId,
    retry: 1, // Tenta apenas mais uma vez em caso de falha de rede
  });

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['walkerReviews', walkerId],
    queryFn: async () => {
      if (!walkerId) return [];
      console.log('🔍 Buscando reviews para walker_id:', walkerId);
      const allReviews = await base44.entities.Review.filter({ walker_id: walkerId }, '-created_date');
      console.log('📊 Reviews encontradas:', allReviews.length, allReviews);
      return allReviews;
    },
    enabled: !!walkerId,
    initialData: [],
    staleTime: 30000,
  });

  const { data: availability } = useQuery({
    queryKey: ['walkerAvailability', walkerId],
    queryFn: () => base44.entities.CalendarAvailability.filter({
      professional_email: walker?.created_by
    }),
    enabled: !!walker,
    initialData: [],
  });

  const { data: walkerBookings } = useQuery({
    queryKey: ['walkerBookings', walkerId],
    queryFn: () => base44.entities.Booking.filter({ walker_id: walkerId }),
    enabled: !!walkerId,
    initialData: [],
  });

  // FETCH BADGES (Sync Count & List)
  const { data: walkerBadges = [] } = useQuery({
    queryKey: ['walkerBadges', walker?.created_by],
    queryFn: async () => {
      if (!walker?.created_by) return [];
      // Fetch UserBadge linking user_email to walker's email
      return await base44.entities.UserBadge.filter({ user_email: walker.created_by });
    },
    enabled: !!walker?.created_by,
    initialData: [],
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : (walker?.total_walks > 0 ? walker?.rating : 0);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (!user) {
      toast.error(t('loginRequired', language) + ' - ' + t('loginToBook', language));
    } else {
      // Scroll to booking form on mobile
      const formElement = document.getElementById('booking-form-section');
      if (formElement && window.innerWidth < 1024) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Redirect if walker not found
  React.useEffect(() => {
    if (!walkerId) {
      navigate(createPageUrl('Home'));
      return;
    }
    
    if (walkerId && !isLoading && !walker && !isError) {
      const timer = setTimeout(() => {
        navigate(createPageUrl('Home'));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, walker, navigate, walkerId, isError]);

  // Function to handle booking completion from BookingForm
  const handleBookingInitiated = async (booking) => {
    setSelectedDate(null); // Reset selection

    // Create notifications asynchronously
    try {
      // 1. Notify Walker
      createNotification.mutate({
        recipient_email: walker.created_by,
        title: '📅 Nova Solicitação de Agendamento',
        message: `${user.full_name} solicitou um agendamento para ${booking.dog_name}. Aceite para liberar os detalhes de pagamento.`,
        type: 'booking',
        related_id: booking.id,
        priority: 'high'
      });
    } catch (e) { console.error(e); }

    toast.success("Solicitação Enviada! Aguarde a confirmação do profissional.", { duration: 6000 });

    queryClient.invalidateQueries({ queryKey: ['walkerBookings'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <PawCaoLogo size="large" animated={false} showText={false} />
          <p className="text-green-600 font-medium mt-4 animate-pulse">{t('loading', language)}</p>
        </div>
      </div>
    );
  }

  if (!walker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ups! Não conseguimos encontrar este Passeador.</h2>
          <p className="text-gray-600 mb-6">O perfil pode ter sido desativado ou o link pode estar incorreto.</p>
          <Button 
            onClick={() => navigate(createPageUrl('Home'))} 
            className="text-white font-semibold px-6 hover:opacity-90"
            style={{
              background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
            }}
          >
            Voltar à Busca
          </Button>
        </div>
      </div>
    );
  }

  // Se o perfil estiver inativo e o utilizador não for o dono nem admin, mostrar mensagem de indisponível
  if (!walker.is_active && user?.email !== walker.created_by && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil Indisponível</h2>
          <p className="text-gray-600 mb-6">Este passeador está temporariamente indisponível ou pausou a sua atividade.</p>
          <Button onClick={() => navigate(createPageUrl('Home'))} variant="outline">
            Encontrar Outros Passeadores
          </Button>
        </div>
      </div>
    );
  }

  const getSizeLabel = (size) => {
    const labels = {
      small: t('small', language),
      medium: t('medium', language),
      large: t('large', language),
      extra_large: t('extraLarge', language)
    };
    return labels[size] || size;
  };

  const getTimeLabel = (time) => {
    const labels = {
      morning: t('morning', language),
      afternoon: t('afternoon', language),
      evening: t('evening', language),
      night: t('night', language)
    };
    return labels[time] || time;
  };

  const locales = { pt, en: enUS, es };
  const currentLocale = locales[language] || pt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <SEO 
        title={`${walker.walker_name} - ${t('findWalkers', language)} in ${walker.location}`}
        description={`Reserve passeios com ${walker.walker_name}. ${walker.bio?.substring(0, 120)}... ${t('rating', language)}: ${averageRating?.toFixed(1)}/5.`}
        image={walker.photo_url}
        type="profile"
        schema={[
          generateServiceSchema(walker),
          generateBreadcrumbSchema([
            { name: "Home", url: window.location.origin },
            { name: "Walkers", url: window.location.origin },
            { name: walker.walker_name, url: window.location.href }
          ])
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Button
          variant="outline"
          className="mb-6 hover:opacity-80"
          style={{
            borderColor: `${colors?.primary || '#3b82f6'}40`,
            color: colors?.primary || '#3b82f6'
          }}
          onClick={() => navigate(createPageUrl('Home'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('backToWalkers', language)}
        </Button>

        {/* Profile Header - Full Width */}
        <div className="mb-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <ProfessionalProfileHeader 
                professional={walker} 
                type="walker" 
                reviews={reviews}
                averageRating={averageRating}
              />

              {/* Selo de Verificação em Destaque */}
              {walker.verification_status === "verified" && (
                <div className="px-5 pt-2 pb-0">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <ShieldCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800 text-sm">Perfil Verificado pela PawCão</h3>
                      <p className="text-xs text-green-700">Identidade, documentos e antecedentes criminais verificados.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Emblemas Conquistados (Sincronizado) */}
              {walkerBadges.length > 0 && (
                <div className="px-5 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Conquistas ({walkerBadges.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {walkerBadges.slice(0, 4).map((badge) => (
                      <div 
                        key={badge.id} 
                        className="flex flex-col items-center text-center p-2 bg-purple-50 rounded-lg border border-purple-100 hover:shadow-sm transition-all" 
                        title={badge.description}
                      >
                        <div className="text-2xl mb-1 h-8 w-8 flex items-center justify-center">
                          {/* Prioritize image_png_file */}
                          {badge.image_png_file ? (
                            <img src={badge.image_png_file} alt={badge.name} className="w-full h-full object-contain" loading="lazy" />
                          ) : badge.image_url ? (
                            <img src={badge.image_url} alt={badge.name} className="w-full h-full object-cover rounded" style={{imageRendering: 'pixelated'}} loading="lazy" />
                          ) : (
                            badge.icon
                          )}
                        </div>
                        <span className="text-[10px] font-medium text-purple-900 leading-tight line-clamp-2">
                          {badge.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="px-5 pb-5 pt-5">
                {/* Vídeo de Apresentação */}
                {walker.video_intro_url && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <PlayCircle className="w-5 h-5 text-purple-600" />
                      Apresentação em Vídeo
                    </h2>
                    <div className="rounded-xl overflow-hidden shadow-lg bg-black aspect-video relative group max-w-2xl">
                      <video 
                        src={walker.video_intro_url} 
                        controls 
                        className="w-full h-full object-cover"
                        poster={walker.photo_url}
                      >
                        Seu navegador não suporta o elemento de vídeo.
                      </video>
                    </div>
                  </div>
                )}

                <ServiceList services={walker.services_offered || []} type="walker" />

                {/* Compact Details Section */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {/* Service Areas & Map */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      {t('serviceAreas', language)}
                    </h2>
                    <div className="h-48 rounded-lg overflow-hidden border border-gray-200">
                      <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
                        <ServiceAreaMap walker={walker} />
                      </Suspense>
                    </div>
                    {walker.service_areas && walker.service_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {walker.service_areas.map((area, idx) => (
                          <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {area.area_name} ({area.radius_km}km)
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Preferences & Capabilities */}
                  <div className="space-y-4">
                    {walker.dog_sizes && walker.dog_sizes.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{t('dogSizesHandle', language)}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {walker.dog_sizes.map(size => (
                            <Badge key={size} className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 text-xs">
                              {getSizeLabel(size)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {walker.availability && walker.availability.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{t('availability', language)}</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {walker.availability.map(time => (
                            <Badge key={time} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 text-xs">
                              {getTimeLabel(time)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {walker.dog_breeds_handled && walker.dog_breeds_handled.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{t('breedsWorkWith', language)}</h3>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {walker.dog_breeds_handled.map(breed => (
                            <Badge 
                              key={breed}
                              variant="outline"
                              className={`${walker.breed_specialization?.includes(breed) ? 'bg-green-50 border-green-600 text-green-700 font-medium' : 'text-gray-600'} text-[10px]`}
                            >
                              {breed}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 px-1">
                    <p className="text-[10px] text-gray-500 italic flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Caso a localização no mapa não esteja precisa, recomendamos compartilhar a localização em tempo real pelo WhatsApp.
                    </p>
                  </div>
                </div>

                {/* FAQ Section */}
                {walker.faq && walker.faq.length > 0 && (
                  <div className="mb-6 border-t border-gray-100 pt-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-blue-600" />
                      Perguntas Frequentes
                    </h2>
                    <Accordion type="single" collapsible className="w-full">
                      {walker.faq.map((item, idx) => (
                        <AccordionItem key={idx} value={`item-${idx}`}>
                          <AccordionTrigger className="text-left font-medium text-gray-800 hover:text-blue-600">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-600">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap mt-4">
                  <FavoriteButton walker={walker} user={user} />
                </div>
              </div>
            </div>
        </div>

        {/* BOOKING SECTION - SPLIT LAYOUT */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8" id="booking-section">
            {/* LEFT: CALENDAR */}
            <Card className="border-0 shadow-md h-fit">
              <CardHeader className="py-4 px-5">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  {t('availability', language)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <AvailabilityCalendar
                  availabilityData={availability}
                  bookings={walkerBookings}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  locale={currentLocale}
                />
              </CardContent>
            </Card>

            {/* RIGHT: BOOKING FORM (Compact) */}
            <div className="space-y-5" id="booking-form-section">
                {selectedDate ? (
                    <BookingForm
                        professional={walker}
                        onClose={handleBookingInitiated}
                        initialDate={selectedDate}
                        key={selectedDate?.toISOString()} // Force re-render on date change
                    />
                ) : (
                    <Card className="border-dashed border-2 border-gray-200 shadow-none h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 bg-gray-50/50">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <Calendar className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione uma data</h3>
                        <p className="text-gray-500 max-w-xs">
                            Clique em um dia disponível (verde) no calendário à esquerda para iniciar o agendamento.
                        </p>
                    </Card>
                )}

                {/* Recurring Option */}
                {userDogs.length > 0 && (
                  <Card className="border border-purple-200 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50">
                    <CardHeader className="py-3 px-5">
                      <CardTitle className="text-base flex items-center gap-2 text-purple-800">
                        <Repeat className="w-4 h-4" />
                        {t('recurringWalks', language)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <p className="text-xs text-gray-600 mb-3">Garanta o mesmo passeador toda semana com desconto.</p>
                      <Select
                        value={selectedDogForRecurring?.id || ""}
                        onValueChange={(dogId) => {
                          const dog = userDogs.find(d => d.id === dogId);
                          setSelectedDogForRecurring(dog);
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder={t('selectPet', language)} />
                        </SelectTrigger>
                        <SelectContent>
                          {userDogs.map((dog) => (
                            <SelectItem key={dog.id} value={dog.id}>
                              🐕 {dog.dog_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={() => setShowRecurringModal(true)}
                        disabled={!selectedDogForRecurring || walker.verification_status !== "verified"}
                        className="w-full mt-3 text-white h-9 text-xs hover:opacity-90"
                        style={{
                          background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
                        }}
                        size="sm"
                      >
                        {t('setupSchedule', language)}
                      </Button>
                    </CardContent>
                  </Card>
                )}
            </div>
        </div>

        {/* BOTTOM: REVIEWS */}
        <Card className="border-0 shadow-md">
          <CardHeader className="py-4 px-5 bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {t('reviews', language)} ({reviews.length})
              {averageRating > 0 && <span className="text-sm font-normal text-gray-500 ml-2">Média: {averageRating.toFixed(1)}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loadingReviews ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('noReviewsYet', language)}</h3>
                <p className="text-gray-600">{t('beFirstReview', language)}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recurring Booking Modal */}
      <AnimatePresence>
        {showRecurringModal && selectedDogForRecurring && (
          <RecurringBookingModal
            walker={walker}
            dog={selectedDogForRecurring}
            onClose={() => setShowRecurringModal(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['scheduledAppointments'] });
              toast.success("Agendamento recorrente criado! Seu agendamento recorrente foi configurado com sucesso.");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}