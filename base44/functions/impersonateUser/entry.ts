import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin user
    const adminUser = await base44.auth.me();
    if (!adminUser || adminUser.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return Response.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // Get target user data
    const users = await base44.asServiceRole.entities.User.filter({ id: targetUserId });
    const targetUser = users[0];

    if (!targetUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Store original admin info in session
    const impersonationData = {
      originalAdminId: adminUser.id,
      originalAdminEmail: adminUser.email,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      targetUserName: targetUser.full_name,
      startedAt: new Date().toISOString()
    };

    return Response.json({ 
      success: true,
      impersonationData,
      message: `Now impersonating ${targetUser.full_name}`
    });

  } catch (error) {
    console.error('Impersonation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});