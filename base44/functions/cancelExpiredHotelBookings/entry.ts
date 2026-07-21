import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Find all pending hotel bookings whose payment deadline has passed
    const expiredBookings = await base44.asServiceRole.entities.HotelBooking.filter({
      status: 'pending',
      payment_status: 'pending',
    });

    let cancelledCount = 0;
    for (const booking of expiredBookings) {
      // Determinar a data limite de pagamento: usa payment_expires_at se existir,
      // senão fallback para created_date + 5 min (limpa reservas legadas sem timer)
      const expiresAt = booking.payment_expires_at
        ? new Date(booking.payment_expires_at)
        : (booking.created_date ? new Date(new Date(booking.created_date).getTime() + 5 * 60 * 1000) : null);

      if (expiresAt && expiresAt < new Date(now)) {
        await base44.asServiceRole.entities.HotelBooking.delete(booking.id);
        cancelledCount++;

        // ── Libertar vagas que estavam reservadas durante o período de pagamento ──
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
          console.error('Erro ao libertar vagas:', capErr.message);
        }

        // ── Notificar cliente que a reserva foi cancelada ──
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

    return Response.json({
      success: true,
      cancelled: cancelledCount,
      checked: expiredBookings.length,
    });
  } catch (error) {
    console.error('Error cancelling expired hotel bookings:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});