import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Utensils, Pill, Repeat, CheckCircle2, Circle, X, ShieldCheck
} from "lucide-react";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };
const SIZE_COLORS = {
  small: "bg-sky-50 text-sky-700 border-sky-200",
  medium: "bg-emerald-50 text-emerald-700 border-emerald-200",
  large: "bg-amber-50 text-amber-700 border-amber-200",
  extra_large: "bg-rose-50 text-rose-700 border-rose-200"
};

const CHECK_ITEMS = [
  { key: "diet_verified", label: "Dieta", icon: Utensils, field: "diet", color: "emerald" },
  { key: "medications_verified", label: "Medicamentos", icon: Pill, field: "medications", color: "rose" },
  { key: "routine_verified", label: "Rotina", icon: Repeat, field: "routine", color: "blue" },
];

export default function CheckinChecklist({ booking, onConfirm, onClose }) {
  const dogs = booking.dogs || [];
  const existingChecklist = booking.checkin_checklist || [];

  const [checklist, setChecklist] = useState(() => {
    return dogs.map(dog => {
      const existing = existingChecklist.find(c => c.dog_name === dog.dog_name) || {};
      return {
        dog_name: dog.dog_name,
        diet_verified: existing.diet_verified || false,
        medications_verified: existing.medications_verified || false,
        routine_verified: existing.routine_verified || false,
      };
    });
  });

  const toggleItem = (dogIdx, itemKey) => {
    setChecklist(prev => prev.map((entry, i) =>
      i === dogIdx ? { ...entry, [itemKey]: !entry[itemKey] } : entry
    ));
  };

  const allChecked = useMemo(() => {
    return checklist.every(entry =>
      CHECK_ITEMS.every(item => {
        const dog = dogs[checklist.indexOf(entry)];
        if (!dog?.[item.field]) return true;
        return entry[item.key];
      })
    );
  }, [checklist, dogs]);

  const handleConfirm = () => {
    const verified_at = new Date().toISOString();
    const finalChecklist = checklist.map(entry => ({
      ...entry,
      verified_at,
      verified_by: "staff",
    }));
    onConfirm(finalChecklist);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Checklist de Entrada</h3>
              <p className="text-[10px] text-slate-400">Confirme os cuidados de cada animal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Dogs checklist */}
        <div className="p-4 space-y-4">
          {dogs.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Sem animais registados nesta reserva.
            </div>
          )}

          {dogs.map((dog, dogIdx) => {
            const entry = checklist[dogIdx];
            const hasAnyCare = dog.diet || dog.medications || dog.routine;

            return (
              <div key={dogIdx} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                {/* Dog header */}
                <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-2">
                  <span className="text-base">🐕</span>
                  <p className="font-semibold text-slate-800 text-sm flex-1">{dog.dog_name}</p>
                  {dog.dog_size && (
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${SIZE_COLORS[dog.dog_size] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {SIZE_LABELS[dog.dog_size] || dog.dog_size}
                    </span>
                  )}
                </div>

                {/* Checklist items */}
                <div className="p-3 space-y-2">
                  {!hasAnyCare && (
                    <p className="text-xs text-slate-400 italic text-center py-2">
                      Sem informações de cuidados registadas
                    </p>
                  )}
                  {CHECK_ITEMS.map(item => {
                    const ItemIcon = item.icon;
                    const hasData = dog[item.field];
                    if (!hasData) return null;

                    const isChecked = entry[item.key];
                    const colorMap = {
                      emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: "text-emerald-500", activeBg: "bg-emerald-500" },
                      rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-500", activeBg: "bg-rose-500" },
                      blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-500", activeBg: "bg-blue-500" },
                    };
                    const c = colorMap[item.color];

                    return (
                      <button
                        key={item.key}
                        onClick={() => toggleItem(dogIdx, item.key)}
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg border transition-all text-left ${
                          isChecked
                            ? `${c.bg} ${c.border}`
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {isChecked
                            ? <CheckCircle2 className={`w-4 h-4 ${c.icon}`} />
                            : <Circle className="w-4 h-4 text-slate-300" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <ItemIcon className={`w-3 h-3 ${isChecked ? c.icon : "text-slate-400"}`} />
                            <p className={`text-xs font-semibold ${isChecked ? c.text : "text-slate-600"}`}>
                              {item.label} conferida
                            </p>
                          </div>
                          <p className={`text-[11px] mt-0.5 ${isChecked ? c.text : "text-slate-500"}`}>
                            {hasData}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-2">
          <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-semibold" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl text-xs font-semibold disabled:opacity-40"
            disabled={!allChecked}
            onClick={handleConfirm}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Confirmar Check-in
          </Button>
        </div>
        {!allChecked && (
          <p className="text-[10px] text-slate-400 text-center pb-2 px-4">
            Marque todos os itens para confirmar o check-in
          </p>
        )}
      </motion.div>
    </div>
  );
}