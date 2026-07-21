import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount, iban } = await req.json();
    const numAmount = Number(amount);

    if (!numAmount || numAmount < 0.5) {
      return Response.json({ error: 'Montante mínimo: €0.50' }, { status: 400 });
    }
    if (!iban || iban.trim().length < 15) {
      return Response.json({ error: 'IBAN inválido' }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    // Fetch wallet
    const wallets = await sr.entities.UserWallet.filter({ user_email: user.email });
    let wallet = wallets[0];
    if (!wallet) {
      return Response.json({ error: 'Carteira não encontrada' }, { status: 404 });
    }

    // Available = released balance + pending walker payments (held by platform)
    const available = (wallet.available_balance || 0) + (wallet.pending_walker_payments || 0);
    if (numAmount > available) {
      return Response.json({ error: 'Saldo insuficiente' }, { status: 400 });
    }

    // Deduct from available_balance first, then pending_walker_payments
    const deductFromAvailable = Math.min(numAmount, wallet.available_balance || 0);
    const deductFromPending = numAmount - deductFromAvailable;
    const newAvailable = (wallet.available_balance || 0) - deductFromAvailable;
    const newPending = (wallet.pending_walker_payments || 0) - deductFromPending;

    // Create the withdrawal request FIRST (so we have the ID for the transaction)
    const withdrawal = await sr.entities.IbanWithdrawalRequest.create({
      user_email: user.email,
      iban: iban.trim(),
      amount: numAmount,
      status: 'pending'
    });

    // Deduct the reserved amount from the wallet
    await sr.entities.UserWallet.update(wallet.id, {
      available_balance: newAvailable,
      pending_walker_payments: newPending
    });

    // Record the reservation transaction
    await sr.entities.WalletTransaction.create({
      user_email: user.email,
      transaction_type: 'withdrawal_reserved',
      amount: numAmount,
      description: `Saque solicitado — IBAN ${iban.trim().slice(0, 8)}...`,
      related_payout_id: withdrawal.id,
      balance_after: newAvailable
    });

    return Response.json({
      success: true,
      withdrawal_id: withdrawal.id,
      new_available: newAvailable + newPending
    });
  } catch (error) {
    console.error('requestWalletWithdrawal error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});