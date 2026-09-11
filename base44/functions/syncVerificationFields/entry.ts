import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const svc = base44.asServiceRole;

    // WalkerProfile: sync is_verified with verification_status
    const walkers = await svc.entities.WalkerProfile.list('-created_date', 1000);
    const walkerMismatches = (Array.isArray(walkers) ? walkers : []).filter(
      w => {
        const expected = w.verification_status === 'verified';
        return !!w.is_verified !== expected;
      }
    );
    if (walkerMismatches.length > 0) {
      await svc.entities.WalkerProfile.bulkUpdate(
        walkerMismatches.map(w => ({
          id: w.id,
          is_verified: w.verification_status === 'verified'
        }))
      );
    }

    // TrainerProfile: sync is_verified with verification_status
    const trainers = await svc.entities.TrainerProfile.list('-created_date', 1000);
    const trainerMismatches = (Array.isArray(trainers) ? trainers : []).filter(
      t => {
        const expected = t.verification_status === 'verified';
        return !!t.is_verified !== expected;
      }
    );
    if (trainerMismatches.length > 0) {
      await svc.entities.TrainerProfile.bulkUpdate(
        trainerMismatches.map(t => ({
          id: t.id,
          is_verified: t.verification_status === 'verified'
        }))
      );
    }

    return Response.json({
      walker_synced: walkerMismatches.length,
      trainer_synced: trainerMismatches.length,
      total_corrected: walkerMismatches.length + trainerMismatches.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}