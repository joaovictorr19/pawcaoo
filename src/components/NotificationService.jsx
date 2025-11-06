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
        
        toast(latest.title, {
          description: latest.message,
          duration: 5000,
          action: latest.action_url ? {
            label: 'Ver',
            onClick: () => window.location.href = latest.action_url
          } : undefined
        });
        
        sessionStorage.setItem(notificationKey, 'shown');
      }
    }
  }, [unreadNotifications]);

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