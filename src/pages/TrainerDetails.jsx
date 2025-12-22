import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Award, Phone, Video, User as UserIcon, ShieldCheck, MessageCircle, Target } from "lucide-react";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import TrainerVerifiedBadge from "@/components/ui/TrainerVerifiedBadge";
import GoldEmployeeBadge from "@/components/ui/GoldEmployeeBadge";
import InstagramVerifiedBadge from "@/components/ui/InstagramVerifiedBadge";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReviewCard from "../components/reviews/ReviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import BookingForm from "../components/booking/BookingForm";
import { format } from 'date-fns';
import { useCreateNotification } from "../components/NotificationService";
import ProfessionalProfileHeader from "../components/professionals/ProfessionalProfileHeader";
import ServiceList from "../components/professionals/ServiceList";
import { AnimatePresence } from "framer-motion";
import CheckoutModal from "../components/payments/CheckoutModal";
import { useTheme } from "@/components/ThemeContext";

export default function TrainerDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const createNotification = useCreateNotification();

  const urlParams = new URLSearchParams(window.location.search);
  const trainerId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: trainers, isLoading } = useQuery({
    queryKey: ['trainers'],
    queryFn: () => base44.entities.TrainerProfile.list(),
    initialData: [],
  });

  const trainer = trainers.find(t => t.id === trainerId);

  const { data: reviews, isLoading: loadingReviews } = useQuery({
    queryKey: ['trainerReviews', trainerId],
    queryFn: () => base44.entities.Review.filter({ trainer_id: trainerId }, '-created_date'),
    enabled: !!trainerId,
    initialData: [],
  });

  const { data: availability } = useQuery({
    queryKey: ['trainerAvailability', trainerId],
    queryFn: () => base44.entities.CalendarAvailability.filter({
      professional_email: trainer?.created_by
    }),
    enabled: !!trainer,
    initialData: [],
  });

  const { data: trainerBookings } = useQuery({
    queryKey: ['trainerBookings', trainerId],
    queryFn: () => base44.entities.TrainingBooking.filter({ trainer_id: trainerId }),
    enabled: !!trainerId,
    initialData: [],
  });

  // FETCH USER PROFILE TO GET PINNED BADGES
  const { data: userProfile } = useQuery({
    queryKey: ['trainerUserProfile', trainer?.created_by],
    queryFn: async () => {
      if (!trainer?.created_by) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: trainer.created_by });
      return profiles[0] || null;
    },
    enabled: !!trainer?.created_by,
  });

  // FETCH PINNED BADGES BASED ON USER PROFILE
  const { data: trainerBadges = [] } = useQuery({
    queryKey: ['trainerPinnedBadges', userProfile?.pinned_badge_ids, userProfile?.highlighted_emblem_id],
    queryFn: async () => {
      if (!userProfile) return [];
      
      // Priority: highlighted_emblem_id for slot 0, then pinned_badge_ids
      const pinnedIds = [];
      if (userProfile.highlighted_emblem_id) {
        pinnedIds.push(userProfile.highlighted_emblem_id);
      }
      if (userProfile.pinned_badge_ids && userProfile.pinned_badge_ids.length > 0) {
        pinnedIds.push(...userProfile.pinned_badge_ids.filter(id => id !== userProfile.highlighted_emblem_id));
      }
      
      if (pinnedIds.length === 0) return [];
      
      // Fetch only the pinned badges
      const allBadges = await base44.entities.UserBadge.filter({ user_email: trainer.created_by });
      const badgeDefinitions = await base44.entities.BadgeDefinition.list();
      
      return pinnedIds.slice(0, 4).map(id => {
        return allBadges.find(b => (b.badge_id || b.id) === id) || 
               badgeDefinitions.find(b => b.id === id);
      }).filter(Boolean);
    },
    enabled: !!userProfile && !!trainer?.created_by,
    initialData: [],
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : trainer?.rating || 5;

  // Function to handle booking completion from BookingForm
  const handleBookingInitiated = (booking) => {
    setCurrentBooking({
      ...booking,
      user: user, // Add user for CheckoutModal
      walker_email: trainer.created_by, // Map for CheckoutModal
      walker_name: trainer.trainer_name, // Map for CheckoutModal
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

    try {
      // Create TrainingBooking (CheckoutModal normally creates Booking, but we might want specific here)
      // IMPORTANT: CheckoutModal creates 'Booking'. For Trainers we want 'TrainingBooking'.
      // This is where the unified checkout modal is tricky.
      // We'll let CheckoutModal create 'Booking' entity for now to unify the system, 
      // OR we create TrainingBooking here manually after success.
      // Since CheckoutModal does the entity creation, we should stick with it or refactor it to be generic.
      // Given the "revise duplication" task, unifying on 'Booking' entity might be cleaner if fields allow.
      // 'Booking' has 'walker_id'. We can add 'trainer_id' or just use 'walker_id' as 'professional_id'.
      // But let's stick to the existing pattern of notifying and creating specific entities if possible.
      // CheckoutModal actually calls createBooking internally. 
      
      // Notification
      await createNotification.mutateAsync({
        recipient_email: trainer.created_by,
        title: '🎉 Nova Sessão de Treino Confirmada!',
        message: `${user.full_name} reservou e pagou um treino para ${currentBooking.dog_name} em ${format(new Date(currentBooking.walk_date), 'dd/MM/yyyy')}.`,
        type: 'booking',
        related_id: currentBooking.id,
        action_url: `/MyBookings?id=${currentBooking.id}`,
        priority: 'high'
      });

      await createNotification.mutateAsync({
        recipient_email: user.email,
        title: '✅ Treino Confirmado!',
        message: `Sua sessão com ${trainer.trainer_name} foi confirmada.`,
        type: 'booking',
        related_id: currentBooking.id,
        action_url: `/MyBookings?id=${currentBooking.id}`,
        priority: 'normal'
      });

      await base44.entities.TrainerProfile.update(trainer.id, {
        total_clients: (trainer.total_clients || 0) + 1
      });

      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      navigate(createPageUrl(`MyBookings?id=${currentBooking.id}`));
      
    } catch (error) {
      console.error("Error post-payment:", error);
    }
  };

  const getSpecialtyLabel = (specialty) => {
    const labels = {
      basic_obedience: "Basic Obedience",
      advanced_obedience: "Advanced Obedience",
      behavior_modification: "Behavior Modification",
      puppy_training: "Puppy Training",
      socialization: "Socialization",
      aggression: "Aggression Issues",
      anxiety: "Anxiety & Fear",
      potty_training: "Potty Training",
      leash_training: "Leash Training",
      service_dog: "Service Dog Training",
      therapy_dog: "Therapy Dog Training",
      agility: "Agility Training",
      tricks: "Tricks & Commands"
    };
    return labels[specialty] || specialty;
  };

  const getMethodologyLabel = (methodName) => {
    const labels = {
      positive_reinforcement: "Positive Reinforcement",
      clicker_training: "Clicker Training",
      model_rival: "Model-Rival",
      relationship_based: "Relationship-Based",
      science_based: "Science-Based",
      balanced_training: "Balanced Training"
    };
    return labels[methodName] || methodName;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-96 w-full rounded-3xl mb-6" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!trainerId) {
    navigate(createPageUrl('Home'));
    return null;
  }

  if (!trainer && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trainer not found</h2>
          <Button 
            onClick={() => navigate(createPageUrl('Home'))}
            className="text-white hover:opacity-90"
            style={{
              background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50">
      <div className="max-w-5xl mx-auto p-6">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate(createPageUrl('Home'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-0 mb-6">
          <ProfessionalProfileHeader 
            professional={trainer} 
            type="trainer"
            reviews={reviews}
            averageRating={averageRating}
            customBadges={
              <>
                {trainer.verification_status === 'verified' && <VerifiedBadge size="lg" />}
                {trainer.is_verified_trainer && <TrainerVerifiedBadge size="lg" />}
                {trainer.is_pawcao_employee && <GoldEmployeeBadge size="md" />}
              </>
            }
          />

          {/* Emblemas em Destaque do Perfil Pessoal */}
          {trainerBadges.length > 0 && (
            <div className="px-8 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Conquistas em Destaque ({trainerBadges.length})
                </h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {trainerBadges.map((badge, idx) => (
                  <div 
                    key={`badge-${badge.id || idx}`}
                    className="flex flex-col items-center text-center p-2 bg-purple-50 rounded-lg border border-purple-100 hover:shadow-sm transition-all" 
                    title={badge.description}
                  >
                    <div className="text-2xl mb-1 h-8 w-8 flex items-center justify-center">
                      {badge.image_png_file ? (
                        <img src={badge.image_png_file} alt={badge.name} className="w-full h-full object-contain" loading="lazy" />
                      ) : badge.image_url ? (
                        <img src={badge.image_url} alt={badge.name} className="w-full h-full object-cover rounded" loading="lazy" />
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
          
          <div className="px-8 pb-8 pt-4">
            <ServiceList services={trainer.services_offered} type="trainer" />

            {/* Training Specialties - ENHANCED */}
            {trainer.training_specialties && trainer.training_specialties.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-6 h-6 text-purple-600" />
                  Training Specialties
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trainer.training_specialties.map(specialty => (
                    <div
                      key={specialty}
                      className="bg-gradient-to-r from-purple-100 to-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center hover:shadow-md transition-all"
                    >
                      <div className="text-2xl mb-2">
                        {specialty === 'basic_obedience' && '🎯'}
                        {specialty === 'advanced_obedience' && '⭐'}
                        {specialty === 'behavior_modification' && '🔧'}
                        {specialty === 'puppy_training' && '🐕'}
                        {specialty === 'socialization' && '🤝'}
                        {specialty === 'aggression' && '⚠️'}
                        {specialty === 'anxiety' && '💙'}
                        {specialty === 'potty_training' && '🚽'}
                        {specialty === 'leash_training' && '🦮'}
                        {specialty === 'service_dog' && '🦺'}
                        {specialty === 'therapy_dog' && '❤️'}
                        {specialty === 'agility' && '🏃'}
                        {specialty === 'tricks' && '✨'}
                      </div>
                      <div className="font-semibold text-purple-900">
                        {getSpecialtyLabel(specialty)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Training Methodologies - ENHANCED */}
            {trainer.training_methodologies && trainer.training_methodologies.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-6 h-6 text-purple-600" />
                  Training Methodologies & Approach
                </h3>
                <div className="space-y-3">
                  {trainer.training_methodologies.map((method, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-5 ${
                        method.primary
                          ? 'bg-gradient-to-r from-purple-100 to-purple-50 border-2 border-purple-500 ring-2 ring-purple-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {getMethodologyLabel(method.methodology_name)}
                        </h4>
                        {method.primary && (
                         <Badge 
                           className="text-white text-sm border-0"
                           style={{
                             background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
                           }}
                         >
                           ★ Primary Method
                         </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{method.description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Training Philosophy:</strong> This trainer uses evidence-based methods tailored to your dog's individual needs and learning style.
                  </p>
                </div>
              </div>
            )}

            {/* Consultation Options */}
            {trainer.consultation_options && trainer.consultation_options.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Available Consultation Methods</h3>
                <div className="flex gap-3">
                  {trainer.consultation_options.map(method => (
                    <Badge 
                      key={method} 
                      className="text-base px-4 py-2"
                      style={{ 
                        backgroundColor: `${colors?.primary || '#3b82f6'}20`,
                        color: colors?.primary || '#3b82f6'
                      }}
                    >
                      {method === "online" && <Video className="w-4 h-4 mr-2" />}
                      {method === "in_person" && <UserIcon className="w-4 h-4 mr-2" />}
                      <span className="capitalize">{method.replace('_', ' ')}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Package Pricing (old structure, conditional if new services_offered is not present) */}
            {(!trainer.services_offered || trainer.services_offered.length === 0) && trainer.package_rates && (
              <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Package Options</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {trainer.package_rates.single_session && (
                    <div className="bg-white rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">€{trainer.package_rates.single_session}</div>
                      <div className="text-sm text-gray-600">Single Session</div>
                    </div>
                  )}
                  {trainer.package_rates.package_5 && (
                    <div className="bg-white rounded-lg p-4 text-center border-2 border-purple-300">
                      <div className="text-2xl font-bold text-purple-600">€{trainer.package_rates.package_5}</div>
                      <div className="text-sm text-gray-600">5 Sessions Package</div>
                      <Badge className="mt-2 bg-purple-100 text-purple-700">Save 10%</Badge>
                    </div>
                  )}
                  {trainer.package_rates.package_10 && (
                    <div className="bg-white rounded-lg p-4 text-center border-2 border-purple-500">
                      <div className="text-2xl font-bold text-purple-600">€{trainer.package_rates.package_10}</div>
                      <div className="text-sm text-gray-600">10 Sessions Package</div>
                      <Badge className="mt-2 bg-purple-500 text-white">Save 20%</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1 text-white shadow-lg h-14 px-8 text-lg font-semibold hover:opacity-90"
                style={{
                  background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
                }}
                onClick={() => setShowBookingForm(true)}
                disabled={trainer.verification_status !== "verified"}
              >
                {trainer.verification_status === "verified" ? "Book Training Session" : "Verification Pending"}
              </Button>
              
              <Button
                variant="outline"
                className="h-14 px-6"
                onClick={() => navigate(createPageUrl(`Messages?trainer_id=${trainer.id}`))}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <Card className="border-0 shadow-2xl mb-6">
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

        {/* Conditional Booking Form */}
        {showBookingForm && (
          <BookingForm
            professional={trainer}
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
    </div>
  );
}