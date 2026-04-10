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
    console.log('📥 Received payload:', JSON.stringify(payload));

    const { walletTopup, amount, productName } = payload || {};

    // Handle wallet top-up flow
    if (walletTopup && amount) {
      const origin = req.headers.get('origin') || 'https://pawcao.base44.app';
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: productName || 'Wallet Top-up' },
              unit_amount: parseInt(amount, 10), // amount already in cents from frontend
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/MyWallet?topup=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/MyWallet?topup=cancelled` ,
        customer_email: user.email,
        metadata: {
          wallet_topup: 'true',
          user_email: user.email,
          topup_amount_cents: String(amount),
        },
      });
      console.log('✅ Wallet top-up session created:', session.id);
      return new Response(JSON.stringify({ sessionId: session.id, url: session.url, success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { bookingId, successUrl, cancelUrl, voucherCode, discountAmount, bookingData } = payload;

    // Use bookingData passed from frontend (avoids SDK filter-by-id limitation)
    const booking = bookingData || null;

    if (!booking || !bookingId) {
      return Response.json({ error: 'Missing bookingId or bookingData' }, { status: 400 });
    }

    // Calculate final amount
    const finalAmount = discountAmount > 0
      ? Math.max(0, (booking.total_amount || 0) - discountAmount)
      : (booking.total_amount || 0);

    console.log('💰 Amount:', { original: booking.total_amount, discount: discountAmount, final: finalAmount });

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
    try {
      await base44.asServiceRole.entities.Booking.update(bookingId, {
        payment_id: paymentRecord.id,
        payment_status: 'pending'
      });
    } catch (updateErr) {
      console.warn('Could not update booking payment_id:', updateErr.message);
    }

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