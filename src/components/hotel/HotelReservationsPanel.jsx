import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import {
  ClipboardList, Search, CalendarDays, Clock, Dog, Phone, Mail,
  CheckCircle2, X, ChevronDown, PawPrint, StickyNote, FileText,
  UserCheck, DoorOpen, XCircle, Euro, ListChecks, Filter, TrendingUp,
  CreditCard, AlertCircle, RefreshCw
} from "lucide-react";

const STATUS_CONFIG = {
  pending:     { label: "Pendente",    dot: "bg-amber-500",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed:   { label: "Confirmada",  dot: "bg-blue-500",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
  checked_in:  { label: "No hotel",    dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  in_progress: { label: "Em curso",    dot: "bg-teal-500",   cls: "bg-teal-50 text-teal-700 border-teal-200" },
  checked_out: { label: "Check-out",   dot: "bg-violet-500", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  completed:   { label: "Concluída",   dot: "bg-slate-400",  cls: "bg-slate-50 text-slate-600 border-slate-200" },
  cancelled:   { label: "Cancelada",   dot: "bg-red-500",    cls: "bg-red-50 text-red-600 border-red-200" },
  rejected:    { label: "Rejeitada",   dot: "bg-red-500",    cls: "bg-red-50 text-red-600 border-red-200" },
};

const SERVICE_LABELS = {
  boarding: "Alojamento",
  daycare: "Creche",
  grooming: "Grooming",
  walk_with_partner: "Passeio",
  training: "Treino",
};

const PAYMENT_CONFIG = {
  pending:  { label: "Pago pendente",  cls: "bg-amber-50 text-amber-600 border-amber-200" },
  paid:     { label: "Pago",           cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  refunded: { label: "Reembolsado",    cls: "bg-slate-50 text-slate-500 border-slate-200" },
  partial:  { label: "Parcial",        cls: "bg-orange-50 text-orange-600 border-orange-200" },
};

const FILTERS = [
  { key: "all",        label: "Todas" },
  { key: "pending",    label: "Pendentes" },
  { key: "confirmed",  label: "Confirmadas" },
  { key: "checked_in", label: "No hotel" },
  { key: "completed",  label: "Concluídas" },
  { key: "cancelled",  label: "Canceladas" },
];

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  try { return format(parseISO(dateStr), "dd/MM/yyyy", { locale: pt }); } catch { return dateStr; }
}

function BookingCard({ booking, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.completed;
  const payCfg = PAYMENT_CONFIG[booking.payment_status] || PAYMENT_CONFIG.pending;
  const addOns = booking.add_ons || [];
  const completedAddOns = addOns.filter(a => a.completed).length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Days until checkin
  let daysUntil = null;
  if (booking.checkin_date) {
    try {
      daysUntil = differenceInDays(parseISO(booking.checkin_date), today);
    } catch {}
  }

  const isUpcoming = daysUntil !== null && daysUntil > 0 && ["confirmed", "pending"].includes(booking.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full bg-white border rounded-xl overflow-hidden transition-shadow hover:shadow-sm ${
        booking.status === "checked_in" ? "border-emerald-200" : "border-slate-200"
      }`}
    >
      {/* Status stripe */}
      <div className={`h-0.5 w-full ${cfg.dot}`} />

      <button className="w-full text-left p-3.5" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Owner + dogs */}
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-900 text-sm">{booking.owner_name}</p>
              {booking.dogs?.length > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-slate-500 font-medium">
                  <PawPrint className="w-2.5 h-2.5" />
                  {booking.dogs.map(d => d.dog_name).join(", ")}
                </span>
              )}
              {isUpcoming && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  em {daysUntil}d
                </span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-1.5 flex-wrap">
              <span className="flex items-center gap-0.5 font-medium text-slate-500">
                {SERVICE_LABELS[booking.service_type] || booking.service_type}
              </span>
              <span className="flex items-center gap-0.5">
                <CalendarDays className="w-2.5 h-2.5" />
                {fmtDate(booking.checkin_date)}
                {booking.checkout_date && ` → ${fmtDate(booking.checkout_date)}`}
              </span>
              <span className="flex items-center gap-0.5">
                <Dog className="w-2.5 h-2.5" />
                {booking.total_dogs || 1} cão{(booking.total_dogs || 1) > 1 ? "es" : ""}
              </span>
              {addOns.length > 0 && (
                <span className="flex items-center gap-0.5 text-slate-500 font-medium">
                  <ListChecks className="w-2.5 h-2.5" />
                  {addOns.length} serviço{addOns.length > 1 ? "s" : ""}
                  {completedAddOns > 0 && ` (${completedAddOns}✓)`}
                </span>
              )}
            </div>
          </div>

          {/* Right side: value + status */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            {booking.total_amount > 0 && (
              <span className="text-sm font-bold text-slate-800">{booking.total_amount.toFixed(2)}€</span>
            )}
            <Badge variant="outline" className={`text-[9px] border ${cfg.cls} py-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
              {cfg.label}
            </Badge>
            {booking.payment_status && booking.payment_status !== "paid" && (
              <Badge variant="outline" className={`text-[8px] border ${payCfg.cls} py-0`}>
                {payCfg.label}
              </Badge>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-3.5 pt-3 space-y-2.5 bg-slate-50/50">
              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {booking.owner_phone && (
                  <a href={`tel:${booking.owner_phone}`} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 hover:border-slate-300">
                    <Phone className="w-3 h-3 text-slate-400" /> {booking.owner_phone}
                  </a>
                )}
                {booking.owner_email && (
                  <a href={`mailto:${booking.owner_email}`} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 hover:border-slate-300 truncate">
                    <Mail className="w-3 h-3 text-slate-400" /> <span className="truncate">{booking.owner_email}</span>
                  </a>
                )}
              </div>

              {/* Add-ons summary */}
              {addOns.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <ListChecks className="w-3 h-3" /> Serviços Extra
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {addOns.map((a, i) => (
                      <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        a.completed
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {a.completed && "✓ "}{SERVICE_LABELS[a.service_name] || a.service_name}
                        {a.total_price > 0 && ` ${a.total_price.toFixed(0)}€`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Special requests */}
              {booking.special_requests && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">Pedidos Especiais</p>
                  <p className="text-xs text-amber-800">{booking.special_requests}</p>
                </div>
              )}

              {booking.assigned_walker_name && (
                <p className="text-xs text-slate-600 font-medium flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Parceiro: {booking.assigned_walker_name}
                </p>
              )}

              {booking.internal_notes && (
                <div className="bg-slate-100 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Notas Internas</p>
                  <p className="text-xs text-slate-600">{booking.internal_notes}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1 flex-wrap">
                {booking.status === "pending" && (
                  <>
                    {booking.payment_status !== "paid" && (
                      <div className="w-full flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-700 font-medium">
                          Pagamento pendente — a reserva só pode ser confirmada após pagamento confirmado.
                        </p>
                      </div>
                    )}
                    <Button size="sm" className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs min-w-[100px] disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={booking.payment_status !== "paid"}
                      onClick={() => onUpdate(booking.id, { status: "confirmed" })}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmar
                    </Button>
                    <Button size="sm" variant="outline" className="h-9 border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                      onClick={() => onUpdate(booking.id, { status: "rejected" })}>
                      <X className="w-3.5 h-3.5 mr-1" /> Rejeitar
                    </Button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <Button size="sm" className="flex-1 h-9 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs"
                    onClick={() => onUpdate(booking.id, { status: "checked_in", checkin_time: format(new Date(), "HH:mm") })}>
                    <DoorOpen className="w-3.5 h-3.5 mr-1" /> Check-in
                  </Button>
                )}
                {booking.status === "checked_in" && (
                  <Button size="sm" className="flex-1 h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs"
                    onClick={() => onUpdate(booking.id, { status: "checked_out", checkout_time: format(new Date(), "HH:mm") })}>
                    <DoorOpen className="w-3.5 h-3.5 mr-1" /> Check-out
                  </Button>
                )}
                {booking.status === "checked_out" && (
                  <Button size="sm" className="flex-1 h-9 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs"
                    onClick={() => onUpdate(booking.id, { status: "completed" })}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Concluir
                  </Button>
                )}
                {["confirmed", "pending"].includes(booking.status) && (
                  <Button size="sm" variant="outline" className="h-9 border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-xs"
                    onClick={() => onUpdate(booking.id, { status: "cancelled" })}>
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
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

export default function HotelReservationsPanel({ bookings, onUpdateBooking, onNewBooking, onRefresh }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Compute filter counts
  const filterCounts = useMemo(() => {
    const counts = { all: bookings.length };
    for (const b of bookings) {
      counts[b.status] = (counts[b.status] || 0) + 1;
    }
    return counts;
  }, [bookings]);

  // Filtered + sorted bookings
  const filtered = useMemo(() => {
    let result = bookings;

    if (statusFilter !== "all") {
      // Group checked_in + in_progress under "checked_in" filter
      if (statusFilter === "checked_in") {
        result = result.filter(b => ["checked_in", "in_progress"].includes(b.status));
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
        b.owner_phone?.toLowerCase().includes(q) ||
        b.dogs?.some(d => d.dog_name?.toLowerCase().includes(q))
      );
    }

    // Sort: pending first, then by checkin date descending
    return [...result].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (b.status === "pending" && a.status !== "pending") return 1;
      return (b.checkin_date || "").localeCompare(a.checkin_date || "");
    });
  }, [bookings, statusFilter, search]);

  // Revenue summary for filtered set
  const revenueSummary = useMemo(() => {
    const active = filtered.filter(b => !["cancelled", "rejected"].includes(b.status));
    const total = active.reduce((s, b) => s + (b.total_amount || 0), 0);
    const paid = active.filter(b => b.payment_status === "paid").reduce((s, b) => s + (b.total_amount || 0), 0);
    const pending = active.filter(b => b.payment_status !== "paid").reduce((s, b) => s + (b.total_amount || 0), 0);
    return { total, paid, pending };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Revenue summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Total Filtrado</p>
          <p className="text-base font-bold text-slate-900 mt-0.5">{revenueSummary.total.toFixed(0)}€</p>
        </div>
        <div className="bg-white border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-500">Pago</p>
          <p className="text-base font-bold text-emerald-600 mt-0.5">{revenueSummary.paid.toFixed(0)}€</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-500">Pendente</p>
          <p className="text-base font-bold text-amber-600 mt-0.5">{revenueSummary.pending.toFixed(0)}€</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar por dono, animal, email ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300 placeholder:text-slate-400"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {FILTERS.map(f => {
          const count = f.key === "checked_in"
            ? (filterCounts.checked_in || 0) + (filterCounts.in_progress || 0)
            : f.key === "cancelled"
              ? (filterCounts.cancelled || 0) + (filterCounts.rejected || 0)
              : filterCounts[f.key] || 0;
          return (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all min-h-[36px] ${
                statusFilter === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className={`text-[9px] px-1.5 py-0 rounded-full ${
                  statusFilter === f.key ? "bg-white/20" : "bg-slate-100"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 font-medium">
          {filtered.length} reserva{filtered.length !== 1 ? "s" : ""}
          {search && ` · "${search}"`}
        </p>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg gap-1.5 text-xs h-9"
              onClick={onRefresh}>
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </Button>
          )}
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg gap-1.5 text-xs h-9"
            onClick={onNewBooking}>
            <ClipboardList className="w-3.5 h-3.5" /> Nova
          </Button>
        </div>
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl py-12 text-center">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 text-sm">
            {search || statusFilter !== "all" ? "Nenhuma reserva encontrada" : "Sem reservas registadas"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => (
            <BookingCard key={b.id} booking={b} onUpdate={onUpdateBooking} />
          ))}
        </div>
      )}
    </div>
  );
}