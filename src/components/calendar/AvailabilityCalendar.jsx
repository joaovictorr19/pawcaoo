import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isPast } from "date-fns";

export default function AvailabilityCalendar({ availabilityData = [], bookings = [], onDateSelect, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDateStatus = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const availability = availabilityData.find(a => a.date === dateStr);
    const dayBookings = bookings.filter(b => b.walk_date === dateStr || b.session_date === dateStr);

    if (isPast(date) && !isToday(date)) return { status: 'past', label: 'Past' };
    if (availability?.is_fully_booked) return { status: 'booked', label: 'Fully Booked' };
    if (dayBookings.length > 0) return { status: 'partial', label: `${dayBookings.length} Booking${dayBookings.length > 1 ? 's' : ''}` };
    if (availability && !availability.is_fully_booked) return { status: 'available', label: 'Available' };
    return { status: 'unavailable', label: 'Not Set' };
  };

  const getStatusColor = (status) => {
    const colors = {
      available: "bg-green-100 text-green-700 border-green-300",
      partial: "bg-blue-100 text-blue-700 border-blue-300",
      booked: "bg-red-100 text-red-700 border-red-300",
      past: "bg-gray-100 text-gray-400",
      unavailable: "bg-gray-50 text-gray-500"
    };
    return colors[status] || colors.unavailable;
  };

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-green-600" />
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map(date => {
            const { status, label } = getDateStatus(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);

            return (
              <button
                key={date.toString()}
                onClick={() => onDateSelect && onDateSelect(date)}
                disabled={status === 'past'}
                className={`
                  aspect-square p-2 rounded-lg border-2 transition-all
                  ${getStatusColor(status)}
                  ${isSelected ? 'ring-4 ring-green-300' : ''}
                  ${status === 'past' ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 cursor-pointer'}
                  ${isToday(date) ? 'font-bold ring-2 ring-yellow-400' : ''}
                  flex flex-col items-center justify-center
                `}
              >
                <span className="text-lg">{format(date, 'd')}</span>
                {status !== 'past' && status !== 'unavailable' && (
                  <span className="text-xs mt-1 truncate w-full text-center">
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-300" />
            <span className="text-xs text-gray-600">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300" />
            <span className="text-xs text-gray-600">Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300" />
            <span className="text-xs text-gray-600">Fully Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300" />
            <span className="text-xs text-gray-600">Past</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-50 border-2 border-gray-200" />
            <span className="text-xs text-gray-600">Not Set</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}