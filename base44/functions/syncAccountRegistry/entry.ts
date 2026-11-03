import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildRegistryRows, normalizeEmail } from '../../shared/accountRegistry.ts';

/**
 * Sincroniza o registo canónico de contas (regime, país, estado).
 * Idempotente: só escreve registos novos ou cuja assinatura mudou.
 * dry_run: true => apenas relatório, sem escrever nada.
 */

async function fetchAll(entity, sort) {
  // list(sort, limit) — a forma suportada também para a entidade User
  const result = await entity.list(sort, 5000);
  return Array.isArray(result) ? result : (result?.items || []);
}

function tally(rows, key) {
  const counts = {};
  rows.forEach((row) => {
    const value = row[key];
    if (value) counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;

    const svc = base44.asServiceRole;
    const [users, walkers, trainers, existing] = await Promise.all([
      fetchAll(svc.entities.User, '-created_date'),
      fetchAll(svc.entities.WalkerProfile, '-created_date'),
      fetchAll(svc.entities.TrainerProfile, '-created_date'),
      fetchAll(svc.entities.AccountRegistry, '-created_date'),
    ]);

    const rows = buildRegistryRows(users, walkers, trainers);
    const existingByEmail = new Map();
    existing.forEach((record) => {
      const key = normalizeEmail(record?.user_email);
      if (key) existingByEmail.set(key, record);
    });

    const toCreate = [];
    const toUpdate = [];
    let unchanged = 0;

    rows.forEach((row) => {
      const current = existingByEmail.get(row.user_email);
      if (!current) {
        toCreate.push(row);
        return;
      }
      if (current.source_signature === row.source_signature) {
        unchanged++;
        return;
      }
      toUpdate.push({ id: current.id, ...row });
    });

    const now = new Date().toISOString();
    if (!dryRun) {
      const stampedCreate = toCreate.map((row) => ({ ...row, last_synced_date: now }));
      const stampedUpdate = toUpdate.map((row) => ({ ...row, last_synced_date: now }));

      for (let i = 0; i < stampedCreate.length; i += 200) {
        await svc.entities.AccountRegistry.bulkCreate(stampedCreate.slice(i, i + 200));
      }
      for (let i = 0; i < stampedUpdate.length; i += 200) {
        await svc.entities.AccountRegistry.bulkUpdate(stampedUpdate.slice(i, i + 200));
      }
    }

    const reviewRows = rows.filter((row) => row.review_state && row.review_state !== 'ok');

    return Response.json({
      dry_run: dryRun,
      scanned_accounts: rows.length,
      profiles: { walkers: walkers.length, trainers: trainers.length },
      created: dryRun ? 0 : toCreate.length,
      updated: dryRun ? 0 : toUpdate.length,
      pending_create: toCreate.length,
      pending_update: toUpdate.length,
      unchanged,
      reviews: reviewRows.length,
      by_regime: tally(rows, 'regime'),
      by_country: tally(rows, 'country'),
      by_status: tally(rows, 'status'),
      review_samples: reviewRows.slice(0, 12).map((row) => ({
        email: row.user_email,
        regime: row.regime,
        country: row.country || null,
        review_state: row.review_state,
        review_notes: row.review_notes,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}