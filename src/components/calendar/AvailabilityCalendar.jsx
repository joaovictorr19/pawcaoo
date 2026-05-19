import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";

export default function AvailabilityCalendar({ 
  availabilityData = [], 
  bookings = [], 
  generalAvailability = null, 
  onDateSelect, 
  selectedDate, 
  locale = pt, 
  walkerEmail,
  isInteractive = false 
}) {
  const { language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = getDay(monthStart);
  const paddingDays = Array(startDay).fill(null);

  // --- A CORREÇÃO MÁGICA ESTÁ AQUI ---
  const getDateStatus = (date) => {
    // 1. Criamos a string simples do dia do calendário (YYYY-MM-DD)
    const calendarDateStr = format(date, 'yyyy-MM-dd');

    // 2. Procuramos na base de dados, mas LIMPAMOS a data antes de comparar
    const availability = availabilityData.find(a => {
        if (!a.date) return false;
        // Se vier "2024-01-20T00:00:00Z", cortamos pelo 'T' para ficar só a data
        const dbDateClean = a.date.includes('T') ? a.date.split('T')[0] : a.date;
        return dbDateClean === calendarDateStr && a.professional_email === walkerEmail;
    });

    const dayBookings = bookings.filter(b => {
        const walkDate = b.walk_date ? (b.walk_date.includes('T') ? b.walk_date.split('T')[0] : b.walk_date) : null;
        const sessionDate = b.session_date ? (b.session_date.includes('T') ? b.session_date.split('T')[0] : b.session_date) : null;
        return walkDate === calendarDateStr || sessionDate === calendarDateStr;
    });

    // Se for dia passado (ontem para trás)
    if (isPast(date) && !isToday(date)) return { status: 'past' };
    
    // PRIORIDADE 1: FOLGA (Bloqueio Total)
    if (availability?.is_day_off) {
      return { status: 'day_off' };
    }
    
    // Outros estados...
    const hasPending = dayBookings.some(b => b.status === 'pending');
    const hasConfirmed = dayBookings.some(b => b.status === 'confirmed' || b.status === 'completed');
    
    if (hasConfirmed) return { status: 'accepted', count: dayBookings.length };
    if (hasPending) return { status: 'pending', count: dayBookings.length };
    if (availability?.is_fully_booked) return { status: 'booked' };
    if (dayBookings.length > 0) return { status: 'partial', count: dayBookings.length };
    if (availability && !availability.is_fully_booked) return { status: 'available' };
    if (generalAvailability && generalAvailability.length > 0) return { status: 'available' };

    return { status: 'unavailable' };
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "bg-green-100 border-green-400 text-green-800 hover:bg-green-200",
      partial: "bg-yellow-100 border-yellow-400 text-yellow-800",
      booked: "bg-red-50 border-red-200 text-red-400 opacity-50 cursor-not-allowed",
      pending: "bg-orange-100 border-orange-400 text-orange-800",
      accepted: "bg-blue-100 border-blue-400 text-blue-800",
      day_off: "bg-red-500 border-red-600 text-white font-bold shadow-inner",
      past: "bg-gray-100 border-gray-200 text-gray-300 opacity-60",
      unavailable: "bg-white border-gray-200 text-gray-400"
    };
    return colors[status] || colors.unavailable;
  };

  return (
    <div className="w-full">
      {/* Header do Calendário */}
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-lg font-bold capitalize text-gray-800">
          {format(currentMonth, 'MMMM yyyy', { locale })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Dias da Semana */}
      <div className="grid grid-cols-7 gap-1 mb-2 text-center">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-xs font-bold text-gray-400">{day}</div>
        ))}
      </div>

      {/* Grid Dias do Mês */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} />
        ))}

        {daysInMonth.map((date) => {
          const { status, count } = getDateStatus(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          
          return (
            <button
              key={date.toString()}
              onClick={() => isInteractive && onDateSelect && onDateSelect(date)}
              disabled={!isInteractive}
              className={`
                relative h-10 md:h-12 w-full rounded-lg border flex flex-col items-center justify-center transition-all duration-200
                ${getStatusColor(status)}
                ${isSelected ? 'ring-2 ring-offset-2 ring-green-500 scale-105 z-10' : ''}
                ${!isInteractive ? 'cursor-default' : ''}
              `}
            >
              <span className={`text-sm ${status === 'day_off' ? 'text-white' : ''}`}>
                {format(date, 'd')}
              </span>
              
              {/* Indicadores visuais */}
              {count > 0 && (
                <div className="absolute bottom-1 right-1 flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border-2 border-green-400" />
          <span className="text-[10px] text-gray-600">Disponível</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-100 border-2 border-blue-400" />
          <span className="text-[10px] text-gray-600">Confirmado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-orange-100 border-2 border-orange-400" />
          <span className="text-[10px] text-gray-600">Pendente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500 border-2 border-red-600" />
          <span className="text-[10px] text-red-700 font-bold">Folga</span>
        </div>
      </div>
    </div>
  );
}