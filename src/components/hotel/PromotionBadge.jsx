import React from "react";
import { Zap, Clock } from "lucide-react";
import { discountLabel, freePickupState } from "@/lib/promotions";
import UrgencyCountdown from "@/components/promotions/UrgencyCountdown";

// Selo de evento relâmpago no cartão do serviço: benefício + urgência real
export default function PromotionBadge({ promotion, className = "" }) {
  if (!promotion) return null;

  const discount = discountLabel(promotion);
  const pickup = freePickupState(promotion);
  const hasFreeTransport = pickup && !pickup.exhausted;

  let benefit = promotion.free_extra || "Promoção";
  if (hasFreeTransport) {
    // Transporte grátis não é uma percentagem de desconto — o preço do serviço e a
    // comissão mantêm-se iguais, apenas o transporte de ida e volta fica isento.
    benefit = "Transporte grátis ida e volta";
  } else if (discount) {
    benefit = discount;
  }

  const limitedLeft = pickup && !pickup.exhausted && !pickup.unlimited ? pickup.left : null;

  return (
    <span
      className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 pl-1 pr-2 py-[3px] text-white shadow-[0_3px_14px_rgba(249,115,22,0.32)] ring-1 ring-white/40 ${className}`}
    >
      <span className="inline-flex items-center gap-0.5 rounded-full bg-white/25 px-1.5 py-[2px] text-[9px] font-black uppercase tracking-[0.09em]">
        <Zap className="w-2.5 h-2.5" />
        Relâmpago
      </span>
      <span className="text-[10px] font-bold leading-tight">{benefit}</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-1.5 py-[2px] text-[10px] font-bold">
        <Clock className="w-2.5 h-2.5" />
        <UrgencyCountdown promotion={promotion} />
      </span>
      {limitedLeft !== null && (
        <span className="text-[9px] font-black uppercase tracking-[0.06em] text-white/95">
          {limitedLeft} restantes
        </span>
      )}
    </span>
  );
}