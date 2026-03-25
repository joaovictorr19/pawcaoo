import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Scheduled function: Notify users 3 days before their subscription tokens expire.
 * Prevents silent token breakage — users get a chance to use their tokens.
 * Run via cron: daily at 09:00 UTC
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const targetDate = threeDaysFromNow.toISOString().split('T')[0];

    const today = new Date().toISOString().split('T')[0];

    // Find wallets with tokens expiring in exactly 3 days
    const allWallets = await base44.asServiceRole.entities.UserWallet.list();

    let notified = 0;

    for (const wallet of allWallets) {
      if (!wallet.tokens_expiry_date || wallet.service_tokens <= 0) continue;

      const expiryDate = wallet.tokens_expiry_date.split('T')[0];

      // Notify if expiring in 3 days (or already within 3-day window but not yet expired)
      if (expiryDate <= targetDate && expiryDate >= today) {
        const daysLeft = Math.ceil(
          (new Date(expiryDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if we already sent this notification
        const notifKey = `token_expiry_${wallet.id}_${expiryDate}`;
        const existing = await base44.asServiceRole.entities.Notification.filter({
          recipient_email: wallet.user_email,
          type: 'token_expiry_warning',
          related_id: notifKey
        });

        if (existing.length > 0) continue;

        const tokenWord = wallet.service_tokens === 1 ? 'token' : 'tokens';
        const dayWord = daysLeft === 1 ? 'dia' : 'dias';
        const tokenValue = wallet.service_tokens * 12;

        await base44.asServiceRole.entities.Notification.create({
          recipient_email: wallet.user_email,
          title: `⏰ ${wallet.service_tokens} ${tokenWord} expira${wallet.service_tokens > 1 ? 'm' : ''} em ${daysLeft} ${dayWord}!`,
          message: `Tem ${wallet.service_tokens} ${tokenWord} de passeio (valor: €${tokenValue}) que expira${wallet.service_tokens > 1 ? 'm' : ''} a ${expiryDate}. Use-os antes que expirem!`,
          type: 'token_expiry_warning',
          related_id: notifKey,
          priority: daysLeft <= 1 ? 'high' : 'normal',
          action_url: '/Dashboard'
        });

        notified++;
      }
    }

    return Response.json({
      success: true,
      users_notified: notified,
      check_date: targetDate
    });

  } catch (error) {
    console.error('Token expiry notification error:', error);
    return Response.json({ error: 'Failed to send expiry notifications' }, { status: 500 });
  }
});
