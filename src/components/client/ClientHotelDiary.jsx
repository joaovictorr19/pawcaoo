import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import HotelStayDiary from "@/components/hotel/HotelStayDiary";
import {
  BookOpen, PawPrint, ChevronDown, CalendarDays, Hotel as HotelIcon,
  Loader2, Inbox,
} from "lucide-react";

const STATUS_LABELS = {
  pending: "Pendente",
  confirmed: "Confirmada",
  checked_in: "Em estadia",
  in_progress: "Em curso",
  checked_out: "Check-out",
  completed: "Concluída",
  cancelled: "Cancelada",
  rejected: "Rejeitada",
};

const STATUS_COLORS = {
  pending: "text-yellow-400 bg-yellow-500/10",
  confirmed: "text-blue-400 bg-blue-500/10",
  checked_in: "text-emerald-400 bg-emerald-500/10",
  in_progress: "text-teal-400 bg-teal-500/10",
  checked_out: "text-violet-400 bg-violet-500/10",
  completed: "text-slate-400 bg-slate-500/10",
  cancelled: "text-red-400 bg-red-500/10",
  rejected: "text-red-400 bg-red-500/10",
};

function StayCard({ booking, user }) {
  const [open, setOpen] = useState(false);
  const dogNames = (booking.dogs || []).map(d => d.dog_name).join(", ") || "—";
  const dogPhoto = booking.dogs?.[0]?.photo_url;
  const statusCls = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;
  const dateRange = booking.checkin_date
    ? `${format(new Date(booking.checkin_date + "T12:00:00"), "dd MMM", { locale: pt })}${booking.checkout_date ? ` — ${format(new Date(booking.checkout_date + "T12:00:00"), "dd MMM yyyy", { locale: pt })}` : ""}`
    : "—";

  return (
    <Card className="bg-slate-900 border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left"
      >
        <CardContent className="p-3.5 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
            {dogPhoto
              ? <img src={dogPhoto} alt="" className="w-full h-full object-cover" />
              : <PawPrint className="w-5 h-5 text-slate-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{dogNames}</p>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
              <HotelIcon className="w-3 h-3" /> {booking.hotel_name || "Hotel"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> {dateRange}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${statusCls}`}>
              {STATUS_LABELS[booking.status] || booking.status}
            </span>
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </motion.div>
          </div>
        </CardContent>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3">
              <HotelStayDiary booking={booking} user={user} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default function ClientHotelDiary({ user }) {
  const [filter, setFilter] = useState("all"); // all | active | past

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["clientHotelBookingsDiary", user?.email],
    queryFn: () =>
      base44.entities.HotelBooking.filter(
        { owner_email: user.email },
        "-checkin_date",
        200
      ),
    enabled: !!user?.email,
    staleTime: 60 * 1000,
  });

  const filtered = useMemo(() => {
    const activeStatuses = ["pending", "confirmed", "checked_in", "in_progress"];
    if (filter === "active") return bookings.filter(b => activeStatuses.includes(b.status));
    if (filter === "past") return bookings.filter(b => !activeStatuses.includes(b.status));
    return bookings;
  }, [bookings, filter]);

  const counts = useMemo(() => {
    const activeStatuses = ["pending", "confirmed", "checked_in", "in_progress"];
    return {
      all: bookings.length,
      active: bookings.filter(b => activeStatuses.includes(b.status)).length,
      past: bookings.filter(b => !activeStatuses.includes(b.status)).length,
    };
  }, [bookings]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-teal-400" />
        </div>
        <div>
          <h2 className="font-black text-white text-base">Diário das Estadias</h2>
          <p className="text-[11px] text-slate-400">Histórico completo de atualizações, fotos e registos do hotel</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "Todas", count: counts.all },
          { key: "active", label: "Ativas", count: counts.active },
          { key: "past", label: "Concluídas", count: counts.past },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filter === f.key
                ? "bg-teal-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {f.label}
            <span className={`text-[9px] ${filter === f.key ? "text-teal-100" : "text-slate-500"}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-7 h-7 text-teal-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-900 border border-white/5">
          <CardContent className="p-10 text-center">
            <Inbox className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-white font-bold mb-1">Sem estadias {filter === "active" ? "ativas" : filter === "past" ? "concluídas" : ""}</p>
            <p className="text-slate-400 text-sm">
              {bookings.length === 0
                ? "Quando reservares uma estadia num hotel, o diário com fotos e atualizações do teu cão aparecerá aqui."
                : "Nenhuma estadia nesta categoria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <StayCard key={b.id} booking={b} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}