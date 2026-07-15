import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify admin user
    const adminUser = await base44.auth.me();
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { targetUserId, updateData } = await req.json();

    if (!targetUserId || !updateData || typeof updateData !== 'object') {
      return Response.json({ error: 'targetUserId and updateData are required' }, { status: 400 });
    }

    // Prevent admin from accidentally updating themselves via this path
    if (targetUserId === adminUser.id) {
      return Response.json({ error: 'Use updateMe for self-updates' }, { status: 400 });
    }

    // Update the target user's record via service role
    const updated = await base44.asServiceRole.entities.User.update(targetUserId, updateData);

    return Response.json({ success: true, user: updated });
  } catch (error) {
    console.error('Error in updateUserAsAdmin:', error);
    return Response.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
});