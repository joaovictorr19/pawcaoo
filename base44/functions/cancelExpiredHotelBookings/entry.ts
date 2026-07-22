import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is triggered by a scheduled workflow — no authenticated user.
    // Use asServiceRole directly to perform cleanup operations.

    const now = new Date();
    const nowIso = now.toISOString();

    // ═══════════════════════════════════════════════════════
    // PARTE 1: Cancelar reservas de HOTEL expiradas
    // ═══════════════════════════════════════════════════════

    const expiredBookings = await base44.asServiceRole.entities.HotelBooking.filter({
      status: 'pending',
      payment_status: 'pending',
    });

    let cancelledCount = 0;
    for (const booking of expiredBookings) {
      const expiresAt = booking.payment_expires_at
        ? new Date(booking.payment_expires_at)
        : (booking.created_date ? new Date(new Date(booking.created_date).getTime() + 5 * 60 * 1000) : null);

      if (expiresAt && expiresAt < now) {
        await base44.asServiceRole.entities.HotelBooking.update(booking.id, {
          status: 'cancelled',
          payment_status: 'cancelled',
          cancellation_reason: 'payment_timeout_5min'
        });
        cancelledCount++;

        // ── Libertar vagas do hotel ──
        try {
          const dogsCount = booking.total_dogs || 1;
          const profiles = await base44.asServiceRole.entities.WalkerProfile.filter({ id: booking.hotel_profile_id });
          if (profiles.length > 0) {
            const p = profiles[0];
            const hd = p.hotel_details || {};
            const services = (hd.services || []).map(s => {
              if (s.service_type === booking.service_type) {
                const current = s.capacity_available ?? 0;
                const total = s.capacity_total ?? current;
                return { ...s, capacity_available: Math.min(total, current + dogsCount) };
              }
              return s;
            });
            const topCurrent = hd.capacity_available ?? 0;
            const topTotal = hd.capacity_total ?? topCurrent;
            const topUpdated = Math.min(topTotal, topCurrent + dogsCount);
            await base44.asServiceRole.entities.WalkerProfile.update(p.id, {
              hotel_details: { ...hd, capacity_available: topUpdated, services }
            });
            console.log(`🏨 Vagas libertadas (expirada): +${dogsCount} para ${booking.service_type}`);
          }
        } catch (capErr) {
          console.error('Erro ao libertar vagas hotel:', capErr.message);
        }

        // ── Notificar cliente ──
        try {
          if (booking.owner_email) {
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: booking.owner_email,
              title: '❌ Reserva cancelada — pagamento não concluído',
              message: `A sua reserva no ${booking.hotel_name || 'hotel'} (${booking.total_amount}€) foi cancelada por não ter sido pago em 5 minutos. Faça uma nova reserva se pretender.`,
              type: 'payment',
              is_read: false,
              link: '/ClientDashboard',
              icon: '⏰',
              related_id: booking.id
            });
          }
        } catch (notifErr) {
          console.error('Erro ao notificar cliente:', notifErr.message);
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // PARTE 2: Libertar vagas de PASSEIOS EM GRUPO expirados
    // ═══════════════════════════════════════════════════════

    let groupWalkRestoredCount = 0;
    try {
      // Buscar todos os eventos de grupo não cancelados/não concluídos
      const allEvents = await base44.asServiceRole.entities.GroupWalkEvent.filter({
        status: { $in: ['open', 'full'] }
      }, undefined, 5000);

      for (const evt of allEvents) {
        const participants = evt.participants || [];
        if (participants.length === 0) continue;

        let modified = false;
        let freedSlots = 0;
        const expiredParticipants = [];

        const cleanedParticipants = participants.filter(p => {
          if (p.payment_status === 'pending' && p.payment_expires_at) {
            const expiry = new Date(p.payment_expires_at);
            if (expiry < now) {
              // Expirou — remover e libertar vaga
              modified = true;
              freedSlots++;
              expiredParticipants.push(p);
              return false;
            }
          }
          return true;
        });

        if (modified) {
          const capTotal = evt.capacity_total ?? 5;
          const currentCap = evt.capacity_available ?? capTotal;
          const restoredCap = Math.min(capTotal, currentCap + freedSlots);
          const newStatus = restoredCap > 0 ? 'open' : evt.status;

          await base44.asServiceRole.entities.GroupWalkEvent.update(evt.id, {
            participants: cleanedParticipants,
            capacity_available: restoredCap,
            status: newStatus,
          });
          groupWalkRestoredCount += freedSlots;
          console.log(`🐕 Vagas libertadas (expirada): +${freedSlots} para ${evt.title} | vagas: ${restoredCap}`);

          // Notificar cada cliente cuja vaga expirou
          for (const ep of expiredParticipants) {
            try {
              if (ep.owner_email) {
                await base44.asServiceRole.entities.Notification.create({
                  recipient_email: ep.owner_email,
                  title: '❌ Inscrição cancelada — pagamento não concluído',
                  message: `A sua inscrição no passeio "${evt.title}" (${evt.event_date}) foi cancelada por não ter sido paga em 5 minutos. Tente novamente se ainda houver vagas.`,
                  type: 'payment',
                  is_read: false,
                  link: `/UserProfile?email=${encodeURIComponent(evt.professional_email)}`,
                  icon: '⏰',
                  related_id: evt.id
                });
              }
            } catch (notifErr) {
              console.error('Erro ao notificar cliente grupo:', notifErr.message);
            }
          }
        }
      }
    } catch (groupErr) {
      console.error('Erro ao processar passeios em grupo expirados:', groupErr.message);
    }

    return Response.json({
      success: true,
      hotel_cancelled: cancelledCount,
      hotel_checked: expiredBookings.length,
      group_walk_slots_restored: groupWalkRestoredCount,
    });
  } catch (error) {
    console.error('Error cancelling expired bookings:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});