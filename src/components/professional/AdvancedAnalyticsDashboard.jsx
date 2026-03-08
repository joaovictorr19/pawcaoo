import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend 
} from "recharts";
import { TrendingUp, DollarSign, Calendar, Clock, Award, Filter, PieChart as PieIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdvancedAnalyticsDashboard({ walkerEmail }) {
  // Fetch ALL bookings for history analysis
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['professionalAnalytics', walkerEmail],
    queryFn: async () => {
      // Fetch sufficient history for meaningful analytics
      const result = await base44.entities.Booking.filter({
        walker_email: walkerEmail
      }, '-created_date', 500);
      return result || [];
    },
    enabled: !!walkerEmail,
    staleTime: 10 * 60 * 1000 // Cache for 10 mins as stats don't change second-by-second
  });

  const analytics = useMemo(() => {
    if (!bookings.length) return null;

    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);

    // 1. Earnings Evolution (Last 6 Months)
    const monthlyStats = {};
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const key = d.toLocaleString('default', { month: 'short' });
      monthlyStats[key] = { name: key, earnings: 0, walks: 0 };
    }

    // 2. Best Times (Heatmap data)
    const timeSlots = {};
    
    // 3. Conversion Stats
    let completedCount = 0;
    let cancelledCount = 0;
    let rejectedCount = 0;
    let totalTips = 0;
    let tippedWalksCount = 0;

    bookings.forEach(booking => {
      const bookingDate = new Date(booking.created_date); // Use created date for volume, or walk_date for earnings?
      // For earnings, better to use completed_date or walk_date
      const activeDate = booking.completed_date ? new Date(booking.completed_date) : new Date(booking.walk_date);
      
      // -- Earnings Evolution --
      if (booking.status === 'completed' || booking.status === 'service_completed') {
        completedCount++;
        if (booking.tip_amount > 0) {
          totalTips += booking.tip_amount;
          tippedWalksCount++;
        }

        if (activeDate >= sixMonthsAgo) {
          const monthKey = activeDate.toLocaleString('default', { month: 'short' });
          if (monthlyStats[monthKey]) {
            const total = (booking.service_amount || 0) + (booking.tip_amount || 0);
            monthlyStats[monthKey].earnings += total;
            monthlyStats[monthKey].walks += 1;
          }
        }
      } else if (booking.status === 'cancelled') {
        cancelledCount++;
      } else if (booking.status === 'rejected') {
        rejectedCount++;
      }

      // -- Time Analysis (All requests, to see demand) --
      if (booking.walk_time) {
        // Extract hour simple logic (e.g. "14:00" -> "14h")
        const hourMatch = booking.walk_time.match(/(\d{1,2}):/);
        if (hourMatch) {
          const hour = parseInt(hourMatch[1]);
          const hourKey = `${hour}h`;
          timeSlots[hourKey] = (timeSlots[hourKey] || 0) + 1;
        } else if (booking.walk_time.toLowerCase().includes('morning') || booking.walk_time.toLowerCase().includes('manhã')) {
          timeSlots['Manhã'] = (timeSlots['Manhã'] || 0) + 1;
        } else if (booking.walk_time.toLowerCase().includes('afternoon') || booking.walk_time.toLowerCase().includes('tarde')) {
          timeSlots['Tarde'] = (timeSlots['Tarde'] || 0) + 1;
        }
      }
    });

    const earningsData = Object.values(monthlyStats);
    
    // Sort times by volume
    const popularTimesData = Object.entries(timeSlots)
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    // Key KPIs
    const totalRequests = bookings.length;
    const conversionRate = totalRequests > 0 ? ((completedCount / totalRequests) * 100).toFixed(1) : 0;
    const avgTip = tippedWalksCount > 0 ? (totalTips / tippedWalksCount).toFixed(2) : 0;
    const tipFrequency = completedCount > 0 ? ((tippedWalksCount / completedCount) * 100).toFixed(0) : 0;

    return { earningsData, popularTimesData, conversionRate, avgTip, tipFrequency, totalTips };
  }, [bookings]);

  if (isLoading) return <AnalyticsSkeleton />;
  if (!analytics) return <div className="text-center p-8 text-gray-500">Dados insuficientes para análise.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-indigo-600 font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" /> Taxa de Conversão
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-indigo-900">{analytics.conversionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Das solicitações são concluídas com sucesso.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Média de Gorjetas
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-green-900">€{analytics.avgTip}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Recebe gorjeta em {analytics.tipFrequency}% dos passeios.</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-600 font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" /> Melhor Horário
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-900">
              {analytics.popularTimesData[0]?.time || "N/A"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Horário com maior volume de pedidos.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EARNINGS CHART */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Evolução de Ganhos
            </CardTitle>
            <CardDescription>Performance financeira dos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.earningsData}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `€${val}`} tick={{fontSize: 12}} />
                <Tooltip 
                  formatter={(val) => [`€${val.toFixed(2)}`, "Ganhos"]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="earnings" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorEarnings)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* POPULAR TIMES CHART */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Horários Mais Rentáveis
            </CardTitle>
            <CardDescription>Sugestão baseada no histórico de demanda</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.popularTimesData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis dataKey="time" type="category" axisLine={false} tickLine={false} width={50} tick={{fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30}>
                  {analytics.popularTimesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[350px] w-full rounded-xl" />
        <Skeleton className="h-[350px] w-full rounded-xl" />
      </div>
    </div>
  );
}