import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO, isBefore, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SERVICE_COLORS = {
  boarding: "bg-purple-500",
  daycare: "bg-blue-500",
  grooming: "bg-pink-500",
  walk_with_partner: "bg-orange-500",
  training: "bg-green-500",
};

const SERVICE_LABELS = {
  boarding: "Alojamento",
  daycare: "Creche",
  grooming: "Grooming",
  walk_with_partner: "Passeio",
  training: "Treino",
};

export default function HotelCalendar({ bookings = [], onDayClick, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getBookingsForDay = (day) => {
    return bookings.filter(b => {
      if (!b.checkin_date) return false;
      try {
        const checkin = parseISO(b.checkin_date);
        const checkout = b.checkout_date ? parseISO(b.checkout_date) : checkin;
        return !isBefore(day, checkin) && !isBefore(checkout, day) && !["cancelled", "rejected"].includes(b.status);
      } catch { return false; }
    });
  };

  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="bg-white rounded-2xl border border-purple-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-white font-bold text-sm capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: pt })}
        </h3>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 border-b border-purple-50">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {allDays.map((day, idx) => {
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);

          return (
            <button
              key={idx}
              onClick={() => onDayClick?.(day)}
              className={`min-h-[52px] p-1 text-left transition-all border-b border-r border-slate-50 relative
                ${!isCurrentMonth ? "opacity-30" : ""}
                ${isSelected ? "bg-purple-600 rounded-none" : isTodayDay ? "bg-purple-50" : "hover:bg-purple-50/50"}
              `}
            >
              <span className={`text-xs font-bold block text-center mb-0.5
                ${isSelected ? "text-white" : isTodayDay ? "text-purple-600" : isCurrentMonth ? "text-slate-700" : "text-slate-300"}
              `}>
                {format(day, "d")}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayBookings.slice(0, 2).map((b, i) => (
                  <div key={i} className={`h-1.5 rounded-full ${SERVICE_COLORS[b.service_type] || "bg-slate-400"}`} />
                ))}
                {dayBookings.length > 2 && (
                  <span className="text-[8px] text-slate-400 text-center">+{dayBookings.length - 2}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-slate-50 flex flex-wrap gap-2">
        {Object.entries(SERVICE_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[9px] text-slate-500">{SERVICE_LABELS[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}