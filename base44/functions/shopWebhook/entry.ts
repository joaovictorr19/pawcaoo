import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    );

    const base44 = createClientFromRequest(req);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata.order_id;
      const couponCode = session.metadata.coupon_code;

      // Update order status
      await base44.asServiceRole.entities.ProductOrder.update(orderId, {
        payment_status: 'paid',
        status: 'paid',
        stripe_payment_intent_id: session.payment_intent
      });

      // Update coupon usage
      if (couponCode) {
        const coupons = await base44.asServiceRole.entities.Coupon.filter({ code: couponCode });
        if (coupons.length > 0) {
          const coupon = coupons[0];
          await base44.asServiceRole.entities.Coupon.update(coupon.id, {
            times_used: (coupon.times_used || 0) + 1
          });
        }
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});