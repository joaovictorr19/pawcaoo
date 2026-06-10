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

const COLORS = ['#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'];

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
    <div className="space-y-6">
      {/* 1. KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-slate-300 shadow-sm bg-white border border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Walkers Ativos</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{kpis.activeWalkersCount}</h3>
              <p className="text-xs text-slate-600 mt-1">Profissionais disponíveis</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-300 shadow-sm bg-white border border-slate-200">
           <CardContent className="p-6 flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-slate-600">Reservas (30 dias)</p>
               <h3 className="text-3xl font-bold text-slate-900 mt-1">{kpis.bookingsLastMonth}</h3>
               <p className="text-xs text-slate-600 mt-1">Demanda recente</p>
             </div>
             <div className="bg-slate-100 p-3 rounded-full">
               <Calendar className="w-6 h-6 text-slate-600" />
             </div>
           </CardContent>
         </Card>

        <Card className="border-l-4 border-l-slate-300 shadow-sm bg-white border border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Taxa de Conclusão</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{kpis.completionRate}%</h3>
              <p className="text-xs text-slate-600 mt-1">Serviços finalizados com sucesso</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Gráfico de Desempenho */}
        <Card className="lg:col-span-2 shadow-sm border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              Tendência de Novas Reservas
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingsTrendData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="Reservas" stroke="#64748b" fillOpacity={1} fill="url(#colorBookings)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. Top Walkers Widget */}
        <Card className="lg:col-span-1 shadow-sm border border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-slate-600" />
              Top 5 Walkers (90d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topWalkers.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Sem dados suficientes recentes.</p>
            ) : (
              <div className="space-y-4">
                {topWalkers.map((walker, idx) => (
                  <div key={walker.id || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                        idx === 0 ? 'bg-slate-200 text-slate-700' : 
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-slate-200 text-slate-700' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        #{idx + 1}
                      </div>
                      <span className="font-semibold text-slate-800 truncate max-w-[120px]">{walker.name}</span>
                    </div>
                    <Badge variant="secondary" className="bg-white border border-slate-200">
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
      <Card className="shadow-sm border border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>Mapa de Cobertura</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] p-0 overflow-hidden rounded-b-xl">
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