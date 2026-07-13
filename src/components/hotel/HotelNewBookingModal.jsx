import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import HotelServiceAddons from "./HotelServiceAddons";

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
  const [payingNow, setPayingNow] = useState(false);
  const [addOns, setAddOns] = useState([]);
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

  const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.total_price, 0);
  
  const buildPayload = () => ({
    ...form,
    total_dogs: form.dogs.length,
    total_amount: parseFloat(form.total_amount) || 0,
    add_ons: addOns,
    add_ons_total: addOnsTotal,
    hotel_profile_id: hotelProfile?.id,
    hotel_name: hotelProfile?.walker_name || hotelProfile?.hotel_details?.hotel_name,
    hotel_email: hotelProfile?.created_by,
    status: "confirmed",
    payment_status: "pending",
  });

  const handleSave = async () => {
    if (!form.owner_name.trim() || !form.checkin_date || !form.service_type) return;
    const amount = parseFloat(form.total_amount) || 0;

    // Se tem valor, criar reserva + gerar link de pagamento via backend (1 única reserva)
    if (amount > 0) {
      try {
        const payload = {
          hotel_profile_id: hotelProfile?.id,
          hotel_name: hotelProfile?.walker_name || hotelProfile?.hotel_details?.hotel_name,
          hotel_email: hotelProfile?.created_by,
          owner_name: form.owner_name,
          owner_email: form.owner_email,
          owner_phone: form.owner_phone,
          dogs: form.dogs,
          service_type: form.service_type,
          checkin_date: form.checkin_date,
          checkout_date: form.checkout_date || form.checkin_date,
          checkin_time: form.checkin_time,
          checkout_time: form.checkout_time,
          total_nights: form.checkout_date ? Math.max(1, Math.ceil((new Date(form.checkout_date) - new Date(form.checkin_date)) / 86400000)) : 1,
          total_dogs: form.dogs.length,
          total_amount: amount,
          platform_fee: parseFloat((amount * 0.10).toFixed(2)),
          service_amount: parseFloat((amount * 0.90).toFixed(2)),
          special_requests: form.special_requests,
          assigned_walker_email: form.assigned_walker_email,
          assigned_walker_name: form.assigned_walker_name,
          add_ons: addOns,
          add_ons_total: addOnsTotal,
        };
        const res = await base44.functions.invoke("createHotelCheckout", payload);
        const { url, error } = res.data;
        if (error) { toast.error(error); return; }
        if (url) {
          toast.success("Reserva criada! Link de pagamento copiado.");
          navigator.clipboard.writeText(url);
        }
      } catch (err) {
        toast.error("Erro ao criar reserva: " + err.message);
        return;
      }
    } else {
      // Sem valor: criar reserva diretamente (sem pagamento)
      onSave(buildPayload());
    }

    onClose();
  };

  const handlePayNow = async () => {
    if (!form.owner_name.trim() || !form.checkin_date || !form.service_type) {
      toast.error("Preenche o nome do dono e a data de check-in.");
      return;
    }
    const amount = parseFloat(form.total_amount) + addOnsTotal;
    if (!amount || amount <= 0) {
      toast.error("Insere um valor total válido para efectuar o pagamento.");
      return;
    }
    setPayingNow(true);
    try {
      const payload = {
        hotel_profile_id: hotelProfile?.id,
        hotel_name: hotelProfile?.walker_name || hotelProfile?.hotel_details?.hotel_name,
        hotel_email: hotelProfile?.created_by,
        owner_name: form.owner_name,
        owner_email: form.owner_email,
        owner_phone: form.owner_phone,
        dogs: form.dogs,
        service_type: form.service_type,
        checkin_date: form.checkin_date,
        checkout_date: form.checkout_date || form.checkin_date,
        checkin_time: form.checkin_time,
        checkout_time: form.checkout_time,
        total_nights: form.checkout_date ? Math.max(1, Math.ceil((new Date(form.checkout_date) - new Date(form.checkin_date)) / 86400000)) : 1,
        total_dogs: form.dogs.length,
        total_amount: amount,
        platform_fee: parseFloat((amount * 0.10).toFixed(2)),
        service_amount: parseFloat((amount * 0.90).toFixed(2)),
        special_requests: form.special_requests,
        assigned_walker_email: form.assigned_walker_email,
        assigned_walker_name: form.assigned_walker_name,
        add_ons: addOns,
        add_ons_total: addOnsTotal,
      };
      const res = await base44.functions.invoke("createHotelCheckout", payload);
      const { url, error } = res.data;
      if (error) { toast.error(error); return; }
      if (url) window.location.href = url;
    } catch (err) {
      toast.error("Erro ao iniciar pagamento: " + err.message);
    } finally {
      setPayingNow(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-y-scroll shadow-2xl shadow-purple-900/20 scrollbar-hide">
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

           {/* Serviços Adicionais */}
           <HotelServiceAddons 
             addOns={addOns} 
             onAddOnsChange={setAddOns}
             partners={partners}
           />

           {/* Resumo de preço */}
           <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200">
             <div className="space-y-1.5 text-sm">
               <div className="flex justify-between">
                 <span className="text-slate-600">Serviço base:</span>
                 <span className="font-semibold">€{(parseFloat(form.total_amount) || 0).toFixed(2)}</span>
               </div>
               {addOnsTotal > 0 && (
                 <div className="flex justify-between text-blue-600 font-semibold">
                   <span>Add-ons ({addOns.length}):</span>
                   <span>€{addOnsTotal.toFixed(2)}</span>
                 </div>
               )}
               <div className="border-t border-slate-300 pt-1.5 flex justify-between font-bold text-slate-900">
                 <span>TOTAL:</span>
                 <span className="text-lg">€{(parseFloat(form.total_amount) + addOnsTotal || 0).toFixed(2)}</span>
               </div>
             </div>
           </div>

           {/* Valor + notas */}
           <div className="grid grid-cols-2 gap-3">
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Valor Serviço (€)</label>
               <input type="number" min="0" step="0.01" value={form.total_amount} onChange={e => set("total_amount", e.target.value)} placeholder="0.00" className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400" />
             </div>
             <div>
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Pedidos especiais</label>
               <textarea value={form.special_requests} onChange={e => set("special_requests", e.target.value)} rows={1} className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-purple-400 resize-none" />
             </div>
           </div>
        </div>

        {/* Footer */}
         <div className="sticky bottom-0 px-5 py-4 border-t border-purple-50 bg-gradient-to-b from-white to-purple-50/30 space-y-2">
           {/* Pay with Stripe */}
           <Button
             onClick={handlePayNow}
             disabled={payingNow || !form.owner_name.trim() || !form.checkin_date || !(parseFloat(form.total_amount) + addOnsTotal > 0)}
             className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-black shadow-lg shadow-indigo-400/30 gap-2 disabled:opacity-40 text-sm"
           >
             {payingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
             {payingNow ? "A redirecionar..." : `💳 Pagar ${(parseFloat(form.total_amount) + addOnsTotal) > 0 ? `(${(parseFloat(form.total_amount) + addOnsTotal).toFixed(2)}€)` : ""}`}
           </Button>
           <div className="grid grid-cols-2 gap-2">
             <Button variant="outline" onClick={onClose} className="rounded-xl border-purple-100 text-purple-600 hover:bg-purple-50 text-sm">Cancelar</Button>
             <Button onClick={handleSave} disabled={!form.owner_name.trim() || !form.checkin_date}
               className="bg-gradient-to-r from-purple-700 to-purple-500 hover:from-purple-800 hover:to-purple-600 text-white rounded-xl font-black shadow-lg shadow-purple-500/30 disabled:opacity-40 text-sm">
               🏨 Só Criar
             </Button>
           </div>
           <p className="text-center text-[10px] text-slate-400">
             "Pagar" gera link Stripe • "Só Criar" salva e envia link ao cliente
           </p>
         </div>
      </div>
    </div>
  );
}