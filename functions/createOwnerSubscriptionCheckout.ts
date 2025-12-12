import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-11-20.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_type, billing_cycle, amount, plan_details } = await req.json();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Plano ${plan_type.toUpperCase()} - ${billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}`,
              description: `Cashback: ${plan_details.cashbackRate}% | ${plan_details.freeWalksPerMonth} passeios grátis/mês | PawPoints: ${plan_details.pointsMultiplier}x`,
              images: ['https://pawcao.net/logo.png'],
            },
            unit_amount: Math.round(amount * 100),
            recurring: billing_cycle === 'monthly' 
              ? { interval: 'month' }
              : { interval: 'year' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/OwnerSubscriptions?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.get('origin')}/OwnerSubscriptions?canceled=true`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        plan_type,
        billing_cycle,
        cashback_rate: plan_details.cashbackRate.toString(),
        free_walks_per_month: plan_details.freeWalksPerMonth.toString(),
        points_multiplier: plan_details.pointsMultiplier.toString(),
        free_cancellations: plan_details.freeCancellations.toString(),
        priority_booking: plan_details.priorityBooking.toString(),
        free_insurance: plan_details.freeInsurance.toString(),
        priority_support: plan_details.prioritySupport.toString(),
        exclusive_walkers: plan_details.exclusiveWalkers.toString(),
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});