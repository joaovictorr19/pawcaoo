import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ClientTabBar } from "@/components/client/ClientTabBar";
import { Button } from "@/components/ui/button";
import WalkReport from "@/components/client/WalkReport";
import PendingHotelBookings from "@/components/client/PendingHotelBookings";
import MyDogsManager from "@/components/profile/MyDogsManager";
import ClientDataSettings from "@/components/client/ClientDataSettings";
import ClientNotificationsWidget from "@/components/client/ClientNotificationsWidget";
import { WalkSecurityPass } from "@/components/booking/WalkSecurityPass";
import ClientFinalizeWalk from "@/components/client/ClientFinalizeWalk";
import BackButton from "@/components/ui/BackButton";
import {
  History, MapPin, Star, Shield, Award, ChevronRight,
  CalendarDays, PawPrint, Clock, CheckCircle2, XCircle, AlertCircle, User, Bell
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const statusConfig = {
  pending:          { label: "Pendente",    color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Clock },
  confirmed:        { label: "Confirmada",  color: "text-blue-400",   bg: "bg-blue-500/10",   icon: CheckCircle2 },
  in_progress:      { label: "Em progresso",color: "text-green-400",  bg: "bg-green-500/10",  icon: AlertCircle },
  service_completed:{ label: "Concluída",   color: "text-green-400",  bg: "bg-green-500/10",  icon: CheckCircle2 },
  completed:        { label: "Concluída",   color: "text-slate-400",  bg: "bg-slate-500/10",  icon: CheckCircle2 },
  cancelled:        { label: "Cancelada",   color: "text-red-400",    bg: "bg-red-500/10",    icon: XCircle },
  rejected:         { label: "Rejeitada",   color: "text-red-400",    bg: "bg-red-500/10",    icon: XCircle },
};

function BookingCard({ booking, onClick }) {
  const cfg = statusConfig[booking.status] || statusConfig.pending;
  const Icon = cfg.icon;
  const dateStr = booking.walk_date || booking.session_date;
  return (
    <Card
      className="bg-slate-900 border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer"
      onClick={() => onClick(booking)}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🐕</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{booking.dog_name || booking.dogs?.map(d => d.dog_name).join(', ') || 'Cão'}</p>
          <p className="text-xs text-slate-400 truncate">
            {booking.walker_name || booking.trainer_name || '—'} · {dateStr ? format(new Date(dateStr + 'T12:00:00'), "dd MMM yyyy", { locale: ptBR }) : '—'}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} flex-shrink-0`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingsFilter, setBookingsFilter] = useState('active');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser()
  });

  const { data: allBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['clientAllBookings', user?.email],
    queryFn: async () => {
      const [walks, trainings] = await Promise.all([
        base44.entities.Booking.filter({ owner_email: user.email }, '-walk_date', 50),
        base44.entities.TrainingBooking
          ? base44.entities.TrainingBooking.filter({ owner_email: user.email }, '-session_date', 50).catch(() => [])
          : Promise.resolve([])
      ]);
      return [...walks, ...trainings].sort((a, b) => {
        const da = a.walk_date || a.session_date || '';
        const db = b.walk_date || b.session_date || '';
        return db.localeCompare(da);
      });
    },
    enabled: !!user?.email,
  });

  const { data: checkpoints = [] } = useQuery({
    queryKey: ['bookingCheckpoints', selectedBooking?.id],
    queryFn: () => base44.entities.WalkCheckpoint.filter({ booking_id: selectedBooking.id }, 'timestamp'),
    enabled: !!selectedBooking?.id,
  });

  const { data: myDogs = [] } = useQuery({
    queryKey: ['clientDogs', user?.email],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['clientUnreadNotifs', user?.email],
    queryFn: () => base44.entities.Notification.filter(
      { recipient_email: user.email, is_read: false },
      '-created_date', 50
    ),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const stats = useMemo(() => {
    const completed = allBookings.filter(b => b.status === 'completed');
    const totalDistance = completed.reduce((sum, b) => sum + (b.distance_km || 0), 0);
    return {
      totalWalks: completed.length,
      totalDistance: totalDistance.toFixed(1),
      avgRating: completed.length ? (completed.reduce((sum, b) => sum + (b.walker_rating || 0), 0) / completed.length).toFixed(1) : '—',
      activeWalk: allBookings.find(b => b.status === 'in_progress'),
      nextWalk: allBookings.find(b => b.status === 'confirmed'),
    };
  }, [allBookings]);

  const filteredBookings = useMemo(() => {
    if (bookingsFilter === 'active') return allBookings.filter(b => ['pending','confirmed','in_progress','service_completed'].includes(b.status));
    if (bookingsFilter === 'completed') return allBookings.filter(b => b.status === 'completed');
    if (bookingsFilter === 'cancelled') return allBookings.filter(b => ['cancelled','rejected'].includes(b.status));
    return allBookings;
  }, [allBookings, bookingsFilter]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Header */}
      <header className="px-4 pt-6 md:pt-20 pb-5">
        <div className="flex items-center gap-3">
          <BackButton className="bg-slate-800/80 border-white/10 text-slate-300 hover:bg-slate-700 hover:text-white" />
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center flex-shrink-0">
            {user?.profile_photo_url
              ? <img src={user.profile_photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              : <User className="w-6 h-6 text-white" />
            }
          </div>
          <div>
            <h1 className="text-lg font-black">Olá, {user?.full_name?.split(' ')[0] || 'Amigo'}! 🐾</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Painel do Cliente</p>
          </div>
        </div>
      </header>

      <ClientTabBar active={activeTab} onChange={setActiveTab} unreadCount={unreadNotifications.length} />

      <main className="px-4 pb-6 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">

          {/* ─── OVERVIEW ─── */}
          {activeTab === 'overview' && (
            <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Reservas de hotel com pagamento pendente */}
              <PendingHotelBookings user={user} />

              {/* Notificações */}
              <ClientNotificationsWidget user={user} onSeeAll={() => navigate(createPageUrl('Notifications'))} />

              {/* Passeio ativo — finalização via QR */}
              {stats.activeWalk && (
                <ClientFinalizeWalk booking={stats.activeWalk} />
              )}

              {/* Próxima reserva */}
              {stats.nextWalk && (
                <Card className="bg-slate-900 border border-blue-500/30">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-blue-400 mb-2">📅 Próxima Reserva</p>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">{stats.nextWalk.dog_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {stats.nextWalk.walk_date ? format(new Date(stats.nextWalk.walk_date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR }) : '—'} · {stats.nextWalk.walker_name}
                        </p>
                      </div>
                      <Shield className="w-8 h-8 text-blue-400 flex-shrink-0" />
                    </div>
                    <div className="mt-3">
                      <WalkSecurityPass booking={stats.nextWalk} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Passeios", value: stats.totalWalks, icon: History, color: "text-orange-500" },
                  { label: "Distância", value: `${stats.totalDistance} km`, icon: MapPin, color: "text-green-500" },
                  { label: "Avaliação", value: stats.avgRating, icon: Star, color: "text-yellow-500" },
                ].map(s => (
                  <Card key={s.label} className="bg-slate-900 border border-white/5">
                    <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                      <p className="text-lg font-black text-white leading-none">{s.value}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Preview dos meus animais */}
              {myDogs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Meus Animais</p>
                    <button onClick={() => setActiveTab('dogs')} className="text-xs text-orange-400 font-bold">Ver todos</button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                    {myDogs.slice(0, 6).map(dog => (
                      <button
                        key={dog.id}
                        onClick={() => navigate(createPageUrl(`AnimalProfile?id=${dog.id}`))}
                        className="flex-shrink-0 flex flex-col items-center gap-1 w-16"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center">
                          {dog.photo_url
                            ? <img src={dog.photo_url} className="w-full h-full object-cover" alt={dog.dog_name} />
                            : <span className="text-2xl">🐾</span>}
                        </div>
                        <p className="text-[10px] font-bold text-white truncate w-full text-center">{dog.dog_name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Atalhos rápidos */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveTab('bookings')} className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-orange-500/30 transition-all">
                  <CalendarDays className="w-6 h-6 text-orange-400" />
                  <p className="text-sm font-bold text-white">Minhas Reservas</p>
                  <p className="text-xs text-slate-500">{allBookings.filter(b => ['pending','confirmed','in_progress'].includes(b.status)).length} ativas</p>
                </button>
                <button onClick={() => setActiveTab('dogs')} className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-orange-500/30 transition-all">
                  <PawPrint className="w-6 h-6 text-pink-400" />
                  <p className="text-sm font-bold text-white">Meus Animais</p>
                  <p className="text-xs text-slate-500">{myDogs.length} {myDogs.length === 1 ? 'registado' : 'registados'}</p>
                </button>
                <button onClick={() => navigate(createPageUrl('Home'))} className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-orange-500/30 transition-all">
                  <Award className="w-6 h-6 text-blue-400" />
                  <p className="text-sm font-bold text-white">Encontrar Profissional</p>
                  <p className="text-xs text-slate-500">Passeadores e treinadores</p>
                </button>
                <button onClick={() => setActiveTab('client_data')} className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-orange-500/30 transition-all">
                  <User className="w-6 h-6 text-slate-400" />
                  <p className="text-sm font-bold text-white">Meu Perfil</p>
                  <p className="text-xs text-slate-500">Editar dados pessoais</p>
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── RESERVAS ─── */}
          {activeTab === 'bookings' && (
            <motion.div key="bk" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { key: 'active', label: 'Ativas' },
                  { key: 'completed', label: 'Concluídas' },
                  { key: 'cancelled', label: 'Canceladas' },
                  { key: 'all', label: 'Todas' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setBookingsFilter(f.key)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${bookingsFilter === f.key ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {bookingsLoading ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : filteredBookings.length === 0 ? (
                <Card className="bg-slate-900 border border-white/5">
                  <CardContent className="p-10 text-center">
                    <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">Nenhuma reserva</p>
                    <p className="text-slate-400 text-sm mb-4">Ainda não tens reservas nesta categoria</p>
                    <Button size="sm" onClick={() => navigate(createPageUrl('Home'))}>Encontrar Profissional</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map(b => (
                    <BookingCard key={b.id} booking={b} onClick={setSelectedBooking} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── ANIMAIS ─── */}
          {activeTab === 'dogs' && (
            <motion.div key="dogs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <MyDogsManager userEmail={user?.email} />
            </motion.div>
          )}

          {/* ─── NOTIFICAÇÕES ─── */}
          {activeTab === 'notifications' && (
            <motion.div key="ntf" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ClientNotificationsWidget user={user} onSeeAll={() => navigate(createPageUrl('Notifications'))} />
            </motion.div>
          )}

          {/* ─── PERFIL ─── */}
          {activeTab === 'client_data' && (
            <motion.div key="cd" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ClientDataSettings user={user} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Modal de relatório */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl" onClick={e => e.stopPropagation()}>
            <WalkReport booking={selectedBooking} checkpoints={checkpoints} />
            <Button onClick={() => setSelectedBooking(null)} className="w-full mt-3 bg-slate-800 hover:bg-slate-700 rounded-2xl">
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}