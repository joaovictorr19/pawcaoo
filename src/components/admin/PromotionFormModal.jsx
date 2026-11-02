import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImagePlus, Loader2, Truck } from "lucide-react";
import { todayISO } from "@/lib/promotions";

const EMPTY = {
  title: "",
  description: "",
  scope: "product",
  product_id: "",
  product_name: "",
  partner_id: "",
  partner_name: "",
  service_name: "",
  discount_type: "percentage",
  discount_value: 10,
  free_extra: "",
  free_pickup: false,
  free_pickup_limit: 10,
  free_pickup_used: 0,
  max_participants: 10,
  start_date: todayISO(),
  end_date: "",
  status: "active",
  image_url: "",
  is_highlighted: true,
};

const fieldCls =
  "w-full h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500";
const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5";

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-extrabold uppercase tracking-wide text-teal-700">{title}</p>
      {children}
    </div>
  );
}

export default function PromotionFormModal({ open, onClose, promotion, products = [] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(promotion ? { ...EMPTY, ...promotion } : { ...EMPTY, start_date: todayISO() });
  }, [open, promotion]);

  const { data: hotels = [] } = useQuery({
    queryKey: ["promoHotels"],
    queryFn: () => base44.entities.WalkerProfile.filter({ professional_type: "hotel" }, "-created_date", 50),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const selectedHotel = useMemo(
    () => hotels.find((h) => h.id === form.partner_id),
    [hotels, form.partner_id]
  );

  const hotelServices = useMemo(() => {
    const list = selectedHotel?.hotel_details?.services || [];
    return [...new Set(list.map((s) => s.service_name).filter(Boolean))];
  }, [selectedHotel]);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        discount_value: Number(data.discount_value) || 0,
        max_participants: Number(data.max_participants) || 0,
        free_pickup: !!data.free_pickup,
        free_pickup_limit: Number(data.free_pickup_limit) || 0,
        end_date: data.end_date || null,
      };
      if (promotion?.id) return base44.entities.Promotion.update(promotion.id, payload);
      return base44.entities.Promotion.create({
        ...payload,
        participants_count: 0,
        claimed_emails: [],
        free_pickup_used: 0,
        free_pickup_emails: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPromotions"] });
      queryClient.invalidateQueries({ queryKey: ["shopPromotions"] });
      toast.success(promotion ? "Promoção atualizada" : "Promoção publicada");
      onClose();
    },
    onError: () => toast.error("Não foi possível guardar a promoção"),
  });

  const handleImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set({ image_url: file_url });
    } catch {
      toast.error("Não foi possível carregar a imagem");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!form.title.trim()) return toast.error("Indica o título da promoção");
    if (form.scope === "product" && !form.product_id) return toast.error("Escolhe o produto");
    if (form.scope === "hotel_service" && !form.service_name.trim())
      return toast.error("Indica o serviço do hotel");
    saveMutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 flex flex-col h-[92vh] sm:h-auto sm:max-h-[88vh] overflow-hidden bg-white sm:rounded-3xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <DialogTitle className="font-heading text-lg text-slate-900">
            {promotion ? "Editar promoção" : "Nova promoção"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <Section title="O que vais promover">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "product", label: "Produto da loja" },
                { id: "hotel_service", label: "Serviço de hotel" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => set({ scope: opt.id })}
                  className={`h-11 rounded-xl border text-[12px] font-bold transition-colors ${
                    form.scope === opt.id
                      ? "bg-teal-50 border-teal-500 text-teal-800"
                      : "bg-white border-slate-200 text-slate-600 hover:border-teal-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {form.scope === "product" ? (
              <div>
                <label className={labelCls}>Produto</label>
                <select
                  className={fieldCls}
                  value={form.product_id}
                  onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    set({
                      product_id: e.target.value,
                      product_name: p?.product_name || "",
                      partner_id: p?.partner_id || "",
                      partner_name: p?.partner_name || "",
                    });
                  }}
                >
                  <option value="">Escolher produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} — {p.partner_name || "Parceiro"}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className={labelCls}>Hotel / parceiro</label>
                  <select
                    className={fieldCls}
                    value={form.partner_id}
                    onChange={(e) => {
                      const h = hotels.find((x) => x.id === e.target.value);
                      set({
                        partner_id: e.target.value,
                        partner_name: h?.hotel_details?.hotel_name || h?.walker_name || "",
                        service_name: "",
                      });
                    }}
                  >
                    <option value="">Escolher hotel...</option>
                    {hotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.hotel_details?.hotel_name || h.walker_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Serviço</label>
                  {hotelServices.length > 0 && (
                    <select
                      className={`${fieldCls} mb-2`}
                      value={hotelServices.includes(form.service_name) ? form.service_name : ""}
                      onChange={(e) => set({ service_name: e.target.value })}
                    >
                      <option value="">Escolher serviço do hotel...</option>
                      {hotelServices.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    className={fieldCls}
                    value={form.service_name}
                    onChange={(e) => set({ service_name: e.target.value })}
                    placeholder="Ex: Banho e tosquia"
                  />
                </div>
              </>
            )}

            <div>
              <label className={labelCls}>Título da promoção</label>
              <input
                className={fieldCls}
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Ex: Recolha grátis para os 10 primeiros banhos"
              />
            </div>
            <div>
              <label className={labelCls}>Descrição</label>
              <textarea
                className="w-full min-h-[76px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                value={form.description || ""}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Condições da oferta"
              />
            </div>
          </Section>

          <Section title="Vantagem para o cliente">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "none", label: "Sem desconto" },
                { id: "percentage", label: "Desconto %" },
                { id: "fixed", label: "Desconto €" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => set({ discount_type: opt.id })}
                  className={`h-10 rounded-xl border text-[12px] font-bold transition-colors ${
                    form.discount_type === opt.id
                      ? "bg-teal-50 border-teal-500 text-teal-800"
                      : "bg-white border-slate-200 text-slate-600 hover:border-teal-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.discount_type !== "none" && (
              <div>
                <label className={labelCls}>
                  {form.discount_type === "percentage" ? "Desconto (%)" : "Desconto (€)"}
                </label>
                <input
                  type="number"
                  min="0"
                  className={fieldCls}
                  value={form.discount_value}
                  onChange={(e) => set({ discount_value: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className={labelCls}>Serviço extra grátis</label>
              <input
                className={fieldCls}
                value={form.free_extra || ""}
                onChange={(e) => set({ free_extra: e.target.value })}
                placeholder="Ex: Recolha grátis ao domicílio"
              />
            </div>
          </Section>

          <Section title="Recolha gratuita">
            <button
              onClick={() => set({ free_pickup: !form.free_pickup })}
              className={`w-full h-12 rounded-xl border px-3.5 flex items-center justify-between transition-colors ${
                form.free_pickup
                  ? "bg-teal-50 border-teal-500"
                  : "bg-white border-slate-200 hover:border-teal-300"
              }`}
            >
              <span className="flex items-center gap-2 text-[12px] font-bold text-slate-700">
                <Truck className={`w-4 h-4 ${form.free_pickup ? "text-teal-700" : "text-slate-400"}`} />
                Não cobrar a recolha
              </span>
              <span
                className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
                  form.free_pickup ? "bg-teal-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.free_pickup ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </span>
            </button>

            {form.free_pickup && (
              <>
                <div>
                  <label className={labelCls}>Recolhas gratuitas incluídas</label>
                  <input
                    type="number"
                    min="0"
                    className={fieldCls}
                    value={form.free_pickup_limit}
                    onChange={(e) => set({ free_pickup_limit: e.target.value })}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">0 = recolha gratuita sem limite</p>
                </div>
                <p className="text-[11px] text-teal-900 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2 leading-snug">
                  As primeiras {Number(form.free_pickup_limit) || 0} recolhas não são cobradas. Assim que
                  esse limite for atingido, a recolha volta a ser cobrada ao preço normal do parceiro.
                </p>
                {promotion && (
                  <p className="text-[10px] text-slate-500 font-semibold">
                    Já usadas: {promotion.free_pickup_used || 0} de {Number(form.free_pickup_limit) || 0}
                  </p>
                )}
              </>
            )}
          </Section>

          <Section title="Limite e validade">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Máx. participantes</label>
                <input
                  type="number"
                  min="0"
                  className={fieldCls}
                  value={form.max_participants}
                  onChange={(e) => set({ max_participants: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 mt-1">0 = sem limite</p>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select
                  className={fieldCls}
                  value={form.status}
                  onChange={(e) => set({ status: e.target.value })}
                >
                  <option value="active">Ativa</option>
                  <option value="paused">Pausada</option>
                  <option value="expired">Terminada</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Começa</label>
                <input
                  type="date"
                  className={fieldCls}
                  value={form.start_date || ""}
                  onChange={(e) => set({ start_date: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Termina</label>
                <input
                  type="date"
                  className={fieldCls}
                  value={form.end_date || ""}
                  onChange={(e) => set({ end_date: e.target.value })}
                />
              </div>
            </div>
          </Section>

          <Section title="Imagem (opcional)">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <label className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-[12px] font-bold text-slate-600 flex items-center gap-2 cursor-pointer hover:border-teal-300">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                {uploading ? "A carregar..." : "Escolher imagem"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImage(e.target.files?.[0])}
                />
              </label>
            </div>
          </Section>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-5 py-3 flex gap-2">
          <button
            onClick={onClose}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex-1 h-11 rounded-xl bg-teal-600 text-white text-sm font-bold disabled:opacity-50"
          >
            {saveMutation.isPending ? "A guardar..." : "Guardar promoção"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}