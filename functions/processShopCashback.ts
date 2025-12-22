import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * LÓGICA FINANCEIRA PAWCÃO - CASHBACK DA LOJA
 * 
 * Quando cliente compra na loja PawCão:
 * 1. Calcula cashback baseado no plano (5%, 10% ou 15%)
 * 2. Credita na Wallet como CRÉDITO INTERNO (não sacável)
 * 3. Calcula pontos com multiplicador do plano
 * 4. O crédito SÓ pode ser usado dentro da loja PawCão
 * 
 * IMPORTANTE: Cashback = Dinheiro que volta para o nosso ecossistema
 */

const CASHBACK_RATES = {
  FREE: 0,
  BASIC: 0.05,   // 5%
  PREMIUM: 0.10, // 10%
  VIP: 0.15      // 15%
};

const POINTS_MULTIPLIERS = {
  FREE: 1,
  BASIC: 1.5,
  PREMIUM: 2,
  VIP: 3
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      purchase_amount,
      order_id,
      product_names,
      partner_id,
      apply_wallet_credit = false,
      wallet_credit_amount = 0
    } = await req.json();

    if (!purchase_amount || purchase_amount <= 0) {
      return Response.json({ error: 'Invalid purchase amount' }, { status: 400 });
    }

    // === 1. BUSCAR PLANO DO UTILIZADOR ===
    const memberships = await base44.entities.MembershipPlan.filter({ 
      user_email: user.email,
      status: 'active'
    });

    const planType = memberships.length > 0 ? memberships[0].plan_type : 'FREE';
    const cashbackRate = CASHBACK_RATES[planType] || 0;
    const pointsMultiplier = POINTS_MULTIPLIERS[planType] || 1;

    // === 2. BUSCAR OU CRIAR WALLET ===
    const wallets = await base44.entities.UserWallet.filter({ user_email: user.email });
    let wallet;

    if (wallets.length > 0) {
      wallet = wallets[0];
    } else {
      wallet = await base44.entities.UserWallet.create({
        user_email: user.email,
        cashback_balance: 0,
        total_points: 0,
        service_tokens: 0,
        escrow_balance: 0
      });
    }

    // === 3. APLICAR CRÉDITO DA WALLET (SE SOLICITADO) ===
    let finalPurchaseAmount = purchase_amount;
    let creditUsed = 0;

    if (apply_wallet_credit && wallet.cashback_balance > 0) {
      // Usar até o saldo disponível ou o valor solicitado
      creditUsed = Math.min(wallet.cashback_balance, wallet_credit_amount || wallet.cashback_balance, purchase_amount);
      finalPurchaseAmount = purchase_amount - creditUsed;

      // Registar uso do crédito
      await base44.entities.WalletTransaction.create({
        user_email: user.email,
        transaction_type: 'cashback_used',
        amount: creditUsed,
        description: `Crédito utilizado na compra: ${product_names || 'Loja PawCão'}`,
        related_order_id: order_id,
        balance_after: wallet.cashback_balance - creditUsed
      });
    }

    // === 4. CALCULAR CASHBACK (sobre valor pago, não crédito) ===
    const cashbackEarned = finalPurchaseAmount * cashbackRate;
    
    // === 5. CALCULAR PONTOS ===
    const pointsEarned = Math.floor(purchase_amount * pointsMultiplier);

    // === 6. ATUALIZAR WALLET ===
    const newCashbackBalance = wallet.cashback_balance - creditUsed + cashbackEarned;
    const newPointsBalance = (wallet.total_points || 0) + pointsEarned;

    await base44.entities.UserWallet.update(wallet.id, {
      cashback_balance: newCashbackBalance,
      total_points: newPointsBalance
    });

    // === 7. REGISTAR TRANSAÇÕES ===
    if (cashbackEarned > 0) {
      await base44.entities.WalletTransaction.create({
        user_email: user.email,
        transaction_type: 'cashback_earned',
        amount: cashbackEarned,
        description: `${(cashbackRate * 100).toFixed(0)}% cashback de €${finalPurchaseAmount.toFixed(2)} (Plano ${planType})`,
        related_order_id: order_id,
        balance_after: newCashbackBalance
      });
    }

    if (pointsEarned > 0) {
      await base44.entities.WalletTransaction.create({
        user_email: user.email,
        transaction_type: 'points_earned',
        amount: 0,
        points_amount: pointsEarned,
        description: `${pointsEarned} pontos ganhos (${pointsMultiplier}x - Plano ${planType})`,
        related_order_id: order_id,
        balance_after: newPointsBalance
      });
    }

    // === 8. REGISTAR RECEITA DA LOJA (CONSIDERANDO TAXA DO PARCEIRO) ===
    const periodMonth = new Date().toISOString().slice(0, 7);
    
    // Configuração de taxa do parceiro
    let partnerFee = 0;
    let partnerPayout = purchase_amount;
    
    if (partner_id) {
      const partners = await base44.asServiceRole.entities.Partnership.filter({ id: partner_id });
      if (partners.length > 0) {
        const partner = partners[0];
        
        // Verificar isenção
        const isExemptExpired = partner.fee_exemption_end_date && new Date(partner.fee_exemption_end_date) < new Date();
        const isExempt = partner.is_fee_exempt && !isExemptExpired;
        
        if (!isExempt) {
          const feePercentage = partner.custom_fee_percentage || 15;
          partnerFee = purchase_amount * (feePercentage / 100);
          partnerPayout = purchase_amount - partnerFee;
        }
        
        // Atualizar estatísticas do parceiro
        await base44.asServiceRole.entities.Partnership.update(partner.id, {
          total_sales: (partner.total_sales || 0) + 1,
          total_revenue: (partner.total_revenue || 0) + partnerPayout
        });
      }
    }
    
    await base44.asServiceRole.entities.PlatformRevenue.create({
      revenue_type: 'shop_margin',
      source_id: order_id,
      user_email: user.email,
      gross_amount: purchase_amount,
      cost_amount: cashbackEarned + partnerPayout, // Cashback + payout ao parceiro
      net_profit: partnerFee - cashbackEarned, // Comissão PawCão - Cashback dado
      description: `Venda: €${purchase_amount} | Taxa: €${partnerFee.toFixed(2)} | Cashback: €${cashbackEarned.toFixed(2)}`,
      plan_type: planType,
      period_month: periodMonth
    });

    return Response.json({
      success: true,
      order_summary: {
        original_amount: purchase_amount,
        credit_applied: creditUsed,
        amount_paid: finalPurchaseAmount,
        cashback_earned: cashbackEarned,
        points_earned: pointsEarned
      },
      wallet_balance: {
        cashback: newCashbackBalance,
        points: newPointsBalance
      },
      plan_type: planType,
      message: creditUsed > 0 
        ? `Compra concluída! Usou €${creditUsed.toFixed(2)} de crédito e ganhou €${cashbackEarned.toFixed(2)} de cashback + ${pointsEarned} pontos.`
        : `Compra concluída! Ganhou €${cashbackEarned.toFixed(2)} de cashback + ${pointsEarned} pontos (use na próxima compra).`
    });

  } catch (error) {
    console.error('Process cashback error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});