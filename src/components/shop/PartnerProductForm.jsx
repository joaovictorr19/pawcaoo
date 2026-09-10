import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, Gift } from "lucide-react";

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

export default function PartnerProductForm({ open, onClose, product, partner, variant = "dark", autoApprove = true }) {
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
    is_mimo: product?.delivery_method === "with_stay" && product?.product_type === "product",
  }));
  const [uploading, setUploading] = useState(false);

  const S =
    variant === "light"
      ? {
          dialog: "bg-white",
          title: "text-slate-900",
          sub: "text-slate-500",
          label: "text-slate-700",
          input: "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-teal-500/30",
          select: "bg-white border-slate-200 text-slate-900",
          uploadBox: "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200",
          cancel: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
          save: "bg-teal-600 hover:bg-teal-700 text-white",
        }
      : {
          dialog: "bg-slate-900 border-white/10",
          title: "text-white",
          sub: "text-slate-400",
          label: "text-slate-300",
          input: "bg-slate-800 border-white/10 text-white placeholder:text-slate-500",
          select: "bg-slate-800 border-white/10 text-white",
          uploadBox: "bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700",
          cancel: "border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700",
          save: "bg-orange-600 hover:bg-orange-700 text-white",
        };

  const set = (key, value) =>
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Ativar "mimo" força entrega com estadia
      if (key === "is_mimo" && value === true) {
        next.delivery_method = "with_stay";
        next.product_type = "product";
      }
      return next;
    });

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
      const { is_mimo, ...data } = form;
      if (isEdit) {
        return base44.entities.PartnerProduct.update(product.id, data);
      }
      return base44.entities.PartnerProduct.create({
        ...data,
        partner_id: partner.partner_id,
        partner_name: partner.partner_name,
        partner_company_email: partner.partner_email,
        partner_photo_url: partner.partner_photo_url || "",
        moderation_status: autoApprove ? "approved" : "pending",
        is_available: autoApprove,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerProducts"] });
      queryClient.invalidateQueries({ queryKey: ["shopProducts"] });
      toast.success(
        isEdit
          ? "Produto atualizado!"
          : autoApprove
          ? "Produto publicado na Loja! 🛍️"
          : "Produto enviado para aprovação da equipa PawCão! ⏳"
      );
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
      <DialogContent className={`max-w-lg max-h-[92vh] overflow-y-auto p-0 rounded-3xl ${S.dialog}`}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className={`text-lg font-bold ${S.title}`}>
            {isEdit ? "Editar Produto" : "Novo Produto / Serviço"}
          </DialogTitle>
          <p className={`text-xs mt-1 ${S.sub}`}>
            {isEdit
              ? "As alterações ficam visíveis na Loja de imediato."
              : autoApprove
              ? "Publicado diretamente na vitrine da Loja de Parceiros."
              : "Enviado para aprovação da equipa PawCão antes de ficar visível na Loja."}
          </p>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Foto */}
          <div>
            <Label className={`text-sm font-semibold ${S.label}`}>Foto</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload className="w-5 h-5 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <label
                  className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${S.uploadBox}`}
                >
                  {uploading ? "A carregar..." : "Carregar foto"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
                {form.image_url && (
                  <button
                    onClick={() => set("image_url", "")}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                      variant === "light"
                        ? "bg-red-50 border-red-100 text-red-500"
                        : "bg-slate-800 border-white/10 text-red-400"
                    }`}
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
              <Label className={`text-sm font-semibold ${S.label}`}>Nome *</Label>
              <Input
                value={form.product_name}
                onChange={(e) => set("product_name", e.target.value)}
                placeholder="Ex: Ração Royal Canin 5kg"
                className={`mt-1.5 ${S.input}`}
              />
            </div>
            <div>
              <Label className={`text-sm font-semibold ${S.label}`}>Tipo</Label>
              <select
                value={form.product_type}
                onChange={(e) => set("product_type", e.target.value)}
                className={`mt-1.5 w-full h-10 px-3 rounded-xl text-sm focus:outline-none border ${S.select}`}
              >
                <option value="product">Produto</option>
                <option value="service">Serviço avulso</option>
              </select>
            </div>
            <div>
              <Label className={`text-sm font-semibold ${S.label}`}>Categoria</Label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={`mt-1.5 w-full h-10 px-3 rounded-xl text-sm focus:outline-none border ${S.select}`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label className={`text-sm font-semibold ${S.label}`}>Descrição</Label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Descreve o produto ou serviço — o que inclui, para quem é ideal..."
              rows={3}
              className={`mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 border ${S.input}`}
            />
          </div>

          {/* Preço / stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={`text-sm font-semibold ${S.label}`}>Preço (€) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price_euro}
                onChange={(e) => set("price_euro", Number(e.target.value))}
                className={`mt-1.5 ${S.input}`}
              />
            </div>
            <div>
              <Label className={`text-sm font-semibold ${S.label}`}>
                {form.product_type === "service" ? "Vagas" : "Stock"} *
              </Label>
              <Input
                type="number"
                min="1"
                value={form.stock_quantity}
                onChange={(e) => set("stock_quantity", Number(e.target.value))}
                className={`mt-1.5 ${S.input}`}
              />
            </div>
          </div>

          {/* É mimo? toggle */}
          {form.product_type === "product" && (
            <label
              className={`flex items-center gap-3 cursor-pointer rounded-xl p-3 border transition-colors ${
                form.is_mimo
                  ? variant === "light"
                    ? "bg-teal-50 border-teal-200"
                    : "bg-teal-900/30 border-teal-500/30"
                  : variant === "light"
                  ? "bg-slate-50 border-slate-200"
                  : "bg-slate-800 border-white/10"
              }`}
            >
              <input
                type="checkbox"
                checked={form.is_mimo}
                onChange={(e) => set("is_mimo", e.target.checked)}
                className="w-4 h-4 rounded accent-teal-600"
              />
              <div className="flex-1">
                <span className={`flex items-center gap-1.5 text-sm font-bold ${S.title}`}>
                  <Gift className="w-4 h-4 text-teal-600" />
                  É um mimo?
                </span>
                <p className={`text-[11px] mt-0.5 ${S.sub}`}>
                  Mimos aparecem na secção "Mimos" da Loja e são entregues pelo hotel durante a estadia do cão.
                </p>
              </div>
            </label>
          )}

          {/* Entrega — escondida/locked quando é mimo (sempre with_stay) */}
          <div>
            <Label className={`text-sm font-semibold ${S.label}`}>Entrega</Label>
            {form.is_mimo ? (
              <div
                className={`mt-1.5 w-full h-10 px-3 rounded-xl text-sm flex items-center gap-2 border ${
                  variant === "light"
                    ? "bg-teal-50 border-teal-200 text-teal-700"
                    : "bg-slate-800 border-teal-500/30 text-teal-400"
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                Adicionar à próxima estadia (bloqueado para mimos)
              </div>
            ) : (
              <select
                value={form.delivery_method}
                onChange={(e) => set("delivery_method", e.target.value)}
                className={`mt-1.5 w-full h-10 px-3 rounded-xl text-sm focus:outline-none border ${S.select}`}
              >
                {DELIVERY_OPTIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Localização */}
          <div>
            <Label className={`text-sm font-semibold ${S.label}`}>Localização</Label>
            <Input
              value={form.partner_location}
              onChange={(e) => set("partner_location", e.target.value)}
              placeholder="Ex: Lisboa"
              className={`mt-1.5 ${S.input}`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className={`flex-1 h-11 rounded-xl text-sm font-bold transition-colors border ${S.cancel}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className={`flex-1 h-11 rounded-xl text-sm font-bold transition-colors flex items-center justify-center ${S.save}`}
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
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}