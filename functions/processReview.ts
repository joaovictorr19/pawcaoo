import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // ✅ Autenticar Cliente
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Receber dados da avaliação
    const { bookingId, rating, comment, tags } = await req.json();

    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return Response.json({ 
        error: 'bookingId e rating (1-5) são obrigatórios' 
      }, { status: 400 });
    }

    console.log('⭐ Processando avaliação:', bookingId, 'Rating:', rating);

    // ✅ 1. Buscar booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: bookingId });
    if (!bookings || bookings.length === 0) {
      return Response.json({ error: 'Booking não encontrado' }, { status: 404 });
    }
    const booking = bookings[0];

    // ✅ 2. Verificar se é o dono do booking
    if (booking.owner_email !== user.email && booking.created_by !== user.email) {
      return Response.json({ 
        error: 'Você não tem permissão para avaliar este passeio' 
      }, { status: 403 });
    }

    // ✅ 3. Verificar se já existe avaliação
    if (booking.review_id) {
      return Response.json({ 
        error: 'Este passeio já foi avaliado' 
      }, { status: 400 });
    }

    // ✅ 4. Criar Review
    const review = await base44.asServiceRole.entities.Review.create({
      booking_id: bookingId,
      walker_id: booking.walker_id,
      walker_name: booking.walker_name,
      trainer_id: booking.trainer_id,
      trainer_name: booking.trainer_name,
      reviewer_email: user.email,
      reviewer_name: user.full_name,
      rating: rating,
      comment: comment || '',
      is_verified: true
    });

    console.log('✅ Review criado:', review.id);

    // ✅ 5. Atualizar Booking com review_id
    await base44.asServiceRole.entities.Booking.update(bookingId, {
      review_id: review.id
    });

    // ✅ 6. Recalcular Média do Walker/Trainer
    try {
      const professionalId = booking.walker_id || booking.trainer_id;
      const entityType = booking.walker_id ? 'WalkerProfile' : 'TrainerProfile';
      
      if (professionalId) {
        // Buscar todas as reviews deste profissional
        const filter = booking.walker_id 
          ? { walker_id: professionalId }
          : { trainer_id: professionalId };
        
        const allReviews = await base44.asServiceRole.entities.Review.filter(filter);
        
        if (allReviews.length > 0) {
          const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
          const averageRating = parseFloat((totalRating / allReviews.length).toFixed(2));
          
          // Atualizar perfil do profissional
          await base44.asServiceRole.entities[entityType].update(professionalId, {
            rating: averageRating,
            total_walks: booking.walker_id ? (allReviews.length) : undefined,
            total_clients: booking.trainer_id ? (allReviews.length) : undefined
          });
          
          console.log(`📊 Média recalculada: ${averageRating} (${allReviews.length} reviews)`);
        }
      }
    } catch (err) {
      console.error('❌ Erro ao recalcular média:', err);
    }

    // ✅ 7. Gamification: XP para o Cliente (+50 XP)
    try {
      const currentXP = user.gamification_xp || 0;
      await base44.asServiceRole.auth.updateUser(user.id, {
        gamification_xp: currentXP + 50
      });
      console.log('🎮 Cliente ganhou +50 XP');
    } catch (err) {
      console.error('Erro ao atualizar XP do cliente:', err);
    }

    // ✅ 8. Gamification: XP EXTRA para o Walker se 5 estrelas (+50 XP)
    if (rating === 5) {
      try {
        const walkerEmail = booking.walker_email || booking.trainer_email;
        if (walkerEmail) {
          // Buscar usuário do walker
          const walkers = await base44.asServiceRole.entities.User.filter({ email: walkerEmail });
          if (walkers.length > 0) {
            const walker = walkers[0];
            const walkerXP = walker.gamification_xp || 0;
            await base44.asServiceRole.auth.updateUser(walker.id, {
              gamification_xp: walkerXP + 50
            });
            console.log('🌟 Walker ganhou +50 XP BÔNUS (5 estrelas)');

            // Notificar Walker
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: walkerEmail,
              title: '🌟 Avaliação 5 Estrelas!',
              message: `${user.full_name} te deu 5 estrelas! +50 XP bônus ganhos.`,
              type: 'social',
              priority: 'normal'
            });
          }
        }
      } catch (err) {
        console.error('Erro ao atualizar XP do walker:', err);
      }
    }

    // ✅ 9. Notificar Walker sobre nova avaliação
    try {
      const walkerEmail = booking.walker_email || booking.trainer_email;
      if (walkerEmail) {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: walkerEmail,
          title: '⭐ Nova Avaliação Recebida',
          message: `${user.full_name} avaliou o passeio com ${rating} estrelas${comment ? ': "' + comment.substring(0, 50) + '..."' : '.'}`,
          type: 'booking',
          related_id: bookingId,
          priority: 'normal',
          action_url: '/ProfessionalDashboard?tab=reviews'
        });
      }
    } catch (err) {
      console.error('Erro ao notificar walker:', err);
    }

    return Response.json({
      success: true,
      review: {
        id: review.id,
        rating: rating,
        xp_earned: 50 + (rating === 5 ? 50 : 0) // Cliente sempre ganha 50, Walker ganha extra se 5 estrelas
      }
    });

  } catch (error) {
    console.error('❌ Erro ao processar review:', error);
    return Response.json({ 
      error: 'Erro ao processar avaliação', 
      details: error.message 
    }, { status: 500 });
  }
});