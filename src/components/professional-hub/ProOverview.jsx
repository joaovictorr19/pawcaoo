import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Zap, Bell, CalendarDays, Wallet, Star, Users, LogOut, Trash2,
  TrendingUp, Clock, CheckCircle2, QrCode, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const sizeLabels = { small: 'Pequeno', medium: 'Médio', large: 'Grande', extra_large: 'Extra Grande' };

export default function ProOverview({ user, professionalProfile, onLogout, onDeleteAccount }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: activeBookings = [] } = useQuery({
    queryKey: ['proActiveBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Booking.filter({
        $or: [
          { walker_email: user.email, status: 'confirmed' },
          { walker_email: user.email, status: 'in_progress' }
        ]
      }, '-created_date', 50);
    },
    enabled: !!user?.email,
    refetchInterval: 15000
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['proPendingRequests', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Booking.filter({
        walker_email: user.email,
        status: 'pending'
      }, '-created_date', 100);
    },
    enabled: !!user?.email,
    refetchInterval: 15000
  });

  const { data: completedBookings = [] } = useQuery({
    queryKey: ['proCompletedBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Booking.filter({
        walker_email: user.email,
        status: 'completed'
      }, '-created_date', 100);
    },
    enabled: !!user?.email
  });

  const { data: unreadNotifs = [] } = useQuery({
    queryKey: ['proUnreadNotifs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Notification.filter(
        { recipient_email: user.email, is_read: false },
        '-created_date', 50
      );
    },
    enabled: !!user?.email,
    refetchInterval: 30000
  });

  const activeWalk = activeBookings.find(b => b.status === 'in_progress');
  const nextWalk = activeBookings.find(b => b.status === 'confirmed');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.service_amount || 0), 0);
  const avgRating = professionalProfile?.rating || 0;

  const stats = [
    { label: 'Concluídos', value: completedBookings.length, icon: CheckCircle2, color: 'text-emerald-600' },
    { label: 'Ganhos', value: `€${totalEarnings.toFixed(0)}`, icon: TrendingUp, color: 'text-teal-600' },
    { label: 'Avaliação', value: avgRating > 0 ? avgRating.toFixed(1) : '—', icon: Star, color: 'text-amber-500' },
  ];

  const isOnline = user?.pawgo_status?.is_online || false;
  const goTab = (tab) => navigate(createPageUrl(`ProfessionalHubV2?tab=${tab}`));

  const toggleOnline = async () => {
    try {
      const updated = await base44.auth.updateMe({
        pawgo_status: {
          ...user.pawgo_status,
          is_online: !isOnline,
          last_active: new Date().toISOString()
        }
      });
      if (professionalProfile) {
        const entity = professionalProfile.walker_name ? base44.entities.WalkerProfile : base44.entities.TrainerProfile;
        await entity.update(professionalProfile.id, { is_online: !isOnline });
      }
      queryClient.setQueryData(['currentUser'], updated);
      queryClient.invalidateQueries(['myProfessionalProfile']);
      queryClient.invalidateQueries(['allWalkers']);
      toast.success(!isOnline ? '🚀 Online no PawGo!' : '😴 Offline');
    } catch (e) {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Passeio ativo — destaque */}
      {activeWalk && (
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0 cursor-pointer" onClick={() => navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${activeWalk.id}`))}>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white/80 mb-0.5 flex items-center gap-1">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Passeio em Curso
              </p>
              <p className="font-bold text-white">{activeWalk.dog_name} está a passear!</p>
              <p className="text-xs text-white/80">Para {activeWalk.owner_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="w-8 h-8 text-white/90" />
              <Button size="sm" className="bg-white text-green-700 hover:bg-white/90 font-bold whitespace-nowrap" onClick={(e) => { e.stopPropagation(); navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${activeWalk.id}`)); }}>
                Gerar QR →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pedidos pendentes */}
      {pendingRequests.length > 0 && (
        <Card className="bg-white border border-amber-200 cursor-pointer hover:border-amber-300 transition-colors" onClick={() => goTab('requests')}>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-sm truncate">{pendingRequests.length} {pendingRequests.length === 1 ? 'novo pedido' : 'novos pedidos'}</p>
                <p className="text-xs text-slate-500">Toque para ver e responder</p>
              </div>
            </div>
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-bold whitespace-nowrap shrink-0">
              Ver →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Próxima reserva confirmada */}
      {nextWalk && !activeWalk && (
        <Card className="bg-white border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors" onClick={() => navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${nextWalk.id}`))}>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Próxima Reserva
            </p>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate">{nextWalk.dog_name}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {nextWalk.walk_date ? format(new Date(nextWalk.walk_date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR }) : '—'} · {nextWalk.owner_name}
                </p>
              </div>
              <Clock className="w-7 h-7 text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="p-2.5 flex flex-col items-center text-center gap-1 min-w-0">
              <s.icon className={`w-5 h-5 ${s.color} shrink-0`} />
              <p className="text-base font-black text-slate-900 leading-none truncate w-full">{s.value}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate w-full">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toggle PawGo online */}
      <button
        onClick={toggleOnline}
        className={`w-full rounded-2xl p-4 flex items-center justify-between transition-all border ${
          isOnline
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOnline ? 'bg-emerald-100' : 'bg-slate-100'}`}>
            <Zap className={`w-5 h-5 ${isOnline ? 'text-emerald-600' : 'text-slate-400'}`} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-bold text-slate-900 text-sm">{isOnline ? 'Online no PawGo' : 'Offline no PawGo'}</p>
            <p className="text-xs text-slate-500 truncate">{isOnline ? 'A receber pedidos em tempo real' : 'Ative para receber pedidos'}</p>
          </div>
        </div>
        <div className={`w-12 h-7 rounded-full flex items-center px-1 transition-all shrink-0 ${isOnline ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}>
          <div className="w-5 h-5 bg-white rounded-full shadow" />
        </div>
      </button>

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => goTab('calendar')} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-slate-300 transition-colors">
          <CalendarDays className="w-6 h-6 text-teal-600" />
          <p className="text-sm font-bold text-slate-900">Agenda</p>
          <p className="text-xs text-slate-400">Reservas e horários</p>
        </button>
        <button onClick={() => goTab('wallet')} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-slate-300 transition-colors">
          <Wallet className="w-6 h-6 text-emerald-600" />
          <p className="text-sm font-bold text-slate-900">Carteira</p>
          <p className="text-xs text-slate-400">Ganhos e pagamentos</p>
        </button>
        <button onClick={() => goTab('services')} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-slate-300 transition-colors">
          <Users className="w-6 h-6 text-blue-600" />
          <p className="text-sm font-bold text-slate-900">Serviços</p>
          <p className="text-xs text-slate-400">Editar ofertas</p>
        </button>
        <button onClick={() => navigate(createPageUrl('Notifications'))} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 text-left hover:border-slate-300 transition-colors relative">
          <Bell className="w-6 h-6 text-pink-500" />
          <p className="text-sm font-bold text-slate-900">Notificações</p>
          <p className="text-xs text-slate-400">{unreadNotifs.length} não lidas</p>
          {unreadNotifs.length > 0 && (
            <span className="absolute top-3 right-3 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadNotifs.length}
            </span>
          )}
        </button>
      </div>

      {/* Ações de conta */}
      <div className="flex gap-2 pt-2">
        <Button onClick={() => navigate(createPageUrl(`UserProfile?id=${user?.id}`))} variant="outline" className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-2xl h-11">
          <ExternalLink className="w-4 h-4 mr-2" /> Ver Perfil
        </Button>
        <Button onClick={onLogout} variant="outline" className="flex-1 border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold rounded-2xl h-11">
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </div>
      <Button onClick={onDeleteAccount} variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-2xl h-11">
        <Trash2 className="w-4 h-4 mr-2" /> Eliminar Conta
      </Button>
    </motion.div>
  );
}