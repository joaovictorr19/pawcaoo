import React from "react";

export default function BookingsFilters({ filters, setFilters, setCurrentPage }) {
  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { value: 'all', label: 'Todos' },
          { value: 'confirmed', label: 'Confirmados' },
          { value: 'in_progress', label: 'Ativos' },
          { value: 'completed', label: 'Concluídos' },
          { value: 'cancelled', label: 'Cancelados' },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setFilters({...filters, status: value}); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all active:scale-95 ${
              filters.status === value
                ? 'bg-orange-500 text-white'
                : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {[{v:'all',l:'🐾 Todos'},{v:'walk',l:'🐕 Passeios'},{v:'training',l:'🎓 Treinos'}].map(({v,l}) => (
          <button
            key={v}
            onClick={() => { setFilters({...filters, type: v}); setCurrentPage(1); }}
            className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all active:scale-95 ${
              filters.type === v
                ? 'bg-white text-slate-900'
                : 'bg-slate-900 border border-white/5 text-slate-400'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </>
  );
}