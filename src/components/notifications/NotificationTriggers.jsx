import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Componente que monitora condições e dispara notificações automáticas
 */
export default function NotificationTriggers({ user }) {
  // Monitorar reviews pendentes
  const { data: pendingReviews } = useQuery({
    queryKey: ['pendingReviews', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      
      const bookings = await base44.entities.Booking.filter({
        $or: [
          { owner_email: user.email },
          { created_by: user.email }
        ],
        status: 'completed'
      });

      return bookings.filter(b => !b.review_id);
    },
    enabled: !!user?.email,
    refetchInterval: 60000, // Check a cada 1 minuto
  });

  // Lembrete de review 24h após conclusão
  useEffect(() => {
    if (!pendingReviews || pendingReviews.length === 0) return;

    const checkReviewReminders = async () => {
      const now = Date.now();
      
      for (const booking of pendingReviews) {
        if (!booking.completed_date) continue;
        
        const completedTime = new Date(booking.completed_date).getTime();
        const hoursSinceCompleted = (now - completedTime) / (1000 * 60 * 60);
        
        // Se passou 24h e não tem review, criar lembrete
        if (hoursSinceCompleted >= 24 && hoursSinceCompleted < 24.5) {
          try {
            // Verificar se já existe notificação de lembrete
            const existing = await base44.entities.Notification.filter({
              recipient_email: user.email,
              type: 'booking',
              related_id: booking.id
            });

            const hasReminder = existing.some(n => 
              n.title.includes('Avalie') || n.message.includes('avaliação')
            );

            if (!hasReminder) {
              await base44.entities.Notification.create({
                recipient_email: user.email,
                title: '⭐ Lembrete: Avalie seu Passeio',
                message: `Como foi o passeio com ${booking.walker_name}? Sua avaliação ajuda outros donos!`,
                type: 'booking',
                related_id: booking.id,
                priority: 'normal',
                action_url: `/MyBookings?review=${booking.id}`
              });
              
              console.log('📧 Lembrete de review enviado:', booking.id);
            }
          } catch (error) {
            console.error('Erro ao criar lembrete:', error);
          }
        }
      }
    };

    checkReviewReminders();
  }, [pendingReviews, user?.email]);

  // ✅ Monitorar mensagens de chat em rides ativos
  const { data: activeRides } = useQuery({
    queryKey: ['myActiveRides', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Booking.filter({
        $or: [
          { walker_email: user.email },
          { owner_email: user.email },
          { created_by: user.email }
        ],
        status: 'in_progress'
      });
    },
    enabled: !!user?.email,
    refetchInterval: 10000,
  });

  // Notificar quando recebe mensagem de chat
  useEffect(() => {
    if (!activeRides || activeRides.length === 0) return;

    const checkChatMessages = async () => {
      for (const ride of activeRides) {
        try {
          const messages = await base44.entities.ChatMessage.filter({
            booking_id: ride.id
          }, '-created_date', 1);

          if (messages.length > 0) {
            const lastMsg = messages[0];
            const isFromOther = lastMsg.sender_email !== user.email;
            const isRecent = (Date.now() - new Date(lastMsg.created_date).getTime()) < 15000;

            if (isFromOther && isRecent) {
              // Browser Push
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`💬 ${lastMsg.sender_name}`, {
                  body: lastMsg.content.substring(0, 100),
                  icon: '/logo.png',
                  badge: '/favicon.png',
                  tag: `chat_${ride.id}`,
                  requireInteraction: false
                });
              }
            }
          }
        } catch (err) {
          console.error('Erro ao verificar mensagens:', err);
        }
      }
    };

    checkChatMessages();
  }, [activeRides, user?.email]);

  return null; // Componente invisível
}