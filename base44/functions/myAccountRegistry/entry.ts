import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildRegistryRow, normalizeEmail, preservedOverrides } from '../../shared/accountRegistry.ts';

/**
 * Registo canónico da própria conta.
 * Devolve o regime/país/estado derivado dos perfis do utilizador autenticado.
 * com { sync: true } grava/atualiza a linha no AccountRegistry — usado no fim
 * de cada fluxo de adesão, para o admin ver a conta sem sincronização manual.
 */

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!me?.email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const shouldSync = body?.sync === true;
    const email = normalizeEmail(me.email);

    const svc = base44.asServiceRole;
    const [users, walkers, trainers, registry] = await Promise.all([
      svc.entities.User.filter({ email: me.email }),
      svc.entities.WalkerProfile.filter({ created_by: me.email }),
      svc.entities.TrainerProfile.filter({ created_by: me.email }),
      svc.entities.AccountRegistry.filter({ user_email: email }),
    ]);

    const asArray = (value) => (Array.isArray(value) ? value : (value?.items || []));
    const userRecord = asArray(users)[0] || me;
    const row = buildRegistryRow(userRecord, asArray(walkers), asArray(trainers));
    const current = asArray(registry)[0] || null;

    if (shouldSync) {
      const payload = { ...row, last_synced_date: new Date().toISOString() };
      if (!current) {
        await svc.entities.AccountRegistry.create(payload);
      } else if (current.source_signature !== row.source_signature) {
        await svc.entities.AccountRegistry.update(current.id, { ...payload, ...preservedOverrides(current) });
      }
    }

    return Response.json({
      synced: shouldSync,
      account: {
        regime: row.regime,
        country: row.country || null,
        status: row.status,
        review_state: row.review_state,
        review_notes: row.review_notes,
        professional_types: row.professional_types,
        confirmed_regime: current?.confirmed_regime || null,
        confirmed_country: current?.confirmed_country || null,
        review_resolved: current?.review_resolved === true,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}