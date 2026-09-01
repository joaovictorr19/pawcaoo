import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import Stripe from 'npm:stripe@14.14.0';
import { resolveOrigin, adjustHotelCapacity, computeHotelPayoutSplit } from '../../shared/hotelPricing.ts';
import { applyWalletPayment } from '../../shared/walletPayment.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { booking_id, action, use_wallet } = body;

    if (!booking_id) return Response.json({ error: 'booking_id obrigatório' }, { status: 400 });
    if (!['accept', 'reject'].includes(action)) return Response.json({ error: 'Ação inválida (accept ou reject)' }, { status: 400 });

    // Fetch booking
    const bookings = await base44.asServiceRole.entities.HotelBooking.filter({ id: booking_id });
    if (!bookings || bookings.length === 0) return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    const booking = bookings[0];

    // Authorization: only the booking owner can respond to price proposals
    if (booking.owner_email !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Must be in awaiting_client state
    if (booking.price_proposal_status !== 'awaiting_client') {
      return Response.json({ error: 'Esta reserva não aguarda resposta sua' }, { status: 400 });
    }

    // ── REJECT: cancel booking and restore capacity ──
    if (action === 'reject') {
      await base44.asServiceRole.entities.HotelBooking.update(booking_id, {
        price_proposal_status: 'rejected',
        status: 'cancelled',
        cancellation_reason: 'price_proposal_rejected',
      });

      // Restore hotel capacity
      try {
        await adjustHotelCapacity(base44, booking.hotel_profile_id, booking.service_type, booking.total_dogs || 1, 'restore');
      } catch (capErr) {
        console.error('Erro ao restaurar vagas:', capErr.message);
      }

      // Notify hotel
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: booking.hotel_email,
          title: 'Proposta de Preço Recusada',
          message: `${booking.owner_name} recusou a proposta de preço de €${(booking.proposed_amount || 0).toFixed(2)} para a reserva de ${booking.checkin_date}. A reserva foi cancelada.`,
          type: 'booking',
          related_id: booking_id,
          icon: '✕'
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr.message);
      }

      return Response.json({ success: true, action: 'rejected', booking_id });
    }

    // ── ACCEPT: handle payment based on prior payment status ──
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

    // Get or create Stripe customer
    let customerId;
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name || booking.owner_name,
        metadata: { user_id: user.id }
      });
      customerId = customer.id;
    }

    const origin = resolveOrigin(req);

    const newTotalAmount = booking.total_amount || booking.proposed_amount || 0;
    if (newTotalAmount <= 0) {
      return Response.json({ error: 'Valor da reserva inválido' }, { status: 400 });
    }

    // ── Determine amount already paid (booking já pago → cobrar só a diferença) ──
    const isAlreadyPaid = booking.payment_status === 'paid';
    const alreadyPaidAmount = isAlreadyPaid ? (booking.original_amount || booking.total_amount || 0) : 0;
    const difference = Math.round((newTotalAmount - alreadyPaidAmount) * 100) / 100;

    const SERVICE_LABELS = {
      boarding: "Alojamento", daycare: "Creche Diurna", grooming: "Grooming",
      walk_with_partner: "Passeio com Parceiro", training: "Treino", dropin: "Assistência em Casa",
    };
    const serviceLabel = SERVICE_LABELS[booking.service_type] || booking.service_type;
    const dogNames = (booking.dogs || []).map(d => d.dog_name).filter(Boolean).join(", ") || "cão";
    const dateRange = booking.checkout_date && booking.checkout_date !== booking.checkin_date
      ? `${booking.checkin_date} → ${booking.checkout_date}`
      : booking.checkin_date;

    // Recompute the original payout split (para calcular deltas a creditar ao hotel/plataforma)
    let additionalServiceAmount = 0;
    let additionalPlatformFee = 0;
    if (isAlreadyPaid) {
      try {
        const hotelProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({ id: booking.hotel_profile_id });
        const hotel = hotelProfiles[0];
        if (hotel) {
          const transportFee = booking.transport_price || 0;
          const origSplit = computeHotelPayoutSplit(hotel, alreadyPaidAmount, transportFee);
          additionalServiceAmount = Math.max(0, Math.round(((booking.service_amount || 0) - origSplit.serviceAmount) * 100) / 100);
          additionalPlatformFee = Math.max(0, Math.round(((booking.platform_fee || 0) - origSplit.platformFee) * 100) / 100);
        }
      } catch (e) {
        console.error('Error computing payout deltas:', e.message);
      }
    }

    // Mark as accepted (só define payment_expires_at se ainda não foi pago)
    const acceptUpdate = { price_proposal_status: 'accepted' };
    if (!isAlreadyPaid) {
      acceptUpdate.payment_expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    }
    await base44.asServiceRole.entities.HotelBooking.update(booking_id, acceptUpdate);

    // ── CASE A: booking já pago e novo preço é MENOR → reembolsar a diferença automaticamente ──
    if (isAlreadyPaid && difference < 0) {
      const refundAmount = Math.round((alreadyPaidAmount - newTotalAmount) * 100) / 100;
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id || '',
          amount: Math.round(refundAmount * 100),
          reason: 'requested_by_customer',
          metadata: { hotel_booking_id: booking_id, type: 'price_adjustment_refund' },
        });

        try {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: booking.hotel_email,
            title: 'Proposta de Preço Aceite (valor reduzido)',
            message: `${booking.owner_name} aceitou a proposta. Foi processado um reembolso de €${refundAmount.toFixed(2)} ao cliente. Novo total: €${newTotalAmount.toFixed(2)}.`,
            type: 'booking',
            related_id: booking_id,
            icon: '✓'
          });
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: booking.owner_email,
            title: 'Proposta Aceite — Reembolso da Diferença',
            message: `Aceitou a proposta de preço do ${booking.hotel_name || 'hotel'}. O novo valor é €${newTotalAmount.toFixed(2)} e foi processado um reembolso de €${refundAmount.toFixed(2)} da diferença.`,
            type: 'payment',
            related_id: booking_id,
            icon: '🔄'
          });
        } catch (notifErr) {
          console.error('Notification error:', notifErr.message);
        }

        return Response.json({ success: true, action: 'accepted_refunded', refund_amount: refundAmount, refund_id: refund.id, booking_id });
      } catch (refundErr) {
        console.error('Auto-refund (price decrease) failed:', refundErr.message);
        return Response.json({ error: 'Não foi possível processar o reembolso da diferença: ' + refundErr.message }, { status: 500 });
      }
    }

    // ── CASE B: booking já pago e novo preço é MAIOR → checkout só da diferença ──
    // ── CASE C: ainda não pago → checkout do total novo ──
    const isAdjustment = isAlreadyPaid && difference > 0;
    let chargeAmount = isAdjustment ? difference : newTotalAmount;

    // ── Aplicar saldo da carteira do cliente (se solicitado) ──
    let walletUsed = 0;
    if (use_wallet && chargeAmount > 0) {
      try {
        const walletRes = await applyWalletPayment(base44, user.email, chargeAmount, {
          description: isAdjustment
            ? `Complemento de preço — ${booking.hotel_name || 'hotel'} (${booking.checkin_date})`
            : `${serviceLabel} — ${booking.hotel_name || 'hotel'} (${booking.checkin_date})`,
          relatedBookingId: booking_id,
        });
        walletUsed = walletRes.walletUsed;
        chargeAmount = walletRes.remainingAmount;
      } catch (e) {
        console.error('Wallet payment error (proposal accept):', e.message);
      }
    }

    // ── Pagamento total coberto pela carteira — confirmar diretamente (sem Stripe) ──
    if (chargeAmount <= 0 && walletUsed > 0) {
      const confirmUpdate = { price_proposal_status: 'accepted' };
      if (!isAlreadyPaid) {
        confirmUpdate.payment_status = 'paid';
      }
      try {
        await base44.asServiceRole.entities.HotelBooking.update(booking_id, confirmUpdate);
      } catch (e) { console.error('Confirm (full wallet) error:', e.message); }

      const hotelCredit = isAdjustment ? additionalServiceAmount : (booking.service_amount || 0);
      const feeRecord = isAdjustment ? additionalPlatformFee : (booking.platform_fee || 0);
      if (booking.hotel_email && hotelCredit > 0) {
        try {
          const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: booking.hotel_email });
          let w = wallets[0];
          if (!w) {
            w = await base44.asServiceRole.entities.UserWallet.create({ user_email: booking.hotel_email, cashback_balance: 0, service_tokens: 0, total_points: 0, available_balance: 0, pending_balance: 0, total_earnings: 0 });
          }
          const newPending = (w.pending_balance || 0) + hotelCredit;
          const newTotal = (w.total_earnings || 0) + hotelCredit;
          await base44.asServiceRole.entities.UserWallet.update(w.id, { pending_balance: newPending, total_earnings: newTotal });
          await base44.asServiceRole.entities.WalletTransaction.create({ user_email: booking.hotel_email, transaction_type: 'walker_payment_pending', amount: hotelCredit, description: `${isAdjustment ? 'Complemento' : 'Reserva'} — ${booking.hotel_name || 'hotel'} (${booking.checkin_date}) [carteira]`, related_booking_id: booking_id, balance_after: newPending });
        } catch (e) { console.error('Hotel wallet credit (full wallet) error:', e.message); }
      }
      if (feeRecord > 0) {
        try {
          await base44.asServiceRole.entities.PlatformRevenue.create({ revenue_type: 'commission', source_id: booking_id, user_email: booking.hotel_email || '', gross_amount: isAdjustment ? difference : newTotalAmount, cost_amount: hotelCredit, net_profit: feeRecord, description: `Comissão ${isAdjustment ? 'complemento' : 'reserva'} (carteira) — ${booking.hotel_name || ''} (${booking.checkin_date})`, period_month: new Date().toISOString().slice(0, 7) });
        } catch (e) { console.error('PlatformRevenue (full wallet) error:', e.message); }
      }
      try {
        await base44.asServiceRole.entities.Notification.create({ recipient_email: booking.hotel_email, title: '✅ Proposta Aceite (carteira)', message: `${booking.owner_name} aceitou e pagou €${newTotalAmount.toFixed(2)} via carteira PawCão.`, type: 'booking', related_id: booking_id, icon: '✅' });
        await base44.asServiceRole.entities.Notification.create({ recipient_email: booking.owner_email, title: '✅ Proposta Aceite', message: `Aceitou a proposta de €${newTotalAmount.toFixed(2)} paga com saldo da carteira.`, type: 'payment', related_id: booking_id, icon: '✅' });
      } catch (e) { console.error('Notification error (full wallet):', e.message); }
      return Response.json({ success: true, action: 'accepted', wallet_paid: true, wallet_used: walletUsed, booking_id });
    }

    if (chargeAmount <= 0) {
      // Sem valor a cobrar (ex.: novo preço igual ao já pago) — apenas confirmar
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: booking.hotel_email,
          title: 'Proposta de Preço Aceite',
          message: `${booking.owner_name} aceitou a proposta de preço para a reserva de ${booking.checkin_date}. Valor confirmado: €${newTotalAmount.toFixed(2)}.`,
          type: 'booking',
          related_id: booking_id,
          icon: '✓'
        });
      } catch (notifErr) {
        console.error('Notification error:', notifErr.message);
      }
      return Response.json({ success: true, action: 'accepted', booking_id });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: isAdjustment ? `Complemento de Preço — ${serviceLabel}` : `${serviceLabel} — ${booking.hotel_name}`,
              description: isAdjustment
                ? `Complemento de €${difference.toFixed(2)} após análise do perfil (${dogNames} · ${dateRange})`
                : `${dogNames} · ${dateRange}${booking.total_nights > 1 ? ` (${booking.total_nights} noites)` : ''} · Preço ajustado após análise do perfil`,
            },
            unit_amount: Math.round(chargeAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: isAdjustment ? 'hotel_price_adjustment' : 'hotel_booking',
        hotel_booking_id: booking_id,
        hotel_profile_id: booking.hotel_profile_id,
        hotel_email: booking.hotel_email || '',
        owner_email: user.email,
        service_type: booking.service_type,
        total_amount: newTotalAmount.toString(),
        platform_fee: (booking.platform_fee || 0).toString(),
        service_amount: (booking.service_amount || 0).toString(),
        already_paid: alreadyPaidAmount.toString(),
        adjustment_amount: isAdjustment ? difference.toString() : '0',
        additional_service_amount: additionalServiceAmount.toString(),
        additional_platform_fee: additionalPlatformFee.toString(),
        wallet_used: walletUsed.toString(),
      },
      payment_intent_data: {
        capture_method: 'automatic',
        metadata: {
          hotel_booking_id: booking_id,
          hotel_email: booking.hotel_email || '',
          booking_type: 'hotel',
          price_adjustment: isAdjustment ? 'true' : 'false',
        }
      },
      success_url: `${origin}/CheckoutSuccess?session_id={CHECKOUT_SESSION_ID}&type=hotel_booking&booking_id=${booking_id}`,
      cancel_url: `${origin}/PriceProposals?cancelled=true`,
      locale: 'pt',
    });

    // Notify hotel that client accepted
    try {
      const notifMsg = isAdjustment
        ? `${booking.owner_name} aceitou a proposta de preço. Aguarda o pagamento do complemento de €${difference.toFixed(2)} (total: €${newTotalAmount.toFixed(2)}).`
        : `${booking.owner_name} aceitou a proposta de preço de €${newTotalAmount.toFixed(2)} para a reserva de ${booking.checkin_date}. Aguardar pagamento.`;
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: booking.hotel_email,
        title: 'Proposta de Preço Aceite',
        message: notifMsg,
        type: 'booking',
        related_id: booking_id,
        icon: '✓'
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }

    return Response.json({ url: session.url, session_id: session.id, booking_id, wallet_used: walletUsed });
  } catch (error) {
    console.error('respondPriceProposal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}