import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  Gift, Plus, Upload, Trash2, Loader2, Pencil, Power, Package, Infinity as InfinityIcon,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  { id: "food", label: "Alimentação" },
  { id: "toys", label: "Brinquedos" },
  { id: "accessories", label: "Acessórios" },
  { id: "grooming", label: "Tosquia & Cuidados" },
  { id: "health", label: "Saúde" },
  { id: "training", label: "Treino" },
  { id: "other", label: "Outros" },
];

const EMPTY_FORM = {
  product_name: "",
  description: "",
  category: "food",
  image_url: "",
  stock_unlimited: true,
  stock_quantity: 50,
};

export default function AdminMimosManager() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  const { data: mimos = [], isLoading } = useQuery({
    queryKey: ["adminPawcaoMimos"],
    queryFn: () =>
      base44.entities.PartnerProduct.filter(
        { is_pawcao_mimo: true },
        "-created_date",
        200
      ),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      set("image_url", res.file_url);
      toast.success("Imagem carregada!");
    } catch {
      toast.error("Erro ao carregar imagem");
    } finally {
      setUploading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (mimo) => {
    setEditing(mimo);
    setForm({
      product_name: mimo.product_name || "",
      description: mimo.description || "",
      category: mimo.category || "food",
      image_url: mimo.image_url || "",
      stock_unlimited: (mimo.stock_quantity || 0) >= 999999,
      stock_quantity: (mimo.stock_quantity || 0) >= 999999 ? 50 : mimo.stock_quantity || 50,
    });
    setShowModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const stockQty = form.stock_unlimited ? 999999 : Math.max(1, Number(form.stock_quantity) || 1);
      const payload = {
        product_name: form.product_name.trim(),
        description: form.description.trim(),
        category: form.category,
        image_url: form.image_url,
        stock_quantity: stockQty,
        is_pawcao_mimo: true,
        price_euro: 0,
        delivery_method: "with_stay",
        moderation_status: "approved",
        is_available: true,
        partner_id: "pawcao-mimos",
        partner_name: "PawCão",
        partner_company_email: "mimos@pawcao.pt",
      };
      if (editing) {
        return base44.entities.PartnerProduct.update(editing.id, payload);
      }
      return base44.entities.PartnerProduct.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPawcaoMimos"] });
      queryClient.invalidateQueries({ queryKey: ["shopMimos"] });
      queryClient.invalidateQueries({ queryKey: ["shopProducts"] });
      toast.success(editing ? "Mimo atualizado!" : "Mimo criado!");
      setShowModal(false);
    },
    onError: (err) => toast.error(err?.response?.data?.error || "Erro ao guardar mimo"),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, current }) =>
      base44.entities.PartnerProduct.update(id, { is_available: !current }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPawcaoMimos"] });
      queryClient.invalidateQueries({ queryKey: ["shopMimos"] });
      toast.success("Estado atualizado!");
    },
    onError: () => toast.error("Erro ao alterar estado"),
  });

  const deleteMimo = useMutation({
    mutationFn: (id) => base44.entities.PartnerProduct.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPawcaoMimos"] });
      queryClient.invalidateQueries({ queryKey: ["shopMimos"] });
      toast.success("Mimo eliminado!");
    },
    onError: () => toast.error("Erro ao eliminar"),
  });

  const handleSave = () => {
    if (!form.product_name.trim()) return toast.error("Dá um nome ao mimo");
    if (!form.stock_unlimited && (!form.stock_quantity || form.stock_quantity < 1))
      return toast.error("Define a quantidade disponível");
    saveMutation.mutate();
  };

  const handleDelete = (mimo) => {
    if (window.confirm(`Eliminar "${mimo.product_name}"?`)) {
      deleteMimo.mutate(mimo.id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-teal-600" />
            Mimos PawCão
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Catálogo central de mimos grátis — oferecidos pela PawCão e entregues pelos hotéis durante as estadias.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Criar mimo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip label="Total" value={mimos.length} color="teal" />
        <StatChip label="Ativos" value={mimos.filter((m) => m.is_available).length} color="green" />
        <StatChip label="Inativos" value={mimos.filter((m) => !m.is_available).length} color="slate" />
        <StatChip
          label="Esgotados"
          value={mimos.filter((m) => (m.stock_quantity || 0) < 1).length}
          color="red"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : mimos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-teal-400" />
          </div>
          <p className="font-semibold text-slate-700">Ainda não há mimos PawCão</p>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Cria o primeiro mimo grátis — vai aparecer em destaque na Loja com badge "Grátis".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mimos.map((mimo) => (
            <MimoCard
              key={mimo.id}
              mimo={mimo}
              onEdit={() => openEdit(mimo)}
              onToggle={() => toggleActive.mutate({ id: mimo.id, current: mimo.is_available })}
              onDelete={() => handleDelete(mimo)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={(open) => !open && setShowModal(false)}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 rounded-3xl bg-white">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-teal-600" />
              {editing ? "Editar mimo" : "Novo mimo PawCão"}
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1">
              Mimos grátis aparecem em destaque na Loja e são entregues pelo hotel durante a estadia.
            </p>
          </DialogHeader>

          <div className="px-5 pb-5 space-y-4">
            {/* Image */}
            <div>
              <Label className="text-sm font-semibold text-slate-700">Imagem</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                  {form.image_url ? (
                    <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="cursor-pointer px-3 py-2 rounded-xl text-xs font-semibold transition-colors border bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200">
                    {uploading ? "A carregar..." : "Carregar imagem"}
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
                      className="px-3 py-2 rounded-xl text-xs font-semibold border bg-red-50 border-red-100 text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label className="text-sm font-semibold text-slate-700">Nome *</Label>
              <Input
                value={form.product_name}
                onChange={(e) => set("product_name", e.target.value)}
                placeholder="Ex: Petisco de frango"
                className="mt-1.5"
              />
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-semibold text-slate-700">Categoria</Label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="mt-1.5 w-full h-10 px-3 rounded-xl text-sm focus:outline-none border border-slate-200 bg-white text-slate-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-semibold text-slate-700">Descrição</Label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Descreve o mimo — o que é, para quem é ideal..."
                rows={3}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 border border-slate-200 bg-white text-slate-900"
              />
            </div>

            {/* Stock */}
            <div className="rounded-xl border border-slate-200 p-3.5 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.stock_unlimited}
                  onChange={(e) => set("stock_unlimited", e.target.checked)}
                  className="w-4 h-4 rounded accent-teal-600"
                />
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <InfinityIcon className="w-4 h-4 text-teal-600" />
                  Stock ilimitado
                </span>
              </label>
              {!form.stock_unlimited && (
                <div>
                  <Label className="text-sm font-semibold text-slate-700">Quantidade disponível *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.stock_quantity}
                    onChange={(e) => set("stock_quantity", Number(e.target.value))}
                    className="mt-1.5"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Quando chegar a 0, o mimo desaparece da Loja.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-5 pb-5 gap-3 flex-row">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A guardar...
                </>
              ) : editing ? "Guardar" : "Criar mimo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatChip({ label, value, color }) {
  const colors = {
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
    red: "bg-red-50 text-red-600 border-red-100",
  };
  return (
    <div className={`rounded-2xl border p-3.5 ${colors[color] || colors.slate}`}>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="text-xs font-semibold mt-1 opacity-80">{label}</p>
    </div>
  );
}

function MimoCard({ mimo, onEdit, onToggle, onDelete }) {
  const soldOut = (mimo.stock_quantity || 0) < 1;
  const unlimited = (mimo.stock_quantity || 0) >= 999999;
  const inactive = !mimo.is_available;

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-opacity ${inactive ? "border-slate-200 opacity-60" : "border-slate-100 shadow-sm"}`}>
      <div className="w-full h-32 relative bg-slate-100">
        {mimo.image_url ? (
          <img src={mimo.image_url} alt={mimo.product_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gift className="w-8 h-8 text-slate-300" />
          </div>
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center gap-0.5">
          <Gift className="w-2.5 h-2.5" /> Grátis
        </span>
        {inactive && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">
            Inativo
          </span>
        )}
        {soldOut && !inactive && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
            Esgotado
          </span>
        )}
      </div>
      <div className="p-3.5">
        <p className="font-bold text-slate-900 text-sm leading-tight truncate">{mimo.product_name}</p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{mimo.description || "—"}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 rounded-full px-2 py-0.5">
            {unlimited ? "∞ ilimitado" : `${mimo.stock_quantity} unid.`}
          </span>
          <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 rounded-full px-2 py-0.5">
            {CATEGORIES.find((c) => c.id === mimo.category)?.label || "Outros"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={onToggle}
            className={`flex-1 flex items-center justify-center gap-1 h-8 rounded-lg text-xs font-semibold transition-colors ${
              mimo.is_available
                ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                : "text-green-600 bg-green-50 hover:bg-green-100"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {mimo.is_available ? "Desativar" : "Ativar"}
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}