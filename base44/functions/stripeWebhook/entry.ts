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
                if (session?.metadata?.wallet_topup === 'true' || session?.metadata?.wallet_topup === true) {
                    await handleWalletTopup(base44, session);
                } else {
                    await handleCheckoutCompleted(base44, session);
                }
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

    // Get actual platform fee from metadata (set by checkout function) — NOT a fixed value
    let metadataFee = parseFloat(paymentIntent.metadata?.platform_fee);
    if (isNaN(metadataFee)) metadataFee = null;

    console.log('💰 ========== PAYMENT SUCCESS WEBHOOK ==========');
    console.log('   Booking ID:', bookingId);
    console.log('   Amount:', paymentIntent.amount / 100);
    console.log('   Platform fee from metadata:', metadataFee);

    if (!bookingId && !emergencyWalkId) {
        console.log('❌ No booking or emergency walk ID in payment metadata');
        return;
    }

    // Update payment record
    const payments = await base44.asServiceRole.entities.Payment.filter({
        stripe_payment_intent_id: paymentIntent.id
    });

    if (payments.length > 0) {
        const payment = payments[0];
        // Use the correct platform fee: from metadata, or keep existing payment value
        const feeToApply = metadataFee !== null ? metadataFee : (payment.platform_fee || 0);
        await base44.asServiceRole.entities.Payment.update(payment.id, {
            status: 'held',
            held_date: new Date().toISOString(),
            platform_fee: feeToApply
        });
        console.log('✅ Payment record updated with platform fee €' + feeToApply);
    }

    // Update booking if exists
    if (bookingId) {
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (bookings.length > 0) {
            const booking = bookings[0];

            // ── SECURITY: Verify paid amount matches booking total before processing ──
            const expectedAmountCents = Math.round((booking.total_amount || 0) * 100);
            if (paymentIntent.amount < expectedAmountCents) {
                console.error(`❌ Amount mismatch: paid ${paymentIntent.amount} cents, expected ${expectedAmountCents} cents for booking ${bookingId}. Aborting.`);
                await base44.asServiceRole.entities.Notification.create({
                    recipient_email: booking.owner_email || booking.created_by,
                    title: 'Pagamento com valor incorreto',
                    message: 'O valor pago não corresponde ao valor da reserva. Contacte o suporte.',
                    type: 'payment',
                    related_id: bookingId,
                    priority: 'urgent'
                });
                return;
            }

            console.log('📋 Found booking:', booking.dog_name);
            console.log('   Walker Email:', booking.walker_email);
            console.log('   Walker ID:', booking.walker_id);
            console.log('   Owner Email:', booking.owner_email || booking.created_by);
            
            // CHECK WALKER COMMISSION SETTINGS (full check, not just exempt flag)
            const walkerProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({
                id: booking.walker_id
            });
            const walkerProfile = walkerProfiles[0];
            let actualPlatformFee = metadataFee !== null ? metadataFee : (booking.platform_fee || 0);
            let actualServiceAmount = booking.service_amount || 0;

            if (walkerProfile) {
                const mode = walkerProfile.commission_rate_mode || 'default';
                const isExempt = walkerProfile.exempt_from_platform_fees === true || mode === 'zero';
                const isTempExempt = mode === 'zero_temporary' && walkerProfile.commission_rate_expiry &&
                    new Date() <= new Date(walkerProfile.commission_rate_expiry);

                if (isExempt || isTempExempt) {
                    actualPlatformFee = 0;
                    actualServiceAmount = booking.total_amount || actualServiceAmount;
                } else if (mode === 'custom_percent' && walkerProfile.custom_commission_rate != null) {
                    actualPlatformFee = Math.round((actualServiceAmount * Number(walkerProfile.custom_commission_rate) / 100) * 100) / 100;
                }
            }

            console.log('   Walker commission mode:', walkerProfile?.commission_rate_mode || 'default');
            console.log('   Platform fee applied:', actualPlatformFee);
            
            // Platform fee handling is processed at release time (after service completion).
            // No money movement here on payment success to avoid early/incorrect transfers.

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

async function handleWalletTopup(base44, session) {
    try {
        const amountEuro = (session.amount_total || 0) / 100;
        const userEmail = session?.customer_details?.email || session?.customer_email || session?.metadata?.user_email;
        if (!userEmail || amountEuro <= 0) return;

        const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: userEmail });
        let wallet = wallets[0];
        if (!wallet) {
            wallet = await base44.asServiceRole.entities.UserWallet.create({
                user_email: userEmail,
                cashback_balance: 0,
                service_tokens: 0,
                total_points: 0,
                available_balance: 0,
                pending_balance: 0,
                total_earnings: 0
            });
        }
        const newBalance = (wallet.cashback_balance || 0) + amountEuro;
        await base44.asServiceRole.entities.UserWallet.update(wallet.id, { cashback_balance: newBalance });

        await base44.asServiceRole.entities.WalletTransaction.create({
            user_email: userEmail,
            transaction_type: 'topup',
            amount: amountEuro,
            description: 'Wallet top-up (Stripe)',
            balance_after: newBalance
        });

        await base44.asServiceRole.entities.Notification.create({
            recipient_email: userEmail,
            title: '💳 Crédito adicionado',
            message: `€${amountEuro.toFixed(2)} foram adicionados à sua carteira.`,
            type: 'payment'
        });
    } catch (e) {
        console.error('Wallet top-up handling error:', e);
    }
}

async function handleCheckoutCompleted(base44, session) {
    // ── HOTEL BOOKING: confirmar automaticamente após pagamento ──
    if (session.metadata?.type === 'hotel_booking') {
        const hotelBookingId = session.metadata?.hotel_booking_id;
        if (hotelBookingId) {
            try {
                const hotelBookings = await base44.asServiceRole.entities.HotelBooking.filter({ id: hotelBookingId });
                if (hotelBookings.length > 0) {
                    const hb = hotelBookings[0];

                // ── RACE CONDITION: Reserva cancelada por timeout mas pagamento chegou ──
                // O cliente pagou, mas a reserva foi auto-cancelada pelos 5 min.
                // Reembolsar automaticamente para não ficar com dinheiro sem serviço.
                if (hb.status === 'cancelled' || hb.payment_status === 'cancelled') {
                    console.log('⚠️ Hotel booking was auto-cancelled but payment arrived — refunding:', hotelBookingId);
                    try {
                        const refund = await stripe.refunds.create({
                            payment_intent: session.payment_intent || '',
                            reason: 'duplicate',
                            metadata: { hotel_booking_id: hotelBookingId, auto_refund: 'timeout_race' }
                        });
                        await base44.asServiceRole.entities.Notification.create({
                            recipient_email: hb.owner_email,
                            title: 'Reembolso Automático — Reserva Expirada',
                            message: `O pagamento chegou após o tempo limite da reserva no ${hb.hotel_name || 'hotel'}. Foi processado um reembolso automático de ${hb.total_amount}€. Faça uma nova reserva se pretender.`,
                            type: 'payment',
                            related_id: hotelBookingId,
                            icon: '🔄'
                        });
                        console.log('✅ Auto-refund processed for timed-out hotel booking:', refund.id);
                    } catch (refundErr) {
                        console.error('Auto-refund failed:', refundErr.message);
                    }
                    return;
                }

                // ── SECURITY: Verify paid amount matches hotel booking total before confirming ──
                    const expectedHotelAmountCents = Math.round((hb.total_amount || 0) * 100);
                    if ((session.amount_total || 0) < expectedHotelAmountCents) {
                        console.error(`❌ Hotel booking amount mismatch: paid ${session.amount_total} cents, expected ${expectedHotelAmountCents} cents for booking ${hotelBookingId}. Aborting.`);
                        return;
                    }

                    // ── NÃO auto-confirmar: manter como 'pending' para o hotel aceitar ou rejeitar ──
                    // O pagamento foi recebido (payment_status: 'paid'), mas o hotel ainda precisa de aceitar.
                    await base44.asServiceRole.entities.HotelBooking.update(hotelBookingId, {
                        payment_status: 'paid',
                        stripe_payment_intent_id: session.payment_intent || '',
                    });
                    console.log('✅ HotelBooking payment confirmed (awaiting hotel acceptance):', hotelBookingId);

                    // ── Vagas já foram reservadas na criação da reserva pendente (createHotelCheckout) ──
                    // Não decrementar novamente aqui para evitar dupla contagem.

                    // ── Creditar carteira do hotel com service_amount (pendente) ──
                    if (hb.hotel_email && (hb.service_amount || 0) > 0) {
                        try {
                            const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: hb.hotel_email });
                            let wallet = wallets[0];
                            if (!wallet) {
                                wallet = await base44.asServiceRole.entities.UserWallet.create({
                                    user_email: hb.hotel_email,
                                    cashback_balance: 0,
                                    service_tokens: 0,
                                    total_points: 0,
                                    available_balance: 0,
                                    pending_balance: 0,
                                    total_earnings: 0
                                });
                            }
                            const newPending = (wallet.pending_balance || 0) + (hb.service_amount || 0);
                            const newTotalEarnings = (wallet.total_earnings || 0) + (hb.service_amount || 0);
                            await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
                                pending_balance: newPending,
                                total_earnings: newTotalEarnings
                            });

                            await base44.asServiceRole.entities.WalletTransaction.create({
                                user_email: hb.hotel_email,
                                transaction_type: 'walker_payment_pending',
                                amount: hb.service_amount,
                                description: `Reserva de hotel — ${hb.hotel_name || 'hotel'} (${hb.checkin_date})`,
                                related_booking_id: hotelBookingId,
                                balance_after: newPending
                            });
                            console.log('✅ Hotel wallet credited (pending): €' + hb.service_amount);
                        } catch (e) {
                            console.error('Error crediting hotel wallet:', e);
                        }
                    }

                    // ── Registar comissão no cofre da plataforma (PlatformRevenue) ──
                    if ((hb.platform_fee || 0) > 0) {
                        try {
                            const periodMonth = new Date().toISOString().slice(0, 7);
                            await base44.asServiceRole.entities.PlatformRevenue.create({
                                revenue_type: 'commission',
                                source_id: hotelBookingId,
                                user_email: hb.hotel_email || '',
                                gross_amount: hb.total_amount || 0,
                                cost_amount: hb.service_amount || 0,
                                net_profit: hb.platform_fee,
                                description: `Comissão reserva hotel — ${hb.hotel_name || ''} (${hb.checkin_date})`,
                                period_month: periodMonth
                            });
                            console.log('✅ Platform revenue recorded: €' + hb.platform_fee);
                        } catch (e) {
                            console.error('Error recording platform revenue:', e);
                        }
                    }

                    // Notificar hotel — pagamento recebido, aguardando aceitação
                    if (hb.hotel_email) {
                        await base44.asServiceRole.entities.Notification.create({
                            recipient_email: hb.hotel_email,
                            title: '💳 Nova Reserva PAGA — Aceite ou Rejeite!',
                            message: `${hb.owner_name} pagou a reserva de ${(hb.dogs || []).map(d => d.dog_name).join(', ') || 'animal'}. Check-in: ${hb.checkin_date}. Aceite ou rejeite agora no seu painel.`,
                            type: 'booking',
                            related_id: hotelBookingId,
                            icon: '🏨'
                        });
                    }
                    // Notificar cliente — pagamento recebido, aguardando confirmação do hotel
                    if (hb.owner_email) {
                        await base44.asServiceRole.entities.Notification.create({
                            recipient_email: hb.owner_email,
                            title: '⏳ Pagamento Recebido — Aguardando Confirmação',
                            message: `O seu pagamento foi processado. Aguarde a confirmação do hotel ${hb.hotel_name || ''}.`,
                            type: 'payment',
                            related_id: hotelBookingId,
                            icon: '⏳'
                        });

                        // ── Enviar email de confirmação ao cliente (só após pagamento) ──
                        try {
                            const svcLabels = {
                                boarding: 'Alojamento', daycare: 'Creche Diurna', grooming: 'Grooming',
                                walk_with_partner: 'Passeio com Parceiro', training: 'Treino'
                            };
                            const svcLabel = svcLabels[hb.service_type] || hb.service_type;
                            const dogNames = (hb.dogs || []).map(d => d.dog_name).filter(Boolean).join(', ') || 'animal';

                            const emailBody = [
                                `Olá ${hb.owner_name || ''},`,
                                ``,
                                `O seu pagamento foi processado com sucesso! A sua reserva no ${hb.hotel_name || 'hotel'} está agora a aguardar confirmação do hotel.`,
                                ``,
                                `Detalhes da Reserva:`,
                                `Serviço: ${svcLabel}`,
                                `Animais: ${dogNames}`,
                                `Check-in: ${hb.checkin_date}${hb.checkin_time ? ' às ' + hb.checkin_time : ''}`,
                                `Check-out: ${hb.checkout_date}${hb.checkout_time ? ' às ' + hb.checkout_time : ''}`,
                                `Duração: ${hb.total_nights} ${hb.total_nights === 1 ? 'noite' : 'noites'}`,
                                ``,
                                `Resumo de valores:`,
                                `Serviço: ${hb.service_amount}€`,
                                `Taxa de plataforma: ${hb.platform_fee}€`,
                                `Total pago: ${hb.total_amount}€`,
                                ``,
                                `Obrigado por escolher a PawCão!`,
                            ].join('\n');

                            await base44.asServiceRole.integrations.Core.SendEmail({
                                to: hb.owner_email,
                                subject: `Pagamento recebido — ${hb.hotel_name || 'Hotel'} (aguardando confirmação)`,
                                body: emailBody,
                            });
                            console.log('✅ Hotel booking confirmation email sent to:', hb.owner_email);
                        } catch (e) {
                            console.error('Error sending hotel confirmation email:', e);
                        }

                        // ── Enviar email de confirmação ao hotel (só após pagamento) ──
                        if (hb.hotel_email) {
                            try {
                                const hotelEmailBody = [
                                    `Nova reserva PAGA — aguardando a sua confirmação!`,
                                    ``,
                                    `Cliente: ${hb.owner_name || ''} (${hb.owner_email || ''})`,
                                    `Animais: ${dogNames}`,
                                    `Serviço: ${svcLabel}`,
                                    `Check-in: ${hb.checkin_date}${hb.checkin_time ? ' às ' + hb.checkin_time : ''}`,
                                    `Check-out: ${hb.checkout_date}${hb.checkout_time ? ' às ' + hb.checkout_time : ''}`,
                                    `Duração: ${hb.total_nights} ${hb.total_nights === 1 ? 'noite' : 'noites'}`,
                                    `Total pago: ${hb.total_amount}€`,
                                    ``,
                                    `Aceda ao seu painel para gerir esta reserva.`,
                                ].join('\n');

                                await base44.asServiceRole.integrations.Core.SendEmail({
                                    to: hb.hotel_email,
                                    subject: `Nova reserva PAGA — ${hb.owner_name || 'Cliente'} (${hb.checkin_date})`,
                                    body: hotelEmailBody,
                                });
                                console.log('✅ Hotel notification email sent to:', hb.hotel_email);
                            } catch (e) {
                                console.error('Error sending hotel notification email:', e);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Error confirming hotel booking:', e);
            }
        }
        return;
    }

    // ── HOTEL ADD-ON: marcar como pago e creditar hotel com valor líquido ──
    if (session.metadata?.type === 'hotel_addon') {
        const hotelBookingId = session.metadata?.booking_id;
        const addOnIndexStr = session.metadata?.add_on_index;
        if (hotelBookingId && addOnIndexStr !== undefined) {
            try {
                const addOnIndex = parseInt(addOnIndexStr, 10);
                const hotelBookings = await base44.asServiceRole.entities.HotelBooking.filter({ id: hotelBookingId });
                if (hotelBookings.length > 0) {
                    const hb = hotelBookings[0];
                    const addOns = hb.add_ons || [];
                    const addOn = addOns[addOnIndex];

                    if (addOn) {
                        const grossAmount = addOn.total_price || 0;
                        const commissionRate = parseFloat(session.metadata?.commission_rate) || 0;
                        const commissionAmount = parseFloat(session.metadata?.commission_amount) || 0;
                        const hotelNetAmount = parseFloat(session.metadata?.hotel_net_amount) || (grossAmount - commissionAmount);

                        // Mark add-on as paid
                        const newAddOns = [...addOns];
                        newAddOns[addOnIndex] = {
                            ...addOn,
                            paid: true,
                            payment_status: 'paid',
                            payment_method: 'stripe',
                            paid_at: new Date().toISOString(),
                            commission_rate: commissionRate || undefined,
                            commission_amount: commissionAmount || undefined,
                            hotel_net_amount: hotelNetAmount,
                        };

                        await base44.asServiceRole.entities.HotelBooking.update(hotelBookingId, {
                            add_ons: newAddOns,
                            add_ons_total: newAddOns.reduce((s, a) => s + (a.total_price || 0), 0),
                            service_amount: (hb.service_amount || 0) + hotelNetAmount,
                            platform_fee: (hb.platform_fee || 0) + commissionAmount,
                        });
                        console.log('✅ Hotel add-on marked as paid:', hotelBookingId, 'index', addOnIndex);

                        // Credit hotel wallet (pending)
                        if (hb.hotel_email && hotelNetAmount > 0) {
                            try {
                                const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: hb.hotel_email });
                                let wallet = wallets[0];
                                if (!wallet) {
                                    wallet = await base44.asServiceRole.entities.UserWallet.create({
                                        user_email: hb.hotel_email,
                                        cashback_balance: 0, service_tokens: 0, total_points: 0,
                                        available_balance: 0, pending_balance: 0, total_earnings: 0
                                    });
                                }
                                const newPending = (wallet.pending_balance || 0) + hotelNetAmount;
                                const newTotalEarnings = (wallet.total_earnings || 0) + hotelNetAmount;
                                await base44.asServiceRole.entities.UserWallet.update(wallet.id, {
                                    pending_balance: newPending,
                                    total_earnings: newTotalEarnings
                                });
                                await base44.asServiceRole.entities.WalletTransaction.create({
                                    user_email: hb.hotel_email,
                                    transaction_type: 'walker_payment_pending',
                                    amount: hotelNetAmount,
                                    description: `Serviço/Produto extra — ${addOn.service_name} (${hb.hotel_name || 'hotel'})`,
                                    related_booking_id: hotelBookingId,
                                    balance_after: newPending
                                });
                            } catch (e) { console.error('Error crediting hotel wallet for add-on:', e); }
                        }

                        // Record platform commission revenue
                        if (commissionAmount > 0) {
                            try {
                                await base44.asServiceRole.entities.PlatformRevenue.create({
                                    revenue_type: 'commission',
                                    source_id: hotelBookingId,
                                    user_email: hb.hotel_email || '',
                                    gross_amount: grossAmount,
                                    cost_amount: hotelNetAmount,
                                    net_profit: commissionAmount,
                                    description: `Comissão ${commissionRate}% — produto/serviço "${addOn.service_name}" (Stripe)`,
                                    period_month: new Date().toISOString().slice(0, 7),
                                });
                            } catch (e) { console.error('PlatformRevenue create error (add-on):', e); }
                        }

                        // Notify hotel
                        if (hb.hotel_email) {
                            await base44.asServiceRole.entities.Notification.create({
                                recipient_email: hb.hotel_email,
                                title: '✅ Serviço/Produto Pago',
                                message: `Cliente pagou ${grossAmount.toFixed(2)}€ por "${addOn.service_name}". Comissão: ${commissionAmount.toFixed(2)}€ · Líquido: ${hotelNetAmount.toFixed(2)}€.`,
                                type: 'payment',
                                related_id: hotelBookingId,
                                icon: '✅'
                            });
                        }
                    }
                }
            } catch (e) {
                console.error('Error processing hotel add-on payment:', e);
            }
        }
        return;
    }

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
    } else if (!bookingId && session.metadata?.type === 'booking') {
        const pickupToken = `PK-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
        const dropoffToken = `DO-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

        const booking = await base44.asServiceRole.entities.Booking.create({
            walker_id: session.metadata?.professional_type === 'walker' ? session.metadata?.professional_id : undefined,
            trainer_id: session.metadata?.professional_type === 'trainer' ? session.metadata?.professional_id : undefined,
            walker_name: session.metadata?.professional_type === 'walker' ? session.metadata?.professional_name : undefined,
            walker_email: session.metadata?.professional_type === 'walker' ? session.metadata?.professional_email : undefined,
            trainer_name: session.metadata?.professional_type === 'trainer' ? session.metadata?.professional_name : undefined,
            trainer_email: session.metadata?.professional_type === 'trainer' ? session.metadata?.professional_email : undefined,
            walker_payment_contact: '',
            owner_name: session.metadata?.owner_name,
            owner_email: session.metadata?.owner_email || session.customer_email,
            owner_phone: session.metadata?.owner_phone || '',
            dog_name: session.metadata?.dog_name,
            dog_size: session.metadata?.dog_size,
            walk_date: session.metadata?.walk_date,
            walk_time: session.metadata?.walk_time,
            session_date: session.metadata?.type === 'training' ? session.metadata?.walk_date : undefined,
            session_time: session.metadata?.type === 'training' ? session.metadata?.walk_time : undefined,
            duration_hours: Number(session.metadata?.duration_hours || 1),
            service_amount: Number(session.metadata?.service_amount || 0),
            platform_fee: Number(session.metadata?.platform_fee || 0),
            total_amount: Number(session.metadata?.total_amount || 0),
            special_notes: session.metadata?.special_notes || '',
            pickup_address: session.metadata?.pickup_address || '',
            pickup_lat: session.metadata?.pickup_lat ? Number(session.metadata.pickup_lat) : undefined,
            pickup_lng: session.metadata?.pickup_lng ? Number(session.metadata.pickup_lng) : undefined,
            share_whatsapp_live_location: session.metadata?.share_whatsapp_live_location === 'true',
            payment_status: 'held',
            status: 'pending',
            type: session.metadata?.type || 'walk',
            pickup_token: pickupToken,
            dropoff_token: dropoffToken
        });

        if (booking.walker_email || booking.trainer_email) {
            const professionalEmail = booking.walker_email || booking.trainer_email;
            await base44.asServiceRole.entities.Notification.create({
                recipient_email: professionalEmail,
                title: '💰 Nova Reserva Paga!',
                message: `${booking.owner_name || 'Um cliente'} pagou uma reserva para ${booking.dog_name || 'o seu animal'} em ${booking.walk_date || ''}. Aceite agora!`,
                type: 'booking',
                related_id: booking.id,
                icon: '🐾'
            });
        }

        const ownerEmail = booking.owner_email || booking.created_by;
        if (ownerEmail) {
            await base44.asServiceRole.entities.Notification.create({
                recipient_email: ownerEmail,
                title: '✅ Pagamento Confirmado',
                message: 'O seu pagamento foi recebido. Aguarde a aceitação do profissional.',
                type: 'payment',
                related_id: booking.id,
                icon: '✅'
            });
        }
    } else if (bookingId) {
        const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
        if (bookings.length > 0) {
            const booking = bookings[0];
            await base44.asServiceRole.entities.Booking.update(bookingId, {
                payment_status: 'held',
                status: 'pending'
            });
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

        // ── Libertar automaticamente pagamentos retidos assim que a conta fica ativa ──
        if (canAcceptPayments) {
            await releasePendingPayouts(base44, profile.created_by, account.id);
        }
    }
}

async function releasePendingPayouts(base44, professionalEmail, stripeAccountId) {
    if (!professionalEmail || !stripeAccountId) return;
    try {
        const pending = await base44.asServiceRole.entities.WalkerPayout.filter({
            walker_email: professionalEmail
        });
        const toRelease = pending.filter(p =>
            ['failed', 'pending', 'pending_stripe_setup'].includes(p.status) && !p.stripe_transfer_id
        );

        let totalReleased = 0;
        for (const payout of toRelease) {
            const amount = Number(payout.net_amount || 0);
            if (amount <= 0) continue;

            try {
                const transfer = await stripe.transfers.create({
                    amount: Math.round(amount * 100),
                    currency: 'eur',
                    destination: stripeAccountId,
                    transfer_group: `release_booking_${payout.booking_id}`,
                    metadata: {
                        booking_id: payout.booking_id || '',
                        walker_email: professionalEmail,
                        auto_release: 'true',
                        payout_id: payout.id
                    }
                });

                await base44.asServiceRole.entities.WalkerPayout.update(payout.id, {
                    status: 'completed',
                    stripe_transfer_id: transfer.id,
                    paid_at: new Date().toISOString(),
                    notes: `Auto-released after Stripe Connect activation (${transfer.id})`
                });

                // Atualizar Payment e Booking associados
                if (payout.booking_id) {
                    const payments = await base44.asServiceRole.entities.Payment.filter({ booking_id: payout.booking_id });
                    if (payments[0]) {
                        await base44.asServiceRole.entities.Payment.update(payments[0].id, {
                            status: 'released',
                            released_date: new Date().toISOString(),
                            stripe_transfer_id: transfer.id
                        });
                    }
                    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: payout.booking_id });
                    if (bookings[0]) {
                        await base44.asServiceRole.entities.Booking.update(payout.booking_id, {
                            status: 'completed',
                            payment_status: 'released'
                        });
                    }
                }

                totalReleased += amount;
            } catch (transferError) {
                console.error(`Auto-release transfer failed for payout ${payout.id}:`, transferError.message);
            }
        }

        if (totalReleased > 0) {
            // Limpar pendentes na carteira do profissional
            try {
                const wallets = await base44.asServiceRole.entities.UserWallet.filter({ user_email: professionalEmail });
                if (wallets[0]) {
                    const newPending = Math.max(0, (wallets[0].pending_walker_payments || 0) - totalReleased);
                    await base44.asServiceRole.entities.UserWallet.update(wallets[0].id, {
                        pending_walker_payments: newPending
                    });
                }
            } catch (e) {
                console.error('Error updating professional wallet after release:', e);
            }

            await base44.asServiceRole.entities.Notification.create({
                recipient_email: professionalEmail,
                title: '💸 Pagamentos retidos libertados!',
                message: `€${totalReleased.toFixed(2)} que estavam pendentes foram transferidos para a sua conta Stripe.`,
                type: 'payment',
                priority: 'high'
            });
            console.log(`✅ Auto-released €${totalReleased} to ${professionalEmail}`);
        }
    } catch (e) {
        console.error('releasePendingPayouts error:', e);
    }
}

async function adjustHotelCapacity(base44, hotelProfileId, serviceType, delta) {
    if (!hotelProfileId || !serviceType) return;
    try {
        const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({ id: hotelProfileId });
        if (profiles.length === 0) return;

        const profile = profiles[0];
        const hd = profile.hotel_details || {};
        const services = (hd.services || []).map(s => {
            if (s.service_type === serviceType) {
                const current = s.capacity_available ?? 0;
                const updated = Math.max(0, Math.min(s.capacity_total ?? current, current + delta));
                return { ...s, capacity_available: updated };
            }
            return s;
        });

        const topCurrent = hd.capacity_available ?? 0;
        const topUpdated = Math.max(0, Math.min(hd.capacity_total ?? topCurrent, topCurrent + delta));

        await base44.asServiceRole.entities.WalkerProfile.update(profile.id, {
            hotel_details: { ...hd, capacity_available: topUpdated, services }
        });
        console.log(`🏨 Hotel capacity adjusted: ${serviceType} ${delta > 0 ? '+' : ''}${delta} (profile ${hotelProfileId})`);
    } catch (e) {
        console.error('Error adjusting hotel capacity:', e);
    }
}

async function handleChargeRefunded(base44, charge) {
    const paymentIntentId = charge.payment_intent;

    // ── Hotel booking refund: restaurar vagas ──
    const hotelBookings = await base44.asServiceRole.entities.HotelBooking.filter({
        stripe_payment_intent_id: paymentIntentId
    });
    if (hotelBookings.length > 0) {
        const hb = hotelBookings[0];
        await base44.asServiceRole.entities.HotelBooking.update(hb.id, {
            status: 'cancelled',
            payment_status: 'refunded'
        });
        await adjustHotelCapacity(base44, hb.hotel_profile_id, hb.service_type, (hb.total_dogs || 1));

        if (hb.owner_email) {
            await base44.asServiceRole.entities.Notification.create({
                recipient_email: hb.owner_email,
                title: 'Reembolso Processado',
                message: `O reembolso da sua reserva no ${hb.hotel_name || 'hotel'} foi processado.`,
                type: 'payment',
                related_id: hb.id
            });
        }
        return;
    }

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