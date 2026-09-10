import React, { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Filter, User, Dog } from "lucide-react";
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, 
  subDays, isSameDay, parseISO, getHours, startOfDay, addWeeks, subWeeks,
  isWithinInterval, setHours, setMinutes
} from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function AdminInteractiveCalendar() {
  const { language } = useLanguage();
  const locale = language === 'pt' ? ptBR : enUS;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("week"); // week, day
  const [filterWalker, setFilterWalker] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch Data
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['adminCalendarBookings'],
    queryFn: async () => {
      const walks = (await base44.entities.Booking.list('-walk_date', 500)).map(b => ({
        ...b, 
        type: 'walk',
        date: new Date(b.walk_date + 'T' + (b.walk_time || '12:00')), // Construct Date object
        title: b.walker_name || 'Walker',
        subtitle: b.dog_name,
        color: 'bg-blue-100 border-blue-300 text-blue-800'
      }));
      
      const trainings = (await base44.entities.TrainingBooking.list('-session_date', 500)).map(b => ({
        ...b, 
        type: 'training',
        date: new Date(b.session_date + 'T' + (b.session_time || '12:00')),
        title: b.trainer_name || 'Trainer',
        subtitle: b.dog_name,
        color: 'bg-purple-100 border-purple-300 text-purple-800'
      }));

      // Reservas de hotel — expandir por cada dia da estadia (check-in → check-out)
      const hotelRaw = await base44.entities.HotelBooking.list('-checkin_date', 500);
      const hotels = [];
      for (const b of hotelRaw) {
        if (!b.checkin_date) continue;
        const stayStart = parseISO(b.checkin_date);
        const stayEnd = b.checkout_date ? parseISO(b.checkout_date) : stayStart;
        const hour = b.checkin_time ? parseInt(String(b.checkin_time).split(':')[0], 10) : 12;
        const safeHour = isNaN(hour) ? 12 : hour;
        let cur = startOfDay(stayStart);
        const stop = startOfDay(stayEnd);
        let guard = 0;
        while (cur <= stop && guard < 90) {
          hotels.push({
            ...b,
            type: 'hotel',
            walker_id: b.hotel_profile_id, // para o filtro de profissional funcionar
            date: setHours(cur, safeHour),
            title: b.hotel_name || 'Hotel',
            subtitle: `${b.total_dogs || 1} cão(s)${b.owner_name ? ' · ' + b.owner_name : ''}`,
            color: 'bg-emerald-100 border-emerald-300 text-emerald-800'
          });
          cur = addDays(cur, 1);
          guard++;
        }
      }
      
      return [...walks, ...trainings, ...hotels];
    },
    staleTime: 5 * 60 * 1000
  });

  const { data: walkers = [] } = useQuery({
    queryKey: ['adminCalendarWalkers'],
    queryFn: () => base44.entities.WalkerProfile.list(),
    staleTime: 30 * 60 * 1000
  });

  // Navigation
  const handlePrev = () => {
    setCurrentDate(prev => view === 'week' ? subWeeks(prev, 1) : subDays(prev, 1));
  };

  const handleNext = () => {
    setCurrentDate(prev => view === 'week' ? addWeeks(prev, 1) : addDays(prev, 1));
  };

  // Grid Generation
  const days = useMemo(() => {
    const start = view === 'week' ? startOfWeek(currentDate, { weekStartsOn: 1 }) : startOfDay(currentDate);
    const end = view === 'week' ? endOfWeek(currentDate, { weekStartsOn: 1 }) : startOfDay(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate, view]);

  // Hours Grid (8:00 to 20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  // Filter Logic
  const filteredEvents = useMemo(() => {
    return bookings.filter(event => {
      // Date Filter
      const eventDate = event.date;
      if (!eventDate || isNaN(eventDate.getTime())) return false;
      
      const start = startOfDay(days[0]);
      const end = endOfWeek(days[days.length-1], { weekStartsOn: 1 });
      
      // Basic range check (buffer for timezones)
      if (!isWithinInterval(eventDate, { 
        start: subDays(start, 1), 
        end: addDays(end, 1) 
      })) return false;

      // Walker Filter
      if (filterWalker !== 'all') {
        const professionalId = event.walker_id || event.trainer_id;
        // Also check by name as fallback
        const professionalName = event.walker_name || event.trainer_name;
        if (professionalId !== filterWalker && professionalName !== filterWalker) return false;
      }

      // Status Filter
      if (filterStatus !== 'all') {
        if (event.status !== filterStatus) return false;
      }

      return true;
    });
  }, [bookings, days, filterWalker, filterStatus]);

  // Event Rendering Helper
  const getEventsForCell = (day, hour) => {
    return filteredEvents.filter(event => {
      return isSameDay(event.date, day) && getHours(event.date) === hour;
    });
  };

  return (
    <Card className="flex h-[720px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:h-[800px]">
      <CardHeader className="flex flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            Agenda Interativa
          </CardTitle>
          
          <div className="flex min-w-0 items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-7 w-7">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-8 min-w-0 flex-1 px-2 text-xs font-semibold sm:min-w-[140px] sm:text-sm">
                  {view === 'week' 
                    ? `${format(days[0], 'd MMM', { locale })} - ${format(days[days.length-1], 'd MMM', { locale })}`
                    : format(currentDate, 'd MMMM yyyy', { locale })
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={currentDate}
                  onSelect={(date) => date && setCurrentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={handleNext} className="h-7 w-7">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
              onClick={() => setView('day')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${view === 'day' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-gray-500'}`}
            >
              Dia
            </button>
            <button 
              onClick={() => setView('week')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${view === 'week' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-gray-500'}`}
            >
              Semana
            </button>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-10 w-full text-xs lg:w-[140px]">
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterWalker} onValueChange={setFilterWalker}>
            <SelectTrigger className="h-10 w-full text-xs lg:w-[190px]">
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                <SelectValue placeholder="Profissional" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Profissionais</SelectItem>
              {walkers.map(w => (
                <SelectItem key={w.id} value={w.id}>{w.walker_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col overflow-x-auto p-0">
        <div className="min-w-[860px] flex flex-1 flex-col md:min-w-0">
        {/* Header Row (Days) */}
        <div className="flex border-b bg-slate-50">
          <div className="w-16 border-r flex-shrink-0 bg-white" /> {/* Time Column Header */}
          {days.map(day => (
            <div key={day.toISOString()} className={`flex-1 text-center py-2 border-r last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-blue-50/50' : ''}`}>
              <div className={`text-xs font-semibold ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-500'}`}>
                {format(day, 'EEE', { locale }).toUpperCase()}
              </div>
              <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-blue-700' : 'text-gray-800'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Grid */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="flex">
            {/* Time Column */}
            <div className="w-16 flex-shrink-0 bg-white border-r sticky left-0 z-10">
              {hours.map(hour => (
                <div key={hour} className="h-24 border-b text-xs text-gray-400 text-right pr-2 pt-2 relative">
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Days Columns */}
            {days.map(day => (
              <div key={day.toISOString()} className={`flex-1 border-r last:border-r-0 min-w-[120px] ${isSameDay(day, new Date()) ? 'bg-blue-50/10' : ''}`}>
                {hours.map(hour => {
                  const events = getEventsForCell(day, hour);
                  return (
                    <div key={`${day}-${hour}`} className="h-24 border-b border-gray-100 p-1 relative group hover:bg-gray-50 transition-colors">
                      {events.map((event, idx) => (
                        <div 
                          key={event.id} 
                          className={`
                            absolute left-1 right-1 rounded-md p-1.5 border text-xs shadow-sm cursor-pointer hover:shadow-md transition-all z-10
                            ${event.color}
                          `}
                          style={{ 
                            top: `${(idx * 25) + 4}px`, 
                            zIndex: 10 + idx 
                          }}
                          title={`${event.title} - ${event.subtitle} (${event.status})`}
                        >
                          <div className="font-bold truncate flex items-center gap-1">
                            {event.type === 'walk' ? '🐕' : event.type === 'hotel' ? '🏨' : '🎓'} {event.title}
                          </div>
                          <div className="truncate opacity-80 flex items-center gap-1">
                            <Dog className="w-3 h-3" /> {event.subtitle}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}