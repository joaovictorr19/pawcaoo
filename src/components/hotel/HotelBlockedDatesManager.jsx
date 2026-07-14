import React, { useState, useMemo } from "react";
import { CalendarPlus, X, CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const formatDatePT = (dateStr) => {
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-PT", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function HotelBlockedDatesManager({ blockedDates = [], onChange }) {
  const [newDate, setNewDate] = useState("");

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const sortedDates = useMemo(() => {
    return [...blockedDates].filter((d) => d >= today).sort();
  }, [blockedDates, today]);

  const addDate = () => {
    if (!newDate) return;
    if (blockedDates.includes(newDate)) {
      setNewDate("");
      return;
    }
    onChange([...blockedDates, newDate].sort());
    setNewDate("");
  };

  const removeDate = (date) => {
    onChange(blockedDates.filter((d) => d !== date));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <CalendarOff className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-xs font-semibold text-slate-600">Folgas e Dias Fechados</p>
      </div>
      <p className="text-[11px] text-slate-400 -mt-1">
        Selecione os dias em que o hotel está fechado. Estas datas aparecem bloqueadas no calendário de reservas e não aceitam pedidos.
      </p>

      <div className="flex gap-2">
        <input
          type="date"
          min={today}
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
        />
        <Button
          type="button"
          onClick={addDate}
          disabled={!newDate}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 shrink-0"
        >
          <CalendarPlus className="w-4 h-4" />
        </Button>
      </div>

      {sortedDates.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sortedDates.map((date) => (
            <div
              key={date}
              className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg pl-2.5 pr-1 py-1.5"
            >
              <span className="text-xs font-semibold text-red-700 capitalize">
                {formatDatePT(date)}
              </span>
              <button
                type="button"
                onClick={() => removeDate(date)}
                className="w-5 h-5 rounded flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3 text-[11px] text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          Sem dias bloqueados. O hotel aceita reservas todos os dias.
        </div>
      )}
    </div>
  );
}