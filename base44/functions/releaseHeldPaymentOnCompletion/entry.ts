import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const event = payload?.event || {};
    const incoming = payload?.data || null;
    const bookingId = event?.entity_id || incoming?.id;

    if (!bookingId) {
      return Response.json({ error: 'Invalid automation payload' }, { status: 400 });
    }
    if (event?.entity_name && event.entity_name !== 'Booking') {
      return Response.json({ error: 'Unsupported entity' }, { status: 400 });
    }

    // SECURITY: a reserva é sempre relida da base de dados (o payload nunca é fonte de verdade)
    // e o pagamento só é libertado quando a conclusão já foi confirmada — este estado só pode
    // ser gravado pelo dono da reserva ou por um admin, nunca por um chamador anónimo.
    const records = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    const booking = records[0] || null;
    if (!booking) {
      return Response.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }
    if (!['service_completed', 'completed'].includes(booking.status)) {
      return Response.json(
        { success: false, error: 'Booking is not completed', status: booking.status },
        { status: 409 }
      );
    }
    if (booking.payment_status === 'released') {
      return Response.json({ success: true, skipped: true, reason: 'already_released' });
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
}