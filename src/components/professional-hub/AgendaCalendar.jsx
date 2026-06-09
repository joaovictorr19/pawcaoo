import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X, Calendar, BedDouble, Check, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import {
  format, addMonths, subMonths, addWeeks, subWeeks,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isToday, isPast, getDay, startOfWeek, endOfWeek, parseISO, getHours
} from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// ─── MODAL DE DIA ────────────────────────────────────────────────────────────
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
              <Button onClick={() => onConfirm({ notes: note })} className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold">
                <BedDouble className="w-4 h-4 mr-2" /> Marcar como Folga
              </Button>
            ) : (
              <Button onClick={onRemove} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold">
                <Check className="w-4 h-4 mr-2" /> Remover Folga (Disponível)
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VISTA SEMANAL ────────────────────────────────────────────────────────────
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 → 20:00

function parseHour(timeStr) {
  if (!timeStr) return null;
  const [h] = timeStr.split(":").map(Number);
  return isNaN(h) ? null : h;
}

function BookingChip({ booking, index }) {
  const statusColor = {
    confirmed: "bg-blue-600 border-blue-400",
    pending: "bg-orange-600 border-orange-400",
    in_progress: "bg-green-600 border-green-400",
  }[booking.status] || "bg-slate-700 border-slate-500";

  return (
    <Draggable draggableId={booking.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`px-2 py-1 rounded-lg border text-xs font-bold text-white truncate cursor-grab active:cursor-grabbing shadow-md transition-transform ${statusColor} ${snapshot.isDragging ? "scale-105 shadow-xl" : ""}`}
          title={`${booking.owner_name} — ${booking.walk_time || "?"}`}
        >
          <div className="flex items-center gap-1">
            <User className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{booking.owner_name?.split(' ')[0] || 'Cliente'}</span>
          </div>
          <div className="text-[9px] opacity-75">{booking.walk_time}</div>
        </div>
      )}
    </Draggable>
  );
}

function WeeklyView({ weekStart, walkBookings, availability, onDayOffClick, onDropBooking }) {
  const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });

  const getBookingsForSlot = (day, hour) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return walkBookings.filter(b => {
      const bd = b.walk_date?.includes('T') ? b.walk_date.split('T')[0] : b.walk_date;
      if (bd !== dateStr) return false;
      const bHour = parseHour(b.walk_time);
      return bHour === hour;
    });
  };

  const isDayOff = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return availability.some(a => {
      const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
      return d === dateStr && a.is_day_off;
    });
  };

  return (
    <DragDropContext onDragEnd={onDropBooking}>
      <div className="overflow-x-auto rounded-2xl border border-white/5">
        <div className="min-w-[600px]">
          {/* Header dos dias */}
          <div className="grid bg-slate-800/60" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
            <div className="p-2" />
            {days.map(day => (
              <button
                key={day.toISOString()}
                onClick={() => !isPast(day) && !isToday(day) && onDayOffClick(day)}
                className={`p-2 text-center border-l border-white/5 transition-colors ${
                  isToday(day) ? 'bg-orange-500/20' : ''
                } ${isDayOff(day) ? 'bg-red-900/40' : 'hover:bg-slate-700/30'}`}
              >
                <div className={`text-[10px] font-bold uppercase tracking-widest ${isToday(day) ? 'text-orange-400' : 'text-slate-500'}`}>
                  {format(day, 'EEE', { locale: pt })}
                </div>
                <div className={`text-lg font-black ${isToday(day) ? 'text-orange-400' : isDayOff(day) ? 'text-red-400' : 'text-white'}`}>
                  {format(day, 'd')}
                </div>
                {isDayOff(day) && <div className="text-[8px] text-red-400 font-bold">FOLGA</div>}
              </button>
            ))}
          </div>

          {/* Grelha de horas */}
          <div className="max-h-[480px] overflow-y-auto">
            {HOURS.map(hour => (
              <div key={hour} className="grid border-t border-white/5" style={{ gridTemplateColumns: '48px repeat(7, 1fr)' }}>
                {/* Hora */}
                <div className="p-1.5 text-right pr-2 text-[10px] text-slate-600 font-mono pt-2">
                  {hour}:00
                </div>
                {/* Células por dia */}
                {days.map(day => {
                  const droppableId = `${format(day, 'yyyy-MM-dd')}__${hour}`;
                  const slotBookings = getBookingsForSlot(day, hour);
                  const dayIsOff = isDayOff(day);
                  return (
                    <Droppable key={droppableId} droppableId={droppableId}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`border-l border-white/5 min-h-[52px] p-0.5 transition-colors ${
                            dayIsOff ? 'bg-red-900/10' :
                            snapshot.isDraggingOver ? 'bg-orange-500/10' :
                            isToday(day) ? 'bg-orange-500/5' : ''
                          }`}
                        >
                          <div className="space-y-0.5">
                            {slotBookings.map((b, i) => (
                              <BookingChip key={b.id} booking={b} index={i} />
                            ))}
                          </div>
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}

// ─── VISTA MENSAL (mantida) ───────────────────────────────────────────────────
function MonthlyView({ currentMonth, walkBookings, availability, onDayClick }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const paddingDays = Array(getDay(monthStart)).fill(null);

  const getDateInfo = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const avail = availability.find(a => {
      const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
      return d === dateStr;
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

  const getStyle = (status) => ({
    free: "bg-slate-900 border-slate-700 text-slate-300 hover:border-orange-500 hover:text-white cursor-pointer",
    day_off: "bg-red-600 border-red-700 text-white font-bold cursor-pointer",
    booked: "bg-blue-600/20 border-blue-500 text-blue-300 cursor-pointer",
    pending: "bg-orange-500/20 border-orange-500 text-orange-300 cursor-pointer",
    past: "bg-slate-950 border-slate-800 text-slate-700 cursor-not-allowed opacity-50",
  }[status] || "bg-slate-900 border-slate-700 text-slate-300");

  return (
    <>
      <div className="grid grid-cols-7 mb-2">
        {['D','S','T','Q','Q','S','S'].map((d, i) => (
          <div key={i} className="text-center text-xs font-bold text-slate-600 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map((_, i) => <div key={`p${i}`} />)}
        {daysInMonth.map(date => {
          const { status, bookings: dayBkgs } = getDateInfo(date);
          return (
            <button
              key={date.toISOString()}
              onClick={() => status !== 'past' && onDayClick(date, getDateInfo(date))}
              className={`relative h-10 w-full rounded-xl border flex flex-col items-center justify-center transition-all text-sm ${getStyle(status)} ${isToday(date) ? 'ring-2 ring-orange-500' : ''}`}
            >
              <span className="font-medium">{format(date, 'd')}</span>
              {dayBkgs.length > 0 && status !== 'day_off' && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current opacity-60" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-900 border border-slate-700" /><span className="text-[10px] text-slate-500">Livre</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-600/20 border border-blue-500" /><span className="text-[10px] text-slate-500">Marcado</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500" /><span className="text-[10px] text-slate-500">Pendente</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-600 border border-red-700" /><span className="text-[10px] text-red-400 font-bold">Folga</span></div>
      </div>
    </>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export function AgendaCalendar({ user, walkerProfile }) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState("week"); // "week" | "month"
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  const { data: availability = [], isLoading } = useQuery({
    queryKey: ['myAvailability', user?.email],
    queryFn: () => base44.entities.CalendarAvailability.filter({ professional_email: user?.email }),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: walkBookings = [] } = useQuery({
    queryKey: ['myWalkBookingsCalendar', user?.email],
    queryFn: () => base44.entities.Booking.filter({ walker_email: user.email }, '-created_date', 200),
    enabled: !!user?.email,
    initialData: [],
  });

  const toggleDayOffMutation = useMutation({
    mutationFn: async ({ date, notes, remove }) => {
      // Garante formato yyyy-MM-dd sem desvio de fuso horário
      const dateStr = format(date, 'yyyy-MM-dd');
      // Busca registo existente pelo dateStr normalizado
      const existing = availability.find(a => {
        const d = (a.date || '').split('T')[0];
        return d === dateStr && a.professional_email === user.email;
      });
      if (remove) {
        // Nunca apagar — apenas desmarcar is_day_off
        if (existing) {
          await base44.entities.CalendarAvailability.update(existing.id, { is_day_off: false, notes: "" });
        }
        return;
      }
      if (existing) {
        await base44.entities.CalendarAvailability.update(existing.id, { is_day_off: true, notes: notes || "" });
      } else {
        await base44.entities.CalendarAvailability.create({
          professional_email: user.email,
          professional_name: walkerProfile?.walker_name || user.full_name || "",
          professional_type: 'walker',
          date: dateStr,
          is_day_off: true,
          is_fully_booked: false,
          notes: notes || "",
          time_slots: [],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myAvailability']);
      queryClient.invalidateQueries(['walkerAvailability']);
      queryClient.invalidateQueries(['daysOff']);
      queryClient.invalidateQueries(['walkerDaysOff']);
      toast.success("Disponibilidade atualizada!");
      setSelectedDate(null);
    },
    onError: () => toast.error("Erro ao atualizar disponibilidade."),
  });

  // Drag-and-drop: mover reserva para outro dia/hora
  const handleDropBooking = async (result) => {
    if (!result.destination || result.destination.droppableId === result.source.droppableId) return;
    const bookingId = result.draggableId;
    const [newDate, newHour] = result.destination.droppableId.split('__');
    const newTime = `${newHour}:00`;
    try {
      await base44.entities.Booking.update(bookingId, { walk_date: newDate, walk_time: newTime });
      queryClient.invalidateQueries(['myWalkBookingsCalendar']);
      toast.success(`Reserva movida para ${format(parseISO(newDate), 'dd/MM', { locale: pt })} às ${newTime}`);
    } catch {
      toast.error("Erro ao mover reserva.");
      queryClient.invalidateQueries(['myWalkBookingsCalendar']);
    }
  };

  // Normaliza a data para meio-dia local evitando desvios de fuso horário (UTC+1)
  const normalizeDate = (date) => {
    const str = format(date, 'yyyy-MM-dd');
    return new Date(str + 'T12:00:00');
  };

  const handleDayOffClick = (date, info) => {
    setSelectedDate(normalizeDate(date));
    setSelectedDateInfo(info || null);
  };

  // Folgas futuras
  const upcomingDaysOff = availability
    .filter(a => a.is_day_off && a.professional_email === user?.email)
    .filter(a => {
      const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
      return d >= format(new Date(), 'yyyy-MM-dd');
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" /> Minha Agenda
        </h3>
        {/* Toggle vista */}
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "week" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "month" ? "bg-orange-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Mês
          </button>
        </div>
      </div>

      <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
        <CardContent className="p-4">
          {/* Navegação */}
          <div className="flex items-center justify-between mb-4">
            {viewMode === "week" ? (
              <>
                <button onClick={() => setCurrentWeek(w => subWeeks(w, 1))} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-sm font-bold text-white">
                  {format(currentWeek, 'd MMM', { locale: pt })} — {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: pt })}
                </h2>
                <button onClick={() => setCurrentWeek(w => addWeeks(w, 1))} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-lg">‹</button>
                <h2 className="text-base font-bold text-white capitalize">{format(currentMonth, 'MMMM yyyy', { locale: pt })}</h2>
                <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-lg">›</button>
              </>
            )}
          </div>

          {viewMode === "week" ? (
            <WeeklyView
              weekStart={currentWeek}
              walkBookings={walkBookings}
              availability={availability}
              onDayOffClick={(day) => handleDayOffClick(day, null)}
              onDropBooking={handleDropBooking}
            />
          ) : (
            <MonthlyView
              currentMonth={currentMonth}
              walkBookings={walkBookings}
              availability={availability}
              onDayClick={handleDayOffClick}
            />
          )}

          {viewMode === "week" && (
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-600 border border-blue-400" /><span className="text-[10px] text-slate-500">Confirmado</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-orange-600 border border-orange-400" /><span className="text-[10px] text-slate-500">Pendente</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-600 border border-green-400" /><span className="text-[10px] text-slate-500">Em curso</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-900/40 border border-red-600/30" /><span className="text-[10px] text-red-400 font-bold">Folga</span></div>
            </div>
          )}

          <p className="text-center text-xs text-slate-600 mt-3">
            {viewMode === "week"
              ? "Arraste reservas para alterar horário • Toque num dia para gerir folga"
              : "Toque num dia para gerir a sua disponibilidade"}
          </p>
        </CardContent>
      </Card>

      {/* Folgas futuras */}
      {upcomingDaysOff.length > 0 && (
        <Card className="bg-slate-900 border-white/5 rounded-[2rem] overflow-hidden">
          <CardContent className="p-4">
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-red-400" /> Folgas Marcadas
            </h4>
            <div className="space-y-2">
              {upcomingDaysOff.map(a => {
                const d = a.date?.includes('T') ? a.date.split('T')[0] : a.date;
                const dateObj = new Date(d + 'T12:00:00');
                return (
                  <div key={a.id} className="flex items-center justify-between p-2.5 bg-red-600/10 border border-red-600/20 rounded-xl">
                    <div>
                      <p className="text-white text-sm font-bold capitalize">{format(dateObj, 'EEEE, d MMM', { locale: pt })}</p>
                      {a.notes && <p className="text-red-300 text-xs">{a.notes}</p>}
                    </div>
                    <button onClick={() => toggleDayOffMutation.mutate({ date: dateObj, remove: true })} className="text-red-400 hover:text-red-200 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de dia */}
      {selectedDate && (
        <DayOffModal
          date={selectedDate}
          existing={selectedDateInfo?.avail}
          onConfirm={({ notes }) => toggleDayOffMutation.mutate({ date: selectedDate, notes })}
          onRemove={() => toggleDayOffMutation.mutate({ date: selectedDate, remove: true })}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}