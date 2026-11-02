import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getPromotionStatus } from "@/lib/promotions";

// Promoções ativas de um parceiro, indexadas pelo nome do serviço.
// Usado para assinalar o selo promocional no cartão de cada serviço.
export default function usePartnerPromotions(partnerId, enabled = true) {
  const { data: promotions = [] } = useQuery({
    queryKey: ["partnerPromotions", partnerId],
    queryFn: () =>
      base44.entities.Promotion.filter(
        { partner_id: partnerId, scope: "hotel_service" },
        "-created_date",
        50
      ),
    enabled: !!partnerId && enabled,
    staleTime: 60 * 1000,
  });

  return useMemo(() => {
    const byService = {};
    for (const promo of promotions) {
      if (getPromotionStatus(promo) !== "active") continue;
      const hasBenefit =
        promo.discount_type !== "none" || !!promo.free_extra || !!promo.free_pickup;
      if (!hasBenefit) continue;
      const key = (promo.service_name || "").trim().toLowerCase();
      if (!key) continue;
      if (!byService[key]) byService[key] = promo;
    }
    return byService;
  }, [promotions]);
}