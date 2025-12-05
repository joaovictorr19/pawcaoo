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
    refetchInterval: 30000, // 30 segundos
    refetchOnWindowFocus: true,
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
      // 1. Fetch upcoming confirmed bookings for today/tomorrow
      const bookings = await base44.entities.Booking.filter({
        owner_email: user.email, // Assuming user is owner. For walker, use walker_email
        status: 'confirmed',
        walk_date: { '$gte': todayStr } 
      });

      // Filter for walks in the next 24h locally to be precise with time
      const upcomingBookings = bookings.filter(booking => {
        const walkDateTime = new Date(`${booking.walk_date}T${booking.walk_time || '00:00'}`);
        const diffHours = (walkDateTime - now) / (1000 * 60 * 60);
        return diffHours > 0 && diffHours <= 24;
      });

      for (const booking of upcomingBookings) {
        const reminderKey = `reminder-booking-${booking.id}`;

        // Check local storage first to avoid API calls
        if (localStorage.getItem(reminderKey)) continue;

        // Check if notification already exists in DB
        const existingNotifications = await base44.entities.Notification.filter({
          related_id: booking.id,
          type: 'booking_reminder',
          recipient_email: user.email
        });

        if (existingNotifications.length === 0) {
          // Create reminder
          const walkDate = new Date(booking.walk_date).toLocaleDateString();
          await createNotification.mutateAsync({
            recipient_email: user.email,
            title: `🔔 Lembrete de Passeio: ${booking.dog_name}`,
            message: `O seu passeio com ${booking.walker_name} está agendado para ${walkDate} às ${booking.walk_time}.`,
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

    return null; // Component não renderiza nada
    }

// Hook personalizado para criar notificações
export function useCreateNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationData) => {
      // Cria notificação no banco
      const notification = await base44.entities.Notification.create(notificationData);
      
      // Envia email (se configurado)
      try {
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
                    <a href="${notificationData.action_url}" 
                       style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                      Ver Detalhes
                    </a>
                  ` : ''}
                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                  <p style="font-size: 12px; color: #666;">
                    Esta é uma notificação automática do PawCão. Não responda este email.
                  </p>
                </div>
              </body>
            </html>
          `
        });
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