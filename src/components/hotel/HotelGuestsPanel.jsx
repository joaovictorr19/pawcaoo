import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dog, Phone, Mail, Calendar, Clock, ChevronDown, ChevronUp,
  AlertCircle, FileText, ArrowRight, Heart, Pill, Syringe,
  CheckCircle2, LogOut, User, Star, ShieldAlert, Activity,
  Search, Filter
} from "lucide-react";
import GuestsExportButton from "./GuestsExportButton";
import { differenceInDays, parseISO, format } from "date-fns";
import { pt } from "date-fns/locale";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "Extra Grande" };
const SIZE_COLORS = {
  small: "bg-sky-50 text-sky-700 border-sky-200",
  medium: "bg-emerald-50 text-emerald-700 border-emerald-200",
  large: "bg-amber-50 text-amber-700 border-amber-200",
  extra_large: "bg-rose-50 text-rose-700 border-rose-200"
};

const SERVICE_LABELS = {
  boarding: "Alojamento",
  daycare: "Creche",
  grooming: "Grooming",
  walk_with_partner: "Passeio",
  training: "Treino",
};

const SERVICE_COLORS = {
  boarding: "bg-purple-50 text-purple-700",
  daycare: "bg-yellow-50 text-yellow-700",
  grooming: "bg-pink-50 text-pink-700",
  walk_with_partner: "bg-teal-50 text-teal-700",
  training: "bg-blue-50 text-blue-700",
};

function StayProgress({ checkinDate, checkoutDate }) {
  if (!checkinDate || !checkoutDate) return null;
  try {
    const start = parseISO(checkinDate);
    const end = parseISO(checkoutDate);
    const total = differenceInDays(end, start);
    const elapsed = differenceInDays(new Date(), start);
    const pct = total > 0 ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))) : 0;
    const remaining = differenceInDays(end, new Date());

    return (
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-slate-400 font-medium">Progresso da estadia</span>
          <span className={`text-[10px] font-semibold ${remaining < 0 ? "text-red-500" : remaining === 0 ? "text-orange-500" : "text-slate-500"}`}>
            {remaining < 0 ? "Em atraso" : remaining === 0 ? "Sai hoje" : remaining === 1 ? "Sai amanhã" : `${remaining} dias restantes`}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-orange-400" : "bg-purple-400"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-400">{format(start, "dd MMM", { locale: pt })}</span>
          <span className="text-[9px] text-slate-400">{format(end, "dd MMM", { locale: pt })}</span>
        </div>
      </div>
    );
  } catch { return null; }
}

function AnimalStatusBadge({ booking }) {
  const alerts = [];
  if (booking.special_requests) alerts.push("Pedidos especiais");

  const dogs = booking.dogs || [];
  dogs.forEach(d => {
    if (d.special_notes) alerts.push("Notas especiais");
  });

  if (alerts.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
        <ShieldAlert className="w-3 h-3" /> Atenção
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
      <Activity className="w-3 h-3" /> Bem
    </span>
  );
}

function GuestCard({ booking, onCheckOut, onCheckIn }) {
  const [expanded, setExpanded] = useState(false);
  const dogs = booking.dogs?.length > 0 ? booking.dogs : [];
  const isCheckedIn = ["checked_in", "in_progress"].includes(booking.status);
  const isExpectedArrival = booking.status === "confirmed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
        isCheckedIn ? "border-slate-200 shadow-sm" : "border-blue-100"
      }`}
    >
      {/* Colored top stripe */}
      <div className={`h-1 w-full ${isCheckedIn ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-blue-300 to-blue-400"}`} />

      {/* Main row */}
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold shadow-sm ${
            isCheckedIn
              ? "bg-gradient-to-br from-purple-100 to-purple-200"
              : "bg-gradient-to-br from-blue-100 to-blue-200"
          }`}>
            🐕
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm leading-tight">
                  {dogs.length > 0 ? dogs.map(d => d.dog_name).join(" & ") : "—"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> {booking.owner_name}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <AnimalStatusBadge booking={booking} />
                {expanded
                  ? <ChevronUp className="w-3.5 h-3.5 text-slate-300" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                }
              </div>
            </div>

            {/* Tags row */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                SERVICE_COLORS[booking.service_type] || "bg-slate-50 text-slate-600"
              }`}>
                {SERVICE_LABELS[booking.service_type] || booking.service_type}
              </span>
              {dogs.map((d, i) => (
                <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${SIZE_COLORS[d.dog_size] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                  {d.dog_name} · {SIZE_LABELS[d.dog_size] || d.dog_size}
                </span>
              ))}
              {booking.total_amount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                  {booking.total_amount.toFixed(2)}€
                </span>
              )}
            </div>

            {/* Stay progress (for checked-in) */}
            {isCheckedIn && (
              <StayProgress checkinDate={booking.checkin_date} checkoutDate={booking.checkout_date} />
            )}

            {/* Expected arrival date */}
            {isExpectedArrival && (
              <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Check-in: {booking.checkin_date}{booking.checkin_time ? ` às ${booking.checkin_time}` : ""}
              </p>
            )}
          </div>
        </div>
      </button>

      {/* Expandable details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3">

              {/* Contacts */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contactos do Dono</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {booking.owner_phone && (
                    <a href={`tel:${booking.owner_phone}`}
                      className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 hover:border-purple-300 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      {booking.owner_phone}
                    </a>
                  )}
                  {booking.owner_email && (
                    <a href={`mailto:${booking.owner_email}`}
                      className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 hover:border-purple-300 transition-colors truncate">
                      <Mail className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">{booking.owner_email}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Per-dog details */}
              {dogs.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ficha dos Animais</p>
                  <div className="space-y-2">
                    {dogs.map((dog, i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">🐕</span>
                          <p className="font-semibold text-slate-800 text-sm">{dog.dog_name}</p>
                          {dog.dog_size && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${SIZE_COLORS[dog.dog_size] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {SIZE_LABELS[dog.dog_size]}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                          {dog.dog_breed && <p>Raça: <span className="font-medium text-slate-800">{dog.dog_breed}</span></p>}
                          {dog.dog_age && <p>Idade: <span className="font-medium text-slate-800">{dog.dog_age} anos</span></p>}
                        </div>
                        {dog.special_notes && (
                          <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 flex gap-1.5">
                            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">{dog.special_notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special requests */}
              {booking.special_requests && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide mb-0.5">Pedidos Especiais</p>
                    <p className="text-xs text-orange-800">{booking.special_requests}</p>
                  </div>
                </div>
              )}

              {/* Internal notes */}
              {booking.internal_notes && (
                <div className="bg-slate-100 rounded-xl p-3 flex gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Notas Internas</p>
                    <p className="text-xs text-slate-600">{booking.internal_notes}</p>
                  </div>
                </div>
              )}

              {/* Partner */}
              {booking.assigned_walker_name && (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                  <User className="w-3.5 h-3.5 text-purple-500" />
                  <p className="text-xs text-purple-700 font-medium">Parceiro: {booking.assigned_walker_name}</p>
                </div>
              )}

              {/* Date info */}
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {booking.checkin_date && (
                  <span className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    Check-in: <strong className="text-slate-700">{booking.checkin_date}</strong>
                    {booking.checkin_time && <span className="text-slate-400">às {booking.checkin_time}</span>}
                  </span>
                )}
                {booking.checkout_date && (
                  <span className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
                    <LogOut className="w-3 h-3 text-purple-500" />
                    Check-out: <strong className="text-slate-700">{booking.checkout_date}</strong>
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {booking.status === "confirmed" && (
                  <Button size="sm"
                    className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold"
                    onClick={() => onCheckIn && onCheckIn(booking.id)}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Fazer Check-in
                  </Button>
                )}
                {booking.status === "checked_in" && (
                  <Button size="sm"
                    className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold"
                    onClick={() => onCheckOut(booking.id)}>
                    <LogOut className="w-3.5 h-3.5 mr-1" /> Registar Check-out
                  </Button>
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
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const guests = bookings.filter(b => ["checked_in", "in_progress"].includes(b.status));
  const confirmedArrivals = bookings.filter(b => b.status === "confirmed");
  const pendingBookings = bookings.filter(b => b.status === "pending");

  const handleCheckOut = (id) => {
    const time = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    onUpdateBooking(id, { status: "checked_out", checkout_time: time });
  };

  const handleCheckIn = (id) => {
    const time = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    onUpdateBooking(id, { status: "checked_in", checkin_time: time });
  };

  // Filter helper
  const filterBookings = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(b =>
      b.owner_name?.toLowerCase().includes(q) ||
      b.dogs?.some(d => d.dog_name?.toLowerCase().includes(q)) ||
      b.owner_email?.toLowerCase().includes(q)
    );
  };

  const filteredGuests = filterBookings(guests);
  const filteredArrivals = filterBookings(confirmedArrivals);

  return (
    <div className="space-y-5">

      {/* Toolbar: search + export */}
      <div className="flex gap-2 items-center">
        <GuestsExportButton bookings={[...guests, ...confirmedArrivals, ...pendingBookings]} />
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar por dono, animal ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 placeholder:text-slate-400"
        />
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-green-700">{guests.length} No hotel</span>
        </div>
        {confirmedArrivals.length > 0 && (
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">
            <Calendar className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-semibold text-blue-700">{confirmedArrivals.length} A chegar</span>
          </div>
        )}
        {pendingBookings.length > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5">
            <Clock className="w-3 h-3 text-orange-500" />
            <span className="text-xs font-semibold text-orange-700">{pendingBookings.length} Pendentes</span>
          </div>
        )}
      </div>

      {/* Current guests */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            Animais no Hotel ({filteredGuests.length})
          </h3>
        </div>

        {filteredGuests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center">
            <div className="text-4xl mb-3">🏨</div>
            <p className="text-slate-500 text-sm font-medium">
              {search ? "Sem resultados para a pesquisa" : "Nenhum animal hospedado agora"}
            </p>
            <p className="text-slate-400 text-xs mt-1">Os hóspedes aparecerão aqui após o check-in</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGuests.map(b => (
              <GuestCard key={b.id} booking={b} onCheckOut={handleCheckOut} onCheckIn={handleCheckIn} />
            ))}
          </div>
        )}
      </div>

      {/* Expected arrivals */}
      {filteredArrivals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              Chegadas Confirmadas ({filteredArrivals.length})
            </h3>
          </div>
          <div className="space-y-2">
            {filteredArrivals.map(b => (
              <GuestCard key={b.id} booking={b} onCheckOut={handleCheckOut} onCheckIn={handleCheckIn} />
            ))}
          </div>
        </div>
      )}

      {/* Pending bookings needing response */}
      {pendingBookings.length > 0 && !search && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 text-orange-500" />
            <h3 className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Aguardam Resposta ({pendingBookings.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingBookings.map(b => (
              <div key={b.id} className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {b.dogs?.map(d => d.dog_name).join(" & ") || b.owner_name}
                  </p>
                  <p className="text-xs text-slate-500">{b.owner_name} · {SERVICE_LABELS[b.service_type]}</p>
                  <p className="text-xs text-orange-600 mt-0.5">📅 {b.checkin_date}{b.checkout_date ? ` → ${b.checkout_date}` : ""}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs px-3"
                    onClick={() => onUpdateBooking(b.id, { status: "confirmed" })}>
                    Confirmar
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-xs px-3"
                    onClick={() => onUpdateBooking(b.id, { status: "rejected" })}>
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}