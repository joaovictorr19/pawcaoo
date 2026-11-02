/**
 * applyWalletPayment
 * Deduz saldo da carteira do cliente (cashback_balance) para pagar um serviço.
 * O saldo da carteira vem de carregamentos (top-ups) e cashback ganho.
 *
 * @param base44 - instância do SDK (com asServiceRole)
 * @param userEmail - email do cliente
 * @param amountToPay - valor total a pagar (em euros)
 * @param opts.description - descrição da transação
 * @param opts.relatedBookingId - ID da reserva relacionada
 * @returns { walletUsed, remainingAmount, walletTxId }
 *   walletUsed = valor debitado da carteira (0 se nada aplicado)
 *   remainingAmount = valor que ainda precisa de ser cobrado (Stripe)
 *   walletTxId = ID da WalletTransaction criada (ou null)
 *
 * Nota: usa asServiceRole para contornar RLS — a função é chamada pelo backend
 * em nome do cliente autenticado, após validação de propriedade.
 */
export async function applyWalletPayment(
  base44: any,
  userEmail: string,
  amountToPay: number,
  opts: { description?: string; relatedBookingId?: string; currency?: string } = {}
): Promise<{ walletUsed: number; remainingAmount: number; walletTxId: string | null }> {
  const { description = 'Pagamento com carteira', relatedBookingId, currency = 'EUR' } = opts;
  const safeAmount = Math.round((amountToPay || 0) * 100) / 100;
  // Saldos separados por moeda: um saldo em BRL nunca paga uma compra em EUR (e vice-versa)
  const balanceField = currency === 'BRL' ? 'cashback_balance_brl' : 'cashback_balance';

  if (!userEmail || safeAmount <= 0) {
    return { walletUsed: 0, remainingAmount: safeAmount, walletTxId: null };
  }

  try {
    const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: userEmail });
    const wallet = wallets[0];
    const balance = Number(wallet?.[balanceField]) || 0;
    if (!wallet || balance <= 0) {
      return { walletUsed: 0, remainingAmount: safeAmount, walletTxId: null };
    }

    const walletUsed = Math.round(Math.min(balance, safeAmount) * 100) / 100;
    if (walletUsed <= 0) {
      return { walletUsed: 0, remainingAmount: safeAmount, walletTxId: null };
    }

    const newBalance = Math.round((balance - walletUsed) * 100) / 100;
    await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
      [balanceField]: newBalance,
    });

    let walletTxId: string | null = null;
    try {
      const tx = await base44.asServiceRole.entities.WalletTransaction.create({
        user_email: userEmail,
        transaction_type: 'cashback_used',
        amount: walletUsed,
        description,
        related_booking_id: relatedBookingId || undefined,
        balance_after: newBalance,
      });
      walletTxId = tx.id || null;
    } catch (e) {
      console.error('WalletTransaction create error (cashback_used):', e?.message || e);
    }

    return {
      walletUsed,
      remainingAmount: Math.round((safeAmount - walletUsed) * 100) / 100,
      walletTxId,
    };
  } catch (e) {
    console.error('applyWalletPayment error:', e?.message || e);
    return { walletUsed: 0, remainingAmount: safeAmount, walletTxId: null };
  }
}

/**
 * getWalletBalance - lê o saldo cashback disponível do cliente.
 */
export async function getWalletBalance(base44: any, userEmail: string): Promise<number> {
  if (!userEmail) return 0;
  try {
    const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: userEmail });
    const wallet = wallets[0];
    return Math.round((wallet?.cashback_balance || 0) * 100) / 100;
  } catch {
    return 0;
  }
}