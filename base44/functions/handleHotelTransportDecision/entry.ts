import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { booking_id, decision } = body;

    if (!booking_id || !['accepted', 'denied'].includes(decision)) {
      return Response.json({ error: 'booking_id e decision (accepted/denied) são obrigatórios' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.HotelBooking.get(booking_id);
    if (!booking) {
      return Response.json({ error: 'Reserva não encontrada' }, { status: 404 });
    }

    // Verify the user is the hotel owner
    if (booking.hotel_email !== user.email) {
      return Response.json({ error: 'Não autorizado — apenas o hotel pode decidir o transporte' }, { status: 403 });
    }

    if (!booking.transport_requested) {
      return Response.json({ error: 'Esta reserva não tem transporte solicitado' }, { status: 400 });
    }

    // Update transport status
    await base44.asServiceRole.entities.HotelBooking.update(booking_id, {
      transport_status: decision,
    });

    const hotelName = booking.hotel_name || 'Hotel';

    // Create in-app notification for the client
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: booking.owner_email,
      title: decision === 'accepted' ? '✅ Transporte Aceite' : '❌ Transporte Recusado',
      message: decision === 'accepted'
        ? `O hotel ${hotelName} aceitou o transporte para a sua reserva. O animal será recolhido na morada indicada.`
        : `O hotel ${hotelName} recusou o transporte — a sua morada está fora da área de cobertura. Terá de levar o animal ao estabelecimento.`,
      type: 'booking',
      related_id: booking_id,
      icon: decision === 'accepted' ? '✅' : '❌',
    });

    // Send email to client
    const clientEmail = booking.owner_email;
    if (clientEmail) {
      const esc = (str: unknown) => String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

      const serviceLabel: Record<string, string> = {
        boarding: 'Estadia', daycare: 'Creche', grooming: 'Banho & Tosa',
        walk_with_partner: 'Passeio', training: 'Treino', dropin: 'Assistência em Casa',
      }[booking.service_type] || booking.service_type;

      const subject = decision === 'accepted'
        ? `✅ Transporte aceite — ${hotelName} • ${serviceLabel}`
        : `❌ Transporte recusado — ${hotelName} • ${serviceLabel}`;

      const htmlBody = decision === 'accepted' ? `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #059669, #0d9483); padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800;">✅ Transporte Aceite</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${esc(hotelName)}</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 14px; color: #1e293b; margin: 0 0 16px;">Olá <strong>${esc(booking.owner_name || 'Cliente')}</strong>,</p>
            <p style="font-size: 14px; color: #1e293b; margin: 0 0 16px;">O hotel confirmou o transporte (recolha e entrega) para a sua reserva de <strong>${esc(serviceLabel)}</strong> em <strong>${esc(booking.checkin_date || '—')}</strong>.</p>
            <div style="background: #d1fae5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 12px; margin: 16px 0;">
              <p style="font-size: 14px; color: #065f46; margin: 0;">
                🚐 O animal será recolhido na morada: <strong>${esc(booking.pickup_address || '—')}</strong>
              </p>
            </div>
            <p style="font-size: 14px; color: #1e293b; margin: 0;">Obrigado por usar a PawCão!</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">PawCão • Notificação de transporte</div>
        </div>
      ` : `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
          <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800;">❌ Transporte Recusado</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${esc(hotelName)}</p>
          </div>
          <div style="padding: 24px;">
            <p style="font-size: 14px; color: #1e293b; margin: 0 0 16px;">Olá <strong>${esc(booking.owner_name || 'Cliente')}</strong>,</p>
            <p style="font-size: 14px; color: #1e293b; margin: 0 0 16px;">O hotel recusou o pedido de transporte para a sua reserva de <strong>${esc(serviceLabel)}</strong> em <strong>${esc(booking.checkin_date || '—')}</strong>.</p>
            <div style="background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; padding: 12px; margin: 16px 0;">
              <p style="font-size: 14px; color: #991b1b; margin: 0 0 8px;">
                <strong>Motivo:</strong> A sua morada está fora da área de cobertura do hotel.
              </p>
              <p style="font-size: 14px; color: #991b1b; margin: 0;">
                A sua reserva mantém-se ativa — apenas terá de levar o animal ao estabelecimento na data e hora confirmadas.
              </p>
            </div>
            <p style="font-size: 14px; color: #1e293b; margin: 0;">Se tem dúvidas, contacte o hotel diretamente.</p>
          </div>
          <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">PawCão • Notificação de transporte</div>
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

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: clientEmail,
          subject,
          body: sanitizedBody,
          from_name: `${hotelName} — PawCão`,
        });
      } catch (emailErr) {
        console.error('Erro ao enviar email de transporte:', emailErr?.message);
      }
    }

    return Response.json({
      success: true,
      message: `Transporte ${decision === 'accepted' ? 'aceite' : 'recusado'} e cliente notificado`,
      transport_status: decision,
    });
  } catch (error) {
    console.error('Erro ao processar decisão de transporte:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});