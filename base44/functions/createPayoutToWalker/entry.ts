import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id, amount_cents } = await req.json();

    if (!booking_id || !amount_cents) {
      return Response.json({ error: 'Missing booking_id or amount_cents' }, { status: 400 });
    }

    // Get booking
    const bookings = await base44.entities.Booking.filter({ id: booking_id });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get walker profile
    const walkerProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({ 
      created_by: booking.walker_email 
    });

    const walkerProfile = walkerProfiles[0];

    if (!walkerProfile || !walkerProfile.stripe_account_id) {
      return Response.json({ error: 'Walker does not have Stripe account configured' }, { status: 400 });
    }

    if (!walkerProfile.stripe_payouts_enabled) {
      return Response.json({ error: 'Walker payouts not enabled yet' }, { status: 400 });
    }

    // Create transfer to connected account
    const transfer = await stripe.transfers.create({
      amount: amount_cents,
      currency: 'eur',
      destination: walkerProfile.stripe_account_id,
      metadata: {
        booking_id: booking_id,
        walker_email: booking.walker_email,
        platform: 'pawcao'
      }
    });

    // Update booking payment status
    await base44.asServiceRole.entities.Booking.update(booking_id, {
      payment_status: 'released'
    });

    // Update payment record if exists
    if (booking.payment_id) {
      await base44.asServiceRole.entities.Payment.update(booking.payment_id, {
        status: 'released',
        stripe_transfer_id: transfer.id,
        released_date: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      transfer_id: transfer.id,
      amount: amount_cents / 100
    });

  } catch (error) {
    console.error('Payout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});