import React from "react";
import { MapPin, Clock, KeyRound } from "lucide-react";

const DAYS = [
  { key: "monday", label: "Seg" },
  { key: "tuesday", label: "Ter" },
  { key: "wednesday", label: "Qua" },
  { key: "thursday", label: "Qui" },
  { key: "friday", label: "Sex" },
  { key: "saturday", label: "Sáb" },
  { key: "sunday", label: "Dom" },
];

export function formatWeeklySchedule(ws) {
  if (!ws) return "";
  if (typeof ws === "string") return ws;
  const open = DAYS.filter((d) => ws[d.key]?.open);
  if (!open.length) return "";
  return open
    .map((d) => `${d.label} ${ws[d.key].open_time || ""}–${ws[d.key].close_time || ""}`)
    .join(" · ");
}

export default function PickupInfoBlock({ address, city, postal_code, notes, schedule, code }) {
  const sched = typeof schedule === "object" ? formatWeeklySchedule(schedule) : schedule;
  return (
    <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3 space-y-2">
      {code && (
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-teal-600 shrink-0" />
          <p className="text-sm font-bold text-teal-800">Código de recolha: {code}</p>
        </div>
      )}
      {address && (
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 leading-snug">{address}</p>
            {(postal_code || city) && (
              <p className="text-xs text-slate-500 mt-0.5">
                {postal_code} {city}
              </p>
            )}
          </div>
        </div>
      )}
      {sched && (
        <div className="flex items-start gap-2">
          <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-700">{sched}</p>
        </div>
      )}
      {notes && <p className="text-xs text-slate-500 pl-6">{notes}</p>}
    </div>
  );
}