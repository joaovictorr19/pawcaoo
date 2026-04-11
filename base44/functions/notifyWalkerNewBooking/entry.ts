import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Read automation payload (entity automation sends { event, data, old_data, ... })
    const body = await req.json().catch(() => ({}));

    // Resolve booking data (handle payload_too_large or manual invocation)
    let booking = body?.data || null;
    const event = body?.event || {};

    if ((!booking || body?.payload_too_large) && event?.entity_id) {
      try {
        booking = await base44.asServiceRole.entities.get('Booking', event.entity_id);
      } catch (e) {
        console.error('Failed to fetch booking by id:', e?.message || e);
      }
    }

    if (!booking) {
      return Response.json({ success: false, message: 'No booking data' }, { status: 400 });
    }

    // Determine recipient (walker preferred, fallback to trainer)
    const recipient = booking.walker_email || booking.trainer_email;
    if (!recipient) {
      return Response.json({ success: true, skipped: true, message: 'No professional email on booking' });
    }

    const type = booking.type === 'training' ? 'treino' : 'passeio';
    const owner = booking.owner_name || 'Cliente';
    const dog = (booking.dog_name || (booking.dogs?.[0]?.dog_name)) || 'Pet';
    const dateStr = booking.walk_date ? new Date(booking.walk_date).toLocaleDateString('pt-PT') : '';
    const timeStr = booking.walk_time || '';
    const duration = booking.duration_hours ? `${booking.duration_hours}h` : '';
    const location = booking.pickup_address || booking.pickup_location || booking.location || '';

    const subject = `Novo pedido de ${type} — PawCão`;

    const lines = [
      `Olá!`,
      `Recebeu um novo pedido de ${type}.`,
      '',
      `Cliente: ${owner}`,
      `Animal: ${dog}`,
      dateStr || timeStr ? `Quando: ${[dateStr, timeStr].filter(Boolean).join(' às ')}` : null,
      duration ? `Duração: ${duration}` : null,
      location ? `Local: ${location}` : null,
      '',
      'Aceda ao seu painel para aceitar ou gerir o pedido:',
      `${(new URL('/ProfessionalHubV2', req.url)).origin}/ProfessionalHubV2`,
      '',
      'Obrigado,',
      'Equipa PawCão'
    ].filter(Boolean).join('\n');

    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'PawCão',
      to: recipient,
      subject,
      body: lines,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('notifyWalkerNewBooking error:', error);
    return Response.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
});