import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const ENTITY_CONFIG = {
  walk: {
    entityName: 'Booking',
    idField: 'walkId',
    professionalEmailField: 'walker_email',
    professionalNameField: 'walker_name',
    professionalIdField: 'walker_id',
    profileEntity: 'WalkerProfile',
    ownerEmailField: 'owner_email',
    ownerNameField: 'owner_name',
    serviceCompletedStatus: 'service_completed',
    completedStatus: 'completed',
    reportField: 'special_notes',
    photoField: 'drop_off_photo'
  },
  training: {
    entityName: 'TrainingBooking',
    idField: 'trainingBookingId',
    professionalEmailField: 'trainer_email',
    professionalNameField: 'trainer_name',
    professionalIdField: 'trainer_id',
    profileEntity: 'TrainerProfile',
    ownerEmailField: 'owner_email',
    ownerNameField: 'owner_name',
    serviceCompletedStatus: 'completed',
    completedStatus: 'completed',
    reportField: 'session_notes',
    photoField: null
  }
};

async function getRecord(base44, entityName, id) {
  const records = await base44.asServiceRole.entities[entityName].filter({ id });
  return records[0] || null;
}

async function getRelatedPayment(base44, kind, serviceId) {
  if (kind === 'walk') {
    const payments = await base44.asServiceRole.entities.Payment.filter({ booking_id: serviceId });
    return payments[0] || null;
  }
  const payments = await base44.asServiceRole.entities.Payment.filter({ booking_id: serviceId });
  return payments[0] || null;
}

async function resolveProfessionalProfile(base44, kind, service) {
  const config = ENTITY_CONFIG[kind];
  const profileEntity = base44.asServiceRole.entities[config.profileEntity];

  if (service[config.professionalIdField]) {
    const byId = await profileEntity.filter({ id: service[config.professionalIdField] });
    if (byId[0]) return byId[0];
  }

  const email = service[config.professionalEmailField];
  if (!email) return null;

  const byEmail = await profileEntity.filter({ created_by: email });
  return byEmail[0] || null;
}

async function markServiceCompleted(base44, kind, service, updates) {
  const config = ENTITY_CONFIG[kind];
  const entity = base44.asServiceRole.entities[config.entityName];
  await entity.update(service.id, updates);
}

async function createPayoutRecord(base44, service, payment, serviceAmount, platformFee, transferId, status, notes) {
  const professionalEmail = service.walker_email || service.trainer_email || payment?.recipient_email;
  const professionalName = service.walker_name || service.trainer_name || payment?.recipient_name || 'Profissional';
  const clientEmail = service.owner_email || service.created_by || payment?.payer_email;

  const existing = await base44.asServiceRole.entities.WalkerPayout.filter({ booking_id: service.id });
  if (existing[0]) {
    await base44.asServiceRole.entities.WalkerPayout.update(existing[0].id, {
      walker_email: professionalEmail,
      walker_name: professionalName,
      client_email: clientEmail,
      gross_amount: serviceAmount,
      platform_fee: platformFee,
      net_amount: serviceAmount,
      status,
      stripe_transfer_id: transferId,
      paid_at: transferId ? new Date().toISOString() : existing[0].paid_at,
      notes
    });
    return existing[0].id;
  }

  const payout = await base44.asServiceRole.entities.WalkerPayout.create({
    walker_email: professionalEmail,
    walker_name: professionalName,
    booking_id: service.id,
    client_email: clientEmail,
    payout_type: 'direct_payment',
    gross_amount: serviceAmount,
    platform_fee: platformFee,
    net_amount: serviceAmount,
    status,
    stripe_transfer_id: transferId,
    paid_at: transferId ? new Date().toISOString() : null,
    notes
  });
  return payout.id;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const kind = body.kind || 'walk';
    const config = ENTITY_CONFIG[kind];

    if (!config) {
      return Response.json({ error: 'Invalid service kind' }, { status: 400 });
    }

    const serviceId = body[config.idField] || body.serviceId;
    if (!serviceId) {
      return Response.json({ error: 'Missing service id' }, { status: 400 });
    }

    const service = await getRecord(base44, config.entityName, serviceId);
    if (!service) {
      return Response.json({ error: 'Service not found' }, { status: 404 });
    }

    const professionalEmail = service[config.professionalEmailField];
    if (professionalEmail !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (service.status === config.completedStatus && service.payment_status === 'released') {
      return Response.json({ success: true, skipped: true, reason: 'already_completed_and_paid' });
    }

    const completionUpdates = {
      status: config.serviceCompletedStatus,
      completed_date: new Date().toISOString()
    };

    if (config.photoField && body.finalPhoto) {
      completionUpdates[config.photoField] = body.finalPhoto;
    }
    if (body.photoUrl && config.photoField) {
      completionUpdates[config.photoField] = body.photoUrl;
    }
    if (body.report) {
      const previous = service[config.reportField] || '';
      completionUpdates[config.reportField] = previous
        ? `${previous}\n\n${body.report}`.trim()
        : body.report;
    }
    if (body.forcedFinishReason) {
      completionUpdates.forced_finish_reason = body.forcedFinishReason;
    }
    if (body.actualDistance) {
      completionUpdates.actual_delivery_distance = body.actualDistance;
    }

    await markServiceCompleted(base44, kind, service, completionUpdates);

    const payment = await getRelatedPayment(base44, kind, service.id);
    const serviceAmount = Number(service.service_amount || payment?.service_amount || 0);
    const platformFee = Number(service.platform_fee || payment?.platform_fee || 0);

    if (!payment) {
      return Response.json({ success: true, service_completed: true, payout_processed: false, reason: 'payment_not_found' });
    }

    if (payment.status === 'released') {
      await base44.asServiceRole.entities[config.entityName].update(service.id, {
        status: config.completedStatus,
        payment_status: 'released'
      });
      return Response.json({ success: true, service_completed: true, payout_processed: true, alreadyReleased: true });
    }

    const profile = await resolveProfessionalProfile(base44, kind, service);
    const stripeAccountId = profile?.stripe_account_id || null;

    let transferId = null;
    let payoutStatus = 'pending';
    let payoutNotes = 'Pending Stripe payout';

    if (stripeAccountId) {
      const transfer = await stripe.transfers.create({
        amount: Math.round(serviceAmount * 100),
        currency: 'eur',
        destination: stripeAccountId,
        transfer_group: `${kind}_${service.id}`,
        metadata: {
          service_id: service.id,
          service_kind: kind,
          professional_email: professionalEmail || '',
          owner_email: service[config.ownerEmailField] || service.created_by || ''
        }
      });
      transferId = transfer.id;
      payoutStatus = 'completed';
      payoutNotes = `Paid via Stripe Connect (${transferId})`;
    } else {
      payoutStatus = 'failed';
      payoutNotes = 'Stripe Connect not configured - manual payout required';
    }

    const payoutId = await createPayoutRecord(base44, service, payment, serviceAmount, platformFee, transferId, payoutStatus, payoutNotes);

    await base44.asServiceRole.entities.Payment.update(payment.id, {
      status: transferId ? 'released' : payment.status,
      released_date: transferId ? new Date().toISOString() : payment.released_date,
      stripe_transfer_id: transferId,
      split_details: {
        walker_receives: serviceAmount,
        platform_receives: platformFee,
        payment_processor_fee: 0
      },
      notes: payoutNotes
    });

    await base44.asServiceRole.entities[config.entityName].update(service.id, {
      status: transferId ? config.completedStatus : config.serviceCompletedStatus,
      payment_status: transferId ? 'released' : 'held'
    });

    await base44.asServiceRole.entities.WalletTransaction.create({
      user_email: service[config.ownerEmailField] || service.created_by || payment.payer_email,
      transaction_type: transferId ? 'walker_payment_completed' : 'walker_payment_pending',
      amount: serviceAmount,
      description: transferId
        ? `€${serviceAmount} pagos ao profissional`
        : `€${serviceAmount} pendentes até configuração Stripe do profissional`,
      related_booking_id: service.id,
      related_payout_id: payoutId,
      balance_after: 0
    });

    if (professionalEmail) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: professionalEmail,
        title: transferId ? '✅ Pagamento enviado' : '⚠️ Pagamento pendente',
        message: transferId
          ? `€${serviceAmount.toFixed(2)} foram transferidos para a sua conta Stripe.`
          : `O serviço foi concluído, mas falta configurar Stripe Connect para receber €${serviceAmount.toFixed(2)}.`,
        type: 'payment',
        related_id: service.id
      });
    }

    const ownerEmail = service[config.ownerEmailField] || service.created_by || payment.payer_email;
    if (ownerEmail) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: ownerEmail,
        title: kind === 'training' ? '🎓 Treino concluído' : '🐾 Passeio concluído',
        message: transferId
          ? 'O pagamento foi libertado para o profissional.'
          : 'O serviço foi concluído e o pagamento ficou pendente até o profissional configurar Stripe.',
        type: 'booking',
        related_id: service.id
      });
    }

    return Response.json({
      success: true,
      service_completed: true,
      payout_processed: !!transferId,
      transfer_id: transferId,
      payout_id: payoutId,
      service_kind: kind
    });
  } catch (error) {
    console.error('processServiceCompletion error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});