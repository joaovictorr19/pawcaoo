import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
    apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
    try {
        const signature = req.headers.get('stripe-signature');
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

        if (!signature || !webhookSecret) {
            return Response.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
        }

        // Get raw body for signature verification
        const body = await req.text();

        // Verify webhook signature
        let event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Initialize Base44 client with service role for admin operations
        const base44 = createClientFromRequest(req);

        console.log('Processing Stripe event:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                await handlePaymentSuccess(base44, paymentIntent);
                break;
            }

            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object;
                await handlePaymentFailed(base44, paymentIntent);
                break;
            }

            case 'checkout.session.completed': {
                const session = event.data.object;
                await handleCheckoutCompleted(base44, session);
                break;
            }

            case 'account.updated': {
                const account = event.data.object;
                await handleAccountUpdated(base44, account);
                break;
            }

            case 'charge.refunded': {
                const charge = event.data.object;
                await handleChargeRefunded(base44, charge);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return Response.json({ received: true, event_type: event.type });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function handlePaymentSuccess(base44, paymentIntent) {
    const bookingId = paymentIntent.metadata?.booking_id;
    const emergencyWalkId = paymentIntent.metadata?.emergency_walk_id;

    if (!bookingId && !emergencyWalkId) {
        console.log('No booking or emergency walk ID in payment metadata');
        return;
    }

    // Update payment record
    const payments = await base44.asServiceRole.entities.Payment.filter({
        stripe_payment_intent_id: paymentIntent.id
    });

    if (payments.length > 0) {
        await base44.asServiceRole.entities.Payment.update(payments[0].id, {
            status: 'held',
            held_date: new Date().toISOString()
        });
    }

    // Update booking if exists
    if (bookingId) {
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (bookings.length > 0) {
            await base44.asServiceRole.entities.Booking.update(bookingId, {
                payment_status: 'held',
                status: 'confirmed'
            });

            // Send notification to walker
            const booking = bookings[0];
            await base44.asServiceRole.entities.Notification.create({
                recipient_email: booking.walker_email,
                title: 'Nova Reserva Confirmada',
                message: `Você tem uma nova reserva de ${booking.owner_name} para ${booking.walk_date}`,
                type: 'booking',
                related_id: bookingId,
                action_url: `/MyBookings?id=${bookingId}`
            });
        }
    }

    // Update emergency walk if exists
    if (emergencyWalkId) {
        await base44.asServiceRole.entities.EmergencyWalk.update(emergencyWalkId, {
            payment_status: 'held',
            status: 'accepted'
        });
    }
}

async function handlePaymentFailed(base44, paymentIntent) {
    const bookingId = paymentIntent.metadata?.booking_id;
    const emergencyWalkId = paymentIntent.metadata?.emergency_walk_id;

    // Update payment record
    const payments = await base44.asServiceRole.entities.Payment.filter({
        stripe_payment_intent_id: paymentIntent.id
    });

    if (payments.length > 0) {
        await base44.asServiceRole.entities.Payment.update(payments[0].id, {
            status: 'failed'
        });
    }

    // Update booking if exists
    if (bookingId) {
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (bookings.length > 0) {
            const booking = bookings[0];
            await base44.asServiceRole.entities.Booking.update(bookingId, {
                payment_status: 'failed',
                status: 'cancelled'
            });

            // Send notification to owner
            await base44.asServiceRole.entities.Notification.create({
                recipient_email: booking.owner_email || booking.created_by,
                title: 'Pagamento Falhou',
                message: 'O pagamento da sua reserva não foi processado. Por favor, tente novamente.',
                type: 'payment',
                related_id: bookingId,
                priority: 'high'
            });
        }
    }

    // Update emergency walk if exists
    if (emergencyWalkId) {
        await base44.asServiceRole.entities.EmergencyWalk.update(emergencyWalkId, {
            payment_status: 'failed',
            status: 'available'
        });
    }
}

async function handleCheckoutCompleted(base44, session) {
    const bookingId = session.metadata?.booking_id;
    const subscriptionType = session.metadata?.subscription_type;

    if (subscriptionType) {
        // Handle subscription purchase
        const userEmail = session.customer_email;
        
        if (subscriptionType === 'walker' || subscriptionType === 'trainer') {
            await base44.asServiceRole.entities.WalkerSubscription.create({
                walker_email: userEmail,
                walker_name: session.metadata?.user_name || userEmail,
                plan_type: session.metadata?.plan_type || 'basic',
                monthly_fee: session.amount_total / 100,
                commission_rate: 0,
                start_date: new Date().toISOString(),
                is_active: true,
                stripe_subscription_id: session.subscription
            });
        } else if (subscriptionType === 'owner') {
            await base44.asServiceRole.entities.OwnerSubscription.create({
                owner_email: userEmail,
                owner_name: session.metadata?.user_name || userEmail,
                plan_type: session.metadata?.plan_type || 'basic',
                monthly_fee: session.amount_total / 100,
                start_date: new Date().toISOString(),
                is_active: true,
                stripe_subscription_id: session.subscription
            });
        }
    } else if (bookingId) {
        // Handle booking payment
        await base44.asServiceRole.entities.Booking.update(bookingId, {
            payment_status: 'held',
            status: 'confirmed'
        });
    }
}

async function handleAccountUpdated(base44, account) {
    // Find walker/trainer with this Stripe account
    const walkers = await base44.asServiceRole.entities.WalkerProfile.filter({});
    const trainers = await base44.asServiceRole.entities.TrainerProfile.filter({});

    const allProfiles = [...walkers, ...trainers];
    const profile = allProfiles.find(p => p.stripe_account_id === account.id);

    if (profile) {
        const isWalker = walkers.some(w => w.id === profile.id);
        const entityName = isWalker ? 'WalkerProfile' : 'TrainerProfile';

        // Update verification status based on account capabilities
        const canAcceptPayments = account.charges_enabled && account.payouts_enabled;
        
        await base44.asServiceRole.entities[entityName].update(profile.id, {
            stripe_charges_enabled: account.charges_enabled,
            stripe_payouts_enabled: account.payouts_enabled,
            stripe_onboarding_complete: canAcceptPayments
        });

        // Notify the professional
        await base44.asServiceRole.entities.Notification.create({
            recipient_email: profile.created_by,
            title: canAcceptPayments ? 'Conta Stripe Ativa' : 'Atualização da Conta Stripe',
            message: canAcceptPayments 
                ? 'A sua conta Stripe está agora ativa e pode começar a receber pagamentos!'
                : 'A sua conta Stripe foi atualizada. Verifique o estado no seu dashboard.',
            type: 'system',
            priority: 'high'
        });
    }
}

async function handleChargeRefunded(base44, charge) {
    const paymentIntentId = charge.payment_intent;

    // Find payment and update status
    const payments = await base44.asServiceRole.entities.Payment.filter({
        stripe_payment_intent_id: paymentIntentId
    });

    if (payments.length > 0) {
        const payment = payments[0];
        await base44.asServiceRole.entities.Payment.update(payment.id, {
            status: 'refunded'
        });

        // Update related booking
        if (payment.booking_id) {
            await base44.asServiceRole.entities.Booking.update(payment.booking_id, {
                payment_status: 'refunded',
                status: 'cancelled'
            });

            // Notify owner
            const bookings = await base44.asServiceRole.entities.Booking.filter({ id: payment.booking_id });
            if (bookings.length > 0) {
                await base44.asServiceRole.entities.Notification.create({
                    recipient_email: bookings[0].created_by,
                    title: 'Reembolso Processado',
                    message: 'O reembolso da sua reserva foi processado com sucesso.',
                    type: 'payment',
                    related_id: payment.booking_id
                });
            }
        }
    }
}