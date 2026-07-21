import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isDateBlocked } from '@/utils/portugueseHolidays';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/**
 * Airline-style range calendar: click first date = check-in, click second = check-out.
 * Days off and blocked dates (policy) show in red and are not clickable.
 */
export default function HotelRangeCalendar({
  daysOff = [],
  checkinPolicy = 'all_days',
  checkinDate: controlledCheckin = '',
  checkoutDate: controlledCheckout = '',
  onRangeSelect,
  className = '',
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoverDate, setHoverDate] = useState('');
  const [internalCheckin, setInternalCheckin] = useState(controlledCheckin);
  const [internalCheckout, setInternalCheckout] = useState(controlledCheckout);

  // Sync internal state when controlled props change externally (e.g. parent reset)
  useEffect(() => {
    setInternalCheckin(controlledCheckin);
  }, [controlledCheckin]);

  useEffect(() => {
    setInternalCheckout(controlledCheckout);
  }, [controlledCheckout]);

  const checkinDate = internalCheckin;
  const checkoutDate = internalCheckout;

  const updateRange = (ci, co) => {
    setInternalCheckin(ci);
    setInternalCheckout(co);
    onRangeSelect?.(ci, co);
  };

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

  const toDateStr = (y, m, d) => new Date(y, m, d, 12, 0, 0, 0).toISOString().split('T')[0];

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const handleDayClick = (day) => {
    const dateStr = toDateStr(year, month, day);
    const dateObj = new Date(year, month, day, 12, 0, 0, 0);

    if (dateObj < today) return;
    if (daysOffSet.has(dateStr)) return;
    if (isDateBlocked(dateObj, checkinPolicy)) return;

    // If no checkin yet, or both dates set → start fresh with checkin
    if (!checkinDate || (checkinDate && checkoutDate)) {
      updateRange(dateStr, '');
      return;
    }

    // If clicking same date as checkin → reset and start over with new checkin
    if (dateStr === checkinDate) {
      updateRange(dateStr, '');
      return;
    }

    // If clicking a date before checkin → make it the new checkin
    if (dateStr < checkinDate) {
      updateRange(dateStr, '');
      return;
    }

    // Valid checkout date
    updateRange(checkinDate, dateStr);
  };

  // Check if a date is within the selected range (for highlighting)
  const isInRange = (dateStr) => {
    if (!checkinDate) return false;
    const end = checkoutDate || hoverDate;
    if (!end) return false;
    if (end <= checkinDate) return false;
    return dateStr > checkinDate && dateStr < end;
  };

  const isRangeStart = (dateStr) => checkinDate === dateStr;
  const isRangeEnd = (dateStr) => checkoutDate === dateStr;

  const cells = [];
  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`empty-${i}`} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    dateObj.setHours(0, 0, 0, 0);
    const dateStr = toDateStr(year, month, day);

    const isPast = dateObj < today;
    const isDayOff = daysOffSet.has(dateStr);
    const isBlocked = !isPast && isDateBlocked(new Date(year, month, day, 12, 0, 0, 0), checkinPolicy);
    const isUnavailable = isPast || isDayOff || isBlocked;
    const inRange = isInRange(dateStr);
    const isStart = isRangeStart(dateStr);
    const isEnd = isRangeEnd(dateStr);

    let cellClass = '';

    if (isUnavailable) {
      cellClass = 'text-red-400 bg-red-50 cursor-not-allowed line-through';
    } else if (isStart || isEnd) {
      cellClass = 'bg-slate-900 text-white font-black';
    } else if (inRange) {
      cellClass = 'bg-slate-200 text-slate-700';
    } else {
      cellClass = 'text-slate-700 hover:bg-slate-100';
    }

    cells.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        onMouseEnter={() => setHoverDate(dateStr)}
        onMouseLeave={() => setHoverDate('')}
        disabled={isUnavailable}
        className={`h-9 md:h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative ${cellClass} ${isStart ? 'rounded-r-none' : ''} ${isEnd ? 'rounded-l-none' : ''} ${inRange ? 'rounded-none' : ''} ${!isUnavailable ? 'active:scale-90' : ''}`}
      >
        {day}
      </button>
    );
  }

  const instruction = !checkinDate
    ? 'Toque para selecionar a data de entrada'
    : !checkoutDate
      ? 'Toque para selecionar a data de saída'
      : 'Datas confirmadas ✓';

  const instructionColor = !checkinDate
    ? 'text-slate-500'
    : !checkoutDate
      ? 'text-slate-900 font-bold'
      : 'text-emerald-600 font-bold';

  return (
    <div className={`w-full ${className}`}>
      <div className={`text-center text-[11px] mb-2 transition-colors ${instructionColor}`}>
        {instruction}
      </div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={handlePrevMonth} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-bold text-slate-800 capitalize">
          {currentMonth.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={handleNextMonth} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[9px] font-black uppercase text-slate-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>

      <div className="flex items-center gap-3 mt-2.5 text-[9px] text-slate-400 flex-wrap">
        <span className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-slate-900" /> Selecionado
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-slate-200" /> Intervalo
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-red-50 border border-red-200" /> Fechado
        </span>
      </div>
    </div>
  );
}