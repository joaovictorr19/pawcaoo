import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

/**
 * Verificação (apenas leitura) de uma promoção para o utilizador atual.
 *
 * Aderir deixou de consumir vagas: a participação só é contabilizada quando a
 * compra/reserva é confirmada, pelo que esta função nunca escreve na promoção.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { promotion_id } = await req.json().catch(() => ({}));
    if (!promotion_id) return Response.json({ error: 'promotion_id is required' }, { status: 400 });

    const promo = await base44.asServiceRole.entities.Promotion.get(promotion_id)
      .catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!promo) return Response.json({ error: 'Promoção não encontrada' }, { status: 404 });

    const today = new Date().toISOString().slice(0, 10);
    const max = promo.max_participants || 0;
    const used = promo.participants_count || 0;
    const soldOut = max > 0 && used >= max;

    const eligible =
      promo.status === 'active' &&
      !(promo.end_date && promo.end_date < today) &&
      !(promo.start_date && promo.start_date > today) &&
      !soldOut;

    const pickupLimit = promo.free_pickup_limit || 0;
    const pickupUsed = promo.free_pickup_used || 0;

    return Response.json({
      promotion: promo,
      eligible,
      sold_out: soldOut,
      discount_type: promo.discount_type || 'none',
      discount_value: promo.discount_value || 0,
      free_pickup: !!promo.free_pickup,
      free_pickup_remaining: promo.free_pickup && pickupLimit > 0
        ? Math.max(0, pickupLimit - pickupUsed)
        : null,
      vacancies_left: max > 0 ? Math.max(0, max - used) : null,
      message: eligible
        ? 'O benefício é aplicado automaticamente ao finalizar a compra ou reserva.'
        : 'Promoção indisponível.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}