import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export function useRealTimeRequests(user) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || !user.pawgo_status?.is_online) return;

    // Subscreve em tempo real à tabela de passeios de emergência
    const unsubscribe = base44.entities.EmergencyWalk.subscribe((event) => {
      if (event.type === 'create' && event.data.status === 'available') {
        
        // Fazer o telemóvel vibrar (padrão de alerta)
        if (typeof navigator !== 'undefined' && "vibrate" in navigator) {
          navigator.vibrate([200, 100, 200, 100, 500]);
        }
        
        // Notificação visual imersiva
        toast('🚨 Novo Pedido Urgente!', {
          description: `${event.data.owner_name} precisa de si em ${event.data.location}. Recebe €${event.data.service_amount || event.data.offered_amount}!`,
          style: { 
            background: '#f97316', 
            color: 'white', 
            border: 'none',
            borderRadius: '16px',
            fontWeight: 'bold'
          },
          duration: 8000
        });

        // Atualizar imediatamente a lista sem refresh
        queryClient.invalidateQueries(['emergencyWalksPending']);
      }
    });

    return () => unsubscribe();
  }, [user, queryClient]);
}