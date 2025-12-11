import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, DollarSign, Calendar, Heart, Award, Target,
  PawPrint, Activity, Clock, Star, BarChart3, Download,
  TrendingDown, AlertCircle, CheckCircle, Zap, Dog, Loader2
} from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { Line, Bar, Pie } from "recharts";
import { LineChart, BarChart, PieChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewModal from "@/components/reviews/ReviewModal";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = React.useState(false);
  const [pendingReviewBooking, setPendingReviewBooking] = React.useState(null);

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allOwnerBookings', user?.email],
    queryFn: async () => {
      const walkerBookings = await base44.entities.Booking.filter({
        created_by: user.email
      });
      const trainerBookings = await base44.entities.TrainingBooking.filter({
        owner_email: user.email
      });
      const serviceBookings = await base44.entities.ServiceBooking.filter({
        owner_email: user.email
      });
      
      const all = [...walkerBookings, ...trainerBookings, ...serviceBookings];
      return all;
    },
    enabled: !!user,
    initialData: []
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ['myDogs'],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user,
    initialData: []
  });

  const { data: loyaltyPoints } = useQuery({
    queryKey: ['loyaltyPoints', user?.email],
    queryFn: async () => {
      const points = await base44.entities.LoyaltyPoints.filter({
        user_email: user.email
      });
      return points[0] || { points_balance: 0, total_earned: 0, tier: 'bronze' };
    },
    enabled: !!user,
  });

  const { data: scheduledWalks = [] } = useQuery({
    queryKey: ['scheduledAppointments', user?.email],
    queryFn: () => base44.entities.ScheduledAppointment.filter({
      created_by: user.email,
      is_active: true
    }),
    enabled: !!user,
    initialData: []
  });

  const { data: myGivenReviews = [] } = useQuery({
    queryKey: ['myGivenReviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewer_email: user?.email }),
    enabled: !!user,
    initialData: []
  });

  // Auto-open review modal for pending reviews
  React.useEffect(() => {
    if (allBookings.length > 0) {
      const needsReview = allBookings.find(b => b.status === 'completed' && !b.review_id && b.walker_id);
      if (needsReview) {
        setPendingReviewBooking(needsReview);
      }
    }
  }, [allBookings]);

  // Calculate statistics
  const totalSpent = allBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const completedBookings = allBookings.filter(b => b.status === 'completed');
  const avgBookingValue = completedBookings.length > 0 
    ? totalSpent / completedBookings.length 
    : 0;

  const avgRatingGiven = myGivenReviews.length > 0
    ? myGivenReviews.reduce((sum, r) => sum + r.rating, 0) / myGivenReviews.length
    : 0;

  // Monthly spending data (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const month = subMonths(new Date(), i);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthBookings = allBookings.filter(b => {
      const bookingDate = new Date(b.created_date);
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    });
    
    const monthTotal = monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    monthlyData.push({
      month: format(month, 'MMM', { locale: ptBR }),
      gastos: monthTotal,
      reservas: monthBookings.length
    });
  }

  // Spending by service type
  const serviceTypeData = [
    {
      name: 'Passeios',
      value: allBookings.filter(b => b.walk_date).reduce((s, b) => s + (b.total_amount || 0), 0),
      color: '#10b981'
    },
    {
      name: 'Treinos',
      value: allBookings.filter(b => b.session_date).reduce((s, b) => s + (b.total_amount || 0), 0),
      color: '#8b5cf6'
    },
    {
      name: 'Serviços',
      value: allBookings.filter(b => b.service_type).reduce((s, b) => s + (b.total_amount || 0), 0),
      color: '#3b82f6'
    }
  ];

  // Pet activity data
  const petActivityData = myDogs.map(dog => {
    const dogBookings = allBookings.filter(b => 
      b.dog_name === dog.dog_name || b.dog_profile_id === dog.id
    );
    return {
      name: dog.dog_name,
      passeios: dogBookings.length,
      gastos: dogBookings.reduce((s, b) => s + (b.total_amount || 0), 0)
    };
  });

  // Calculate savings vs community average
  const communityAvgMonthly = 180; // Mock data - replace with real avg
  const myMonthlyAvg = monthlyData[monthlyData.length - 1]?.gastos || 0;
  const savingsVsAvg = communityAvgMonthly - myMonthlyAvg;

  // Goals and recommendations
  const walksThisMonth = allBookings.filter(b => {
    const bookingDate = new Date(b.created_date);
    return bookingDate >= startOfMonth(new Date());
  }).length;
  
  const walkGoal = 12; // 3x per week
  const goalProgress = (walksThisMonth / walkGoal) * 100;

  const handleDownloadReport = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('dashboard-content');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Relatorio_PawCao_${format(new Date(), 'yyyy_MM')}.pdf`);
      
      toast.success("Relatório baixado com sucesso!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-1/3" />
          <div className="grid md:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto" id="dashboard-content">
        <ErrorBoundary>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-purple-600" />
            Meu Dashboard Pet
          </h1>
          <p className="text-gray-600 text-lg">
            Insights sobre seus pets e atividades 📊
          </p>
        </div>

        {/* Live Walk Banner */}
        {allBookings.some(b => b.status === 'in_progress') && (
          <Card className="mb-8 bg-gradient-to-r from-red-600 to-purple-600 text-white border-0 shadow-2xl animate-pulse">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Zap className="w-8 h-8 text-white animate-bounce" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Passeio em Andamento!</h2>
                  <p className="text-white/90">O seu Walker iniciou o serviço. Acompanhe em tempo real.</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  const liveBooking = allBookings.find(b => b.status === 'in_progress');
                  if (liveBooking) {
                    window.location.href = createPageUrl('LiveTrackingPage') + `?id=${liveBooking.id}`;
                  }
                }}
                className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-8 py-6 text-lg shadow-lg transition-transform hover:scale-105"
              >
                JUNTAR-SE À SESSÃO LIVE
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <PawPrint className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white">Este Mês</Badge>
              </div>
              <div className="text-4xl font-bold mb-1">{walksThisMonth}</div>
              <div className="text-sm opacity-90">Passeios Realizados</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white">Total</Badge>
              </div>
              <div className="text-4xl font-bold mb-1">€{totalSpent.toFixed(0)}</div>
              <div className="text-sm opacity-90">Investido em Pets</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white">PawPoints</Badge>
              </div>
              <div className="text-4xl font-bold mb-1">{loyaltyPoints?.points_balance?.toLocaleString() || 0}</div>
              <div className="text-sm opacity-90">Pontos Disponíveis</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Dog className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white">Pets</Badge>
              </div>
              <div className="text-4xl font-bold mb-1">{myDogs.length}</div>
              <div className="text-sm opacity-90">Cadastrados</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-8 h-8 opacity-80" />
                <Badge className="bg-white/20 text-white">Feedback</Badge>
              </div>
              <div className="text-4xl font-bold mb-1">{avgRatingGiven.toFixed(1)}</div>
              <div className="text-sm opacity-90">Média Dada ({myGivenReviews.length})</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Spending Trend */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Gastos Mensais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="gastos" stroke="#8b5cf6" strokeWidth={3} name="Gastos (€)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Service Type Distribution */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Distribuição de Serviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={serviceTypeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {serviceTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {serviceTypeData.map((service) => (
                      <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: service.color }}></div>
                          <span className="font-semibold text-sm">{service.name}</span>
                        </div>
                        <span className="font-bold text-green-600">€{service.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pet Activity */}
            {petActivityData.length > 0 && (
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dog className="w-5 h-5 text-orange-600" />
                    Atividade por Pet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={petActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="passeios" fill="#8b5cf6" name="Passeios" />
                      <Bar yAxisId="right" dataKey="gastos" fill="#10b981" name="Gastos (€)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Insights & Goals */}
          <div className="space-y-6">
            {/* Monthly Goal */}
            <Card className="border-2 border-green-300 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Meta de Atividade
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-green-600 mb-2">
                    {walksThisMonth}/{walkGoal}
                  </div>
                  <p className="text-sm text-gray-600">passeios este mês</p>
                </div>
                
                <Progress value={goalProgress} className="h-4 mb-4" />
                
                <div className="space-y-2 text-sm">
                  {goalProgress >= 100 ? (
                    <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3 text-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="font-bold text-green-900">Meta Alcançada! 🎉</p>
                      <p className="text-xs text-green-700">Continue assim!</p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                      <p className="text-blue-900">
                        <strong>Faltam {walkGoal - walksThisMonth} passeios</strong> para atingir sua meta!
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        Recomendado: 3 passeios/semana para um pet saudável 🐾
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Savings Insights */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  Potencial de Economia
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <h4 className="font-bold text-green-900 mb-2">
                    💡 Com Agendamento Recorrente
                  </h4>
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    €{(avgBookingValue * 0.20 * walksThisMonth).toFixed(2)}
                  </div>
                  <p className="text-sm text-green-700">
                    economia mensal possível (20% desconto)
                  </p>
                </div>

                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <h4 className="font-bold text-purple-900 mb-2">
                    👑 Com Plano Premium
                  </h4>
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    €{(avgBookingValue * 0.15 * walksThisMonth - 9.99).toFixed(2)}
                  </div>
                  <p className="text-sm text-purple-700">
                    economia mensal (15% + benefícios)
                  </p>
                </div>

                <Button
                  onClick={() => navigate(createPageUrl('OwnerSubscriptions'))}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Economizar Agora
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg">⚡ Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button
                  variant="default"
                  className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => navigate(createPageUrl('Home'))}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Procurar um Passeador
                </Button>
                {completedBookings.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => {
                      // Rebook last walker (efficiency)
                      const lastBooking = completedBookings[0];
                      if (lastBooking) {
                        navigate(createPageUrl(`WalkerDetails?id=${lastBooking.walker_id}`));
                      }
                    }}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Reservar Novamente ({completedBookings[0].walker_name})
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('ScheduledWalks'))}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Ver Agendamentos ({scheduledWalks.length})
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate(createPageUrl('LoyaltyRewards'))}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Resgatar Pontos ({loyaltyPoints?.points_balance || 0})
                </Button>
              </CardContent>
            </Card>

            {/* Export Report */}
            <Button
              variant="outline"
              className="w-full border-2 border-purple-300 hover:bg-purple-50"
              onClick={handleDownloadReport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isExporting ? "Gerando PDF..." : "Baixar Relatório Mensal"}
            </Button>
          </div>
        </div>
        </ErrorBoundary>
        {pendingReviewBooking && (
          <ReviewModal 
            booking={pendingReviewBooking} 
            isOpen={!!pendingReviewBooking} 
            onClose={() => setPendingReviewBooking(null)} 
          />
        )}
      </div>
    </div>
  );
}