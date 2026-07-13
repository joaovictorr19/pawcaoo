import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  PawPrint, Scissors, DoorOpen, CheckCircle2, Clock, User,
  ChevronDown, ChevronUp, Calendar, Search, ListChecks, Heart
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const ADDON_LABELS = {
  walk: "Passeio",
  training: "Treino",
  grooming: "Grooming",
  bathing: "Banho",
  nail_trim: "Corte de Unhas",
};

// Task categories
const CATEGORIES = {
  walks: {
    label: "Passeios",
    icon: PawPrint,
    color: "teal",
    types: ["walk"],
    headerCls: "bg-teal-50 border-teal-200 text-teal-700",
    iconCls: "text-teal-500",
    badgeCls: "bg-teal-100 text-teal-700",
    dotCls: "bg-teal-400",
  },
  baths: {
    label: "Banhos & Grooming",
    icon: Scissors,
    color: "pink",
    types: ["bathing", "grooming", "nail_trim"],
    headerCls: "bg-pink-50 border-pink-200 text-pink-700",
    iconCls: "text-pink-500",
    badgeCls: "bg-pink-100 text-pink-700",
    dotCls: "bg-pink-400",
  },
  checkins: {
    label: "Check-ins & Check-outs",
    icon: DoorOpen,
    color: "emerald",
    types: [],
    headerCls: "bg-emerald-50 border-emerald-200 text-emerald-700",
    iconCls: "text-emerald-500",
    badgeCls: "bg-emerald-100 text-emerald-700",
    dotCls: "bg-emerald-400",
  },
};

function TaskRow({ task, onToggleComplete }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = task.icon;
  const isDone = task.completed;

  return (
    <div className={`bg-white border rounded-lg overflow-hidden transition-all ${
      isDone ? "border-slate-100 opacity-60" : "border-slate-200"
    }`}>
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <button
          className="flex items-center gap-2 min-w-0 flex-1 text-left"
          onClick={() => setExpanded(e => !e)}
        >
          <Icon className={`w-4 h-4 shrink-0 ${isDone ? "text-slate-300" : task.iconCls}`} />
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${isDone ? "text-slate-400 line-through" : "text-slate-800"}`}>
              {task.dogName}
            </p>
            <p className="text-[10px] text-slate-400 truncate">
              {task.ownerName} · {task.serviceLabel}
              {task.quantity > 1 && ` · ${task.quantity}x`}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          {task.assignedTo && (
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              {task.assignedTo}
            </span>
          )}
          {task.price > 0 && (
            <span className="text-[10px] font-semibold text-slate-500">
              {task.price.toFixed(2)}€
            </span>
          )}
          <button
            onClick={() => onToggleComplete(task)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
              isDone
                ? "bg-emerald-100 text-emerald-600"
                : "bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"
            }`}
            title={isDone ? "Concluído" : "Marcar como concluído"}
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5 text-slate-300" />
            : <ChevronDown className="w-3.5 h-3.5 text-slate-300" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (task.notes || task.assignedTo) && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="px-3 py-2 space-y-1">
              {task.assignedTo && (
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3" /> Parceiro: {task.assignedTo}
                </p>
              )}
              {task.notes && (
                <p className="text-[10px] text-slate-500 flex items-start gap-1">
                  <ListChecks className="w-3 h-3 mt-0.5 shrink-0" /> {task.notes}
                </p>
              )}
              {task.completedAt && (
                <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Concluído em {format(new Date(task.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskColumn({ category, tasks, onToggleComplete }) {
  const Cat = CATEGORIES[category];
  const Icon = Cat.icon;
  const pending = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);

  return (
    <div className="flex flex-col">
      {/* Column header */}
      <div className={`rounded-xl border px-3 py-2.5 flex items-center justify-between ${Cat.headerCls} mb-3 sticky top-0 z-10`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${Cat.iconCls}`} />
          <span className="text-xs font-bold uppercase tracking-wide">{Cat.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {pending.length > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Cat.badgeCls}`}>
              {pending.length} pendente{pending.length > 1 ? "s" : ""}
            </span>
          )}
          {done.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {done.length} feito{done.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl py-8 text-center">
          <Icon className="w-6 h-6 text-slate-200 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">Sem tarefas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map(t => (
            <TaskRow key={t.id} task={t} onToggleComplete={onToggleComplete} />
          ))}
          {done.map(t => (
            <TaskRow key={t.id} task={t} onToggleComplete={onToggleComplete} />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckinTaskRow({ booking, onAction, actionLabel, actionCls, icon: Icon }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`w-4 h-4 shrink-0 ${CATEGORIES.checkins.iconCls}`} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">
            {booking.dogs?.map(d => d.dog_name).join(" & ") || booking.owner_name}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {booking.owner_name}
            {booking.checkin_date && ` · ${format(new Date(booking.checkin_date), "dd/MM", { locale: pt })}`}
            {booking.checkin_time && ` às ${booking.checkin_time}`}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        className={`h-8 rounded-lg text-xs font-semibold px-3 shrink-0 ${actionCls}`}
        onClick={() => onAction(booking.id)}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

export default function HotelTasksPanel({ bookings, onUpdateBooking }) {
  const [search, setSearch] = useState("");

  // Active bookings: checked-in, in-progress, and confirmed (for pending check-ins)
  const activeBookings = useMemo(() => {
    return bookings.filter(b => ["checked_in", "in_progress", "confirmed"].includes(b.status));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (!search.trim()) return activeBookings;
    const q = search.toLowerCase();
    return activeBookings.filter(b =>
      b.owner_name?.toLowerCase().includes(q) ||
      b.dogs?.some(d => d.dog_name?.toLowerCase().includes(q))
    );
  }, [activeBookings, search]);

  // Extract and categorize add-on tasks from checked-in/in-progress bookings
  const { walkTasks, bathTasks } = useMemo(() => {
    const walks = [];
    const baths = [];
    filteredBookings
      .filter(b => ["checked_in", "in_progress"].includes(b.status))
      .forEach(b => {
        const dogNames = (b.dogs || []).map(d => d.dog_name).join(" & ") || b.owner_name;
        (b.add_ons || []).forEach((addon, idx) => {
          const task = {
            id: `${b.id}-${idx}`,
            bookingId: b.id,
            addonIndex: idx,
            dogName: dogNames,
            ownerName: b.owner_name,
            serviceLabel: ADDON_LABELS[addon.service_name] || addon.service_name,
            serviceType: addon.service_name,
            quantity: addon.quantity || 1,
            price: addon.total_price || 0,
            assignedTo: addon.assigned_walker_name,
            notes: addon.task_notes,
            completed: addon.completed || false,
            completedAt: addon.completed_at,
            icon: CATEGORIES.walks.types.includes(addon.service_name) ? PawPrint : Scissors,
            iconCls: CATEGORIES.walks.types.includes(addon.service_name)
              ? CATEGORIES.walks.iconCls
              : CATEGORIES.baths.iconCls,
          };
          if (CATEGORIES.walks.types.includes(addon.service_name)) {
            walks.push(task);
          } else if (CATEGORIES.baths.types.includes(addon.service_name)) {
            walks.push(task); // Actually baths
            baths.push(task);
          }
        });
      });
    // Remove duplicates from walks that are actually baths
    const cleanWalks = walks.filter(t => CATEGORIES.walks.types.includes(t.serviceType));
    return { walkTasks: cleanWalks, bathTasks: baths };
  }, [filteredBookings]);

  // Check-in tasks: confirmed bookings arriving (pending check-in)
  const checkinTasks = useMemo(() => {
    return filteredBookings.filter(b => b.status === "confirmed");
  }, [filteredBookings]);

  // Check-out tasks: checked-in bookings (can check out)
  const checkoutTasks = useMemo(() => {
    return filteredBookings.filter(b => b.status === "checked_in");
  }, [filteredBookings]);

  // Toggle add-on completion
  const handleToggleComplete = async (task) => {
    const booking = bookings.find(b => b.id === task.bookingId);
    if (!booking) return;
    const updatedAddons = (booking.add_ons || []).map((addon, i) => {
      if (i === task.addonIndex) {
        return {
          ...addon,
          completed: !addon.completed,
          completed_at: !addon.completed ? new Date().toISOString() : null,
        };
      }
      return addon;
    });
    onUpdateBooking(task.bookingId, { add_ons: updatedAddons });
  };

  const handleCheckIn = (id) => {
    const time = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    onUpdateBooking(id, { status: "checked_in", checkin_time: time });
  };

  const handleCheckOut = (id) => {
    const time = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    const today = new Date().toISOString().split("T")[0];
    onUpdateBooking(id, { status: "checked_out", checkout_time: time, checkout_date: today });
  };

  const totalPending = walkTasks.filter(t => !t.completed).length
    + bathTasks.filter(t => !t.completed).length
    + checkinTasks.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Tarefas do Dia</h2>
          <p className="text-xs text-slate-400">
            {totalPending > 0
              ? `${totalPending} tarefa${totalPending > 1 ? "s" : ""} pendente${totalPending > 1 ? "s" : ""}`
              : "Tudo em dia"}
          </p>
        </div>
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar animal ou dono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Three-column layout on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Walks column */}
        <TaskColumn
          category="walks"
          tasks={walkTasks}
          onToggleComplete={handleToggleComplete}
        />

        {/* Baths & Grooming column */}
        <TaskColumn
          category="baths"
          tasks={bathTasks}
          onToggleComplete={handleToggleComplete}
        />

        {/* Check-ins & Check-outs column */}
        <div className="flex flex-col">
          <div className={`rounded-xl border px-3 py-2.5 flex items-center justify-between ${CATEGORIES.checkins.headerCls} mb-3 sticky top-0 z-10`}>
            <div className="flex items-center gap-2">
              <DoorOpen className={`w-4 h-4 ${CATEGORIES.checkins.iconCls}`} />
              <span className="text-xs font-bold uppercase tracking-wide">Check-ins & Check-outs</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORIES.checkins.badgeCls}`}>
              {checkinTasks.length + checkoutTasks.length}
            </span>
          </div>

          {checkinTasks.length === 0 && checkoutTasks.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-xl py-8 text-center">
              <DoorOpen className="w-6 h-6 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">Sem check-ins pendentes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pending check-ins */}
              {checkinTasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> A chegar ({checkinTasks.length})
                  </p>
                  <div className="space-y-2">
                    {checkinTasks.map(b => (
                      <CheckinTaskRow
                        key={b.id}
                        booking={b}
                        onAction={handleCheckIn}
                        actionLabel="Check-in"
                        actionCls="bg-emerald-600 hover:bg-emerald-700 text-white"
                        icon={DoorOpen}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pending check-outs */}
              {checkoutTasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> No hotel ({checkoutTasks.length})
                  </p>
                  <div className="space-y-2">
                    {checkoutTasks.map(b => (
                      <CheckinTaskRow
                        key={b.id}
                        booking={b}
                        onAction={handleCheckOut}
                        actionLabel="Check-out"
                        actionCls="bg-violet-600 hover:bg-violet-700 text-white"
                        icon={Heart}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}