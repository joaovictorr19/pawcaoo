import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.21.0';
import { resolveVerifiedProfessional } from '../../shared/payoutRecipient.ts';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const TOKEN_VALUE = 12; // €12 per token - value transferred to walker
const TOKEN_VALUE_CENTS = 1200;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // ── SECURITY: Validate that the booking belongs to the authenticated user (IDOR fix) ──
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (!bookings || bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    const bookingRecord = bookings[0];
    const bookingOwnerEmail = bookingRecord.owner_email || bookingRecord.created_by;
    if (bookingOwnerEmail !== user.email) {
      return Response.json({ error: 'You do not have access to this booking' }, { status: 403 });
    }

    // SECURITY: Validate booking status and payment_status — token can only be used
    // on a booking that is confirmed and not already paid via token.
    if (!['confirmed', 'pending'].includes(bookingRecord.status)) {
      return Response.json({ error: 'Token cannot be used on this booking status' }, { status: 400 });
    }
    if (bookingRecord.payment_status === 'released' || bookingRecord.paid_via_subscription === true) {
      return Response.json({ error: 'This booking has already been paid' }, { status: 400 });
    }

    // SECURITY: Prevent double-use — check if a token was already redeemed for this booking
    const existingTokenUsage = await base44.asServiceRole.entities.WalletTransaction.filter({
      user_email: user.email,
      transaction_type: 'token_used',
      related_booking_id: booking_id
    });
    if (existingTokenUsage && existingTokenUsage.length > 0) {
      return Response.json({ error: 'A token has already been used for this booking' }, { status: 400 });
    }

    // Get user wallet — use service role so all wallet writes are privileged
    const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: user.email });

    if (wallets.length === 0 || wallets[0].service_tokens < 1) {
      return Response.json({ error: 'No tokens available' }, { status: 400 });
    }

    const wallet = wallets[0];

    // Check token expiry
    if (wallet.tokens_expiry_date && new Date(wallet.tokens_expiry_date) < new Date()) {
      return Response.json({ error: 'Tokens have expired' }, { status: 400 });
    }

    // SECURITY: Always resolve walker email from the booking record in the DB,
    // never from user-supplied input, to prevent payment diversion.
    const resolvedWalkerEmail = await getBookingWalkerEmail(base44, booking_id);

    if (!resolvedWalkerEmail) {
      return Response.json({ error: 'Could not determine walker for this booking' }, { status: 400 });
    }

    // SECURITY: o token só pode sair do escrow se o saldo o cobrir
    if ((wallet.escrow_balance || 0) < TOKEN_VALUE) {
      return Response.json({ error: 'Escrow balance insufficient for this token' }, { status: 400 });
    }

    // SECURITY: destinatário validado no servidor (não pode ser o cliente nem um
    // perfil criado depois da reserva, usado para desviar o pagamento).
    const payoutCheck = await resolveVerifiedProfessional(base44, bookingRecord, resolvedWalkerEmail);
    if (payoutCheck.error) {
      return Response.json({ error: payoutCheck.error }, { status: 403 });
    }
    const walkerProfile = payoutCheck.profile;
    let stripeTransferId = null;
    let payoutStatus = 'completed';

    // Attempt Stripe transfer if walker has a connected account
    if (walkerProfile?.stripe_account_id) {
      try {
        const transfer = await stripe.transfers.create({
          amount: TOKEN_VALUE_CENTS,
          currency: 'eur',
          destination: walkerProfile.stripe_account_id,
          transfer_group: `token_booking_${booking_id}`,
          metadata: {
            booking_id,
            walker_email: resolvedWalkerEmail,
            source: 'service_token',
            platform: 'pawcao'
          }
        });
        stripeTransferId = transfer.id;
        console.log(`Stripe transfer completed: ${transfer.id} for booking ${booking_id}`);
      } catch (stripeError) {
        console.error('Stripe transfer failed:', stripeError);
        // Do NOT deduct the token if the transfer fails
        return Response.json({
          success: false,
          error: 'Payment transfer to walker failed. Token was not deducted.',
          details: stripeError.message
        }, { status: 500 });
      }
    } else {
      // Walker has no Stripe account — create a pending payout record
      payoutStatus = 'pending_stripe_setup';
      console.log(`Walker ${resolvedWalkerEmail} has no Stripe account — creating pending payout`);
    }

    // Transfer succeeded (or pending) — now deduct the token using service role
    await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
      service_tokens: wallet.service_tokens - 1,
      tokens_used_this_month: (wallet.tokens_used_this_month || 0) + 1,
      escrow_balance: (wallet.escrow_balance || 0) - TOKEN_VALUE
    });

    // Record token usage transaction
    await base44.asServiceRole.entities.WalletTransaction.create({
      user_email: user.email,
      transaction_type: 'token_used',
      amount: TOKEN_VALUE,
      tokens_amount: 1,
      description: 'Token utilizado para serviço',
      related_booking_id: booking_id,
      balance_after: wallet.service_tokens - 1
    });

    // Record escrow release transaction
    await base44.asServiceRole.entities.WalletTransaction.create({
      user_email: user.email,
      transaction_type: 'escrow_released',
      amount: TOKEN_VALUE,
      description: `€${TOKEN_VALUE} liberados para prestador de serviço`,
      related_booking_id: booking_id,
      stripe_transfer_id: stripeTransferId,
      balance_after: (wallet.escrow_balance || 0) - TOKEN_VALUE
    });

    // Create payout record for reconciliation
    await base44.asServiceRole.entities.WalkerPayout.create({
      walker_email: resolvedWalkerEmail,
      walker_name: walkerProfile?.walker_name || resolvedWalkerEmail,
      client_email: user.email,
      booking_id,
      net_amount: TOKEN_VALUE,
      payout_type: 'token_redemption',
      status: payoutStatus,
      stripe_transfer_id: stripeTransferId,
      paid_at: stripeTransferId ? new Date().toISOString() : null,
      notes: stripeTransferId
        ? `Paid via Stripe Connect (${stripeTransferId})`
        : 'Pending — walker needs to complete Stripe Connect setup'
    });

    // Notify walker if pending Stripe setup
    if (!stripeTransferId) {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: resolvedWalkerEmail,
        title: '💰 Pagamento Pendente — Configure Stripe',
        message: `Tem €${TOKEN_VALUE} pendentes. Complete a configuração do Stripe Connect para receber pagamentos.`,
        type: 'payment',
        related_id: booking_id,
        priority: 'high',
        action_url: '/StripeConnectSetup'
      });
    }

    return Response.json({
      success: true,
      tokens_remaining: wallet.service_tokens - 1,
      amount_released: TOKEN_VALUE,
      stripe_transfer_id: stripeTransferId,
      payout_status: payoutStatus,
      message: stripeTransferId
        ? `Token usado com sucesso. €${TOKEN_VALUE} transferidos ao prestador.`
        : `Token usado. €${TOKEN_VALUE} pendentes até prestador configurar Stripe.`
    });

  } catch (error) {
    console.error('Use token error:', error);
    return Response.json({ error: 'Failed to process service token' }, { status: 500 });
  }
});

async function getBookingWalkerEmail(base44: any, bookingId: string): Promise<string | null> {
  try {
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    return bookings[0]?.walker_email || null;
  } catch {
    return null;
  }
}