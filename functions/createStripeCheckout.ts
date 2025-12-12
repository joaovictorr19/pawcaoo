import Stripe from 'npm:stripe';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');

if (!stripeKey) {
  console.error('❌ STRIPE_SECRET_KEY não configurada!');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('🔴 Auth failed - no user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🟢 User authenticated:', user.email);

    const payload = await req.json();
    console.log('📥 Received payload:', payload);

    const { bookingId, successUrl, cancelUrl, voucherCode, discountAmount } = payload;

    // Get booking details
    console.log('🔍 Buscando booking:', bookingId);
    const bookings = await base44.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      console.error('❌ Booking não encontrada:', bookingId);
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    console.log('✅ Booking encontrada:', booking);

    // Calculate final amount
    const finalAmount = discountAmount > 0 
      ? Math.max(0, booking.total_amount - discountAmount)
      : booking.total_amount;

    console.log('💰 Amount calculation:', {
      original: booking.total_amount,
      discount: discountAmount,
      final: finalAmount
    });

    // Create Stripe Checkout Session
    console.log('🔵 Criando sessão Stripe...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Passeio com ${booking.walker_name || 'Walker'}`,
              description: `${booking.dog_name} - ${booking.walk_date} às ${booking.walk_time}`,
            },
            unit_amount: Math.round(finalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        booking_id: bookingId,
        user_email: user.email,
        voucher_code: voucherCode || '',
        discount_amount: discountAmount || 0,
      },
    });

    console.log('✅ Sessão criada:', session.id);

    // Create payment record
    console.log('💳 Criando Payment record...');
    const paymentRecord = await base44.asServiceRole.entities.Payment.create({
      booking_id: bookingId,
      payer_email: user.email,
      payer_name: user.full_name || 'Cliente',
      recipient_email: booking.walker_email || booking.created_by,
      recipient_name: booking.walker_name || 'Walker',
      service_amount: booking.service_amount || 0,
      platform_fee: booking.platform_fee || 0,
      total_amount: finalAmount,
      loyalty_points_discount: discountAmount || 0,
      status: 'pending',
      payment_method: 'stripe',
      stripe_payment_intent_id: session.payment_intent,
    });

    console.log('✅ Payment record criado:', paymentRecord.id);

    // Update booking with payment info
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      payment_id: paymentRecord.id,
      payment_status: 'pending'
    });

    console.log('🎉 Checkout completo! Retornando URL:', session.url);

    return new Response(JSON.stringify({ 
      sessionId: session.id, 
      url: session.url,
      success: true 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('❌ Erro completo:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack,
      type: error.type || 'unknown'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
});