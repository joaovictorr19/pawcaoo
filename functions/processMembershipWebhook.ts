import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// Plan configurations with margin analysis
const PLANS = {
  BASIC: {
    monthly_price: 19.99,
    cashback_rate: 0.05,
    points_multiplier: 1.5,
    monthly_tokens: 1,
    token_value: 12, // Walker receives €12
    free_cancellations: 2,
    refund_rate: 0.80,
    includes_insurance: false,
    includes_grooming: false,
    vip_walkers_access: false,
    // Margin: €19.99 - €12 = €7.99 (+ breakage potential)
  },
  PREMIUM: {
    monthly_price: 44.99,
    cashback_rate: 0.10,
    points_multiplier: 2,
    monthly_tokens: 2,
    token_value: 15, // Walker receives €15 (premium)
    free_cancellations: 5,
    refund_rate: 1.00,
    includes_insurance: true,
    includes_grooming: false,
    vip_walkers_access: false,
    // Margin: €44.99 - €30 = €14.99 (+ breakage potential)
  },
  VIP: {
    monthly_price: 79.99,
    cashback_rate: 0.15,
    points_multiplier: 3,
    monthly_tokens: 3,
    token_value: 15, // Walker receives €15
    grooming_cost: 10, // Partner grooming cost
    free_cancellations: -1,
    refund_rate: 1.00,
    includes_insurance: true,
    includes_grooming: true,
    vip_walkers_access: true,
    // Margin: €79.99 - €45 - €10 = €24.99 (+ breakage potential)
  }
};

// Token restrictions (weekdays 9h-18h for free, surcharges for off-peak)
const TOKEN_RESTRICTIONS = {
  weekdays_only: true,
  allowed_hours_start: 9,
  allowed_hours_end: 18,
  weekend_surcharge: 5,
  evening_surcharge: 3
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.mode === 'subscription') {
          const userEmail = session.metadata?.user_email;
          const planType = session.metadata?.plan_type;
          
          if (userEmail && planType && PLANS[planType]) {
            const plan = PLANS[planType];
            const now = new Date();
            const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const periodMonth = now.toISOString().slice(0, 7);
            
            // Create or update membership plan
            const existingPlans = await base44.asServiceRole.entities.MembershipPlan.filter({ 
              user_email: userEmail 
            });
            
            const planData = {
              user_email: userEmail,
              plan_type: planType,
              monthly_price: plan.monthly_price,
              cashback_rate: plan.cashback_rate,
              points_multiplier: plan.points_multiplier,
              monthly_tokens: plan.monthly_tokens,
              token_value: plan.token_value,
              free_cancellations: plan.free_cancellations,
              refund_rate: plan.refund_rate,
              includes_insurance: plan.includes_insurance,
              includes_grooming: plan.includes_grooming,
              vip_walkers_access: plan.vip_walkers_access,
              token_restrictions: TOKEN_RESTRICTIONS,
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              status: 'active',
              current_period_start: now.toISOString().split('T')[0],
              current_period_end: cycleEnd.toISOString().split('T')[0],
              cancellations_used: 0
            };
            
            if (existingPlans.length > 0) {
              await base44.asServiceRole.entities.MembershipPlan.update(existingPlans[0].id, planData);
            } else {
              await base44.asServiceRole.entities.MembershipPlan.create(planData);
            }
            
            // Credit tokens to wallet with escrow
            await creditTokensToWallet(base44, userEmail, plan.monthly_tokens, plan.token_value, cycleEnd);
            
            // Register platform revenue
            const escrowAmount = plan.monthly_tokens * plan.token_value;
            const groomingCost = plan.grooming_cost || 0;
            const expectedProfit = plan.monthly_price - escrowAmount - groomingCost;
            
            await base44.asServiceRole.entities.PlatformRevenue.create({
              revenue_type: 'subscription',
              source_id: session.subscription,
              user_email: userEmail,
              gross_amount: plan.monthly_price,
              cost_amount: escrowAmount + groomingCost,
              net_profit: expectedProfit,
              description: `Nova subscrição ${planType} - Margem: €${expectedProfit.toFixed(2)} (+ breakage potencial)`,
              plan_type: planType,
              period_month: periodMonth
            });
            
            console.log(`✅ Membership activated for ${userEmail}: ${planType} - Escrow: €${escrowAmount}`);
          }
        }
        break;
      }
      
      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          // Find membership by subscription ID
          const memberships = await base44.asServiceRole.entities.MembershipPlan.filter({
            stripe_subscription_id: subscriptionId
          });
          
          if (memberships.length > 0) {
            const membership = memberships[0];
            const plan = PLANS[membership.plan_type];
            
            if (plan) {
              // Renewal - credit new tokens
              await creditTokensToWallet(base44, membership.user_email, plan.monthly_tokens);
              
              // Reset cancellations used
              await base44.asServiceRole.entities.MembershipPlan.update(membership.id, {
                current_period_start: new Date().toISOString().split('T')[0],
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                cancellations_used: 0
              });
              
              console.log(`Membership renewed for ${membership.user_email}`);
            }
          }
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        const memberships = await base44.asServiceRole.entities.MembershipPlan.filter({
          stripe_subscription_id: subscription.id
        });
        
        if (memberships.length > 0) {
          await base44.asServiceRole.entities.MembershipPlan.update(memberships[0].id, {
            status: 'cancelled',
            plan_type: 'FREE'
          });
          console.log(`Membership cancelled for ${memberships[0].user_email}`);
        }
        break;
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function creditTokensToWallet(base44, userEmail, tokensAmount, tokenValue, cycleEnd) {
  const escrowAmount = tokensAmount * tokenValue;
  const now = new Date();
  const expiryDate = cycleEnd.toISOString().split('T')[0];
  
  // Get or create wallet
  const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: userEmail });
  let wallet;
  let breakageProcessed = 0;
  
  if (wallets.length > 0) {
    wallet = wallets[0];
    
    // Process breakage from previous cycle if tokens expired
    if (wallet.service_tokens > 0 && wallet.escrow_balance > 0) {
      breakageProcessed = wallet.escrow_balance;
      const expiredTokens = wallet.service_tokens;
      
      // Record breakage as platform profit
      await base44.asServiceRole.entities.PlatformRevenue.create({
        revenue_type: 'breakage',
        source_id: wallet.id,
        user_email: userEmail,
        gross_amount: breakageProcessed,
        cost_amount: 0,
        net_profit: breakageProcessed,
        description: `BREAKAGE: ${expiredTokens} token(s) não utilizados = €${breakageProcessed} lucro extra`,
        period_month: now.toISOString().slice(0, 7)
      });
      
      await base44.asServiceRole.entities.WalletTransaction.create({
        user_email: userEmail,
        transaction_type: 'token_expired',
        amount: breakageProcessed,
        tokens_amount: expiredTokens,
        description: `${expiredTokens} passeio(s) expiraram - Ciclo anterior`,
        balance_after: 0
      });
      
      console.log(`💰 Breakage: ${userEmail} - ${expiredTokens} tokens = €${breakageProcessed}`);
    }
    
    await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
      service_tokens: tokensAmount,
      escrow_balance: escrowAmount,
      tokens_used_this_month: 0,
      pending_walker_payments: 0,
      tokens_expiry_date: expiryDate,
      cycle_start_date: now.toISOString().split('T')[0],
      last_renewal_date: now.toISOString().split('T')[0],
      total_breakage_generated: (wallet.total_breakage_generated || 0) + breakageProcessed
    });
  } else {
    wallet = await base44.asServiceRole.entities.UserWallet.create({
      user_email: userEmail,
      service_tokens: tokensAmount,
      escrow_balance: escrowAmount,
      tokens_used_this_month: 0,
      pending_walker_payments: 0,
      cashback_balance: 0,
      total_points: 0,
      tokens_expiry_date: expiryDate,
      cycle_start_date: now.toISOString().split('T')[0],
      last_renewal_date: now.toISOString().split('T')[0],
      total_breakage_generated: 0
    });
  }
  
  // Record new tokens credited
  await base44.asServiceRole.entities.WalletTransaction.create({
    user_email: userEmail,
    transaction_type: 'token_credited',
    amount: escrowAmount,
    tokens_amount: tokensAmount,
    description: `${tokensAmount} passeio(s) grátis creditados - Válidos até ${expiryDate}`,
    balance_after: tokensAmount
  });
  
  await base44.asServiceRole.entities.WalletTransaction.create({
    user_email: userEmail,
    transaction_type: 'escrow_reserved',
    amount: escrowAmount,
    description: `€${escrowAmount} reservados no Cofre para pagamento a Dog Walkers`,
    balance_after: escrowAmount
  });
  
  // Notify user
  await base44.asServiceRole.entities.Notification.create({
    recipient_email: userEmail,
    title: '🎉 Tokens Creditados!',
    message: `${tokensAmount} passeio(s) grátis disponíveis! Use até ${expiryDate} em dias úteis (9h-18h). Fins-de-semana +€5.`,
    type: 'system',
    priority: 'normal'
  });
}