
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Shield, Dog, Crown, Gift, Calendar, Heart, 
  Store, Award, TrendingUp, Bell, Star, Clock, Zap, Target, Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function MyProfile() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: myWalkerProfiles } = useQuery({
    queryKey: ['myWalkerProfiles'],
    queryFn: () => base44.entities.WalkerProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
    initialData: [],
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
      return points[0] || { 
        points_balance: 0, 
        tier: 'bronze', 
        total_earned: 0,
        total_redeemed: 0,
        lifetime_bookings: 0,
        lifetime_redemptions: 0
      };
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

  const isProfessional = !!walkerProfile || !!trainerProfile;

  const getSubscriptionProgress = () => {
    if (!ownerSubscription || ownerSubscription.plan_type === 'free') {
      return {
        message: t("unlockExclusiveBenefits", language),
        action: t("upgradeToSaveMore", language),
        progress: 0,
        color: "from-gray-500 to-gray-600",
        icon: "⚡"
      };
    }
    
    const savings = ownerSubscription.total_savings || 0;
    const investment = ownerSubscription.billing_cycle === 'monthly' 
      ? ownerSubscription.monthly_price 
      : ownerSubscription.annual_price / 12;
    
    const monthsSaved = investment > 0 ? savings / investment : 0;
    
    const colors = {
      basic: "from-blue-500 to-blue-600",
      premium: "from-purple-500 to-purple-600",
      vip: "from-yellow-500 to-yellow-600"
    };
    
    const icons = {
      basic: "💼",
      premium: "🥇",
      vip: "👑"
    };
    
    return {
      message: `${t('saved', language)} €${savings.toFixed(2)} ${t('withThePlan', language)} ${ownerSubscription.plan_type}`,
      action: monthsSaved >= 1 ? t("planAlreadyPaidOff", language) : `${Math.ceil(monthsSaved * 10) * 10}% ${t("untilBreakeven", language)}`,
      progress: Math.min(100, monthsSaved * 100),
      color: colors[ownerSubscription.plan_type] || "from-gray-500 to-gray-600",
      icon: icons[ownerSubscription.plan_type] || "⚡"
    };
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
        <Skeleton className="h-48 md:h-64 rounded-3xl mb-4 md:mb-6" />
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 md:h-48 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const subscriptionInfo = getSubscriptionProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2">
                {t('hello', language)}, {user?.full_name || t('notDefined', language)} 👋
              </h1>
              <p className="text-base md:text-xl text-gray-600">
                {t('yourCompleteDashboard', language)}
              </p>
            </div>
            {ownerSubscription && ownerSubscription.plan_type !== 'free' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`bg-gradient-to-r ${subscriptionInfo.color} text-white rounded-2xl px-4 md:px-6 py-3 md:py-4 shadow-2xl`}
              >
                <div className="text-center">
                  <div className="text-3xl md:text-4xl mb-1 md:mb-2">{subscriptionInfo.icon}</div>
                  <div className="text-lg md:text-xl font-bold">{ownerSubscription.plan_type.toUpperCase()}</div>
                  <div className="text-xs opacity-90">Member</div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Account Info */}
        <Card className="border-0 shadow-2xl mb-8">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <User className="w-6 h-6" />
              {t('accountInformation', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">{t('fullName', language)}</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {user?.full_name || t('notDefined', language)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">{t('email', language)}</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {user?.email}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">{t('role', language)}</div>
                  <div className="text-xl font-semibold text-gray-900 capitalize">
                    {user?.role || 'user'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white cursor-pointer hover:scale-105 transition-transform touch-manipulation active:scale-95"
                onClick={() => navigate(createPageUrl('LoyaltyRewards'))}>
            <CardContent className="p-4 md:p-6 text-center">
              <Gift className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold">{loyaltyPoints?.points_balance || 0}</div>
              <div className="text-xs md:text-sm opacity-90">{t('pawPoints', language)}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:scale-105 transition-transform touch-manipulation active:scale-95"
                onClick={() => navigate(createPageUrl('MyBookings'))}>
            <CardContent className="p-4 md:p-6 text-center">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold">{upcomingBookings?.length || 0}</div>
              <div className="text-xs md:text-sm opacity-90">{t('upcomingWalks', language)}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer hover:scale-105 transition-transform touch-manipulation active:scale-95"
                onClick={() => navigate(createPageUrl('Favorites'))}>
            <CardContent className="p-4 md:p-6 text-center">
              <Heart className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold">{favorites?.length || 0}</div>
              <div className="text-xs md:text-sm opacity-90">{t('favorites', language)}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:scale-105 transition-transform touch-manipulation active:scale-95"
                onClick={() => navigate(createPageUrl('Notifications'))}>
            <CardContent className="p-4 md:p-6 text-center">
              <Bell className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold">{notifications?.length || 0}</div>
              <div className="text-xs md:text-sm opacity-90">{t('notifications', language)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Subscription Status */}
        {!isProfessional && (
          <Card className="border-0 shadow-2xl mb-8 overflow-hidden">
            <div className={`bg-gradient-to-r ${subscriptionInfo.color} p-6 text-white`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-8 h-8" />
                  <div>
                    <h3 className="text-2xl font-bold">
                      {subscriptionInfo.icon} {t('member', language)} {ownerSubscription ? ownerSubscription.plan_type.toUpperCase() : t('freePlan', language).toUpperCase()}
                    </h3>
                    <p className="text-white/90">
                      {subscriptionInfo.message}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate(createPageUrl('OwnerSubscriptions'))}
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  {ownerSubscription?.plan_type === 'free' || !ownerSubscription ? t('upgradePlan', language) : t('managePlan', language)}
                </Button>
              </div>

              {ownerSubscription && ownerSubscription.plan_type !== 'free' && (
                <>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>{t('valueUnlocked', language)}</span>
                      <span>{subscriptionInfo.action}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                      <div 
                        className="bg-white h-3 rounded-full transition-all duration-500"
                        style={{ width: `${subscriptionInfo.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">
                        {ownerSubscription?.booking_discount_percentage || 0}%
                      </div>
                      <div className="text-xs opacity-90">{t('bookingDiscount', language)}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">
                        {ownerSubscription?.points_multiplier || 1}x
                      </div>
                      <div className="text-xs opacity-90">{t('pointsMultiplier', language)}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">
                        {ownerSubscription?.free_cancellations === 999 ? "∞" : ownerSubscription?.free_cancellations || 0}
                      </div>
                      <div className="text-xs opacity-90">{t('cancellationsPerMonth', language)}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">
                        €{(ownerSubscription?.total_savings || 0).toFixed(0)}
                      </div>
                      <div className="text-xs opacity-90">Total Saved</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {(!ownerSubscription || ownerSubscription.plan_type === 'free') && (
              <CardContent className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50">
                <div className="flex items-start gap-4">
                  <Target className="w-12 h-12 text-orange-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">{t('whyUpgrade', language)}</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>{t('saveMoney', language)}:</strong> {t('saveMoneyDesc', language)}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>{t('earnFaster', language)}:</strong> {t('earnFasterDesc', language)}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>{t('peaceOfMind', language)}:</strong> {t('peaceOfMindDesc', language)}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 font-bold">✓</span>
                        <span><strong>{t('vipAccess', language)}:</strong> {t('vipAccessDesc', language)}</span>
                      </li>
                    </ul>
                    <p className="mt-3 text-purple-700 font-semibold">
                      💡 {t('premiumPayoff', language)}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Professional Section */}
        {myWalkerProfiles && myWalkerProfiles.length > 0 && (
          <Card className="border-0 shadow-2xl mb-6">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Dog className="w-6 h-6" />
                {t('professionalProfiles', language)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                {myWalkerProfiles.map(profile => (
                  <div key={profile.id} className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-gray-900">{profile.walker_name}</div>
                      <div className="text-sm text-gray-600">{profile.location}</div>
                      <div className="text-lg font-bold text-green-600 mt-1">
                        €{profile.hourly_rate}/hora
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{t('totalWalks', language)}</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {profile.total_walks || 0}
                      </div>
                      <Badge className="mt-2">{profile.verification_status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions - Mobile Optimized Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                {t('upcomingWalks', language)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm mb-4">{t('noUpcomingBookings', language)}</p>
                  <Button 
                    className="w-full"
                    onClick={() => navigate(createPageUrl('Home'))}
                  >
                    {t('bookWalk', language)}
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
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(createPageUrl('MyBookings'))}
                  >
                    {t('viewAll', language)}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                {t('pawPoints', language)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-purple-600 mb-2">
                  {loyaltyPoints?.points_balance || 0}
                </div>
                <Badge className="bg-purple-600">
                  {(loyaltyPoints?.tier || 'bronze').toUpperCase()}
                </Badge>
              </div>
              <Button 
                className="w-full bg-purple-600"
                onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
              >
                {t('redeemPoints', language)}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                {t('quickActions', language)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('Home'))}
                >
                  <Dog className="w-4 h-4 mr-2" />
                  {t('findWalker', language)}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('Partners'))}
                >
                  <Store className="w-4 h-4 mr-2" />
                  {t('pawcaoShop', language)}
                </Button>
                {(!myWalkerProfiles || myWalkerProfiles.length === 0) && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(createPageUrl('BecomeWalker'))}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    {t('becomeWalker', language)}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logout Button - Mobile Optimized */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full max-w-md mx-auto block h-11 md:h-12 border-red-200 text-red-600 hover:bg-red-50 touch-manipulation active:scale-95"
        >
          {t('logout', language)}
        </Button>
      </div>
    </div>
  );
}
