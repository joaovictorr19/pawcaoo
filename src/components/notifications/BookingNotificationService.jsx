import { useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Hook para gerenciar notificações em tempo real de atualizações de bookings
 * Monitora mudanças no status de passeios e treinos
 */
export function useBookingNotifications(user, bookings) {
  useEffect(() => {
    if (!user?.email || !bookings) return;

    // Validar suporte a notificações
    const hasNotificationSupport = 'Notification' in window && Notification.permission === 'granted';
    if (!hasNotificationSupport) return;

    // Mapa para rastrear últimas notificações enviadas (evitar duplicatas)
    const sentNotifications = new Map();

    // Inscrever-se em atualizações de Bookings
    const unsubscribeBookings = base44.entities.Booking.subscribe((event) => {
      const booking = event.data;
      
      // Verificar se o booking é relevante para este usuário
      const isOwner = booking.created_by === user.email;
      const isWalker = booking.walker_email === user.email;
      
      if (!isOwner && !isWalker) return;

      // Evitar notificações duplicadas (mesma notificação em 5 segundos)
      const notifKey = `${event.id}-${booking.status}`;
      const lastSent = sentNotifications.get(notifKey);
      if (lastSent && Date.now() - lastSent < 5000) return;
      
      sentNotifications.set(notifKey, Date.now());

      // Mapear status para mensagens amigáveis
      const statusMessages = {
        pending: {
          owner: `⏳ Seu passeio de ${booking.dog_name} está aguardando confirmação`,
          walker: `📋 Novo pedido: ${booking.dog_name} em ${booking.pickup_address || 'sua área'}`
        },
        confirmed: {
          owner: `✅ Passeio confirmado! ${booking.walker_name} irá buscar ${booking.dog_name}`,
          walker: `✅ Você confirmou o passeio de ${booking.dog_name}`
        },
        in_progress: {
          owner: `🚶 Seu cão está em passeio! Abra o mapa para acompanhar`,
          walker: `🚶 Passeio em andamento de ${booking.dog_name}`
        },
        completed: {
          owner: `🎉 Passeio de ${booking.dog_name} foi concluído!`,
          walker: `✨ Passeio de ${booking.dog_name} finalizado com sucesso`
        },
        cancelled: {
          owner: `❌ Passeio cancelado. Reembolso: €${booking.refund_amount || 0}`,
          walker: `❌ Passeio cancelado por ${booking.owner_name}`
        }
      };

      const message = statusMessages[booking.status]?.[isOwner ? 'owner' : 'walker'];
      if (!message) return;

      // Enviar notificação push
      try {
        new Notification('PawCão - Atualização de Passeio', {
          body: message,
          icon: '/logo.png',
          badge: '/favicon.png',
          tag: `booking-${booking.id}`,
          requireInteraction: booking.status === 'in_progress',
          vibrate: [200, 100, 200],
          data: { bookingId: booking.id, url: `/MyBookings` }
        });

        // Log para tracking
        console.log(`📬 Notificação enviada: ${booking.id} - ${booking.status}`);
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
      }
    });

    // Cleanup
    return () => {
      unsubscribeBookings();
      sentNotifications.clear();
    };
  }, [user?.email, bookings]);
}

/**
 * Função auxiliar para enviar notificações manuais (ex: quando ativar modo profissional)
 */
export async function sendCustomNotification(title, body, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/favicon.png',
        ...options,
        body
      });
      return notification;
    } catch (error) {
      console.error('Erro ao enviar notificação customizada:', error);
      return null;
    }
  }
}

/**
 * Verificar se o navegador suporta notificações push
 */
export function notificationSupported() {
  return 'Notification' in window;
}

/**
 * Obter status de permissão atual
 */
export function getNotificationPermission() {
  if (!notificationSupported()) return 'unsupported';
  return Notification.permission;
}