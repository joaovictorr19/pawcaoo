import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Find all pending hotel bookings whose payment deadline has passed
    const expiredBookings = await base44.asServiceRole.entities.HotelBooking.filter({
      status: 'pending',
      payment_status: 'pending',
    });

    let cancelledCount = 0;
    for (const booking of expiredBookings) {
      if (booking.payment_expires_at && new Date(booking.payment_expires_at) < new Date(now)) {
        await base44.asServiceRole.entities.HotelBooking.update(booking.id, {
          status: 'cancelled',
          cancellation_reason: 'Pagamento não realizado dentro de 5 minutos.',
        });
        cancelledCount++;
      }
    }

    return Response.json({
      success: true,
      cancelled: cancelledCount,
      checked: expiredBookings.length,
    });
  } catch (error) {
    console.error('Error cancelling expired hotel bookings:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});