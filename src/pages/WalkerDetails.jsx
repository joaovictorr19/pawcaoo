import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Clock, DollarSign, Phone, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import BookingForm from "../components/booking/BookingForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalkerDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const walkerId = urlParams.get('id');

  const { data: walkers, isLoading } = useQuery({
    queryKey: ['walkers'],
    queryFn: () => base44.entities.WalkerProfile.list(),
    initialData: [],
  });

  const walker = walkers.find(w => w.id === walkerId);

  const createBookingMutation = useMutation({
    mutationFn: (bookingData) => base44.entities.Booking.create(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      navigate(createPageUrl('MyBookings'));
    },
  });

  const handleBooking = async (bookingData) => {
    await createBookingMutation.mutateAsync({
      ...bookingData,
      walker_id: walker.id,
      walker_name: walker.walker_name,
      total_amount: bookingData.duration_hours * walker.hourly_rate,
    });
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
            <div className="absolute top-6 right-6">
              {walker.rating && (
                <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg text-lg px-4 py-2">
                  <Star className="w-5 h-5 mr-2 fill-yellow-400 text-yellow-400" />
                  {walker.rating.toFixed(1)} Rating
                </Badge>
              )}
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
                  ${walker.hourly_rate}
                </div>
                <div className="text-gray-600">per hour</div>
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

            <Button 
              className="w-full md:w-auto bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg h-14 px-8 text-lg font-semibold"
              onClick={() => setShowBookingForm(true)}
            >
              Book This Walker
            </Button>
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