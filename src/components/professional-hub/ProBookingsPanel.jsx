import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Search, CalendarDays, PawPrint, ChevronDown, Phone, Mail, MapPin, Clock, ClipboardList,
} from "lucide-react";

const STATUS_CONFIG = {
  pending:     { label: "Pendente",    dot: "bg-amber-500",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed:   { label: "Confirmada",  dot: "bg-blue-500",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
  in_progress: { label: "Em curso",    dot: "bg-teal-500",   cls: "bg-teal-50 text-teal-700 border-teal-200" },
  completed:   { label: "Concluída",   dot: "bg-slate-400",  cls: "bg-slate-50 text-slate-600 border-slate-200" },
  service_completed: { label: "Concluída", dot: "bg-slate-400", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  cancelled:   { label: "Cancelada",   dot: "bg-red-500",    cls: "bg-red-50 text-red-600 border-red-200" },
  rejected:    { label: "Rejeitada",   dot: "bg-red-500",    cls: "bg-red-50 text-red-600 border-red-200" },
};

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendentes" },
  { key: "confirmed", label: "Confirmadas" },
  { key: "in_progress", label: "Em curso" },
  { key: "completed", label: "Concluídas" },
  { key: "cancelled", label: "Canceladas" },
];

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  try { return format(parseISO(dateStr + "T12:00:00"), "dd/MM/yyyy", { locale: pt }); } catch { return dateStr; }
}

function BookingCard({ booking }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.completed;
  const dogs = booking.dogs?.length > 0
    ? booking.dogs
    : [{ dog_name: booking.dog_name, dog_breed: booking.dog_breed, dog_size: booking.dog_size, photo_url: null }];

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden transition-shadow hover:shadow-sm">
      <div className={`h-0.5 w-full ${cfg.dot}`} />
      <button className="w-full text-left p-3" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-slate-900 text-sm truncate">{booking.owner_name}</p>
              <span className="flex items-center gap-0.5 text-[10px] text-slate-500 font-medium truncate">
                <PawPrint className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{dogs.map(d => d.dog_name).join(", ")}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5 flex-wrap">
              <span className="flex items-center gap-0.5 font-medium text-slate-500">{booking.type === "training" ? "Treino" : "Passeio"}</span>
              <span className="flex items-center gap-0.5"><CalendarDays className="w-2.5 h-2.5" />{fmtDate(booking.walk_date || booking.session_date)}</span>
              {booking.walk_time || booking.session_time ? <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{booking.walk_time || booking.session_time}</span> : null}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {booking.total_amount > 0 && <span className="text-sm font-bold text-slate-800">{booking.total_amount.toFixed(2)}€</span>}
            <Badge variant="outline" className={`text-[9px] border ${cfg.cls} py-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />{cfg.label}
            </Badge>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {booking.owner_phone && (
              <a href={`tel:${booking.owner_phone}`} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
                <Phone className="w-3 h-3 text-slate-400" /> {booking.owner_phone}
              </a>
            )}
            {booking.owner_email && (
              <a href={`mailto:${booking.owner_email}`} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 truncate">
                <Mail className="w-3 h-3 text-slate-400" /> <span className="truncate">{booking.owner_email}</span>
              </a>
            )}
          </div>
          {booking.pickup_address && (
            <div className="flex items-start gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" /> {booking.pickup_address}
            </div>
          )}
          {booking.special_notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Notas especiais</p>
              <p className="text-xs text-amber-800">{booking.special_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProBookingsPanel({ user }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["proAllBookings", user?.email],
    queryFn: () =>
      base44.entities.Booking.filter({ walker_email: user.email }, "-walk_date", 200),
    enabled: !!user?.email,
  });

  const filterCounts = useMemo(() => {
    const counts = { all: bookings.length };
    for (const b of bookings) {
      const key = ["cancelled", "rejected"].includes(b.status) ? "cancelled"
        : b.status === "service_completed" ? "completed"
        : b.status;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [bookings]);

  const filtered = useMemo(() => {
    let result = bookings;
    if (statusFilter !== "all") {
      if (statusFilter === "completed") {
        result = result.filter(b => ["completed", "service_completed"].includes(b.status));
      } else if (statusFilter === "cancelled") {
        result = result.filter(b => ["cancelled", "rejected"].includes(b.status));
      } else {
        result = result.filter(b => b.status === statusFilter);
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.owner_name?.toLowerCase().includes(q) ||
        b.owner_email?.toLowerCase().includes(q) ||
        b.dog_name?.toLowerCase().includes(q) ||
        b.dogs?.some(d => d.dog_name?.toLowerCase().includes(q))
      );
    }
    return [...result].sort((a, b) => (b.walk_date || "").localeCompare(a.walk_date || ""));
  }, [bookings, statusFilter, search]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-orange-500" /> Reservas</h3>
        <p className="text-xs text-slate-400">{bookings.length} reserva(s) no total</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Pesquisar por dono, animal ou email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 placeholder:text-slate-400" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {FILTERS.map(f => {
          const count = f.key === "completed"
            ? (filterCounts.completed || 0) + (filterCounts.service_completed || 0)
            : f.key === "cancelled"
              ? (filterCounts.cancelled || 0) + (filterCounts.rejected || 0)
              : filterCounts[f.key] || 0;
          return (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] ${
                statusFilter === f.key ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
              }`}>
              {f.label}
              {count > 0 && <span className={`text-[9px] px-1.5 py-0 rounded-full ${statusFilter === f.key ? "bg-white/20" : "bg-slate-100"}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 font-medium">{filtered.length} reserva(s)</p>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl py-8 text-center text-slate-400 text-sm">A carregar...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-200" />
          <p className="text-slate-400 text-sm">Nenhuma reserva encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => <BookingCard key={b.id} booking={b} />)}
        </div>
      )}
    </div>
  );
}