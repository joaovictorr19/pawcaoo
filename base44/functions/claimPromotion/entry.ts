import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

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
    if (promo.status !== 'active') {
      return Response.json({ error: 'Promoção indisponível' }, { status: 409 });
    }
    if (promo.end_date && promo.end_date < today) {
      return Response.json({ error: 'Promoção já terminou' }, { status: 409 });
    }
    if (promo.start_date && promo.start_date > today) {
      return Response.json({ error: 'Promoção ainda não começou' }, { status: 409 });
    }

    const claimed = Array.isArray(promo.claimed_emails) ? promo.claimed_emails : [];
    if (claimed.includes(user.email)) {
      return Response.json({ promotion: promo, already_claimed: true });
    }

    const max = promo.max_participants || 0;
    const count = promo.participants_count || 0;
    if (max > 0 && count >= max) {
      await base44.asServiceRole.entities.Promotion.update(promo.id, { status: 'sold_out' });
      return Response.json({ error: 'Vagas esgotadas' }, { status: 409 });
    }

    const nextCount = count + 1;
    const updated = await base44.asServiceRole.entities.Promotion.update(promo.id, {
      participants_count: nextCount,
      claimed_emails: [...claimed, user.email],
      status: max > 0 && nextCount >= max ? 'sold_out' : promo.status,
    });

    return Response.json({ promotion: updated, claimed: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}