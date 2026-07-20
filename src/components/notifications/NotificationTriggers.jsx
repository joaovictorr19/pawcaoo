import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getCurrentUser } from "@/utils/getCurrentUser";

/**
 * Componente que monitora condições e dispara notificações automáticas
 */
export default function NotificationTriggers({ user }) {
  const { data: notifPrefs } = useQuery({
    queryKey: ['notifPrefs-local', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const recs = await base44.entities.NotificationPreference.filter({ user_email: user.email });
      return recs[0]?.preferences || null;
    },
    enabled: !!user?.email,
    staleTime: 60 * 1000,
  });

  const allowPush = (type) => {
    if (!notifPrefs) return true;
    const key = type;
    return notifPrefs[key]?.push !== false;
  };

  const allowInApp = (type) => {
    if (!notifPrefs) return true;
    const key = type;
    return notifPrefs[key]?.in_app !== false;
  };
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

  // ✅ Monitorar checkpoints de comportamento
  const { data: behaviorCheckpoints } = useQuery({
    queryKey: ['behaviorCheckpoints', user?.email, activeRides],
    queryFn: async () => {
      if (!activeRides || activeRides.length === 0) return [];
      
      const allCheckpoints = [];
      for (const ride of activeRides) {
        const checkpoints = await base44.entities.WalkCheckpoint.filter({
          booking_id: ride.id,
          checkpoint_type: 'behavior_note'
        }, '-created_date', 1);
        
        if (checkpoints.length > 0) {
          allCheckpoints.push({ ...checkpoints[0], booking: ride });
        }
      }
      return allCheckpoints;
    },
    enabled: !!user?.email && !!activeRides && activeRides.length > 0,
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

  // ✅ Notificar quando há atualização de comportamento
  useEffect(() => {
    if (!behaviorCheckpoints || behaviorCheckpoints.length === 0) return;

    const notifyBehaviorUpdate = async () => {
      for (const checkpoint of behaviorCheckpoints) {
        try {
          const isRecent = (Date.now() - new Date(checkpoint.created_date).getTime()) < 15000;
          const isOwner = checkpoint.booking?.created_by === user.email || checkpoint.booking?.owner_email === user.email;

          if (isRecent && isOwner && checkpoint.dog_behavior) {
            const behavior = checkpoint.dog_behavior;
            const moodEmojis = {
              happy: "😊",
              calm: "😌",
              excited: "🤩",
              anxious: "😰",
              tired: "😴"
            };

            // Browser Push Native
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification('🐕 Atualização de Comportamento', {
                body: `${checkpoint.booking.dog_name} está ${behavior.mood} ${moodEmojis[behavior.mood] || ''} com energia ${behavior.energy_level}`,
                icon: '/logo.png',
                badge: '/favicon.png',
                tag: `behavior_${checkpoint.booking.id}`,
                requireInteraction: false,
                vibrate: [200, 100, 200],
                silent: false
              });

              // Auto close após 6 segundos
              setTimeout(() => notification.close(), 6000);
            }
          }
        } catch (err) {
          console.error('Erro ao notificar comportamento:', err);
        }
      }
    };

    notifyBehaviorUpdate();
  }, [behaviorCheckpoints, user?.email]);

  // ─── Booking status real-time → criar notificações ──────────────────────────
  useEffect(() => {
    if (!user?.email) return;
    const last = new Map();

    const unsubscribe = base44.entities.Booking.subscribe(async (event) => {
      const b = event.data;
      if (!b) return;

      // New booking for professional
      if (event.type === 'create' && b.walker_email === user.email) {
        try {
          await base44.entities.Notification.create({
            recipient_email: user.email,
            title: '🆕 Nova reserva',
            message: `${b.owner_name || 'Cliente'} reservou para ${b.dog_name || 'seu animal'} (${b.walk_date || ''}).`,
            type: 'booking',
            link: '/ProfessionalHubV2',
            related_id: b.id
          });
        } catch {}
      }

      // Status updates for owner
      const prev = last.get(b.id);
      last.set(b.id, b.status);
      const isOwner = (b.owner_email === user.email) || (b.created_by === user.email);
      const isWalker = b.walker_email === user.email;
      if (!prev || prev === b.status) return;

      const notifyBrowser = (title, body, tag) => {
        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, tag, icon: '/logo.png', badge: '/favicon.png' });
          }
        } catch {}
      };

      if (isOwner) {
        if (b.status === 'confirmed' && allowInApp('booking')) {
          await base44.entities.Notification.create({
            recipient_email: user.email,
            title: '✅ Reserva aceite',
            message: `${b.walker_name || 'Profissional'} aceitou o seu pedido para ${b.walk_date || ''}.`,
            type: 'booking',
            related_id: b.id,
            link: '/MyBookings'
          });
          if (allowPush('booking')) notifyBrowser('Reserva aceite', 'O profissional confirmou o passeio.', `booking_${b.id}_confirmed`);
        }
        if (b.status === 'in_progress' && allowInApp('booking')) {
          await base44.entities.Notification.create({
            recipient_email: user.email,
            title: '🚶 Passeio iniciado',
            message: `${b.walker_name || 'Profissional'} iniciou o passeio de ${b.dog_name || 'o seu cão'}.`,
            type: 'booking',
            related_id: b.id,
            link: '/MyBookings'
          });
          if (allowPush('booking')) notifyBrowser('Passeio iniciado', 'O passeio está em curso.', `booking_${b.id}_started`);
        }
        if ((b.status === 'service_completed' || b.status === 'completed') && allowInApp('booking')) {
          await base44.entities.Notification.create({
            recipient_email: user.email,
            title: '🎉 Passeio concluído',
            message: `O passeio de ${b.dog_name || 'o seu cão'} foi concluído.`,
            type: 'booking',
            related_id: b.id,
            link: '/MyBookings'
          });
          if (allowPush('booking')) notifyBrowser('Passeio concluído', 'Obrigado por usar a PawCão!', `booking_${b.id}_done`);
        }
      }

      // Canceled → notify professional
      if (isWalker && b.status === 'cancelled') {
        try {
          await base44.entities.Notification.create({
            recipient_email: user.email,
            title: '❌ Reserva cancelada',
            message: `${b.owner_name || 'Cliente'} cancelou a reserva de ${b.dog_name || ''}.`,
            type: 'booking',
            related_id: b.id,
            link: '/ProfessionalHubV2'
          });
        } catch {}
      }
    });

    return () => unsubscribe();
  }, [user?.email, notifPrefs]);

  // ─── Atrasos: alerta se passou 10 min do horário e não iniciou ───────────────
  useEffect(() => {
    if (!user?.email) return;
    const timer = setInterval(async () => {
      try {
        const today = new Date().toISOString().slice(0,10);
        const my = await base44.entities.Booking.filter({ owner_email: user.email, walk_date: today });
        const now = new Date();
        for (const b of my) {
          if ((b.status === 'pending' || b.status === 'confirmed') && b.walk_time) {
            const [hh, mm] = String(b.walk_time).split(':');
            const sched = new Date(today + 'T' + (hh?.padStart(2,'0')||'00') + ':' + (mm?.padStart(2,'0')||'00') + ':00');
            if ((now - sched) > 10*60*1000) {
              // One-off marker per booking in sessionStorage
              const key = `delay_notified_${b.id}`;
              if (!sessionStorage.getItem(key)) {
                if (allowInApp('alert')) {
                  await base44.entities.Notification.create({
                    recipient_email: user.email,
                    title: '⏱️ Possível atraso',
                    message: `O passeio com ${b.walker_name || 'profissional'} parece atrasado.`,
                    type: 'alert',
                    related_id: b.id,
                    link: '/MyBookings'
                  });
                }
                if (allowPush('alert') && 'Notification' in window && Notification.permission === 'granted') {
                  new Notification('Possível atraso', { body: 'O passeio ainda não começou.', tag: `booking_${b.id}_delay`, icon: '/logo.png' });
                }
                sessionStorage.setItem(key, '1');
              }
            }
          }
        }
      } catch {}
    }, 60000);
    return () => clearInterval(timer);
  }, [user?.email, notifPrefs]);

  // ─── Reservas de hotel com pagamento pendente (5 min) — aviso global ─────────
  useEffect(() => {
    if (!user?.email) return;

    let active = true;

    const checkPendingHotelPayments = async () => {
      try {
        const pending = await base44.entities.HotelBooking.filter({
          owner_email: user.email,
          payment_status: 'pending',
          status: 'pending'
        }, '-created_date', 10);

        if (!active || !pending || pending.length === 0) return;

        for (const booking of pending) {
          if (!booking.payment_expires_at) continue;
          const expiresAt = new Date(booking.payment_expires_at);
          const now = new Date();
          if (expiresAt <= now) continue; // já expirou, o sistema cancela

          const minutesLeft = Math.max(0, Math.ceil((expiresAt - now) / 60000));
          const sessionKey = `hotel_pay_notified_${booking.id}`;

          // Notificar apenas uma vez por sessão do navegador
          if (sessionStorage.getItem(sessionKey)) continue;
          sessionStorage.setItem(sessionKey, '1');

          // Notificação in-app
          if (allowInApp('payment')) {
            try {
              await base44.entities.Notification.create({
                recipient_email: user.email,
                title: '⏰ Pagamento pendente — reserva pode ser cancelada',
                message: `Tens uma reserva no "${booking.hotel_name || 'Hotel'}" (${booking.total_amount}€) por pagar. Se não pagares em ${minutesLeft} min, a reserva será cancelada automaticamente.`,
                type: 'payment',
                is_read: false,
                link: '/ClientDashboard',
                icon: '⏰',
                related_id: booking.id
              });
            } catch {}
          }

          // Browser push
          if (allowPush('payment') && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('⏰ Pagamento pendente', {
                body: `Reserva no ${booking.hotel_name || 'Hotel'} — ${minutesLeft} min restantes antes de cancelamento.`,
                tag: `hotel_pay_${booking.id}`,
                icon: '/logo.png',
                badge: '/favicon.png',
                requireInteraction: true
              });
            } catch {}
          }
        }
      } catch (err) {
        // silencioso
      }
    };

    // Verificar imediatamente ao montar (utilizador pode ter voltado ao site)
    checkPendingHotelPayments();
    // Re-verificar a cada 30s para apanhar countdown
    const interval = setInterval(checkPendingHotelPayments, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user?.email, notifPrefs]);

  // ─── Pedidos urgentes PawGo (EmergencyWalk) para profissionais ───────────────
  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = base44.entities.EmergencyWalk.subscribe(async (event) => {
      try {
        if (event.type !== 'create') return;
        const ew = event.data;
        if (!ew || ew.status !== 'available') return;
        const me = await getCurrentUser();
        const isPro = ['walker','both','professional'].includes(me?.account_type);
        if (!isPro) return;
        if (allowInApp('alert')) {
          await base44.entities.Notification.create({
            recipient_email: user.email,
            title: '⚡ Pedido urgente PawGo',
            message: `${ew.owner_name || 'Cliente'} precisa de um passeio ${ew.needed_time || 'agora'} em ${ew.location || ''}.`,
            type: 'alert',
            related_id: ew.id,
            link: '/ProfessionalHubV2'
          });
        }
        if (allowPush('alert') && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Pedido urgente PawGo', { body: 'Novo pedido disponível na sua área.', tag: `pawgo_${ew.id}`, icon: '/logo.png' });
        }
      } catch {}
    });
    return () => unsubscribe();
  }, [user?.email, notifPrefs]);

  return null; // Componente invisível
}