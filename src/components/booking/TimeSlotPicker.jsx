import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function TimeSlotPicker({ 
  availabilityData = [], 
  bookings = [], 
  onSlotSelect, 
  selectedDate,
  selectedSlot,
  minDate = new Date()
}) {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  // Generate 7 days from current week start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const getAvailableSlots = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const availability = availabilityData.find(a => a.date === dateStr);
    
    if (!availability || availability.is_fully_booked) return [];
    
    // Filter out booked slots
    const dayBookings = bookings.filter(b => 
      (b.walk_date === dateStr || b.session_date === dateStr) &&
      b.status !== 'cancelled'
    );

    return (availability.time_slots || []).filter(slot => {
      if (!slot.is_available) return false;
      
      // Check if slot conflicts with existing bookings
      const hasConflict = dayBookings.some(booking => {
        const bookingTime = booking.walk_time || booking.session_time;
        return bookingTime === `${slot.start_time}-${slot.end_time}`;
      });
      
      return !hasConflict;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handlePrevWeek = () => {
    const newStart = addDays(currentWeekStart, -7);
    if (newStart >= minDate) {
      setCurrentWeekStart(newStart);
    }
  };

  return (
    <Card className="border-2 border-green-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-green-600" />
            Select Date & Time
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevWeek}
              disabled={currentWeekStart <= minDate}
            >
              ← Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
            >
              Next →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Week Days Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {weekDays.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const slots = getAvailableSlots(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isPast = date < new Date();
            const hasSlots = slots.length > 0;

            return (
              <button
                key={dateStr}
                onClick={() => hasSlots && onSlotSelect(date, null)}
                disabled={isPast || !hasSlots}
                className={`
                  p-3 rounded-xl border-2 transition-all text-center
                  ${isSelected ? 'border-green-500 bg-green-50 ring-2 ring-green-300' : 'border-gray-200'}
                  ${isPast ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
                  ${hasSlots && !isPast ? 'hover:border-green-300 hover:bg-green-50 cursor-pointer' : ''}
                  ${!hasSlots && !isPast ? 'bg-gray-100 cursor-not-allowed' : ''}
                `}
              >
                <div className="text-xs text-gray-600 mb-1">
                  {format(date, 'EEE')}
                </div>
                <div className={`text-lg font-bold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                  {format(date, 'd')}
                </div>
                <div className="text-xs mt-1">
                  {isPast ? (
                    <span className="text-gray-400">Past</span>
                  ) : hasSlots ? (
                    <Badge className="bg-green-100 text-green-700 text-xs px-1 py-0">
                      {slots.length} slots
                    </Badge>
                  ) : (
                    <span className="text-gray-400">Full</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Time Slots */}
        <AnimatePresence mode="wait">
          {selectedDate && (
            <motion.div
              key={format(selectedDate, 'yyyy-MM-dd')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Available Times for {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {getAvailableSlots(selectedDate).map((slot, idx) => {
                  const slotKey = `${slot.start_time}-${slot.end_time}`;
                  const isSelected = selectedSlot === slotKey;
                  
                  return (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => onSlotSelect(selectedDate, slot)}
                      className={`
                        p-4 rounded-xl border-2 transition-all
                        ${isSelected 
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-300' 
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Clock className={`w-4 h-4 ${isSelected ? 'text-green-600' : 'text-gray-600'}`} />
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className={`font-semibold ${isSelected ? 'text-green-700' : 'text-gray-900'}`}>
                        {slot.start_time}
                      </div>
                      <div className="text-xs text-gray-600">
                        to {slot.end_time}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {getAvailableSlots(selectedDate).length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No available slots for this date</p>
                  <p className="text-sm text-gray-500 mt-1">Please select another date</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedDate && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Select a date to see available time slots</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}