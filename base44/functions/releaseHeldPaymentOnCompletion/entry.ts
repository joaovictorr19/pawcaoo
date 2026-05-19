import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const event = payload?.event || {};
    let booking = payload?.data || null;

    if ((!booking || payload?.payload_too_large) && event?.entity_id) {
      const records = await base44.asServiceRole.entities.Booking.filter({ id: event.entity_id });
      booking = records[0] || null;
    }

    if (!booking?.id) {
      return Response.json({ success: false, message: 'No booking in payload' }, { status: 400 });
    }

    const response = await base44.asServiceRole.functions.invoke('processServiceCompletion', {
      kind: 'walk',
      walkId: booking.id
    });

    return Response.json(response.data, { status: response.status });
  } catch (error) {
    console.error('releaseHeldPaymentOnCompletion error:', error);
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});