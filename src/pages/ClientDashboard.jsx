import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import WalkReport from "@/components/client/WalkReport";
import { WalkSecurityPass } from "@/components/booking/WalkSecurityPass";
import { 
  History, 
  TrendingUp, 
  Calendar, 
  Heart,
  MapPin,
  Clock,
  Star,
  Shield,
  Award,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR, pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Fetch current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      let u = await base44.auth.me();
      try {
        const imp = JSON.parse(localStorage.getItem('impersonation') || 'null');
        if (imp?.targetUserId && u?.role === 'admin') {
           const t = await base44.entities.User.filter({ id: imp.targetUserId });
           if (t.length > 0) u = { ...t[0], isImpersonating: true };
        }
      } catch(e) {}
      return u;
    }
  });

  // Fetch all bookings for this client
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['clientBookings', user?.email],
    queryFn: async () => {
      const allBookings = await base44.entities.Booking.filter(
        { created_by: user.email },
        '-walk_date'
      );
      return allBookings;
    },
    enabled: !!user?.email,
  });

  // Fetch checkpoints for selected booking
  const { data: checkpoints = [] } = useQuery({
    queryKey: ['bookingCheckpoints', selectedBooking?.id],
    queryFn: async () => {
      const points = await base44.entities.WalkCheckpoint.filter(
        { booking_id: selectedBooking.id },
        'timestamp'
      );
      return points;
    },
    enabled: !!selectedBooking?.id,
  });

  // Calculate stats
  const stats = React.useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    const totalDistance = completed.reduce((sum, b) => sum + (b.distance_km || 0), 0);
    const totalWalks = completed.length;
    const avgRating = completed.reduce((sum, b) => sum + (b.walker_rating || 0), 0) / (totalWalks || 1);
    
    return {
      totalWalks,
      totalDistance: totalDistance.toFixed(1),
      avgRating: avgRating.toFixed(1),
      nextWalk: bookings.find(b => b.status === 'confirmed'),
      activeWalk: bookings.find(b => b.status === 'in_progress'),
    };
  }, [bookings]);

  if (userLoading || bookingsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">A carregar painel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            👋 Olá, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600">Acompanhe os passeios do seu melhor amigo</p>
        </div>

        {/* Active Walk Alert */}
        {stats.activeWalk && (
          <Card className="mb-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold mb-1 text-white/80">🔴 Passeio Ativo</p>
                  <h3 className="text-xl font-bold">{stats.activeWalk.dog_name} está a passear!</h3>
                  <p className="text-sm text-white/90 mt-1">
                    Com {stats.activeWalk.walker_name}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${stats.activeWalk.id}`))}
                  className="bg-white text-green-600 hover:bg-white/90 font-bold"
                >
                  Ver ao Vivo →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Walk & Security Pass */}
        {stats.nextWalk && (
          <Card className="mb-6 border-2 border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600 mb-1">📅 Próximo Passeio</p>
                  <h3 className="text-xl font-bold text-gray-900">{stats.nextWalk.dog_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(stats.nextWalk.walk_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Passeador: {stats.nextWalk.walker_name}
                  </p>
                </div>
                <Shield className="w-12 h-12 text-blue-600" />
              </div>
              <WalkSecurityPass booking={stats.nextWalk} />
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Total de Passeios</p>
                  <p className="text-4xl font-bold text-blue-900">{stats.totalWalks}</p>
                </div>
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <History className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium mb-1">Distância Total</p>
                  <p className="text-4xl font-bold text-green-900">{stats.totalDistance}</p>
                  <p className="text-xs text-green-700 mt-1">km percorridos</p>
                </div>
                <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 font-medium mb-1">Avaliação Média</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-yellow-900">{stats.avgRating}</p>
                    <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                  </div>
                </div>
                <div className="w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: History & Reports */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <MapPin className="w-4 h-4" />
              Trajetos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <div className="space-y-4">
              {bookings.filter(b => b.status === 'completed').length === 0 ? (
                <Card className="p-12 text-center">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum passeio ainda</h3>
                  <p className="text-gray-600 mb-6">Reserve o primeiro passeio para começar!</p>
                  <Button onClick={() => navigate(createPageUrl('Home'))}>
                    Encontrar Passeador
                  </Button>
                </Card>
              ) : (
                bookings
                  .filter(b => b.status === 'completed')
                  .map((booking) => (
                    <Card 
                      key={booking.id} 
                      className="cursor-pointer hover:shadow-xl transition-all border-2 hover:border-green-500"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <span className="text-3xl">🐕</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{booking.dog_name}</h3>
                              <p className="text-sm text-gray-600">
                                {format(new Date(booking.walk_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Passeador: {booking.walker_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-green-600 font-bold mb-2">
                              <MapPin className="w-4 h-4" />
                              {booking.distance_km?.toFixed(2)} km
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="map">
            <Card className="overflow-hidden shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  Mapa de Aventuras do {selectedBooking?.dog_name || 'seu Pet'}
                </CardTitle>
                <p className="text-sm text-white/80">
                  Todos os trajetos GPS e eventos registados nos passeios
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[600px]">
                  <MapContainer
                    center={selectedBooking?.route_coordinates?.[0]
                      ? [selectedBooking.route_coordinates[0].lat, selectedBooking.route_coordinates[0].lng]
                      : [41.1579, -8.6291]}
                    zoom={selectedBooking ? 14 : 12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {(selectedBooking
                      ? [selectedBooking]
                      : bookings.filter(b => b.route_coordinates && b.route_coordinates.length > 1)
                    ).map((booking, idx) => (
                      <React.Fragment key={booking.id}>
                        {booking.route_coordinates?.length > 1 && (
                          <Polyline
                            positions={booking.route_coordinates.map(c => [c.lat, c.lng])}
                            color={selectedBooking ? '#16a34a' : `hsl(${idx * 40}, 70%, 50%)`}
                            weight={selectedBooking ? 5 : 3}
                          />
                        )}
                        {booking.route_coordinates?.length > 0 && (
                          <Marker position={[booking.route_coordinates[0].lat, booking.route_coordinates[0].lng]}>
                            <Popup>🟢 Início do passeio</Popup>
                          </Marker>
                        )}
                        {booking.route_coordinates?.length > 1 && (
                          <Marker position={[booking.route_coordinates[booking.route_coordinates.length-1].lat, booking.route_coordinates[booking.route_coordinates.length-1].lng]}>
                            <Popup>🔴 Fim — {booking.distance_km?.toFixed(2)} km</Popup>
                          </Marker>
                        )}
                      </React.Fragment>
                    ))}
                  </MapContainer>
                </div>
                
                {/* Walk selector if multiple walks exist */}
                {bookings.filter(b => b.status === 'completed').length > 1 && (
                  <div className="p-4 border-t bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-3">Selecionar Passeio:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      <Button
                        variant={!selectedBooking ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedBooking(null)}
                      >
                        Todos
                      </Button>
                      {bookings
                        .filter(b => b.status === 'completed' && b.route_coordinates?.length > 0)
                        .map((booking) => (
                          <Button
                            key={booking.id}
                            variant={selectedBooking?.id === booking.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedBooking(booking)}
                            className="whitespace-nowrap"
                          >
                            {booking.dog_name} - {format(new Date(booking.walk_date), "dd/MM", { locale: pt })}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Modal */}
      {selectedBooking && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div 
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <WalkReport booking={selectedBooking} checkpoints={checkpoints} />
            <Button 
              onClick={() => setSelectedBooking(null)}
              className="w-full mt-4 bg-gray-900 hover:bg-gray-800"
            >
              Fechar Relatório
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}