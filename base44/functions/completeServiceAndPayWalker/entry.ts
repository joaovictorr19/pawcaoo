import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const response = await base44.functions.invoke('processServiceCompletion', {
      kind: body.kind || 'walk',
      serviceId: body.booking_id || body.training_booking_id,
      walkId: body.booking_id,
      trainingBookingId: body.training_booking_id,
      report: body.report,
      finalPhoto: body.finalPhoto
    });

    return Response.json(response.data, { status: response.status });
  } catch (error) {
    console.error('Complete service error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});