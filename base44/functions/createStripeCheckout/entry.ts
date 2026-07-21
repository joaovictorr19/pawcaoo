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
        locale: 'pt',
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

    const { bookingId, successUrl, cancelUrl, voucherCode, discountAmount } = payload;

    if (!bookingId) {
      return Response.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // Fetch the booking from the database (user-scoped) to verify ownership.
    // Never trust bookingData sent from the client — it can be forged.
    const bookings = await base44.entities.Booking.filter({ id: bookingId });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found or access denied' }, { status: 404 });
    }

    // Verify the authenticated user owns this booking
    const isOwner = booking.created_by_id === user.id ||
      booking.owner_email === user.email ||
      booking.walker_email === user.email ||
      booking.trainer_email === user.email;

    if (!isOwner) {
      return Response.json({ error: 'You do not have access to this booking' }, { status: 403 });
    }

    // Validate discount server-side — never trust client-provided discountAmount.
    // If a voucherCode is provided, look up the Redemption record and use its euro_value.
    let validatedDiscount = 0;

    if (voucherCode) {
      const redemptions = await base44.asServiceRole.entities.Redemption.filter({
        redemption_code: voucherCode
      });

      if (redemptions.length === 0) {
        return Response.json({ error: 'Voucher inválido ou expirado' }, { status: 400 });
      }

      const voucher = redemptions[0];

      // Verify the voucher belongs to the authenticated user
      if (voucher.user_email !== user.email) {
        return Response.json({ error: 'Voucher não pertence a este utilizador' }, { status: 403 });
      }

      // Verify the voucher is still valid (not cancelled or already delivered)
      if (voucher.status === 'cancelled' || voucher.status === 'delivered') {
        return Response.json({ error: 'Voucher já utilizado ou cancelado' }, { status: 400 });
      }

      // Use the server-side euro_value, never the client-provided discountAmount
      validatedDiscount = voucher.euro_value || 0;
    }

    const finalAmount = Math.max(0, (booking.total_amount || 0) - validatedDiscount);

    console.log('💰 Amount:', { original: booking.total_amount, discount: validatedDiscount, final: finalAmount });

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
      locale: 'pt',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user.email,
      metadata: {
        booking_id: bookingId,
        user_email: user.email,
        voucher_code: voucherCode || '',
        discount_amount: validatedDiscount,
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
      loyalty_points_discount: validatedDiscount,
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
    
    console.error('❌ Erro completo:', error);

    return new Response(JSON.stringify({
      error: 'Ocorreu um erro ao processar o pagamento. Tente novamente.',
      type: error.type || 'unknown'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
});