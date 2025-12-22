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
      <CardContent className="p-1.5 sm:p-2 md:p-4">
       {/* Week Days Header - Responsive */}
       <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-1.5 md:mb-2">
         {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
           <div key={idx} className="text-center text-[9px] sm:text-[10px] md:text-xs font-bold text-gray-500 py-0.5 md:py-1">
             {day}
           </div>
         ))}
       </div>

       {/* Calendar Grid - Fully Responsive */}
       <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
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
                onClick={() => isClickable && onDateSelect && onDateSelect(date, status)}
                disabled={!isClickable}
                className={`
                  aspect-square p-0.5 sm:p-1 rounded border-2 transition-all 
                  text-[9px] xs:text-[10px] sm:text-xs md:text-sm
                  ${getStatusColor(status)}
                  ${isSelected ? 'ring-2 ring-green-500 scale-105 z-10 shadow-md' : ''}
                  ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md cursor-pointer active:scale-95'}
                  ${isToday(date) ? 'font-extrabold ring-2 ring-blue-500' : ''}
                  flex flex-col items-center justify-center relative
                `}
                title={isInteractive ? (status === 'day_off' ? "🚫 Remover folga" : hasBookingsDay ? "Dia com reservas" : "Marcar folga") : ""}
              >
                <span className="font-bold leading-none">{format(date, 'd')}</span>
                {status === 'day_off' && (
                  <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[10px]">🚫</span>
                )}
                {count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 min-w-0 p-0 text-[8px] sm:text-[9px] bg-blue-600 border border-white text-white flex items-center justify-center shadow-sm">
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Responsive Legend */}
        <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2 mt-2 sm:mt-3 md:mt-4 pt-2 md:pt-3 border-t">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded bg-green-100 border border-green-400" />
            <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">{t('available', language)}</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded bg-orange-100 border border-orange-400" />
            <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">{t('pending', language)}</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded bg-blue-100 border border-blue-400" />
            <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">{t('accepted', language)}</span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded bg-red-100 border border-red-400" />
            <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">{t('fullyBooked', language)}</span>
          </div>
          {isInteractive && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded bg-red-600 border border-red-700" />
              <span className="text-[9px] sm:text-[10px] md:text-xs text-red-700 font-bold">🚫 Folga</span>
            </div>
          )}
          {!isInteractive && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded bg-red-600 border border-red-700" />
              <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 font-medium">🚫 Indisponível</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}