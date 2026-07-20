import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  X, Dog, Droplets, Scissors, Star, Utensils, Pill, Smile,
  HeartHandshake, Banknote, Check, PawPrint, Loader2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const SERVICE_OPTIONS = [
  { value: "bathing",      label: "Banho",       icon: Droplets,       defaultPrice: 15 },
  { value: "grooming",     label: "Grooming",    icon: Scissors,       defaultPrice: 25 },
  { value: "walk",         label: "Passeio",     icon: PawPrint,       defaultPrice: 10 },
  { value: "nail_trim",    label: "Unhas",       icon: Scissors,       defaultPrice: 8 },
  { value: "training",     label: "Treino",      icon: Star,           defaultPrice: 20 },
  { value: "feeding",      label: "Alimentação", icon: Utensils,       defaultPrice: 5 },
  { value: "medication",   label: "Medicação",   icon: Pill,           defaultPrice: 5 },
  { value: "playtime",     label: "Brincar",     icon: Smile,          defaultPrice: 8 },
  { value: "general_care", label: "Cuidados",    icon: HeartHandshake, defaultPrice: 10 },
];

export default function AddServiceToStayModal({
  bookings,
  hotelProfile,
  partners = [],
  onConfirm,
  onClose,
}) {
  const [selectedBooking, setSelectedBooking] = useState("");
  const [serviceName, setServiceName] = useState("bathing");
  const [selectedPartner, setSelectedPartner] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState(15);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [saving, setSaving] = useState(false);

  // Only bookings where the dog is currently at the hotel
  const activeStays = useMemo(() => {
    return bookings.filter(b => ["checked_in", "in_progress"].includes(b.status));
  }, [bookings]);

  const selectedBookingObj = useMemo(() => {
    return activeStays.find(b => b.id === selectedBooking);
  }, [activeStays, selectedBooking]);

  // Check availability for the service type
  const availability = useMemo(() => {
    if (!selectedBookingObj || !hotelProfile?.hotel_details) return { hasCapacity: true, available: null, total: null };
    const services = hotelProfile.hotel_details.services || [];
    const svc = services.find(s => s.service_type === "daycare" || s.service_type === "boarding");
    // For add-on services like bath/grooming, there's no strict capacity tracking
    // but we check if the hotel is operational
    return { hasCapacity: true, available: svc?.capacity_available, total: svc?.capacity_total };
  }, [selectedBookingObj, hotelProfile]);

  const total = (Number(pricePerUnit) || 0) * (Number(quantity) || 1);

  const handleServiceChange = (val) => {
    setServiceName(val);
    const opt = SERVICE_OPTIONS.find(o => o.value === val);
    if (opt) setPricePerUnit(opt.defaultPrice);
  };

  const handleSubmit = async () => {
    if (!selectedBooking) {
      toast.error("Seleciona uma estadia ativa");
      return;
    }
    if (total <= 0) {
      toast.error("Insere um valor válido");
      return;
    }
    setSaving(true);
    try {
      const partner = selectedPartner
        ? partners.find(p => p.walker_email === selectedPartner)
        : null;
      await onConfirm({
        bookingId: selectedBooking,
        addOn: {
          service_name: serviceName,
          quantity: Number(quantity) || 1,
          price_per_unit: Number(pricePerUnit) || 0,
          total_price: total,
          assigned_walker_email: selectedPartner || undefined,
          assigned_walker_name: partner?.walker_name || "",
          completed: false,
          assignment_notes: notes.trim() || undefined,
          payment_status: paymentMethod === "cash" ? "paid" : "pending",
          payment_method: paymentMethod,
        },
        paymentMethod,
        total,
      });
      onClose();
    } catch (e) {
      toast.error("Erro ao adicionar serviço");
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
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Serviço Extra</h3>
              <p className="text-[10px] text-slate-400">Adicionar a estadia ativa · pagamento na hora</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {activeStays.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Dog className="w-5 h-5 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Sem cães no hotel</p>
            <p className="text-xs text-slate-400 mt-1">Faz o check-in de uma reserva primeiro para adicionar serviços extra.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Active stay select */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                <Dog className="w-3 h-3" /> Cão no hotel
              </label>
              <select
                value={selectedBooking}
                onChange={e => setSelectedBooking(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200"
              >
                <option value="">Selecionar hóspede...</option>
                {activeStays.map(b => (
                  <option key={b.id} value={b.id}>
                    {(b.dogs || []).map(d => d.dog_name).join(", ") || b.owner_name} — {b.owner_name}
                  </option>
                ))}
              </select>
              {selectedBookingObj && (
                <div className="mt-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] text-emerald-700 font-medium">
                    Cão verificado no hotel · check-in {b_checkinStr(selectedBookingObj)}
                  </span>
                </div>
              )}
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
                      onClick={() => handleServiceChange(opt.value)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${
                        isSelected ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-medium text-center leading-tight">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
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
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Preço/Unid. (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.50"
                  value={pricePerUnit}
                  onChange={e => setPricePerUnit(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200"
                />
              </div>
            </div>

            {/* Partner (optional) */}
            {partners.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Parceiro responsável (opcional)</label>
                <select
                  value={selectedPartner}
                  onChange={e => setSelectedPartner(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200"
                >
                  <option value="">Hotel executa</option>
                  {partners.map(p => (
                    <option key={p.walker_email} value={p.walker_email}>
                      {p.walker_name || p.walker_email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Banho antes do check-out, shampoo especial..."
                className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none placeholder:text-slate-300"
              />
            </div>

            {/* Payment method */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Pagamento na hora</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMethod === "cash" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" /> Dinheiro/MBWay
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    paymentMethod === "card" ? "bg-teal-600 border-teal-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" /> Cartão/Link
                </button>
              </div>
            </div>

            {/* Total preview */}
            <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Total a receber</span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {paymentMethod === "cash" ? "Pago presencial" : "Link de pagamento"}
                </span>
              </div>
              <span className="text-lg font-bold text-slate-900">{total.toFixed(2)}€</span>
            </div>
          </div>
        )}

        {/* Footer */}
        {activeStays.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 py-3 flex gap-2">
            <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs font-semibold" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 h-10 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-700"
              disabled={saving || !selectedBooking || total <= 0}
              onClick={handleSubmit}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "A guardar..." : `Adicionar · ${total.toFixed(2)}€`}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function b_checkinStr(booking) {
  if (!booking.checkin_time) return "hoje";
  return `${booking.checkin_time} de ${new Date(booking.checkin_date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}`;
}