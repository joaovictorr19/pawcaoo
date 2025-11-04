
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar, MapPin, Clock, DollarSign, Phone, Dog, ShieldCheck, CheckCircle2, Activity } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import NotificationService from "../components/NotificationService";

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState("all");
  const [completionCode, setCompletionCode] = useState("");
  const [completingBooking, setCompletingBooking] = useState(null); // Renamed from verifyingBookingId to store the full booking object
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Helper function for creating page URLs (assuming simple path construction for now)
  const createPageUrl = (pathWithParams) => `/${pathWithParams}`;

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const walkerBookings = await base44.entities.Booking.list('-created_date');
      const trainerBookings = await base44.entities.TrainingBooking.list('-created_date');
      return [...walkerBookings, ...trainerBookings];
    },
    initialData: [],
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data, isTraining }) => {
      if (isTraining) {
        return await base44.entities.TrainingBooking.update(id, data);
      } else {
        return await base44.entities.Booking.update(id, data);
      }
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      // Send cancellation notification
      if (variables.data.status === "cancelled") {
        const booking = queryClient.getQueryData(['bookings']).find(b => b.id === variables.id);
        if (booking) {
          await base44.entities.Notification.create({
            recipient_email: booking.walker_email || booking.trainer_email,
            title: "Booking Cancelled",
            message: `Booking for ${booking.dog_name} on ${format(new Date(booking.walk_date || booking.session_date), "MMM d, yyyy")} has been cancelled`,
            type: "booking",
            related_id: variables.id,
            priority: "high"
          });
        }
      }
    },
  });

  const completeBookingMutation = useMutation({
    mutationFn: async ({ booking, code, isTraining }) => { // Now accepts full booking object and isTraining
      if (booking.completion_code !== code.toUpperCase()) { // Ensure code is upper cased for comparison
        throw new Error("Invalid completion code!");
      }

      // Update booking status
      const updateData = {
        status: 'completed',
        payment_status: 'released',
        completed_date: new Date().toISOString(),
      };

      if (isTraining) {
        await base44.entities.TrainingBooking.update(booking.id, updateData);
      } else {
        await base44.entities.Booking.update(booking.id, updateData);
      }

      // Find all payments for this booking (retaining previous robust payment finding logic)
      const payments = await base44.entities.Payment.filter({ booking_id: booking.id });
      for (const payment of payments) {
        await base44.entities.Payment.update(payment.id, {
          status: "released",
          released_date: new Date().toISOString()
        });
      }

      // PawPoints logic: Only award points to the owner
      let totalPoints = 0;
      if (user?.email === booking.owner_email) {
        const ownerSubs = await base44.entities.OwnerSubscription.filter({
          owner_email: user?.email,
          is_active: true
        });
        const subscription = ownerSubs[0]; // Assuming only one active subscription
        const pointsMultiplier = subscription?.points_multiplier || 1;
        const basePoints = Math.floor(booking.total_amount * 10); // 10 points per euro
        totalPoints = Math.floor(basePoints * pointsMultiplier);
        
        // Get or create loyalty points record
        const loyaltyRecords = await base44.entities.LoyaltyPoints.filter({
          user_email: user?.email
        });
        
        let currentPointsBalance = 0;
        if (loyaltyRecords.length > 0) {
          const loyaltyPoints = loyaltyRecords[0];
          currentPointsBalance = loyaltyPoints.points_balance + totalPoints;
          
          // Check for tier upgrade
          const oldTier = loyaltyPoints.tier;
          let newTier = oldTier;
          
          if (currentPointsBalance >= 10000) newTier = 'platinum';
          else if (currentPointsBalance >= 5000) newTier = 'gold';
          else if (currentPointsBalance >= 2000) newTier = 'silver';
          else newTier = 'bronze';
          
          await base44.entities.LoyaltyPoints.update(loyaltyPoints.id, {
            points_balance: currentPointsBalance,
            total_earned: loyaltyPoints.total_earned + totalPoints,
            lifetime_bookings: (loyaltyPoints.lifetime_bookings || 0) + 1,
            tier: newTier
          });
          
          // Notify tier upgrade
          if (newTier !== oldTier) {
            await NotificationService.tierUpgraded({
              userEmail: user?.email,
              newTier,
              oldTier
            });
          }
        } else {
          currentPointsBalance = totalPoints;
          await base44.entities.LoyaltyPoints.create({
            user_email: user?.email,
            points_balance: currentPointsBalance,
            total_earned: totalPoints,
            tier: 'bronze', // Default tier
            lifetime_bookings: 1
          });
        }

        // Create transaction record
        await base44.entities.PointsTransaction.create({
          user_email: user?.email,
          transaction_type: 'earned',
          points_amount: totalPoints,
          related_booking_id: booking.id,
          description: `Earned ${totalPoints} points from booking with ${booking.walker_name || booking.trainer_name}${pointsMultiplier > 1 ? ` (${pointsMultiplier}x multiplier)` : ''}`,
          balance_after: currentPointsBalance
        });

        // Notify about points earned
        if (totalPoints > 0) {
          await NotificationService.loyaltyPointsEarned({
            userEmail: user?.email,
            points: totalPoints,
            source: `do agendamento com ${booking.walker_name || booking.trainer_name}`
          });
        }
      }

      // Use NotificationService for completion
      await NotificationService.bookingCompleted({
        booking,
        isTraining,
        pointsEarned: totalPoints
      });

      return totalPoints; // Return points for toast message
    },
    onSuccess: (totalPoints) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] }); // Invalidate payments query
      queryClient.invalidateQueries({ queryKey: ['loyaltyPoints'] }); // New query invalidation for loyalty points
      setCompletionCode("");
      setCompletingBooking(null); // Resetting the booking being completed
      if (totalPoints > 0) {
        toast.success(`Booking completed! You earned ${totalPoints} PawPoints! 🎉`);
      } else {
        toast.success("Booking completed! Payment released."); // Generic message if no points awarded (e.g., if walker completes)
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete booking.");
    }
  });

  const handleCancelBooking = async (booking) => {
    await updateBookingMutation.mutateAsync({
      id: booking.id,
      data: { status: "cancelled", payment_status: "refunded" },
      isTraining: !!booking.session_date
    });
  };

  const handleVerifyCompletion = async (bookingToComplete, isTraining) => {
    await completeBookingMutation.mutateAsync({ 
      booking: bookingToComplete, // Pass the full booking object
      code: completionCode,
      isTraining 
    });
  };

  const filteredBookings = activeTab === "all" 
    ? bookings.filter(b => b.created_by === user?.email || b.owner_email === user?.email)
    : bookings.filter(b => b.status === activeTab && (b.created_by === user?.email || b.owner_email === user?.email));

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      in_progress: "bg-purple-100 text-purple-800 border-purple-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status] || colors.pending;
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "bg-orange-100 text-orange-800 border-orange-200",
      held: "bg-blue-100 text-blue-800 border-blue-200",
      released: "bg-green-100 text-green-800 border-green-200",
      refunded: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-sm md:text-lg text-gray-600">Manage your appointments</p>
        </div>

        {/* Tabs - Mobile Optimized with Horizontal Scroll */}
        <div className="mb-6 md:mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-max">
            <TabsList className="bg-white border border-gray-200 shadow-sm inline-flex">
              <TabsTrigger value="all" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 text-sm md:text-base px-3 md:px-4">
                All
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700 text-sm md:text-base px-3 md:px-4">
                Pending
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 text-sm md:text-base px-3 md:px-4">
                Confirmed
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-sm md:text-base px-3 md:px-4">
                Progress
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700 text-sm md:text-base px-3 md:px-4">
                Done
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Bookings List - Mobile Optimized */}
        {isLoading ? (
          <div className="space-y-3 md:space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 md:h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-sm md:text-base text-gray-600">Find a dog walker or trainer!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {filteredBookings.map((booking, index) => {
              const isTraining = !!booking.session_date;
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-lg md:text-2xl mb-2">
                            {isTraining ? `Training with ${booking.trainer_name}` : `Walk with ${booking.walker_name}`}
                          </CardTitle>
                          <div className="flex gap-2 flex-wrap">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            <Badge className={getPaymentStatusColor(booking.payment_status)}>
                              {booking.payment_status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl md:text-3xl font-bold text-green-600">
                            €{booking.total_amount?.toFixed(2)}
                          </div>
                          <div className="text-xs md:text-sm text-gray-600">
                            {booking.duration_hours}h
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Dog className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Dog</div>
                              <div className="font-semibold text-gray-900">
                                {booking.dog_name} ({booking.dog_size})
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Date & Time</div>
                              <div className="font-semibold text-gray-900">
                                {format(new Date(booking.walk_date || booking.session_date), "MMMM d, yyyy")}
                              </div>
                              <div className="text-sm text-gray-600">
                                {booking.walk_time || booking.session_time}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Phone className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Your Contact</div>
                              <div className="font-semibold text-gray-900">
                                {booking.owner_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {booking.owner_phone}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Booked On</div>
                              <div className="font-semibold text-gray-900">
                                {format(new Date(booking.created_date), "MMM d, yyyy 'at' h:mm a")}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live Tracking Button - NEW */}
                      {!isTraining && (booking.status === "in_progress" || booking.status === "confirmed") && (
                        <Button
                          className="w-full mb-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg h-12"
                          onClick={() => navigate(createPageUrl(`LiveWalkTracking?booking_id=${booking.id}`))}
                        >
                          <Activity className="w-5 h-5 mr-2" />
                          Track Walk Live
                        </Button>
                      )}

                      {booking.special_notes && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="text-sm font-semibold text-gray-700 mb-1">
                            Special Notes:
                          </div>
                          <div className="text-gray-600">
                            {booking.special_notes}
                          </div>
                        </div>
                      )}

                      {/* Completion Code Section */}
                      {(booking.status === "in_progress" || booking.status === "confirmed") && booking.payment_status === "held" && (
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-4">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                            Complete the {isTraining ? 'Session' : 'Walk'}
                          </h4>
                          <p className="text-sm text-gray-700 mb-4">
                            Ask the {isTraining ? 'trainer' : 'walker'} for the completion code and enter it below to release payment.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Input
                              placeholder="Enter 6-digit code"
                              value={completingBooking?.id === booking.id ? completionCode : ""}
                              onChange={(e) => {
                                setCompletionCode(e.target.value.toUpperCase());
                                setCompletingBooking(booking); // Store the full booking object
                              }}
                              maxLength={6}
                              className="text-center text-lg font-mono tracking-wider sm:w-1/2 md:w-2/3"
                            />
                            <Button
                              onClick={() => handleVerifyCompletion(booking, isTraining)}
                              disabled={completeBookingMutation.isPending || completionCode.length !== 6 || completingBooking?.id !== booking.id}
                              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                            >
                              Verify & Release Payment
                            </Button>
                          </div>
                        </div>
                      )}

                      {booking.status === "completed" && (
                        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                          <p className="text-green-700 font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            {isTraining ? 'Session' : 'Walk'} completed! Payment has been released.
                          </p>
                        </div>
                      )}

                      {booking.status === "pending" && (
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleCancelBooking(booking)}
                            disabled={updateBookingMutation.isPending}
                          >
                            Cancel Booking
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
