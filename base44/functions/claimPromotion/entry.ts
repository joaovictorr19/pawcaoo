import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Recolha gratuita: o contador só sobe enquanto houver utilizações disponíveis.
// O incremento é atómico (filtro $lt + $inc numa única operação) para que duas
// reclamações simultâneas nunca ultrapassem o limite definido.
async function grantFreePickup(base44, promo, email) {
  const limit = promo.free_pickup_limit || 0;
  if (!promo.free_pickup) return false;

  // Sem limite definido: a recolha é gratuita para todas as adesões
  if (limit <= 0) {
    await base44.asServiceRole.entities.Promotion.updateMany(
      { id: promo.id },
      { $inc: { free_pickup_used: 1 }, $addToSet: { free_pickup_emails: email } }
    );
    return true;
  }

  // Normaliza registos antigos sem contador inicializado
  if (promo.free_pickup_used === undefined || promo.free_pickup_used === null) {
    await base44.asServiceRole.entities.Promotion.update(promo.id, {
      free_pickup_used: 0,
      free_pickup_emails: promo.free_pickup_emails || [],
    });
  }

  await base44.asServiceRole.entities.Promotion.updateMany(
    { id: promo.id, free_pickup_used: { $lt: limit } },
    { $inc: { free_pickup_used: 1 }, $addToSet: { free_pickup_emails: email } }
  );

  const fresh = await base44.asServiceRole.entities.Promotion.get(promo.id);
  const emails = Array.isArray(fresh.free_pickup_emails) ? fresh.free_pickup_emails : [];
  return emails.includes(email);
}

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

    const pickupLimit = promo.free_pickup_limit || 0;

    const claimed = Array.isArray(promo.claimed_emails) ? promo.claimed_emails : [];
    if (claimed.includes(user.email)) {
      const pickupEmails = Array.isArray(promo.free_pickup_emails) ? promo.free_pickup_emails : [];
      return Response.json({
        promotion: promo,
        already_claimed: true,
        free_pickup: !!promo.free_pickup,
        free_pickup_granted: pickupEmails.includes(user.email),
        free_pickup_remaining: pickupLimit > 0 ? Math.max(0, pickupLimit - (promo.free_pickup_used || 0)) : null,
      });
    }

    const max = promo.max_participants || 0;
    const count = promo.participants_count || 0;
    if (max > 0 && count >= max) {
      await base44.asServiceRole.entities.Promotion.update(promo.id, { status: 'sold_out' });
      return Response.json({ error: 'Vagas esgotadas' }, { status: 409 });
    }

    const freePickupGranted = await grantFreePickup(base44, promo, user.email);

    const nextCount = count + 1;
    const updated = await base44.asServiceRole.entities.Promotion.update(promo.id, {
      participants_count: nextCount,
      claimed_emails: [...claimed, user.email],
      status: max > 0 && nextCount >= max ? 'sold_out' : promo.status,
    });

    return Response.json({
      promotion: updated,
      claimed: true,
      free_pickup: !!promo.free_pickup,
      free_pickup_granted: freePickupGranted,
      free_pickup_remaining: pickupLimit > 0 ? Math.max(0, pickupLimit - (updated.free_pickup_used || 0)) : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}