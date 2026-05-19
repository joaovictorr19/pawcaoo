import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { event, data } = await req.json();

    if (!data) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    const professional_name = data.walker_name || data.trainer_name || 'Unknown';
    const professional_type = event.entity_name === 'WalkerProfile' ? 'Walker' : 'Trainer';
    const professional_email = data.created_by || data.walker_email || data.trainer_email;

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

    for (const admin of admins) {
      try {
        await base44.asServiceRole.entities.Notification.create({
          recipient_email: admin.email,
          title: '🆕 Novo Profissional Pendente',
          message: `${professional_name} (${professional_type}) se registrou e aguarda verificação.`,
          type: 'system',
          icon: '🐾',
          link: '/AdminProfessionalApprovals',
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