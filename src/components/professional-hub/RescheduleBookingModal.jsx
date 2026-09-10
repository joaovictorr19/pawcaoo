import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Clock, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);

export default function RescheduleBookingModal({ booking, onClose, onConfirm }) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [newDate, setNewDate] = useState(
    booking?.walk_date?.includes("T") ? booking.walk_date.split("T")[0] : booking?.walk_date || todayStr
  );
  const [newTime, setNewTime] = useState(booking?.walk_time || "09:00");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!newDate || !newTime) return;
    setSaving(true);
    try {
      await onConfirm(newDate, newTime);
    } catch {
      toast.error("Erro ao mover reserva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-end md:items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-slate-900 font-bold text-base">Mover Reserva</h3>
            <p className="text-slate-500 text-xs mt-0.5">{booking?.owner_name || "Cliente"}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-lg p-2.5">
            <span className="font-medium">{format(new Date((booking?.walk_date?.includes("T") ? booking.walk_date.split("T")[0] : booking?.walk_date) + "T12:00:00"), "dd MMM", { locale: pt })} às {booking?.walk_time || "?"}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="text-slate-700 font-semibold">{format(new Date(newDate + "T12:00:00"), "dd MMM", { locale: pt })} às {newTime}</span>
          </div>

          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Nova Data
            </label>
            <input
              type="date"
              value={newDate}
              min={todayStr}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 text-slate-900 rounded-xl text-sm border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Nova Hora
            </label>
            <select
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 text-slate-900 rounded-xl text-sm border border-slate-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
            >
              {HOURS.map((h) => (
                <option key={h} value={`${String(h).padStart(2, "0")}:00`}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl font-semibold">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !newDate}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold"
            >
              {saving ? "A mover..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}