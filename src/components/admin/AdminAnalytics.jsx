import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, subDays, isAfter, startOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, Calendar, CheckCircle, Trophy, TrendingUp } from "lucide-react";

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminAnalytics({ 
  users = [], 
  walkers = [],
  bookings = [], 
  payments = [], 
  services = [], 
  adoptionListings = [] 
}) {

  // 1. KPIs no Topo
  const kpis = useMemo(() => {
    // Total de Walkers Ativos
    const activeWalkersCount = walkers.filter(w => w.is_active).length;

    // Reservas no Último Mês (30 dias)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const bookingsLastMonth = bookings.filter(b => {
      const date = new Date(b.walk_date || b.session_date || b.created_date);
      return isAfter(date, thirtyDaysAgo);
    }).length;

    // Taxa de Conclusão de Serviço
    const relevantBookings = bookings.filter(b => ['confirmed', 'completed', 'service_completed', 'finalizada'].includes(b.status));
    const completedBookings = bookings.filter(b => ['completed', 'finalizada'].includes(b.status)).length;
    const completionRate = relevantBookings.length > 0 
      ? ((completedBookings / relevantBookings.length) * 100).toFixed(1) 
      : 0;

    return {
      activeWalkersCount,
      bookingsLastMonth,
      completionRate
    };
  }, [walkers, bookings]);

  // 2. Gráfico de Desempenho (Novas Reservas Criadas por Mês)
  const bookingsTrendData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(date => {
      const monthStr = format(date, 'MMM', { locale: ptBR });
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const count = bookings.filter(b => {
        const created = new Date(b.created_date);
        return created >= start && created <= end;
      }).length;

      return {
        name: monthStr,
        Reservas: count
      };
    });
  }, [bookings]);

  // 3. Top 5 Walkers (Últimos 90 dias)
  const topWalkers = useMemo(() => {
    const ninetyDaysAgo = subDays(new Date(), 90);
    
    // Filtra reservas finalizadas nos últimos 90 dias
    const recentCompleted = bookings.filter(b => {
      const date = new Date(b.walk_date || b.session_date || b.created_date);
      return isAfter(date, ninetyDaysAgo) && (b.status === 'completed' || b.status === 'finalizada');
    });

    // Agrupa por walker_id ou walker_name
    const walkerCounts = {};
    recentCompleted.forEach(b => {
      const id = b.walker_id || b.walker_email; // Fallback to email if id missing
      const name = b.walker_name || 'Desconhecido';
      if (!id) return;
      
      if (!walkerCounts[id]) {
        walkerCounts[id] = { name, count: 0, id };
      }
      walkerCounts[id].count += 1;
    });

    // Transforma em array, ordena e pega top 5
    return Object.values(walkerCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [bookings]);

  // Map Data (Existing functionality maintained as useful context)
  const mapMarkers = useMemo(() => {
    const markers = [];
    walkers.filter(w => w.latitude && w.longitude).slice(0, 20).forEach(w => {
        markers.push({
            id: w.id,
            position: [w.latitude, w.longitude],
            title: w.walker_name,
            type: 'walker',
            image: w.photo_url
        });
    });
    return markers;
  }, [walkers]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Desempenho da plataforma</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950 md:text-3xl">Análise</h2>
        <p className="mt-1 text-sm text-slate-600">Métricas, tendências e cobertura num único painel.</p>
      </div>

      {/* 1. KPIs Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-3xl border border-slate-200 border-t-4 border-t-emerald-500 bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Walkers Ativos</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{kpis.activeWalkersCount}</h3>
              <p className="text-xs text-green-600 mt-1">Profissionais disponíveis</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200 border-t-4 border-t-blue-500 bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Reservas (30 dias)</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{kpis.bookingsLastMonth}</h3>
              <p className="text-xs text-blue-600 mt-1">Demanda recente</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200 border-t-4 border-t-purple-500 bg-white shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Taxa de Conclusão</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{kpis.completionRate}%</h3>
              <p className="text-xs text-purple-600 mt-1">Serviços finalizados com sucesso</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Gráfico de Desempenho */}
        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Tendência de Novas Reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingsTrendData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="Reservas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBookings)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. Top Walkers Widget */}
        <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top 5 Walkers (90d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topWalkers.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Sem dados suficientes recentes.</p>
            ) : (
              <div className="space-y-4">
                {topWalkers.map((walker, idx) => (
                  <div key={walker.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' : 
                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        #{idx + 1}
                      </div>
                      <span className="font-semibold text-gray-800 truncate max-w-[120px]">{walker.name}</span>
                    </div>
                    <Badge variant="secondary" className="bg-white">
                      {walker.count} serviços
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map (Optional context) */}
      <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Mapa de Cobertura</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px] overflow-hidden p-0 md:h-[320px]">
            <MapContainer 
              center={[38.7223, -9.1393]} 
              zoom={6} 
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapMarkers.map(marker => (
                <Marker key={marker.id} position={marker.position}>
                  <Popup>
                      <div className="font-semibold">{marker.title}</div>
                      <Badge className="mt-1">Walker</Badge>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
        </CardContent>
      </Card>
    </div>
  );
}