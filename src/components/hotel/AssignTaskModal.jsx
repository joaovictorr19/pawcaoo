import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Dog, Droplets, Scissors, Star, Utensils, Pill, Smile, HeartHandshake, User, Calendar, Plus } from "lucide-react";
import { toast } from "sonner";

const SERVICE_OPTIONS = [
  { value: "walk",         label: "Passeio",     icon: Dog },
  { value: "bathing",      label: "Banho",       icon: Droplets },
  { value: "grooming",     label: "Grooming",    icon: Scissors },
  { value: "training",     label: "Treino",      icon: Star },
  { value: "nail_trim",    label: "Unhas",       icon: Scissors },
  { value: "feeding",      label: "Alimentação", icon: Utensils },
  { value: "medication",   label: "Medicação",   icon: Pill },
  { value: "playtime",     label: "Brincar",     icon: Smile },
  { value: "general_care", label: "Cuidados",    icon: HeartHandshake },
];

export default function AssignTaskModal({ bookings, partners, onAssign, onClose }) {
  const [selectedBooking, setSelectedBooking] = useState("");
  const [serviceName, setServiceName] = useState("walk");
  const [selectedPartner, setSelectedPartner] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState(10);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [saving, setSaving] = useState(false);

  const activeBookings = useMemo(() => {
    return bookings.filter(b => ["confirmed", "checked_in", "in_progress"].includes(b.status));
  }, [bookings]);

  const handleSubmit = async () => {
    if (!selectedBooking || !serviceName || !selectedPartner) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSaving(true);
    try {
      await onAssign({
        bookingId: selectedBooking,
        addOn: {
          service_name: serviceName,
          quantity: Number(quantity) || 1,
          price_per_unit: Number(pricePerUnit) || 0,
          total_price: (Number(pricePerUnit) || 0) * (Number(quantity) || 1),
          assigned_walker_email: selectedPartner,
          assigned_walker_name: partners.find(p => p.walker_email === selectedPartner)?.walker_name || "",
          completed: false,
          assignment_notes: assignmentNotes.trim() || undefined,
          due_time: dueTime || undefined,
        },
      });
      onClose();
    } catch (e) {
      toast.error("Erro ao atribuir tarefa");
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
              <h3 className="font-bold text-slate-900 text-sm">Atribuir Tarefa</h3>
              <p className="text-[10px] text-slate-400">Designar serviço a um parceiro</p>
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

          {/* Partner select */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Parceiro</label>
            <select
              value={selectedPartner}
              onChange={e => setSelectedPartner(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Selecionar parceiro...</option>
              {partners.map(p => (
                <option key={p.walker_email} value={p.walker_email}>
                  {p.walker_name || p.walker_email}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Quantidade</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Preço/Unidade (€)</label>
              <input
                type="number"
                min="0"
                step="0.50"
                value={pricePerUnit}
                onChange={e => setPricePerUnit(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* Due time */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Horário recomendado (opcional)</label>
            <input
              type="time"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Assignment notes / instructions */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Instruções para o funcionário (opcional)</label>
            <textarea
              value={assignmentNotes}
              onChange={e => setAssignmentNotes(e.target.value)}
              rows={3}
              placeholder="Ex: Dar comida seca, 2x ao dia. Não dar petiscos. O Bobby é alérgico a frango..."
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none placeholder:text-slate-300"
            />
          </div>

          {/* Total preview */}
          <div className="bg-slate-50 rounded-xl px-3 py-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">Total</span>
            <span className="text-sm font-bold text-slate-900">
              {((Number(pricePerUnit) || 0) * (Number(quantity) || 1)).toFixed(2)}€
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-2">
          <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-semibold" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 h-10 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800"
            disabled={saving || !selectedBooking || !selectedPartner}
            onClick={handleSubmit}
          >
            {saving ? "A guardar..." : "Atribuir Tarefa"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}