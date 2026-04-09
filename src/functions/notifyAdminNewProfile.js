import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// deno-lint-ignore no-undef
if (typeof Deno !== 'undefined') {
  Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { professional_name, professional_type, professional_email } = await req.json();

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

    for (const admin of admins) {
      try {
        await base44.entities.Notification.create({
          recipient_email: admin.email,
          title: '🆕 Novo Profissional Pendente de Aprovação',
          message: `${professional_name} (${professional_type}) submeteu candidatura para análise.`,
          type: 'system',
          icon: '🐾',
          link: '/AdminProfessionalApprovals',
          related_id: professional_email,
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