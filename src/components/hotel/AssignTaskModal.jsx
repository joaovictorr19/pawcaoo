import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Dog, Droplets, Scissors, Star, Utensils, Pill, Smile, HeartHandshake, Calendar, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SERVICE_OPTIONS = [
  { value: "walk",         label: "Passeio",     icon: Dog },
  { value: "bathing",      label: "Banho",       icon: Droplets },
  { value: "grooming",     label: "Grooming",    icon: Scissors },
  { value: "training",     label: "Treino",      icon: Star },
  { value: "nail_trim",    label: "Unhas",       icon: Scissors },
  { value: "feeding",      label: "Alimentação", icon: Utensils },
  { value: "medication",   label: "Medicação",   icon: Pill },
  { value: "playtime",     label: "Brincar",    icon: Smile },
  { value: "general_care", label: "Cuidados",    icon: HeartHandshake },
];

export default function AssignTaskModal({ bookings, partners, onAssign, onClose }) {
  const [selectedBooking, setSelectedBooking] = useState("");
  const [serviceName, setServiceName] = useState("walk");
  const [selectedPartner, setSelectedPartner] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeBookings = useMemo(() => {
    return bookings.filter(b => ["confirmed", "checked_in", "in_progress"].includes(b.status));
  }, [bookings]);

  const handleSubmit = async () => {
    if (!selectedBooking || !serviceName) {
      toast.error("Selecione uma reserva e um serviço");
      return;
    }
    setSaving(true);
    try {
      const partner = selectedPartner
        ? partners.find(p => p.walker_email === selectedPartner)
        : null;
      await onAssign({
        bookingId: selectedBooking,
        addOn: {
          service_name: serviceName,
          quantity: 1,
          price_per_unit: 0,
          total_price: 0,
          assigned_walker_email: selectedPartner || undefined,
          assigned_walker_name: partner?.walker_name || "",
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : undefined,
          assignment_notes: assignmentNotes.trim() || undefined,
          due_date: dueDate || undefined,
        },
      });
      onClose();
    } catch (e) {
      toast.error("Erro ao guardar tarefa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Plus className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Nova Tarefa / Anotação</h3>
              <p className="text-[10px] text-slate-400">Registo operativo · parceiro opcional</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Booking select */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Reserva</label>
            <select
              value={selectedBooking}
              onChange={e => setSelectedBooking(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Selecionar reserva...</option>
              {activeBookings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.dogs?.map(d => d.dog_name).join(", ") || b.owner_name} — {b.owner_name}
                </option>
              ))}
            </select>
          </div>

          {/* Service type */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Serviço</label>
            <div className="grid grid-cols-3 gap-1.5">
              {SERVICE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = serviceName === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setServiceName(opt.value)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${
                      isSelected ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[8px] font-medium text-center leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Partner select — optional */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
              Parceiro <span className="text-slate-300 normal-case">(opcional)</span>
            </label>
            <select
              value={selectedPartner}
              onChange={e => setSelectedPartner(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Sem parceiro — apenas anotação</option>
              {partners.map(p => (
                <option key={p.walker_email} value={p.walker_email}>
                  {p.walker_name || p.walker_email}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Data (opcional)</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* Assignment notes / instructions */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Notas / Instruções (opcional)</label>
            <textarea
              value={assignmentNotes}
              onChange={e => setAssignmentNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Dar comida seca, 2x ao dia. Não dar petiscos. O Bobby é alérgico a frango..."
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none placeholder:text-slate-300"
            />
          </div>

          {/* Completed toggle */}
          <button
            onClick={() => setIsCompleted(!isCompleted)}
            className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all ${
              isCompleted
                ? "bg-emerald-50 border-emerald-200"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
              isCompleted ? "bg-emerald-500" : "bg-slate-100 border border-slate-300"
            }`}>
              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </div>
            <div className="text-left flex-1">
              <p className={`text-xs font-bold ${isCompleted ? "text-emerald-700" : "text-slate-700"}`}>
                Marcar como concluído
              </p>
              <p className="text-[10px] text-slate-400">
                {isCompleted ? "A tarefa fica registada como feita" : "A tarefa fica pendente"}
              </p>
            </div>
          </button>

          {/* Info banner */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-teal-600 shrink-0" />
            <p className="text-[10px] text-teal-700 leading-snug">
              Registo operativo — sem cobrança. Pode ser apenas uma anotação ou atribuída a um parceiro.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-2">
          <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-semibold" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800"
            disabled={saving || !selectedBooking}
            onClick={handleSubmit}
          >
            {saving ? "A guardar..." : "Guardar"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}