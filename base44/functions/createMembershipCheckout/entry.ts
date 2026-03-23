import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

// Plan configurations
const PLANS = {
  BASIC: {
    price: 1999, // €19.99 in cents
    name: 'PawCão Basic',
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
    price: 4499, // €44.99 in cents
    name: 'PawCão Premium',
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
    price: 7999, // €79.99 in cents
    name: 'PawCão VIP',
    cashback_rate: 0.15,
    points_multiplier: 3,
    monthly_tokens: 3,
    free_cancellations: -1, // Unlimited
    refund_rate: 1.00,
    includes_insurance: true,
    includes_grooming: true,
    vip_walkers_access: true
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_type } = await req.json();

    if (!plan_type || !PLANS[plan_type]) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const plan = PLANS[plan_type];

    // Check if user already has a Stripe customer
    let customerId;
    const existingPlans = await base44.entities.MembershipPlan.filter({ user_email: user.email });
    
    if (existingPlans.length > 0 && existingPlans[0].stripe_customer_id) {
      customerId = existingPlans[0].stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id,
          user_email: user.email
        }
      });
      customerId = customer.id;
    }

    // Create or get price for the plan
    const prices = await stripe.prices.list({
      lookup_keys: [`pawcao_${plan_type.toLowerCase()}_monthly`],
      limit: 1
    });

    let priceId;
    if (prices.data.length > 0) {
      priceId = prices.data[0].id;
    } else {
      // Create product and price
      const product = await stripe.products.create({
        name: plan.name,
        metadata: { plan_type }
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'eur',
        recurring: { interval: 'month' },
        lookup_key: `pawcao_${plan_type.toLowerCase()}_monthly`
      });
      priceId = price.id;
    }

    // Create checkout session for subscription
    const appHost = req.headers.get('origin') || 'https://pawcao.net';
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appHost}/MembershipSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appHost}/OwnerSubscriptions`,
      metadata: {
        user_email: user.email,
        plan_type: plan_type,
        monthly_tokens: plan.monthly_tokens,
        cashback_rate: plan.cashback_rate,
        points_multiplier: plan.points_multiplier
      },
      subscription_data: {
        metadata: {
          user_email: user.email,
          plan_type: plan_type
        }
      }
    });

    return Response.json({ 
      checkout_url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    console.error('Membership checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});