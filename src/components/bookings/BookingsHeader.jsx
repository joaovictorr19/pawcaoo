import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function BookingsHeader({ allBookings }) {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total', value: allBookings.length, color: 'text-white' },
    { label: 'Ativos', value: allBookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length, color: 'text-orange-400' },
    { label: 'Concluídos', value: allBookings.filter(b => b.status === 'completed').length, color: 'text-green-400' },
  ];

  return (
    <header className="bg-slate-950 text-white p-6 rounded-b-[2.5rem] shadow-xl mb-6">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-black italic">Minhas Reservas 📅</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passeios & Treinos</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(createPageUrl('Home'))}
              className="px-3 py-2 rounded-2xl border border-slate-700 text-slate-300 hover:border-white hover:text-white transition-all active:scale-95 text-xs font-bold"
            >
              + Passeio
            </button>
            <button
              onClick={() => navigate(createPageUrl('Trainers'))}
              className="px-3 py-2 rounded-2xl bg-orange-500 hover:bg-orange-400 text-white transition-all active:scale-95 text-xs font-bold"
            >
              + Treino
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-slate-900 rounded-2xl p-3 border border-white/5 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}