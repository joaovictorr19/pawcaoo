import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LogOut, Calendar, DollarSign, Clock, User, MapPin, Phone,
  CheckCircle2, Plus, ListChecks, ClipboardList,
  Dog, Star, LayoutGrid, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import PartnerTaskCard from '@/components/hotel/PartnerTaskCard';
import AssignTaskModal from '@/components/hotel/AssignTaskModal';
import HotelReservationsPanel from '@/components/hotel/HotelReservationsPanel';
import HotelTasksPanel from '@/components/hotel/HotelTasksPanel';
import BackButton from '@/components/ui/BackButton';
import { getCurrentUser } from '@/utils/getCurrentUser';

const SERVICE_LABELS = {
  walk: 'Passeio', bathing: 'Banho', grooming: 'Grooming',
  training: 'Treino', nail_trim: 'Corte Unhas',
  feeding: 'Alimentação', medication: 'Medicação',
  playtime: 'Brincadeira', general_care: 'Cuidados Gerais',
  boarding: 'Alojamento', daycare: 'Creche',
};

const STATUS_LABELS = {
  pending: 'Pendente', confirmed: 'Confirmada', checked_in: 'No hotel',
  in_progress: 'Em curso', checked_out: 'Saída', completed: 'Concluída',
  cancelled: 'Cancelada', rejected: 'Rejeitada',
};

const STATUS_COLORS = {
  pending: 'bg-orange-50 text-orange-600 border-orange-200',
  confirmed: 'bg-blue-50 text-blue-600 border-blue-200',
  checked_in: 'bg-green-50 text-green-600 border-green-200',
  in_progress: 'bg-purple-50 text-purple-600 border-purple-200',
  checked_out: 'bg-slate-50 text-slate-500 border-slate-200',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  cancelled: 'bg-red-50 text-red-500 border-red-200',
  rejected: 'bg-red-50 text-red-500 border-red-200',
};

export default function PartnerHotelPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('today');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: authUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => await getCurrentUser(),
  });

  const { data: hotel, isLoading } = useQuery({
    queryKey: ['partnerHotel', authUser?.email],
    queryFn: async () => {
      if (!authUser?.email) return null;
      try {
        const myProfiles = await base44.entities.WalkerProfile.filter({ created_by: authUser.email });
        if (myProfiles.length > 0) {
          const partnerships = myProfiles[0].hotel_partnerships || [];
          if (partnerships.length > 0) {
            const p = partnerships[0];
            try {
              const hp = await base44.entities.WalkerProfile.get(p.hotel_profile_id);
              if (hp) {
                // Always use the hotel's partner_walkers as the authoritative role source
                // to prevent redirect loops caused by stale/inconsistent roles
                const hotelPartners = hp.hotel_details?.partner_walkers || [];
                const authoritative = hotelPartners.find(pw =>
                  pw.walker_email?.toLowerCase() === authUser.email.toLowerCase()
                );
                return { ...hp, partnerRole: authoritative?.partner_role || p.partner_role };
              }
            } catch {}
          }
        }
        const hotels = await base44.entities.WalkerProfile.filter({ professional_type: 'hotel' }, undefined, 100);
        for (const h of hotels) {
          const partners = h.hotel_details?.partner_walkers || [];
          const isPartner = partners.find(p => p.walker_email?.toLowerCase() === authUser.email.toLowerCase());
          if (isPartner) return { ...h, partnerRole: isPartner.partner_role };
        }
        return null;
      } catch { return null; }
    },
    enabled: !!authUser?.email,
  });

  // Redirect full-access partners to the HotelDashboard — apenas quando este
  // painel está visível (o TabKeepAlive mantém-no montado em background e um
  // redirect incondicional arrancava o utilizador de outras páginas)
  useEffect(() => {
    if (hotel?.partnerRole === 'full' && location.pathname === createPageUrl('PartnerHotelPanel')) {
      navigate(createPageUrl('HotelDashboard'));
    }
  }, [hotel?.partnerRole, location.pathname, navigate]);

  const isFullRole = hotel?.partnerRole === 'full';
  const isLimitedRole = hotel?.partnerRole === 'limited';
  const canManage = isFullRole || isLimitedRole;

  const { data: bookings = [] } = useQuery({
    queryKey: ['partnerBookings', hotel?.id, authUser?.email],
    queryFn: async () => {
      if (!hotel?.id || !authUser?.email) return [];
      try {
        const all = await base44.entities.HotelBooking.filter({ hotel_profile_id: hotel.id }, '-checkin_date', 100);
        if (hotel.partnerRole === 'simple') {
          return (all || []).filter(b =>
            b.assigned_walker_email?.toLowerCase() === authUser.email.toLowerCase() ||
            (b.add_ons || []).some(a => a.assigned_walker_email?.toLowerCase() === authUser.email.toLowerCase())
          );
        }
        return all || [];
      } catch { return []; }
    },
    enabled: !!hotel?.id && !!authUser?.email,
  });

  const myTasks = useMemo(() => {
    if (!authUser?.email) return [];
    return bookings.flatMap(b => {
      return (b.add_ons || [])
        .map((a, idx) => ({
          ...a,
          bookingId: b.id,
          addOnIndex: idx,
          dogNames: (b.dogs || []).map(d => d.dog_name).join(', ') || '—',
          ownerName: b.owner_name,
          ownerPhone: b.owner_phone,
          checkinDate: b.checkin_date,
          checkoutDate: b.checkout_date,
          bookingStatus: b.status,
        }))
        .filter(a => a.assigned_walker_email?.toLowerCase() === authUser.email.toLowerCase());
    });
  }, [bookings, authUser]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = myTasks.filter(t => !t.completed && t.checkinDate <= todayStr && (!t.checkoutDate || t.checkoutDate >= todayStr));
  const upcomingTasks = myTasks.filter(t => !t.completed && t.checkinDate > todayStr);
  const completedTasks = myTasks.filter(t => t.completed);

  const tasksToday = todayTasks.length;
  const tasksCompletedToday = completedTasks.filter(t => {
    if (!t.completed_at) return false;
    const d = new Date(t.completed_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;
  const totalEarnings = myTasks.filter(t => t.completed).reduce((sum, t) => sum + (t.total_price || 0), 0);
  const activeGuests = bookings.filter(b => ['checked_in', 'in_progress'].includes(b.status)).length;

  const partners = hotel?.hotel_details?.partner_walkers || [];
  const canAssign = canManage && partners.length > 0;

  const handleCompleteTask = async (task) => {
    const notes = window.prompt("Notas sobre a tarefa (opcional):", "") || "";
    try {
      const booking = bookings.find(b => b.id === task.bookingId);
      if (!booking) return;
      const newAddOns = [...(booking.add_ons || [])];
      newAddOns[task.addOnIndex] = {
        ...newAddOns[task.addOnIndex],
        completed: true,
        completed_at: new Date().toISOString(),
        task_notes: notes,
      };
      await base44.entities.HotelBooking.update(task.bookingId, { add_ons: newAddOns });
      queryClient.invalidateQueries(['partnerBookings']);
      toast.success("Tarefa concluída");
    } catch (e) {
      toast.error("Erro ao concluir tarefa");
    }
  };

  const handleAssignTask = async ({ bookingId, addOn }) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    const newAddOns = [...(booking.add_ons || []), addOn];
    const newTotal = newAddOns.reduce((sum, a) => sum + (a.total_price || 0), 0);
    await base44.entities.HotelBooking.update(bookingId, { add_ons: newAddOns, add_ons_total: newTotal });
    queryClient.invalidateQueries(['partnerBookings']);
    toast.success("Tarefa atribuída");
  };

  const handleUpdateBooking = async (id, data) => {
    try {
      await base44.entities.HotelBooking.update(id, data);
      queryClient.invalidateQueries(['partnerBookings']);
      toast.success("Reserva atualizada");
    } catch (e) {
      toast.error("Erro ao atualizar reserva");
    }
  };

  if (isLoading || isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">A carregar...</div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-600 mb-4">Não tens acesso a nenhum painel de hotel</p>
            <Button onClick={() => window.location.href = '/'} variant="outline">Voltar à Página Inicial</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabels = { simple: 'Parceiro Simples', limited: 'Acesso Limitado', full: 'Acesso Total' };

  const PARTNER_TABS = [
    { key: 'today', label: 'Hoje', icon: Clock },
    { key: 'upcoming', label: 'Próximas', icon: Calendar },
    { key: 'completed', label: 'Concluídas', icon: CheckCircle2 },
    ...(canManage
      ? [{ key: 'reservations', label: 'Reservas', icon: ClipboardList }]
      : [{ key: 'bookings', label: 'Reservas', icon: ClipboardList }]),
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <BackButton to={createPageUrl('Home')} />
            {hotel.photo_url ? (
              <img src={hotel.photo_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-slate-400" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 truncate">{hotel.walker_name || 'Hotel'}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="border-slate-200 text-slate-600 bg-slate-50 text-[9px] py-0">
                  {roleLabels[hotel.partnerRole] || 'Parceiro'}
                </Badge>
                {canAssign && (
                  <Badge variant="outline" className="border-slate-900 text-slate-900 bg-slate-900 text-white text-[9px] py-0">
                    Pode atribuir
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button onClick={() => base44.auth.logout('/')} variant="outline" size="sm" className="gap-1.5 shrink-0">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard icon={Clock} label="Tarefas Hoje" value={tasksToday} color="text-blue-600" bg="bg-blue-50" />
          <KPICard icon={CheckCircle2} label="Concluídas Hoje" value={tasksCompletedToday} color="text-emerald-600" bg="bg-emerald-50" />
          <KPICard icon={DollarSign} label="Ganhos" value={`${totalEarnings.toFixed(2)}€`} color="text-green-600" bg="bg-green-50" />
          <KPICard icon={Dog} label="Hóspedes" value={activeGuests} color="text-purple-600" bg="bg-purple-50" />
        </div>

        {/* Assign button */}
        {canAssign && (
          <Button
            className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold gap-1.5"
            onClick={() => setShowAssignModal(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Atribuir Tarefa a Parceiro
          </Button>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {PARTNER_TABS.map(tab => {
            const Icon = tab.icon;
            const count = tab.key === 'today' ? todayTasks.length
              : tab.key === 'upcoming' ? upcomingTasks.length
              : tab.key === 'completed' ? completedTasks.length
              : bookings.length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0 rounded-full ${activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'today' && (
              <div className="space-y-2">
                {todayTasks.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="Sem tarefas para hoje" subtitle="Novas tarefas aparecerão aqui" />
                ) : (
                  todayTasks.map(task => (
                    <PartnerTaskCard key={`${task.bookingId}-${task.addOnIndex}`} task={task} onComplete={handleCompleteTask} />
                  ))
                )}
              </div>
            )}

            {activeTab === 'upcoming' && (
              <div className="space-y-2">
                {upcomingTasks.length === 0 ? (
                  <EmptyState icon={Calendar} title="Sem tarefas próximas" subtitle="Tarefas futuras aparecerão aqui" />
                ) : (
                  upcomingTasks.map(task => (
                    <PartnerTaskCard key={`${task.bookingId}-${task.addOnIndex}`} task={task} onComplete={handleCompleteTask} />
                  ))
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-2">
                {completedTasks.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="Sem tarefas concluídas" subtitle="Tarefas concluídas aparecerão aqui" />
                ) : (
                  completedTasks.slice(0, 50).map(task => (
                    <PartnerTaskCard key={`${task.bookingId}-${task.addOnIndex}`} task={task} />
                  ))
                )}
              </div>
            )}

            {/* Full management reservations tab */}
            {activeTab === 'reservations' && canManage && (
              <HotelReservationsPanel
                bookings={bookings}
                onUpdateBooking={handleUpdateBooking}
                onNewBooking={null}
                hideFinance
              />
            )}

            {/* Simple partner bookings list */}
            {activeTab === 'bookings' && !canManage && (
              <div className="space-y-2">
                {bookings.length === 0 ? (
                  <EmptyState icon={ClipboardList} title="Sem reservas" subtitle="As reservas do hotel aparecerão aqui" />
                ) : (
                  bookings.slice(0, 30).map(b => (
                    <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">
                            {(b.dogs || []).map(d => d.dog_name).join(', ') || '—'}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <User className="w-2.5 h-2.5" /> {b.owner_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(b.checkin_date).toLocaleDateString('pt-PT')}
                              {b.checkout_date && ` → ${new Date(b.checkout_date).toLocaleDateString('pt-PT')}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant="outline" className={`text-[9px] py-0 ${STATUS_COLORS[b.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {STATUS_LABELS[b.status] || b.status}
                          </Badge>
                          {b.total_amount > 0 && (
                            <span className="text-[10px] text-slate-400">—</span>
                          )}
                        </div>
                      </div>
                      {(b.add_ons || []).filter(a => a.assigned_walker_email?.toLowerCase() === authUser?.email?.toLowerCase()).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                          {(b.add_ons || []).filter(a => a.assigned_walker_email?.toLowerCase() === authUser?.email?.toLowerCase()).map((a, i) => (
                            <span key={i} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${a.completed ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                              {SERVICE_LABELS[a.service_name] || a.service_name} {a.completed && '✓'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Contact info */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contacto do Hotel</h3>
          <div className="space-y-2 text-sm text-slate-600">
            {hotel.hotel_details?.full_address && (
              <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {hotel.hotel_details.full_address}</p>
            )}
            {hotel.phone && (
              <a href={`tel:${hotel.phone}`} className="flex items-center gap-2 hover:text-slate-900"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {hotel.phone}</a>
            )}
            <p className="flex items-center gap-2 text-xs">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Check-in: {hotel.hotel_details?.checkin_time || '--'} | Check-out: {hotel.hotel_details?.checkout_time || '--'}
            </p>
          </div>
        </div>
      </div>

      {showAssignModal && (
        <AssignTaskModal
          bookings={bookings}
          partners={partners}
          onAssign={handleAssignTask}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center mb-2`}>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  );
}