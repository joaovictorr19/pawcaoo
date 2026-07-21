import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.14.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId) return Response.json({ error: 'Missing bookingId' }, { status: 400 });

    const bookings = await base44.asServiceRole.entities.HotelBooking.filter({ id: bookingId });
    if (bookings.length === 0) {
      return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    const hb = bookings[0];

    // Only the hotel owner or admin can mark no-show
    const isHotel = hb.hotel_email === user.email;
    const isAdmin = user.role === 'admin';
    if (!isHotel && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only paid bookings that haven't been checked in can be marked as no-show
    if (hb.payment_status !== 'paid') {
      return Response.json({ error: 'Apenas reservas pagas podem ser marcadas como no-show' }, { status: 400 });
    }
    if (['checked_in', 'in_progress', 'checked_out', 'completed'].includes(hb.status)) {
      return Response.json({ error: 'Não é possível marcar como no-show uma reserva já em curso ou concluída' }, { status: 400 });
    }

    const totalAmount = hb.total_amount || 0;

    // No-show split: hotel keeps 50% of total, platform keeps 10%, client refunded 40%
    const hotelKeeps = Math.round(totalAmount * 0.50 * 100) / 100;
    const platformFee = Math.round(totalAmount * 0.10 * 100) / 100;
    const refundAmount = Math.round((totalAmount - hotelKeeps - platformFee) * 100) / 100;

    // ── Issue partial refund via Stripe ──
    let stripeRefundId = '';
    if (refundAmount > 0 && hb.stripe_payment_intent_id) {
      try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
        const refund = await stripe.refunds.create({
          payment_intent: hb.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100),
          metadata: {
            booking_id: bookingId,
            reason: 'no_show',
            hotel_keeps: hotelKeeps.toString(),
            platform_fee: platformFee.toString(),
          },
        });
        stripeRefundId = refund.id;
        console.log(`✅ Stripe refund issued: €${refundAmount} (refund ${refund.id})`);
      } catch (stripeErr) {
        console.error('Stripe refund error:', stripeErr.message);
        return Response.json({ error: 'Erro ao processar reembolso: ' + stripeErr.message }, { status: 500 });
      }
    }

    // ── Update booking ──
    await base44.asServiceRole.entities.HotelBooking.update(bookingId, {
      status: 'cancelled',
      payment_status: 'partial',
      cancellation_reason: 'no_show',
    });

    // ── Adjust hotel wallet: remove full pending, credit 50% as available ──
    if (hb.hotel_email) {
      try {
        const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: hb.hotel_email });
        if (wallets.length > 0) {
          const wallet = wallets[0];
          const currentPending = wallet.pending_balance || 0;
          const currentAvailable = wallet.available_balance || 0;

          // Remove the full total_amount from pending (was credited on payment)
          const newPending = Math.max(0, currentPending - totalAmount);
          // Credit 50% as available
          const newAvailable = currentAvailable + hotelKeeps;

          await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
            pending_balance: newPending,
            available_balance: newAvailable,
          });

          await base44.asServiceRole.entities.WalletTransaction.create({
            user_email: hb.hotel_email,
            transaction_type: 'walker_payment_completed',
            amount: hotelKeeps,
            description: `No-show — 50% retenção — reserva ${hb.hotel_name || 'hotel'} (${hb.checkin_date})`,
            related_booking_id: bookingId,
            balance_after: newAvailable,
          });

          console.log(`✅ Hotel wallet adjusted: pending -€${totalAmount}, available +€${hotelKeeps}`);
        }
      } catch (walletErr) {
        console.error('Error adjusting hotel wallet:', walletErr.message);
      }
    }

    // ── Notify client about no-show and partial refund ──
    if (hb.owner_email) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: hb.owner_email,
        title: 'Reserva — No-show',
        message: `A sua reserva no ${hb.hotel_name || 'hotel'} (${hb.checkin_date}) foi marcada como no-show. Foram reembolsados €${refundAmount.toFixed(2)} (retenção de 50% aplicada).`,
        type: 'booking',
        related_id: bookingId,
        icon: '⚠️',
      });

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: hb.owner_email,
          subject: `Reserva marcada como no-show — ${hb.hotel_name || 'Hotel'}`,
          body: [
            `Olá ${hb.owner_name || ''},`,
            ``,
            `A sua reserva no ${hb.hotel_name || 'hotel'} foi marcada como no-show (não compareceu ao check-in em ${hb.checkin_date}).`,
            ``,
            `Resumo financeiro:`,
            `Total pago: €${totalAmount.toFixed(2)}`,
            `Retenção do hotel (50%): €${hotelKeeps.toFixed(2)}`,
            `Comissão da plataforma: €${platformFee.toFixed(2)}`,
            `Valor reembolsado: €${refundAmount.toFixed(2)}`,
            ``,
            `O reembolso será processado no seu método de pagamento original em alguns dias úteis.`,
            ``,
            `Obrigado,`,
            `Equipa PawCão`,
          ].join('\n'),
        });
      } catch (emailErr) {
        console.error('Error sending no-show email:', emailErr.message);
      }
    }

    return Response.json({
      success: true,
      bookingId,
      hotelKeeps,
      platformFee,
      refundAmount,
      stripeRefundId,
    });
  } catch (error) {
    console.error('Process hotel no-show error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});