
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Clock, DollarSign, Phone, Calendar, ShieldCheck, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BookingForm from "../components/booking/BookingForm";
import ReviewCard from "../components/reviews/ReviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import { format } from "date-fns";

export default function WalkerDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const walkerId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      // Create booking
      const booking = await base44.entities.Booking.create({
        ...bookingData,
        walker_id: walker.id,
        walker_name: walker.walker_name,
        payment_status: "held",
        completion_code: Math.random().toString(36).substring(2, 8).toUpperCase()
      });

      // Create payment record
      await base44.entities.Payment.create({
        booking_id: booking.id,
        payer_email: user?.email,
        payer_name: bookingData.owner_name,
        recipient_email: walker.created_by,
        recipient_name: walker.walker_name,
        service_amount: bookingData.service_amount,
        platform_fee: bookingData.platform_fee,
        total_amount: bookingData.total_amount,
        platform_fee_percentage: 15,
        status: "held",
        payment_method: bookingData.payment_method,
        held_date: new Date().toISOString()
      });

      // Send confirmation notification to owner
      await base44.entities.Notification.create({
        recipient_email: user?.email,
        title: "Booking Confirmed!",
        message: `Your walk with ${walker.walker_name} is confirmed for ${bookingData.walk_date} at ${bookingData.walk_time}`,
        type: "booking",
        related_id: booking.id,
        action_url: "/MyBookings",
        priority: "high"
      });

      // Send notification to walker
      await base44.entities.Notification.create({
        recipient_email: walker.created_by,
        title: "New Booking Request",
        message: `${bookingData.owner_name} has booked a walk for ${bookingData.dog_name} on ${bookingData.walk_date} at ${bookingData.walk_time}`,
        type: "booking",
        related_id: booking.id,
        action_url: "/MyBookings",
        priority: "high"
      });

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      navigate(createPageUrl('MyBookings'));
    },
  });

  const handleBooking = async (bookingData) => {
    await createBookingMutation.mutateAsync(bookingData);
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Walker not found</h2>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Back to Home
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <div className="max-w-5xl mx-auto p-6">
        <Button
          variant="outline"
          className="mb-6 border-green-200 hover:bg-green-50"
          onClick={() => navigate(createPageUrl('Home'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Walkers
        </Button>

        {/* Profile Header */}
        <Card className="overflow-hidden border-0 shadow-2xl mb-6">
          <div className="relative h-96 bg-gradient-to-br from-green-100 to-blue-100">
            {walker.photo_url ? (
              <img
                src={walker.photo_url}
                alt={walker.walker_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-green-600">
                    {walker.walker_name?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute top-6 right-6 flex flex-col gap-3">
              {walker.verification_status === "verified" && (
                <Badge className="bg-green-500 text-white border-0 shadow-lg text-base px-4 py-2">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Verified Walker
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
                  {walker.walker_name}
                </h1>
                <div className="flex items-center text-gray-600 text-lg">
                  <MapPin className="w-5 h-5 mr-2" />
                  {walker.location}
                </div>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-4xl font-bold text-green-600">
                  €{walker.hourly_rate}
                </div>
                <div className="text-gray-600">per hour</div>
                <div className="text-xs text-gray-500 mt-1">+15% platform fee</div>
              </div>
            </div>

            {walker.bio && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">About Me</h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {walker.bio}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {walker.experience_years && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Experience</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {walker.experience_years} years
                    </div>
                  </div>
                </div>
              )}
              {walker.total_walks > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Completed Walks</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {walker.total_walks} walks
                    </div>
                  </div>
                </div>
              )}
              {walker.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Contact</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {walker.phone}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {walker.dog_sizes && walker.dog_sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Dog Sizes I Handle</h3>
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

            {walker.availability && walker.availability.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Availability</h3>
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
                onClick={() => setShowBookingForm(true)}
                disabled={walker.verification_status !== "verified"}
              >
                {walker.verification_status === "verified" ? "Book This Walker" : "Verification Pending"}
              </Button>
              
              <Button
                variant="outline"
                className="h-14 px-6 border-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                onClick={() => navigate(createPageUrl(`Messages?walker_id=${walker.id}`))}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Availability Calendar */}
        <Card className="border-0 shadow-2xl mb-6">
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

        {showBookingForm && (
          <BookingForm
            walker={walker}
            onSubmit={handleBooking}
            onCancel={() => setShowBookingForm(false)}
            isProcessing={createBookingMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
