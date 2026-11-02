export const todayISO = () => new Date().toISOString().slice(0, 10);

export function getPromotionStatus(promo) {
  if (!promo) return "expired";
  if (promo.status === "expired" || promo.status === "sold_out") return promo.status;
  if (promo.status === "paused") return "paused";
  if (promo.end_date && promo.end_date < todayISO()) return "expired";
  const max = promo.max_participants || 0;
  if (max > 0 && (promo.participants_count || 0) >= max) return "sold_out";
  if (promo.start_date && promo.start_date > todayISO()) return "scheduled";
  return "active";
}

export const PROMO_STATUS_LABEL = {
  active: "Ativa",
  scheduled: "Agendada",
  paused: "Pausada",
  sold_out: "Esgotada",
  expired: "Terminada",
};

export const PROMO_STATUS_STYLE = {
  active: "bg-teal-50 text-teal-700 border-teal-200",
  scheduled: "bg-sky-50 text-sky-700 border-sky-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  sold_out: "bg-rose-50 text-rose-700 border-rose-200",
  expired: "bg-slate-100 text-slate-500 border-slate-200",
};

export function vacanciesLeft(promo) {
  const max = promo?.max_participants || 0;
  if (max <= 0) return null;
  return Math.max(0, max - (promo.participants_count || 0));
}

export function discountLabel(promo) {
  if (!promo) return null;
  if (promo.discount_type === "percentage" && promo.discount_value) return `-${promo.discount_value}%`;
  if (promo.discount_type === "fixed" && promo.discount_value) {
    return `-${Number(promo.discount_value).toFixed(2).replace(".", ",")}€`;
  }
  return null;
}

export function promoScopeLabel(promo) {
  if (promo?.scope === "hotel_service") return promo.service_name || "Serviço de hotel";
  return promo?.product_name || "Produto";
}