import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Auto-generate security tokens for new bookings
 * Triggered after booking creation to add pickup/dropoff tokens
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return Response.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // Generate unique tokens
    const pickupToken = `PK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const dropoffToken = `DO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Update booking with tokens
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      pickup_token: pickupToken,
      dropoff_token: dropoffToken
    });

    console.log(`✅ Security tokens generated for booking ${bookingId}`);

    return Response.json({ 
      success: true,
      pickupToken,
      dropoffToken
    });
  } catch (error) {
    console.error('Error generating tokens:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});