import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const MAX_IMPERSONATION_MINUTES = 120;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify admin user
    const adminUser = await base44.auth.me();
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { targetUserId, reason } = await req.json();

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

    // Block privilege escalation: admins may never impersonate other admins
    if (targetUser.role === 'admin') {
      return Response.json({
        error: 'Impersonating another administrator is not permitted'
      }, { status: 403 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + MAX_IMPERSONATION_MINUTES * 60 * 1000);

    // SECURITY: Audit log is MANDATORY — if it cannot be created, impersonation is blocked.
    // This ensures an immutable record exists for every impersonation session.
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
      console.error('Audit log creation FAILED — impersonation blocked:', auditError?.message || auditError);
      return Response.json({
        error: 'Audit log could not be created — impersonation blocked for security'
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

    // Return full target user data so the frontend can use it directly
    // without a fragile extra fetch on every query refetch
    const targetUserData = {
      id: targetUser.id,
      email: targetUser.email,
      full_name: targetUser.full_name,
      role: targetUser.role,
      created_date: targetUser.created_date,
      username: targetUser.username,
      profile_photo_url: targetUser.profile_photo_url,
      city: targetUser.city,
      bio: targetUser.bio,
      is_verified: targetUser.is_verified,
      gamification_xp: targetUser.gamification_xp,
      gamification_level: targetUser.gamification_level,
      achievements_badges: targetUser.achievements_badges,
      profile_stats: targetUser.profile_stats,
      followers_count: targetUser.followers_count,
      following_count: targetUser.following_count,
      pawgo_status: targetUser.pawgo_status,
      account_type: targetUser.account_type
    };

    console.log(`Impersonation started: admin=${adminUser.email} target=${targetUser.email} audit=${auditLogId}`);

    return Response.json({
      success: true,
      impersonationData,
      targetUserData,
      message: `Now impersonating ${targetUser.full_name}. Session expires in ${MAX_IMPERSONATION_MINUTES} minutes.`
    });

  } catch (error) {
    console.error('Impersonation error:', error);
    return Response.json({ error: 'Impersonation failed' }, { status: 500 });
  }
});