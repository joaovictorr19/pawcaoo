import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const MIN_PAYOUT_CENTS = 500; // €5.00 minimum

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

    // Validate amount
    const cents = Math.floor(Number(amount_cents));
    if (!Number.isFinite(cents) || cents < MIN_PAYOUT_CENTS) {
      return Response.json({
        error: `Minimum payout is €${(MIN_PAYOUT_CENTS / 100).toFixed(2)}`
      }, { status: 400 });
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
      // Create blocked payout record and notify walker
      await createBlockedPayout(base44, booking, cents, 'no_stripe_account',
        'Walker does not have a Stripe Connect account configured.');
      return Response.json({
        error: 'Walker does not have Stripe account configured',
        payout_status: 'blocked'
      }, { status: 400 });
    }

    // Verify Stripe account status before attempting transfer
    let account;
    try {
      account = await stripe.accounts.retrieve(walkerProfile.stripe_account_id);
    } catch (stripeErr) {
      await createBlockedPayout(base44, booking, cents, 'stripe_account_error',
        `Could not verify Stripe account: ${stripeErr.message}`);
      return Response.json({
        error: 'Could not verify walker Stripe account',
        payout_status: 'blocked'
      }, { status: 500 });
    }

    if (!account.payouts_enabled) {
      await createBlockedPayout(base44, booking, cents, 'payouts_disabled',
        'Walker Stripe account has payouts disabled. Onboarding may be incomplete.');
      return Response.json({
        error: 'Walker payouts not enabled — onboarding may be incomplete',
        payout_status: 'blocked',
        requirements: account.requirements?.currently_due || []
      }, { status: 400 });
    }

    if (!account.charges_enabled) {
      await createBlockedPayout(base44, booking, cents, 'charges_disabled',
        'Walker Stripe account has charges disabled.');
      return Response.json({
        error: 'Walker account charges not enabled',
        payout_status: 'blocked'
      }, { status: 400 });
    }

    // All checks passed — create transfer
    const transfer = await stripe.transfers.create({
      amount: cents,
      currency: 'eur',
      destination: walkerProfile.stripe_account_id,
      transfer_group: `booking_${booking_id}`,
      metadata: {
        booking_id,
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
      amount: cents / 100
    });

  } catch (error) {
    console.error('Payout error:', error);
    return Response.json({ error: 'Payout processing failed' }, { status: 500 });
  }
});

async function createBlockedPayout(
  base44: any, booking: any, cents: number, reason: string, notes: string
) {
  try {
    await base44.asServiceRole.entities.WalkerPayout.create({
      walker_email: booking.walker_email,
      client_email: booking.owner_email,
      booking_id: booking.id,
      net_amount: cents / 100,
      payout_type: 'direct',
      status: 'blocked',
      blocked_reason: reason,
      notes
    });

    await base44.asServiceRole.entities.Notification.create({
      recipient_email: booking.walker_email,
      title: '⚠️ Pagamento Bloqueado',
      message: `Tem €${(cents / 100).toFixed(2)} pendentes. ${
        reason === 'no_stripe_account'
          ? 'Configure o Stripe Connect para receber pagamentos.'
          : reason === 'payouts_disabled'
          ? 'Complete a verificação no Stripe para ativar pagamentos.'
          : 'Contacte o suporte para mais informações.'
      }`,
      type: 'payment',
      related_id: booking.id,
      priority: 'high',
      action_url: '/StripeConnectSetup'
    });
  } catch (err) {
    console.error('Failed to create blocked payout record:', err);
  }
}