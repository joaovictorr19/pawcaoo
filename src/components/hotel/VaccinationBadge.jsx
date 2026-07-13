import React from "react";
import { Syringe, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";

export default function VaccinationBadge({ dogs = [] }) {
  const dogsWithVaccine = dogs.filter(d => d.vaccine_expiry);

  if (dogsWithVaccine.length === 0) {
    return (
      <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[10px] font-semibold text-amber-700">Sem vacina registada</span>
      </div>
    );
  }

  const expired = [];
  const expiringSoon = [];
  const valid = [];

  dogsWithVaccine.forEach(d => {
    try {
      const expDate = parseISO(d.vaccine_expiry);
      const daysLeft = differenceInDays(expDate, new Date());
      if (daysLeft < 0) expired.push(d);
      else if (daysLeft <= 30) expiringSoon.push(d);
      else valid.push(d);
    } catch {
      // ignore parse errors
    }
  });

  const hasIssue = expired.length > 0 || expiringSoon.length > 0;

  return (
    <div className="space-y-1">
      {expired.length > 0 && (
        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
          <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
          <span className="text-[10px] font-semibold text-red-700">
            Vacina expirada: {expired.map(d => d.dog_name).join(", ")}
          </span>
        </div>
      )}
      {expiringSoon.length > 0 && (
        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
          <Syringe className="w-3 h-3 text-orange-500 shrink-0" />
          <span className="text-[10px] font-semibold text-orange-700">
            Expira em breve: {expiringSoon.map(d => `${d.dog_name} (${format(parseISO(d.vaccine_expiry), "dd/MM", { locale: pt })})`).join(", ")}
          </span>
        </div>
      )}
      {valid.length > 0 && !hasIssue && (
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="text-[10px] font-semibold text-emerald-700">
            Vacinas em dia ({valid.length})
          </span>
        </div>
      )}
    </div>
  );
}