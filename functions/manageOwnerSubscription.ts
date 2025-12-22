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
    const { action, new_plan_type, new_billing_cycle } = body;

    // Obter subscrição atual
    const subscriptions = await base44.entities.OwnerSubscription.filter({
      owner_email: user.email,
      is_active: true
    });

    const currentSub = subscriptions[0];

    if (!currentSub) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Configuração dos planos
    const planConfig = {
      free: { monthly: 0, annual: 0, freeWalks: 0, cashback: 0, points: 1 },
      basic: { monthly: 1999, annual: 19999, freeWalks: 1, cashback: 5, points: 1.5 },
      premium: { monthly: 4499, annual: 44999, freeWalks: 2, cashback: 10, points: 2 },
      vip: { monthly: 7999, annual: 79999, freeWalks: 3, cashback: 15, points: 3 }
    };

    const planOrder = ['free', 'basic', 'premium', 'vip'];

    switch (action) {
      case 'upgrade':
      case 'downgrade': {
        if (!new_plan_type) {
          return Response.json({ error: 'new_plan_type required' }, { status: 400 });
        }

        const currentPlanIndex = planOrder.indexOf(currentSub.plan_type);
        const newPlanIndex = planOrder.indexOf(new_plan_type);

        // Validar upgrade/downgrade
        if (action === 'upgrade' && newPlanIndex <= currentPlanIndex) {
          return Response.json({ error: 'New plan must be higher for upgrade' }, { status: 400 });
        }
        if (action === 'downgrade' && newPlanIndex >= currentPlanIndex) {
          return Response.json({ error: 'New plan must be lower for downgrade' }, { status: 400 });
        }

        // Se tem subscrição Stripe ativa, cancelar/modificar
        if (currentSub.stripe_subscription_id && new_plan_type !== 'free') {
          // Cancelar subscrição atual no Stripe
          await stripe.subscriptions.cancel(currentSub.stripe_subscription_id);
        }

        // Se o novo plano é free
        if (new_plan_type === 'free') {
          // Cancelar Stripe se existir
          if (currentSub.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(currentSub.stripe_subscription_id);
            } catch (e) {
              console.log('Stripe cancellation error (may already be cancelled):', e.message);
            }
          }

          // Atualizar para free
          await base44.entities.OwnerSubscription.update(currentSub.id, {
            plan_type: 'free',
            billing_cycle: 'monthly',
            monthly_price: 0,
            annual_price: 0,
            cashback_rate: 0,
            free_walks_per_month: 0,
            free_walks_used_this_month: 0,
            points_multiplier: 1,
            free_cancellations: 0,
            priority_booking: false,
            free_insurance: false,
            priority_support: false,
            exclusive_walkers: false,
            stripe_subscription_id: null
          });

          // Notificação
          await base44.entities.Notification.create({
            recipient_email: user.email,
            title: 'Plano Alterado',
            message: `O seu plano foi alterado para Free. Esperamos vê-lo de volta em breve!`,
            type: 'payment',
            priority: 'normal'
          });

          return Response.json({ success: true, message: 'Downgraded to free plan' });
        }

        // Para planos pagos, criar novo checkout
        const billingCycle = new_billing_cycle || currentSub.billing_cycle || 'monthly';
        const config = planConfig[new_plan_type];

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
            metadata: { user_id: user.id }
          });
        }

        // Criar produto e preço
        const productName = `PawCão ${new_plan_type.charAt(0).toUpperCase() + new_plan_type.slice(1)} - ${billingCycle === 'monthly' ? 'Mensal' : 'Anual'}`;
        const priceInCents = billingCycle === 'monthly' ? config.monthly : config.annual;

        const product = await stripe.products.create({
          name: productName,
          description: `Subscrição ${new_plan_type} - ${action}`
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: priceInCents,
          currency: 'eur',
          recurring: {
            interval: billingCycle === 'monthly' ? 'month' : 'year'
          }
        });

        const appHost = req.headers.get('origin') || 'https://app.base44.com';

        const session = await stripe.checkout.sessions.create({
          customer: stripeCustomer.id,
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: price.id, quantity: 1 }],
          success_url: `${appHost}/OwnerSubscriptions?success=true&action=${action}`,
          cancel_url: `${appHost}/OwnerSubscriptions?canceled=true`,
          metadata: {
            user_email: user.email,
            user_id: user.id,
            plan_type: new_plan_type,
            billing_cycle: billingCycle,
            free_walks_per_month: config.freeWalks.toString(),
            cashback_rate: config.cashback.toString(),
            points_multiplier: config.points.toString(),
            action
          },
          subscription_data: {
            metadata: {
              user_email: user.email,
              plan_type: new_plan_type,
              billing_cycle: billingCycle
            }
          }
        });

        return Response.json({ url: session.url, session_id: session.id });
      }

      case 'cancel': {
        // Cancelar subscrição
        if (currentSub.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(currentSub.stripe_subscription_id);
          } catch (e) {
            console.log('Stripe cancellation error:', e.message);
          }
        }

        // Reverter para free
        await base44.entities.OwnerSubscription.update(currentSub.id, {
          plan_type: 'free',
          billing_cycle: 'monthly',
          monthly_price: 0,
          annual_price: 0,
          cashback_rate: 0,
          free_walks_per_month: 0,
          free_walks_used_this_month: 0,
          points_multiplier: 1,
          free_cancellations: 0,
          priority_booking: false,
          free_insurance: false,
          priority_support: false,
          exclusive_walkers: false,
          stripe_subscription_id: null,
          is_active: true
        });

        // Notificação
        await base44.entities.Notification.create({
          recipient_email: user.email,
          title: 'Subscrição Cancelada',
          message: 'A sua subscrição foi cancelada. O seu plano foi alterado para Free.',
          type: 'payment',
          priority: 'normal'
        });

        return Response.json({ success: true, message: 'Subscription cancelled' });
      }

      case 'get_portal': {
        // Criar link para portal de gestão Stripe
        if (!currentSub.stripe_customer_id) {
          return Response.json({ error: 'No Stripe customer found' }, { status: 400 });
        }

        const appHost = req.headers.get('origin') || 'https://app.base44.com';

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: currentSub.stripe_customer_id,
          return_url: `${appHost}/OwnerSubscriptions`
        });

        return Response.json({ url: portalSession.url });
      }

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Manage subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});