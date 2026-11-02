import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id } = await req.json().catch(() => ({}));

    if (!order_id) {
      return Response.json({ error: 'order_id is required' }, { status: 400 });
    }

    // SECURITY: o valor da compra é lido da encomenda registada no servidor — nunca do pedido.
    const orders = await base44.asServiceRole.entities.ProductOrder.filter({ id: order_id });
    const order = orders[0] || null;

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.customer_email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (order.payment_status !== 'paid') {
      return Response.json({ error: 'Order is not paid' }, { status: 400 });
    }

    const purchase_amount = Number(order.total_amount || 0);
    if (!(purchase_amount > 0)) {
      return Response.json({ error: 'Invalid purchase amount' }, { status: 400 });
    }

    // Idempotência: uma única atribuição de cashback/pontos por encomenda.
    const alreadyCredited = await base44.asServiceRole.entities.WalletTransaction.filter({
      user_email: user.email,
      related_order_id: order_id,
      transaction_type: 'cashback_earned'
    });
    if (alreadyCredited.length > 0) {
      return Response.json({ success: true, already_processed: true, order_id });
    }

    // Get user's membership plan
    const memberships = await base44.entities.MembershipPlan.filter({ 
      user_email: user.email,
      status: 'active'
    });

    let cashbackRate = 0;
    let pointsMultiplier = 1;
    let planType = 'FREE';

    if (memberships.length > 0) {
      const plan = memberships[0];
      cashbackRate = plan.cashback_rate || 0;
      pointsMultiplier = plan.points_multiplier || 1;
      planType = plan.plan_type;
    }

    const cashbackEarned = purchase_amount * cashbackRate;
    const pointsEarned = Math.floor(purchase_amount * pointsMultiplier);

    // Get or create wallet
    const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
    let wallet;

    if (wallets.length > 0) {
      wallet = wallets[0];
      await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
        cashback_balance: (wallet.cashback_balance || 0) + cashbackEarned,
        total_points: (wallet.total_points || 0) + pointsEarned
      });
    } else {
      wallet = await base44.asServiceRole.entities.UserWallet.create({
        user_email: user.email,
        cashback_balance: cashbackEarned,
        total_points: pointsEarned,
        service_tokens: 0,
        escrow_balance: 0
      });
    }

    // Record cashback transaction
    if (cashbackEarned > 0) {
      await base44.asServiceRole.entities.WalletTransaction.create({
        user_email: user.email,
        transaction_type: 'cashback_earned',
        amount: cashbackEarned,
        description: `${(cashbackRate * 100).toFixed(0)}% cashback de compra €${purchase_amount.toFixed(2)}`,
        related_order_id: order_id,
        balance_after: (wallet.cashback_balance || 0) + cashbackEarned
      });
    }

    // Record points transaction
    if (pointsEarned > 0) {
      await base44.asServiceRole.entities.WalletTransaction.create({
        user_email: user.email,
        transaction_type: 'points_earned',
        amount: 0,
        points_amount: pointsEarned,
        description: `${pointsEarned} pontos (${pointsMultiplier}x multiplicador ${planType})`,
        related_order_id: order_id,
        balance_after: (wallet.total_points || 0) + pointsEarned
      });
    }

    return Response.json({
      success: true,
      cashback_earned: cashbackEarned,
      points_earned: pointsEarned,
      new_cashback_balance: (wallet.cashback_balance || 0) + cashbackEarned,
      new_points_balance: (wallet.total_points || 0) + pointsEarned,
      plan_type: planType
    });

  } catch (error) {
    console.error('Process cashback error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}