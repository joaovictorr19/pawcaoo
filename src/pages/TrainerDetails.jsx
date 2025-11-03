
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Award, Phone, Video, User as UserIcon, ShieldCheck, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReviewCard from "../components/reviews/ReviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import BookingForm from "../components/booking/BookingForm"; // Assuming BookingForm is located here

export default function TrainerDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showBookingForm, setShowBookingForm] = useState(false);

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
    enabled: !!trainer, // Only fetch if trainer data is available
    initialData: [],
  });

  const { data: trainerBookings } = useQuery({
    queryKey: ['trainerBookings', trainerId],
    queryFn: () => base44.entities.TrainingBooking.filter({ trainer_id: trainerId }),
    enabled: !!trainerId, // Only fetch if trainer ID is available
    initialData: [],
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : trainer?.rating || 5;

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      // Create TrainingBooking record
      const booking = await base44.entities.TrainingBooking.create({
        ...bookingData,
        trainer_id: trainer.id,
        trainer_name: trainer.trainer_name,
        owner_email: user?.email, // Use current user's email for the owner
        payment_status: "held", // Payment is held until confirmed by trainer
        completion_code: Math.random().toString(36).substring(2, 8).toUpperCase()
      });

      // Create Payment record
      await base44.entities.Payment.create({
        booking_id: booking.id,
        payer_email: user?.email,
        payer_name: bookingData.owner_name,
        recipient_email: trainer.created_by, // Trainer's email (creator of the profile)
        recipient_name: trainer.trainer_name,
        service_amount: bookingData.service_amount,
        platform_fee: bookingData.platform_fee,
        total_amount: bookingData.total_amount,
        platform_fee_percentage: 15, // Example platform fee percentage
        status: "held",
        payment_method: bookingData.payment_method,
        held_date: new Date().toISOString()
      });

      // Send confirmation notifications
      await base44.entities.Notification.create({
        recipient_email: user?.email,
        title: "Training Session Confirmed!",
        message: `Your training session with ${trainer.trainer_name} is confirmed for ${bookingData.session_date} at ${bookingData.session_time}.`,
        type: "booking",
        related_id: booking.id,
        action_url: "/MyBookings",
        priority: "high"
      });

      await base44.entities.Notification.create({
        recipient_email: trainer.created_by,
        title: "New Training Booking",
        message: `${bookingData.owner_name} has booked a session for ${bookingData.dog_name} on ${bookingData.session_date} at ${bookingData.session_time}.`,
        type: "booking",
        related_id: booking.id,
        action_url: "/MyBookings",
        priority: "high"
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingBookings'] }); // Invalidate general bookings list
      queryClient.invalidateQueries({ queryKey: ['trainerBookings', trainerId] }); // Invalidate trainer's specific bookings
      setShowBookingForm(false); // Close the booking form
      navigate(createPageUrl('MyBookings')); // Navigate to the user's bookings page
    },
    onError: (error) => {
      console.error("Failed to create booking:", error);
      // Optionally, add user-friendly error feedback here (e.g., a toast notification)
    }
  });

  const handleBooking = async (bookingData) => {
    await createBookingMutation.mutateAsync(bookingData);
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

  if (!trainer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Trainer not found</h2>
          <Button onClick={() => navigate(createPageUrl('Trainers'))}>
            Back to Trainers
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
          className="mb-6 border-purple-200 hover:bg-purple-50"
          onClick={() => navigate(createPageUrl('Trainers'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trainers
        </Button>

        {/* Profile Header */}
        <Card className="overflow-hidden border-0 shadow-2xl mb-6">
          <div className="relative h-96 bg-gradient-to-br from-purple-100 to-blue-100">
            {trainer.photo_url ? (
              <img
                src={trainer.photo_url}
                alt={trainer.trainer_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-purple-600">
                    {trainer.trainer_name?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute top-6 right-6 flex flex-col gap-3">
              {trainer.verification_status === "verified" && (
                <Badge className="bg-purple-500 text-white border-0 shadow-lg text-base px-4 py-2">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Certified Trainer
                </Badge>
              )}
              <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg text-lg px-4 py-2">
                <Star className="w-5 h-5 mr-2 fill-yellow-400 text-yellow-400" />
                {averageRating.toFixed(1)} ({reviews.length} reviews)
              </Badge>
            </div>
          </div>

          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {trainer.trainer_name}
                </h1>
                <div className="flex items-center text-gray-600 text-lg">
                  <MapPin className="w-5 h-5 mr-2" />
                  {trainer.location}
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-4xl font-bold text-purple-600">
                  €{trainer.hourly_rate}
                </div>
                <div className="text-gray-600">per hour</div>
                <div className="text-xs text-gray-500 mt-1">+15% platform fee</div>
              </div>
            </div>

            {trainer.bio && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">About Me</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {trainer.bio}
                </p>
              </div>
            )}

            {/* Certifications */}
            {trainer.certifications && trainer.certifications.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-6 h-6 text-purple-600" />
                  Professional Certifications
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {trainer.certifications.map((cert, idx) => (
                    <div key={idx} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                      <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                      {cert.year && <p className="text-sm text-gray-500">Year: {cert.year}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specialties */}
            {trainer.training_specialties && trainer.training_specialties.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Training Specialties</h3>
                <div className="flex flex-wrap gap-3">
                  {trainer.training_specialties.map(specialty => (
                    <Badge
                      key={specialty}
                      className="bg-purple-100 text-purple-700 border-purple-200 text-base px-4 py-2"
                    >
                      {getSpecialtyLabel(specialty)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Consultation Options */}
            {trainer.consultation_options && trainer.consultation_options.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Available Consultation Methods</h3>
                <div className="flex gap-3">
                  {trainer.consultation_options.map(method => (
                    <Badge key={method} className="bg-blue-100 text-blue-700 text-base px-4 py-2">
                      {method === "online" && <Video className="w-4 h-4 mr-2" />}
                      {method === "in_person" && <UserIcon className="w-4 h-4 mr-2" />}
                      <span className="capitalize">{method.replace('_', ' ')}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              {trainer.experience_years && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Experience</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {trainer.experience_years} years
                    </div>
                  </div>
                </div>
              )}
              {trainer.total_clients > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Trained Clients</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {trainer.total_clients} dogs
                    </div>
                  </div>
                </div>
              )}
              {trainer.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Contact</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {trainer.phone}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Package Pricing */}
            {trainer.package_rates && (
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
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg h-14 px-8 text-lg font-semibold"
                onClick={() => setShowBookingForm(true)}
                disabled={trainer.verification_status !== "verified"}
              >
                {trainer.verification_status === "verified" ? "Book Training Session" : "Verification Pending"}
              </Button>
              
              <Button
                variant="outline"
                className="h-14 px-6 border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                onClick={() => navigate(createPageUrl(`Messages?trainer_id=${trainer.id}`))}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Message
              </Button>
            </div>
          </CardContent>
        </Card>

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
            trainer={trainer}
            availability={availability} // Pass trainer's availability
            bookings={trainerBookings}   // Pass trainer's existing bookings
            onSubmit={handleBooking}
            onCancel={() => setShowBookingForm(false)}
            isProcessing={createBookingMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
