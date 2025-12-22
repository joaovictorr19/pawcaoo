import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const TOKEN_VALUE = 12; // €12 per token - value transferred to walker

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id, walker_email } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'Booking ID required' }, { status: 400 });
    }

    // Get user wallet
    const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
    
    if (wallets.length === 0 || wallets[0].service_tokens < 1) {
      return Response.json({ error: 'No tokens available' }, { status: 400 });
    }

    const wallet = wallets[0];

    // Check token expiry
    if (wallet.tokens_expiry_date && new Date(wallet.tokens_expiry_date) < new Date()) {
      return Response.json({ error: 'Tokens have expired' }, { status: 400 });
    }

    // Deduct token from wallet
    await base44.entities.UserWallet.update(wallet.id, {
      service_tokens: wallet.service_tokens - 1,
      tokens_used_this_month: (wallet.tokens_used_this_month || 0) + 1,
      escrow_balance: (wallet.escrow_balance || 0) - TOKEN_VALUE
    });

    // Record token usage transaction
    await base44.entities.WalletTransaction.create({
      user_email: user.email,
      transaction_type: 'token_used',
      amount: TOKEN_VALUE,
      tokens_amount: 1,
      description: `Token utilizado para serviço`,
      related_booking_id: booking_id,
      balance_after: wallet.service_tokens - 1
    });

    // Release escrow to walker
    await base44.entities.WalletTransaction.create({
      user_email: user.email,
      transaction_type: 'escrow_released',
      amount: TOKEN_VALUE,
      description: `€${TOKEN_VALUE} liberados para prestador de serviço`,
      related_booking_id: booking_id,
      balance_after: (wallet.escrow_balance || 0) - TOKEN_VALUE
    });

    // TODO: In production, trigger Stripe transfer to walker's connected account
    // This would use stripe.transfers.create() with the walker's Stripe account ID

    return Response.json({ 
      success: true,
      tokens_remaining: wallet.service_tokens - 1,
      amount_released: TOKEN_VALUE,
      message: `Token usado com sucesso. €${TOKEN_VALUE} serão transferidos ao prestador.`
    });

  } catch (error) {
    console.error('Use token error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});