import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus } from "lucide-react";
import { format } from "date-fns";

const SERVICE_OPTIONS = [
  { value: "boarding", label: "🛏️ Alojamento (noites)" },
  { value: "daycare", label: "☀️ Creche (dia)" },
  { value: "grooming", label: "✂️ Grooming" },
  { value: "walk_with_partner", label: "🐕 Passeio com parceiro" },
  { value: "training", label: "🎓 Treino" },
];

const DOG_SIZES = [
  { value: "small", label: "Pequeno" },
  { value: "medium", label: "Médio" },
  { value: "large", label: "Grande" },
  { value: "extra_large", label: "Extra Grande" },
];

export default function HotelNewBookingModal({ isOpen, onClose, onSave, hotelProfile, partners = [], defaultDate }) {
  const [form, setForm] = useState({
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    service_type: "boarding",
    checkin_date: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    checkout_date: "",
    checkin_time: hotelProfile?.hotel_details?.checkin_time || "09:00",
    checkout_time: hotelProfile?.hotel_details?.checkout_time || "18:00",
    dogs: [{ dog_name: "", dog_breed: "", dog_size: "medium", dog_age: "" }],
    special_requests: "",
    assigned_walker_email: "",
    assigned_walker_name: "",
    total_amount: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateDog = (i, k, v) => {
    const dogs = [...form.dogs];
    dogs[i] = { ...dogs[i], [k]: v };
    setForm(f => ({ ...f, dogs }));
  };

  const addDog = () => setForm(f => ({ ...f, dogs: [...f.dogs, { dog_name: "", dog_breed: "", dog_size: "medium", dog_age: "" }] }));
  const removeDog = (i) => setForm(f => ({ ...f, dogs: f.dogs.filter((_, idx) => idx !== i) }));

  const handleSave = () => {
    if (!form.owner_name.trim() || !form.checkin_date || !form.service_type) return;
    onSave({
      ...form,
      total_dogs: form.dogs.length,
      total_amount: parseFloat(form.total_amount) || 0,
      hotel_profile_id: hotelProfile?.id,
      hotel_name: hotelProfile?.walker_name,
      hotel_email: hotelProfile?.created_by,
      status: "confirmed",
      payment_status: "pending",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-purple-900/20">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-purple-800 via-purple-700 to-purple-500 px-5 py-5 flex items-center justify-between rounded-t-3xl md:rounded-t-3xl overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-12 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-white font-black text-base tracking-tight">Nova Reserva 🏨</h2>
            <p className="text-purple-200 text-[11px] mt-0.5">Preenche os dados da estadia</p>
          </div>
          <button onClick={onClose} className="relative z-10 w-8 h-8 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-xl text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Service type */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Tipo de Serviço</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_OPTIONS.map(s => (
                <button key={s.value} onClick={() => set("service_type", s.value)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left border-2 transition-all ${form.service_type === s.value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-slate-100 text-slate-600 hover:border-slate-200"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dono */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Dados do Dono</label>
            <div className="space-y-2">
              <input value={form.owner_name} onChange={e => set("owner_name", e.target.value)} placeholder="Nome completo *" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400" />
              <input value={form.owner_email} onChange={e => set("owner_email", e.target.value)} placeholder="Email" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400" />
              <input value={form.owner_phone} onChange={e => set("owner_phone", e.target.value)} placeholder="Telefone" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400" />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Check-in *</label>
              <input type="date" value={form.checkin_date} onChange={e => set("checkin_date", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400" />
              <input type="time" value={form.checkin_time} onChange={e => set("checkin_time", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400 mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Check-out</label>
              <input type="date" value={form.checkout_date} onChange={e => set("checkout_date", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400" />
              <input type="time" value={form.checkout_time} onChange={e => set("checkout_time", e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400 mt-1.5" />
            </div>
          </div>

          {/* Cães */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cães</label>
              <button onClick={addDog} className="flex items-center gap-1 text-xs text-purple-600 font-bold hover:text-purple-700">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {form.dogs.map((dog, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-600">🐕 Cão {i + 1}</span>
                    {form.dogs.length > 1 && (
                      <button onClick={() => removeDog(i)} className="text-red-400 hover:text-red-600">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={dog.dog_name} onChange={e => updateDog(i, "dog_name", e.target.value)} placeholder="Nome" className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-purple-400" />
                    <input value={dog.dog_breed} onChange={e => updateDog(i, "dog_breed", e.target.value)} placeholder="Raça" className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-purple-400" />
                    <select value={dog.dog_size} onChange={e => updateDog(i, "dog_size", e.target.value)} className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-purple-400 bg-white">
                      {DOG_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <input type="number" value={dog.dog_age} onChange={e => updateDog(i, "dog_age", e.target.value)} placeholder="Idade (anos)" className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-purple-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Parceiro responsável */}
          {partners.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Profissional Responsável</label>
              <select value={form.assigned_walker_email} onChange={e => {
                const p = partners.find(p => p.walker_email === e.target.value);
                set("assigned_walker_email", e.target.value);
                set("assigned_walker_name", p?.walker_name || "");
              }} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400 bg-white">
                <option value="">— Sem atribuição —</option>
                {partners.map(p => (
                  <option key={p.walker_email} value={p.walker_email}>{p.walker_name} ({(p.services || []).join(", ")})</option>
                ))}
              </select>
            </div>
          )}

          {/* Valor + notas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Valor Total (€)</label>
              <input type="number" min="0" step="0.01" value={form.total_amount} onChange={e => set("total_amount", e.target.value)} placeholder="0.00" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Pedidos especiais</label>
              <textarea value={form.special_requests} onChange={e => set("special_requests", e.target.value)} rows={1} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400 resize-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 flex gap-3 border-t border-purple-50 pt-4 bg-gradient-to-b from-white to-purple-50/30">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50">Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.owner_name.trim() || !form.checkin_date}
            className="flex-1 bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-800 hover:to-purple-600 text-white rounded-xl font-black shadow-lg shadow-purple-500/30 disabled:opacity-40">
            🏨 Criar Reserva
          </Button>
        </div>
      </div>
    </div>
  );
}