import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, Gift, Calendar, Heart, Store, Award, 
  TrendingUp, Bell, Star, DollarSign, Users, 
  Clock, Zap, Target, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: ownerSubscription } = useQuery({
    queryKey: ['ownerSubscription'],
    queryFn: async () => {
      const subs = await base44.entities.OwnerSubscription.filter({
        owner_email: user?.email,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!user,
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ['myWalkerProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user?.email });
      return profiles[0];
    },
    enabled: !!user,
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ['myTrainerProfile'],
    queryFn: async () => {
      const profiles = await base44.entities.TrainerProfile.filter({ created_by: user?.email });
      return profiles[0];
    },
    enabled: !!user,
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints'],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({ user_email: user?.email });
      return points[0] || { points_balance: 0, tier: 'bronze', total_earned: 0 };
    },
    enabled: !!user,
  });

  const { data: upcomingBookings } = useQuery({
    queryKey: ['upcomingBookings'],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({ 
        created_by: user?.email,
        status: { $in: ['pending', 'confirmed', 'in_progress'] }
      });
      return bookings.slice(0, 3);
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.Favorite.filter({ created_by: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: notifications } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      const allNotifications = await base44.entities.Notification.filter({ 
        recipient_email: user?.email,
        is_read: false 
      });
      return allNotifications;
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: professionalBookings } = useQuery({
    queryKey: ['professionalBookingRequests'],
    queryFn: async () => {
      const bookings = await base44.entities.Booking.filter({ 
        walker_id: walkerProfile?.id,
        status: 'pending'
      });
      return bookings;
    },
    enabled: !!walkerProfile,
    initialData: [],
  });

  const isProfessional = !!walkerProfile || !!trainerProfile;

  const getSubscriptionProgress = () => {
    if (!ownerSubscription || ownerSubscription.plan_type === 'free') {
      return {
        message: "Unlock exclusive benefits",
        action: "Upgrade your membership to save more!",
        progress: 0
      };
    }
    
    const savings = ownerSubscription.total_savings || 0;
    const investment = ownerSubscription.billing_cycle === 'monthly' 
      ? ownerSubscription.monthly_price 
      : ownerSubscription.annual_price / 12;
    
    const monthsSaved = investment > 0 ? savings / investment : 0;
    
    return {
      message: `Saved €${savings.toFixed(2)} with your ${ownerSubscription.plan_type} plan`,
      action: monthsSaved >= 1 ? "Your plan has paid for itself! 🎉" : `${Math.ceil(monthsSaved * 10) * 10}% toward break-even`,
      progress: Math.min(100, monthsSaved * 100)
    };
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
        <Skeleton className="h-64 rounded-3xl mb-6" />
        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            Welcome to PawCão Universe 🐾
          </h1>
          <p className="text-xl text-gray-600">
            Your complete ecosystem for dog care, training, and community
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6 text-center">
              <Gift className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{loyaltyPoints.points_balance}</div>
              <div className="text-sm opacity-90">PawPoints</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{upcomingBookings.length}</div>
              <div className="text-sm opacity-90">Upcoming Walks</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{favorites.length}</div>
              <div className="text-sm opacity-90">Favorites</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6 text-center">
              <Bell className="w-8 h-8 mx-auto mb-2" />
              <div className="text-3xl font-bold">{notifications.length}</div>
              <div className="text-sm opacity-90">Notifications</div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status - Owner */}
        {!isProfessional && (
          <Card className="border-0 shadow-2xl mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8" />
                  <div>
                    <h3 className="text-2xl font-bold">
                      {ownerSubscription ? ownerSubscription.plan_type.toUpperCase() : 'FREE'} Member
                    </h3>
                    <p className="text-white/90">
                      {getSubscriptionProgress().message}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate(createPageUrl('OwnerSubscriptions'))}
                  className="bg-white text-orange-600 hover:bg-gray-100"
                >
                  {ownerSubscription?.plan_type === 'free' || !ownerSubscription ? 'Upgrade Plan' : 'Manage Plan'}
                </Button>
              </div>

              {ownerSubscription && ownerSubscription.plan_type !== 'free' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Value Unlocked</span>
                    <span>{getSubscriptionProgress().action}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-white h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getSubscriptionProgress().progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">
                    {ownerSubscription?.booking_discount_percentage || 0}%
                  </div>
                  <div className="text-xs opacity-90">Booking Discount</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">
                    {ownerSubscription?.points_multiplier || 1}x
                  </div>
                  <div className="text-xs opacity-90">Points Multiplier</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold">
                    {ownerSubscription?.free_cancellations || 0}
                  </div>
                  <div className="text-xs opacity-90">Free Cancels/mo</div>
                </div>
              </div>
            </div>

            {(!ownerSubscription || ownerSubscription.plan_type === 'free') && (
              <CardContent className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
                <div className="flex items-start gap-4">
                  <Target className="w-12 h-12 text-orange-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">Why Upgrade Your Membership?</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>Save money:</strong> Get 10-25% off every booking</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>Earn faster:</strong> Get up to 3x PawPoints on every purchase</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>Peace of mind:</strong> Free insurance and priority support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>VIP access:</strong> Exclusive walkers, events, and perks</span>
                      </li>
                    </ul>
                    <p className="mt-3 text-purple-700 font-semibold">
                      💡 Premium plan pays for itself after just 3 bookings!
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Professional Dashboard */}
        {isProfessional && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
                <CardTitle>Professional Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Earnings</span>
                    <span className="text-2xl font-bold text-green-600">
                      €{walkerProfile?.total_earnings || trainerProfile?.total_earnings || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Requests</span>
                    <span className="text-2xl font-bold text-orange-600">
                      {professionalBookings.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-2xl font-bold">
                        {walkerProfile?.rating || trainerProfile?.rating || 5.0}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full mt-6 bg-green-600"
                  onClick={() => navigate(createPageUrl('ManageAvailability'))}
                >
                  Manage Availability
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
                <CardTitle>Grow Your Business</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-semibold">Upgrade subscription</div>
                      <div className="text-xs text-gray-600">Lower commissions, more visibility</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Sparkles className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="font-semibold">Complete your profile</div>
                      <div className="text-xs text-gray-600">Add photos, certifications, bio</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                    <div>
                      <div className="font-semibold">Respond quickly</div>
                      <div className="text-xs text-gray-600">Fast responses = more bookings</div>
                    </div>
                  </div>
                </div>
                <Button 
                  className="w-full bg-blue-600"
                  onClick={() => navigate(createPageUrl('Subscriptions'))}
                >
                  View Pro Plans
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Upcoming Bookings */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Upcoming Walks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No upcoming bookings</p>
                  <Button 
                    className="mt-4"
                    onClick={() => navigate(createPageUrl('Home'))}
                  >
                    Book a Walk
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map(booking => (
                    <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-semibold text-gray-900">{booking.walker_name}</div>
                      <div className="text-sm text-gray-600">{booking.dog_name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(booking.walk_date), 'MMM d')} • {booking.walk_time}
                      </div>
                      <Badge className="mt-2" variant="outline">{booking.status}</Badge>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(createPageUrl('MyBookings'))}
                  >
                    View All Bookings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loyalty & Rewards */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                PawPoints & Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-purple-600 mb-2">
                  {loyaltyPoints.points_balance}
                </div>
                <div className="text-sm text-gray-600">Available Points</div>
                <Badge className="mt-2 bg-purple-600">
                  {loyaltyPoints.tier.toUpperCase()} Tier
                </Badge>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Earned</span>
                  <span className="font-semibold">{loyaltyPoints.total_earned}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Redeemed</span>
                  <span className="font-semibold">{loyaltyPoints.total_redeemed || 0}</span>
                </div>
              </div>
              <Button 
                className="w-full bg-purple-600"
                onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
              >
                Redeem Points
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('Home'))}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book a Walk
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('Trainers'))}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Find Trainer
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('PostEmergency'))}
                >
                  <Zap className="w-4 h-4 mr-2 text-orange-500" />
                  Emergency Walk
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('Partners'))}
                >
                  <Store className="w-4 h-4 mr-2" />
                  PawCão Shop
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('Favorites'))}
                >
                  <Heart className="w-4 h-4 mr-2 text-red-500" />
                  My Favorites
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partner Offers */}
        <Card className="border-0 shadow-xl mt-6">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Store className="w-6 h-6" />
              Exclusive Partner Offers
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl mb-2">🏥</div>
                <div className="font-semibold text-gray-900 mb-1">Veterinary</div>
                <div className="text-sm text-gray-600">10% off check-ups</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl mb-2">🍖</div>
                <div className="font-semibold text-gray-900 mb-1">Pet Food</div>
                <div className="text-sm text-gray-600">15% off premium brands</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl mb-2">✂️</div>
                <div className="font-semibold text-gray-900 mb-1">Grooming</div>
                <div className="text-sm text-gray-600">20% off first visit</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-3xl mb-2">🎾</div>
                <div className="font-semibold text-gray-900 mb-1">Toys & Gear</div>
                <div className="text-sm text-gray-600">Buy 2 Get 1 Free</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate(createPageUrl('Partners'))}
            >
              Explore All Partner Offers
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}