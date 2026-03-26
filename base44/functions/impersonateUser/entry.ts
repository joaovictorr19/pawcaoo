import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_IMPERSONATION_MINUTES = 30;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify admin user
    const adminUser = await base44.auth.me();
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { targetUserId, reason, confirm_admin_impersonation } = await req.json();

    if (!targetUserId) {
      return Response.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return Response.json({
        error: 'A reason is required (minimum 5 characters) for audit purposes'
      }, { status: 400 });
    }

    // Get target user data
    const users = await base44.asServiceRole.entities.User.filter({ id: targetUserId });
    const targetUser = users[0];

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Require explicit confirmation when impersonating another admin
    if (targetUser.role === 'admin' && !confirm_admin_impersonation) {
      return Response.json({
        error: 'Impersonating an admin requires confirm_admin_impersonation: true'
      }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + MAX_IMPERSONATION_MINUTES * 60 * 1000);

    // Create audit log record
    let auditLogId = null;
    try {
      const auditLog = await base44.asServiceRole.entities.ImpersonationLog.create({
        admin_id: adminUser.id,
        admin_email: adminUser.email,
        target_user_id: targetUser.id,
        target_user_email: targetUser.email,
        target_user_name: targetUser.full_name,
        reason: reason.trim(),
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active',
        target_is_admin: targetUser.role === 'admin'
      });
      auditLogId = auditLog.id;
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      return Response.json({
        error: 'Failed to create audit trail — impersonation blocked for safety'
      }, { status: 500 });
    }

    const impersonationData = {
      originalAdminId: adminUser.id,
      originalAdminEmail: adminUser.email,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      targetUserName: targetUser.full_name,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      auditLogId,
      maxDurationMinutes: MAX_IMPERSONATION_MINUTES
    };

    console.log(`Impersonation started: admin=${adminUser.email} target=${targetUser.email} audit=${auditLogId}`);

    return Response.json({
      success: true,
      impersonationData,
      message: `Now impersonating ${targetUser.full_name}. Session expires in ${MAX_IMPERSONATION_MINUTES} minutes.`
    });

  } catch (error) {
    console.error('Impersonation error:', error);
    return Response.json({ error: 'Impersonation failed' }, { status: 500 });
  }
});