import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AvailabilityCalendar({ availabilityData = [], bookings = [], onDateSelect, selectedDate }) {
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
    if (availability?.is_fully_booked) return { status: 'booked' };
    if (dayBookings.length > 0) return { status: 'partial', count: dayBookings.length };
    if (availability && !availability.is_fully_booked) return { status: 'available' };
    return { status: 'unavailable' };
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "bg-green-100 border-green-400 text-green-700",
      partial: "bg-blue-100 border-blue-400 text-blue-700",
      booked: "bg-red-100 border-red-400 text-red-700",
      past: "bg-gray-50 border-gray-200 text-gray-400",
      unavailable: "bg-white border-gray-200 text-gray-600"
    };
    return colors[status] || colors.unavailable;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 p-3 md:p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-4">
        {/* Week Days Header - Compact */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
            <div key={idx} className="text-center text-xs font-bold text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid - Compact */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding days */}
          {paddingDays.map((_, idx) => (
            <div key={`pad-${idx}`} className="aspect-square" />
          ))}
          
          {/* Actual days */}
          {daysInMonth.map(date => {
            const { status, count } = getDateStatus(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);

            return (
              <button
                key={date.toString()}
                onClick={() => onDateSelect && status !== 'past' && onDateSelect(date)}
                disabled={status === 'past'}
                className={`
                  aspect-square p-1 rounded-lg border transition-all text-xs md:text-sm
                  ${getStatusColor(status)}
                  ${isSelected ? 'ring-2 ring-green-500 scale-105' : ''}
                  ${status === 'past' ? 'cursor-not-allowed opacity-50' : 'hover:scale-110 cursor-pointer'}
                  ${isToday(date) ? 'font-bold ring-1 ring-yellow-500' : ''}
                  flex flex-col items-center justify-center relative
                `}
              >
                <span className="font-semibold">{format(date, 'd')}</span>
                {count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs bg-blue-600">
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Compact Legend */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-400" />
            <span className="text-xs text-gray-600">Disponível</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-400" />
            <span className="text-xs text-gray-600">Parcial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-400" />
            <span className="text-xs text-gray-600">Lotado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}