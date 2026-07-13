import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Minus, CreditCard, Loader2, Link2, Copy, Check, Send,
  BedDouble, Sun, Scissors, PawPrint, GraduationCap, User, CalendarDays,
  Dog, ClipboardList, Banknote, LogIn, Syringe } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import HotelServiceAddons from "./HotelServiceAddons";
import EmergencyContactFields from "./EmergencyContactFields";
import { calculateAddOnsTotal, buildBookingPayload } from "@/hooks/useHotelCapacity";

const SERVICE_OPTIONS = [
  { value: "boarding", label: "Alojamento", sub: "por noite", icon: BedDouble },
  { value: "daycare", label: "Creche", sub: "por dia", icon: Sun },
  { value: "grooming", label: "Grooming", sub: "sessão", icon: Scissors },
  { value: "walk_with_partner", label: "Passeio", sub: "com parceiro", icon: PawPrint },
  { value: "training", label: "Treino", sub: "sessão", icon: GraduationCap },
];

const DOG_SIZES = [
  { value: "small", label: "Pequeno" },
  { value: "medium", label: "Médio" },
  { value: "large", label: "Grande" },
  { value: "extra_large", label: "Extra Grande" },
];

export default function HotelNewBookingModal({ isOpen, onClose, onSave, hotelProfile, partners = [], defaultDate }) {
  const queryClient = useQueryClient();
  const [payingNow, setPayingNow] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [paymentLink, setPaymentLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [addOns, setAddOns] = useState([]);
  const [directCheckin, setDirectCheckin] = useState(false);

  const [form, setForm] = useState({
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    service_type: "boarding",
    checkin_date: defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    checkout_date: "",
    checkin_time: hotelProfile?.hotel_details?.checkin_time || "09:00",
    checkout_time: hotelProfile?.hotel_details?.checkout_time || "18:00",
    dogs: [{ dog_name: "", dog_breed: "", dog_size: "medium", dog_age: "", special_notes: "", diet: "", medications: "", routine: "", vaccine_expiry: "", vaccine_document_url: "" }],
    special_requests: "",
    assigned_walker_email: "",
    assigned_walker_name: "",
    total_amount: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    veterinarian_name: "",
    veterinarian_phone: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateDog = (i, k, v) => {
    const dogs = [...form.dogs];
    dogs[i] = { ...dogs[i], [k]: v };
    setForm(f => ({ ...f, dogs }));
  };

  const addDog = () => setForm(f => ({ ...f, dogs: [...f.dogs, { dog_name: "", dog_breed: "", dog_size: "medium", dog_age: "", special_notes: "", diet: "", medications: "", routine: "", vaccine_expiry: "", vaccine_document_url: "" }] }));
  const removeDog = (i) => setForm(f => ({ ...f, dogs: f.dogs.filter((_, idx) => idx !== i) }));

  const addOnsTotal = calculateAddOnsTotal(addOns);
  const baseAmount = parseFloat(form.total_amount) || 0;
  const grandTotal = baseAmount + addOnsTotal;

  const buildPayload = (overrides = {}) => ({
    ...buildBookingPayload(form, hotelProfile, addOns),
    status: directCheckin ? "checked_in" : "confirmed",
    payment_status: "pending",
    ...(directCheckin ? { checkin_time: format(new Date(), "HH:mm") } : {}),
    ...overrides,
  });

  const resetAndClose = () => {
    setPaymentLink(null);
    setCopied(false);
    setAddOns([]);
    setDirectCheckin(false);
    onClose();
  };

  // Guardar reserva sem pagamento (cliente paga presencialmente)
  const handleSaveOnly = () => {
    if (!form.owner_name.trim() || !form.checkin_date || !form.service_type) {
      toast.error("Preenche o nome do dono, data de check-in e tipo de serviço.");
      return;
    }
    onSave(buildPayload());
    resetAndClose();
  };

  // Registar pagamento presencial (dinheiro, MBWay, multibanco)
  const handlePaidOffline = () => {
    if (!form.owner_name.trim() || !form.checkin_date || !form.service_type) {
      toast.error("Preenche o nome do dono, data de check-in e tipo de serviço.");
      return;
    }
    if (grandTotal <= 0) {
      toast.error("Insere um valor total para registar pagamento.");
      return;
    }
    onSave(buildPayload({ payment_status: "paid" }));
    toast.success(`Reserva criada e pagamento de €${grandTotal.toFixed(2)} registado (presencial)`);
    resetAndClose();
  };

  // Gerar link de pagamento para enviar ao cliente
  const handleGenerateLink = async () => {
    if (!form.owner_name.trim() || !form.checkin_date || !form.service_type) {
      toast.error("Preenche os dados obrigatórios antes de gerar o link.");
      return;
    }
    if (grandTotal <= 0) {
      toast.error("Insere um valor total para gerar o link de pagamento.");
      return;
    }
    setGeneratingLink(true);
    try {
      const payload = buildBookingPayload(form, hotelProfile, addOns);
      const res = await base44.functions.invoke("createHotelCheckout", payload);
      const { url, error } = res.data;
      if (error) { toast.error(error); return; }
      if (url) {
        setPaymentLink(url);
        queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });
        toast.success("Reserva criada e link de pagamento gerado.");
      }
    } catch (err) {
      toast.error("Erro ao gerar link: " + err.message);
    } finally {
      setGeneratingLink(false);
    }
  };

  // Pagar agora via Stripe (redireciona)
  const handlePayNow = async () => {
    if (!form.owner_name.trim() || !form.checkin_date || !form.service_type) {
      toast.error("Preenche os dados obrigatórios.");
      return;
    }
    if (grandTotal <= 0) {
      toast.error("Insere um valor total válido.");
      return;
    }
    setPayingNow(true);
    try {
      const payload = buildBookingPayload(form, hotelProfile, addOns);
      const res = await base44.functions.invoke("createHotelCheckout", payload);
      const { url, error } = res.data;
      if (error) { toast.error(error); return; }
      if (url) {
        queryClient.invalidateQueries({ queryKey: ["hotelBookings"] });
        window.location.href = url;
      }
    } catch (err) {
      toast.error("Erro ao iniciar pagamento: " + err.message);
    } finally {
      setPayingNow(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    toast.success("Link copiado para a área de transferência");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendLinkByEmail = async () => {
    if (!form.owner_email) {
      toast.error("Adiciona o email do cliente para enviar o link.");
      return;
    }
    try {
      await base44.integrations.Core.SendEmail({
        to: form.owner_email,
        subject: `Link de Pagamento - Reserva ${hotelProfile?.hotel_details?.hotel_name || hotelProfile?.walker_name || "Hotel"}`,
        body: `<p>Olá ${form.owner_name},</p><p>Aqui está o link de pagamento para a sua reserva:</p><p><a href="${paymentLink}">Pagar Agora</a></p><p>Valor: €${grandTotal.toFixed(2)}</p><p>Obrigado!</p>`,
      });
      toast.success("Email enviado com sucesso");
    } catch (err) {
      toast.error("Erro ao enviar email: " + err.message);
    }
  };

  if (!isOpen) return null;

  const inputCls = "w-full h-10 px-3 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 transition-colors bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={resetAndClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl max-h-[92vh] overflow-y-auto shadow-xl scrollbar-hide">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Nova Reserva</h2>
              <p className="text-slate-400 text-[11px]">Registo presencial de hóspede</p>
            </div>
          </div>
          <button onClick={resetAndClose}
            className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Payment Link Success State */}
        {paymentLink ? (
          <div className="p-5 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Reserva Criada</h3>
              <p className="text-slate-500 text-xs mt-1">
                A reserva foi registada e o link de pagamento foi gerado.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">Link de Pagamento</span>
                <span className="ml-auto text-sm font-bold text-slate-900">€{grandTotal.toFixed(2)}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 break-all">
                <p className="text-[11px] text-slate-500 font-mono">{paymentLink}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleCopyLink}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg gap-2 text-sm">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado" : "Copiar Link"}
              </Button>
              <Button onClick={handleSendLinkByEmail}
                variant="outline"
                className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg gap-2 text-sm"
                disabled={!form.owner_email}>
                <Send className="w-4 h-4" />
                Enviar por Email
              </Button>
            </div>

            <Button onClick={resetAndClose} variant="outline"
              className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-sm">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-5">
              {/* Service Type */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Tipo de Serviço
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SERVICE_OPTIONS.map(s => {
                    const Icon = s.icon;
                    const active = form.service_type === s.value;
                    return (
                      <button key={s.value} onClick={() => set("service_type", s.value)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-lg text-left border transition-all ${
                          active
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}>
                        <Icon className={`w-4 h-4 shrink-0 ${active ? "text-slate-900" : "text-slate-400"}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold ${active ? "text-slate-900" : "text-slate-600"}`}>{s.label}</p>
                          <p className="text-[10px] text-slate-400">{s.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Owner Data */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Dados do Cliente
                </label>
                <div className="space-y-2">
                  <input value={form.owner_name} onChange={e => set("owner_name", e.target.value)}
                    placeholder="Nome completo *" className={inputCls} />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.owner_phone} onChange={e => set("owner_phone", e.target.value)}
                      placeholder="Telefone" className={inputCls} />
                    <input value={form.owner_email} onChange={e => set("owner_email", e.target.value)}
                      placeholder="Email" className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Emergency & Vet */}
              <EmergencyContactFields form={form} set={set} />

              {/* Dates */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" /> Datas de Estadia
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <input type="date" value={form.checkin_date} onChange={e => set("checkin_date", e.target.value)}
                      className={inputCls} />
                    <input type="time" value={form.checkin_time} onChange={e => set("checkin_time", e.target.value)}
                      className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <input type="date" value={form.checkout_date} onChange={e => set("checkout_date", e.target.value)}
                      className={inputCls} />
                    <input type="time" value={form.checkout_time} onChange={e => set("checkout_time", e.target.value)}
                      className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Dogs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Dog className="w-3 h-3" /> Cães ({form.dogs.length})
                  </label>
                  <button onClick={addDog}
                    className="flex items-center gap-1 text-xs text-slate-700 font-semibold hover:text-slate-900">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Cão
                  </button>
                </div>
                <div className="space-y-2">
                  {form.dogs.map((dog, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700">Cão {i + 1}</span>
                        {form.dogs.length > 1 && (
                          <button onClick={() => removeDog(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input value={dog.dog_name} onChange={e => updateDog(i, "dog_name", e.target.value)}
                          placeholder="Nome" className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white" />
                        <input value={dog.dog_breed} onChange={e => updateDog(i, "dog_breed", e.target.value)}
                          placeholder="Raça" className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white" />
                        <select value={dog.dog_size} onChange={e => updateDog(i, "dog_size", e.target.value)}
                          className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white">
                          {DOG_SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <input type="number" value={dog.dog_age} onChange={e => updateDog(i, "dog_age", e.target.value)}
                          placeholder="Idade (anos)" className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white" />
                      </div>
                      <input value={dog.special_notes || ""} onChange={e => updateDog(i, "special_notes", e.target.value)}
                        placeholder="Notas especiais (alergias, medicação, comportamento)"
                        className="w-full h-9 px-2.5 mt-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white" />
                      <input value={dog.diet || ""} onChange={e => updateDog(i, "diet", e.target.value)}
                        placeholder="Dieta (ração, quantidade, horários)"
                        className="w-full h-9 px-2.5 mt-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white" />
                      <input value={dog.medications || ""} onChange={e => updateDog(i, "medications", e.target.value)}
                        placeholder="Medicamentos (nome, dosagem, horários)"
                        className="w-full h-9 px-2.5 mt-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white" />
                      <input value={dog.routine || ""} onChange={e => updateDog(i, "routine", e.target.value)}
                        placeholder="Rotina (passeios, sonecas, hábitos)"
                        className="w-full h-9 px-2.5 mt-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white" />
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Syringe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input type="date" value={dog.vaccine_expiry || ""} onChange={e => updateDog(i, "vaccine_expiry", e.target.value)}
                          title="Validade da vacina da raiva"
                          className="flex-1 h-9 px-2.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-slate-400 bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Partner */}
              {partners.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Profissional Responsável
                  </label>
                  <select value={form.assigned_walker_email} onChange={e => {
                    const p = partners.find(p => p.walker_email === e.target.value);
                    set("assigned_walker_email", e.target.value);
                    set("assigned_walker_name", p?.walker_name || "");
                  }} className={`${inputCls} cursor-pointer`}>
                    <option value="">Sem atribuição</option>
                    {partners.map(p => (
                      <option key={p.walker_email} value={p.walker_email}>
                        {p.walker_name} {(p.services || []).length > 0 ? `(${p.services.join(", ")})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Add-ons */}
              <HotelServiceAddons
                addOns={addOns}
                onAddOnsChange={setAddOns}
                partners={partners}
              />

              {/* Price Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Serviço base</span>
                    <span className="font-semibold text-slate-700">€{baseAmount.toFixed(2)}</span>
                  </div>
                  {addOnsTotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Serviços adicionais ({addOns.length})</span>
                      <span className="font-semibold text-slate-700">€{addOnsTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="font-bold text-slate-900 text-lg">€{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Amount + Notes */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Valor do Serviço (€)
                  </label>
                  <input type="number" min="0" step="0.01" value={form.total_amount}
                    onChange={e => set("total_amount", e.target.value)} placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Pedidos Especiais
                  </label>
                  <textarea value={form.special_requests} onChange={e => set("special_requests", e.target.value)}
                    rows={2} placeholder="Instruções do cliente, necessidades especiais..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-400 resize-none bg-white" />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 space-y-3">
              {/* Direct check-in toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={directCheckin}
                    onChange={e => setDirectCheckin(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                </div>
                <div className="flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    Check-in imediato {directCheckin && <span className="text-emerald-600">(animal já no hotel)</span>}
                  </span>
                </div>
              </label>

              {/* Payment buttons */}
              {grandTotal > 0 ? (
                <>
                  <Button onClick={handlePayNow} disabled={payingNow || !form.owner_name.trim()}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold gap-2 disabled:opacity-40 text-sm">
                    {payingNow ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    {payingNow ? "A redirecionar..." : `Pagar Online · €${grandTotal.toFixed(2)}`}
                  </Button>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" onClick={resetAndClose}
                      className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 text-xs">
                      Cancelar
                    </Button>
                    <Button onClick={handleGenerateLink} disabled={generatingLink || !form.owner_name.trim()}
                      className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold gap-1.5 disabled:opacity-40 text-xs">
                      {generatingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                      {generatingLink ? "..." : "Gerar Link"}
                    </Button>
                    <Button onClick={handlePaidOffline} disabled={!form.owner_name.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold gap-1.5 disabled:opacity-40 text-xs">
                      <Banknote className="w-3.5 h-3.5" />
                      Pago Presencial
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={resetAndClose}
                    className="rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 text-sm">
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveOnly} disabled={!form.owner_name.trim()}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold gap-2 disabled:opacity-40 text-sm">
                    <Check className="w-4 h-4" /> {directCheckin ? "Check-in + Guardar" : "Guardar Reserva"}
                  </Button>
                </div>
              )}
              <p className="text-center text-[10px] text-slate-400 leading-relaxed">
                {grandTotal > 0
                  ? "Online: Stripe · Link: enviar ao cliente · Presencial: dinheiro/MBWay"
                  : directCheckin
                    ? "Reserva criada diretamente como check-in (animal já presente)"
                    : "Sem valor: reserva fica pendente de pagamento presencial"
                }
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}