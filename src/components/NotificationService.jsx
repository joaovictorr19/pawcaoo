import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// Sistema de Notificações Centralizadas
export default function NotificationService() {
  const queryClient = useQueryClient();

  // Buscar usuário atual
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Polling de notificações não lidas a cada 30 segundos
  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: async () => {
      if (!user?.email) return [];
      const notifications = await base44.entities.Notification.filter({
        recipient_email: user.email,
        is_read: false
      }, '-created_date', 10);
      return notifications;
    },
    enabled: !!user?.email,
    refetchInterval: 60000, // 60 segundos
    refetchOnWindowFocus: false,
  });

  // Mostrar toast para novas notificações
  useEffect(() => {
    if (unreadNotifications.length > 0) {
    // Pega apenas a notificação mais recente
    const latest = unreadNotifications[0];
    const notificationKey = `notification-${latest.id}`;

    // Verifica se já foi mostrada (usando sessionStorage)
    if (!sessionStorage.getItem(notificationKey)) {
      let icon = '🔔';
      if (latest.type === 'booking') icon = '📅';
      if (latest.type === 'payment') icon = '💰';
      if (latest.type === 'message') icon = '💬';
      if (latest.type === 'emergency') icon = '🚨';
      if (latest.type === 'adoption') icon = '🏠';

      toast(latest.title, {
        description: latest.message,
        duration: 5000,
        icon: icon,
        action: latest.action_url ? {
          label: 'Ver',
          onClick: () => window.location.href = latest.action_url
        } : undefined
      });

      sessionStorage.setItem(notificationKey, 'shown');
    }
    }
    }, [unreadNotifications]);

    // Walk Reminders Logic
    const createNotification = useCreateNotification();

    useEffect(() => {
    const checkUpcomingWalks = async () => {
    if (!user?.email) return;

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Format dates for query (YYYY-MM-DD)
    const todayStr = now.toISOString().split('T')[0];

    try {
      // 1. Fetch upcoming confirmed bookings for today/tomorrow (Owner & Walker)
      const bookingsAsOwner = await base44.entities.Booking.filter({
        owner_email: user.email,
        status: 'confirmed',
        walk_date: { '$gte': todayStr }
      });
      
      const bookingsAsWalker = await base44.entities.Booking.filter({
        walker_email: user.email,
        status: 'confirmed',
        walk_date: { '$gte': todayStr }
      });

      // Combine unique bookings
      const bookingsMap = new Map();
      [...bookingsAsOwner, ...bookingsAsWalker].forEach(b => bookingsMap.set(b.id, b));
      const bookings = Array.from(bookingsMap.values());

      // Filter for walks in the next 24h locally to be precise with time
      const upcomingBookings = bookings.filter(booking => {
        if (!booking.walk_date) return false;
        const timePart = booking.walk_time ? booking.walk_time.split(' - ')[0] : '00:00';
        const walkDateTime = new Date(`${booking.walk_date}T${timePart}`);
        const diffHours = (walkDateTime - now) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 24;
      });

      for (const booking of upcomingBookings) {
        // Unique key per user/booking to allow multiple notifications if needed but avoid spam
        const reminderKey = `reminder-booking-${booking.id}-${user.email}`;

        // Check local storage first to avoid API calls
        if (localStorage.getItem(reminderKey)) continue;

        // Check if notification already exists in DB for THIS user
        const existingNotifications = await base44.entities.Notification.filter({
          related_id: booking.id,
          type: 'booking_reminder',
          recipient_email: user.email
        });

        if (existingNotifications.length === 0) {
          // Create reminder
          const walkDate = new Date(booking.walk_date).toLocaleDateString();
          const partnerName = user.email === booking.owner_email ? booking.walker_name : booking.owner_name;

          await createNotification.mutateAsync({
            recipient_email: user.email,
            title: `🔔 Lembrete de Serviço: ${booking.dog_name}`,
            message: `Serviço agendado com ${partnerName} para amanhã (${walkDate}) às ${booking.walk_time}.`,
            type: 'booking_reminder',
            related_id: booking.id,
            action_url: `/MyBookings`,
            priority: 'high'
          });

          // Mark as sent locally
          localStorage.setItem(reminderKey, 'sent');
        } else {
           localStorage.setItem(reminderKey, 'sent');
        }
      }
    } catch (error) {
      console.error("Error checking walk reminders:", error);
    }
    };

    // Run check every 5 minutes
    const intervalId = setInterval(checkUpcomingWalks, 5 * 60 * 1000);

    // Initial check after 5 seconds
    const timeoutId = setTimeout(checkUpcomingWalks, 5000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [user?.email, createNotification]);

  // Review Reminders Logic
  useEffect(() => {
    const checkReviewReminders = async () => {
      if (!user?.email) return;

      try {
        // Find completed bookings from past 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const completedBookings = await base44.entities.Booking.filter({
          created_by: user.email, // As owner
          status: 'completed',
          completed_date: { '$gte': sevenDaysAgo.toISOString() }
        });

        for (const booking of completedBookings) {
          const reminderKey = `reminder-review-${booking.id}`;
          if (localStorage.getItem(reminderKey)) continue;

          // Check if review exists
          const reviews = await base44.entities.Review.filter({ booking_id: booking.id });
          if (reviews.length === 0) {
             // Check if we already notified in DB
             const existingNotifs = await base44.entities.Notification.filter({
               related_id: booking.id,
               type: 'review_reminder',
               recipient_email: user.email
             });

             if (existingNotifs.length === 0) {
               await createNotification.mutateAsync({
                 recipient_email: user.email,
                 title: `⭐ Avalie seu passeio com ${booking.walker_name}`,
                 message: `Como foi o passeio de ${booking.dog_name}? Sua avaliação ajuda a comunidade!`,
                 type: 'review_reminder',
                 related_id: booking.id,
                 action_url: `/MyBookings?review=${booking.id}`, // Deep link logic to be handled in MyBookings
                 priority: 'normal',
                 // Skip email if preferences say so (logic would be here if we fetched prefs)
               });
               localStorage.setItem(reminderKey, 'sent');
             }
          } else {
            localStorage.setItem(reminderKey, 'reviewed');
          }
        }
      } catch (error) {
        console.error("Error checking review reminders:", error);
      }
    };

    const intervalId = setInterval(checkReviewReminders, 30 * 60 * 1000); // Check every 30 mins
    const timeoutId = setTimeout(checkReviewReminders, 15000); // Initial check delay

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [user?.email, createNotification]);

  return null;
}

// ✅ Função estática para notificar walkers sobre emergência
NotificationService.emergencyWalkPosted = async ({ walk }) => {
  try {
    console.log('🚨 Notifying walkers about emergency walk:', walk.id);
    
    // Buscar todos os walkers ativos e verificados
    const walkers = await base44.entities.WalkerProfile.filter({ 
      is_active: true,
      verification_status: 'verified'
    });
    
    // Filtrar walkers que podem atender esse tamanho de cão
    const suitableWalkers = walkers.filter(walker => {
      // Se não tiver dogs array, usa o campo legacy
      const dogSize = walk.dogs?.[0]?.dog_size || walk.dog_size;
      const dogName = walk.dogs?.[0]?.dog_name || walk.dog_name;
      
      if (!dogSize || !walker.dog_sizes) return true;
      return walker.dog_sizes.includes(dogSize);
    });
    
    console.log(`📢 Sending notification to ${suitableWalkers.length} suitable walkers`);
    
    // Criar notificação para cada walker
    const notificationPromises = suitableWalkers.map(walker => 
      base44.entities.Notification.create({
        recipient_email: walker.created_by,
        title: '🚨 Passeio de Emergência Disponível!',
        message: `${walk.dog_name || walk.dogs?.[0]?.dog_name} precisa de um passeio urgente em ${walk.location}. Pagamento: €${walk.offered_amount}`,
        type: 'emergency',
        related_id: walk.id,
        action_url: '/Home?tab=emergency',
        priority: 'urgent'
      }).catch(err => {
        console.error(`Failed to notify walker ${walker.id}:`, err);
        return null;
      })
    );
    
    await Promise.all(notificationPromises);
    
    console.log('✅ Emergency notifications sent successfully');
    return { success: true, notified: suitableWalkers.length };
  } catch (error) {
    console.error('❌ Error notifying walkers about emergency:', error);
    return { success: false, error: error.message };
  }
};

// Hook personalizado para criar notificações
export function useCreateNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationData) => {
      // Fetch user to check preferences (lightweight check, or we rely on frontend passing 'canEmail')
      // For robustness, we'll try to fetch the recipient user if we don't have preference data.
      // NOTE: We can't easily fetch another user's preferences due to RLS if we are not admin. 
      // Assumption: The system (this hook) is typically called when *interacting* with someone, or by admin.
      // If we can't check preferences, we default to sending (opt-out model).
      
      let shouldSendEmail = true;
      let shouldCreateInApp = true;

      try {
        // Only try to check if we are the user or admin, otherwise we assume default true 
        // OR we assume the caller of this hook has checked. 
        // But 'useCreateNotification' is generic. 
        // Let's try to fetch recipient public info if possible, or just send.
        // Better approach: The NotificationService in backend usually handles this. 
        // Since we are frontend-only logic, we proceed.
        // FUTURE: Backend function 'create_notification' would check this.
      } catch (e) {}

      // Cria notificação no banco
      const notification = await base44.entities.Notification.create(notificationData);
      
      // Envia email (se configurado e não for apenas in-app)
      try {
        // Check if we can see the user's email preference? 
        // If we are sending to 'recipient_email', we assume we want to email them.
        // We will wrap this in a check if we had access to the user object.
        // For now, we send always unless 'skipEmail' flag is passed in notificationData (custom prop).
        
        if (!notificationData.skipEmail) {
           await base44.integrations.Core.SendEmail({
            to: notificationData.recipient_email,
            subject: notificationData.title,
            body: `
              <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                  <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #16a34a;">${notificationData.title}</h2>
                    <p style="font-size: 16px; color: #333;">${notificationData.message}</p>
                    ${notificationData.action_url ? `
                      <a href="${window.location.origin}${notificationData.action_url}" 
                         style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                        Ver Detalhes
                      </a>
                    ` : ''}
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666;">
                      Esta é uma notificação automática do PawCão.
                      <br/>
                      <a href="${window.location.origin}/AccountSettings" style="color: #999;">Gerenciar preferências</a>
                    </p>
                  </div>
                </body>
              </html>
            `
          });
        }
      } catch (error) {
        console.error('Erro ao enviar email:', error);
      }
      
      return notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
}