import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Pencil, Pause, Play, Ban, Trash2, Megaphone } from "lucide-react";
import PromotionFormModal from "./PromotionFormModal";
import {
  PROMO_STATUS_LABEL,
  PROMO_STATUS_STYLE,
  discountLabel,
  freePickupState,
  getPromotionStatus,
  promoScopeLabel,
  vacanciesLeft,
} from "@/lib/promotions";

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "active", label: "Ativas" },
  { id: "paused", label: "Pausadas" },
  { id: "sold_out", label: "Esgotadas" },
  { id: "expired", label: "Terminadas" },
];

export default function AdminPromotionsManager({ products = [] }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["adminPromotions"],
    queryFn: () => base44.entities.Promotion.list("-created_date", 100),
    staleTime: 60 * 1000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Promotion.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPromotions"] });
      queryClient.invalidateQueries({ queryKey: ["shopPromotions"] });
      toast.success("Promoção atualizada");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Promotion.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPromotions"] });
      queryClient.invalidateQueries({ queryKey: ["shopPromotions"] });
      toast.success("Promoção eliminada");
    },
  });

  const withStatus = useMemo(
    () => promotions.map((p) => ({ ...p, _status: getPromotionStatus(p) })),
    [promotions]
  );

  const visible = useMemo(
    () => (filter === "all" ? withStatus : withStatus.filter((p) => p._status === filter)),
    [withStatus, filter]
  );

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (promo) => {
    setEditing(promo);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-heading font-extrabold text-lg text-slate-900">Promoções</p>
          <p className="text-xs text-slate-500">
            Descontos, ofertas com serviço extra e vagas limitadas para produtos e hotéis.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="h-10 px-3.5 rounded-xl bg-teal-600 text-white text-[12px] font-bold flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 h-8 rounded-full text-[11px] font-bold border transition-colors ${
              filter === f.id
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white py-12 text-center">
          <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Ainda sem promoções</p>
          <p className="text-xs text-slate-500 mt-1">Cria a primeira oferta para produtos ou hotéis.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((promo) => {
            const left = vacanciesLeft(promo);
            const max = promo.max_participants || 0;
            const discount = discountLabel(promo);
            const pickup = freePickupState(promo);
            return (
              <div key={promo.id} className="rounded-2xl border border-slate-200 bg-white p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{promo.title}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {promo.partner_name || "PawCão"} · {promoScopeLabel(promo)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      PROMO_STATUS_STYLE[promo._status]
                    }`}
                  >
                    {PROMO_STATUS_LABEL[promo._status]}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {discount && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white">
                      {discount}
                    </span>
                  )}
                  {promo.free_extra && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {promo.free_extra}
                    </span>
                  )}
                  {promo.scope === "hotel_service" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Hotel
                    </span>
                  )}
                  {pickup && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        pickup.exhausted
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {pickup.exhausted
                        ? "Recolha grátis esgotada"
                        : pickup.unlimited
                        ? "Recolha grátis sem limite"
                        : `Recolha grátis ${pickup.used}/${pickup.limit}`}
                    </span>
                  )}
                </div>

                {pickup && (
                  <p className="text-[10px] font-semibold text-slate-500 mt-2">
                    {pickup.exhausted
                      ? "Limite atingido — a recolha volta a ser cobrada ao preço normal."
                      : pickup.unlimited
                      ? "Recolha não cobrada em todas as adesões."
                      : `${pickup.left} recolhas gratuitas restantes. Depois volta ao preço normal.`}
                  </p>
                )}

                {max > 0 && (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                      <span>
                        {promo.participants_count || 0} de {max} vagas usadas
                      </span>
                      <span>{left} restantes</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${Math.min(100, ((promo.participants_count || 0) / max) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-3">
                  <p className="text-[10px] text-slate-400">
                    {promo.start_date || "—"} até {promo.end_date || "sem fim"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEdit(promo)}
                      aria-label="Editar promoção"
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:border-teal-300 hover:text-teal-700"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {promo._status === "paused" ? (
                      <button
                        onClick={() => statusMutation.mutate({ id: promo.id, status: "active" })}
                        aria-label="Reativar promoção"
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-teal-700 hover:border-teal-300"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => statusMutation.mutate({ id: promo.id, status: "paused" })}
                        aria-label="Pausar promoção"
                        className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-amber-600 hover:border-amber-300"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => statusMutation.mutate({ id: promo.id, status: "expired" })}
                      aria-label="Terminar promoção"
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-slate-400"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Eliminar a promoção "${promo.title}"?`)) {
                          deleteMutation.mutate(promo.id);
                        }
                      }}
                      aria-label="Eliminar promoção"
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-rose-600 hover:border-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PromotionFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        promotion={editing}
        products={products}
      />
    </div>
  );
}