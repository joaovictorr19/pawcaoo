import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dog, Phone, Mail, Calendar, Clock, ChevronDown, ChevronUp,
  AlertCircle, FileText, Star, ArrowRight
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };
const SIZE_COLORS = { small: "bg-sky-50 text-sky-700", medium: "bg-green-50 text-green-700", large: "bg-orange-50 text-orange-700", extra_large: "bg-red-50 text-red-700" };

const SERVICE_LABELS = {
  boarding: "Alojamento",
  daycare: "Creche",
  grooming: "Grooming",
  walk_with_partner: "Passeio",
  training: "Treino",
};

function DaysRemaining({ checkoutDate }) {
  if (!checkoutDate) return null;
  try {
    const days = differenceInDays(parseISO(checkoutDate), new Date());
    if (days < 0) return <span className="text-xs text-red-500 font-semibold">Saída em atraso!</span>;
    if (days === 0) return <span className="text-xs text-orange-500 font-semibold">Sai hoje</span>;
    if (days === 1) return <span className="text-xs text-blue-500 font-semibold">Sai amanhã</span>;
    return <span className="text-xs text-slate-400">{days} dias restantes</span>;
  } catch {
    return null;
  }
}

function GuestCard({ booking, onCheckOut }) {
  const [expanded, setExpanded] = useState(false);
  const dogs = booking.dogs?.length > 0 ? booking.dogs : [{ dog_name: booking.owner_name + "'s dog", dog_size: "medium" }];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3">
          {/* Dog avatar */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shrink-0 text-xl">
            🐕
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  {dogs.map(d => d.dog_name).join(" & ")}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Dono: {booking.owner_name}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-200">
                  No hotel
                </span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                {booking.checkin_date}
                {booking.checkout_date && <><ArrowRight className="w-2.5 h-2.5" />{booking.checkout_date}</>}
              </span>
              <span className="text-xs text-purple-600 font-medium">{SERVICE_LABELS[booking.service_type] || booking.service_type}</span>
              <DaysRemaining checkoutDate={booking.checkout_date} />
            </div>

            {/* Dog tags */}
            {dogs.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {dogs.map((d, i) => (
                  <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${SIZE_COLORS[d.dog_size] || "bg-slate-100 text-slate-600"}`}>
                    {d.dog_name} · {SIZE_LABELS[d.dog_size] || d.dog_size}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {booking.owner_phone && (
                  <a href={`tel:${booking.owner_phone}`} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 hover:border-purple-300 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    {booking.owner_phone}
                  </a>
                )}
                {booking.owner_email && (
                  <a href={`mailto:${booking.owner_email}`} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 hover:border-purple-300 transition-colors truncate">
                    <Mail className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    <span className="truncate">{booking.owner_email}</span>
                  </a>
                )}
              </div>

              {/* Dog details */}
              {dogs.map((dog, i) => (dog.dog_breed || dog.dog_age) && (
                <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 text-xs text-slate-600 space-y-0.5">
                  <p className="font-semibold text-slate-800 mb-1">🐕 {dog.dog_name}</p>
                  {dog.dog_breed && <p>Raça: <span className="text-slate-800 font-medium">{dog.dog_breed}</span></p>}
                  {dog.dog_age && <p>Idade: <span className="text-slate-800 font-medium">{dog.dog_age} anos</span></p>}
                </div>
              ))}

              {/* Special requests */}
              {booking.special_requests && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-800">{booking.special_requests}</p>
                </div>
              )}

              {/* Internal notes */}
              {booking.internal_notes && (
                <div className="bg-slate-100 rounded-xl p-3 flex gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600">{booking.internal_notes}</p>
                </div>
              )}

              {/* Partner walker */}
              {booking.assigned_walker_name && (
                <p className="text-xs text-purple-700 font-medium">
                  👤 Parceiro atribuído: {booking.assigned_walker_name}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {booking.status === "checked_in" && (
                  <Button size="sm" className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
                    onClick={() => onCheckOut(booking.id)}>
                    🚪 Registar Check-out
                  </Button>
                )}
                {booking.total_amount > 0 && (
                  <div className="flex items-center gap-1 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-semibold">
                    💶 {booking.total_amount.toFixed(2)}€
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HotelGuestsPanel({ bookings, onUpdateBooking }) {
  const guests = bookings.filter(b => ["checked_in", "in_progress"].includes(b.status));
  const confirmedArrivals = bookings.filter(b => b.status === "confirmed");

  const handleCheckOut = (id) => {
    const time = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    onUpdateBooking(id, { status: "checked_out", checkout_time: time });
  };

  return (
    <div className="space-y-5">
      {/* Current guests */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            Animais no Hotel ({guests.length})
          </h3>
        </div>

        {guests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center">
            <div className="text-4xl mb-3">🏨</div>
            <p className="text-slate-500 text-sm font-medium">Nenhum animal hospedado agora</p>
            <p className="text-slate-400 text-xs mt-1">Os hóspedes aparecerão aqui após o check-in</p>
          </div>
        ) : (
          <div className="space-y-3">
            {guests.map(b => (
              <GuestCard key={b.id} booking={b} onCheckOut={handleCheckOut} />
            ))}
          </div>
        )}
      </div>

      {/* Expected arrivals */}
      {confirmedArrivals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              Chegadas Esperadas ({confirmedArrivals.length})
            </h3>
          </div>
          <div className="space-y-2">
            {confirmedArrivals.map(b => (
              <div key={b.id} className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {b.dogs?.map(d => d.dog_name).join(" & ") || "—"}
                  </p>
                  <p className="text-xs text-slate-500">{b.owner_name} · {SERVICE_LABELS[b.service_type]}</p>
                  <p className="text-xs text-blue-600 mt-0.5">📅 Check-in: {b.checkin_date} {b.checkin_time && `às ${b.checkin_time}`}</p>
                </div>
                <Button size="sm" className="shrink-0 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs"
                  onClick={() => {
                    const time = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
                    onUpdateBooking(b.id, { status: "checked_in", checkin_time: time });
                  }}>
                  ✅ Check-in
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}