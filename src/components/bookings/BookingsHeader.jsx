import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus } from "lucide-react";

export default function BookingsHeader({ allBookings }) {
  const navigate = useNavigate();

  const stats = [
    { label: 'Total', value: allBookings.length },
    { label: 'Ativos', value: allBookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length },
    { label: 'Concluídos', value: allBookings.filter(b => b.status === 'completed').length },
  ];

  return (
    <header className="bg-gradient-to-br from-[#0e9485] to-[#207373] text-white p-6 rounded-b-[2.5rem] shadow-xl mb-6">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-black">Minhas Reservas 📅</h1>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Passeios · Treinos · Hotel</p>
          </div>
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="px-4 py-2 rounded-full bg-white text-[#1a1a1a] hover:shadow-lg transition-all active:scale-95 text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Reservar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-2xl p-3 text-center">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-[10px] text-white/70 uppercase tracking-wider font-bold">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}