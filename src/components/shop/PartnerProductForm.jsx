import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Upload, Trash2 } from "lucide-react";

const CATEGORIES = [
  { id: "food", label: "Alimentação" },
  { id: "toys", label: "Brinquedos" },
  { id: "accessories", label: "Acessórios" },
  { id: "grooming", label: "Tosquia & Cuidados" },
  { id: "health", label: "Saúde" },
  { id: "training", label: "Treino" },
  { id: "other", label: "Outros" },
];

const DELIVERY_OPTIONS = [
  { id: "shipping", label: "Entrega ao domicílio" },
  { id: "pickup", label: "Recolha no local" },
  { id: "with_stay", label: "Adicionar à próxima estadia" },
];

export default function PartnerProductForm({ open, onClose, product, partner }) {
  const queryClient = useQueryClient();
  const isEdit = !!product?.id;
  const [form, setForm] = useState(() => ({
    product_name: product?.product_name || "",
    description: product?.description || "",
    category: product?.category || "food",
    product_type: product?.product_type || "product",
    price_euro: product?.price_euro ?? 0,
    stock_quantity: product?.stock_quantity ?? 1,
    delivery_method: product?.delivery_method || "pickup",
    partner_location: product?.partner_location || partner.partner_location || "",
    image_url: product?.image_url || "",
  }));
  const [uploading, setUploading] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      set("image_url", res.file_url);
      toast.success("Foto carregada!");
    } catch (err) {
      toast.error("Erro ao carregar a foto");
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = { ...form };
      if (isEdit) {
        return base44.entities.PartnerProduct.update(product.id, data);
      }
      return base44.entities.PartnerProduct.create({
        ...data,
        partner_id: partner.partner_id,
        partner_name: partner.partner_name,
        partner_company_email: partner.partner_email,
        partner_photo_url: partner.partner_photo_url || "",
        moderation_status: "approved",
        is_available: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerProducts"] });
      queryClient.invalidateQueries({ queryKey: ["shopProducts"] });
      toast.success(isEdit ? "Produto atualizado!" : "Produto publicado na Loja! 🛍️");
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.error || "Erro ao guardar o produto"),
  });

  const handleSave = () => {
    if (!form.product_name.trim()) return toast.error("Dá um nome ao produto");
    if (!form.price_euro || form.price_euro <= 0) return toast.error("Define um preço válido");
    if (form.stock_quantity < 1) return toast.error("Define o stock ou vagas disponíveis");
    saveMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 rounded-3xl bg-slate-900 border-white/10">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-bold text-white">
            {isEdit ? "Editar Produto" : "Novo Produto / Serviço"}
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-1">
            {isEdit
              ? "As alterações ficam visíveis na Loja de imediato."
              : "Profissionais verificados publicam diretamente na Loja."}
          </p>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Foto */}
          <div>
            <Label className="text-slate-300 text-sm font-semibold">Foto</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors">
                  {uploading ? "A carregar..." : "Carregar foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                {form.image_url && (
                  <button
                    onClick={() => set("image_url", "")}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-red-400 text-xs font-semibold hover:bg-slate-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Nome + tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-slate-300 text-sm font-semibold">Nome *</Label>
              <Input
                value={form.product_name}
                onChange={(e) => set("product_name", e.target.value)}
                placeholder="Ex: Ração Royal Canin 5kg"
                className="mt-1.5 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm font-semibold">Tipo</Label>
              <select
                value={form.product_type}
                onChange={(e) => set("product_type", e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none"
              >
                <option value="product">Produto</option>
                <option value="service">Serviço avulso</option>
              </select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm font-semibold">Categoria</Label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label className="text-slate-300 text-sm font-semibold">Descrição</Label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Descreve o produto ou serviço — o que inclui, para quem é ideal..."
              rows={3}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          {/* Preço / stock / entrega */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-sm font-semibold">Preço (€) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price_euro}
                onChange={(e) => set("price_euro", Number(e.target.value))}
                className="mt-1.5 bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm font-semibold">
                {form.product_type === "service" ? "Vagas" : "Stock"} *
              </Label>
              <Input
                type="number"
                min="1"
                value={form.stock_quantity}
                onChange={(e) => set("stock_quantity", Number(e.target.value))}
                className="mt-1.5 bg-slate-800 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-sm font-semibold">Entrega</Label>
            <select
              value={form.delivery_method}
              onChange={(e) => set("delivery_method", e.target.value)}
              className="mt-1.5 w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:outline-none"
            >
              {DELIVERY_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-slate-300 text-sm font-semibold">Localização</Label>
            <Input
              value={form.partner_location}
              onChange={(e) => set("partner_location", e.target.value)}
              placeholder="Ex: Lisboa"
              className="mt-1.5 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A guardar...
                </>
              ) : isEdit ? (
                "Guardar alterações"
              ) : (
                "Publicar na Loja"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}