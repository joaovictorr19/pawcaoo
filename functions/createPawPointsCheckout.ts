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
    const { reward_id, final_points, euro_value, description, tier_discount } = body;

    if (!reward_id || !final_points || !euro_value) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validar que o valor em euros está alinhado: 400 pontos = €1
    const expectedValue = (final_points / 400).toFixed(2);
    if (Math.abs(parseFloat(expectedValue) - parseFloat(euro_value)) > 0.01) {
      return Response.json({ 
        error: 'Invalid value calculation',
        details: `Expected €${expectedValue} for ${final_points} points`
      }, { status: 400 });
    }

    // Verificar saldo de pontos do usuário
    const loyaltyPoints = await base44.entities.LoyaltyPoints.filter({
      user_email: user.email
    });

    if (!loyaltyPoints.length || loyaltyPoints[0].points_balance < final_points) {
      return Response.json({ error: 'Insufficient points' }, { status: 400 });
    }

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

    // Criar código único de resgate
    const redemptionCode = `PW${Date.now().toString(36).toUpperCase()}`;

    // Criar produto one-time no Stripe
    const product = await stripe.products.create({
      name: `PawPoints: ${description}`,
      description: `Resgate de ${final_points} pontos (${tier_discount}% desconto tier)`,
      metadata: {
        type: 'pawpoints_redemption',
        reward_id,
        redemption_code,
        points_spent: final_points.toString(),
        tier_discount: tier_discount.toString()
      }
    });

    // Criar preço one-time
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(euro_value * 100), // Converter para centavos
      currency: 'eur',
      metadata: {
        reward_id,
        redemption_code,
        points_spent: final_points.toString()
      }
    });

    // Criar sessão de checkout
    const appHost = req.headers.get('origin') || 'https://app.base44.com';
    
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: price.id,
        quantity: 1
      }],
      success_url: `${appHost}/LoyaltyRewards?success=true&redemption_code=${redemptionCode}`,
      cancel_url: `${appHost}/LoyaltyRewards?canceled=true`,
      metadata: {
        user_email: user.email,
        user_id: user.id,
        reward_id,
        redemption_code,
        points_spent: final_points.toString(),
        euro_value: euro_value.toString(),
        tier_discount: tier_discount.toString(),
        description
      }
    });

    return Response.json({ 
      url: session.url,
      session_id: session.id,
      redemption_code
    });

  } catch (error) {
    console.error('PawPoints checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});