import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ClientTabBar } from "@/components/client/ClientTabBar";
import { Button } from "@/components/ui/button";
import WalkReport from "@/components/client/WalkReport";
import MyDogsManager from "@/components/profile/MyDogsManager";
import ClientDataSettings from "@/components/client/ClientDataSettings";
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

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
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
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500/30" style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 0px))', WebkitOverflowScrolling: 'touch', overflowY: 'auto' }}>
      <header className="bg-slate-950 px-4 pt-6 md:pt-20 pb-6 rounded-b-[2.5rem] shadow-xl mb-6">
        <h1 className="text-xl font-black italic">Olá, {user?.full_name?.split(' ')[0] || 'Amigo'}! 🐾</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Painel do Cliente</p>
      </header>

      <main className="px-4 md:px-6 pb-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
              {/* Active Walk Alert */}
              {stats.activeWalk && (
                <Card className="mb-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold mb-1 text-white/80">🔴 Passeio Ativo</p>
                        <h3 className="text-xl font-bold">{stats.activeWalk.dog_name} está a passear!</h3>
                        <p className="text-sm text-white/90 mt-1">Com {stats.activeWalk.walker_name}</p>
                      </div>
                      <Button onClick={() => navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${stats.activeWalk.id}`))} className="bg-white text-green-600 hover:bg-white/90 font-bold">Ver ao Vivo →</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next Walk & Security Pass */}
              {stats.nextWalk && (
                <Card className="border border-blue-500/30 bg-slate-900 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold text-blue-400 mb-1">📅 Próximo Passeio</p>
                        <h3 className="text-xl font-bold text-white">{stats.nextWalk.dog_name}</h3>
                        <p className="text-sm text-slate-300 mt-1">{format(new Date(stats.nextWalk.walk_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                        <p className="text-sm text-slate-400 mt-1">Passeador: {stats.nextWalk.walker_name}</p>
                      </div>
                      <Shield className="w-12 h-12 text-blue-400" />
                    </div>
                    <WalkSecurityPass booking={stats.nextWalk} />
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900 border border-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-1">Total de Passeios</p>
                        <p className="text-3xl font-bold text-white">{stats.totalWalks}</p>
                      </div>
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                        <History className="w-6 h-6 text-orange-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border border-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-1">Distância Total</p>
                        <p className="text-3xl font-bold text-white">{stats.totalDistance}</p>
                        <p className="text-[10px] text-slate-400 mt-1">km percorridos</p>
                      </div>
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border border-white/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400 font-medium mb-1">Avaliação Média</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-3xl font-bold text-white">{stats.avgRating}</p>
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-yellow-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="space-y-4">
                {bookings.filter(b => b.status === 'completed').length === 0 ? (
                  <Card className="p-12 text-center bg-slate-900 border border-white/5">
                    <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum passeio ainda</h3>
                    <p className="text-slate-400 mb-6">Reserve o primeiro passeio para começar!</p>
                    <Button onClick={() => navigate(createPageUrl('Home'))}>Encontrar Passeador</Button>
                  </Card>
                ) : (
                  bookings
                    .filter(b => b.status === 'completed')
                    .map((booking) => (
                      <Card key={booking.id} className="cursor-pointer hover:shadow-xl transition-all bg-slate-900 border border-white/5 hover:border-orange-500/40" onClick={() => setSelectedBooking(booking)}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <span className="text-3xl">🐕</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-white">{booking.dog_name}</h3>
                                <p className="text-sm text-slate-400">{format(new Date(booking.walk_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                                <p className="text-sm text-slate-500 mt-1">Passeador: {booking.walker_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 text-green-400 font-bold mb-2">
                                <MapPin className="w-4 h-4" />
                                {booking.distance_km?.toFixed(2)} km
                              </div>
                              <ChevronRight className="w-6 h-6 text-slate-500" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'dogs' && (
            <motion.div key="dogs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <MyDogsManager userEmail={user?.email} />
            </motion.div>
          )}

          {activeTab === 'client_data' && (
            <motion.div key="client_data" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <ClientDataSettings user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ClientTabBar active={activeTab} onChange={setActiveTab} />

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
            <Button onClick={() => setSelectedBooking(null)} className="w-full mt-4 bg-gray-900 hover:bg-gray-800">
              Fechar Relatório
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}