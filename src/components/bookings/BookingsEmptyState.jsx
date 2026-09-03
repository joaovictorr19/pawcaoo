import React from "react";

export default function BookingsEmptyState() {
  return (
    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/70 shadow-sm">
      <div className="text-5xl mb-4">📭</div>
      <h3 className="text-lg font-black text-slate-900">Nenhuma reserva</h3>
      <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Tente ajustar os filtros ou crie uma nova reserva.</p>
    </div>
  );
}