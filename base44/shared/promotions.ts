/**
 * Promoções da Loja: elegibilidade, cálculo do desconto e contabilização.
 *
 * Regra: aderir na loja NÃO consome vagas nem conta como participação.
 * O desconto é calculado e aplicado no checkout (servidor é a fonte de verdade)
 * e a participação só é contabilizada depois do pagamento confirmado.
 */

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function isPromotionActive(promo: any, today = todayISO()): boolean {
  if (!promo) return false;
  if (promo.status !== 'active') return false;
  if (promo.end_date && String(promo.end_date).slice(0, 10) < today) return false;
  if (promo.start_date && String(promo.start_date).slice(0, 10) > today) return false;
  const max = Number(promo.max_participants || 0);
  if (max > 0 && Number(promo.participants_count || 0) >= max) return false;
  return true;
}

export function hasPromotionBenefit(promo: any): boolean {
  if (!promo) return false;
  return promo.discount_type !== 'none' || !!promo.free_extra || promo.free_pickup === true;
}

export function promotionDiscount(amount: number, promo: any): number {
  const value = Math.max(0, Number(amount) || 0);
  if (!promo || value <= 0) return 0;
  let discount = 0;
  if (promo.discount_type === 'percentage') {
    const pct = Math.min(100, Math.max(0, Number(promo.discount_value) || 0));
    discount = value * (pct / 100);
  } else if (promo.discount_type === 'fixed') {
    discount = Math.max(0, Number(promo.discount_value) || 0);
  }
  return Math.min(value, Math.round(discount * 100) / 100);
}

/** Recolha/transporte gratuito ainda disponível */
export function freePickupAvailable(promo: any): boolean {
  if (!promo?.free_pickup) return false;
  const limit = Number(promo.free_pickup_limit || 0);
  if (limit <= 0) return true;
  return Number(promo.free_pickup_used || 0) < limit;
}

export async function findProductPromotion(base44: any, productId: string) {
  if (!productId) return null;
  try {
    const promos = await base44.asServiceRole.entities.Promotion.filter(
      { product_id: productId, scope: 'product' },
      '-created_date',
      20,
    );
    return promos.find((p: any) => isPromotionActive(p) && hasPromotionBenefit(p)) || null;
  } catch (e: any) {
    console.warn('findProductPromotion:', e?.message || e);
    return null;
  }
}

export async function findServicePromotion(base44: any, partnerId: string, serviceName: string) {
  if (!partnerId || !serviceName) return null;
  try {
    const promos = await base44.asServiceRole.entities.Promotion.filter(
      { partner_id: partnerId, scope: 'hotel_service' },
      '-created_date',
      50,
    );
    const key = String(serviceName).trim().toLowerCase();
    return promos.find((p: any) =>
      String(p.service_name || '').trim().toLowerCase() === key &&
      isPromotionActive(p) &&
      hasPromotionBenefit(p)) || null;
  } catch (e: any) {
    console.warn('findServicePromotion:', e?.message || e);
    return null;
  }
}

/**
 * Contabiliza a participação — chamar apenas depois do pagamento confirmado.
 * Idempotente: uma mesma encomenda/reserva nunca conta duas vezes.
 */
export async function countPromotionUse(
  base44: any,
  promotionId: string,
  opts: {
    userEmail: string;
    orderId?: string;
    bookingId?: string;
    discountAmount?: number;
    currency?: string;
  },
) {
  if (!promotionId) return null;
  const { userEmail, orderId = '', bookingId = '', discountAmount = 0, currency = 'EUR' } = opts || {} as any;
  if (!orderId && !bookingId) return null;

  try {
    const key: Record<string, string> = { promotion_id: promotionId };
    if (orderId) key.order_id = orderId;
    else key.booking_id = bookingId;

    const existing = await base44.asServiceRole.entities.PromotionRedemption.filter(key, undefined, 1);
    if (existing.length > 0) return { alreadyCounted: true };

    const promo = await base44.asServiceRole.entities.Promotion.get(promotionId).catch(() => null);
    if (!promo) return null;

    // Registo de idempotência (uma participação por compra/reserva)
    await base44.asServiceRole.entities.PromotionRedemption.create({
      promotion_id: promotionId,
      promotion_title: promo.title || '',
      promotion_scope: promo.scope || 'product',
      user_email: userEmail || '',
      order_id: orderId || '',
      booking_id: bookingId || '',
      discount_amount: Math.round((Number(discountAmount) || 0) * 100) / 100,
      currency,
      counted_at: new Date().toISOString(),
    });

    // Vaga na promoção — incremento atómico, nunca acima do limite
    const max = Number(promo.max_participants || 0);
    const claimUpdate = { $inc: { participants_count: 1 }, $addToSet: { claimed_emails: userEmail } };
    if (max > 0) {
      await base44.asServiceRole.entities.Promotion.updateMany(
        { id: promotionId, participants_count: { $lt: max } },
        claimUpdate,
      );
    } else {
      await base44.asServiceRole.entities.Promotion.updateMany({ id: promotionId }, claimUpdate);
    }

    // Recolha/transporte gratuito consumido
    if (promo.free_pickup) {
      const limit = Number(promo.free_pickup_limit || 0);
      const pickupUpdate = { $inc: { free_pickup_used: 1 }, $addToSet: { free_pickup_emails: userEmail } };
      if (limit > 0) {
        await base44.asServiceRole.entities.Promotion.updateMany(
          { id: promotionId, free_pickup_used: { $lt: limit } },
          pickupUpdate,
        );
      } else {
        await base44.asServiceRole.entities.Promotion.updateMany({ id: promotionId }, pickupUpdate);
      }
    }

    // Marcar como esgotada quando atinge o limite
    if (max > 0) {
      const fresh = await base44.asServiceRole.entities.Promotion.get(promotionId).catch(() => null);
      if (fresh && Number(fresh.participants_count || 0) >= max && fresh.status === 'active') {
        await base44.asServiceRole.entities.Promotion.update(promotionId, { status: 'sold_out' });
      }
    }

    return { counted: true };
  } catch (e: any) {
    console.error('countPromotionUse error:', e?.message || e);
    return null;
  }
}