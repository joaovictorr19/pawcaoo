import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Clock, DollarSign, Phone, Calendar, ShieldCheck, MessageCircle, Video, Repeat, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BookingForm from "../components/booking/BookingForm";
import ReviewCard from "../components/reviews/ReviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import { format } from "date-fns";
import RecurringBookingModal from "../components/booking/RecurringBookingModal";
import CheckoutModal from "../components/payments/CheckoutModal"; // Import CheckoutModal
import { AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useCreateNotification } from "../components/NotificationService"; // Import Notification Hook
import ProfessionalProfileHeader from "../components/professionals/ProfessionalProfileHeader";
import ServiceList from "../components/professionals/ServiceList";
import SEO from "../components/SEO";
import { generateServiceSchema, generateBreadcrumbSchema } from "../components/seoHelpers";

export default function WalkerDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createNotification = useCreateNotification(); // Use Notification Hook
  
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedDogForRecurring, setSelectedDogForRecurring] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const walkerId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userDogs = [] } = useQuery({
    queryKey: ['userDogs', user?.id],
    queryFn: () => base44.entities.Dog.filter({ owner_id: user?.id }),
    enabled: !!user?.id,
  });

  const { data: walkers, isLoading } = useQuery({
    queryKey: ['walkers'],
    queryFn: () => base44.entities.WalkerProfile.list(),
    initialData: [],
  });

  const walker = walkers.find(w => w.id === walkerId);

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['walkerReviews', walkerId],
    queryFn: () => base44.entities.Review.filter({ walker_id: walkerId }, '-created_date'),
    enabled: !!walkerId,
    initialData: [],
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

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : walker?.rating || 5;

  // Function to handle booking completion from BookingForm
  const handleBookingInitiated = (booking) => {
    setCurrentBooking({
      ...booking,
      user: user, // Add user for CheckoutModal
      walker_email: walker.created_by,
      walker_name: walker.walker_name,
      paymentMethods: [ // Mock payment methods
        { type: 'credit_card', last_four: '4242', is_default: true },
        { type: 'paypal', last_four: 'user@email.com', is_default: false }
      ]
    });
    setShowBookingForm(false);
    setShowCheckoutModal(true);
  };

  const handlePaymentSuccess = async (payment) => {
    if (!currentBooking) return;

    // Send notifications after payment
    try {
      // 1. Notify Walker
      await createNotification.mutateAsync({
        recipient_email: walker.created_by,
        title: '🎉 Nova Reserva Confirmada!',
        message: `${user.full_name} reservou e pagou um passeio para ${currentBooking.dog_name} em ${format(new Date(currentBooking.walk_date), 'dd/MM/yyyy')}.`,
        type: 'booking',
        related_id: currentBooking.id,
        action_url: `/MyBookings?id=${currentBooking.id}`,
        priority: 'high'
      });

      // 2. Notify Owner
      await createNotification.mutateAsync({
        recipient_email: user.email,
        title: '✅ Reserva Confirmada!',
        message: `Sua reserva com ${walker.walker_name} foi confirmada e o pagamento de €${payment.total_amount} processado com sucesso.`,
        type: 'booking',
        related_id: currentBooking.id,
        action_url: `/MyBookings?id=${currentBooking.id}`,
        priority: 'normal'
      });

      // 3. Update Walker Stats
      await base44.entities.WalkerProfile.update(walker.id, {
        total_walks: (walker.total_walks || 0) + 1
      });

      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      navigate(createPageUrl(`MyBookings?id=${currentBooking.id}`));
      
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-96 w-full rounded-3xl mb-6" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!walker) {
    // Auto-redirect to Home if walker not found (prevents getting stuck)
    // setTimeout(() => navigate(createPageUrl('Home')), 3000); 

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Passeador não encontrado</h2>
          <p className="text-gray-600 mb-6">O perfil que procura não existe ou foi removido.</p>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  const getSizeLabel = (size) => {
    const labels = {
      small: "Small Dogs",
      medium: "Medium Dogs",
      large: "Large Dogs",
      extra_large: "Extra Large Dogs"
    };
    return labels[size] || size;
  };

  const getTimeLabel = (time) => {
    const labels = {
      morning: "Morning (6am-12pm)",
      afternoon: "Afternoon (12pm-6pm)",
      evening: "Evening (6pm-10pm)",
      night: "Night (10pm-6am)"
    };
    return labels[time] || time;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <SEO 
        title={`${walker.walker_name} - Passeador de Cães em ${walker.location}`}
        description={`Reserve passeios com ${walker.walker_name}. ${walker.bio?.substring(0, 120)}... Avaliação: ${averageRating?.toFixed(1)}/5.`}
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
          className="mb-6 border-green-200 hover:bg-green-50"
          onClick={() => navigate(createPageUrl('Home'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Walkers
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-0">
              <ProfessionalProfileHeader 
                professional={walker} 
                type="walker" 
                reviews={reviews}
                averageRating={averageRating}
              />
              
              <div className="px-8 pb-8">
                <ServiceList services={walker.services_offered} type="walker" />

                {/* Service Areas - NEW */}
                {walker.service_areas && walker.service_areas.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Service Areas
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {walker.service_areas.map((area, idx) => (
                        <div key={idx} className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                          <h4 className="font-semibold text-gray-900 mb-2">{area.area_name}</h4>
                          {area.postal_codes && area.postal_codes.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {area.postal_codes.map(code => (
                                <Badge key={code} className="bg-green-600 text-white text-xs">
                                  {code}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-sm text-gray-600">
                            Radius: <span className="font-semibold">{area.radius_km} km</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {walker.dog_sizes && walker.dog_sizes.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Dog Sizes I Handle</h2>
                    <div className="flex flex-wrap gap-3">
                      {walker.dog_sizes.map(size => (
                        <Badge
                          key={size}
                          className="bg-green-100 text-green-700 border-green-200 text-base px-4 py-2"
                        >
                          {getSizeLabel(size)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dog Breeds - NEW */}
                {walker.dog_breeds_handled && walker.dog_breeds_handled.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Breeds I Work With</h2>
                    <div className="flex flex-wrap gap-2">
                      {walker.dog_breeds_handled.map(breed => (
                        <Badge
                          key={breed}
                          className={`${
                            walker.breed_specialization?.includes(breed)
                              ? 'bg-green-600 text-white border-green-700'
                              : 'bg-gray-100 text-gray-700 border-gray-300'
                          } text-sm px-3 py-1`}
                        >
                          {breed}
                          {walker.breed_specialization?.includes(breed) && " ★"}
                        </Badge>
                      ))}
                    </div>
                    {walker.breed_specialization && walker.breed_specialization.length > 0 && (
                      <p className="text-xs text-gray-600 mt-2">
                        ★ = Specialization
                      </p>
                    )}
                  </div>
                )}

                {walker.availability && walker.availability.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">Availability</h2>
                    <div className="flex flex-wrap gap-3">
                      {walker.availability.map(time => (
                        <Badge
                          key={time}
                          className="bg-blue-100 text-blue-700 border-blue-200 text-base px-4 py-2"
                        >
                          {getTimeLabel(time)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg h-14 px-8 text-lg font-semibold"
                    onClick={() => {
                      if (!user) {
                        base44.auth.redirectToLogin();
                      } else {
                        setShowBookingForm(true);
                      }
                    }}
                    disabled={walker.verification_status !== "verified"}
                  >
                    {walker.verification_status === "verified" ? "Book This Walker" : "Verification Pending"}
                  </Button>

                  <Button
                    variant="outline"
                    className="h-14 px-6 border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      if (!user) {
                        base44.auth.redirectToLogin();
                      } else {
                        navigate(createPageUrl(`Messages?walker_id=${walker.id}`));
                      }
                    }}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </div>

            {/* NEW: Availability Calendar */}
            <Card className="border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-green-600" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <AvailabilityCalendar
                  availabilityData={availability}
                  bookings={walkerBookings}
                  selectedDate={null}
                />
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="border-0 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Star className="w-6 h-6 text-yellow-500" />
                  Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loadingReviews ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-600">Be the first to leave a review!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1 space-y-6">
            {userDogs.length > 0 && (
              <Card className="border-2 border-purple-300 shadow-xl bg-gradient-to-br from-purple-50 to-blue-50">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Repeat className="w-5 h-5" />
                    Passeios Recorrentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Economize até <strong className="text-green-600">25%</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Mesmo passeador sempre</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Cancelamento flexível</span>
                    </div>
                  </div>

                  <Select
                    value={selectedDogForRecurring?.id || ""}
                    onValueChange={(dogId) => {
                      const dog = userDogs.find(d => d.id === dogId);
                      setSelectedDogForRecurring(dog);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu pet" />
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
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 h-12 font-bold"
                  >
                    <Repeat className="w-5 h-5 mr-2" />
                    Configurar Agendamento
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {showBookingForm && (
          <BookingForm
            professional={walker}
            onClose={handleBookingInitiated}
          />
        )}

        {/* Checkout Modal */}
        <AnimatePresence>
          {showCheckoutModal && currentBooking && (
            <CheckoutModal
              booking={currentBooking}
              onClose={() => setShowCheckoutModal(false)}
              onSuccess={handlePaymentSuccess}
            />
          )}
        </AnimatePresence>
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
              toast({
                title: "Agendamento recorrente criado!",
                description: "Seu agendamento recorrente foi configurado com sucesso.",
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}