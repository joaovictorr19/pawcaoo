import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export function useRealTimeRequests(userEmail) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!userEmail) return;

    // 1. Carregar pedidos iniciais que estão disponíveis
    const fetchInitial = async () => {
      const available = await base44.entities.EmergencyWalk.filter({ status: 'available' });
      setRequests(available);
    };
    fetchInitial();

    // 2. Subscrever a mudanças em tempo real
    const unsubscribe = base44.entities.EmergencyWalk.subscribe((event) => {
      // Novo pedido na área
      if (event.type === 'create' && event.data.status === 'available') {
        setRequests(prev => [event.data, ...prev]);
        
        // FEEDBACK DE ELITE:
        // Som de notificação (opcional, requer um ficheiro mp3 na pasta public)
        const audio = new Audio('/sounds/new-request.mp3');
        audio.play().catch(() => { /* autoplay bloqueado pelo browser */ });

        // Vibração física (Padrão: Curto-Longo-Curto)
        if ("vibrate" in navigator) {
          navigator.vibrate([100, 50, 200]);
        }

        toast.info("🚨 NOVO PEDIDO PAWGO!", {
          description: `Um patudo precisa de ti em ${event.data.location}`,
          duration: 10000, // Fica visível por 10 segundos
        });
      }

      // Se alguém aceitou ou o cliente cancelou, removemos da lista
      if (event.type === 'update' && event.data.status !== 'available') {
        setRequests(prev => prev.filter(req => req.id !== event.data.id));
      }
    });

    return () => unsubscribe();
  }, [userEmail]);

  return requests;
}