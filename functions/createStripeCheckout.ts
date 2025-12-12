import Stripe from 'npm:stripe';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, successUrl, cancelUrl } = await req.json();

    // Get booking details
    const bookings = await base44.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Passeio com ${booking.walker_name}`,
              description: `${booking.dog_name} - ${booking.walk_date} às ${booking.walk_time}`,
            },
            unit_amount: Math.round(booking.total_amount * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        booking_id: bookingId,
        user_email: user.email,
      },
    });

    // Create payment record
    await base44.asServiceRole.entities.Payment.create({
      booking_id: bookingId,
      payer_email: user.email,
      payer_name: user.full_name,
      recipient_email: booking.walker_email,
      recipient_name: booking.walker_name,
      service_amount: booking.service_amount,
      platform_fee: booking.platform_fee,
      total_amount: booking.total_amount,
      status: 'pending',
      payment_method: 'stripe',
      stripe_payment_intent_id: session.payment_intent,
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});