import React from "react";
import { Sparkles } from "lucide-react";
import { discountLabel, freePickupState } from "@/lib/promotions";

// Selo conciso de promoção no cartão do serviço
export default function PromotionBadge({ promotion, className = "" }) {
  if (!promotion) return null;

  const discount = discountLabel(promotion);
  const pickup = freePickupState(promotion);
  const hasFreeTransport = pickup && !pickup.exhausted;

  const parts = [];
  if (hasFreeTransport) {
    // Transporte grátis não é uma percentagem de desconto — o preço do serviço e a
    // comissão mantêm-se iguais, apenas o transporte de ida e volta fica isento.
    parts.push("Transporte grátis ida e volta");
  } else if (discount) {
    parts.push(discount);
  }
  if (parts.length === 0) parts.push(promotion.free_extra || "Promoção");

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-teal-600 text-white text-[10px] font-black tracking-wide shadow-sm ${className}`}
    >
      <Sparkles className="w-3 h-3 shrink-0" />
      {parts.join(" · ")}
    </span>
  );
}