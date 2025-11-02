
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input"; // Added Input
import { Calendar, MapPin, Clock, DollarSign, Phone, Dog, ShieldCheck, CheckCircle2 } from "lucide-react"; // Added ShieldCheck, CheckCircle2
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner"; // Added toast

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState("all");
  const [completionCode, setCompletionCode] = useState("");
  const [verifyingBookingId, setVerifyingBookingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
    initialData: [],
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const completeWalkMutation = useMutation({
    mutationFn: async ({ bookingId, code }) => {
      // Find the booking from the cached data, or refetch if not found
      const currentBookings = queryClient.getQueryData(['bookings']);
      const booking = currentBookings.find(b => b.id === bookingId);
      
      if (!booking) {
        throw new Error("Booking not found.");
      }

      if (booking.completion_code !== code.toUpperCase()) {
        throw new Error("Invalid completion code");
      }

      // Update booking status
      await base44.entities.Booking.update(bookingId, {
        status: "completed",
        payment_status: "released",
        completed_date: new Date().toISOString()
      });

      // Find all payments for this booking
      const payments = await base44.entities.Payment.filter({ booking_id: bookingId });
      for (const payment of payments) {
        await base44.entities.Payment.update(payment.id, {
          status: "released",
          released_date: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setCompletionCode("");
      setVerifyingBookingId(null);
      toast.success("Walk completed! Payment released to walker.");
    },
    onError: (error) => {
      toast.error(error.message || "Invalid completion code");
    }
  });

  const handleCancelBooking = async (booking) => {
    await updateBookingMutation.mutateAsync({
      id: booking.id,
      data: { status: "cancelled", payment_status: "refunded" }
    });
  };

  const handleVerifyCompletion = async (bookingId) => {
    await completeWalkMutation.mutateAsync({ 
      bookingId, 
      code: completionCode 
    });
  };

  const filteredBookings = activeTab === "all" 
    ? bookings.filter(b => b.created_by === user?.email)
    : bookings.filter(b => b.status === activeTab && b.created_by === user?.email);

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600 text-lg">Manage your dog walking appointments</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white border border-gray-200 shadow-sm">
            <TabsTrigger value="all" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              All Bookings
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-700">
              Pending
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              Confirmed
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600">Start by finding a dog walker!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl mb-2">
                          Walk with {booking.walker_name}
                        </CardTitle>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <Badge className={getPaymentStatusColor(booking.payment_status)}>
                            Payment: {booking.payment_status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">
                          ${booking.total_amount?.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          ${booking.service_amount?.toFixed(2)} + ${booking.platform_fee?.toFixed(2)} fee
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {booking.duration_hours}h walk
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
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
                              {format(new Date(booking.walk_date), "MMMM d, yyyy")}
                            </div>
                            <div className="text-sm text-gray-600">
                              {booking.walk_time}
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
                          Complete the Walk
                        </h4>
                        <p className="text-sm text-gray-700 mb-4">
                          Once the walk is finished, ask the walker for the completion code and enter it below to release payment.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            placeholder="Enter 6-digit code"
                            value={verifyingBookingId === booking.id ? completionCode : ""}
                            onChange={(e) => {
                              setCompletionCode(e.target.value.toUpperCase());
                              setVerifyingBookingId(booking.id);
                            }}
                            maxLength={6}
                            className="text-center text-lg font-mono tracking-wider sm:w-1/2 md:w-2/3"
                          />
                          <Button
                            onClick={() => handleVerifyCompletion(booking.id)}
                            disabled={completeWalkMutation.isPending || completionCode.length !== 6 || verifyingBookingId !== booking.id}
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
                          Walk completed! Payment has been released to the walker.
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
