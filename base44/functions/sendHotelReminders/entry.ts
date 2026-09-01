import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { buildCheckinReminderEmail, buildCheckoutReminderEmail } from '../../shared/hotelEmailTemplate.ts';

/**
 * Lembretes automáticos de check-in e check-out para reservas de hotel.
 * - Encontra reservas com check-in no dia seguinte → envia lembrete de chegada
 * - Encontra reservas com check-out no dia atual → envia lembrete de saída
 * Executar diariamente via cron (09:00 Europe/Lisbon).
 * Emails profissionais gerados por base44/shared/hotelEmailTemplate.ts.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth check — admin manual call or platform-scheduled invocation
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      try {
        const user = await base44.auth.me();
        if (user?.role !== 'admin') {
          return Response.json({ error: 'Admin access required' }, { status: 403 });
        }
      } catch {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Calculate today and tomorrow in Europe/Lisbon
    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'Europe/Lisbon' });
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('sv-SE', { timeZone: 'Europe/Lisbon' });

    const results = { checkinReminders: 0, checkoutReminders: 0, errors: [] };

    // === 1. LEMBRETE DE CHECK-IN (amanhã) ===
    const upcomingCheckins = await base44.asServiceRole.entities.HotelBooking.filter({
      checkin_date: tomorrowStr,
      status: 'confirmed',
    });

    for (const booking of upcomingCheckins) {
      try {
        if (!booking.owner_email) continue;

        const { subject, body } = buildCheckinReminderEmail(booking);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: booking.owner_email,
          subject,
          body,
        });
        results.checkinReminders++;
      } catch (e) {
        results.errors.push(`Checkin reminder ${booking.id}: ${e.message}`);
      }
    }

    // === 2. LEMBRETE DE CHECK-OUT (hoje) ===
    const todayCheckouts = await base44.asServiceRole.entities.HotelBooking.filter({
      checkout_date: todayStr,
      status: 'checked_in',
    });

    for (const booking of todayCheckouts) {
      try {
        if (!booking.owner_email) continue;

        const { subject, body } = buildCheckoutReminderEmail(booking);
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: booking.owner_email,
          subject,
          body,
        });
        results.checkoutReminders++;
      } catch (e) {
        results.errors.push(`Checkout reminder ${booking.id}: ${e.message}`);
      }
    }

    return Response.json({
      success: true,
      date: todayStr,
      ...results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});