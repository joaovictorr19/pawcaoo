import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Lembretes automáticos de check-in e check-out para reservas de hotel.
 * - Encontra reservas com check-in no dia seguinte → envia lembrete de chegada
 * - Encontra reservas com check-out no dia atual → envia lembrete de saída
 * Executar diariamente via cron (09:00 Europe/Lisbon).
 */

const formatDatePT = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
};

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

        const dogList = (booking.dogs || [])
          .map(d => `• ${d.dog_name || 'Cão'}${d.dog_breed ? ` (${d.dog_breed})` : ''}`)
          .join('\n');

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: booking.owner_email,
          subject: `Lembrete: Check-in amanhã no ${booking.hotel_name || 'hotel'}`,
          body: [
            `Olá ${booking.owner_name},`,
            ``,
            `Este é um lembrete de que o check-in do(s) seu(s) animal(is) no ${booking.hotel_name} está marcado para amanhã, ${formatDatePT(tomorrowStr)}.`,
            ``,
            `Detalhes da reserva:`,
            `Tipo de serviço: ${booking.service_type || 'Alojamento'}`,
            `${dogList}`,
            `Data de check-out: ${formatDatePT(booking.checkout_date)}`,
            ``,
            `Recomendamos que chegue dentro do horário de check-in estabelecido. Em caso de alteração, contacte o hotel diretamente.`,
            ``,
            `Obrigado por escolher a PawCão!`,
          ].join('\n'),
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

        const dogList = (booking.dogs || [])
          .map(d => `• ${d.dog_name || 'Cão'}${d.dog_breed ? ` (${d.dog_breed})` : ''}`)
          .join('\n');

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: booking.owner_email,
          subject: `Hoje é o dia de check-out no ${booking.hotel_name || 'hotel'}`,
          body: [
            `Olá ${booking.owner_name},`,
            ``,
            `Lembramos que hoje, ${formatDatePT(todayStr)}, é o dia de check-out do(s) seu(s) animal(is) do ${booking.hotel_name}.`,
            ``,
            `Detalhes da reserva:`,
            `${dogList}`,
            ``,
            `Por favor, dirija-se ao hotel dentro do horário de check-out para levantar o(s) seu(s) animal(is). Em caso de impedimento, contacte o hotel com a maior brevidade.`,
            ``,
            `Obrigado por confiar na PawCão!`,
          ].join('\n'),
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