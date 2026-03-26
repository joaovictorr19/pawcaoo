import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AnimatePresence } from 'framer-motion';
import ProfessionalAlert from './ProfessionalAlert';
import TutorUpdate from './TutorUpdate';

export default function NotificationManager() {
  const [notifications, setNotifications] = useState([]);
  const [userRole, setUserRole] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (currentUser?.role) {
      setUserRole(currentUser.role);
    }
  }, [currentUser?.role]);

  // Subscrever a notificações em tempo real
  useEffect(() => {
    if (!currentUser?.email) return;

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.recipient_email === currentUser.email) {
        addNotification(event.data);
      }
    });

    return () => unsubscribe();
  }, [currentUser?.email]);

  const addNotification = (notification) => {
    const id = Math.random().toString(36);
    const notif = { ...notification, _id: id };
    setNotifications(prev => [notif, ...prev]);

    // Auto-remover após 30s (para alertas de profissional) ou 8s (para tutores)
    const duration = notification.type === 'booking' ? 30000 : 8000;
    setTimeout(() => removeNotification(id), duration);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const handleAcceptRequest = async (notification) => {
    try {
      if (notification.related_id) {
        await base44.entities.EmergencyWalk.update(notification.related_id, {
          status: 'accepted',
          accepted_by_walker: currentUser.email,
          walker_name: currentUser.full_name
        });
      }
      removeNotification(notification._id);
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
    }
  };

  return (
    <AnimatePresence>
      {notifications.map(notif => {
        // Notificação para profissional (novo pedido)
        if (notif.type === 'booking' && userRole === 'walker') {
          return (
            <ProfessionalAlert
              key={notif._id}
              request={{
                pet_name: notif.title,
                pet_photo: notif.related_id ? 'https://images.unsplash.com/photo-1633722715463-d30628519d7b?w=100' : null,
                distance: '500',
                duration: '30',
                price: '15'
              }}
              onAccept={() => handleAcceptRequest(notif)}
              onDismiss={() => removeNotification(notif._id)}
            />
          );
        }

        // Notificação para tutor (status do passeio)
        if (notif.type === 'check_in' && userRole === 'user') {
          return (
            <TutorUpdate
              key={notif._id}
              status="arrived"
              walkerName={notif.related_id}
              petName="seu cão"
              onDismiss={() => removeNotification(notif._id)}
            />
          );
        }

        if (notif.type === 'check_out' && userRole === 'user') {
          return (
            <TutorUpdate
              key={notif._id}
              status="completed"
              walkerName={notif.related_id}
              petName="seu cão"
              onDismiss={() => removeNotification(notif._id)}
            />
          );
        }

        return null;
      })}
    </AnimatePresence>
  );
}