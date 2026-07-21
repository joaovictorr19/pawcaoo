import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
    apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan_type, billing_cycle = 'monthly', subscription_type = 'owner' } = await req.json();

        if (!plan_type) {
            return Response.json({ error: 'plan_type is required' }, { status: 400 });
        }

        // Define pricing for different plans
        const pricingConfig = {
            owner: {
                basic: { monthly: 9.99, annual: 99.99 },
                premium: { monthly: 19.99, annual: 199.99 },
                vip: { monthly: 39.99, annual: 399.99 }
            },
            walker: {
                basic: { monthly: 14.99, annual: 149.99 },
                premium: { monthly: 29.99, annual: 299.99 },
                pro: { monthly: 49.99, annual: 499.99 }
            }
        };

        const price = pricingConfig[subscription_type]?.[plan_type]?.[billing_cycle];
        
        if (!price) {
            return Response.json({ error: 'Invalid plan configuration' }, { status: 400 });
        }

        // Create or retrieve Stripe customer
        let customerId;
        const existingSubscriptions = subscription_type === 'owner' 
            ? await base44.entities.OwnerSubscription.filter({ owner_email: user.email })
            : await base44.entities.WalkerSubscription.filter({ walker_email: user.email });

        if (existingSubscriptions.length > 0 && existingSubscriptions[0].stripe_customer_id) {
            customerId = existingSubscriptions[0].stripe_customer_id;
        } else {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.full_name,
                metadata: {
                    user_id: user.id,
                    subscription_type: subscription_type
                }
            });
            customerId = customer.id;
        }

        // Create Stripe Price (or use existing)
        const priceAmount = Math.round(price * 100); // Convert to cents
        const interval = billing_cycle === 'annual' ? 'year' : 'month';

        const stripePrice = await stripe.prices.create({
            unit_amount: priceAmount,
            currency: 'eur',
            recurring: { interval },
            product_data: {
                name: `PawCão ${subscription_type === 'owner' ? 'Owner' : 'Professional'} - ${plan_type.toUpperCase()}`,
                description: `${billing_cycle === 'annual' ? 'Annual' : 'Monthly'} subscription`
            },
            metadata: {
                plan_type,
                billing_cycle,
                subscription_type
            }
        });

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price: stripePrice.id,
                quantity: 1,
            }],
            mode: 'subscription',
            locale: 'pt',
            success_url: `${req.headers.get('origin')}/AccountSettings?subscription=success`,
            cancel_url: `${req.headers.get('origin')}/OwnerSubscriptions?cancelled=true`,
            metadata: {
                user_email: user.email,
                user_name: user.full_name,
                plan_type,
                billing_cycle,
                subscription_type
            }
        });

        return Response.json({ 
            sessionId: session.id,
            url: session.url 
        });
    } catch (error) {
        console.error('Subscription creation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});