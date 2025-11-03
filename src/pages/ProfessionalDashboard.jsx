
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp, Users, Calendar, DollarSign, Star, Package,
  Clock, Target, Award, Activity, BarChart3, ArrowUp, ArrowDown,
  Dog, Phone, Mail, MapPin, History, Trophy
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AvailabilityCalendar from "../components/calendar/AvailabilityCalendar";
import { toast } from "sonner"; // Assuming sonner is used for toasts

export default function ProfessionalDashboard() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30days');
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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

  const profile = walkerProfile || trainerProfile;
  const isWalker = !!walkerProfile;

  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['professionalBookings'],
    queryFn: async () => {
      const walkerBookings = await base44.entities.Booking.filter({
        walker_email: user?.email
      }, '-created_date');
      const trainerBookings = await base44.entities.TrainingBooking.filter({
        trainer_email: user?.email
      }, '-created_date');
      return [...walkerBookings, ...trainerBookings];
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: scheduledAppointments } = useQuery({
    queryKey: ['myScheduledAppointments'],
    queryFn: () => base44.entities.ScheduledAppointment.filter({
      walker_email: user?.email,
      is_active: true
    }),
    enabled: !!user,
    initialData: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ['myReviews'],
    queryFn: async () => {
      const allReviews = await base44.entities.Review.list();
      return allReviews.filter(r =>
        r.walker_id === profile?.id || r.trainer_id === profile?.id
      );
    },
    enabled: !!profile,
    initialData: [],
  });

  const { data: availabilityData } = useQuery({
    queryKey: ['myAvailability'],
    queryFn: () => base44.entities.CalendarAvailability.filter({
      professional_email: user?.email
    }),
    enabled: !!user,
    initialData: [],
  });

  const { data: myAchievements, refetch: refetchAchievements } = useQuery({
    queryKey: ['myAchievements'],
    queryFn: async () => {
      const achievements = await base44.entities.ProfessionalAchievement.filter({
        professional_email: user?.email
      });
      return achievements[0];
    },
    enabled: !!user,
  });

  // Calculate date range
  const getDaysAgo = () => {
    switch(dateRange) {
      case '7days': return 7;
      case '30days': return 30;
      case '90days': return 90;
      default: return 30;
    }
  };

  const startDate = subDays(new Date(), getDaysAgo());
  const filteredBookings = bookings.filter(b =>
    new Date(b.created_date) >= startDate
  );

  // Calculate Analytics
  const analytics = {
    totalBookings: filteredBookings.length,
    completedBookings: filteredBookings.filter(b => b.status === 'completed').length,
    totalEarnings: filteredBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.service_amount || 0), 0),
    averageRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0,
    pendingBookings: filteredBookings.filter(b => b.status === 'pending').length,
    cancelledBookings: filteredBookings.filter(b => b.status === 'cancelled').length,
    recurringClients: scheduledAppointments.length,
  };

  // Calculate client retention
  const uniqueClients = [...new Set(bookings.map(b => b.owner_email))];
  const returningClients = uniqueClients.filter(email =>
    bookings.filter(b => b.owner_email === email).length > 1
  );
  const retentionRate = uniqueClients.length > 0
    ? ((returningClients.length / uniqueClients.length) * 100).toFixed(1)
    : 0;

  // Calculate growth
  const prevPeriodStart = subDays(startDate, getDaysAgo());
  const prevBookings = bookings.filter(b =>
    new Date(b.created_date) >= prevPeriodStart &&
    new Date(b.created_date) < startDate
  );
  const bookingsGrowth = prevBookings.length > 0
    ? (((filteredBookings.length - prevBookings.length) / prevBookings.length) * 100).toFixed(1)
    : 0;

  // Weekly performance data
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weeklyData = weekDays.map(day => {
    const dayBookings = bookings.filter(b => {
      const bookingDate = new Date(b.walk_date || b.session_date);
      return format(bookingDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    return {
      day: format(day, 'EEE'),
      bookings: dayBookings.length,
      earnings: dayBookings.reduce((sum, b) => sum + (b.service_amount || 0), 0)
    };
  });

  // Client profiles
  const clientProfiles = uniqueClients.map(email => {
    const clientBookings = bookings.filter(b => b.owner_email === email);
    const lastBooking = clientBookings[0];
    return {
      email,
      name: lastBooking?.owner_name,
      phone: lastBooking?.owner_phone,
      totalBookings: clientBookings.length,
      totalSpent: clientBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
      lastBooking: lastBooking?.walk_date || lastBooking?.session_date,
      dogs: [...new Set(clientBookings.map(b => b.dog_name))],
      averageRating: clientBookings
        .map(b => reviews.find(r => r.booking_id === b.id))
        .filter(r => r)
        .reduce((sum, r, _, arr) => sum + r.rating / arr.length, 0) || 0
    };
  }).sort((a, b) => b.totalBookings - a.totalBookings);


  // Achievement checking function
  const checkAndAwardAchievements = async () => {
    if (!user || !profile) return;

    let currentAchievementsRecord = myAchievements;

    // If no achievement record exists, create one
    if (!currentAchievementsRecord) {
      currentAchievementsRecord = await base44.entities.ProfessionalAchievement.create({
        professional_email: user.email,
        professional_name: profile.walker_name || profile.trainer_name,
        professional_type: isWalker ? 'walker' : 'trainer',
        achievements: [],
        badges: [],
        total_achievements: 0,
        achievement_points: 0,
        longest_streak: 0,
        leaderboard_stats: {}
      });
      refetchAchievements(); // Refetch to ensure the newly created record is picked up
      return; // Exit after creating, will re-run on next analytics change
    }

    const newAchievements = [];
    const existingIds = currentAchievementsRecord.achievements?.map(a => a.achievement_id) || [];

    // Milestone Achievements
    if (analytics.completedBookings >= 10 && !existingIds.includes('first_10')) {
      newAchievements.push({
        achievement_id: 'first_10',
        name: 'Primeiros 10',
        description: '10 serviços completados',
        icon: '🎯',
        category: 'milestone',
        rarity: 'common',
        earned_date: new Date().toISOString()
      });
    }

    if (analytics.completedBookings >= 50 && !existingIds.includes('half_century')) {
      newAchievements.push({
        achievement_id: 'half_century',
        name: 'Meio Século',
        description: '50 serviços completados',
        icon: '⭐',
        category: 'milestone',
        rarity: 'rare',
        earned_date: new Date().toISOString()
      });
    }

    if (analytics.completedBookings >= 100 && !existingIds.includes('centurion')) {
      newAchievements.push({
        achievement_id: 'centurion',
        name: 'Centurião',
        description: '100 serviços completados',
        icon: '🏆',
        category: 'milestone',
        rarity: 'epic',
        earned_date: new Date().toISOString()
      });
    }

    if (analytics.completedBookings >= 500 && !existingIds.includes('legend')) {
      newAchievements.push({
        achievement_id: 'legend',
        name: 'Lenda',
        description: '500 serviços completados!',
        icon: '👑',
        category: 'milestone',
        rarity: 'legendary',
        earned_date: new Date().toISOString()
      });
    }

    // Quality Achievements
    if (parseFloat(analytics.averageRating) >= 4.8 && analytics.completedBookings >= 20 && !existingIds.includes('top_rated')) {
      newAchievements.push({
        achievement_id: 'top_rated',
        name: 'Top Rated',
        description: 'Rating 4.8+ com 20+ serviços',
        icon: '🌟',
        category: 'quality',
        rarity: 'epic',
        earned_date: new Date().toISOString()
      });
    }

    if (parseFloat(analytics.averageRating) >= 5.0 && analytics.completedBookings >= 10 && !existingIds.includes('perfect_score')) {
      newAchievements.push({
        achievement_id: 'perfect_score',
        name: '5 Estrelas Perfeito',
        description: 'Rating 5.0 com 10+ serviços',
        icon: '💫',
        category: 'quality',
        rarity: 'legendary',
        earned_date: new Date().toISOString()
      });
    }

    // Earnings Achievements
    if (analytics.totalEarnings >= 1000 && !existingIds.includes('first_1k')) {
      newAchievements.push({
        achievement_id: 'first_1k',
        name: 'Primeiro €1,000',
        description: 'Ganhou €1,000',
        icon: '💰',
        category: 'milestone',
        rarity: 'rare',
        earned_date: new Date().toISOString()
      });
    }

    if (analytics.totalEarnings >= 5000 && !existingIds.includes('big_earner')) {
      newAchievements.push({
        achievement_id: 'big_earner',
        name: 'Grande Ganho',
        description: 'Ganhou €5,000',
        icon: '💎',
        category: 'milestone',
        rarity: 'epic',
        earned_date: new Date().toISOString()
      });
    }

    // Update if new achievements
    if (newAchievements.length > 0) {
      await base44.entities.ProfessionalAchievement.update(currentAchievementsRecord.id, {
        achievements: [...(currentAchievementsRecord.achievements || []), ...newAchievements],
        total_achievements: (currentAchievementsRecord.total_achievements || 0) + newAchievements.length,
        achievement_points: (currentAchievementsRecord.achievement_points || 0) + (newAchievements.length * 100)
      });

      toast.success(`🎉 Novo Achievement: ${newAchievements[0].name}!`);
      refetchAchievements(); // Refetch to update the UI with new achievements
    }
  };

  useEffect(() => {
    if (profile && user && analytics.completedBookings !== undefined && analytics.totalEarnings !== undefined && analytics.averageRating !== undefined) {
      checkAndAwardAchievements();
    }
  }, [profile, user, analytics.completedBookings, analytics.totalEarnings, analytics.averageRating, myAchievements]); // Added myAchievements to trigger effect if it changes (e.g. initial creation)


  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <Award className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sem Perfil Profissional</h2>
            <p className="text-gray-600 mb-4">
              Precisa de criar um perfil de passeador ou treinador para aceder ao dashboard.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate(createPageUrl('BecomeWalker'))}>
                Tornar-me Passeador
              </Button>
              <Button onClick={() => navigate(createPageUrl('BecomeTrainer'))} variant="outline">
                Tornar-me Treinador
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Dashboard Profissional
              </h1>
              <p className="text-sm md:text-lg text-gray-600">
                {profile.walker_name || profile.trainer_name} - {isWalker ? 'Passeador' : 'Treinador'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={dateRange === '7days' ? 'default' : 'outline'}
                onClick={() => setDateRange('7days')}
                size="sm"
              >
                7 dias
              </Button>
              <Button
                variant={dateRange === '30days' ? 'default' : 'outline'}
                onClick={() => setDateRange('30days')}
                size="sm"
              >
                30 dias
              </Button>
              <Button
                variant={dateRange === '90days' ? 'default' : 'outline'}
                onClick={() => setDateRange('90days')}
                size="sm"
                className="hidden md:inline-flex"
              >
                90 dias
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                  {bookingsGrowth > 0 ? (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      <ArrowUp className="w-3 h-3" /> {bookingsGrowth}%
                    </Badge>
                  ) : bookingsGrowth < 0 ? (
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      <ArrowDown className="w-3 h-3" /> {Math.abs(bookingsGrowth)}%
                    </Badge>
                  ) : null}
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">€{analytics.totalEarnings.toFixed(0)}</p>
                <p className="text-xs md:text-sm text-gray-600">Total Ganho</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 md:p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{analytics.totalBookings}</p>
                <p className="text-xs md:text-sm text-gray-600">Total Reservas</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 md:p-6">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-2">
                  <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{analytics.averageRating}</p>
                <p className="text-xs md:text-sm text-gray-600">Rating Médio</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-4 md:p-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">{retentionRate}%</p>
                <p className="text-xs md:text-sm text-gray-600">Retenção</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-white shadow-lg grid w-full grid-cols-5">
            <TabsTrigger value="analytics" className="text-xs md:text-sm">
              <BarChart3 className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs md:text-sm">
              <Award className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs md:text-sm">
              <Calendar className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="recurring" className="text-xs md:text-sm">
              <Package className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Recorrentes</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="text-xs md:text-sm">
              <Users className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Clientes</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Weekly Performance Chart */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Performance Semanal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weeklyData.map((day, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-12 text-sm font-semibold text-gray-600">{day.day}</div>
                        <div className="flex-1">
                          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-end px-2"
                              style={{ width: `${(day.bookings / Math.max(1, ...weeklyData.map(d => d.bookings)) * 100) || 0}%` }}
                            >
                              {day.bookings > 0 && (
                                <span className="text-xs font-bold text-white">{day.bookings}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-green-600 w-16 text-right">
                          €{day.earnings.toFixed(0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Status Breakdown */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Distribuição de Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-semibold text-gray-900">Completadas</span>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-green-600">{analytics.completedBookings}</div>
                      <Badge className="bg-green-600 text-white">
                        {((analytics.completedBookings / analytics.totalBookings) * 100 || 0).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="font-semibold text-gray-900">Pendentes</span>
                    <div className="text-2xl font-bold text-yellow-600">{analytics.pendingBookings}</div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-semibold text-gray-900">Canceladas</span>
                    <div className="text-2xl font-bold text-red-600">{analytics.cancelledBookings}</div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-semibold text-gray-900">Clientes Recorrentes</span>
                    <div className="text-2xl font-bold text-purple-600">{analytics.recurringClients}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reviews */}
              <Card className="border-0 shadow-xl md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Avaliações Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Ainda sem avaliações</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.slice(0, 5).map((review) => (
                        <div key={review.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">{review.reviewer_name}</h4>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {format(new Date(review.created_date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NEW: Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  Os Meus Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <div className="text-3xl font-bold text-purple-600">
                      {myAchievements?.total_achievements || 0}
                    </div>
                    <div className="text-sm text-gray-600">Achievements</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <div className="text-3xl font-bold text-yellow-600">
                      {myAchievements?.achievement_points || 0}
                    </div>
                    <div className="text-sm text-gray-600">Pontos</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-3xl font-bold text-blue-600">
                      {myAchievements?.longest_streak || 0}
                    </div>
                    <div className="text-sm text-gray-600">Melhor Streak</div>
                  </div>
                </div>

                {/* Achievements Grid */}
                {!myAchievements || myAchievements.achievements?.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Ainda sem achievements
                    </h3>
                    <p className="text-gray-600">
                      Complete mais serviços para desbloquear achievements!
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myAchievements.achievements.map((achievement, idx) => {
                      const rarityColors = {
                        common: 'from-gray-400 to-gray-600',
                        rare: 'from-blue-400 to-blue-600',
                        epic: 'from-purple-400 to-purple-600',
                        legendary: 'from-yellow-400 to-yellow-600'
                      };

                      return (
                        <motion.div
                          key={achievement.achievement_id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Card className={`border-2 hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br ${rarityColors[achievement.rarity]}`}>
                            <CardContent className="p-4 text-white text-center">
                              <div className="text-5xl mb-3">{achievement.icon}</div>
                              <h4 className="font-bold text-lg mb-1">{achievement.name}</h4>
                              <p className="text-sm opacity-90 mb-2">{achievement.description}</p>
                              <Badge className="bg-white/20 text-white text-xs">
                                {achievement.rarity.toUpperCase()}
                              </Badge>
                              <p className="text-xs mt-2 opacity-75">
                                {format(new Date(achievement.earned_date), 'dd/MM/yyyy')}
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Next Achievements to Unlock */}
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Próximos Objetivos
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analytics.completedBookings < 10 && (
                      <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">🎯</span>
                          <div className="flex-1">
                            <h4 className="font-semibold">Primeiros 10</h4>
                            <p className="text-sm text-gray-600">Complete 10 serviços</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(analytics.completedBookings / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {analytics.completedBookings} / 10
                        </p>
                      </div>
                    )}

                    {analytics.completedBookings >= 10 && analytics.completedBookings < 50 && (
                      <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">⭐</span>
                          <div className="flex-1">
                            <h4 className="font-semibold">Meio Século</h4>
                            <p className="text-sm text-gray-600">Complete 50 serviços</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(analytics.completedBookings / 50) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {analytics.completedBookings} / 50
                        </p>
                      </div>
                    )}

                    {analytics.completedBookings >= 5 && parseFloat(analytics.averageRating) < 4.8 && (
                      <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">⭐</span>
                          <div className="flex-1">
                            <h4 className="font-semibold">Top Rated</h4>
                            <p className="text-sm text-gray-600">Alcance rating 4.8+ com 20+ serviços</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-600 h-2 rounded-full"
                            style={{ width: `${(parseFloat(analytics.averageRating) / 4.8) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {analytics.averageRating} / 4.8
                        </p>
                      </div>
                    )}
                    {analytics.totalEarnings < 1000 && (
                      <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">💰</span>
                          <div className="flex-1">
                            <h4 className="font-semibold">Primeiro €1,000</h4>
                            <p className="text-sm text-gray-600">Ganhe €1,000</p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{ width: `${(analytics.totalEarnings / 1000) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          €{analytics.totalEarnings.toFixed(0)} / €1,000
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leaderboard Preview */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    A Sua Posição no Leaderboard
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => navigate(createPageUrl('Leaderboard'))}
                  >
                    Ver Completo
                  </Button>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Por Ganhos</div>
                    <div className="text-3xl font-bold text-green-600">
                      #{myAchievements?.leaderboard_stats?.total_earnings_rank || '-'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Por Rating</div>
                    <div className="text-3xl font-bold text-yellow-600">
                      #{myAchievements?.leaderboard_stats?.rating_rank || '-'}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-sm text-gray-600 mb-1">Por Reservas</div>
                    <div className="text-3xl font-bold text-blue-600">
                      #{myAchievements?.leaderboard_stats?.bookings_rank || '-'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Calendário de Disponibilidade</CardTitle>
              </CardHeader>
              <CardContent className="p-2 md:p-6">
                <AvailabilityCalendar
                  availabilityData={availabilityData}
                  bookings={bookings}
                  onDateSelect={(date) => navigate(createPageUrl('ManageAvailability'))}
                />
                <div className="mt-6 text-center">
                  <Button onClick={() => navigate(createPageUrl('ManageAvailability'))}>
                    <Clock className="w-4 h-4 mr-2" />
                    Gerir Disponibilidade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recurring Bookings Tab */}
          <TabsContent value="recurring">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-purple-600" />
                  Reservas Recorrentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scheduledAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Sem Reservas Recorrentes
                    </h3>
                    <p className="text-gray-600">
                      Estabeleça acordos recorrentes com os seus clientes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledAppointments.map((appointment) => (
                      <Card key={appointment.id} className="p-4 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Dog className="w-5 h-5 text-green-600" />
                              <h3 className="font-bold text-lg text-gray-900">
                                {appointment.dog_name}
                              </h3>
                              <Badge className="bg-purple-100 text-purple-700">
                                {appointment.recurrence}
                              </Badge>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3 mt-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                {appointment.owner_name}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" />
                                {appointment.owner_phone}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4" />
                                {appointment.time_slot} ({appointment.duration_hours}h)
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                {appointment.days_of_week?.join(', ')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              €{appointment.total_amount_per_walk?.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">por sessão</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Gestão de Clientes ({clientProfiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientProfiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Ainda Sem Clientes
                    </h3>
                    <p className="text-gray-600">
                      Os seus clientes aparecerão aqui após as primeiras reservas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientProfiles.map((client) => (
                      <Card
                        key={client.email}
                        className="p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedClient(selectedClient?.email === client.email ? null : client)}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="flex-1 w-full">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900">{client.name}</h3>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                                    {client.totalBookings} reservas
                                  </Badge>
                                  {client.totalBookings > 3 && (
                                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                                      Cliente VIP
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                              <div className="text-center p-2 md:p-3 bg-green-50 rounded-lg">
                                <div className="text-xl md:text-2xl font-bold text-green-600">
                                  €{client.totalSpent.toFixed(0)}
                                </div>
                                <div className="text-xs text-gray-600">Total Gasto</div>
                              </div>
                              <div className="text-center p-2 md:p-3 bg-yellow-50 rounded-lg">
                                <div className="text-xl md:text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                                  {client.averageRating > 0 ? client.averageRating.toFixed(1) : 'N/A'}
                                  {client.averageRating > 0 && <Star className="w-4 h-4 fill-yellow-400" />}
                                </div>
                                <div className="text-xs text-gray-600">Rating Médio</div>
                              </div>
                              <div className="text-center p-2 md:p-3 bg-purple-50 rounded-lg">
                                <div className="text-xl md:text-2xl font-bold text-purple-600">
                                  {client.dogs.length}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {client.dogs.length === 1 ? 'Cão' : 'Cães'}
                                </div>
                              </div>
                              <div className="text-center p-2 md:p-3 bg-blue-50 rounded-lg">
                                <div className="text-xs font-bold text-blue-600">
                                  {client.lastBooking ? format(new Date(client.lastBooking), 'dd/MM') : 'N/A'}
                                </div>
                                <div className="text-xs text-gray-600">Última Reserva</div>
                              </div>
                            </div>

                            {selectedClient?.email === client.email && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-t pt-4 space-y-3"
                              >
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-700">{client.email}</span>
                                </div>
                                {client.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <span className="text-gray-700">{client.phone}</span>
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <Dog className="w-4 h-4" />
                                    Cães:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {client.dogs.map((dog, idx) => (
                                      <Badge key={idx} variant="outline" className="text-sm">
                                        {dog}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Histórico de Reservas:
                                  </p>
                                  <div className="space-y-2">
                                    {bookings
                                      .filter(b => b.owner_email === client.email)
                                      .slice(0, 3)
                                      .map((booking) => (
                                        <div key={booking.id} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                                          <span className="text-gray-700">
                                            {booking.dog_name} - {format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy')}
                                          </span>
                                          <Badge className={
                                            booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                          }>
                                            {booking.status}
                                          </Badge>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
