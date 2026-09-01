import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import Stripe from 'npm:stripe@14.21.0';

// ── Fluxo de custódia (escrow) para reservas de hotel ──
// O pagamento é capturado imediatamente para a conta Stripe da plataforma (custódia)
// no momento do checkout. O valor só é transferido para o hotel (via Stripe Connect)
// quando o serviço é concluído (check-out / concluída), restando apenas a comissão
// na conta da plataforma.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'Missing bookingId' }, { status: 400 });

    // Fetch the hotel booking
    const bookings = await base44.asServiceRole.entities.HotelBooking.filter({ id: bookingId });
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    const hb = bookings[0];

    // Only the hotel owner or admin can release the payout
    const isHotel = hb.hotel_email === user.email;
    const isAdmin = user.role === 'admin';
    if (!isHotel && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // O pagamento só é libertado após a CONCLUSÃO do serviço (cão saiu do hotel)
    const RELEASE_STATUSES = ['checked_out', 'completed'];
    if (!RELEASE_STATUSES.includes(hb.status)) {
      return Response.json({ error: 'O pagamento só é libertado após a conclusão do serviço (check-out).' }, { status: 400 });
    }

    // Idempotência: já transferido
    if (hb.payment_status === 'released') {
      return Response.json({ success: true, message: 'Already released' });
    }

    const serviceAmount = Number(hb.service_amount || 0);
    const platformFee = Number(hb.platform_fee || 0);
    if (serviceAmount <= 0) {
      return Response.json({ success: true, message: 'No amount to release' });
    }

    const hotelEmail = hb.hotel_email;
    if (!hotelEmail) {
      return Response.json({ error: 'Hotel email not found' }, { status: 400 });
    }

    // Idempotência: se já existe um payout com transfer_id, não transferir de novo
    const existingPayouts = await base44.asServiceRole.entities.WalkerPayout.filter({ booking_id: bookingId });
    const existingPayout = existingPayouts[0];
    if (existingPayout?.stripe_transfer_id) {
      // Já foi transferido — apenas garantir que o estado fica 'released'
      if (hb.payment_status !== 'released') {
        await base44.asServiceRole.entities.HotelBooking.update(bookingId, { payment_status: 'released' });
      }
      return Response.json({ success: true, message: 'Already transferred', transfer_id: existingPayout.stripe_transfer_id });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // ── Resolver conta Stripe Connect do hotel ──
    const hotelProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({ id: hb.hotel_profile_id });
    const hotelProfile = hotelProfiles[0];
    const stripeAccountId = hotelProfile?.stripe_account_id || null;
    const connectReady = !!(stripeAccountId && hotelProfile?.stripe_charges_enabled);

    let transferId = null;
    let payoutStatus = 'pending';
    let payoutNotes = '';

    if (connectReady) {
      // ── Transferir o service_amount para a conta Stripe Connect do hotel ──
      // A comissão (platform_fee) permanece automaticamente na conta da plataforma.
      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(serviceAmount * 100),
          currency: 'eur',
          destination: stripeAccountId,
          transfer_group: `hotel_${bookingId}`,
          metadata: {
            hotel_booking_id: bookingId,
            hotel_email: hotelEmail,
            service_type: hb.service_type || '',
            owner_email: hb.owner_email || '',
            platform_fee: String(platformFee),
          },
        });
        transferId = transfer.id;
        payoutStatus = 'completed';
        payoutNotes = `Transferido via Stripe Connect (${transferId})`;
        console.log(`💸 Hotel payout transferred: €${serviceAmount} to ${hotelEmail} (commission €${platformFee} retained)`);
      } catch (transferErr) {
        payoutStatus = 'failed';
        payoutNotes = `Transfer falhou: ${transferErr.message}`;
        console.error('Hotel Stripe transfer failed:', transferErr.message);
      }
    } else {
      payoutStatus = 'failed';
      payoutNotes = 'Stripe Connect não configurado — configure para receber automaticamente';
    }

    // ── Registar/atualizar WalkerPayout ──
    const payoutPayload = {
      walker_email: hotelEmail,
      walker_name: hb.hotel_name || '',
      booking_id: bookingId,
      client_email: hb.owner_email || '',
      payout_type: 'hotel_service',
      gross_amount: Number(hb.total_amount || 0),
      platform_fee: platformFee,
      net_amount: serviceAmount,
      status: payoutStatus,
      stripe_transfer_id: transferId || null,
      paid_at: transferId ? new Date().toISOString() : null,
      notes: payoutNotes,
    };
    if (existingPayout) {
      await base44.asServiceRole.entities.WalkerPayout.update(existingPayout.id, payoutPayload);
    } else {
      await base44.asServiceRole.entities.WalkerPayout.create(payoutPayload);
    }

    // ── Atualizar carteira interna do hotel (pending → available) ──
    const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: hotelEmail });
    let wallet = wallets[0];
    if (!wallet) {
      wallet = await base44.asServiceRole.entities.UserWallet.create({
        user_email: hotelEmail,
        cashback_balance: 0,
        service_tokens: 0,
        total_points: 0,
        available_balance: 0,
        pending_balance: 0,
        total_earnings: 0
      });
    }
    const currentPending = wallet.pending_balance || 0;
    const currentAvailable = wallet.available_balance || 0;
    const releaseAmount = Math.min(serviceAmount, currentPending);
    await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
      pending_balance: Math.max(0, currentPending - releaseAmount),
      available_balance: currentAvailable + releaseAmount
    });

    await base44.asServiceRole.entities.WalletTransaction.create({
      user_email: hotelEmail,
      transaction_type: transferId ? 'walker_payment_completed' : 'walker_payment_pending',
      amount: serviceAmount,
      description: transferId
        ? `Pagamento libertado — ${hb.hotel_name || 'hotel'} (${hb.checkin_date}) via Stripe`
        : `Pagamento pendente — ${hb.hotel_name || 'hotel'} (configure Stripe Connect)`,
      related_booking_id: bookingId,
      balance_after: currentAvailable + releaseAmount
    });

    // ── Marcar reserva como libertada (só se a transferência ocorreu) ──
    await base44.asServiceRole.entities.HotelBooking.update(bookingId, {
      payment_status: transferId ? 'released' : 'paid'
    });

    // ── Notificações ──
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: hotelEmail,
      title: transferId ? '💸 Pagamento recebido' : '⚠️ Pagamento pendente',
      message: transferId
        ? `€${serviceAmount.toFixed(2)} foram transferidos para a sua conta Stripe (reserva ${hb.checkin_date}). Comissão da plataforma retida: €${platformFee.toFixed(2)}.`
        : `O serviço foi concluído. Para receber €${serviceAmount.toFixed(2)} automaticamente, configure o Stripe Connect no seu painel.`,
      type: 'payment',
      related_id: bookingId
    });
    if (hb.owner_email) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: hb.owner_email,
        title: '✅ Serviço concluído',
        message: 'O pagamento foi libertado para o hotel. A comissão da plataforma foi retida automaticamente.',
        type: 'payment',
        related_id: bookingId
      });
    }

    return Response.json({
      success: true,
      bookingId,
      released: serviceAmount,
      transfer_id: transferId,
      connect_ready: connectReady,
      payout_status: payoutStatus
    });
  } catch (error) {
    console.error('Release hotel payout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});