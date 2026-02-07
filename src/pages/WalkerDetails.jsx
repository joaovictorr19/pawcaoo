import React, { useState, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Clock, DollarSign, Phone, Calendar, ShieldCheck, Video, Repeat, CheckCircle, Award, PlayCircle, HelpCircle, ChevronDown, User as UserIcon, MessageCircle, Heart, Info, Dog, Home, Cat, Bird, Edit, Save, X, Loader2 } from "lucide-react";
import { ReptileIcon, ArachnidIcon, RodentIcon } from "@/components/professionals/AnimalIcons";
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
import { Helmet } from "react-helmet-async";
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
        size="sm"
        className="h-9 gap-2"
        style={{
          borderColor: isFavorite ? '#ef4444' : `${colors?.primary || '#3b82f6'}40`,
          color: isFavorite ? '#ef4444' : colors?.primary || '#3b82f6'
        }}
        onClick={() => toggleFavoriteMutation.mutate()}
      >
         <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
         {isFavorite ? 'Remover' : 'Favoritar'}
      </Button>
  );
}

import PawCaoLogo from "@/components/PawCaoLogo";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import InstagramVerifiedBadge from "@/components/ui/InstagramVerifiedBadge";
import { AnimalIconsWithLabels } from "@/components/professionals/AnimalIcons";
import PawCaoSealBadge from "@/components/ui/PawCaoSealBadge";
import TrainerVerifiedBadge from "@/components/ui/TrainerVerifiedBadge";
import GoldEmployeeBadge from "@/components/ui/GoldEmployeeBadge";

export default function WalkerDetails() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();
  
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedDogForRecurring, setSelectedDogForRecurring] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingVerification, setEditingVerification] = useState(false);

  // Scroll to top on mount
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const walkerId = urlParams.get('id') || urlParams.get('walker_id');
  const serviceParam = urlParams.get('service');
  
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
        const results = await base44.entities.WalkerProfile.filter({ id: walkerId });
        if (results && results.length > 0) {
          return results[0];
        }

        const byUserId = await base44.entities.WalkerProfile.filter({ user_id: walkerId });
        if (byUserId && byUserId.length > 0) {
          return byUserId[0];
        }

        if (walkerId.includes('@')) {
          const byEmail = await base44.entities.WalkerProfile.filter({ created_by: walkerId });
          if (byEmail && byEmail.length > 0) {
            return byEmail[0];
          }
        }

        return null;
      } catch (e) {
        console.error("Critical Error fetching walker profile:", e);
        return null;
      }
    },
    enabled: !!walkerId,
    retry: 1,
  });

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['walkerReviews', walkerId],
    queryFn: async () => {
      if (!walkerId) return [];
      const allReviews = await base44.entities.Review.filter({ walker_id: walkerId }, '-created_date');
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

  const { data: walkerUserProfile } = useQuery({
    queryKey: ['walkerUserProfile', walker?.created_by],
    queryFn: async () => {
      if (!walker?.created_by) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: walker.created_by });
      return profiles[0] || null;
    },
    enabled: !!walker?.created_by,
  });

  const { data: walkerBadges = [] } = useQuery({
    queryKey: ['walkerPinnedBadges', walkerUserProfile?.pinned_badge_ids, walkerUserProfile?.highlighted_emblem_id, walkerUserProfile?.user_email],
    queryFn: async () => {
      if (!walkerUserProfile?.user_email) return [];
      
      const pinnedIds = [];
      if (walkerUserProfile.highlighted_emblem_id) {
        pinnedIds.push(walkerUserProfile.highlighted_emblem_id);
      }
      if (walkerUserProfile.pinned_badge_ids && walkerUserProfile.pinned_badge_ids.length > 0) {
        pinnedIds.push(...walkerUserProfile.pinned_badge_ids.filter(id => id !== walkerUserProfile.highlighted_emblem_id));
      }
      
      if (pinnedIds.length === 0) return [];
      
      const allBadges = await base44.entities.UserBadge.filter({ user_email: walkerUserProfile.user_email });
      const badgeDefinitions = await base44.entities.BadgeDefinition.list();
      
      return pinnedIds.slice(0, 4).map(id => {
        const userBadge = allBadges.find(b => (b.badge_id || b.id) === id);
        if (userBadge) return userBadge;
        return badgeDefinitions.find(b => b.badge_id === id || b.id === id);
      }).filter(Boolean);
    },
    enabled: !!walkerUserProfile?.user_email,
    initialData: [],
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : (walker?.total_walks > 0 ? walker?.rating : 0);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    if (!user) {
      toast.error(t('loginRequired', language) + ' - ' + t('loginToBook', language));
    }
  };

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

  const handleBookingInitiated = async (booking) => {
    setSelectedDate(null);

    try {
      createNotification.mutate({
        recipient_email: walker.created_by,
        title: 'Nova Solicitação de Agendamento',
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <PawCaoLogo size="large" animated={false} showText={false} />
          <p className="text-green-600 font-medium mt-4 animate-pulse">{t('loading', language)}</p>
        </div>
      </div>
    );
  }

  if (!walker) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ups! Não conseguimos encontrar este Passeador.</h2>
          <p className="text-gray-600 mb-6">O perfil pode ter sido desativado ou o link pode estar incorreto.</p>
          <Button 
            onClick={() => navigate(createPageUrl('Home'))} 
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Voltar à Busca
          </Button>
        </div>
      </div>
    );
  }

  if (!walker.is_active && user?.email !== walker.created_by && user?.role !== 'admin') {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{`Contrate ${walker.walker_name} no PawCão | ${walker.location}`}</title>
        <meta name="description" content={`${walker.walker_name} - Passeador avaliado com ${averageRating?.toFixed(1)} estrelas. ${walker.bio?.substring(0, 100) || 'Serviços profissionais de pet care.'}`} />
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`Contrate ${walker.walker_name} no PawCão`} />
        <meta property="og:description" content={`Passeador avaliado com ${averageRating?.toFixed(1)} estrelas | ${walker.location}`} />
        <meta property="og:image" content={walker.photo_url || 'https://pawcao.net/social-preview.jpg'} />
      </Helmet>

      <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">
      <div className="w-full max-w-5xl mx-auto">
        {/* Header com Voltar */}
        <Button
          variant="ghost"
          className="mb-4 hover:bg-white/50"
          onClick={() => navigate(createPageUrl('Home'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Layout em 2 Colunas: Perfil | Calendário + Formulário */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUNA ESQUERDA: Perfil Compacto */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Card Perfil */}
            <Card className="bg-white shadow-sm border-0 overflow-hidden">
              {/* Foto de Capa */}
              {walker.cover_photo_url && (
                <div className="h-32 w-full bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden">
                  <img 
                    src={walker.cover_photo_url} 
                    alt="Capa"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardContent className={`p-5 ${walker.cover_photo_url ? '-mt-12' : ''}`}>
                {/* Foto + Nome */}
                <div className="flex flex-col items-center text-center mb-4">
                  <div className="relative mb-3">
                    <img 
                      src={walker.photo_url || 'https://via.placeholder.com/150'} 
                      alt={walker.walker_name}
                      className={`w-24 h-24 rounded-full object-cover shadow-lg ${walker.cover_photo_url ? 'border-4 border-white' : 'border-4 border-gray-100'}`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{walker.walker_name}</h1>
                    {walker.verification_status === 'verified' && (
                      <InstagramVerifiedBadge size="md" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-green-700 mt-0.5">
                    {walker.is_verified_trainer ? (language === 'pt' ? 'Treinador & Passeador Profissional' : 'Trainer & Professional Walker') : (language === 'pt' ? 'Passeador Profissional' : 'Professional Walker')}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {walker.location}
                  </div>
                  {averageRating > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500">({reviews.length})</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {walker.bio && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 text-center">
                    {walker.bio}
                  </p>
                )}

                {/* Preços */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tarifa por hora</span>
                    <span className="font-bold text-lg text-green-600">€{walker.hourly_rate}</span>
                  </div>
                  {walker.exotic_rate && (
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Animais exóticos</span>
                      <span className="font-bold text-green-600">€{walker.exotic_rate}</span>
                    </div>
                  )}
                </div>

                {/* Badges */}
                {walkerBadges.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      Conquistas
                    </h4>
                    <div className="space-y-2">
                      {walkerBadges.map((badge) => {
                        const rarityStyle = {
                          legendary: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-400' },
                          epic: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-400' },
                          rare: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-400' },
                          common: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' },
                        }[badge.rarity] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-400' };

                        return (
                          <div key={badge.id} className={`flex items-center gap-3 p-2.5 border ${rarityStyle.border} ${rarityStyle.bg}`} style={{ borderRadius: 0 }}>
                            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                              {badge.image_png_file ? (
                                <img src={badge.image_png_file} alt={badge.name} className="w-9 h-9 object-contain drop-shadow" loading="lazy" decoding="async" />
                              ) : badge.image_url ? (
                                <img src={badge.image_url} alt={badge.name} className="w-9 h-9 object-contain drop-shadow" loading="lazy" decoding="async" />
                              ) : (
                                <span className="text-2xl">{badge.icon || '🏆'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold ${rarityStyle.text} leading-tight`}>{badge.name}</p>
                              {badge.description && (
                                <p className="text-[11px] text-gray-500 leading-snug mt-0.5 line-clamp-2">{badge.description}</p>
                              )}
                            </div>
                            <div className={`w-2 h-2 flex-shrink-0 ${rarityStyle.dot}`} style={{ borderRadius: '50%' }} title={badge.rarity} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex justify-center">
                  <FavoriteButton walker={walker} user={user} />
                </div>
              </CardContent>
            </Card>

            {/* Card Animais Aceitos */}
            {walker.accepted_animals && walker.accepted_animals.length > 0 && (
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Dog className="w-4 h-4 text-green-600" />
                    Animais Aceitos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    <AnimalIconsWithLabels acceptedAnimals={walker.accepted_animals} language={language} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card Horários */}
            {walker.availability && walker.availability.length > 0 && (
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Disponibilidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {walker.availability.map(time => (
                      <Badge key={time} className="bg-blue-50 text-blue-700 text-xs">
                        {getTimeLabel(time)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card Tamanhos */}
            {walker.dog_sizes && walker.dog_sizes.length > 0 && (
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tamanhos Aceites</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {walker.dog_sizes.map(size => (
                      <Badge key={size} className="bg-gray-100 text-gray-700 text-xs">
                        {getSizeLabel(size)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* COLUNA DIREITA: Calendário + Formulário */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Calendário */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Selecione uma Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AvailabilityCalendar
                  availabilityData={availability}
                  bookings={walkerBookings}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  locale={currentLocale}
                  walkerEmail={walker?.created_by}
                  isInteractive={false}
                />
              </CardContent>
            </Card>

            {/* Formulário de Reserva */}
            <div id="booking-form-section">
              {selectedDate ? (
                <BookingForm
                  professional={walker}
                  onClose={handleBookingInitiated}
                  initialDate={selectedDate}
                  selectedServiceType={serviceParam}
                  key={selectedDate?.toISOString()}
                />
              ) : (
                <Card className="bg-white shadow-sm border-2 border-dashed border-gray-300">
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione uma data</h3>
                    <p className="text-sm text-gray-500">
                      Clique em um dia disponível no calendário acima
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Serviços Oferecidos */}
            {walker.services_offered?.length > 0 && (
              <Card className="bg-white shadow-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    Serviços Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {walker.services_offered.map((service, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{service.service_name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{service.description}</p>
                        </div>
                        <span className="font-bold text-green-600 ml-4">€{service.price}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Avaliações ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingReviews ? (
                  <Skeleton className="h-32" />
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Nenhuma avaliação ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
      {/* Recurring Modal */}
      <AnimatePresence>
        {showRecurringModal && selectedDogForRecurring && (
          <RecurringBookingModal
            walker={walker}
            dog={selectedDogForRecurring}
            onClose={() => setShowRecurringModal(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['scheduledAppointments'] });
              toast.success("Agendamento recorrente criado!");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}