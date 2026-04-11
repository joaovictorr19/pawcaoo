import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // This function is invoked by an internal automation (no end-user auth expected)
    const payload = await req.json().catch(() => ({}));

    const event = payload?.event || {};
    let booking = payload?.data || null;

    // If payload omitted data (large), fetch the booking by id
    if ((!booking || payload?.payload_too_large) && event?.entity_id) {
      booking = await base44.asServiceRole.entities.get('Booking', event.entity_id);
    }

    if (!booking?.id) {
      return Response.json({ success: false, message: 'No booking in payload' }, { status: 400 });
    }

    // Only act if status is service_completed/completed
    const status = booking.status;
    if (!['service_completed', 'completed'].includes(status)) {
      return Response.json({ success: true, skipped: true, reason: 'status_not_completed', booking_id: booking.id });
    }

    // Find payment linked to this booking
    const payments = await base44.asServiceRole.entities.Payment.filter({ booking_id: booking.id });
    const payment = payments[0];
    if (!payment) {
      return Response.json({ success: false, message: 'Payment not found for booking' }, { status: 404 });
    }

    if (payment.status === 'released') {
      return Response.json({ success: true, skipped: true, reason: 'already_released', booking_id: booking.id });
    }

    // Determine transfer amount (what walker receives)
    const serviceAmount = Number(booking.service_amount || payment.service_amount || 0);
    if (serviceAmount <= 0) {
      return Response.json({ success: false, message: 'Invalid service amount' }, { status: 400 });
    }

    // Resolve professional profile and Stripe account (Walker or Trainer)
    let walkerStripeAccount = null;
    let walkerEmail = booking.walker_email || booking.trainer_email || payment.recipient_email;
    let walkerName = booking.walker_name || booking.trainer_name || payment.recipient_name || 'Profissional';

    // Try by explicit id first
    if (booking.walker_id) {
      const profs = await base44.asServiceRole.entities.WalkerProfile.filter({ id: booking.walker_id });
      walkerStripeAccount = profs?.[0]?.stripe_account_id || null;
    }
    if (!walkerStripeAccount && booking.trainer_id) {
      const profs = await base44.asServiceRole.entities.TrainerProfile.filter({ id: booking.trainer_id });
      walkerStripeAccount = profs?.[0]?.stripe_account_id || null;
    }
    // Fallback by email
    if (!walkerStripeAccount && walkerEmail) {
      const walkers = await base44.asServiceRole.entities.WalkerProfile.filter({ created_by: walkerEmail });
      const trainers = walkerStripeAccount ? [] : await base44.asServiceRole.entities.TrainerProfile.filter({ created_by: walkerEmail });
      walkerStripeAccount = walkers?.[0]?.stripe_account_id || trainers?.[0]?.stripe_account_id || null;
    }

    // If professional has no connected account, mark as released (manual payout needed) and notify
    if (!walkerStripeAccount) {
      await base44.asServiceRole.entities.Payment.update(payment.id, {
        status: 'released',
        released_date: new Date().toISOString(),
        split_details: {
          walker_receives: serviceAmount,
          platform_receives: Number(payment.platform_fee || 0),
          payment_processor_fee: 0
        },
        notes: 'No Stripe Connect account — manual payout required'
      });

      await base44.asServiceRole.entities.Booking.update(booking.id, { payment_status: 'released' });

      // Notify professional to set up Stripe
      if (walkerEmail) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: walkerEmail,
          title: 'Configurar Conta Stripe',
          message: 'Pagamento pronto para envio. Ligue a sua conta Stripe no painel para receber automaticamente.',
          type: 'payment',
          related_id: booking.id
        });
      }

      return Response.json({ success: true, released: true, manual: true });
    }

    // Perform transfer from platform to connected account
    let transferId = null;
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(serviceAmount * 100),
        currency: 'eur',
        destination: walkerStripeAccount,
        transfer_group: `booking_${booking.id}`,
        metadata: {
          booking_id: booking.id,
          recipient_email: walkerEmail || '',
          recipient_name: walkerName || ''
        }
      });
      transferId = transfer.id;
    } catch (e) {
      console.error('Stripe transfer error:', e);
      return Response.json({ success: false, error: e?.message || String(e) }, { status: 500 });
    }

    // Update records
    await base44.asServiceRole.entities.Payment.update(payment.id, {
      status: 'released',
      released_date: new Date().toISOString(),
      stripe_transfer_id: transferId,
      split_details: {
        walker_receives: serviceAmount,
        platform_receives: Number(payment.platform_fee || 0),
        payment_processor_fee: 0
      },
      notes: `Released on completion via automation. Transfer ${transferId}`
    });

    await base44.asServiceRole.entities.Booking.update(booking.id, { payment_status: 'released' });

    // Notify both sides
    if (walkerEmail) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: walkerEmail,
        title: '✅ Pagamento Enviado',
        message: `€${serviceAmount.toFixed(2)} foram transferidos para a sua conta Stripe. Obrigado!`,
        type: 'payment',
        related_id: booking.id
      });
    }

    const ownerEmail = booking.owner_email || booking.created_by || payment.payer_email;
    if (ownerEmail) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: ownerEmail,
        title: '🐾 Passeio Concluído',
        message: 'O pagamento foi libertado para o profissional. Obrigado por usar a PawCão!',
        type: 'payment',
        related_id: booking.id
      });
    }

    return Response.json({ success: true, released: true, transfer_id: transferId });
  } catch (error) {
    console.error('releaseHeldPaymentOnCompletion error:', error);
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});