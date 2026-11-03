import React from "react";
import { Clock } from "lucide-react";
import { discountLabel, freePickupState, promotionEndsAt } from "@/lib/promotions";
import UrgencyCountdown from "@/components/promotions/UrgencyCountdown";

// Bloco de promoção no cartão do serviço: benefício, prazo real e disponibilidade.
export default function PromotionBadge({ promotion, className = "" }) {
  if (!promotion) return null;

  const discount = discountLabel(promotion);
  const pickup = freePickupState(promotion);
  const hasFreeTransport = !!pickup && !pickup.exhausted;
  const hasEnd = !!promotionEndsAt(promotion);

  let benefit = promotion.free_extra || "";
  if (hasFreeTransport) benefit = "Transporte grátis ida e volta";
  else if (!benefit && discount) benefit = `Desconto de ${discount.replace("-", "")}`;

  const limitedLeft = pickup && !pickup.exhausted && !pickup.unlimited ? pickup.left : null;

  return (
    <div className={`rounded-xl border border-teal-100 bg-teal-50/60 px-3 py-2.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">
          Promoção
        </span>
        {discount && (
          <span className="rounded-md bg-teal-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
            {discount}
          </span>
        )}
      </div>

      {benefit && (
        <p className="mt-1 text-[13px] font-semibold leading-snug text-slate-900">{benefit}</p>
      )}

      {(hasEnd || limitedLeft !== null) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
          {hasEnd && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0 text-slate-400" />
              <UrgencyCountdown promotion={promotion} />
            </span>
          )}
          {hasEnd && limitedLeft !== null && (
            <span className="h-1 w-1 rounded-full bg-slate-300" />
          )}
          {limitedLeft !== null && (
            <span className={limitedLeft <= 3 ? "font-semibold text-rose-600" : undefined}>
              {limitedLeft <= 3 ? `Últimas ${limitedLeft} vagas` : `${limitedLeft} vagas restantes`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}