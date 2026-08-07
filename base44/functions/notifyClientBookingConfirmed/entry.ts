import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { event } = body || {};

    if (!event || event.type !== 'update') {
      return Response.json({ message: 'Ignored — not an update event' });
    }

    if (!event.entity_id) {
      return Response.json({ error: 'No entity_id to fetch booking' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.HotelBooking.get(event.entity_id);

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const clientEmail = booking.owner_email;
    if (!clientEmail) {
      return Response.json({ message: 'No owner_email on booking — skipping' });
    }

    const serviceTypeLabels: Record<string, string> = {
      boarding: 'Estadia (Hospedagem)',
      daycare: 'Creche (Dia)',
      grooming: 'Banho & Tosa',
      walk_with_partner: 'Passeio com Parceiro',
      training: 'Treino',
      dropin: 'Assistência em Casa',
      transport: 'Transporte',
    };

    const serviceLabel = serviceTypeLabels[booking.service_type] || booking.service_type || '—';
    const hotelName = booking.hotel_name || 'Hotel';

    const esc = (str: unknown) => String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const subject = `✅ Reserva confirmada — ${hotelName} • ${serviceLabel}`;

    const transportSection = booking.transport_requested ? `
      <h2 style="color: #0f766e; font-size: 16px; margin: 20px 0 12px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px;">🚐 Transporte</h2>
      <table style="width: 100%; font-size: 14px; color: #1e293b;">
        <tr><td style="padding: 4px 0; font-weight: 600; width: 45%;">Transporte solicitado:</td><td>Sim — €${esc((booking.transport_price || 0).toFixed(2))}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 600;">Morada de recolha:</td><td>${esc(booking.pickup_address || '—')}</td></tr>
        <tr><td style="padding: 4px 0; font-weight: 600;">Estado:</td><td>
          ${booking.transport_status === 'accepted'
            ? '<strong style="color: #059669;">✅ Aceite — o hotel irá recolher o seu animal</strong>'
            : booking.transport_status === 'denied'
              ? '<strong style="color: #dc2626;">❌ Recusado — terá de levar o animal ao estabelecimento</strong>'
              : '<strong style="color: #d97706;">⏳ Pendente — o hotel está a validar a sua morada</strong>'}
        </td></tr>
      </table>
      ${booking.transport_status === 'denied' ? `
      <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 12px; margin-top: 12px;">
        <p style="font-size: 13px; color: #991b1b; margin: 0;">
          <strong>Transporte recusado:</strong> A sua morada está fora da área de cobertura do hotel. Por favor, leve o animal ao estabelecimento na data e hora confirmadas.
        </p>
      </div>` : ''}
    ` : '';

    const htmlBody = `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0d9483, #207373); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800;">✅ Reserva Confirmada</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${esc(hotelName)}</p>
        </div>

        <div style="padding: 24px;">
          <p style="font-size: 14px; color: #1e293b; margin: 0 0 16px;">Olá <strong>${esc(booking.owner_name || 'Cliente')}</strong>,</p>
          <p style="font-size: 14px; color: #1e293b; margin: 0 0 16px;">A sua reserva foi confirmada! Aqui estão os detalhes:</p>

          <h2 style="color: #0f766e; font-size: 16px; margin: 0 0 12px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px;">📋 Detalhes do Serviço</h2>
          <table style="width: 100%; font-size: 14px; color: #1e293b;">
            <tr><td style="padding: 4px 0; font-weight: 600; width: 45%;">Tipo de Serviço:</td><td>${esc(serviceLabel)}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Check-in:</td><td>${esc(booking.checkin_date || '—')}${booking.checkin_time ? ' às ' + esc(booking.checkin_time) : ''}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Check-out:</td><td>${esc(booking.checkout_date || '—')}${booking.checkout_time ? ' às ' + esc(booking.checkout_time) : ''}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Nº de cães:</td><td>${booking.total_dogs || '—'}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Valor Total:</td><td><strong>€${(booking.total_amount || 0).toFixed(2)}</strong></td></tr>
          </table>

          ${transportSection}

          <div style="margin-top: 24px; text-align: center;">
            <span style="display: inline-block; background: #0d9483; color: #ffffff; padding: 12px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px;">Aceda à sua conta PawCão para mais detalhes</span>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
          PawCão • Confirmação de reserva
        </div>
      </div>
    `;

    const sanitizedBody = htmlBody
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^>]*>/gi, '')
      .replace(/<\/iframe>/gi, '')
      .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: clientEmail,
      subject,
      body: sanitizedBody,
      from_name: `${hotelName} — PawCão`,
    });

    return Response.json({
      success: true,
      message: `Email enviado para ${clientEmail}`,
      booking_id: booking.id,
    });
  } catch (error) {
    console.error('Erro ao enviar email de confirmação ao cliente:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});