import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.5.0';
import { resolveVerifiedProfessional } from '../../shared/payoutRecipient.ts';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

/**
 * Este serviço processa o uso de um passeio grátis da subscrição.
 * 
 * LÓGICA DE NEGÓCIO:
 * 1. Verifica se o utilizador tem passeios grátis disponíveis
 * 2. Marca o passeio como "pago pela subscrição"
 * 3. Paga ao walker via Stripe Connect (a empresa paga, não o cliente)
 * 4. Incrementa o contador de passeios usados
 * 5. Se não usar até ao fim do mês, os passeios são perdidos (não acumulam)
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { booking_id } = body;

    if (!booking_id) {
      return Response.json({ error: 'Missing booking_id' }, { status: 400 });
    }

    // 0. Verificar propriedade da reserva (prevenir IDOR)
    let booking;
    try {
      booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    } catch {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    const bookingOwnerEmail = booking.owner_email || booking.created_by;
    if (bookingOwnerEmail !== user.email) {
      return Response.json({ error: 'Forbidden: you do not own this booking' }, { status: 403 });
    }

    // SECURITY: Validate booking workflow state before releasing any funds.
    // Prevents premature/repeated payouts for services not yet performed.
    if (booking.paid_via_subscription || booking.payment_status === 'released') {
      return Response.json({ error: 'This booking has already been paid' }, { status: 400 });
    }
    if (booking.status !== 'service_completed') {
      return Response.json({
        error: 'Free walk token can only be used after the service is completed and validated',
        current_status: booking.status
      }, { status: 400 });
    }

    // SECURITY: Derive walker_email and service_amount from the booking record,
    // never from user-supplied input, to prevent payment diversion.
    const walker_email = booking.walker_email;
    let service_amount = booking.service_amount;

    if (!walker_email || !service_amount) {
      return Response.json({ error: 'Booking is missing walker or service amount' }, { status: 400 });
    }

    // SECURITY: se já existe um registo Payment para a reserva, é ele a fonte de verdade.
    const relatedPayments = await base44.asServiceRole.entities.Payment.filter({ booking_id });
    const verifiedPayment = relatedPayments[0];
    if (verifiedPayment) {
      if (verifiedPayment.recipient_email && verifiedPayment.recipient_email !== walker_email) {
        return Response.json({ error: 'Booking professional does not match the registered payment' }, { status: 409 });
      }
      if (verifiedPayment.service_amount > 0) {
        service_amount = verifiedPayment.service_amount;
      }
    }

    // SECURITY: destinatário validado no servidor (não pode ser o próprio cliente).
    const payoutCheck = await resolveVerifiedProfessional(base44, booking, walker_email);
    if (payoutCheck.error) {
      return Response.json({ error: payoutCheck.error }, { status: 403 });
    }

    // 1. Verificar subscrição do utilizador
    const subscriptions = await base44.entities.OwnerSubscription.filter({
      owner_email: user.email,
      is_active: true
    });

    if (!subscriptions.length) {
      return Response.json({ 
        error: 'No active subscription',
        canUseFreeWalk: false 
      }, { status: 400 });
    }

    const subscription = subscriptions[0];

    // 2. Verificar se tem passeios grátis disponíveis
    const freeWalksAvailable = subscription.free_walks_per_month || 0;
    const freeWalksUsed = subscription.free_walks_used_this_month || 0;
    const remainingFreeWalks = freeWalksAvailable - freeWalksUsed;

    if (remainingFreeWalks <= 0) {
      return Response.json({ 
        error: 'No free walks remaining this month',
        canUseFreeWalk: false,
        freeWalksUsed,
        freeWalksAvailable
      }, { status: 400 });
    }

    // 3. Verificar valor máximo do passeio grátis (€15)
    const maxFreeWalkValue = 15.00;
    const amountToPay = Math.min(service_amount, maxFreeWalkValue);
    const extraCharge = service_amount > maxFreeWalkValue ? service_amount - maxFreeWalkValue : 0;

    // 4. Buscar perfil do walker para obter Stripe Account
    const walkerProfile = payoutCheck.profile;

    if (!walkerProfile.stripe_account_id) {
      return Response.json({ 
        error: 'Walker does not have Stripe Connect configured',
        canUseFreeWalk: false 
      }, { status: 400 });
    }

    // 5. Criar transferência para o walker (a empresa paga)
    // A empresa retém a comissão normal mesmo nos passeios grátis
    const platformFeePercent = 15; // 15% comissão
    const platformFee = amountToPay * (platformFeePercent / 100);
    const walkerReceives = amountToPay - platformFee;

    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(walkerReceives * 100), // Em centavos
        currency: 'eur',
        destination: walkerProfile.stripe_account_id,
        transfer_group: `free_walk_${booking_id}`,
        metadata: {
          booking_id,
          owner_email: user.email,
          walker_email,
          subscription_plan: subscription.plan_type,
          free_walk_value: amountToPay.toString(),
          platform_fee: platformFee.toString(),
          type: 'subscription_free_walk'
        }
      });

      console.log(`Transfer created: ${transfer.id} - €${walkerReceives} to walker`);

      // 6. Atualizar contador de passeios usados
      await base44.asServiceRole.entities.OwnerSubscription.update(subscription.id, {
        free_walks_used_this_month: freeWalksUsed + 1,
        total_savings: (subscription.total_savings || 0) + amountToPay
      });

      // 7. Atualizar o booking
      await base44.asServiceRole.entities.Booking.update(booking_id, {
        payment_status: 'released',
        status: 'completed',
        paid_via_subscription: true,
        subscription_walk_value: amountToPay,
        extra_charge: extraCharge
      });

      // 8. Registar pagamento
      await base44.asServiceRole.entities.Payment.create({
        booking_id,
        payer_email: 'subscription@pawcao.net', // Pago pela empresa
        payer_name: 'PawCão Subscription',
        recipient_email: walker_email,
        recipient_name: walkerProfile.walker_name,
        service_amount: walkerReceives,
        platform_fee: platformFee,
        total_amount: amountToPay,
        status: 'released',
        payment_method: 'subscription_token',
        stripe_transfer_id: transfer.id,
        notes: `Free walk from ${subscription.plan_type} subscription. Owner: ${user.email}`
      });

      // 9. Atualizar earnings do walker
      await base44.asServiceRole.entities.WalkerProfile.update(walkerProfile.id, {
        total_earnings: (walkerProfile.total_earnings || 0) + walkerReceives,
        total_walks: (walkerProfile.total_walks || 0) + 1
      });

      return Response.json({
        success: true,
        message: 'Free walk token used successfully',
        transfer_id: transfer.id,
        walker_received: walkerReceives,
        platform_fee: platformFee,
        free_walks_remaining: remainingFreeWalks - 1,
        extra_charge_required: extraCharge > 0 ? extraCharge : null
      });

    } catch (stripeError) {
      console.error('Stripe transfer error:', stripeError);
      return Response.json({ 
        error: 'Failed to process payment to walker',
        details: stripeError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Free walk token error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});