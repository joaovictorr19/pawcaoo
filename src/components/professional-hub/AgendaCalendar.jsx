import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X, Calendar, BedDouble, Check } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

function DayOffModal({ date, existing, onConfirm, onRemove, onClose }) {
  const isOff = existing?.is_day_off;
  const [note, setNote] = useState(existing?.notes || "");

  return (
    <div className="fixed inset-0 z-[999] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-white font-black text-lg capitalize">
              {format(date, "EEEE, d MMMM", { locale: pt })}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {isOff ? "Este dia está marcado como folga" : "Marcar disponibilidade"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-widest mb-2 block">Nota (opcional)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: Férias, consulta médica..."
              className="w-full h-10 px-3 bg-slate-800 text-white rounded-xl text-sm border border-slate-700 focus:border-orange-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            {!isOff ? (
              <Button
                onClick={() => onConfirm({ notes: note })}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
              >
                <BedDouble className="w-4 h-4 mr-2" />
                Marcar como Folga
              </Button>
            ) : (
              <Button
                onClick={onRemove}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold"
              >
                <Check className="w-4 h-4 mr-2" />
                Remover Folga (Disponível)
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgendaCalendar({ user, walkerProfile }) {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['myAvailability', user?.email],
    queryFn: () => base44.entities.CalendarAvailability.filter({ professional_email: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: walkBookings = [] } = useQuery({
    queryKey: ['myWalkBookingsCalendar', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Booking.filter({ walker_email: user.email }, '-created_date', 100);
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const toggleDayOffMutation = useMutation({
    mutationFn: async ({ date, notes, remove }) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existing = availability.find(a => {
        const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
        return d === dateStr && a.professional_email === user.email;
      });

      if (remove && existing) {
        await base44.entities.CalendarAvailability.delete(existing.id);
        return;
      }

      if (existing) {
        await base44.entities.CalendarAvailability.update(existing.id, {
          is_day_off: true,
          notes: notes || "",
        });
      } else {
        await base44.entities.CalendarAvailability.create({
          professional_email: user.email,
          professional_name: walkerProfile?.walker_name || user.full_name || "",
          professional_type: 'walker',
          date: dateStr,
          is_day_off: true,
          notes: notes || "",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myAvailability']);
      queryClient.invalidateQueries(['walkerAvailability']);
      toast.success("Disponibilidade atualizada!");
      setSelectedDate(null);
    },
    onError: () => toast.error("Erro ao atualizar disponibilidade."),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const paddingDays = Array(getDay(monthStart)).fill(null);

  const getDateInfo = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const avail = availability.find(a => {
      const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
      return d === dateStr && a.professional_email === user?.email;
    });
    const dayBookings = walkBookings.filter(b => {
      const bd = b.walk_date?.includes('T') ? b.walk_date.split('T')[0] : b.walk_date;
      return bd === dateStr;
    });

    const past = isPast(date) && !isToday(date);
    if (avail?.is_day_off) return { status: 'day_off', avail, bookings: dayBookings };
    if (past) return { status: 'past', bookings: dayBookings };
    const confirmed = dayBookings.filter(b => ['confirmed', 'in_progress'].includes(b.status));
    const pending = dayBookings.filter(b => b.status === 'pending');
    if (confirmed.length > 0) return { status: 'booked', avail, bookings: dayBookings };
    if (pending.length > 0) return { status: 'pending', avail, bookings: dayBookings };
    return { status: 'free', avail, bookings: dayBookings };
  };

  const getStyle = (status) => {
    const s = {
      free: "bg-slate-900 border-slate-700 text-slate-300 hover:border-orange-500 hover:text-white cursor-pointer",
      day_off: "bg-red-600 border-red-700 text-white font-bold cursor-pointer",
      booked: "bg-blue-600/20 border-blue-500 text-blue-300 cursor-pointer",
      pending: "bg-orange-500/20 border-orange-500 text-orange-300 cursor-pointer",
      past: "bg-slate-950 border-slate-800 text-slate-700 cursor-not-allowed opacity-50",
    };
    return s[status] || s.free;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  }

  const selectedDateInfo = selectedDate ? getDateInfo(selectedDate) : null;

  const daysOff = availability.filter(a => a.is_day_off && a.professional_email === user?.email);
  const upcoming = daysOff
    .filter(a => {
      const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
      return d >= format(new Date(), 'yyyy-MM-dd');
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-orange-500" /> Minha Agenda
      </h3>

      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-4">
          {/* Header navegação */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: pt })}
            </h2>
            <div className="flex gap-1">
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-lg">‹</button>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-lg">›</button>
            </div>
          </div>

          {/* Dias da semana */}
          <div className="grid grid-cols-7 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs font-bold text-slate-600 py-1">{d}</div>
            ))}
          </div>

          {/* Grid dias */}
          <div className="grid grid-cols-7 gap-1">
            {paddingDays.map((_, i) => <div key={`p${i}`} />)}
            {daysInMonth.map(date => {
              const { status, bookings: dayBkgs } = getDateInfo(date);
              const today = isToday(date);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => status !== 'past' && setSelectedDate(date)}
                  className={`relative h-10 w-full rounded-xl border flex flex-col items-center justify-center transition-all text-sm ${getStyle(status)} ${today ? 'ring-2 ring-orange-500' : ''}`}
                >
                  <span className="font-medium">{format(date, 'd')}</span>
                  {dayBkgs.length > 0 && status !== 'day_off' && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current opacity-60" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-900 border border-slate-700" /><span className="text-[10px] text-slate-500">Livre</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-600/20 border border-blue-500" /><span className="text-[10px] text-slate-500">Marcado</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500" /><span className="text-[10px] text-slate-500">Pendente</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-600 border border-red-700" /><span className="text-[10px] text-red-400 font-bold">Folga</span></div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-3">Toque num dia para gerir a sua disponibilidade</p>
        </CardContent>
      </Card>

      {/* Folgas marcadas */}
      {upcoming.length > 0 && (
        <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
          <CardContent className="p-4">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-red-400" /> Folgas Marcadas
            </h4>
            <div className="space-y-2">
              {upcoming.map(a => {
                const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
                const dateObj = new Date(d + 'T12:00:00');
                return (
                  <div key={a.id} className="flex items-center justify-between p-2.5 bg-red-600/10 border border-red-600/20 rounded-xl">
                    <div>
                      <p className="text-white text-sm font-bold capitalize">{format(dateObj, 'EEEE, d MMM', { locale: pt })}</p>
                      {a.notes && <p className="text-red-300 text-xs">{a.notes}</p>}
                    </div>
                    <button
                      onClick={() => toggleDayOffMutation.mutate({ date: dateObj, remove: true })}
                      className="text-red-400 hover:text-red-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de gestão de dia */}
      {selectedDate && selectedDateInfo && (
        <DayOffModal
          date={selectedDate}
          existing={selectedDateInfo.avail}
          onConfirm={({ notes }) => toggleDayOffMutation.mutate({ date: selectedDate, notes })}
          onRemove={() => toggleDayOffMutation.mutate({ date: selectedDate, remove: true })}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}