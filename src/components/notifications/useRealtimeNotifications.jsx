import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useRealtimeNotifications(user) {
  const queryClient = useQueryClient();
  const lastCheckRef = useRef(Date.now());
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user?.email) return;

    // Polling a cada 10 segundos para novas notificações
    const checkNotifications = async () => {
      try {
        const notifications = await base44.entities.Notification.filter({
          recipient_email: user.email,
          is_read: false
        }, '-created_date', 50);

        // Verificar notificações novas (criadas após último check)
        const newNotifications = notifications.filter(n => 
          new Date(n.created_date).getTime() > lastCheckRef.current
        );

        if (newNotifications.length > 0) {
          // Invalidar queries
          queryClient.invalidateQueries(['unreadNotifications']);
          
          // Mostrar toast para a mais recente
          const latest = newNotifications[0];
          
          // Toast com ação
          toast(latest.title, {
            description: latest.message,
            action: latest.action_url ? {
              label: 'Ver',
              onClick: () => window.location.href = latest.action_url
            } : undefined,
            duration: 5000,
          });

          // Browser Push Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(latest.title, {
              body: latest.message,
              icon: '/logo.png',
              badge: '/favicon.png',
              tag: latest.id,
              requireInteraction: latest.priority === 'high'
            });
          }

          lastCheckRef.current = Date.now();
        }
      } catch (error) {
        console.error('Erro ao verificar notificações:', error);
      }
    };

    // Check inicial
    checkNotifications();

    // Setup polling
    intervalRef.current = setInterval(checkNotifications, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user?.email, queryClient]);
}