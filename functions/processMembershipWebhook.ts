import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

// Plan configurations
const PLANS = {
  BASIC: {
    monthly_price: 19.99,
    cashback_rate: 0.05,
    points_multiplier: 1.5,
    monthly_tokens: 1,
    free_cancellations: 2,
    refund_rate: 0.80,
    includes_insurance: false,
    includes_grooming: false,
    vip_walkers_access: false
  },
  PREMIUM: {
    monthly_price: 44.99,
    cashback_rate: 0.10,
    points_multiplier: 2,
    monthly_tokens: 2,
    free_cancellations: 5,
    refund_rate: 1.00,
    includes_insurance: true,
    includes_grooming: false,
    vip_walkers_access: false
  },
  VIP: {
    monthly_price: 79.99,
    cashback_rate: 0.15,
    points_multiplier: 3,
    monthly_tokens: 3,
    free_cancellations: -1,
    refund_rate: 1.00,
    includes_insurance: true,
    includes_grooming: true,
    vip_walkers_access: true
  }
};

const TOKEN_ESCROW_VALUE = 12; // €12 per token

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
              free_cancellations: plan.free_cancellations,
              refund_rate: plan.refund_rate,
              includes_insurance: plan.includes_insurance,
              includes_grooming: plan.includes_grooming,
              vip_walkers_access: plan.vip_walkers_access,
              stripe_subscription_id: session.subscription,
              stripe_customer_id: session.customer,
              status: 'active',
              current_period_start: new Date().toISOString().split('T')[0],
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              cancellations_used: 0
            };
            
            if (existingPlans.length > 0) {
              await base44.asServiceRole.entities.MembershipPlan.update(existingPlans[0].id, planData);
            } else {
              await base44.asServiceRole.entities.MembershipPlan.create(planData);
            }
            
            // Credit tokens to wallet
            await creditTokensToWallet(base44, userEmail, plan.monthly_tokens);
            
            console.log(`Membership activated for ${userEmail}: ${planType}`);
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

async function creditTokensToWallet(base44, userEmail, tokensAmount) {
  const escrowAmount = tokensAmount * TOKEN_ESCROW_VALUE;
  
  // Get or create wallet
  const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: userEmail });
  let wallet;
  
  const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  if (wallets.length > 0) {
    wallet = wallets[0];
    await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
      service_tokens: (wallet.service_tokens || 0) + tokensAmount,
      escrow_balance: (wallet.escrow_balance || 0) + escrowAmount,
      tokens_used_this_month: 0,
      tokens_expiry_date: expiryDate,
      last_renewal_date: new Date().toISOString().split('T')[0]
    });
  } else {
    wallet = await base44.asServiceRole.entities.UserWallet.create({
      user_email: userEmail,
      service_tokens: tokensAmount,
      escrow_balance: escrowAmount,
      tokens_used_this_month: 0,
      cashback_balance: 0,
      total_points: 0,
      tokens_expiry_date: expiryDate,
      last_renewal_date: new Date().toISOString().split('T')[0]
    });
  }
  
  // Record transaction
  await base44.asServiceRole.entities.WalletTransaction.create({
    user_email: userEmail,
    transaction_type: 'token_credited',
    amount: escrowAmount,
    tokens_amount: tokensAmount,
    description: `${tokensAmount} token(s) de serviço creditados (renovação mensal)`,
    balance_after: (wallet.service_tokens || 0) + tokensAmount
  });
  
  await base44.asServiceRole.entities.WalletTransaction.create({
    user_email: userEmail,
    transaction_type: 'escrow_reserved',
    amount: escrowAmount,
    description: `€${escrowAmount} reservados para ${tokensAmount} token(s)`,
    balance_after: (wallet.escrow_balance || 0) + escrowAmount
  });
}