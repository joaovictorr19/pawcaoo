import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipient_email, title, body, data, url } = await req.json();

    if (!recipient_email || !title || !body) {
      return Response.json({ 
        error: 'Missing required fields: recipient_email, title, body' 
      }, { status: 400 });
    }

    // Buscar subscription do destinatário
    const recipientProfiles = await base44.asServiceRole.entities.UserProfile.filter({
      user_email: recipient_email
    });

    if (!recipientProfiles || recipientProfiles.length === 0) {
      return Response.json({ 
        error: 'Recipient not found' 
      }, { status: 404 });
    }

    const recipientProfile = recipientProfiles[0];
    const pushSubscription = recipientProfile.push_subscription;

    if (!pushSubscription) {
      return Response.json({ 
        error: 'User does not have push notifications enabled' 
      }, { status: 400 });
    }

    // Payload da notificação
    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo.png',
      badge: '/favicon.png',
      tag: data?.tag || 'notification',
      data: {
        ...data,
        url: url || '/'
      },
      requireInteraction: false,
      vibrate: [200, 100, 200],
      actions: data?.actions || []
    });

    // Enviar push notification usando Web Push
    const webpush = await import('npm:web-push@3.6.7');
    
    // VAPID keys - você deve gerar suas próprias keys usando web-push
    // Execute: npx web-push generate-vapid-keys
    const vapidKeys = {
      publicKey: Deno.env.get('VAPID_PUBLIC_KEY'),
      privateKey: Deno.env.get('VAPID_PRIVATE_KEY')
    };

    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      return Response.json({ 
        error: 'VAPID keys not configured. Generate them with: npx web-push generate-vapid-keys' 
      }, { status: 500 });
    }

    webpush.setVapidDetails(
      'mailto:support@pawcao.net',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    // Enviar notificação
    try {
      await webpush.sendNotification(pushSubscription, payload);
      
      // Criar registro na entidade Notification
      await base44.asServiceRole.entities.Notification.create({
        recipient_email,
        title,
        message: body,
        type: data?.type || 'system',
        related_id: data?.related_id,
        action_url: url,
        is_read: false,
        priority: data?.priority || 'normal'
      });

      return Response.json({ 
        success: true,
        message: 'Push notification sent successfully'
      });
    } catch (pushError) {
      console.error('Error sending push:', pushError);
      
      // Se falhar (ex: subscription expirada), remover do perfil
      if (pushError.statusCode === 410) {
        await base44.asServiceRole.entities.UserProfile.update(recipientProfile.id, {
          push_subscription: null
        });
        return Response.json({ 
          error: 'Push subscription expired or invalid',
          removed: true
        }, { status: 410 });
      }

      throw pushError;
    }
  } catch (error) {
    console.error('Send push notification error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});