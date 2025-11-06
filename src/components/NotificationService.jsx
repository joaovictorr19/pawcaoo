
import { base44 } from "@/api/base44Client";

/**
 * Centralized notification service for creating consistent notifications
 * across the platform with email support
 */

const NotificationService = {
  /**
   * Creates a notification and optionally sends an email
   * @param {Object} params - Notification parameters
   * @param {string} params.recipient_email - Recipient's email
   * @param {string} params.title - Notification title
   * @param {string} params.message - Notification message
   * @param {string} params.type - Notification type (booking, payment, message, etc.)
   * @param {string} params.related_id - Related entity ID
   * @param {string} params.action_url - URL to navigate to
   * @param {string} params.priority - Priority level (low, normal, high, urgent)
   * @param {boolean} params.sendEmail - Whether to send email notification
   * @param {string} params.emailTemplate - Custom email template (optional)
   */
  async create({
    recipient_email,
    title,
    message,
    type,
    related_id = null,
    action_url = null,
    priority = "normal",
    sendEmail = true,
    emailTemplate = null
  }) {
    try {
      // Create in-app notification
      const notification = await base44.entities.Notification.create({
        recipient_email,
        title,
        message,
        type,
        related_id,
        action_url,
        priority,
        is_read: false
      });

      // Check user preferences for email notifications
      if (sendEmail) {
        try {
          const recipient = await base44.entities.User.filter({ email: recipient_email });
          const user = recipient[0];
          
          // Only send email if user has email notifications enabled
          const emailEnabled = user?.preferences?.email_notifications !== false;
          
          if (emailEnabled) {
            await this.sendEmail({
              to: recipient_email,
              subject: `🐾 PawCão - ${title}`,
              body: emailTemplate || this.generateEmailBody(title, message, action_url),
              from_name: "PawCão"
            });
          }
        } catch (emailError) {
          console.error("Error sending email notification:", emailError);
          // Don't fail the entire notification if email fails
        }
      }

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  /**
   * Send email notification
   */
  async sendEmail({ to, subject, body, from_name = "PawCão" }) {
    try {
      await base44.integrations.Core.SendEmail({
        from_name,
        to,
        subject,
        body
      });
    } catch (error) {
      console.error("Email send error:", error);
      // Don't throw - allow app to continue even if email fails
    }
  },

  /**
   * Generate professional email body
   */
  generateEmailBody(title, message, action_url) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🐾 PawCão</h1>
            </div>
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
              <p style="font-size: 16px; color: #4b5563;">${message}</p>
              ${action_url ? `
                <a href="${window.location.origin}${action_url}" class="button">
                  Ver Detalhes
                </a>
              ` : ''}
            </div>
            <div class="footer">
              <p>Este é um email automático da plataforma PawCão.</p>
              <p>Para desativar notificações por email, acesse Meu Perfil > Preferências</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  // Specific notification templates for common scenarios

  async bookingCreated({ booking, walker, owner, isTraining = false }) {
    const professionalType = isTraining ? 'trainer' : 'walker';
    const serviceType = isTraining ? 'treino' : 'passeio';
    
    // Notify professional
    await this.create({
      recipient_email: walker.created_by,
      title: `🎉 Novo Agendamento de ${isTraining ? 'Treino' : 'Passeio'}`,
      message: `${owner.owner_name} agendou um ${serviceType} para ${booking.dog_name} no dia ${booking.walk_date || booking.session_date} às ${booking.walk_time || booking.session_time}. Valor: €${booking.total_amount}`,
      type: "booking",
      related_id: booking.id,
      action_url: "/MyBookings",
      priority: "high",
      sendEmail: true
    });

    // Notify owner
    await this.create({
      recipient_email: owner.email,
      title: `✅ Agendamento Confirmado`,
      message: `Seu ${serviceType} com ${walker.walker_name || walker.trainer_name} foi confirmado para ${booking.walk_date || booking.session_date} às ${booking.walk_time || booking.session_time}`,
      type: "booking",
      related_id: booking.id,
      action_url: "/MyBookings",
      priority: "high",
      sendEmail: true
    });
  },

  async bookingCompleted({ booking, isTraining = false, pointsEarned = 0 }) {
    const serviceType = isTraining ? 'treino' : 'passeio';
    const professionalEmail = booking.walker_email || booking.trainer_email;
    const professionalName = booking.walker_name || booking.trainer_name;

    // Notify professional about payment release
    await this.create({
      recipient_email: professionalEmail,
      title: `💰 Pagamento Liberado`,
      message: `O pagamento de €${booking.total_amount} pelo ${serviceType} de ${booking.dog_name} foi liberado para sua conta!`,
      type: "payment",
      related_id: booking.id,
      action_url: "/ProfessionalDashboard",
      priority: "high",
      sendEmail: true
    });

    // Notify owner about completion
    const ownerMessage = pointsEarned > 0
      ? `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} com ${professionalName} foi concluído! Você ganhou ${pointsEarned} PawPoints! 🎉`
      : `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} com ${professionalName} foi concluído com sucesso!`;

    await this.create({
      recipient_email: booking.owner_email,
      title: `✅ ${isTraining ? 'Treino' : 'Passeio'} Concluído`,
      message: ownerMessage,
      type: "booking",
      related_id: booking.id,
      action_url: "/MyBookings",
      priority: "normal",
      sendEmail: true
    });
  },

  async applicationApproved({ applicationType, professional, email }) {
    const typeLabel = applicationType === 'walker' ? 'Passeador' : 'Treinador';
    
    await this.create({
      recipient_email: email,
      title: `🎉 Candidatura de ${typeLabel} Aprovada!`,
      message: `Parabéns! Sua candidatura como ${typeLabel.toLowerCase()} foi aprovada. Você já pode começar a receber agendamentos na plataforma PawCão!`,
      type: "verification",
      related_id: professional.id,
      action_url: "/ProfessionalDashboard",
      priority: "urgent",
      sendEmail: true
    });
  },

  async applicationRejected({ applicationType, professional, email, reason }) {
    const typeLabel = applicationType === 'walker' ? 'Passeador' : 'Treinador';
    
    await this.create({
      recipient_email: email,
      title: `❌ Candidatura de ${typeLabel} Não Aprovada`,
      message: `Sua candidatura como ${typeLabel.toLowerCase()} não foi aprovada. Motivo: ${reason}. Entre em contato conosco para mais informações.`,
      type: "verification",
      related_id: professional.id,
      action_url: "/Contact",
      priority: "urgent",
      sendEmail: true
    });
  },

  async serviceApproved({ service, partnerEmail }) {
    await this.create({
      recipient_email: partnerEmail,
      title: `✅ Serviço Aprovado!`,
      message: `Seu serviço "${service.service_name}" foi aprovado e agora está visível na plataforma para todos os usuários!`,
      type: "system",
      related_id: service.id,
      action_url: "/PartnerDashboard",
      priority: "high",
      sendEmail: true
    });
  },

  async serviceRejected({ service, partnerEmail, reason }) {
    await this.create({
      recipient_email: partnerEmail,
      title: `❌ Serviço Rejeitado`,
      message: `Seu serviço "${service.service_name}" foi rejeitado. Motivo: ${reason}. Por favor, revise e envie novamente.`,
      type: "system",
      related_id: service.id,
      action_url: "/PartnerDashboard",
      priority: "high",
      sendEmail: true
    });
  },

  async announcementApproved({ announcement, companyEmail }) {
    await this.create({
      recipient_email: companyEmail,
      title: `🎉 Anúncio Aprovado!`,
      message: `Seu anúncio "${announcement.title}" foi aprovado e já está visível na loja PawCão!`,
      type: "system",
      related_id: announcement.id,
      action_url: "/PartnerDashboard",
      priority: "high",
      sendEmail: true
    });
  },

  async announcementRejected({ announcement, companyEmail, reason }) {
    await this.create({
      recipient_email: companyEmail,
      title: `❌ Anúncio Rejeitado`,
      message: `Seu anúncio "${announcement.title}" foi rejeitado. Motivo: ${reason}`,
      type: "system",
      related_id: announcement.id,
      action_url: "/PartnerDashboard",
      priority: "high",
      sendEmail: true
    });
  },

  async paymentHeld({ payment }) {
    // Notify payer
    await this.create({
      recipient_email: payment.payer_email,
      title: `💳 Pagamento Confirmado`,
      message: `Seu pagamento de €${payment.total_amount} foi confirmado e está seguro. O pagamento será liberado após a conclusão do serviço.`,
      type: "payment",
      related_id: payment.id,
      action_url: "/PaymentMethods",
      priority: "normal",
      sendEmail: true
    });

    // Notify recipient
    await this.create({
      recipient_email: payment.recipient_email,
      title: `💰 Novo Pagamento Recebido`,
      message: `Um pagamento de €${payment.service_amount} está aguardando conclusão do serviço. Complete o serviço para receber o pagamento.`,
      type: "payment",
      related_id: payment.id,
      action_url: "/ProfessionalDashboard",
      priority: "normal",
      sendEmail: true
    });
  },

  async emergencyWalkPosted({ walk }) {
    // Notify all active walkers in the area
    const walkers = await base44.entities.WalkerProfile.filter({
      is_active: true,
      verification_status: 'verified'
    });

    const notifications = walkers.map(walker => 
      this.create({
        recipient_email: walker.created_by,
        title: `🚨 Passeio de Emergência Disponível!`,
        message: `Passeio urgente em ${walk.location} - ${walk.dog_name} precisa de passeio ${walk.needed_time}. Pagamento: €${walk.offered_amount}`,
        type: "emergency",
        related_id: walk.id,
        action_url: `/EmergencyWalkDetails?id=${walk.id}`,
        priority: "urgent",
        sendEmail: true
      })
    );

    await Promise.all(notifications);
  },

  async emergencyWalkAccepted({ walk, walkerName }) {
    await this.create({
      recipient_email: walk.created_by,
      title: `✅ Passeio de Emergência Aceito!`,
      message: `${walkerName} aceitou seu passeio de emergência para ${walk.dog_name}. Aguarde o contato do passeador.`,
      type: "emergency",
      related_id: walk.id,
      action_url: "/MyBookings",
      priority: "urgent",
      sendEmail: true
    });
  },

  async newMessage({ conversation, sender, message, recipientEmail }) {
    await this.create({
      recipient_email: recipientEmail,
      title: `💬 Nova Mensagem de ${sender.full_name}`,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      type: "message",
      related_id: conversation.id,
      action_url: `/Messages?conversation_id=${conversation.id}`,
      priority: "normal",
      sendEmail: false // Messages are typically not sent via email to avoid spam
    });
  },

  async reviewSubmitted({ review, professionalEmail, professionalName }) {
    await this.create({
      recipient_email: professionalEmail,
      title: `⭐ Nova Avaliação Recebida`,
      message: `Você recebeu uma nova avaliação de ${review.reviewer_name}. Rating: ${review.rating}/5 estrelas.`,
      type: "system",
      related_id: review.id,
      action_url: "/ProfessionalDashboard",
      priority: "normal",
      sendEmail: true
    });
  },

  async loyaltyPointsEarned({ userEmail, points, source }) {
    await this.create({
      recipient_email: userEmail,
      title: `🎉 Você Ganhou ${points} PawPoints!`,
      message: `Parabéns! Você ganhou ${points} PawPoints ${source}. Continue usando a PawCão para ganhar mais recompensas!`,
      type: "system",
      related_id: null,
      action_url: "/LoyaltyRewards",
      priority: "low",
      sendEmail: false
    });
  },

  async loyaltyRewardRedeemed({ redemption, userEmail }) {
    await this.create({
      recipient_email: userEmail,
      title: `🎁 Recompensa Resgatada!`,
      message: `Você resgatou ${redemption.product_name} por ${redemption.points_spent} pontos. ${redemption.redemption_code ? `Código: ${redemption.redemption_code}` : 'Verifique seu email para detalhes.'}`,
      type: "system",
      related_id: redemption.id,
      action_url: "/LoyaltyRewards",
      priority: "high",
      sendEmail: true
    });
  },

  async tierUpgraded({ userEmail, newTier, oldTier }) {
    const tierEmojis = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇',
      platinum: '💎'
    };

    await this.create({
      recipient_email: userEmail,
      title: `🎊 Nível Aumentado para ${newTier.toUpperCase()}!`,
      message: `Parabéns! Você subiu do nível ${oldTier} para ${newTier} ${tierEmojis[newTier]}! Continue acumulando pontos para desbloquear recompensas exclusivas.`,
      type: "system",
      related_id: null,
      action_url: "/LoyaltyRewards",
      priority: "high",
      sendEmail: true
    });
  },

  async bookingReminder({ booking, isTraining = false }) {
    const serviceType = isTraining ? 'treino' : 'passeio';
    const date = booking.walk_date || booking.session_date;
    const time = booking.walk_time || booking.session_time;

    await this.create({
      recipient_email: booking.owner_email,
      title: `⏰ Lembrete: ${isTraining ? 'Treino' : 'Passeio'} Amanhã`,
      message: `Lembre-se: você tem um ${serviceType} agendado com ${booking.walker_name || booking.trainer_name} amanhã às ${time} para ${booking.dog_name}.`,
      type: "booking",
      related_id: booking.id,
      action_url: "/MyBookings",
      priority: "normal",
      sendEmail: true
    });
  },

  async supportTicketCreated({ ticket, adminEmails = [] }) {
    // Notify all admins about new support ticket
    const notifications = adminEmails.map(email =>
      this.create({
        recipient_email: email,
        title: `🆘 Novo Ticket de Suporte`,
        message: `Novo ticket criado por ${ticket.sender_id}. Tipo: ${ticket.tags?.join(', ')}`,
        type: "system",
        related_id: ticket.id,
        action_url: "/AdminDashboard?tab=support",
        priority: "high",
        sendEmail: true
      })
    );

    await Promise.all(notifications);
  },

  async supportTicketResolved({ ticket }) {
    await this.create({
      recipient_email: ticket.sender_id,
      title: `✅ Seu Ticket Foi Resolvido`,
      message: `Seu ticket de suporte foi resolvido. Obrigado por entrar em contato conosco!`,
      type: "system",
      related_id: ticket.id,
      action_url: "/Contact",
      priority: "normal",
      sendEmail: true
    });
  },

  async subscriptionActivated({ subscription, userEmail }) {
    const planNames = {
      free: 'Free',
      basic: 'Basic',
      premium: 'Premium',
      vip: 'VIP'
    };

    await this.create({
      recipient_email: userEmail,
      title: `🎉 Assinatura ${planNames[subscription.plan_type]} Ativada!`,
      message: `Sua assinatura ${planNames[subscription.plan_type]} está ativa! Aproveite todos os benefícios exclusivos.`,
      type: "system",
      related_id: subscription.id,
      action_url: "/OwnerSubscriptions",
      priority: "high",
      sendEmail: true
    });
  },

  async subscriptionExpiring({ subscription, userEmail, daysRemaining }) {
    await this.create({
      recipient_email: userEmail,
      title: `⏰ Assinatura Expirando em ${daysRemaining} Dias`,
      message: `Sua assinatura ${subscription.plan_type.toUpperCase()} expira em ${daysRemaining} dias. Renove agora para continuar aproveitando os benefícios!`,
      type: "system",
      related_id: subscription.id,
      action_url: "/OwnerSubscriptions",
      priority: "high",
      sendEmail: true
    });
  },

  async newFollower({ followerName, followerEmail, recipientEmail }) {
    console.log('📬 SENDING NEW FOLLOWER NOTIFICATION:', {
      from: followerEmail,
      to: recipientEmail,
      name: followerName
    });

    await this.create({
      recipient_email: recipientEmail,
      title: `👥 Novo Seguidor: ${followerName}`,
      message: `${followerName} começou a seguir você no Dog Connect!`,
      type: "system",
      related_id: null,
      action_url: `/UserProfile?email=${followerEmail}`,
      priority: "normal",
      sendEmail: true // MUDADO PARA TRUE
    });

    console.log('✅ Notification created successfully');
  },

  async postLiked({ post, likerName, authorEmail }) {
    await this.create({
      recipient_email: authorEmail,
      title: `❤️ ${likerName} curtiu seu post`,
      message: `${likerName} curtiu: "${post.content?.substring(0, 50)}..."`,
      type: "system",
      related_id: post.id,
      action_url: `/SocialFeed`,
      priority: "low",
      sendEmail: false
    });
  },

  async commentOnPost({ post, commenterName, authorEmail, comment }) {
    await this.create({
      recipient_email: authorEmail,
      title: `💬 ${commenterName} comentou em seu post`,
      message: `${commenterName}: "${comment.substring(0, 100)}..."`,
      type: "system",
      related_id: post.id,
      action_url: `/SocialFeed`,
      priority: "normal",
      sendEmail: false
    });
  },

  async eventInvite({ event, inviterName, recipientEmail }) {
    await this.create({
      recipient_email: recipientEmail,
      title: `📅 Convite para Evento: ${event.title}`,
      message: `${inviterName} convidou você para o evento "${event.title}" em ${event.start_date}`,
      type: "system",
      related_id: event.id,
      action_url: `/SocialEvents?event_id=${event.id}`,
      priority: "normal",
      sendEmail: true
    });
  },

  async contentFlagged({ contentType, contentId, reporterEmail, moderatorEmail }) {
    await this.create({
      recipient_email: moderatorEmail,
      title: `⚠️ Conteúdo Reportado`,
      message: `Um ${contentType} foi reportado por ${reporterEmail}. Requer moderação.`,
      type: "system",
      related_id: contentId,
      action_url: "/ModerationPanel",
      priority: "urgent",
      sendEmail: true
    });
  },

  async badgeEarned({ userEmail, badge }) {
    await this.create({
      recipient_email: userEmail,
      title: `🏆 Novo Badge Desbloqueado!`,
      message: `Parabéns! Você desbloqueou o badge "${badge.name}": ${badge.description}`,
      type: "system",
      related_id: null,
      action_url: "/MyProfile?tab=badges",
      priority: "low",
      sendEmail: false
    });
  }
};

export default NotificationService;
