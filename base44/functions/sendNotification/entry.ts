import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipient_email, type, title, message, link, send_email, email_subject, email_body } = body;

    if (!recipient_email || !type || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Criar notificação in-app
    const notification = await base44.entities.Notification.create({
      recipient_email,
      type,
      title,
      message,
      action_url: link || null,
      is_read: false,
      priority: type === 'emergency' ? 'urgent' : 'normal'
    });

    // Enviar email se solicitado
    if (send_email && email_subject && email_body) {
      try {
        await base44.integrations.Core.SendEmail({
          to: recipient_email,
          subject: email_subject,
          body: email_body
        });
      } catch (emailError) {
        console.error('Email send failed:', emailError);
        // Não falhar a requisição se o email falhar
      }
    }

    return Response.json({ 
      success: true, 
      notification_id: notification.id 
    });

  } catch (error) {
    console.error('Notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});