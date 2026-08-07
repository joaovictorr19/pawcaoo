import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is called by entity automations — validate automation payload
    const body = await req.json();
    const { event, data } = body;

    // Must have event from automation — reject direct unauthenticated calls without payload
    if (!event || !data) {
      return Response.json({ error: 'Invalid automation payload' }, { status: 400 });
    }

    // Sanitize user-supplied fields to prevent XSS in admin notifications
    const sanitize = (str) => String(str || '').replace(/[<>"'&]/g, '').trim().slice(0, 100);
    const professional_name = sanitize(data.walker_name || data.trainer_name) || 'Unknown';
    const professional_type = event.entity_name === 'WalkerProfile'
      ? (data.professional_type === 'hotel' ? 'Hotel' : 'Walker')
      : 'Trainer';
    const professional_email = data.created_by || data.walker_email || data.trainer_email;

    // Build a descriptive summary of the new professional's key registration fields
    const detailParts = [];
    if (data.location) detailParts.push(`Localização: ${sanitize(data.location)}`);
    if (data.hourly_rate) detailParts.push(`Tarifa: €${parseFloat(data.hourly_rate).toFixed(2)}/h`);
    if (data.phone || data.whatsapp_number) detailParts.push(`Contacto: ${sanitize(data.phone || data.whatsapp_number)}`);
    if (event.entity_name === 'WalkerProfile' && data.hotel_details?.full_address) {
      detailParts.push(`Morada: ${sanitize(data.hotel_details.full_address)}`);
    }
    if (data.services_offered && Array.isArray(data.services_offered) && data.services_offered.length > 0) {
      const svcNames = data.services_offered.slice(0, 4).map(s => sanitize(s.service_name)).filter(Boolean).join(', ');
      if (svcNames) detailParts.push(`Serviços: ${svcNames}${data.services_offered.length > 4 ? '...' : ''}`);
    }
    const detailSummary = detailParts.length > 0 ? `\n${detailParts.join(' • ')}` : '';
    const message = `${professional_name} (${professional_type}) se registou e aguarda verificação.${detailSummary}`;

    // Dedupe: se já foi enviada notificação para este profissional nos últimos 5 minutos
    // (ex: registo cria WalkerProfile + TrainerProfile em simultâneo), não enviar de novo
    const recent = await base44.asServiceRole.entities.Notification.filter(
      { title: 'Novo Profissional Pendente' },
      '-created_date',
      20
    );
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    const alreadyNotified = recent.some(n =>
      String(n.message || '').includes(`${professional_name} (${professional_type})`) &&
      new Date(n.created_date).getTime() > fiveMinAgo
    );
    if (alreadyNotified) {
      return Response.json({ success: true, deduped: true, admins_notified: 0 });
    }

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

    for (const admin of admins) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: admin.email,
          title: 'Novo Profissional Pendente',
          message,
          type: 'system',
          link: '/AdminDashboard?tab=approvals',
          related_id: data.id,
        });
      } catch (err) {
        console.warn(`Erro ao notificar admin ${admin.email}:`, err);
      }
    }

    return Response.json({
      success: true,
      admins_notified: admins.length,
    });
  } catch (error) {
    console.error('Erro ao notificar admins:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});