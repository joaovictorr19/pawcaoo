import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { referralCode, newUserEmail, newUserName } = await req.json();

        if (!referralCode || !newUserEmail) {
            return Response.json({ 
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        // Encontrar utilizador que possui este código
        const referrers = await base44.asServiceRole.entities.User.filter({
            referral_code: referralCode
        });

        if (referrers.length === 0) {
            return Response.json({ 
                error: 'Invalid referral code' 
            }, { status: 404 });
        }

        const referrer = referrers[0];

        // Cannot refer yourself
        if (referrer.email === newUserEmail) {
            return Response.json({
                error: 'Cannot refer yourself'
            }, { status: 400 });
        }

        // Check referrer account standing
        if (referrer.is_suspended || referrer.is_banned) {
            return Response.json({
                error: 'Referrer account is not in good standing'
            }, { status: 403 });
        }

        // Check if referee was already referred by anyone
        const existing = await base44.asServiceRole.entities.Referral.filter({
            referee_email: newUserEmail
        });

        if (existing.length > 0) {
            return Response.json({
                error: 'User already referred'
            }, { status: 400 });
        }

        // Rate limit: max 10 referrals per referrer per 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const recentReferrals = await base44.asServiceRole.entities.Referral.filter({
            referrer_email: referrer.email,
            created_date: { '$gte': oneDayAgo }
        });

        if (recentReferrals.length >= 10) {
            return Response.json({
                error: 'Referral limit reached. Maximum 10 referrals per 24 hours.'
            }, { status: 429 });
        }

        // Criar registo de indicação
        const referral = await base44.asServiceRole.entities.Referral.create({
            referrer_email: referrer.email,
            referrer_code: referralCode,
            referee_email: newUserEmail,
            referee_name: newUserName || newUserEmail,
            status: 'pending',
            points_awarded_referrer: 0,
            points_awarded_referee: 0,
            first_booking_completed: false,
            total_referee_value: 0
        });

        // Dar 100 pontos de boas-vindas ao novo utilizador
        await awardWelcomePoints(base44, newUserEmail, referral.id);

        // Notificar indicador
        await base44.asServiceRole.entities.Notification.create({
            recipient_email: referrer.email,
            title: '🎉 Nova Indicação!',
            message: `${newUserName || newUserEmail} registou-se com o seu código! Ganhe 200 pontos quando fizer a primeira reserva.`,
            type: 'system',
            priority: 'normal'
        });

        return Response.json({ 
            success: true,
            referral,
            message: 'Referral processed successfully'
        });

    } catch (error) {
        console.error('Process referral error:', error);
        return Response.json({
            error: 'Failed to process referral'
        }, { status: 500 });
    }
});

async function awardWelcomePoints(base44, userEmail, referralId) {
    // Buscar ou criar LoyaltyPoints
    let loyaltyRecords = await base44.asServiceRole.entities.LoyaltyPoints.filter({
        user_email: userEmail
    });

    let loyaltyRecord = loyaltyRecords[0];

    if (!loyaltyRecord) {
        loyaltyRecord = await base44.asServiceRole.entities.LoyaltyPoints.create({
            user_email: userEmail,
            points_balance: 100,
            total_earned: 100,
            total_redeemed: 0,
            tier: 'bronze',
            achievements: [],
            lifetime_bookings: 0,
            lifetime_redemptions: 0
        });
    } else {
        await base44.asServiceRole.entities.LoyaltyPoints.update(loyaltyRecord.id, {
            points_balance: (loyaltyRecord.points_balance || 0) + 100,
            total_earned: (loyaltyRecord.total_earned || 0) + 100
        });
    }

    // Criar transação
    await base44.asServiceRole.entities.PointsTransaction.create({
        user_email: userEmail,
        transaction_type: 'bonus',
        points_amount: 100,
        description: 'Bónus de boas-vindas por indicação',
        balance_after: (loyaltyRecord.points_balance || 0) + 100
    });

    // Notificar novo utilizador
    await base44.asServiceRole.entities.Notification.create({
        recipient_email: userEmail,
        title: '🎁 100 PawPoints de Bónus!',
        message: 'Bem-vindo ao PawCão! Recebeu 100 pontos por se registar através de uma indicação.',
        type: 'system',
        priority: 'high'
    });
}