import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, shipping_address, coupon_code } = await req.json();

    // Calculate totals
    let subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    let discount = 0;
    let coupon = null;

    // Apply coupon if provided
    if (coupon_code) {
      const coupons = await base44.asServiceRole.entities.Coupon.filter({
        code: coupon_code,
        is_active: true
      });

      if (coupons.length > 0) {
        coupon = coupons[0];
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
          if (subtotal >= coupon.min_purchase) {
            if (!coupon.max_uses || coupon.times_used < coupon.max_uses) {
              if (coupon.discount_type === 'percentage') {
                discount = (subtotal * coupon.discount_value) / 100;
              } else {
                discount = coupon.discount_value;
              }
            }
          }
        }
      }
    }

    const shipping_fee = 5; // Fixed shipping
    const total = subtotal - discount + shipping_fee;

    // Create order in DB
    const order = await base44.asServiceRole.entities.ProductOrder.create({
      order_number: `ORD-${Date.now()}`,
      customer_email: user.email,
      customer_name: user.full_name,
      items: items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity
      })),
      subtotal,
      discount_amount: discount,
      coupon_code: coupon_code || null,
      shipping_fee,
      total_amount: total,
      shipping_address,
      status: 'pending',
      payment_status: 'pending'
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.product_name,
            images: item.product_image ? [item.product_image] : [],
          },
          unit_amount: Math.round(item.unit_price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/OrderSuccess?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${req.headers.get('origin')}/Shop`,
      customer_email: user.email,
      metadata: {
        order_id: order.id,
        coupon_code: coupon_code || '',
      },
    });

    return Response.json({ 
      sessionId: session.id, 
      url: session.url,
      order_id: order.id 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});