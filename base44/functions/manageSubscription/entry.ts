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

        const { action, subscription_type = 'owner' } = await req.json();

        if (!action) {
            return Response.json({ error: 'action is required' }, { status: 400 });
        }

        // Get user's current subscription
        const subscriptions = subscription_type === 'owner'
            ? await base44.entities.OwnerSubscription.filter({ owner_email: user.email, is_active: true })
            : await base44.entities.WalkerSubscription.filter({ walker_email: user.email, is_active: true });

        if (subscriptions.length === 0) {
            return Response.json({ error: 'No active subscription found' }, { status: 404 });
        }

        const subscription = subscriptions[0];
        const stripeSubscriptionId = subscription.stripe_subscription_id;

        if (!stripeSubscriptionId) {
            return Response.json({ error: 'No Stripe subscription ID found' }, { status: 400 });
        }

        let result;

        switch (action) {
            case 'cancel': {
                // Cancel at period end
                const canceledSubscription = await stripe.subscriptions.update(
                    stripeSubscriptionId,
                    { cancel_at_period_end: true }
                );

                // Update in database
                const entityName = subscription_type === 'owner' ? 'OwnerSubscription' : 'WalkerSubscription';
                await base44.entities[entityName].update(subscription.id, {
                    auto_renew: false
                });

                // Create notification
                await base44.entities.Notification.create({
                    recipient_email: user.email,
                    title: 'Subscrição Cancelada',
                    message: `A sua subscrição será cancelada em ${new Date(canceledSubscription.current_period_end * 1000).toLocaleDateString('pt-PT')}`,
                    type: 'system',
                    priority: 'normal'
                });

                result = { 
                    success: true, 
                    message: 'Subscription will be cancelled at period end',
                    end_date: new Date(canceledSubscription.current_period_end * 1000)
                };
                break;
            }

            case 'reactivate': {
                // Reactivate subscription
                const reactivatedSubscription = await stripe.subscriptions.update(
                    stripeSubscriptionId,
                    { cancel_at_period_end: false }
                );

                // Update in database
                const entityName = subscription_type === 'owner' ? 'OwnerSubscription' : 'WalkerSubscription';
                await base44.entities[entityName].update(subscription.id, {
                    auto_renew: true
                });

                // Create notification
                await base44.entities.Notification.create({
                    recipient_email: user.email,
                    title: 'Subscrição Reativada',
                    message: 'A sua subscrição foi reativada com sucesso',
                    type: 'system',
                    priority: 'normal'
                });

                result = { success: true, message: 'Subscription reactivated' };
                break;
            }

            case 'pause': {
                // Pause subscription
                const pausedSubscription = await stripe.subscriptions.update(
                    stripeSubscriptionId,
                    { 
                        pause_collection: {
                            behavior: 'mark_uncollectible'
                        }
                    }
                );

                result = { success: true, message: 'Subscription paused' };
                break;
            }

            case 'resume': {
                // Resume subscription
                await stripe.subscriptions.update(
                    stripeSubscriptionId,
                    { pause_collection: null }
                );

                result = { success: true, message: 'Subscription resumed' };
                break;
            }

            case 'get_portal': {
                // Create billing portal session
                const portalSession = await stripe.billingPortal.sessions.create({
                    customer: subscription.stripe_customer_id || (await stripe.subscriptions.retrieve(stripeSubscriptionId)).customer,
                    return_url: `${req.headers.get('origin')}/AccountSettings`
                });

                result = { 
                    success: true, 
                    portal_url: portalSession.url 
                };
                break;
            }

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        return Response.json(result);
    } catch (error) {
        console.error('Subscription management error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});