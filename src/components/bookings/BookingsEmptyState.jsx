import React from "react";

export default function BookingsEmptyState() {
  return (
    <div className="text-center py-16 bg-slate-900 rounded-3xl border border-white/5">
      <div className="text-5xl mb-4">📭</div>
      <h3 className="text-lg font-black text-white">Nenhuma reserva</h3>
      <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Tente ajustar os filtros ou crie uma nova reserva.</p>
    </div>
  );
}