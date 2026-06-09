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
    <div className="rounded-2xl overflow-hidden shadow-lg shadow-purple-900/10 border border-purple-100">
      {/* Header com gradiente rico */}
      <div className="relative bg-gradient-to-br from-purple-800 via-purple-700 to-purple-500 px-4 py-3 flex items-center justify-between overflow-hidden">
        {/* Decorative orb */}
        <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
          className="relative z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all shadow-sm">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="relative z-10 text-center">
          <h3 className="text-white font-black text-sm capitalize tracking-wide">
            {format(currentMonth, "MMMM yyyy", { locale: pt })}
          </h3>
          <p className="text-purple-200 text-[10px] mt-0.5">🏨 Agenda do Hotel</p>
        </div>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
          className="relative z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all shadow-sm">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 bg-purple-50 border-b border-purple-100">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[10px] font-black text-purple-400 uppercase tracking-widest py-2">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 bg-white">
        {allDays.map((day, idx) => {
          const dayBookings = getBookingsForDay(day);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);
          const hasBookings = dayBookings.length > 0;

          return (
            <button
              key={idx}
              onClick={() => onDayClick?.(day)}
              className={`min-h-[52px] p-1 text-left transition-all border-b border-r border-purple-50 relative group
                ${!isCurrentMonth ? "opacity-25" : ""}
                ${isSelected
                  ? "bg-gradient-to-br from-purple-700 to-purple-500 shadow-inner"
                  : isTodayDay
                    ? "bg-purple-50"
                    : hasBookings
                      ? "hover:bg-purple-50 bg-white"
                      : "hover:bg-purple-50/40 bg-white"}
              `}
            >
              <span className={`text-xs font-black block text-center mb-0.5 transition-all
                ${isSelected ? "text-white" : isTodayDay ? "text-purple-700" : isCurrentMonth ? "text-slate-700" : "text-slate-300"}
              `}>
                {isTodayDay && !isSelected && (
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500 block" />
                )}
                {format(day, "d")}
              </span>
              <div className="flex flex-col gap-0.5 px-0.5">
                {dayBookings.slice(0, 3).map((b, i) => (
                  <div key={i} className={`h-1 rounded-full ${SERVICE_COLORS[b.service_type] || "bg-slate-400"} ${isSelected ? "opacity-80" : ""}`} />
                ))}
                {dayBookings.length > 3 && (
                  <span className={`text-[7px] font-bold text-center ${isSelected ? "text-white/70" : "text-purple-400"}`}>+{dayBookings.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-white border-t border-purple-100 flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(SERVICE_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${color} shadow-sm`} />
            <span className="text-[9px] text-slate-500 font-medium">{SERVICE_LABELS[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}