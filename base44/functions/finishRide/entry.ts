import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ Autenticar Walker
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Receber dados
    const { rideId, photoUrl, forcedFinishReason, actualDistance } = await req.json();

    if (!rideId || !photoUrl) {
      return Response.json({ 
        error: 'rideId e photoUrl são obrigatórios' 
      }, { status: 400 });
    }

    // 1. Fetch booking
    const bookings = await base44.entities.Booking.filter({ id: rideId });
    if (!bookings || bookings.length === 0) {
      return Response.json({ error: 'Booking não encontrado' }, { status: 404 });
    }
    const booking = bookings[0];

    // 2. Verify walker ownership
    if (booking.walker_email !== user.email) {
      return Response.json({ 
        error: 'Você não tem permissão para finalizar este passeio' 
      }, { status: 403 });
    }

    // 3. Update booking to service_completed
    await base44.asServiceRole.entities.Booking.update(rideId, {
      status: 'service_completed',
      completed_date: new Date().toISOString(),
      drop_off_photo: photoUrl,
      forced_finish_reason: forcedFinishReason || null,
      actual_delivery_distance: actualDistance || null
    });

    // 4. Gamification: award XP
    try {
      const currentXP = user.gamification_xp || 0;
      const currentLevel = user.gamification_level || 1;
      const xpReward = 100; // XP por passeio concluído
      const newXP = currentXP + xpReward;
      
      // Cálculo simplificado de nível (cada 1000 XP = 1 nível)
      const newLevel = Math.floor(newXP / 1000) + 1;

      await base44.asServiceRole.auth.updateUser(user.id, {
        gamification_xp: newXP,
        gamification_level: newLevel
      });

    } catch (err) {
      console.error('Erro ao atualizar gamification:', err);
    }

    // 5. Notify client
    try {
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: booking.owner_email || booking.created_by,
        title: '✅ Passeio Concluído!',
        message: `${user.full_name} concluiu o passeio com ${booking.dog_name}. Veja a foto e confirme o pagamento de €${booking.service_amount}.`,
        type: 'booking',
        related_id: rideId,
        priority: 'high',
        action_url: `/MyBookings?review=${rideId}`
      });
    } catch (err) {
      console.error('Erro ao notificar cliente:', err);
    }

    // 6. Stripe payment capture
    try {
      if (booking.payment_id && booking.payment_status === 'held') {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        
        if (!stripeKey) {
          console.error('STRIPE_SECRET_KEY not configured');
        } else {
          // Importar Stripe dinamicamente
          const Stripe = (await import('npm:stripe@14.5.0')).default;
          const stripe = new Stripe(stripeKey);
          
          // Capturar pagamento autorizado
          const paymentIntent = await stripe.paymentIntents.capture(booking.payment_id);
          
          if (paymentIntent.status === 'succeeded') {
            // Atualizar status do pagamento na tabela Payment
            await base44.asServiceRole.entities.Payment.update(booking.payment_id, {
              status: 'released',
              payment_status: 'released',
              released_date: new Date().toISOString()
            });
            
            // Atualizar booking
            await base44.asServiceRole.entities.Booking.update(rideId, {
              payment_status: 'released'
            });
            
          }
        }
      }
    } catch (err) {
      console.error('❌ Erro ao processar pagamento Stripe:', err);
      // Não falhar a operação se o pagamento falhar - apenas logar
    }

    return Response.json({
      success: true,
      message: 'Passeio finalizado com sucesso!',
      booking: {
        id: rideId,
        status: 'service_completed',
        drop_off_photo: photoUrl
      }
    });

  } catch (error) {
    console.error('Finish ride error:', error);
    return Response.json({
      error: 'Failed to finish ride'
    }, { status: 500 });
  }
});