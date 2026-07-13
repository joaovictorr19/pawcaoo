import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Compute cutoff = first day of current month (UTC)
    const now = new Date();
    const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const cutoffStr = cutoff.toISOString().split('T')[0];

    // Fetch day-off availability and prune older than current month
    const all = await base44.asServiceRole.entities.CalendarAvailability.filter({ is_day_off: true });

    const toDelete = (all || []).filter((a) => {
      const d = (a.date?.includes('T') ? a.date.split('T')[0] : a.date) || '';
      return d && d < cutoffStr;
    });

    let deleted = 0;
    const deletedIds = [];
    for (const rec of toDelete) {
      try {
        await base44.asServiceRole.entities.CalendarAvailability.delete(rec.id);
        deletedIds.push(rec.id);
        deleted += 1;
      } catch (_e) {
        // continue on per-record errors
      }
    }

    // ── SECURITY: Audit log for batch deletion ──
    try {
      await base44.asServiceRole.entities.AdminLog.create({
        action_type: 'cleanup_old_availability',
        reason: `Deleted ${deleted} day-off records older than ${cutoffStr} (IDs: ${deletedIds.join(', ')})`,
      });
    } catch (_logErr) {
      // audit log failure should not block the operation
    }

    return Response.json({ success: true, cutoff: cutoffStr, scanned: all?.length || 0, deleted });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});