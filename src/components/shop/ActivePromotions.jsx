import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Megaphone, Sparkles, Truck, Clock, ArrowRight } from "lucide-react";
import UrgencyCountdown from "@/components/promotions/UrgencyCountdown";
import { resolvePartnerProfileLink } from "@/lib/partnerProfileLink";
import {
  discountLabel,
  freePickupState,
  getPromotionStatus,
  promoScopeLabel,
  promotionEndsAt,
  vacanciesLeft,
} from "@/lib/promotions";

export default function ActivePromotions() {
  const navigate = useNavigate();

  const openPartner = async (promo) => {
    const link = await resolvePartnerProfileLink(promo.partner_id);
    if (link) navigate(link);
  };

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
          const hasEnd = !!promotionEndsAt(promo);
          const extra = promo.free_extra || null;
          const lowStock = left !== null && !soldOut && left <= 3;

          return (
            <div
              key={promo.id}
              className="snap-start shrink-0 w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_14px_rgba(15,23,42,0.05)]"
            >
              <div className="px-4 pt-3.5 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">
                    {promo.partner_name || "Parceiro PawCão"}
                  </span>
                  {discount && (
                    <span className="shrink-0 rounded-md bg-slate-900 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                      {discount}
                    </span>
                  )}
                </div>

                <p className="mt-1.5 font-heading text-[15px] font-extrabold leading-tight text-slate-900">
                  {promo.title}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{promoScopeLabel(promo)}</p>

                {(extra || pickup) && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {extra && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                        <Sparkles className="h-3 w-3" />
                        {extra}
                      </span>
                    )}
                    {pickup && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                          pickup.exhausted
                            ? "border-slate-200 bg-slate-50 text-slate-400 line-through"
                            : "border-teal-200 bg-teal-50 text-teal-800"
                        }`}
                      >
                        <Truck className="h-3 w-3" />
                        Recolha grátis
                      </span>
                    )}
                  </div>
                )}

                {(hasEnd || left !== null) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500">
                    {hasEnd && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0 text-slate-400" />
                        <UrgencyCountdown promotion={promo} />
                      </span>
                    )}
                    {hasEnd && left !== null && <span className="h-1 w-1 rounded-full bg-slate-300" />}
                    {left !== null && (
                      <span className={soldOut ? "font-semibold text-slate-400" : lowStock ? "font-semibold text-rose-600" : undefined}>
                        {soldOut
                          ? "Esgotada"
                          : lowStock
                          ? `Últimas ${left} vagas`
                          : `${left} vagas restantes`}
                      </span>
                    )}
                  </div>
                )}

                {promo.description && (
                  <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-slate-500">
                    {promo.description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => openPartner(promo)}
                className="flex w-full items-center justify-between gap-2 border-t border-slate-100 bg-white px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                <span className={`text-[10px] leading-tight ${soldOut ? "text-slate-400" : "text-slate-500"}`}>
                  {soldOut ? "Limite de participantes atingido" : "Aplicado automaticamente no pagamento"}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-600 px-3 py-1.5 text-[11px] font-bold leading-none text-white">
                  {soldOut ? "Ver serviço" : "Reservar"}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}