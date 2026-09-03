import React, { useMemo } from "react";
import { parseISO, eachDayOfInterval, startOfDay } from "date-fns";
import { pt } from "date-fns/locale";
import { format } from "date-fns";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { STAY_SERVICE_TYPES } from "@/hooks/useHotelCapacity";

function getBookingsForDay(bookings, day) {
  return bookings.filter(b => {
    // Apenas hóspedes reais (alojamento/creche) — serviços pontuais não ocupam vagas
    if (!STAY_SERVICE_TYPES.includes(b.service_type)) return false;
    if (!b.checkin_date || ["cancelled", "rejected"].includes(b.status)) return false;
    try {
      const cin = startOfDay(parseISO(b.checkin_date));
      const cout = b.checkout_date ? startOfDay(parseISO(b.checkout_date)) : cin;
      const d = startOfDay(day);
      return d >= cin && d <= cout;
    } catch { return false; }
  });
}

export default function HotelCapacityAlert({ bookings = [], capacityTotal = 0, onDismiss }) {
  const alerts = useMemo(() => {
    if (!capacityTotal || capacityTotal <= 0) return [];

    const today = startOfDay(new Date());
    const end = new Date(today);
    end.setDate(end.getDate() + 30);

    const days = eachDayOfInterval({ start: today, end });
    const found = [];

    for (const day of days) {
      const dayBookings = getBookingsForDay(bookings, day);
      const dogs = dayBookings.reduce((acc, b) => acc + (b.total_dogs || 1), 0);
      const pct = Math.round((dogs / capacityTotal) * 100);

      if (pct >= 100) {
        found.push({ day, dogs, pct, level: "full" });
      } else if (pct >= 80) {
        found.push({ day, dogs, pct, level: "warn" });
      }
    }

    return found.slice(0, 5); // max 5 alertas
  }, [bookings, capacityTotal]);

  if (alerts.length === 0) return null;

  const hasFullDays = alerts.some(a => a.level === "full");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`rounded-2xl border p-4 shadow-sm ${
          hasFullDays
            ? "bg-red-50 border-red-200"
            : "bg-orange-50 border-orange-200"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1 min-w-0">
            <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${hasFullDays ? "text-red-500" : "text-orange-500"}`} />
            <div className="min-w-0">
              <p className={`font-black text-sm ${hasFullDays ? "text-red-700" : "text-orange-700"}`}>
                {hasFullDays ? "🚨 Dias com capacidade esgotada" : "⚠️ Dias com alta ocupação"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {alerts.map(({ day, dogs, pct, level }) => (
                  <div
                    key={day.toISOString()}
                    className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      level === "full"
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-orange-100 text-orange-700 border border-orange-200"
                    }`}
                  >
                    <span>{format(day, "d MMM", { locale: pt })}</span>
                    <span className="opacity-60">—</span>
                    <span>{level === "full" ? "CHEIO" : `${pct}%`}</span>
                    <span className="font-normal opacity-60">({dogs}/{capacityTotal})</span>
                  </div>
                ))}
              </div>
              {hasFullDays && (
                <p className="text-xs text-red-600 mt-2 opacity-80">
                  Nos dias marcados como CHEIO, não é possível aceitar novas reservas. Considera ajustar a capacidade ou cancelar reservas conflituantes.
                </p>
              )}
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                hasFullDays ? "hover:bg-red-100 text-red-400" : "hover:bg-orange-100 text-orange-400"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}