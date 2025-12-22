import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function AvailabilityCalendar({ 
  availabilityData = [], 
  bookings = [], 
  generalAvailability = null, 
  onDateSelect, 
  selectedDate, 
  locale = pt, 
  walkerEmail,
  isInteractive = false // New prop to enable managing time off
}) {
  const { language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add empty cells for alignment
  const startDay = getDay(monthStart);
  const paddingDays = Array(startDay).fill(null);

  const getDateStatus = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const availability = availabilityData.find(a => a.date === dateStr);
    const dayBookings = bookings.filter(b => b.walk_date === dateStr || b.session_date === dateStr);

    if (isPast(date) && !isToday(date)) return { status: 'past' };
    
    // PRIORITY 1: Day-off blocks everything (checks walker email match)
    if (availability?.is_day_off && (!walkerEmail || availability.professional_email === walkerEmail)) {
      return { status: 'day_off' };
    }
    
    // Logic for Pending vs Accepted visualization
    const hasPending = dayBookings.some(b => b.status === 'pending');
    const hasConfirmed = dayBookings.some(b => b.status === 'confirmed' || b.status === 'completed');
    
    // PRIORITY 2: Confirmed bookings
    if (hasConfirmed) return { status: 'accepted', count: dayBookings.length };
    
    // PRIORITY 3: Pending bookings
    if (hasPending) return { status: 'pending', count: dayBookings.length };
    
    // PRIORITY 4: Manually marked as fully booked
    if (availability?.is_fully_booked) return { status: 'booked' };
    
    // PRIORITY 5: Has some bookings
    if (dayBookings.length > 0) return { status: 'partial', count: dayBookings.length };
    
    // PRIORITY 6: Specific availability defined
    if (availability && !availability.is_fully_booked) return { status: 'available' };
    
    // PRIORITY 7: Fallback to General Availability (Profile)
    if (generalAvailability && generalAvailability.length > 0) {
        return { status: 'available' }; 
    }

    return { status: 'unavailable' };
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "bg-green-100 border-green-400 text-green-800 hover:bg-green-200",
      partial: "bg-yellow-100 border-yellow-400 text-yellow-800",
      booked: "bg-red-100 border-red-400 text-red-800",
      pending: "bg-orange-100 border-orange-400 text-orange-800",
      accepted: "bg-blue-100 border-blue-400 text-blue-800",
      day_off: "bg-red-600 border-red-700 text-white font-bold shadow-md",
      past: "bg-gray-100 border-gray-200 text-gray-300",
      unavailable: "bg-white border-gray-200 text-gray-400"
    };
    return colors[status] || colors.unavailable;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 p-2 md:p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base">
            <CalendarIcon className="w-3.5 h-3.5 md:w-5 md:h-5 text-green-600" />
            <span className="truncate">{format(currentMonth, 'MMMM yyyy', { locale: locale })}</span>
          </CardTitle>
          <div className="flex gap-0.5 md:gap-1 flex-shrink-0">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-7 w-7 md:h-8 md:w-8"
            >
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-7 w-7 md:h-8 md:w-8"
            >
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-3 md:p-4">
        {/* Week Days Header - Fully Responsive */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5 mb-1.5 md:mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => (
            <div key={idx} className="text-center text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-600 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid - Fully Responsive */}
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-1.5">
          {/* Padding days */}
          {paddingDays.map((_, idx) => (
            <div key={`pad-${idx}`} className="aspect-square" />
          ))}
          
          {/* Actual days */}
          {daysInMonth.map(date => {
            const { status, count } = getDateStatus(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);

            // In interactive mode (professional dashboard), allow clicking on:
            // - day_off (to remove it)
            // - available days (to mark day off)
            // - unavailable days (to mark day off)
            // DON'T allow clicking on past or days with bookings
            
            const isPastDay = status === 'past';
            const hasBookingsDay = status === 'accepted' || status === 'pending' || status === 'booked' || status === 'partial';
            
            const isClickable = isInteractive 
              ? (!isPastDay && !hasBookingsDay) 
              : (status !== 'past' && status !== 'day_off' && status !== 'booked'); 
            
            return (
              <button
                key={date.toString()}
                onClick={(e) => {
                  e.preventDefault();
                  if (isClickable && onDateSelect) {
                    console.log('📅 Day clicked:', format(date, 'yyyy-MM-dd'), 'Status:', status);
                    onDateSelect(date, status);
                  }
                }}
                disabled={!isClickable}
                type="button"
                className={`
                  aspect-square p-1 sm:p-1.5 md:p-2 rounded-md border-2 transition-all 
                  text-[10px] xs:text-xs sm:text-sm md:text-base
                  font-bold
                  ${getStatusColor(status)}
                  ${isSelected ? 'ring-2 ring-green-500 scale-110 z-10 shadow-lg' : ''}
                  ${!isClickable ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 hover:shadow-lg cursor-pointer active:scale-95 hover:z-10'}
                  ${isToday(date) ? 'ring-2 ring-blue-500 shadow-md' : ''}
                  flex flex-col items-center justify-center relative
                  select-none
                `}
                title={isInteractive ? (status === 'day_off' ? "🚫 Remover folga" : "Marcar folga") : ""}
              >
                <span className="leading-none">{format(date, 'd')}</span>
                {status === 'day_off' && (
                  <span className="absolute top-0 left-0 text-[10px] sm:text-xs">🚫</span>
                )}
                {count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 min-w-0 p-0 text-[9px] sm:text-[10px] bg-blue-600 border border-white text-white flex items-center justify-center shadow-md font-bold">
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Responsive Legend */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 mt-3 md:mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded bg-green-100 border-2 border-green-400" />
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-700 font-medium">{t('available', language)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded bg-orange-100 border-2 border-orange-400" />
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-700 font-medium">{t('pending', language)}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded bg-blue-100 border-2 border-blue-400" />
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-700 font-medium">Confirmado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded bg-red-600 border-2 border-red-700" />
            <span className="text-[10px] sm:text-xs md:text-sm text-red-700 font-bold">🚫 Folga</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}