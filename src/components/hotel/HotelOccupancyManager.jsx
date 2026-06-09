import React, { useState } from "react";
import { format, addDays, startOfDay, parseISO, eachDayOfInterval, subDays, isSameDay } from "date-fns";
import { pt } from "date-fns/locale";
import { Dog, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const SERVICE_COLORS = {
  boarding:         "bg-purple-500",
  daycare:          "bg-blue-400",
  grooming:         "bg-pink-400",
  walk_with_partner:"bg-green-400",
  training:         "bg-orange-400",
};

const SERVICE_LABELS = {
  boarding: "Aloj.",
  daycare: "Creche",
  grooming: "Grooming",
  walk_with_partner: "Passeio",
  training: "Treino",
};

function getBookingsForDay(bookings, day) {
  return bookings.filter(b => {
    if (!b.checkin_date || ["cancelled", "rejected"].includes(b.status)) return false;
    try {
      const checkin = startOfDay(parseISO(b.checkin_date));
      const checkout = b.checkout_date ? startOfDay(parseISO(b.checkout_date)) : checkin;
      const d = startOfDay(day);
      return d >= checkin && d <= checkout;
    } catch { return false; }
  });
}

function OccupancyBar({ count, total }) {
  const pct = total ? Math.min(100, Math.round((count / total) * 100)) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-orange-400" : "bg-purple-500";
  return (
    <div className="mt-1">
      <div className="h-1.5 bg-purple-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[9px] text-slate-400 mt-0.5 text-right">{count}/{total}</p>
    </div>
  );
}

function DaySlot({ day, bookings, capacityTotal, onDaySelect, isSelected }) {
  const dayBookings = getBookingsForDay(bookings, day);
  const dogsCount = dayBookings.reduce((acc, b) => acc + (b.total_dogs || 1), 0);
  const pct = capacityTotal ? Math.min(100, Math.round((dogsCount / capacityTotal) * 100)) : 0;
  const isToday = isSameDay(day, new Date());
  const isFull = pct >= 100;
  const isAlmostFull = pct >= 80 && pct < 100;

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => onDaySelect(day)}
      className={`flex-1 min-w-0 rounded-xl p-2 border transition-all text-left ${
        isSelected
          ? "bg-purple-600 border-purple-500 shadow-lg shadow-purple-900/20"
          : isToday
          ? "bg-purple-50 border-purple-200"
          : "bg-white border-slate-100 hover:border-purple-200"
      }`}
    >
      <p className={`text-[9px] font-bold uppercase tracking-wide ${isSelected ? "text-purple-200" : "text-slate-400"}`}>
        {format(day, "EEE", { locale: pt })}
      </p>
      <p className={`text-sm font-black leading-tight ${isSelected ? "text-white" : isToday ? "text-purple-700" : "text-slate-800"}`}>
        {format(day, "d")}
      </p>

      {capacityTotal > 0 ? (
        <>
          <div className={`mt-1.5 h-1.5 rounded-full overflow-hidden ${isSelected ? "bg-white/20" : "bg-purple-100"}`}>
            <div
              className={`h-full rounded-full transition-all ${
                isFull ? "bg-red-400" : isAlmostFull ? "bg-orange-400" : isSelected ? "bg-white" : "bg-purple-400"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className={`text-[9px] mt-0.5 font-semibold ${isSelected ? "text-purple-200" : isFull ? "text-red-500" : "text-slate-400"}`}>
            {isFull ? "CHEIO" : `${dogsCount}/${capacityTotal}`}
          </p>
        </>
      ) : (
        <p className={`text-[9px] mt-1 ${isSelected ? "text-purple-200" : "text-slate-300"}`}>—</p>
      )}
    </motion.button>
  );
}

export default function HotelOccupancyManager({ bookings = [], hotelProfile, onUpdateCapacity }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(new Date());

  const capacityTotal = hotelProfile?.hotel_details?.capacity_total || 0;
  const capacityAvailable = hotelProfile?.hotel_details?.capacity_available ?? capacityTotal;

  const weekStart = addDays(startOfDay(new Date()), weekOffset * 7);
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  const selectedBookings = getBookingsForDay(bookings, selectedDay);
  const selectedDogsCount = selectedBookings.reduce((acc, b) => acc + (b.total_dogs || 1), 0);
  const selectedPct = capacityTotal ? Math.min(100, Math.round((selectedDogsCount / capacityTotal) * 100)) : 0;

  // Alertas: dias com > 80% ocupação nos próximos 14 dias
  const alertDays = eachDayOfInterval({ start: new Date(), end: addDays(new Date(), 13) }).filter(d => {
    const cnt = getBookingsForDay(bookings, d).reduce((acc, b) => acc + (b.total_dogs || 1), 0);
    return capacityTotal && (cnt / capacityTotal) >= 0.8;
  });

  return (
    <div className="space-y-4">

      {/* ── Capacidade global ── */}
      <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-2xl border border-purple-100 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-black text-slate-800 text-sm">Capacidade do Hotel</p>
            <p className="text-xs text-slate-400">Vagas disponíveis para novos agendamentos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateCapacity(Math.max(0, capacityAvailable - 1))}
              className="w-8 h-8 rounded-xl bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-purple-700 font-bold transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="text-center min-w-[3rem]">
              <p className="text-2xl font-black text-purple-700 leading-none">{capacityAvailable}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">disponível</p>
            </div>
            <button
              onClick={() => onUpdateCapacity(Math.min(capacityTotal || 99, capacityAvailable + 1))}
              className="w-8 h-8 rounded-xl bg-purple-100 hover:bg-purple-200 flex items-center justify-center text-purple-700 font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {capacityTotal > 0 && (
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              Capacidade máxima: <strong className="text-slate-700">{capacityTotal}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Livres: <strong className="text-green-700">{capacityTotal - selectedDogsCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
              Hoje hospedados: <strong className="text-orange-700">{getBookingsForDay(bookings, new Date()).reduce((a, b) => a + (b.total_dogs || 1), 0)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ── Alertas de capacidade ── */}
      {alertDays.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-orange-700">Dias com alta ocupação nos próximos 14 dias</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {alertDays.map(d => {
                const cnt = getBookingsForDay(bookings, d).reduce((acc, b) => acc + (b.total_dogs || 1), 0);
                const full = capacityTotal && cnt >= capacityTotal;
                return (
                  <button key={d.toISOString()} onClick={() => setSelectedDay(d)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${full ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-700"}`}>
                    {format(d, "d MMM", { locale: pt })} {full ? "CHEIO" : `${cnt}/${capacityTotal}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Navegação semanal ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setWeekOffset(w => w - 1)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-purple-100 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <p className="text-xs font-bold text-slate-600">
            {format(weekStart, "d MMM", { locale: pt })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: pt })}
          </p>
          <button onClick={() => setWeekOffset(w => w + 1)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-purple-100 flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Day slots */}
        <div className="flex gap-1.5">
          {weekDays.map(day => (
            <DaySlot
              key={day.toISOString()}
              day={day}
              bookings={bookings}
              capacityTotal={capacityTotal}
              onDaySelect={setSelectedDay}
              isSelected={isSameDay(day, selectedDay)}
            />
          ))}
        </div>
      </div>

      {/* ── Detalhe do dia selecionado ── */}
      <motion.div key={selectedDay.toISOString()} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-purple-100 overflow-hidden">

        {/* Header do dia */}
        <div className="bg-gradient-to-br from-purple-800 to-purple-600 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-white font-black text-sm capitalize">
              {format(selectedDay, "EEEE, d 'de' MMMM", { locale: pt })}
            </p>
            <p className="text-purple-200 text-[11px] mt-0.5">{selectedBookings.length} reserva(s) · {selectedDogsCount} cão(ões)</p>
          </div>
          <div className="text-right">
            <p className={`text-xl font-black ${selectedPct >= 90 ? "text-red-300" : selectedPct >= 70 ? "text-orange-300" : "text-white"}`}>
              {selectedPct}%
            </p>
            <p className="text-purple-200 text-[10px]">ocupação</p>
          </div>
        </div>

        {/* Barra de ocupação */}
        <div className="px-4 pt-3 pb-2 border-b border-purple-50">
          <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                selectedPct >= 90 ? "bg-gradient-to-r from-red-600 to-red-400"
                : selectedPct >= 70 ? "bg-gradient-to-r from-orange-500 to-orange-400"
                : "bg-gradient-to-r from-purple-800 to-purple-400"
              }`}
              style={{ width: `${selectedPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
            <span className="text-green-600 font-semibold">
              ↓ Check-ins: {bookings.filter(b => { try { return isSameDay(parseISO(b.checkin_date), selectedDay); } catch { return false; } }).length}
            </span>
            <span className="font-medium text-slate-500">{selectedDogsCount} / {capacityTotal || "?"} vagas</span>
            <span className="text-purple-600 font-semibold">
              ↑ Check-outs: {bookings.filter(b => { try { return b.checkout_date && isSameDay(parseISO(b.checkout_date), selectedDay); } catch { return false; } }).length}
            </span>
          </div>
        </div>

        {/* Visão de slots: cada reserva como bloco colorido */}
        <div className="p-4">
          {selectedBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Dog className="w-6 h-6 text-purple-200" />
              </div>
              <p className="text-sm text-slate-400">Sem reservas neste dia</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedBookings.map(booking => {
                const dogsInBooking = booking.total_dogs || 1;
                const color = SERVICE_COLORS[booking.service_type] || "bg-purple-400";
                return (
                  <div key={booking.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    {/* Slot visual — um círculo por cão */}
                    <div className="flex gap-1 shrink-0 flex-wrap max-w-[64px]">
                      {Array.from({ length: Math.min(dogsInBooking, 6) }).map((_, i) => (
                        <div key={i} className={`w-4 h-4 rounded-full ${color} shadow-sm`} />
                      ))}
                      {dogsInBooking > 6 && (
                        <span className="text-[9px] text-slate-400 font-bold">+{dogsInBooking - 6}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-xs truncate">{booking.owner_name}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className={`text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full ${color}`}>
                          {SERVICE_LABELS[booking.service_type] || booking.service_type}
                        </span>
                        <span className="text-[10px] text-slate-400">{dogsInBooking} cão(ões)</span>
                        {booking.checkin_time && <span className="text-[10px] text-slate-400">🕐 {booking.checkin_time}</span>}
                        {booking.total_amount > 0 && (
                          <span className="text-[10px] font-bold text-green-600">{booking.total_amount.toFixed(0)}€</span>
                        )}
                      </div>
                    </div>
                    <Badge className={`text-[9px] border-0 shrink-0 ${
                      booking.status === "checked_in" ? "bg-green-100 text-green-700"
                      : booking.status === "confirmed" ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                    }`}>
                      {booking.status === "checked_in" ? "✓ In" : booking.status === "confirmed" ? "Conf." : booking.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legenda de serviços */}
          {selectedBookings.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Legenda</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SERVICE_COLORS).map(([type, color]) => (
                  <span key={type} className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className={`w-3 h-3 rounded-full ${color} inline-block`} />
                    {SERVICE_LABELS[type]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}