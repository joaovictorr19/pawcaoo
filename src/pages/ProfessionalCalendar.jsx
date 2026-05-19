import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Moon, X, CalendarDays, Clock, Dog, User, CheckCircle2, AlertCircle } from "lucide-react";
import GroupWalksManager from "@/components/professional-hub/GroupWalksManager";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProfessionalCalendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const paddingDays = Array(getDay(monthStart)).fill(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: walkerProfile } = useQuery({
    queryKey: ['myWalkerProfile', user?.email],
    queryFn: () => base44.entities.WalkerProfile.filter({ created_by: user.email }).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const { data: trainerProfile } = useQuery({
    queryKey: ['myTrainerProfile', user?.email],
    queryFn: () => base44.entities.TrainerProfile.filter({ created_by: user.email }).then(r => r[0] || null),
    enabled: !!user?.email,
  });

  const isProfessional = !!(walkerProfile || trainerProfile);

  const { data: availability = [] } = useQuery({
    queryKey: ['myAvailability', user?.email, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const all = await base44.entities.CalendarAvailability.filter({ professional_email: user.email });
      const start = format(monthStart, 'yyyy-MM-dd');
      const end = format(monthEnd, 'yyyy-MM-dd');
      return all.filter(a => {
        const d = (a.date?.includes('T') ? a.date.split('T')[0] : a.date) || '';
        return d >= start && d <= end;
      });
    },
    enabled: !!user?.email,
    staleTime: 60 * 1000,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['myProfBookings', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const [walks, trainings] = await Promise.all([
        base44.entities.Booking.filter({ walker_email: user.email }, '-created_date', 100),
        base44.entities.TrainingBooking ? base44.entities.TrainingBooking.filter({ trainer_email: user.email }, '-created_date', 100).catch(() => []) : Promise.resolve([]),
      ]);
      return [
        ...walks.map(b => ({ ...b, _type: 'walk', _date: b.walk_date })),
        ...trainings.map(b => ({ ...b, _type: 'training', _date: b.session_date })),
      ];
    },
    enabled: !!user?.email,
    staleTime: 60 * 1000,
  });

  const toggleDayOffMutation = useMutation({
    mutationFn: async (date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existing = availability.find(a => {
        const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
        return d === dateStr && a.professional_email === user.email;
      });
      if (existing) {
        await base44.entities.CalendarAvailability.update(existing.id, { is_day_off: !existing.is_day_off });
      } else {
        await base44.entities.CalendarAvailability.create({
          professional_email: user.email,
          date: dateStr,
          is_day_off: true,
          time_slots: [],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['daysOff'] });
      queryClient.invalidateQueries({ queryKey: ['walkerDaysOff'] });
      toast.success('Disponibilidade atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar disponibilidade'),
  });

  const getDateInfo = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const avail = availability.find(a => {
      const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
      return d === dateStr;
    });
    const dayBookings = bookings.filter(b => {
      const bd = b._date?.includes('T') ? b._date.split('T')[0] : b._date;
      return bd === dateStr;
    });
    return { avail, dayBookings, isDayOff: avail?.is_day_off };
  };

  const getDayStyle = (date) => {
    if (isPast(date) && !isToday(date)) return "bg-gray-50 border-gray-100 text-gray-300";
    const { isDayOff, dayBookings } = getDateInfo(date);
    if (isDayOff) return "bg-red-500 border-red-600 text-white font-bold shadow-inner";
    const hasConfirmed = dayBookings.some(b => b.status === 'confirmed' || b.status === 'completed');
    const hasPending = dayBookings.some(b => b.status === 'pending');
    if (hasConfirmed) return "bg-blue-100 border-blue-400 text-blue-800";
    if (hasPending) return "bg-orange-100 border-orange-400 text-orange-800";
    return "bg-white border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-300";
  };

  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedBookings = selectedDate ? bookings.filter(b => {
    const bd = b._date?.includes('T') ? b._date.split('T')[0] : b._date;
    return bd === selectedDateStr;
  }) : [];
  const selectedAvail = selectedDate ? availability.find(a => {
    const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
    return d === selectedDateStr;
  }) : null;
  const selectedIsDayOff = selectedAvail?.is_day_off;

  const statusLabel = {
    pending: { label: 'Pendente', color: 'bg-orange-100 text-orange-700' },
    confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'Em curso', color: 'bg-green-100 text-green-700' },
    completed: { label: 'Concluído', color: 'bg-gray-100 text-gray-600' },
    cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-600' },
  };

  if (!isProfessional && user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <CalendarDays className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold mb-2">Calendário Profissional</h2>
          <p className="text-gray-500 mb-4">Esta página é exclusiva para profissionais (passeadores/treinadores).</p>
          <Button onClick={() => navigate(createPageUrl('ProfessionalSetup'))}>Tornar-me Profissional</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Calendário</h1>
            <p className="text-sm text-slate-500">Clica num dia para ver reservas ou marcar folga</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl('MyBookings'))}>
            Ver Lista de Reservas
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CALENDÁRIO */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
            {/* Nav mês */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold capitalize text-slate-800">
                {format(currentMonth, 'MMMM yyyy', { locale: pt })}
              </h2>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1">
              {paddingDays.map((_, i) => <div key={`p-${i}`} />)}
              {daysInMonth.map(date => {
                const { dayBookings, isDayOff } = getDateInfo(date);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isPastDay = isPast(date) && !isToday(date);
                return (
                  <button
                    key={date.toString()}
                    onClick={() => !isPastDay && setSelectedDate(date)}
                    disabled={isPastDay}
                    className={`relative h-11 md:h-14 w-full rounded-xl border flex flex-col items-center justify-center transition-all duration-150
                      ${getDayStyle(date)}
                      ${isSelected ? 'ring-2 ring-offset-1 ring-slate-700 scale-105 z-10' : ''}
                      ${isPastDay ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <span className="text-sm font-semibold">{format(date, 'd')}</span>
                    {isToday(date) && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-500" />}
                    {dayBookings.length > 0 && !isDayOff && (
                      <span className="absolute bottom-1 text-[8px] font-bold opacity-70">{dayBookings.length}</span>
                    )}
                    {isDayOff && <Moon className="w-3 h-3 text-white/80 mt-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-100">
              {[
                { color: 'bg-white border-gray-300', label: 'Livre' },
                { color: 'bg-blue-100 border-blue-400', label: 'Confirmado' },
                { color: 'bg-orange-100 border-orange-400', label: 'Pendente' },
                { color: 'bg-red-500 border-red-600', label: 'Folga' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded border ${item.color}`} />
                  <span className="text-[10px] text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PAINEL DO DIA */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col">
            {selectedDate ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-slate-900 capitalize">
                      {format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
                    </h3>
                    {selectedIsDayOff && (
                      <Badge className="bg-red-100 text-red-600 text-xs mt-1">🌙 Folga marcada</Badge>
                    )}
                  </div>
                  <button onClick={() => setSelectedDate(null)} className="p-1 rounded-full hover:bg-slate-100">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Botão Folga */}
                <Button
                  variant={selectedIsDayOff ? "destructive" : "outline"}
                  size="sm"
                  className="mb-4 w-full"
                  onClick={() => toggleDayOffMutation.mutate(selectedDate)}
                  disabled={toggleDayOffMutation.isPending}
                >
                  <Moon className="w-3.5 h-3.5 mr-2" />
                  {selectedIsDayOff ? 'Remover Folga' : 'Marcar como Folga'}
                </Button>

                {/* Reservas do dia */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {selectedBookings.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Sem reservas neste dia</p>
                    </div>
                  ) : (
                    selectedBookings.map(booking => {
                      const st = statusLabel[booking.status] || statusLabel.pending;
                      return (
                        <div key={booking.id} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-sm font-bold text-slate-800">{booking.owner_name || 'Cliente'}</span>
                            <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            {booking.dog_name && (
                              <span className="flex items-center gap-1"><Dog className="w-3 h-3" />{booking.dog_name}</span>
                            )}
                            {(booking.walk_time || booking.session_time) && (
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.walk_time || booking.session_time}</span>
                            )}
                            <span className="flex items-center gap-1 capitalize">
                              {booking._type === 'walk' ? '🐕 Passeio' : '🎓 Treino'}
                            </span>
                          </div>
                          {booking.total_amount > 0 && (
                            <p className="text-xs font-bold text-green-600 mt-1">€{booking.total_amount?.toFixed(2)}</p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-8">
                <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Seleciona um dia</p>
                <p className="text-xs mt-1">para ver reservas ou gerir disponibilidade</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <GroupWalksManager user={user} professionalProfile={walkerProfile || trainerProfile} />
        </div>
      </div>
    </div>
  );
}