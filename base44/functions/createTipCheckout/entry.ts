import Stripe from 'npm:stripe@14.21.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { booking_id, tip_amount, booking_type } = body;

    if (!booking_id || !tip_amount || tip_amount <= 0) {
      return Response.json({ error: 'booking_id and a positive tip_amount are required' }, { status: 400 });
    }

    const sr = base44.asServiceRole;
    const isTraining = booking_type === 'training';

    // Fetch the booking
    const entity = isTraining ? sr.entities.TrainingBooking : sr.entities.Booking;
    let booking;
    try {
      booking = await entity.get(booking_id);
    } catch (e) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify the authenticated user owns this booking
    const isOwner = booking.owner_email === user.email || booking.created_by_id === user.id;
    if (!isOwner) {
      return Response.json({ error: 'You can only tip on your own bookings' }, { status: 403 });
    }

    const professionalEmail = isTraining ? booking.trainer_email : booking.walker_email;
    const professionalName = isTraining ? (booking.trainer_name || 'Profissional') : (booking.walker_name || 'Profissional');
    const professionalId = isTraining ? booking.trainer_id : booking.walker_id;

    if (!professionalEmail) {
      return Response.json({ error: 'Professional email not found on booking' }, { status: 400 });
    }

    // Resolve the professional's Stripe Connect account
    let stripeAccountId = null;
    const profileEntity = isTraining ? sr.entities.TrainerProfile : sr.entities.WalkerProfile;

    if (professionalId) {
      try {
        const profile = await profileEntity.get(professionalId);
        if (profile?.stripe_account_id && profile?.stripe_charges_enabled) {
          stripeAccountId = profile.stripe_account_id;
        }
      } catch (e) {}
    }

    if (!stripeAccountId) {
      // Fallback: look up by created_by
      try {
        const profiles = await profileEntity.filter({ created_by: professionalEmail });
        if (profiles[0]?.stripe_account_id && profiles[0]?.stripe_charges_enabled) {
          stripeAccountId = profiles[0].stripe_account_id;
        }
      } catch (e) {}
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const origin = req.headers.get('origin') || 'https://pawcao.base44.app';
    const tipCents = Math.round(tip_amount * 100);

    // Build checkout session — if professional has Stripe Connect, transfer tip directly
    const sessionParams = {
      mode: 'payment',
      locale: 'pt',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Gorjeta para ${professionalName}`,
            description: 'Avaliação de serviço PawCão',
          },
          unit_amount: tipCents,
        },
        quantity: 1,
      }],
      success_url: `${origin}/MyBookings?tip=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/MyBookings?tip=cancelled`,
      customer_email: user.email,
      metadata: {
        booking_id,
        tip_amount: String(tip_amount),
        professional_email: professionalEmail,
        professional_name: professionalName,
        booking_type: isTraining ? 'training' : 'walk',
        tip: 'true',
      },
    };

    // If the professional has Stripe Connect configured, send the tip directly to their account
    if (stripeAccountId) {
      sessionParams.payment_intent_data = {
        transfer_data: {
          destination: stripeAccountId,
        },
        metadata: {
          booking_id,
          tip_amount: String(tip_amount),
          professional_email: professionalEmail,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Create a Payment record for the tip
    try {
      await sr.entities.Payment.create({
        booking_id,
        payer_email: user.email,
        payer_name: user.full_name || 'Cliente',
        recipient_email: professionalEmail,
        recipient_name: professionalName,
        service_amount: 0,
        platform_fee: 0,
        total_amount: tip_amount,
        status: 'pending',
        payment_method: 'stripe',
        stripe_payment_intent_id: session.payment_intent,
        notes: 'Tip payment',
      });
    } catch (e) {
      console.error('Error creating tip Payment record:', e?.message || e);
    }

    return Response.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      tip_amount,
      professional_has_stripe: !!stripeAccountId,
    });
  } catch (error) {
    console.error('createTipCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}