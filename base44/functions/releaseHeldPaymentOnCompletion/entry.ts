import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const event = payload?.event || {};
    let booking = payload?.data || null;

    // Must come from an entity automation (event required)
    if (!event?.entity_name && !event?.entity_id && !booking?.id) {
      return Response.json({ error: 'Invalid automation payload' }, { status: 400 });
    }

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