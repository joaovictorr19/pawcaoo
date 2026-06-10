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

    const users = await base44.asServiceRole.entities.User.filter({ email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    await base44.asServiceRole.entities.User.update(users[0].id, { role: newRole });
    return Response.json({ success: true, message: `Role updated to ${newRole}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});