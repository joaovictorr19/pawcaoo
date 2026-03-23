import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * LÓGICA FINANCEIRA PAWCÃO - PROCESSAMENTO DE SUBSCRIÇÃO
 * 
 * Ao receber pagamento de subscrição:
 * 1. Separa imediatamente o custo dos passeios (€12-15/cada) no COFRE DE RESERVA (Escrow)
 * 2. Credita tokens ao utilizador
 * 3. Regista a receita bruta e margem esperada
 */

const PLANS = {
  BASIC: {
    price: 19.99,
    tokens: 1,
    walker_cost_per_token: 12, // Custo para pagar ao walker
    cashback_rate: 0.05,
    points_multiplier: 1.5,
    margin_analysis: {
      gross: 19.99,
      walker_cost: 12,
      expected_profit: 7.99 // Sem breakage
    }
  },
  PREMIUM: {
    price: 44.99,
    tokens: 2,
    walker_cost_per_token: 15, // Walker recebe mais no premium
    cashback_rate: 0.10,
    points_multiplier: 2,
    margin_analysis: {
      gross: 44.99,
      walker_cost: 30, // 2 x 15
      expected_profit: 14.99
    }
  },
  VIP: {
    price: 79.99,
    tokens: 3,
    walker_cost_per_token: 15,
    cashback_rate: 0.15,
    points_multiplier: 3,
    grooming_cost: 10, // Custo estimado banho parceiro
    margin_analysis: {
      gross: 79.99,
      walker_cost: 45, // 3 x 15
      grooming_cost: 10,
      expected_profit: 24.99
    }
  }
};

// Restrições de uso de tokens (protege margem)
const TOKEN_RESTRICTIONS = {
  allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], // Dias úteis apenas
  allowed_hours: { start: 9, end: 18 }, // 9h-18h
  weekend_surcharge: 5, // Cliente paga €5 extra para usar token no fim-de-semana
  evening_surcharge: 3  // Cliente paga €3 extra para horário noturno (após 18h)
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { 
      user_email, 
      plan_type, 
      stripe_subscription_id,
      is_renewal = false 
    } = await req.json();

    if (!user_email || !plan_type || !PLANS[plan_type]) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const plan = PLANS[plan_type];
    const now = new Date();
    const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const periodMonth = now.toISOString().slice(0, 7); // YYYY-MM

    // === 1. COFRE DE RESERVA (ESCROW) ===
    // Separar imediatamente o custo dos passeios
    const escrowAmount = plan.tokens * plan.walker_cost_per_token;
    
    // Get or create wallet
    const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email });
    let wallet;
    
    const walletData = {
      user_email,
      service_tokens: plan.tokens,
      escrow_balance: escrowAmount,
      tokens_used_this_month: 0,
      pending_walker_payments: 0,
      tokens_expiry_date: cycleEnd.toISOString().split('T')[0],
      cycle_start_date: now.toISOString().split('T')[0],
      last_renewal_date: now.toISOString().split('T')[0]
    };

    if (wallets.length > 0) {
      wallet = wallets[0];
      
      // Se é renovação, processar breakage dos tokens não usados
      if (is_renewal && wallet.service_tokens > 0 && wallet.escrow_balance > 0) {
        const unusedTokens = wallet.service_tokens;
        const breakageAmount = wallet.escrow_balance;
        
        // Registar breakage como lucro
        await base44.asServiceRole.entities.PlatformRevenue.create({
          revenue_type: 'breakage',
          source_id: wallet.id,
          user_email,
          gross_amount: breakageAmount,
          cost_amount: 0,
          net_profit: breakageAmount,
          description: `Breakage: ${unusedTokens} token(s) não utilizados do ciclo anterior`,
          plan_type,
          period_month: periodMonth
        });

        // Registar na wallet
        await base44.asServiceRole.entities.WalletTransaction.create({
          user_email,
          transaction_type: 'token_expired',
          amount: breakageAmount,
          tokens_amount: unusedTokens,
          description: `${unusedTokens} token(s) expiraram - €${breakageAmount} convertido em receita da plataforma`,
          balance_after: 0
        });

        // Atualizar total de breakage gerado
        walletData.total_breakage_generated = (wallet.total_breakage_generated || 0) + breakageAmount;
      }

      await base44.asServiceRole.entities.UserWallet.update(wallet.id, walletData);
    } else {
      walletData.cashback_balance = 0;
      walletData.total_points = 0;
      walletData.total_breakage_generated = 0;
      wallet = await base44.asServiceRole.entities.UserWallet.create(walletData);
    }

    // === 2. REGISTAR TRANSAÇÕES ===
    // Tokens creditados
    await base44.asServiceRole.entities.WalletTransaction.create({
      user_email,
      transaction_type: 'token_credited',
      amount: escrowAmount,
      tokens_amount: plan.tokens,
      description: `${plan.tokens} passeio(s) grátis creditados (Plano ${plan_type})`,
      balance_after: plan.tokens
    });

    // Escrow reservado
    await base44.asServiceRole.entities.WalletTransaction.create({
      user_email,
      transaction_type: 'escrow_reserved',
      amount: escrowAmount,
      description: `€${escrowAmount} reservados no Cofre para pagamento a Dog Walkers`,
      balance_after: escrowAmount
    });

    // === 3. REGISTAR RECEITA ===
    const expectedProfit = plan.price - escrowAmount - (plan.grooming_cost || 0);
    
    await base44.asServiceRole.entities.PlatformRevenue.create({
      revenue_type: 'subscription',
      source_id: stripe_subscription_id,
      user_email,
      gross_amount: plan.price,
      cost_amount: escrowAmount + (plan.grooming_cost || 0),
      net_profit: expectedProfit,
      description: `Subscrição ${plan_type} - Margem garantida: €${expectedProfit.toFixed(2)} (potencial breakage adicional)`,
      plan_type,
      period_month: periodMonth
    });

    // === 4. ATUALIZAR/CRIAR MEMBERSHIP ===
    const memberships = await base44.asServiceRole.entities.MembershipPlan.filter({ user_email });
    
    const membershipData = {
      user_email,
      plan_type,
      monthly_price: plan.price,
      cashback_rate: plan.cashback_rate,
      points_multiplier: plan.points_multiplier,
      monthly_tokens: plan.tokens,
      token_value: plan.walker_cost_per_token,
      status: 'active',
      current_period_start: now.toISOString().split('T')[0],
      current_period_end: cycleEnd.toISOString().split('T')[0],
      stripe_subscription_id
    };

    if (memberships.length > 0) {
      await base44.asServiceRole.entities.MembershipPlan.update(memberships[0].id, membershipData);
    } else {
      await base44.asServiceRole.entities.MembershipPlan.create(membershipData);
    }

    return Response.json({
      success: true,
      tokens_credited: plan.tokens,
      escrow_reserved: escrowAmount,
      tokens_expiry: cycleEnd.toISOString().split('T')[0],
      expected_margin: expectedProfit,
      token_restrictions: TOKEN_RESTRICTIONS,
      message: `Subscrição ${plan_type} ativada! ${plan.tokens} passeio(s) grátis disponíveis até ${cycleEnd.toLocaleDateString('pt-PT')}`
    });

  } catch (error) {
    console.error('Process subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});