import React, { useState } from "react";
import { ClipboardEdit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BehavioralNotes({ booking, onUpdateBooking }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(booking.behavioral_notes || "");

  const handleSave = () => {
    onUpdateBooking(booking.id, { behavioral_notes: notes });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <ClipboardEdit className="w-3 h-3" /> Notas Comportamentais
          </p>
          <div className="flex gap-1">
            <button onClick={() => setEditing(false)}
              className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleSave}
              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-emerald-600">
              <Save className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          autoFocus
          placeholder="Como o animal se comportou: comeu bem? socializou? ansiedade?..."
          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 resize-none bg-white"
        />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <ClipboardEdit className="w-3 h-3" /> Notas Comportamentais
        </p>
        <button onClick={() => setEditing(true)}
          className="text-[10px] text-slate-500 font-semibold hover:text-slate-700 flex items-center gap-0.5">
          <ClipboardEdit className="w-3 h-3" /> {booking.behavioral_notes ? "Editar" : "Adicionar"}
        </button>
      </div>
      {booking.behavioral_notes ? (
        <p className="text-xs text-slate-600">{booking.behavioral_notes}</p>
      ) : (
        <p className="text-xs text-slate-400 italic">Sem notas registadas</p>
      )}
    </div>
  );
}