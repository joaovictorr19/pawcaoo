import React from "react";

export default function BookingsFilters({ filters, setFilters, setCurrentPage }) {
  const statusFilters = [
    { value: 'all', label: 'Todos' },
    { value: 'confirmed', label: 'Confirmados' },
    { value: 'in_progress', label: 'Ativos' },
    { value: 'completed', label: 'Concluídos' },
    { value: 'cancelled', label: 'Cancelados' },
  ];

  const typeFilters = [
    { value: 'all', label: 'Todos', icon: '🐾' },
    { value: 'walk', label: 'Passeios', icon: '🐕' },
    { value: 'training', label: 'Treinos', icon: '🎓' },
    { value: 'hotel', label: 'Hotel', icon: '🏨' },
  ];

  return (
    <div className="space-y-3">
      {/* Status filters - horizontal scroll on mobile, wrap on desktop */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {statusFilters.map(({ value, label }) => {
          const active = filters.status === value;
          return (
            <button
              key={value}
              onClick={() => { setFilters({...filters, status: value}); setCurrentPage(1); }}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide whitespace-nowrap transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-teal-500 text-white shadow-sm shadow-teal-900/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Type filters - grid 4 columns */}
      <div className="grid grid-cols-4 gap-1.5">
        {typeFilters.map(({ value, label, icon }) => {
          const active = filters.type === value;
          return (
            <button
              key={value}
              onClick={() => { setFilters({...filters, type: value}); setCurrentPage(1); }}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700/80'
              }`}
            >
              <span className="text-sm leading-none">{icon}</span>
              <span className="text-[10px] font-bold leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}