import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Star, Image as ImageIcon, Map } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import WalkRouteMap from "../components/walk/WalkRouteMap";

export default function WalkHistory() {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalMode, setModalMode] = useState('photos'); // 'photos' | 'route'

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['completedBookings'],
    queryFn: async () => {
      const allBookings = await base44.entities.Booking.filter(
        { status: 'completed' },
        '-completed_date'
      );
      return allBookings.filter(b => b.created_by === user?.email);
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: checkpoints } = useQuery({
    queryKey: ['checkpoints', selectedBooking?.id],
    queryFn: () => base44.entities.WalkCheckpoint.filter(
      { booking_id: selectedBooking.id },
      'created_date'
    ),
    enabled: !!selectedBooking,
    initialData: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const allReviews = await base44.entities.Review.list();
      return allReviews.filter(r => r.reviewer_email === user?.email);
    },
    enabled: !!user,
    initialData: [],
  });

  const getTotalStats = () => {
    const totalWalks = bookings.length;
    const totalSpent = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    return { totalWalks, totalSpent, avgRating };
  };

  const stats = getTotalStats();

  const getReviewForBooking = (bookingId) => {
    return reviews.find(r => r.booking_id === bookingId);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Calendar className="w-10 h-10 text-blue-600" />
            Walk History
          </h1>
          <p className="text-gray-600 text-lg">Your complete walk records and statistics</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-panel border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Walks</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalWalks}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">€{stats.totalSpent.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Rating Given</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {stats.avgRating.toFixed(1)} <Star className="w-6 h-6 inline fill-yellow-400 text-yellow-400" />
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Walk History List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card className="glass-panel border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No completed walks yet</h3>
              <p className="text-gray-600">Your walk history will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking, index) => {
              const review = getReviewForBooking(booking.id);
              
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="glass-panel border-0 shadow-xl hover:shadow-2xl transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-2xl mb-2">
                            {booking.walker_name} walked {booking.dog_name}
                          </CardTitle>
                          <Badge className="bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            €{booking.total_amount?.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(booking.completed_date), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <div>
                              <div className="text-sm text-gray-600">Duration</div>
                              <div className="font-semibold">{booking.duration_hours}h walk</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-purple-600" />
                            <div>
                              <div className="text-sm text-gray-600">Date</div>
                              <div className="font-semibold">
                                {format(new Date(booking.walk_date), "MMMM d, yyyy")}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {review && (
                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold">Your Rating: {review.rating}/5</span>
                              </div>
                              {review.comment && (
                                <p className="text-sm text-gray-700 italic">"{review.comment}"</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <Button
                          variant="outline"
                          onClick={() => { setSelectedBooking(booking); setModalMode('photos'); }}
                          className="flex-1"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          View Photos
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { setSelectedBooking(booking); setModalMode('route'); }}
                          className="flex-1"
                        >
                          <Map className="w-4 h-4 mr-2" />
                          View Route
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Photo Modal */}
        {selectedBooking && checkpoints.length > 0 && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
            <Card className="glass-panel max-w-4xl w-full max-h-[90vh] overflow-auto border-0 shadow-2xl">
              <CardHeader>
                <CardTitle>Walk Photos & Checkpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {checkpoints.map((checkpoint) => (
                  <div key={checkpoint.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge>{checkpoint.checkpoint_type.replace('_', ' ')}</Badge>
                      <span className="text-sm text-gray-600">
                        {format(new Date(checkpoint.timestamp || checkpoint.created_date), "h:mm a")}
                      </span>
                    </div>
                    {checkpoint.photo_url && (
                      <img
                        src={checkpoint.photo_url}
                        alt={checkpoint.checkpoint_type}
                        className="w-full rounded-lg mb-3"
                      />
                    )}
                    {checkpoint.location_address && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {checkpoint.location_address}
                      </p>
                    )}
                    {checkpoint.notes && (
                      <p className="text-sm text-gray-700 mt-2">{checkpoint.notes}</p>
                    )}
                  </div>
                ))}
                <Button onClick={() => setSelectedBooking(null)} className="w-full">
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}