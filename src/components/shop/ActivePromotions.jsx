import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Sparkles, Megaphone, Truck } from "lucide-react";
import {
  discountLabel,
  freePickupState,
  getPromotionStatus,
  promoScopeLabel,
  vacanciesLeft,
} from "@/lib/promotions";

export default function ActivePromotions() {
  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ["shopPromotions"],
    queryFn: () =>
      base44.entities.Promotion.filter(
        { status: { $in: ["active", "sold_out"] } },
        "-created_date",
        20
      ),
    staleTime: 60 * 1000,
  });

  const active = useMemo(
    () =>
      promotions.filter((p) =>
        ["active", "scheduled", "sold_out"].includes(getPromotionStatus(p))
      ),
    [promotions]
  );

  if (isLoading || active.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2.5">
        <Megaphone className="w-4 h-4 text-teal-600" />
        <p className="font-heading font-extrabold text-base text-slate-900">Promoções dos parceiros</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {active.map((promo) => {
          const discount = discountLabel(promo);
          const left = vacanciesLeft(promo);
          const pickup = freePickupState(promo);
          const soldOut = left === 0;
          return (
            <div
              key={promo.id}
              className="snap-start shrink-0 w-[280px] rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-teal-700">
                  {promo.partner_name || "Parceiro PawCão"}
                </span>
                {discount && (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-teal-600 text-white shrink-0">
                    {discount}
                  </span>
                )}
              </div>
              <p className="font-heading font-extrabold text-[15px] text-slate-900 leading-tight mt-1.5">
                {promo.title}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{promoScopeLabel(promo)}</p>

              <div className="flex flex-wrap gap-1.5 mt-2">
                {promo.free_extra && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-teal-800 border border-teal-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {promo.free_extra}
                  </span>
                )}
                {pickup && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      pickup.exhausted
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-white text-emerald-700 border-emerald-200"
                    }`}
                  >
                    <Truck className="w-3 h-3" />
                    {pickup.exhausted
                      ? "Recolha grátis esgotada"
                      : pickup.unlimited
                      ? "Recolha grátis"
                      : `Recolha grátis · ${pickup.left} restantes`}
                  </span>
                )}
                {left !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      soldOut
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    {soldOut ? "Esgotada" : `${left} vagas restantes`}
                  </span>
                )}
              </div>

              {promo.description && (
                <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">{promo.description}</p>
              )}

              <div
                className={`mt-3 w-full rounded-xl px-2.5 py-2 text-center border ${
                  soldOut
                    ? "bg-slate-50 border-slate-200"
                    : "bg-teal-600 border-teal-600"
                }`}
              >
                <p
                  className={`text-[11px] font-bold flex items-center justify-center gap-1.5 ${
                    soldOut ? "text-slate-400" : "text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {soldOut ? "Vagas esgotadas" : "Desconto aplicado ao finalizar"}
                </p>
                <p className={`text-[10px] mt-0.5 leading-snug ${soldOut ? "text-slate-400" : "text-teal-50"}`}>
                  {soldOut
                    ? "Esta promoção já atingiu o limite de participantes."
                    : "Só conta como participação quando a compra ou reserva é confirmada."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}