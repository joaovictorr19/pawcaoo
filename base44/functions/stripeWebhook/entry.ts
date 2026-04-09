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
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
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

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await handleSubscriptionUpdated(base44, subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await handleSubscriptionDeleted(base44, subscription);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                await handleInvoicePaymentSucceeded(base44, invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                await handleInvoicePaymentFailed(base44, invoice);
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

    console.log('💰 ========== PAYMENT SUCCESS WEBHOOK ==========');
    console.log('   Booking ID:', bookingId);
    console.log('   Amount:', paymentIntent.amount / 100);

    if (!bookingId && !emergencyWalkId) {
        console.log('❌ No booking or emergency walk ID in payment metadata');
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
        console.log('✅ Payment record updated');
    }

    // Update booking if exists
    if (bookingId) {
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (bookings.length > 0) {
            const booking = bookings[0];
            console.log('📋 Found booking:', booking.dog_name);
            console.log('   Walker Email:', booking.walker_email);
            console.log('   Walker ID:', booking.walker_id);
            console.log('   Owner Email:', booking.owner_email || booking.created_by);
            
            // CRITICAL: Update to 'pending' so walker can accept it
            await base44.asServiceRole.entities.Booking.update(bookingId, {
                payment_status: 'held',
                status: 'pending' // KEEP AS PENDING - Walker must accept
            });
            console.log('✅ Booking updated to PENDING (awaiting walker acceptance)');

            // CRITICAL: Create chat conversation immediately
            try {
                const existingConvo = await base44.asServiceRole.entities.ChatConversation.filter({ 
                    booking_id: bookingId 
                });
                
                if (!existingConvo || existingConvo.length === 0) {
                    console.log('📝 Creating chat conversation...');
                    const walkerEmail = booking.walker_email;
                    const ownerEmail = booking.owner_email || booking.created_by;
                    
                    await base44.asServiceRole.entities.ChatConversation.create({
                        participants: [walkerEmail, ownerEmail],
                        participant_names: {
                            [walkerEmail]: booking.walker_name,
                            [ownerEmail]: booking.owner_name
                        },
                        booking_id: bookingId,
                        tags: ["booking", "walk"],
                        last_message: "Pagamento recebido - Aguardando aceitação",
                        last_message_date: new Date().toISOString(),
                        unread_counts: {
                            [walkerEmail]: 0,
                            [ownerEmail]: 0
                        },
                        is_muted: {},
                        pinned_by: [],
                        typing_users: []
                    });
                    console.log('✅ Chat conversation created!');
                }
            } catch (chatError) {
                console.error('❌ Chat creation error:', chatError);
            }

            // 🎯 AWARD LOYALTY POINTS (10 pontos base por €1)
            const ownerEmail = booking.owner_email || booking.created_by;
            await awardLoyaltyPoints(base44, ownerEmail, booking.total_amount, bookingId, 'reserva');

            // 🎁 CHECK & REWARD REFERRAL (primeira reserva)
            await checkAndRewardReferral(base44, ownerEmail, booking.total_amount);

            // Send notification to walker
            await base44.asServiceRole.entities.Notification.create({
                recipient_email: booking.walker_email,
                title: '💰 Nova Reserva PAGA!',
                message: `${booking.owner_name} pagou por ${booking.dog_name} (${booking.walk_date}). Aceite a reserva agora!`,
                type: 'booking',
                related_id: bookingId,
                action_url: `/ProfessionalDashboard`,
                priority: 'high'
            });
            console.log('✅ Notification sent to walker');
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

async function awardLoyaltyPoints(base44, userEmail, amountEuro, relatedId, activityType) {
    if (!userEmail || !amountEuro) return;

    // Buscar pontos do usuário
    const loyaltyRecords = await base44.asServiceRole.entities.LoyaltyPoints.filter({
        user_email: userEmail
    });

    let loyaltyRecord = loyaltyRecords[0];

    // Criar se não existir
    if (!loyaltyRecord) {
        loyaltyRecord = await base44.asServiceRole.entities.LoyaltyPoints.create({
            user_email: userEmail,
            points_balance: 0,
            total_earned: 0,
            total_redeemed: 0,
            tier: 'bronze',
            achievements: [],
            lifetime_bookings: 0,
            lifetime_redemptions: 0
        });
    }

    // Calcular tier e multiplicador
    const tiers = [
        { name: "bronze", min: 0, max: 499, multiplier: 1 },
        { name: "silver", min: 500, max: 999, multiplier: 1.2 },
        { name: "gold", min: 1000, max: 2499, multiplier: 1.5 },
        { name: "platinum", min: 2500, max: 99999, multiplier: 2 }
    ];

    const currentTier = tiers.find(t => 
        loyaltyRecord.total_earned >= t.min && 
        loyaltyRecord.total_earned <= t.max
    ) || tiers[0];

    // 10 pontos por €1, com multiplicador tier
    const basePoints = Math.floor(amountEuro * 10);
    const pointsEarned = Math.floor(basePoints * currentTier.multiplier);

    // Atualizar pontos
    const newBalance = (loyaltyRecord.points_balance || 0) + pointsEarned;
    const newTotalEarned = (loyaltyRecord.total_earned || 0) + pointsEarned;
    const newLifetimeBookings = (loyaltyRecord.lifetime_bookings || 0) + 1;

    // Calcular novo tier
    const newTier = tiers.find(t => 
        newTotalEarned >= t.min && 
        newTotalEarned <= t.max
    )?.name || 'bronze';

    await base44.asServiceRole.entities.LoyaltyPoints.update(loyaltyRecord.id, {
        points_balance: newBalance,
        total_earned: newTotalEarned,
        tier: newTier,
        lifetime_bookings: newLifetimeBookings
    });

    // Registar transação
    await base44.asServiceRole.entities.PointsTransaction.create({
        user_email: userEmail,
        transaction_type: 'earned',
        points_amount: pointsEarned,
        description: `Ganhou ${pointsEarned} pontos por ${activityType} (€${amountEuro}) - ${currentTier.multiplier}x multiplier`,
        balance_after: newBalance,
        related_booking_id: relatedId
    });

    // Notificar sobre pontos ganhos
    await base44.asServiceRole.entities.Notification.create({
        recipient_email: userEmail,
        title: '🎉 PawPoints Ganhos!',
        message: `Ganhou ${pointsEarned} pontos! (${currentTier.multiplier}x multiplier tier ${currentTier.name})`,
        type: 'system',
        priority: 'normal'
    });
}

async function checkAndRewardReferral(base44, userEmail, bookingAmount) {
    // Buscar se este utilizador foi indicado
    const referrals = await base44.asServiceRole.entities.Referral.filter({
        referee_email: userEmail,
        status: 'pending'
    });

    if (referrals.length === 0) return;

    const referral = referrals[0];

    // Atualizar referral
    await base44.asServiceRole.entities.Referral.update(referral.id, {
        status: 'completed',
        first_booking_completed: true,
        first_booking_date: new Date().toISOString(),
        total_referee_value: (referral.total_referee_value || 0) + bookingAmount,
        conversion_date: new Date().toISOString()
    });

    // Dar 200 pontos ao indicador
    await awardReferralPoints(base44, referral.referrer_email, 200, referral.id, 'primeira reserva do indicado');

    // Atualizar pontos ganhos
    await base44.asServiceRole.entities.Referral.update(referral.id, {
        points_awarded_referrer: 200,
        status: 'rewarded'
    });

    // Notificar indicador
    await base44.asServiceRole.entities.Notification.create({
        recipient_email: referral.referrer_email,
        title: '🎉 Recompensa de Afiliado!',
        message: `${referral.referee_name} completou a primeira reserva! Ganhou 200 PawPoints!`,
        type: 'system',
        priority: 'high'
    });
}

async function awardReferralPoints(base44, userEmail, points, referralId, description) {
    let loyaltyRecords = await base44.asServiceRole.entities.LoyaltyPoints.filter({
        user_email: userEmail
    });

    let loyaltyRecord = loyaltyRecords[0];

    if (!loyaltyRecord) {
        loyaltyRecord = await base44.asServiceRole.entities.LoyaltyPoints.create({
            user_email: userEmail,
            points_balance: points,
            total_earned: points,
            total_redeemed: 0,
            tier: 'bronze',
            achievements: [],
            lifetime_bookings: 0,
            lifetime_redemptions: 0
        });
    } else {
        const newBalance = (loyaltyRecord.points_balance || 0) + points;
        const newTotalEarned = (loyaltyRecord.total_earned || 0) + points;
        
        await base44.asServiceRole.entities.LoyaltyPoints.update(loyaltyRecord.id, {
            points_balance: newBalance,
            total_earned: newTotalEarned
        });
    }

    await base44.asServiceRole.entities.PointsTransaction.create({
        user_email: userEmail,
        transaction_type: 'earned',
        points_amount: points,
        description: `Programa Afiliados: ${description}`,
        balance_after: (loyaltyRecord.points_balance || 0) + points
    });
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
        const billingCycle = session.metadata?.billing_cycle || 'monthly';
        const planType = session.metadata?.plan_type || 'basic';
        
        // Calculate next billing date
        const startDate = new Date();
        const nextBillingDate = new Date(startDate);
        if (billingCycle === 'annual') {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
        } else {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        }

        // Get Stripe customer ID
        const stripeCustomerId = session.customer;
        
        if (subscriptionType === 'walker' || subscriptionType === 'trainer') {
            // Check if subscription already exists
            const existing = await base44.asServiceRole.entities.WalkerSubscription.filter({
                walker_email: userEmail,
                is_active: true
            });

            if (existing.length > 0) {
                // Update existing
                await base44.asServiceRole.entities.WalkerSubscription.update(existing[0].id, {
                    plan_type: planType,
                    monthly_fee: session.amount_total / 100,
                    billing_cycle: billingCycle,
                    commission_rate: 0,
                    stripe_subscription_id: session.subscription,
                    stripe_customer_id: stripeCustomerId,
                    next_billing_date: nextBillingDate.toISOString()
                });
            } else {
                // Create new
                await base44.asServiceRole.entities.WalkerSubscription.create({
                    walker_email: userEmail,
                    walker_name: session.metadata?.user_name || userEmail,
                    plan_type: planType,
                    billing_cycle: billingCycle,
                    monthly_fee: session.amount_total / 100,
                    commission_rate: 0,
                    start_date: startDate.toISOString(),
                    next_billing_date: nextBillingDate.toISOString(),
                    is_active: true,
                    stripe_subscription_id: session.subscription,
                    stripe_customer_id: stripeCustomerId
                });
            }

            // Notify user
            await base44.asServiceRole.entities.Notification.create({
                recipient_email: userEmail,
                title: 'Subscrição Ativa',
                message: `A sua subscrição ${planType.toUpperCase()} foi ativada com sucesso!`,
                type: 'system',
                priority: 'high'
            });
        } else if (subscriptionType === 'owner') {
            // Check if subscription already exists
            const existing = await base44.asServiceRole.entities.OwnerSubscription.filter({
                owner_email: userEmail,
                is_active: true
            });

            if (existing.length > 0) {
                // Update existing
                await base44.asServiceRole.entities.OwnerSubscription.update(existing[0].id, {
                    plan_type: planType,
                    billing_cycle: billingCycle,
                    monthly_price: billingCycle === 'monthly' ? session.amount_total / 100 : 0,
                    annual_price: billingCycle === 'annual' ? session.amount_total / 100 : 0,
                    stripe_subscription_id: session.subscription,
                    stripe_customer_id: stripeCustomerId,
                    next_billing_date: nextBillingDate.toISOString()
                });
            } else {
                // Create new
                await base44.asServiceRole.entities.OwnerSubscription.create({
                    owner_email: userEmail,
                    owner_name: session.metadata?.user_name || userEmail,
                    plan_type: planType,
                    billing_cycle: billingCycle,
                    monthly_price: billingCycle === 'monthly' ? session.amount_total / 100 : 0,
                    annual_price: billingCycle === 'annual' ? session.amount_total / 100 : 0,
                    start_date: startDate.toISOString(),
                    next_billing_date: nextBillingDate.toISOString(),
                    is_active: true,
                    stripe_subscription_id: session.subscription,
                    stripe_customer_id: stripeCustomerId
                });
            }

            // Notify user
            await base44.asServiceRole.entities.Notification.create({
                recipient_email: userEmail,
                title: 'Subscrição Ativa',
                message: `A sua subscrição ${planType.toUpperCase()} foi ativada com sucesso!`,
                type: 'system',
                priority: 'high'
            });
        }
    } else if (bookingId) {
        // Handle booking payment - keep as pending so walker can accept
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (bookings.length > 0) {
            const booking = bookings[0];
            await base44.asServiceRole.entities.Booking.update(bookingId, {
                payment_status: 'held',
                status: 'pending'
            });
            // Notify walker about new paid booking
            if (booking.walker_email) {
                await base44.asServiceRole.entities.Notification.create({
                    recipient_email: booking.walker_email,
                    title: '💰 Nova Reserva Paga!',
                    message: `${booking.owner_name || 'Um cliente'} pagou uma reserva para ${booking.dog_name || 'o seu animal'} em ${booking.walk_date || session.metadata?.walk_date || ''}. Aceite agora!`,
                    type: 'booking',
                    related_id: bookingId,
                    icon: '🐾'
                });
            }
            // Notify owner of successful payment
            const ownerEmail = booking.owner_email || booking.created_by;
            if (ownerEmail) {
                await base44.asServiceRole.entities.Notification.create({
                    recipient_email: ownerEmail,
                    title: '✅ Pagamento Confirmado',
                    message: `O seu pagamento foi recebido. Aguarde a aceitação do profissional.`,
                    type: 'payment',
                    related_id: bookingId,
                    icon: '✅'
                });
            }
        }
    }
}

async function handleSubscriptionUpdated(base44, subscription) {
    const customerId = subscription.customer;
    const subscriptionId = subscription.id;

    // Find subscription in database
    const ownerSubs = await base44.asServiceRole.entities.OwnerSubscription.filter({
        stripe_subscription_id: subscriptionId
    });

    const walkerSubs = await base44.asServiceRole.entities.WalkerSubscription.filter({
        stripe_subscription_id: subscriptionId
    });

    const allSubs = [...ownerSubs, ...walkerSubs];
    
    if (allSubs.length > 0) {
        const sub = allSubs[0];
        const isOwner = ownerSubs.length > 0;
        const entityName = isOwner ? 'OwnerSubscription' : 'WalkerSubscription';

        // Update subscription status
        await base44.asServiceRole.entities[entityName].update(sub.id, {
            is_active: subscription.status === 'active',
            auto_renew: !subscription.cancel_at_period_end
        });
    }
}

async function handleSubscriptionDeleted(base44, subscription) {
    const subscriptionId = subscription.id;

    // Find and deactivate subscription
    const ownerSubs = await base44.asServiceRole.entities.OwnerSubscription.filter({
        stripe_subscription_id: subscriptionId
    });

    const walkerSubs = await base44.asServiceRole.entities.WalkerSubscription.filter({
        stripe_subscription_id: subscriptionId
    });

    const allSubs = [...ownerSubs, ...walkerSubs];
    
    if (allSubs.length > 0) {
        const sub = allSubs[0];
        const isOwner = ownerSubs.length > 0;
        const entityName = isOwner ? 'OwnerSubscription' : 'WalkerSubscription';
        const userEmail = isOwner ? sub.owner_email : sub.walker_email;

        await base44.asServiceRole.entities[entityName].update(sub.id, {
            is_active: false,
            end_date: new Date().toISOString()
        });

        // Notify user
        await base44.asServiceRole.entities.Notification.create({
            recipient_email: userEmail,
            title: 'Subscrição Cancelada',
            message: 'A sua subscrição foi cancelada. Esperamos vê-lo de volta em breve!',
            type: 'system',
            priority: 'high'
        });
    }
}

async function handleInvoicePaymentSucceeded(base44, invoice) {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) return;

    // Find subscription
    const ownerSubs = await base44.asServiceRole.entities.OwnerSubscription.filter({
        stripe_subscription_id: subscriptionId
    });

    const walkerSubs = await base44.asServiceRole.entities.WalkerSubscription.filter({
        stripe_subscription_id: subscriptionId
    });

    const allSubs = [...ownerSubs, ...walkerSubs];
    
    if (allSubs.length > 0) {
        const sub = allSubs[0];
        const isOwner = ownerSubs.length > 0;
        const entityName = isOwner ? 'OwnerSubscription' : 'WalkerSubscription';
        const userEmail = isOwner ? sub.owner_email : sub.walker_email;

        // Calculate next billing date
        const nextBillingDate = new Date(invoice.period_end * 1000);

        await base44.asServiceRole.entities[entityName].update(sub.id, {
            next_billing_date: nextBillingDate.toISOString(),
            is_active: true
        });

        // Notify user
        await base44.asServiceRole.entities.Notification.create({
            recipient_email: userEmail,
            title: 'Pagamento Processado',
            message: `O pagamento da sua subscrição foi processado com sucesso. Próxima cobrança: ${nextBillingDate.toLocaleDateString('pt-PT')}`,
            type: 'payment',
            priority: 'normal'
        });
    }
}

async function handleInvoicePaymentFailed(base44, invoice) {
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) return;

    // Find subscription
    const ownerSubs = await base44.asServiceRole.entities.OwnerSubscription.filter({
        stripe_subscription_id: subscriptionId
    });

    const walkerSubs = await base44.asServiceRole.entities.WalkerSubscription.filter({
        stripe_subscription_id: subscriptionId
    });

    const allSubs = [...ownerSubs, ...walkerSubs];
    
    if (allSubs.length > 0) {
        const sub = allSubs[0];
        const isOwner = ownerSubs.length > 0;
        const userEmail = isOwner ? sub.owner_email : sub.walker_email;

        // Notify user
        await base44.asServiceRole.entities.Notification.create({
            recipient_email: userEmail,
            title: 'Falha no Pagamento',
            message: 'O pagamento da sua subscrição falhou. Por favor, atualize o seu método de pagamento para continuar a usufruir dos benefícios.',
            type: 'payment',
            priority: 'urgent'
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