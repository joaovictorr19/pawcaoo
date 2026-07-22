import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email, newRole } = await req.json();
    if (!email || !newRole) {
      return Response.json({ error: 'Email and newRole required' }, { status: 400 });
    }

    // ── SECURITY: Whitelist of assignable roles; 'admin' cannot be assigned via this endpoint ──
    const ALLOWED_ROLES = ['user', 'walker', 'trainer', 'both', 'hotel', 'admin'];
    if (!ALLOWED_ROLES.includes(newRole)) {
      return Response.json({ error: 'Invalid or forbidden role' }, { status: 400 });
    }

    // Prevent self-modification (admin cannot change their own role)
    if (email.toLowerCase() === user.email.toLowerCase()) {
      return Response.json({ error: 'Cannot modify your own role' }, { status: 403 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent modifying existing admins (only super-admin/platform can do that, not via this endpoint)
    if (users[0].role === 'admin') {
      return Response.json({ error: 'Cannot modify admin role via this endpoint' }, { status: 403 });
    }

    await base44.asServiceRole.entities.User.update(users[0].id, { role: newRole });
    return Response.json({ success: true, message: `Role updated to ${newRole}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});