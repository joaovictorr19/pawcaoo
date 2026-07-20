import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const key = Deno.env.get('STRIPE_SECRET_KEY') || '';
    const stripe = new Stripe(key);

    const balance = await stripe.balance.retrieve();
    const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });

    return Response.json({
      key_valid: true,
      livemode: balance.livemode,
      key_type: key.startsWith('sk_live_') ? 'live' : key.startsWith('sk_test_') ? 'test' : 'unknown',
      currency_balances: balance.available.map(b => ({ currency: b.currency, amount: b.amount / 100 })),
      webhook_endpoints: webhooks.data.map(w => ({ url: w.url, status: w.status, events: w.enabled_events.length }))
    });
  } catch (error) {
    return Response.json({ key_valid: false, error: error.message }, { status: 500 });
  }
});