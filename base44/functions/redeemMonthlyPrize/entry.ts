import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const COLLECTIONS = {
  MonthlyStagePrize: ['stages'],
  MonthlyPodiumPrize: ['hotel_prizes', 'walker_prizes'],
};

/**
 * Entrega de um prémio mensal (etapas do Legado ou pódios).
 * Só admins. Um prémio só pode ser entregue uma vez: a segunda tentativa devolve 409.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const collection = String(body?.collection || '');
    const category = String(body?.category || '');
    const position = Number(body?.position);
    const monthKey = String(body?.month_key || '').trim();
    const action = body?.action === 'clear' ? 'clear' : 'redeem';
    const winnerEmail = String(body?.winner_email || '').trim().toLowerCase();
    const winnerName = String(body?.winner_name || '').trim();

    if (!COLLECTIONS[collection] || !COLLECTIONS[collection].includes(category)) {
      return Response.json({ error: 'Prémio inválido' }, { status: 400 });
    }
    if (!monthKey || !Number.isFinite(position)) {
      return Response.json({ error: 'Mês e posição são obrigatórios' }, { status: 400 });
    }
    if (action === 'redeem' && !winnerEmail) {
      return Response.json({ error: 'Indique o vencedor do prémio' }, { status: 400 });
    }

    const entity = base44.asServiceRole.entities[collection];
    const rows = await entity.filter({ month_key: monthKey }, '-created_date', 1);
    const record = rows?.[0];
    if (!record) {
      return Response.json({ error: 'Os prémios deste mês ainda não foram configurados' }, { status: 404 });
    }

    const list = Array.isArray(record[category]) ? record[category] : [];
    const index = list.findIndex((item) => Number(item?.position) === position);
    if (index === -1) return Response.json({ error: 'Prémio não encontrado' }, { status: 404 });

    const current = list[index];
    if (action === 'redeem' && current?.redeemed_at) {
      return Response.json({ error: 'Este prémio já foi entregue', item: current }, { status: 409 });
    }

    const updated = action === 'redeem'
      ? {
          ...current,
          winner_email: winnerEmail,
          winner_name: winnerName,
          redeemed_at: new Date().toISOString(),
          redeemed_by: user.email,
        }
      : { ...current, winner_email: '', winner_name: '', redeemed_at: null, redeemed_by: '' };

    const nextList = list.map((item, i) => (i === index ? updated : item));
    await entity.update(record.id, { [category]: nextList });

    return Response.json({ item: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}