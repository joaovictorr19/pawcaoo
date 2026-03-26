import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function generateSecureToken(prefix: string): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}-${hex.substring(0, 12).toUpperCase()}`;
}

/**
 * Auto-generate security tokens for new bookings
 * Triggered after booking creation to add pickup/dropoff tokens
 * Uses crypto.getRandomValues for cryptographically secure tokens
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

    const pickupToken = generateSecureToken('PK');
    const dropoffToken = generateSecureToken('DO');
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

    await base44.asServiceRole.entities.Booking.update(bookingId, {
      pickup_token: pickupToken,
      dropoff_token: dropoffToken,
      tokens_expire_at: expiresAt,
      token_version: 2
    });

    console.log(`Security tokens generated for booking ${bookingId}`);

    return Response.json({
      success: true,
      pickupToken,
      dropoffToken,
      expires_at: expiresAt,
      token_version: 2
    });
  } catch (error) {
    console.error('Error generating tokens:', error);
    return Response.json({ error: 'Failed to generate security tokens' }, { status: 500 });
  }
});