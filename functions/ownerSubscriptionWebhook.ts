import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.5.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    console.log('Webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.mode === 'subscription') {
          const metadata = session.metadata;
          const userEmail = metadata.user_email;
          const planType = metadata.plan_type;
          const billingCycle = metadata.billing_cycle;
          const freeWalksPerMonth = parseInt(metadata.free_walks_per_month) || 0;
          const cashbackRate = parseInt(metadata.cashback_rate) || 0;
          const pointsMultiplier = parseFloat(metadata.points_multiplier) || 1;

          // Buscar subscrição existente
          const existingSubs = await base44.asServiceRole.entities.OwnerSubscription.filter({
            owner_email: userEmail
          });

          const subscriptionData = {
            owner_email: userEmail,
            plan_type: planType,
            billing_cycle: billingCycle,
            monthly_price: billingCycle === 'monthly' ? (session.amount_total / 100) : 0,
            annual_price: billingCycle === 'annual' ? (session.amount_total / 100) : 0,
            cashback_rate: cashbackRate,
            free_walks_per_month: freeWalksPerMonth,
            free_walks_used_this_month: 0, // Reset no início do período
            points_multiplier: pointsMultiplier,
            free_cancellations: planType === 'vip' ? 999 : (planType === 'premium' ? 5 : 2),
            priority_booking: planType === 'premium' || planType === 'vip',
            free_insurance: planType === 'premium' || planType === 'vip',
            priority_support: planType === 'premium' || planType === 'vip',
            exclusive_walkers: planType === 'vip',
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
            start_date: new Date().toISOString().split('T')[0],
            is_active: true,
            auto_renew: true
          };

          if (existingSubs.length > 0) {
            await base44.asServiceRole.entities.OwnerSubscription.update(
              existingSubs[0].id,
              subscriptionData
            );
          } else {
            await base44.asServiceRole.entities.OwnerSubscription.create(subscriptionData);
          }

          console.log(`Subscription activated for ${userEmail}: ${planType}`);
        }
        break;
      }

      case 'invoice.paid': {
        // Renovação mensal/anual bem sucedida
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userEmail = subscription.metadata.user_email;

          if (userEmail) {
            // Reset dos passeios grátis usados no novo período
            const existingSubs = await base44.asServiceRole.entities.OwnerSubscription.filter({
              owner_email: userEmail,
              stripe_subscription_id: subscriptionId
            });

            if (existingSubs.length > 0) {
              const sub = existingSubs[0];
              
              // Calcular valor retido de passeios não usados (para estatísticas)
              const unusedWalks = (sub.free_walks_per_month || 0) - (sub.free_walks_used_this_month || 0);
              const unusedValue = unusedWalks * 15; // €15 por passeio
              
              await base44.asServiceRole.entities.OwnerSubscription.update(
                sub.id,
                {
                  free_walks_used_this_month: 0, // RESET - passeios não usados são perdidos
                  unused_walks_value_retained: (sub.unused_walks_value_retained || 0) + unusedValue,
                  is_active: true,
                  current_period_start: new Date().toISOString().split('T')[0],
                  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }
              );

              // Notificação de renovação bem sucedida
              await base44.asServiceRole.entities.Notification.create({
                recipient_email: userEmail,
                title: '✅ Subscrição Renovada',
                message: `A sua subscrição ${sub.plan_type.toUpperCase()} foi renovada com sucesso! Os seus ${sub.free_walks_per_month} passeios grátis foram repostos.`,
                type: 'payment',
                priority: 'normal'
              });

              console.log(`Subscription renewed for ${userEmail}, free walks reset to 0, unused value: €${unusedValue}`);
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Subscrição cancelada
        const subscription = event.data.object;
        const userEmail = subscription.metadata.user_email;

        if (userEmail) {
          const existingSubs = await base44.asServiceRole.entities.OwnerSubscription.filter({
            owner_email: userEmail,
            stripe_subscription_id: subscription.id
          });

          if (existingSubs.length > 0) {
            const oldPlan = existingSubs[0].plan_type;
            
            // Reverter para plano free
            await base44.asServiceRole.entities.OwnerSubscription.update(
              existingSubs[0].id,
              {
                plan_type: 'free',
                is_active: true,
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
              }
            );

            // Notificação de cancelamento
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: userEmail,
              title: 'Subscrição Terminada',
              message: `A sua subscrição ${oldPlan.toUpperCase()} terminou. O seu plano foi alterado para Free. Pode fazer upgrade a qualquer momento para recuperar os benefícios.`,
              type: 'payment',
              priority: 'normal'
            });

            console.log(`Subscription cancelled for ${userEmail}, reverted to free`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Pagamento falhou
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const userEmail = subscription.metadata.user_email;

          if (userEmail) {
            // Notificar utilizador
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: userEmail,
              title: '⚠️ Pagamento da Subscrição Falhou',
              message: 'O pagamento da sua subscrição PawCão falhou. Por favor atualize o seu método de pagamento nas próximas 24 horas para evitar a suspensão do serviço.',
              type: 'payment',
              priority: 'high'
            });

            // Enviar email de alerta
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: userEmail,
              subject: '⚠️ Falha no Pagamento da Subscrição PawCão',
              body: `Olá,\n\nO pagamento da sua subscrição PawCão não foi processado com sucesso.\n\nPor favor, atualize o seu método de pagamento nas próximas 24 horas para manter os seus benefícios ativos.\n\nPode gerir os seus pagamentos em: Painel → Planos Premium → Gerir Pagamentos\n\nSe tiver dúvidas, responda a este email.\n\nObrigado,\nEquipa PawCão`
            });

            console.log(`Payment failed notification sent to ${userEmail}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        // Subscrição próxima de expirar (avisar 7 dias antes)
        const subscription = event.data.object;
        const userEmail = subscription.metadata.user_email;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const daysUntilRenewal = Math.ceil((currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24));

        if (userEmail && daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: userEmail,
            title: '🔔 Renovação da Subscrição em Breve',
            message: `A sua subscrição será renovada em ${daysUntilRenewal} dia${daysUntilRenewal !== 1 ? 's' : ''}. Certifique-se de que o seu método de pagamento está atualizado.`,
            type: 'payment',
            priority: 'normal'
          });
          console.log(`Renewal reminder sent to ${userEmail} (${daysUntilRenewal} days)`);
        }
        break;
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});