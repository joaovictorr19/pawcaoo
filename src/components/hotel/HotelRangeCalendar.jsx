import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
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
      cellClass = 'text-red-300 bg-red-50/60 cursor-not-allowed line-through';
    } else if (isStart || isEnd) {
      cellClass = 'bg-gradient-to-b from-sky-300 to-sky-400 text-slate-700 font-black shadow-sm shadow-sky-300/50';
    } else if (inRange) {
      cellClass = 'bg-gradient-to-b from-sky-200 to-sky-300 text-slate-600';
    } else {
      cellClass = 'bg-white text-slate-600 border border-slate-100 shadow-sm hover:bg-sky-50';
    }

    cells.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        onMouseEnter={() => setHoverDate(dateStr)}
        onMouseLeave={() => setHoverDate('')}
        disabled={isUnavailable}
        className={`h-8 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center relative ${cellClass} ${!isUnavailable ? 'active:scale-90' : ''}`}
      >
        {day}
      </button>
    );
  }

  const fmtDate = (str) => {
    if (!str) return '—';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className={`w-full max-w-[300px] mx-auto ${className}`}>
      {/* Check-in / Check-out pills */}
      <div className="flex items-end gap-2 mb-4">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">Check-in</p>
          <div className="h-9 rounded-lg bg-gradient-to-b from-sky-100 to-sky-200 border border-sky-200 flex items-center justify-center text-xs font-bold text-slate-600">
            {fmtDate(checkinDate)}
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500 mb-2.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">Check-out</p>
          <div className="h-9 rounded-lg bg-gradient-to-b from-sky-100 to-sky-200 border border-sky-200 flex items-center justify-center text-xs font-bold text-slate-600">
            {fmtDate(checkoutDate)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <button onClick={handlePrevMonth} className="w-6 h-6 rounded-lg hover:bg-sky-50 flex items-center justify-center transition-colors">
          <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <span className="text-xs font-bold text-slate-700 capitalize">
          {currentMonth.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={handleNextMonth} className="w-6 h-6 rounded-lg hover:bg-sky-50 flex items-center justify-center transition-colors">
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-slate-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>
    </div>
  );
}