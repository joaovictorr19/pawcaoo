import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { isDateBlocked } from '@/utils/portugueseHolidays';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export default function HotelMiniCalendar({ daysOff = [], checkinPolicy = 'all_days', onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysOffSet = new Set(
    daysOff.map(d => (d.date?.split('T')[0] || '').trim())
  );

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const handleDayClick = (day) => {
    const dateObj = new Date(year, month, day, 12, 0, 0, 0);
    const dateStr = dateObj.toISOString().split('T')[0];

    if (dateObj < today) return;
    if (daysOffSet.has(dateStr)) return;
    if (isDateBlocked(dateObj, checkinPolicy)) return;

    if (onDateSelect) onDateSelect(dateStr);
  };

  const cells = [];
  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    dateObj.setHours(0, 0, 0, 0);
    const dateStr = new Date(year, month, day, 12, 0, 0, 0).toISOString().split('T')[0];

    const isPast = dateObj < today;
    const isToday = dateObj.getTime() === today.getTime();
    const isDayOff = daysOffSet.has(dateStr);
    const isBlocked = !isPast && isDateBlocked(new Date(year, month, day, 12, 0, 0, 0), checkinPolicy);
    const isUnavailable = isPast || isDayOff || isBlocked;

    cells.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        disabled={isUnavailable}
        className={`aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
          isUnavailable
            ? 'text-red-400 bg-red-50 cursor-not-allowed line-through'
            : 'text-slate-700 hover:bg-slate-900 hover:text-white active:scale-90'
        } ${isToday ? 'ring-2 ring-slate-400' : ''}`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-1.5">
          <CalendarDays className="w-3 h-3" /> Disponibilidade
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={handlePrevMonth} className="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <span className="text-xs font-bold text-slate-700 min-w-[90px] text-center capitalize">
            {currentMonth.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[8px] font-black uppercase text-slate-300">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>

      <div className="flex items-center gap-3 mt-3 text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-red-50 border border-red-200" /> Folga/Fechado
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-slate-900" /> Disponível
        </span>
      </div>
    </div>
  );
}