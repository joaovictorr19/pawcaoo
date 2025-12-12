import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount_euro, booking_id, activity_type } = await req.json();

    if (!amount_euro) {
      return Response.json({ error: 'Amount required' }, { status: 400 });
    }

    // Buscar pontos de fidelidade do usuário
    const loyaltyRecords = await base44.asServiceRole.entities.LoyaltyPoints.filter({
      user_email: user.email
    });

    let loyaltyRecord = loyaltyRecords[0];

    // Criar registo se não existir
    if (!loyaltyRecord) {
      loyaltyRecord = await base44.asServiceRole.entities.LoyaltyPoints.create({
        user_email: user.email,
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

    // Calcular pontos (10 pontos por €1, com multiplicador tier)
    const basePoints = Math.floor(amount_euro * 10);
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
      user_email: user.email,
      transaction_type: 'earned',
      points_amount: pointsEarned,
      description: `Ganhou ${pointsEarned} pontos por ${activity_type || 'serviço'} (€${amount_euro})`,
      balance_after: newBalance,
      related_booking_id: booking_id
    });

    // Verificar conquistas
    const achievements = loyaltyRecord.achievements || [];
    const existingIds = achievements.map(a => a.achievement_id);
    const newAchievements = [];

    if (newLifetimeBookings === 1 && !existingIds.includes('first_booking')) {
      newAchievements.push({
        achievement_id: 'first_booking',
        name: 'Primeira Reserva',
        description: 'Completou a primeira reserva',
        icon: '🎉',
        earned_date: new Date().toISOString()
      });
    }

    if (newLifetimeBookings >= 10 && !existingIds.includes('frequent_user')) {
      newAchievements.push({
        achievement_id: 'frequent_user',
        name: 'Utilizador Frequente',
        description: '10+ reservas completadas',
        icon: '🌟',
        earned_date: new Date().toISOString()
      });
    }

    if (newTier !== loyaltyRecord.tier && !existingIds.includes(`tier_${newTier}`)) {
      newAchievements.push({
        achievement_id: `tier_${newTier}`,
        name: `Tier ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}`,
        description: `Alcançou o tier ${newTier}!`,
        icon: newTier === 'silver' ? '🥈' : newTier === 'gold' ? '🥇' : '💎',
        earned_date: new Date().toISOString()
      });
    }

    if (newAchievements.length > 0) {
      await base44.asServiceRole.entities.LoyaltyPoints.update(loyaltyRecord.id, {
        achievements: [...achievements, ...newAchievements]
      });
    }

    return Response.json({
      success: true,
      points_earned: pointsEarned,
      new_balance: newBalance,
      multiplier: currentTier.multiplier,
      tier: newTier,
      tier_upgraded: newTier !== loyaltyRecord.tier,
      achievements: newAchievements
    });

  } catch (error) {
    console.error('Award points error:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});