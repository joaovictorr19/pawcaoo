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

    const { event, payload_too_large } = body || {};

    if (!event || event.type !== 'update') {
      return Response.json({ message: 'Ignored — not an update event' });
    }

    // SECURITY: Always fetch the booking from the database by entity_id.
    // Never trust a `data` object supplied in the request body — an attacker
    // could craft a payload with arbitrary email content for spoofing/phishing.
    if (!event.entity_id) {
      return Response.json({ error: 'No entity_id to fetch booking' }, { status: 400 });
    }

    let booking;
    if (payload_too_large) {
      // Re-fetch even if data was provided, to ensure it matches the DB record
      booking = await base44.asServiceRole.entities.HotelBooking.get(event.entity_id);
    } else {
      booking = await base44.asServiceRole.entities.HotelBooking.get(event.entity_id);
    }

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const hotelEmail = booking.hotel_email;
    const hotelName = booking.hotel_name || 'Hotel';

    if (!hotelEmail) {
      return Response.json({ message: 'No hotel_email on booking — skipping' });
    }

    // Build email content
    const serviceTypeLabels = {
      boarding: 'Estadia (Hospedagem)',
      daycare: 'Creche (Dia)',
      grooming: 'Banho & Tosa',
      walk_with_partner: 'Passeio com Parceiro',
      training: 'Treino',
    };

    const sizeLabels = {
      small: 'Pequeno',
      medium: 'Médio',
      large: 'Grande',
      extra_large: 'Extra Grande',
    };

    const serviceLabel = serviceTypeLabels[booking.service_type] || booking.service_type || '—';

    // SECURITY: Escape HTML to prevent injection via user-supplied fields (dog names, notes, etc.)
    const esc = (str) => String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const formatDog = (dog, idx) => {
      const lines = [];
      lines.push(`  ${idx + 1}. ${esc(dog.dog_name || 'Cão sem nome')}`);
      if (dog.dog_breed) lines.push(`     Raça: ${esc(dog.dog_breed)}`);
      if (dog.dog_size) lines.push(`     Porte: ${esc(sizeLabels[dog.dog_size] || dog.dog_size)}`);
      if (dog.dog_age !== undefined && dog.dog_age !== null) lines.push(`     Idade: ${esc(dog.dog_age)} ano(s)`);
      if (dog.diet) lines.push(`     Dieta: ${esc(dog.diet)}`);
      if (dog.medications) lines.push(`     Medicação: ${esc(dog.medications)}`);
      if (dog.routine) lines.push(`     Rotina: ${esc(dog.routine)}`);
      if (dog.special_notes) lines.push(`     Notas especiais: ${esc(dog.special_notes)}`);
      if (dog.vaccine_expiry) lines.push(`     Validade vacina: ${esc(dog.vaccine_expiry)}`);
      if (dog.vaccine_verified) lines.push(`     Vacina verificada: Sim`);
      return lines.join('\n');
    };

    const dogsSection = (booking.dogs && booking.dogs.length > 0)
      ? booking.dogs.map((d, i) => formatDog(d, i)).join('\n')
      : 'Nenhum cão registado.';

    const addOnsSection = (booking.add_ons && booking.add_ons.length > 0)
      ? booking.add_ons.map((a, i) => {
          const parts = [`  ${i + 1}. ${esc(a.service_name)}`];
          if (a.quantity) parts.push(`     Quantidade: ${esc(a.quantity)}`);
          if (a.total_price !== undefined) parts.push(`     Preço: €${esc(a.total_price)}`);
          if (a.assigned_walker_name) parts.push(`     Parceiro: ${esc(a.assigned_walker_name)}`);
          if (a.due_time) parts.push(`     Horário: ${esc(a.due_time)}`);
          return parts.join('\n');
        }).join('\n')
      : 'Nenhum serviço adicional.';

    const subject = `🐾 Nova reserva confirmada — ${booking.owner_name || 'Cliente'} • ${serviceLabel}`;

    const htmlBody = `
      <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #0d9483, #207373); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 800;">🐾 Nova Reserva Confirmada</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">${esc(hotelName)}</p>
        </div>

        <div style="padding: 24px;">
          <h2 style="color: #0f766e; font-size: 16px; margin: 0 0 12px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px;">📋 Detalhes do Serviço</h2>
          <table style="width: 100%; font-size: 14px; color: #1e293b;">
            <tr><td style="padding: 4px 0; font-weight: 600; width: 45%;">Tipo de Serviço:</td><td>${esc(serviceLabel)}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Check-in:</td><td>${booking.checkin_date || '—'}${booking.checkin_time ? ' às ' + booking.checkin_time : ''}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Check-out:</td><td>${booking.checkout_date || '—'}${booking.checkout_time ? ' às ' + booking.checkout_time : ''}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Noites:</td><td>${booking.total_nights || '—'}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Nº de cães:</td><td>${booking.total_dogs || '—'}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Valor Total:</td><td><strong>€${(booking.total_amount || 0).toFixed(2)}</strong></td></tr>
          </table>

          <h2 style="color: #0f766e; font-size: 16px; margin: 20px 0 12px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px;">👤 Cliente</h2>
          <table style="width: 100%; font-size: 14px; color: #1e293b;">
            <tr><td style="padding: 4px 0; font-weight: 600; width: 45%;">Nome:</td><td>${esc(booking.owner_name || '—')}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Email:</td><td>${esc(booking.owner_email || '—')}</td></tr>
            <tr><td style="padding: 4px 0; font-weight: 600;">Telefone:</td><td>${esc(booking.owner_phone || '—')}</td></tr>
            ${booking.emergency_contact_name ? `<tr><td style="padding: 4px 0; font-weight: 600;">Contacto emergência:</td><td>${esc(booking.emergency_contact_name)} — ${esc(booking.emergency_contact_phone || '')}</td></tr>` : ''}
            ${booking.veterinarian_name ? `<tr><td style="padding: 4px 0; font-weight: 600;">Veterinário:</td><td>${esc(booking.veterinarian_name)} — ${esc(booking.veterinarian_phone || '')}</td></tr>` : ''}
          </table>

          <h2 style="color: #0f766e; font-size: 16px; margin: 20px 0 12px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px;">🐶 Cães</h2>
          <div style="font-size: 14px; color: #1e293b; white-space: pre-line;">${dogsSection}</div>

          <h2 style="color: #0f766e; font-size: 16px; margin: 20px 0 12px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px;">➕ Serviços Adicionais</h2>
          <div style="font-size: 14px; color: #1e293b; white-space: pre-line;">${addOnsSection}</div>

          ${booking.special_requests ? `
          <h2 style="color: #0f766e; font-size: 16px; margin: 20px 0 12px; border-bottom: 2px solid #ccfbf1; padding-bottom: 8px;">📝 Pedidos Especiais</h2>
          <p style="font-size: 14px; color: #1e293b; background: #fef3c7; padding: 12px; border-radius: 8px;">${esc(booking.special_requests)}</p>
          ` : ''}

          <div style="margin-top: 24px; text-align: center;">
            <span style="display: inline-block; background: #0d9483; color: #ffffff; padding: 12px 32px; border-radius: 9999px; font-weight: 700; font-size: 14px;">Aceda ao seu painel PawCão para mais detalhes</span>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
          PawCão • Notificação automática de reserva
        </div>
      </div>
    `;

    const textBody = `
NOVA RESERVA CONFIRMADA — ${hotelName}

=== DETALHES DO SERVIÇO ===
Tipo: ${serviceLabel}
Check-in: ${booking.checkin_date || '—'}${booking.checkin_time ? ' às ' + booking.checkin_time : ''}
Check-out: ${booking.checkout_date || '—'}${booking.checkout_time ? ' às ' + booking.checkout_time : ''}
Noites: ${booking.total_nights || '—'}
Nº de cães: ${booking.total_dogs || '—'}
Valor Total: €${(booking.total_amount || 0).toFixed(2)}

=== CLIENTE ===
Nome: ${booking.owner_name || '—'}
Email: ${booking.owner_email || '—'}
Telefone: ${booking.owner_phone || '—'}
${booking.emergency_contact_name ? 'Contacto emergência: ' + booking.emergency_contact_name + ' — ' + (booking.emergency_contact_phone || '') : ''}
${booking.veterinarian_name ? 'Veterinário: ' + booking.veterinarian_name + ' — ' + (booking.veterinarian_phone || '') : ''}

=== CÃES ===
${dogsSection}

=== SERVIÇOS ADICIONAIS ===
${addOnsSection}

${booking.special_requests ? '=== PEDIDOS ESPECIAIS ===\n' + booking.special_requests : ''}

— PawCão • Notificação automática
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: hotelEmail,
      subject,
      body: htmlBody,
      from_name: 'PawCão — Reservas',
    });

    return Response.json({
      success: true,
      message: `Email enviado para ${hotelEmail}`,
      booking_id: booking.id,
    });
  } catch (error) {
    console.error('Erro ao enviar email de reserva:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});