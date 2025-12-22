import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { plan_type, billing_cycle, amount, plan_details } = body;

    if (!plan_type || !billing_cycle || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Definir os preços dos planos e o que está incluído
    const planConfig = {
      basic: {
        monthly: 1999, // €19.99 em centavos
        annual: 19999, // €199.99 em centavos
        freeWalksPerMonth: 1,
        walkValueCents: 1500, // €15 por passeio
        cashbackRate: 5,
        pointsMultiplier: 1.5
      },
      premium: {
        monthly: 4499,
        annual: 44999,
        freeWalksPerMonth: 2,
        walkValueCents: 1500,
        cashbackRate: 10,
        pointsMultiplier: 2
      },
      vip: {
        monthly: 7999,
        annual: 79999,
        freeWalksPerMonth: 3,
        walkValueCents: 1500,
        cashbackRate: 15,
        pointsMultiplier: 3
      }
    };

    const config = planConfig[plan_type];
    if (!config) {
      return Response.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const priceInCents = billing_cycle === 'monthly' ? config.monthly : config.annual;

    // Criar ou obter cliente Stripe
    let stripeCustomer;
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      stripeCustomer = existingCustomers.data[0];
    } else {
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id,
          platform: 'pawcao'
        }
      });
    }

    // Criar produto no Stripe (se não existir)
    const productName = `PawCão ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)} - ${billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}`;
    
    // Buscar ou criar produto
    let product;
    const products = await stripe.products.list({ limit: 100 });
    product = products.data.find(p => p.name === productName && p.active);
    
    if (!product) {
      product = await stripe.products.create({
        name: productName,
        description: `Subscrição ${plan_type} PawCão - ${config.freeWalksPerMonth} passeios grátis/mês, ${config.cashbackRate}% cashback`,
        metadata: {
          plan_type,
          billing_cycle,
          free_walks: config.freeWalksPerMonth.toString(),
          walk_value_cents: config.walkValueCents.toString()
        }
      });
    }

    // Criar preço recorrente
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceInCents,
      currency: 'eur',
      recurring: {
        interval: billing_cycle === 'monthly' ? 'month' : 'year',
        interval_count: 1
      },
      metadata: {
        plan_type,
        billing_cycle,
        free_walks_per_month: config.freeWalksPerMonth.toString(),
        walk_value_cents: config.walkValueCents.toString(),
        cashback_rate: config.cashbackRate.toString(),
        points_multiplier: config.pointsMultiplier.toString()
      }
    });

    // Criar sessão de checkout para subscrição
    const appHost = req.headers.get('origin') || 'https://app.base44.com';
    
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: price.id,
        quantity: 1
      }],
      success_url: `${appHost}/OwnerSubscriptions?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appHost}/OwnerSubscriptions?canceled=true`,
      metadata: {
        user_email: user.email,
        user_id: user.id,
        plan_type,
        billing_cycle,
        free_walks_per_month: config.freeWalksPerMonth.toString(),
        walk_value_cents: config.walkValueCents.toString(),
        cashback_rate: config.cashbackRate.toString(),
        points_multiplier: config.pointsMultiplier.toString(),
        ...plan_details
      },
      subscription_data: {
        metadata: {
          user_email: user.email,
          user_id: user.id,
          plan_type,
          billing_cycle,
          free_walks_per_month: config.freeWalksPerMonth.toString(),
          walk_value_cents: config.walkValueCents.toString()
        }
      }
    });

    return Response.json({ 
      url: session.url,
      session_id: session.id 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});