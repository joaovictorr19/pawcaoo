import React, { useState } from "react";
import { AlertCircle, History, Euro, Calendar, PawPrint, FileText, HeartPulse, Crown } from "lucide-react";

export default function ReturningGuestInfo({ guestProfile, onPrefillDog }) {
  const [expanded, setExpanded] = useState(true);

  if (!guestProfile) return null;

  const isVip = guestProfile.is_vip === true;
  const totalStays = guestProfile.total_stays || 0;
  const totalSpent = guestProfile.total_spent || 0;
  const lastStay = guestProfile.last_stay_date;
  const generalNotes = guestProfile.general_notes;
  const dogs = guestProfile.dogs || [];

  // Only show if there's meaningful recurring data OR VIP
  const hasDogNotes = dogs.some(d => d.behavioral_profile || d.persistent_medical_notes);
  if (!isVip && totalStays === 0 && !generalNotes && !hasDogNotes) return null;

  const formatDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  return (
    <div className={`rounded-xl p-3 space-y-2.5 border ${isVip ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300" : "bg-amber-50 border-amber-200"}`}>
      {/* VIP Banner */}
      {isVip && (
        <div className="flex items-center gap-2 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2">
          <Crown className="w-4 h-4 text-amber-600" />
          <p className="text-xs font-bold text-amber-800">👑 Cliente VIP</p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center">
            {isVip ? <Crown className="w-3.5 h-3.5 text-amber-600" /> : <History className="w-3.5 h-3.5 text-amber-600" />}
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900">{isVip ? "Cliente VIP" : "Cliente Recorrente"}</p>
            <p className="text-[10px] text-amber-600">
              {totalStays} {totalStays === 1 ? "estadia anterior" : "estadias anteriores"}
              {lastStay && ` · última em ${formatDate(lastStay)}`}
            </p>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)}
          className="text-amber-500 hover:text-amber-700 text-[10px] font-semibold">
          {expanded ? "Ocultar" : "Ver"}
        </button>
      </div>

      {expanded && (
        <>
          {/* Stats */}
          {totalSpent > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-700">
              <Euro className="w-3 h-3" />
              <span>Total gasto: €{totalSpent.toFixed(2)}</span>
            </div>
          )}

          {/* General Notes */}
          {generalNotes && (
            <div className="bg-white/70 rounded-lg p-2.5 border border-amber-100">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Notas Gerais</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{generalNotes}</p>
            </div>
          )}

          {/* Per-dog notes */}
          {dogs.filter(d => d.behavioral_profile || d.persistent_medical_notes).map((dog, i) => (
            <div key={i} className="bg-white/70 rounded-lg p-2.5 border border-amber-100 space-y-2">
              <div className="flex items-center gap-1.5">
                <PawPrint className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">{dog.dog_name || `Cão ${i + 1}`}</span>
                {dog.dog_breed && <span className="text-[10px] text-slate-400">· {dog.dog_breed}</span>}
              </div>
              {dog.behavioral_profile && (
                <div className="flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-amber-600">Comportamento</p>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{dog.behavioral_profile}</p>
                  </div>
                </div>
              )}
              {dog.persistent_medical_notes && (
                <div className="flex items-start gap-1.5">
                  <HeartPulse className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-semibold text-rose-600">Notas Médicas</p>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{dog.persistent_medical_notes}</p>
                  </div>
                </div>
              )}
              {/* Pre-fill button */}
              {onPrefillDog && (
                <button
                  onClick={() => onPrefillDog(dog)}
                  className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold underline"
                >
                  Pré-preencher dados deste cão
                </button>
              )}
            </div>
          ))}

          {/* Privacy notice */}
          <div className="flex items-center gap-1 pt-0.5">
            <AlertCircle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <p className="text-[9px] text-amber-500 italic">Notas privadas do hotel — visíveis apenas para a equipa.</p>
          </div>
        </>
      )}
    </div>
  );
}