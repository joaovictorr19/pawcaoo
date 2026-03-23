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

    console.log('PawPoints webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Verificar se é um resgate de PawPoints
        if (session.metadata?.type === 'pawpoints_redemption' || session.metadata?.reward_id) {
          const metadata = session.metadata;
          const userEmail = metadata.user_email;
          const pointsSpent = parseInt(metadata.points_spent) || 0;
          const euroValue = parseFloat(metadata.euro_value) || 0;
          const redemptionCode = metadata.redemption_code;
          const tierDiscount = parseInt(metadata.tier_discount) || 0;

          // Buscar pontos do utilizador
          const loyaltyPoints = await base44.asServiceRole.entities.LoyaltyPoints.filter({
            user_email: userEmail
          });

          if (loyaltyPoints.length > 0) {
            const currentPoints = loyaltyPoints[0];
            const newBalance = currentPoints.points_balance - pointsSpent;
            const newTotalRedeemed = (currentPoints.total_redeemed || 0) + pointsSpent;
            const newRedemptions = (currentPoints.lifetime_redemptions || 0) + 1;

            // Atualizar pontos
            await base44.asServiceRole.entities.LoyaltyPoints.update(
              currentPoints.id,
              {
                points_balance: newBalance,
                total_redeemed: newTotalRedeemed,
                lifetime_redemptions: newRedemptions
              }
            );

            // Registar transação
            await base44.asServiceRole.entities.PointsTransaction.create({
              user_email: userEmail,
              transaction_type: 'redeemed',
              points_amount: -pointsSpent,
              description: `Resgatado: ${metadata.description} (${tierDiscount}% desconto tier) - Código: ${redemptionCode}`,
              balance_after: newBalance
            });

            // Criar registo de resgate
            await base44.asServiceRole.entities.Redemption.create({
              user_email: userEmail,
              user_name: metadata.user_name || userEmail,
              product_id: metadata.reward_id,
              product_name: metadata.description,
              partner_id: 'pawcao',
              partner_name: 'PawCão',
              points_spent: pointsSpent,
              euro_value: euroValue,
              status: 'confirmed',
              redemption_code: redemptionCode,
              stripe_payment_intent_id: session.payment_intent
            });

            // Notificar utilizador
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: userEmail,
              title: '🎉 Resgate PawPoints Confirmado',
              message: `Resgatou ${pointsSpent} pontos por ${metadata.description}. Código: ${redemptionCode}`,
              type: 'system',
              priority: 'normal',
              action_url: `/MyRedemptions`
            });

            // Verificar conquistas
            await checkAchievements(base44, currentPoints, newRedemptions, metadata.reward_id);

            console.log(`PawPoints redeemed: ${userEmail} - ${pointsSpent} points - Code: ${redemptionCode}`);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;

        if (metadata?.type === 'pawpoints_redemption' && metadata?.user_email) {
          // Notificar utilizador de falha no pagamento
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: metadata.user_email,
            title: '⚠️ Falha no Resgate PawPoints',
            message: 'O seu pagamento para resgate de pontos falhou. Por favor, tente novamente.',
            type: 'payment',
            priority: 'high'
          });

          console.log(`PawPoints redemption payment failed for ${metadata.user_email}`);
        }
        break;
      }
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('PawPoints webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper para verificar conquistas
async function checkAchievements(base44, loyaltyPoints, newRedemptions, rewardId) {
  try {
    const newAchievements = [];
    const existingIds = loyaltyPoints.achievements?.map(a => a.achievement_id) || [];

    if (newRedemptions === 1 && !existingIds.includes('first_redemption')) {
      newAchievements.push({
        achievement_id: 'first_redemption',
        name: 'Primeiro Resgate',
        description: 'Resgatou a primeira recompensa',
        icon: '🎁',
        earned_date: new Date().toISOString()
      });
    }

    if (newRedemptions >= 5 && !existingIds.includes('frequent_redeemer')) {
      newAchievements.push({
        achievement_id: 'frequent_redeemer',
        name: 'Resgatador Frequente',
        description: 'Resgatou 5+ recompensas',
        icon: '⭐',
        earned_date: new Date().toISOString()
      });
    }
    
    if (newRedemptions >= 10 && !existingIds.includes('power_redeemer')) {
      newAchievements.push({
        achievement_id: 'power_redeemer',
        name: 'Super Resgatador',
        description: 'Resgatou 10+ recompensas',
        icon: '💎',
        earned_date: new Date().toISOString()
      });
    }

    if (newAchievements.length > 0) {
      await base44.asServiceRole.entities.LoyaltyPoints.update(loyaltyPoints.id, {
        achievements: [...(loyaltyPoints.achievements || []), ...newAchievements]
      });

      // Notificar cada conquista
      for (const achievement of newAchievements) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: loyaltyPoints.user_email,
          title: `🏆 Conquista Desbloqueada: ${achievement.name}`,
          message: achievement.description,
          type: 'system',
          priority: 'normal'
        });
      }
    }
  } catch (error) {
    console.error('Achievement check error:', error);
  }
}