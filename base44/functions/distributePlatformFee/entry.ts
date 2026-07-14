import Stripe from 'npm:stripe';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2023-10-16',
});

const PAWCAO_ACCOUNT_ID = Deno.env.get('PAWCAO_STRIPE_ACCOUNT_ID') || 'acct_default';
const PLATFORM_FEE_EUR = 1.5; // €1.5 fixed commission

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const { bookingId } = await req.json();

    if (!bookingId) {
      return Response.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // Get booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    if (!bookings.length) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];
    
    // Check if walker is exempt (by id, fallback to email)
    let walkerProfile = null;
    if (booking.walker_id) {
      const byId = await base44.asServiceRole.entities.WalkerProfile.filter({ id: booking.walker_id });
      if (byId.length > 0) walkerProfile = byId[0];
    }
    if (!walkerProfile && booking.walker_email) {
      const byEmail = await base44.asServiceRole.entities.WalkerProfile.filter({ created_by: booking.walker_email });
      if (byEmail.length > 0) walkerProfile = byEmail[0];
    }
    const isExempt = walkerProfile?.exempt_from_platform_fees === true;
    const feeToTransfer = isExempt ? 0 : PLATFORM_FEE_EUR;

    console.log(`📤 Distributing fees for booking ${bookingId}`);
    console.log(`   Walker exempt: ${isExempt}, Fee: €${feeToTransfer}`);

    // Get payment record
    const payments = await base44.asServiceRole.entities.Payment.filter({
      booking_id: bookingId
    });

    if (!payments.length) {
      return Response.json({ error: 'Payment not found' }, { status: 404 });
    }

    const payment = payments[0];

    // If fee needs to be transferred and walker has Stripe account
    if (feeToTransfer > 0 && walkerProfile?.stripe_account_id) {
      const stripeAcct = walkerProfile.stripe_account_id;

      try {
        // Create payout from connected account to PawCão
        const payout = await stripe.payouts.create({
          amount: Math.round(feeToTransfer * 100),
          currency: 'eur',
          destination: 'wallet', // To platform wallet
        }, {
          stripeAccount: stripeAcct // Initiate from walker's connected account
        });

        console.log('✅ Payout created:', payout.id);

        // Update payment record
        await base44.asServiceRole.entities.Payment.update(payment.id, {
          status: 'released',
          released_date: new Date().toISOString(),
          platform_fee: feeToTransfer,
          split_details: {
            walker_receives: booking.service_amount,
            platform_receives: feeToTransfer,
            payment_processor_fee: 0
          },
          notes: `Platform fee €${feeToTransfer} transferred to PawCão`
        });

        return Response.json({
          success: true,
          bookingId,
          feeTransferred: feeToTransfer,
          payoutId: payout.id
        });

      } catch (stripeErr) {
        console.error('❌ Stripe payout error:', stripeErr.message);
        return Response.json({
          error: 'Payout failed',
          details: stripeErr.message
        }, { status: 500 });
      }
    } else {
      // No fee to transfer (exempt) or no Stripe account
      await base44.asServiceRole.entities.Payment.update(payment.id, {
          status: 'released',
          released_date: new Date().toISOString(),
          platform_fee: feeToTransfer,
          split_details: {
            walker_receives: booking.service_amount,
            platform_receives: feeToTransfer,
            payment_processor_fee: 0
          },
          notes: isExempt ? 'Walker exempt from platform fee' : 'No Stripe account'
        });

      return Response.json({
        success: true,
        bookingId,
        feeTransferred: 0,
        reason: isExempt ? 'Walker exempt' : 'No Stripe account'
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});