import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { withdrawal_id, action, notes } = await req.json();
    if (!withdrawal_id) return Response.json({ error: 'withdrawal_id obrigatório' }, { status: 400 });
    if (!['approve', 'reject', 'pay'].includes(action)) {
      return Response.json({ error: 'Ação inválida (approve, reject, pay)' }, { status: 400 });
    }

    const sr = base44.asServiceRole;

    const withdrawals = await sr.entities.IbanWithdrawalRequest.filter({ id: withdrawal_id });
    if (!withdrawals || withdrawals.length === 0) {
      return Response.json({ error: 'Saque não encontrado' }, { status: 404 });
    }

    const withdrawal = withdrawals[0];
    if (withdrawal.status !== 'pending' && withdrawal.status !== 'approved') {
      return Response.json({ error: 'Saque já processado' }, { status: 400 });
    }

    if (action === 'reject') {
      // Return the reserved funds to the user's wallet
      await sr.entities.IbanWithdrawalRequest.update(withdrawal_id, {
        status: 'rejected',
        notes: notes || 'Rejeitado pelo admin'
      });

      const wallets = await sr.entities.UserWallet.filter({ user_email: withdrawal.user_email });
      if (wallets[0]) {
        const w = wallets[0];
        const refundedAvailable = (w.available_balance || 0) + withdrawal.amount;
        await sr.entities.UserWallet.update(w.id, {
          available_balance: refundedAvailable
        });

        await sr.entities.WalletTransaction.create({
          user_email: withdrawal.user_email,
          transaction_type: 'withdrawal_refunded',
          amount: withdrawal.amount,
          description: `Saque rejeitado — valor devolvido à carteira`,
          related_payout_id: withdrawal_id,
          balance_after: refundedAvailable
        });
      }

      await sr.entities.Notification.create({
        recipient_email: withdrawal.user_email,
        title: 'Saque Rejeitado',
        message: `O seu pedido de saque de €${withdrawal.amount.toFixed(2)} foi rejeitado. O valor foi devolvido à sua carteira.`,
        type: 'payment',
        related_id: withdrawal_id
      });

    } else if (action === 'approve') {
      await sr.entities.IbanWithdrawalRequest.update(withdrawal_id, {
        status: 'approved',
        notes: notes || 'Aprovado pelo admin'
      });

      await sr.entities.Notification.create({
        recipient_email: withdrawal.user_email,
        title: 'Saque Aprovado',
        message: `O seu pedido de saque de €${withdrawal.amount.toFixed(2)} foi aprovado. O pagamento será processado em breve.`,
        type: 'payment',
        related_id: withdrawal_id
      });

    } else if (action === 'pay') {
      await sr.entities.IbanWithdrawalRequest.update(withdrawal_id, {
        status: 'paid',
        notes: notes || 'Pago pelo admin'
      });

      await sr.entities.Notification.create({
        recipient_email: withdrawal.user_email,
        title: '💸 Saque Processado',
        message: `O seu saque de €${withdrawal.amount.toFixed(2)} foi processado com sucesso para o IBAN ${withdrawal.iban?.slice(0, 8)}...`,
        type: 'payment',
        related_id: withdrawal_id
      });
    }

    return Response.json({ success: true, action, withdrawal_id, new_status: action === 'pay' ? 'paid' : action === 'approve' ? 'approved' : 'rejected' });
  } catch (error) {
    console.error('processWithdrawalRequest error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});