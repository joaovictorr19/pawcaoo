import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Award, MapPin, Zap } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfessionalDashboard() {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Fetch completed bookings (walks)
  const { data: walkerBookings = [], isLoading: loadingWalkerBookings } = useQuery({
    queryKey: ['walkerCompletedBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Booking.filter({ 
        walker_email: user.email, 
        status: 'completed' 
      }, '-created_date');
    },
    enabled: !!user?.email,
  });

  // Fetch completed training bookings
  const { data: trainerBookings = [], isLoading: loadingTrainerBookings } = useQuery({
    queryKey: ['trainerCompletedBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.TrainingBooking.filter({ 
        trainer_email: user.email, 
        status: 'completed' 
      }, '-created_date');
    },
    enabled: !!user?.email,
  });

  // Fetch reviews for walker/trainer
  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['professionalsReviews', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const walkerReviews = await base44.entities.Review.filter({ 
        walker_id: user.id || '' 
      });
      const trainerReviews = await base44.entities.Review.filter({ 
        trainer_id: user.id || '' 
      });
      return [...walkerReviews, ...trainerReviews];
    },
    enabled: !!user?.email && !!user?.id,
  });

  // Fetch walk checkpoints for distance tracking
  const { data: walkCheckpoints = [], isLoading: loadingCheckpoints } = useQuery({
    queryKey: ['walkCheckpoints', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Get all completed bookings and fetch their checkpoints
      const bookingIds = walkerBookings.map(b => b.id);
      if (bookingIds.length === 0) return [];
      
      const allCheckpoints = await base44.entities.WalkCheckpoint.list();
      return allCheckpoints.filter(cp => bookingIds.includes(cp.booking_id));
    },
    enabled: !!walkerBookings.length && !!user?.email,
  });

  // Calculated metrics
  const metrics = useMemo(() => {
    const allBookings = [...walkerBookings, ...trainerBookings];
    
    // Total completed activities
    const totalActivities = allBookings.length;
    
    // Average rating
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2)
      : '0.00';
    
    // Total kilometers
    const totalKm = walkCheckpoints.reduce((sum, cp) => sum + (cp.distance_km || 0), 0);
    
    // Monthly earnings
    const monthlyData = {};
    const now = new Date();
    const last12Months = eachMonthOfInterval({
      start: new Date(now.getFullYear() - 1, now.getMonth(), 1),
      end: now
    });
    
    last12Months.forEach(date => {
      const monthKey = format(date, 'MMM/yy', { locale: pt });
      monthlyData[monthKey] = 0;
    });
    
    allBookings.forEach(booking => {
      if (booking.completed_date) {
        const monthKey = format(new Date(booking.completed_date), 'MMM/yy', { locale: pt });
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey] += booking.service_amount || 0;
        }
      }
    });
    
    const monthlyChartData = Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      earnings: parseFloat(amount.toFixed(2))
    }));
    
    // Rating distribution
    const ratingDistribution = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[Math.floor(r.rating) - 1]++;
      }
    });
    
    const ratingData = [
      { name: '⭐', value: ratingDistribution[0] },
      { name: '⭐⭐', value: ratingDistribution[1] },
      { name: '⭐⭐⭐', value: ratingDistribution[2] },
      { name: '⭐⭐⭐⭐', value: ratingDistribution[3] },
      { name: '⭐⭐⭐⭐⭐', value: ratingDistribution[4] }
    ];
    
    return {
      totalActivities,
      avgRating,
      totalKm: totalKm.toFixed(1),
      monthlyChartData,
      ratingData
    };
  }, [walkerBookings, trainerBookings, reviews, walkCheckpoints]);

  const isLoading = loadingUser || loadingWalkerBookings || loadingTrainerBookings || loadingReviews || loadingCheckpoints;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard Profissional</h1>
          <p className="text-gray-600">Acompanhe seu desempenho, ganhos e atividades</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          {/* Total Activities */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Atividades Concluídas</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metrics.totalActivities}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Passeios + Treinos</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Rating */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avaliação Média</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metrics.avgRating}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">De {reviews.length} avaliações</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Distance */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Quilômetros Percorridos</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{metrics.totalKm} km</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Nas atividades</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Earnings */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Ganhos Totais</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    €{metrics.monthlyChartData.reduce((sum, m) => sum + m.earnings, 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Últimos 12 meses</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          
          {/* Monthly Earnings Chart */}
          <Card className="border-0 shadow-lg dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Ganhos Mensais
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Últimos 12 meses</p>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    formatter={(value) => `€${value.toFixed(2)}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#9333ea" 
                    strokeWidth={3}
                    dot={{ fill: '#9333ea', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Rating Distribution */}
          <Card className="border-0 shadow-lg dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                Distribuição de Avaliações
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total: {reviews.length} avaliações</p>
            </CardHeader>
            <CardContent className="p-6">
              {reviews.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.ratingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
                    <Bar dataKey="value" fill="#fbbf24" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  <p>Nenhuma avaliação recebida ainda</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Recent Activity Summary */}
        <Card className="border-0 shadow-lg dark:bg-slate-900">
          <CardHeader>
            <CardTitle>Resumo de Atividades</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Passeios Concluídos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{walkerBookings.length}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Sessões de Treino</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{trainerBookings.length}</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Clientes Satisfeitos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {reviews.filter(r => r.rating >= 4).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}