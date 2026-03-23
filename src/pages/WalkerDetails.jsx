import React, { useState, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Clock, DollarSign, Phone, Calendar, ShieldCheck, Video, Repeat, CheckCircle, Award, PlayCircle, HelpCircle, ChevronDown, User as UserIcon, MessageCircle, Heart, Info, Dog, Home, Cat, Bird, Grid } from "lucide-react";
import { ReptileIcon, ArachnidIcon, RodentIcon } from "@/components/professionals/AnimalIcons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function WalkerDetails() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createNotification = useCreateNotification();
  
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedDogForRecurring, setSelectedDogForRecurring] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(null);

  // Scroll to top on mount
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const urlParams = new URLSearchParams(window.location.search);
  const walkerId = urlParams.get('id') || urlParams.get('walker_id');
  const serviceParam = urlParams.get('service');
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      let u = await base44.auth.me();
      try {
        const imp = JSON.parse(localStorage.getItem('impersonation') || 'null');
        if (imp?.targetUserId && u?.role === 'admin') {
           const t = await base44.entities.User.filter({ id: imp.targetUserId });
           if (t.length > 0) u = { ...t[0], isImpersonating: true };
        }
      } catch(e) {}
      return u;
    }
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

  // Mapeamento de Emblemas Hospedados (PNGs)
  const BADGE_ASSETS = {
    "verified": "/assets/badges/verified-pro.png",
    "top-walker": "/assets/badges/crown-walker.png",
    "dog-lover": "/assets/badges/heart-gold.png"
  };

  const { data: profileUser } = useQuery({
    queryKey: ['profileUser', walker?.created_by],
    queryFn: async () => {
      if (!walker?.created_by) return null;
      const users = await base44.entities.User.filter({ email: walker.created_by });
      return users[0] || null;
    },
    enabled: !!walker?.created_by,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['walkerUserProfile', walker?.created_by],
    queryFn: async () => {
      if (!walker?.created_by) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: walker.created_by });
      return profiles[0] || null;
    },
    enabled: !!walker?.created_by,
  });

  const { data: walkerBadges = [] } = useQuery({
    queryKey: ['walkerPinnedBadges', userProfile?.pinned_badge_ids, userProfile?.highlighted_emblem_id],
    queryFn: async () => {
      if (!userProfile) return [];
      
      const pinnedIds = [];
      if (userProfile.highlighted_emblem_id) {
        pinnedIds.push(userProfile.highlighted_emblem_id);
      }
      if (userProfile.pinned_badge_ids && userProfile.pinned_badge_ids.length > 0) {
        pinnedIds.push(...userProfile.pinned_badge_ids.filter(id => id !== userProfile.highlighted_emblem_id));
      }
      
      if (pinnedIds.length === 0) return [];
      
      const allBadges = await base44.entities.UserBadge.filter({ user_email: walker.created_by });
      const badgeDefinitions = await base44.entities.BadgeDefinition.list();
      
      return pinnedIds.slice(0, 4).map(id => {
        return allBadges.find(b => (b.badge_id || b.id) === id) || 
               badgeDefinitions.find(b => b.id === id);
      }).filter(Boolean);
    },
    enabled: !!userProfile && !!walker?.created_by,
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

      <div className="max-w-4xl mx-auto pt-6 pb-20 px-4">
        {/* HEADER ESTILO INSTAGRAM */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 mb-8">
          <div className="relative group">
            <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-orange-500 to-fuchsia-600">
              <img 
                src={profileUser?.profile_photo_url || walker?.photo_url || 'https://via.placeholder.com/150'} 
                className="w-full h-full rounded-full object-cover border-4 border-white" 
                alt={walker.walker_name}
              />
            </div>
            {(profileUser?.pawgo_status?.is_online || walker?.is_online) && (
              <span className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-white rounded-full animate-pulse shadow-sm" />
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <h2 className="text-xl font-light">@{profileUser?.username || walker?.walker_name?.replace(/\s+/g, '').toLowerCase() || 'usuario'}</h2>
              <div className="flex gap-2 justify-center md:justify-start">
                <Button size="sm" variant="outline" className="font-bold border-gray-300">Mensagem</Button>
                {(profileUser?.is_verified || walker?.verification_status === 'verified') && <ShieldCheck className="w-6 h-6 text-blue-500" />}
                <FavoriteButton walker={walker} user={user} />
              </div>
            </div>

            <div className="flex justify-center md:justify-start gap-8 text-sm">
              <span><strong>{profileUser?.global_profile?.total_posts || 0}</strong> posts</span>
              <span><strong>{profileUser?.total_referrals || 0}</strong> indicações</span>
              <span><strong>{profileUser?.gamification_level || userProfile?.gamification_level || 1}</strong> nível</span>
            </div>

            <div>
              <p className="font-bold text-gray-900">{profileUser?.global_profile?.full_name || walker?.walker_name}</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{profileUser?.bio || walker?.bio}</p>
            </div>

            {/* VITRINE DE EMBLEMAS (PNGs REAIS) */}
            <div className="flex gap-3 pt-2 justify-center md:justify-start">
              {walkerBadges.map((badge, i) => (
                <img 
                  key={i} 
                  src={badge.image_png_file || badge.image_url || BADGE_ASSETS[badge.slug] || '/assets/badges/default.png'} 
                  className="w-10 h-10 drop-shadow-md hover:scale-110 transition-transform object-contain"
                  title={badge.name}
                  alt={badge.name}
                />
              ))}
            </div>
          </div>
        </div>

        {/* TABS DE CONTEÚDO */}
        <Tabs defaultValue="pawgo" className="w-full">
          <TabsList className="w-full justify-center bg-transparent border-t rounded-none h-12 gap-12">
            <TabsTrigger value="feed" className="data-[state=active]:border-t-2 border-black rounded-none h-full uppercase text-[10px] tracking-widest gap-2">
              <Grid className="w-4 h-4" /> Publicações
            </TabsTrigger>
            <TabsTrigger value="pawgo" className="data-[state=active]:border-t-2 border-black rounded-none h-full uppercase text-[10px] tracking-widest gap-2">
              <Dog className="w-4 h-4" /> Serviços PawGo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-4">
            {/* O Feed da Rede Social será injetado aqui */}
            <div className="grid grid-cols-3 gap-1 md:gap-4">
               <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400 col-span-3 py-20 rounded-xl">
                 Sem publicações ainda
               </div>
            </div>
          </TabsContent>

          <TabsContent value="pawgo" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                 {/* Calendário */}
                 <Card className="bg-white shadow-sm border border-gray-200">
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

                 {/* Serviços Oferecidos */}
                 {walker.services_offered?.length > 0 && (
                   <Card className="bg-white shadow-sm border border-gray-200">
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
              </div>

              <div className="space-y-6">
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
                     <Card className="bg-white shadow-sm border-2 border-dashed border-gray-300 h-full min-h-[300px] flex items-center justify-center">
                       <CardContent className="py-12 text-center w-full">
                         <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                         <h3 className="text-lg font-semibold text-gray-900 mb-2">Selecione uma data</h3>
                         <p className="text-sm text-gray-500">
                           Clique em um dia disponível no calendário ao lado
                         </p>
                       </CardContent>
                     </Card>
                   )}
                 </div>

                 {/* Avaliações */}
                 <Card className="bg-white shadow-sm border border-gray-200">
                   <CardHeader className="pb-3">
                     <CardTitle className="text-base flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <Star className="w-5 h-5 text-yellow-500" />
                         Avaliações ({reviews.length})
                       </div>
                       {averageRating > 0 && (
                         <div className="flex items-center gap-1 text-sm bg-yellow-50 px-2 py-1 rounded-full text-yellow-700 font-bold">
                           {averageRating.toFixed(1)} <Star className="w-3 h-3 fill-yellow-500" />
                         </div>
                       )}
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
          </TabsContent>
        </Tabs>
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