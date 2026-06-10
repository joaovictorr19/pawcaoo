import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user?.role === 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { hotel_emails } = body;

    if (!Array.isArray(hotel_emails) || hotel_emails.length === 0) {
      return Response.json({ error: 'hotel_emails array required' }, { status: 400 });
    }

    const results = [];

    for (const email of hotel_emails) {
      const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({
        created_by: email,
        professional_type: 'hotel'
      });

      if (profiles.length === 0) {
        results.push({ email, status: 'not_found', message: 'No hotel profile found' });
        continue;
      }

      const profile = profiles[0];
      const hasGenericServices = profile.services_offered && profile.services_offered.length > 0;

      if (!hasGenericServices) {
        results.push({ email, status: 'skipped', message: 'No generic services to clean' });
        continue;
      }

      // Remove generic services from hotel profiles
      await base44.asServiceRole.entities.WalkerProfile.update(profile.id, {
        services_offered: []
      });

      results.push({
        email,
        status: 'cleaned',
        message: `Removed ${profile.services_offered.length} generic services`,
        profile_id: profile.id
      });
    }

    return Response.json({
      success: true,
      cleaned: results.filter(r => r.status === 'cleaned').length,
      details: results
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});