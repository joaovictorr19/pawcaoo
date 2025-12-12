import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Activity, Heart, Droplets, Users, Video, Image as ImageIcon, Navigation, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import RideChat from '../components/tracking/RideChat';

export default function LiveWalkTracking() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.list();
      return bookings.find(b => b.id === bookingId);
    },
    enabled: !!bookingId,
  });

  const { data: checkpoints, isLoading } = useQuery({
    queryKey: ['liveCheckpoints', bookingId],
    queryFn: () => base44.entities.WalkCheckpoint.filter(
      { booking_id: bookingId },
      'created_date'
    ),
    enabled: !!bookingId,
    refetchInterval: 10000, // Refetch every 10 seconds for live updates
    initialData: [],
  });

  const checkIn = checkpoints.find(c => c.checkpoint_type === 'check_in');
  const checkOut = checkpoints.find(c => c.checkpoint_type === 'check_out');
  const photos = checkpoints.filter(c => c.photo_url);
  const videos = checkpoints.filter(c => c.video_url);
  const behaviorNotes = checkpoints.filter(c => c.dog_behavior);

  const getLatestBehavior = () => {
    const latest = [...checkpoints].reverse().find(c => c.dog_behavior);
    return latest?.dog_behavior;
  };

  const totalDistance = checkpoints.reduce((sum, c) => sum + (c.distance_km || 0), 0);
  const latestBehavior = getLatestBehavior();

  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: "😊",
      calm: "😌",
      excited: "🤩",
      anxious: "😰",
      tired: "😴"
    };
    return emojis[mood] || "🐕";
  };

  const getEnergyColor = (level) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      normal: "bg-green-100 text-green-800",
      high: "bg-yellow-100 text-yellow-800",
      very_high: "bg-orange-100 text-orange-800"
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="glass-panel max-w-md border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Active Walk</h3>
            <p className="text-gray-600 mb-4">Start tracking from your active bookings</p>
            <Button onClick={() => navigate(createPageUrl('MyBookings'))}>
              View Bookings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Activity className="w-10 h-10 text-green-600 animate-pulse" />
            Live Walk Tracking
          </h1>
          <p className="text-gray-600 text-lg">
            Watch {booking?.dog_name}'s walk with {booking?.walker_name} in real-time
          </p>
        </div>

        {/* Status Banner */}
        <Card className="glass-panel border-0 shadow-xl mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {checkOut ? "Walk Completed! 🎉" : checkIn ? "Walk In Progress" : "Waiting to Start"}
                </h3>
                <div className="flex items-center gap-4 text-sm">
                  {checkIn && (
                    <span>Started: {format(new Date(checkIn.timestamp || checkIn.created_date), "h:mm a")}</span>
                  )}
                  {checkOut && (
                    <span>Ended: {format(new Date(checkOut.timestamp || checkOut.created_date), "h:mm a")}</span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                className="bg-white text-green-700 hover:bg-green-50"
                onClick={() => navigate(createPageUrl(`Messages?walker_id=${booking?.walker_id}`))}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Message Walker
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Live Stats */}
          <Card className="glass-panel border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                Walk Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Distance</span>
                <span className="text-2xl font-bold text-blue-600">{totalDistance.toFixed(2)} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Duration</span>
                <span className="text-xl font-semibold">
                  {checkIn && !checkOut && `${Math.floor((new Date() - new Date(checkIn.created_date)) / 60000)} min`}
                  {checkOut && `${booking?.duration_hours}h`}
                  {!checkIn && "Not started"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Updates</span>
                <span className="text-xl font-semibold">{checkpoints.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Dog Behavior */}
          {latestBehavior && (
            <Card className="glass-panel border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-green-600" />
                  Current Behavior
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mood</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getMoodEmoji(latestBehavior.mood)}</span>
                    <Badge className="capitalize">{latestBehavior.mood}</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Energy</span>
                  <Badge className={getEnergyColor(latestBehavior.energy_level)}>
                    {latestBehavior.energy_level}
                  </Badge>
                </div>
                {latestBehavior.water_intake && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Droplets className="w-5 h-5" />
                    <span>Had water</span>
                  </div>
                )}
                {latestBehavior.played_with_other_dogs && (
                  <div className="flex items-center gap-2 text-purple-600">
                    <Users className="w-5 h-5" />
                    <span>Played with other dogs</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Media Summary */}
          <Card className="glass-panel border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-600" />
                Media Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Photos</span>
                <span className="text-2xl font-bold text-purple-600">{photos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Videos</span>
                <span className="text-2xl font-bold text-pink-600">{videos.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Behavior Notes</span>
                <span className="text-xl font-semibold">{behaviorNotes.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <Card className="border-0 shadow-xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-green-600" />
                Walk Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((checkpoint, idx) => (
                  <motion.div
                    key={checkpoint.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedPhoto(checkpoint)}
                  >
                    <img
                      src={checkpoint.photo_url}
                      alt={`Walk photo ${idx + 1}`}
                      className="w-full h-48 object-cover rounded-xl shadow-md group-hover:shadow-xl transition-shadow"
                    />
                    <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded-lg text-xs">
                      {format(new Date(checkpoint.created_date), "h:mm a")}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Walk Timeline */}
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              Walk Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
              </div>
            ) : checkpoints.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No updates yet. The walker will start updating soon!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {checkpoints.map((checkpoint, idx) => (
                    <motion.div
                      key={checkpoint.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex gap-4 bg-gray-50 rounded-xl p-4"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        {checkpoint.checkpoint_type === 'check_in' && <MapPin className="w-6 h-6 text-green-600" />}
                        {checkpoint.checkpoint_type === 'check_out' && <MapPin className="w-6 h-6 text-red-600" />}
                        {checkpoint.checkpoint_type === 'photo_update' && <ImageIcon className="w-6 h-6 text-purple-600" />}
                        {checkpoint.checkpoint_type === 'video_update' && <Video className="w-6 h-6 text-pink-600" />}
                        {checkpoint.checkpoint_type === 'midpoint' && <Navigation className="w-6 h-6 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900 capitalize">
                            {checkpoint.checkpoint_type.replace('_', ' ')}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {format(new Date(checkpoint.timestamp || checkpoint.created_date), "h:mm a")}
                          </span>
                        </div>
                        {checkpoint.location_address && (
                          <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {checkpoint.location_address}
                          </p>
                        )}
                        {checkpoint.notes && (
                          <p className="text-gray-700 mb-2">{checkpoint.notes}</p>
                        )}
                        {checkpoint.photo_url && (
                          <img
                            src={checkpoint.photo_url}
                            alt="Walk update"
                            className="w-full max-w-sm h-48 object-cover rounded-lg mt-2 cursor-pointer"
                            onClick={() => setSelectedPhoto(checkpoint)}
                          />
                        )}
                        {checkpoint.dog_behavior && (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Heart className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-sm">Behavior Update</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Mood: </span>
                                <span className="font-medium">{checkpoint.dog_behavior.mood} {getMoodEmoji(checkpoint.dog_behavior.mood)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Energy: </span>
                                <Badge className={`text-xs ${getEnergyColor(checkpoint.dog_behavior.energy_level)}`}>
                                  {checkpoint.dog_behavior.energy_level}
                                </Badge>
                              </div>
                              {checkpoint.dog_behavior.bathroom_breaks > 0 && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">Bathroom breaks: </span>
                                  <span className="font-medium">{checkpoint.dog_behavior.bathroom_breaks}</span>
                                </div>
                              )}
                              {checkpoint.dog_behavior.special_notes && (
                                <div className="col-span-2 mt-2 pt-2 border-t">
                                  <p className="text-gray-700">{checkpoint.dog_behavior.special_notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photo Modal */}
        <AnimatePresence>
          {selectedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
              onClick={() => setSelectedPhoto(null)}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="glass-panel border-0 shadow-2xl">
                  <CardContent className="p-6">
                    <img
                      src={selectedPhoto.photo_url}
                      alt="Walk photo"
                      className="w-full max-h-[70vh] object-contain rounded-lg"
                    />
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <Badge>
                          {format(new Date(selectedPhoto.created_date), "MMM d, yyyy 'at' h:mm a")}
                        </Badge>
                        {selectedPhoto.location_address && (
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {selectedPhoto.location_address}
                          </span>
                        )}
                      </div>
                      {selectedPhoto.notes && (
                        <p className="text-gray-700 mt-2">{selectedPhoto.notes}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => setSelectedPhoto(null)}
                      className="w-full mt-4"
                      variant="outline"
                    >
                      Close
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ✅ CHAT EM TEMPO REAL */}
        {booking && user && (
          <RideChat booking={booking} user={user} />
        )}
      </div>
    </div>
  );
}