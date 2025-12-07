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
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  bookings = [], 
  payments = [], 
  services = [], 
  adoptionListings = [] 
}) {

  // 1. User Growth Over Time
  const userGrowthData = useMemo(() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return last6Months.map(date => {
      const monthStr = format(date, 'MMM', { locale: ptBR });
      const endOfThisMonth = endOfMonth(date);

      // Cumulative counts up to end of this month
      const owners = users.filter(u => u.account_type === 'owner' && new Date(u.created_date || new Date()) <= endOfThisMonth).length;
      const professionals = users.filter(u => ['walker', 'trainer', 'both'].includes(u.account_type) && new Date(u.created_date || new Date()) <= endOfThisMonth).length;
      const companies = users.filter(u => u.account_type === 'company' && new Date(u.created_date || new Date()) <= endOfThisMonth).length;

      return {
        name: monthStr,
        Clientes: owners,
        Profissionais: professionals,
        Empresas: companies
      };
    });
  }, [users]);

  // 2. Revenue by Service Category
  const revenueData = useMemo(() => {
    let walks = 0;
    let training = 0;
    let servicesRevenue = 0;

    // We infer type from bookings or payment metadata if available
    // Assuming bookings link to payments via ID or we can guess from payment descriptions/amounts
    // For simplicity, let's use the bookings data since it has 'type' and 'total_amount'
    
    // Summing from bookings (more accurate for category)
    bookings.forEach(b => {
      const amount = b.total_amount || 0;
      if (b.type === 'walk' || b.walker_id) walks += amount;
      else if (b.type === 'training' || b.trainer_id) training += amount;
    });

    // We don't have direct partner service bookings in 'bookings' prop usually, 
    // unless they are ServiceBooking entity. 
    // Let's assume 'services' prop has some usage stats or we skip if no data.
    // Placeholder for partner services if we had transaction data
    
    return [
      { name: 'Passeios', value: walks },
      { name: 'Treinos', value: training },
      { name: 'Serviços Parceiros', value: servicesRevenue } // Would need ServiceBooking data
    ].filter(d => d.value > 0);
  }, [bookings]);

  // 3. Adoption Trends
  const adoptionData = useMemo(() => {
    const available = adoptionListings.filter(a => a.status === 'available').length;
    const adopted = adoptionListings.filter(a => a.status === 'adopted').length;
    const pending = adoptionListings.filter(a => a.status === 'pending').length;

    return [
      { name: 'Disponíveis', value: available },
      { name: 'Adotados', value: adopted },
      { name: 'Em Processo', value: pending }
    ];
  }, [adoptionListings]);

  // 4. Active Users (Last 30 days)
  const activeMetrics = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUserIds = new Set();
    bookings.forEach(b => {
      if (new Date(b.created_date) >= thirtyDaysAgo) {
        if (b.created_by) activeUserIds.add(b.created_by);
        if (b.walker_id) activeUserIds.add(b.walker_id);
        if (b.trainer_id) activeUserIds.add(b.trainer_id);
      }
    });

    const activeCompanies = users.filter(u => u.account_type === 'company' && u.is_active).length;

    return {
      activeUsers: activeUserIds.size,
      activeCompanies,
      totalUsers: users.length,
      activePercentage: users.length > 0 ? ((activeUserIds.size / users.length) * 100).toFixed(1) : 0
    };
  }, [bookings, users]);

  // 5. Booking Stats & Conversion
  const bookingStats = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const conversionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    return { total, completed, cancelled, conversionRate };
  }, [bookings]);

  // 6. Popular Services
  const popularServices = useMemo(() => {
    const counts = { 'Passeios': 0, 'Treinos': 0, 'Sitting': 0 };
    bookings.forEach(b => {
       if (b.type === 'walk' || b.walker_id) counts['Passeios']++;
       else if (b.type === 'training' || b.trainer_id) counts['Treinos']++;
       else counts['Sitting']++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [bookings]);

  // 7. Map Data (Mocking coordinates for demo if missing)
  const mapMarkers = useMemo(() => {
    const markers = [];
    users.filter(u => ['walker', 'trainer'].includes(u.account_type)).slice(0, 20).forEach(u => {
        const lat = u.latitude || 38.7223 + (Math.random() - 0.5) * 0.1;
        const lng = u.longitude || -9.1393 + (Math.random() - 0.5) * 0.1;
        markers.push({
            id: u.id,
            position: [lat, lng],
            title: u.full_name,
            type: u.account_type,
            image: u.profile_photo_url
        });
    });
    return markers;
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 font-medium">Total de Usuários</p>
            <h3 className="text-2xl font-bold text-gray-900">{activeMetrics.totalUsers}</h3>
            <p className="text-xs text-blue-600 mt-1">+{userGrowthData[userGrowthData.length-1]?.Clientes - userGrowthData[0]?.Clientes} nos últimos 6 meses</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 font-medium">Usuários Ativos (30d)</p>
            <h3 className="text-2xl font-bold text-gray-900">{activeMetrics.activeUsers}</h3>
            <p className="text-xs text-green-600 mt-1">{activeMetrics.activePercentage}% da base</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 font-medium">Taxa de Conversão</p>
            <h3 className="text-2xl font-bold text-gray-900">{bookingStats.conversionRate}%</h3>
            <p className="text-xs text-purple-600 mt-1">{bookingStats.completed} reservas completas</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 font-medium">Empresas Ativas</p>
            <h3 className="text-2xl font-bold text-gray-900">{activeMetrics.activeCompanies}</h3>
            <p className="text-xs text-orange-600 mt-1">Parceiros verificados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Crescimento de Usuários</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="Clientes" stroke="#8884d8" fillOpacity={1} fill="url(#colorClients)" />
                <Area type="monotone" dataKey="Profissionais" stroke="#82ca9d" fillOpacity={1} fill="url(#colorPros)" />
                <Area type="monotone" dataKey="Empresas" stroke="#ffc658" fillOpacity={1} fill="#ffc658" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Services */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Serviços Mais Populares</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularServices} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                  {popularServices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Distribution */}
        <Card className="lg:col-span-1 shadow-lg border-0">
          <CardHeader>
            <CardTitle>Receita por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

         {/* Adoption Stats */}
         <Card className="lg:col-span-1 shadow-lg border-0">
          <CardHeader>
            <CardTitle>Status de Adoções</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adoptionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#FF8042" radius={[4, 4, 0, 0]}>
                  {adoptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 1 ? '#00C49F' : '#FF8042'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-1 shadow-lg border-0">
          <CardHeader>
            <CardTitle>Mapa de Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-0 overflow-hidden rounded-b-xl">
             <MapContainer 
                center={[38.7223, -9.1393]} 
                zoom={10} 
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
                       <Badge className="mt-1">{marker.type}</Badge>
                    </Popup>
                  </Marker>
                ))}
             </MapContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}