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

// Fim real da promoção: end_date é uma data sem hora — conta até ao fim desse dia (hora local).
export function promotionEndsAt(promo) {
  if (!promo?.end_date) return null;
  const [y, m, d] = String(promo.end_date).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59).getTime();
}

export function discountLabel(promo) {
  if (!promo) return null;
  if (promo.discount_type === "percentage" && promo.discount_value) return `-${promo.discount_value}%`;
  if (promo.discount_type === "fixed" && promo.discount_value) {
    return `-${Number(promo.discount_value).toFixed(2).replace(".", ",")}€`;
  }
  return null;
}

// Recolha gratuita — estado do limite de utilizações gratuitas
export function freePickupState(promo) {
  if (!promo?.free_pickup) return null;
  const limit = promo.free_pickup_limit || 0;
  const used = promo.free_pickup_used || 0;
  if (limit <= 0) return { unlimited: true, used, limit: 0, left: null, exhausted: false };
  const left = Math.max(0, limit - used);
  return { unlimited: false, used, limit, left, exhausted: left === 0 };
}

export function hasPromotionBenefit(promo) {
  if (!promo) return false;
  return promo.discount_type !== "none" || !!promo.free_extra || promo.free_pickup === true;
}

// Desconto em dinheiro de uma promoção sobre um valor (percentagem ou valor fixo)
export function promoDiscountAmount(amount, promo) {
  const value = Math.max(0, Number(amount) || 0);
  if (!promo || value <= 0) return 0;
  let discount = 0;
  if (promo.discount_type === "percentage") {
    const pct = Math.min(100, Math.max(0, Number(promo.discount_value) || 0));
    discount = value * (pct / 100);
  } else if (promo.discount_type === "fixed") {
    discount = Math.max(0, Number(promo.discount_value) || 0);
  }
  return Math.min(value, Math.round(discount * 100) / 100);
}

export function promoScopeLabel(promo) {
  if (promo?.scope === "hotel_service") return promo.service_name || "Serviço de hotel";
  return promo?.product_name || "Produto";
}