import React from "react";
import { Clock, Calendar, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const durations = [
  { value: 0.5, label: "30 min" },
  { value: 1, label: "1 hora" },
  { value: 1.5, label: "1h 30min" },
  { value: 2, label: "2 horas" }
];

const timeSlots = [
  { value: "morning", label: "🌅 Manhã", sub: "07:00 - 12:00" },
  { value: "afternoon", label: "☀️ Tarde", sub: "12:00 - 18:00" },
  { value: "evening", label: "🌙 Noite", sub: "18:00 - 21:00" }
];

export default function WalkDetailsForm({ details, onChange }) {
  return (
    <div className="space-y-5">
      {/* Date */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Calendar className="w-4 h-4 text-[#0d9483]" />
          Data do Passeio
        </label>
        <input
          type="date"
          value={details.walk_date}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => onChange("walk_date", e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9483]/40"
        />
      </div>

      {/* Time slot */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Clock className="w-4 h-4 text-[#0d9483]" />
          Período Preferido
        </label>
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map((slot) => (
            <button
              key={slot.value}
              onClick={() => onChange("walk_time", slot.value)}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border-2 text-xs transition-all",
                details.walk_time === slot.value
                  ? "border-[#0d9483] bg-[#0d9483]/5 text-[#0d9483]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              )}
            >
              <span className="text-base">{slot.label.split(" ")[0]}</span>
              <span className="font-semibold">{slot.label.split(" ")[1]}</span>
              <span className="text-gray-400 text-[10px] mt-0.5">{slot.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Clock className="w-4 h-4 text-[#0d9483]" />
          Duração
        </label>
        <div className="grid grid-cols-4 gap-2">
          {durations.map((d) => (
            <button
              key={d.value}
              onClick={() => onChange("duration_hours", d.value)}
              className={cn(
                "py-3 rounded-xl border-2 text-sm font-semibold transition-all",
                details.duration_hours === d.value
                  ? "border-[#0d9483] bg-[#0d9483] text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <FileText className="w-4 h-4 text-[#0d9483]" />
          Notas Especiais
          <span className="text-gray-400 font-normal text-xs">(opcional)</span>
        </label>
        <textarea
          value={details.special_notes}
          onChange={(e) => onChange("special_notes", e.target.value)}
          placeholder="Ex: O Rex é tímido com outros cães, prefere parques mais tranquilos..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9483]/40 placeholder-gray-400"
        />
      </div>
    </div>
  );
}