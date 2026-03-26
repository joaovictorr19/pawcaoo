import { useEffect, useState } from "react";
import { MapPin, Loader2, Phone, MessageCircle, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function PawGoWaitingScreen({ selectedPets, duration, onCancel }) {
  const [notificationsSent, setNotificationsSent] = useState(false);
  const [onlineWalkers, setOnlineWalkers] = useState([]);
  const [matchedWalker, setMatchedWalker] = useState(null);
  const [notificationIndex, setNotificationIndex] = useState(0);

  // 1. Fetch online walkers + send notifications 1 by 1
  useEffect(() => {
    const sendNotifications = async () => {
      try {
        // Get all online walkers
        const walkers = await base44.entities.WalkerProfile.filter({ is_online: true }, '-rating', 50);
        const activeWalkers = walkers.filter(w => w?.id && w?.is_active);
        setOnlineWalkers(activeWalkers);

        if (activeWalkers.length === 0) return;

        // Send notifications 1 by 1
        for (let i = 0; i < activeWalkers.length; i++) {
          const walker = activeWalkers[i];
          setNotificationIndex(i + 1);

          try {
            // Create notification for this walker
            await base44.entities.Notification.create({
              recipient_email: walker.user_id || walker.created_by,
              title: "Nova Solicitação PawGo",
              message: `Novo pedido para ${selectedPets.map(p => p.name).join(", ")} - ${duration} minutos`,
              type: "booking",
              priority: "urgent",
              is_read: false
            });

            // Small delay between notifications
            await new Promise(r => setTimeout(r, 300));
          } catch (err) {
            console.error(`Erro ao notificar walker ${walker.walker_name}:`, err);
          }
        }

        setNotificationsSent(true);
      } catch (error) {
        console.error("Erro ao enviar notificações:", error);
        setNotificationsSent(true);
      }
    };

    sendNotifications();
  }, [selectedPets, duration]);

  // 2. Listen for walker acceptance (via real-time subscription)
  useEffect(() => {
    if (!notificationsSent) return;

    const unsubscribe = base44.entities.WalkerProfile.subscribe((event) => {
      if (event.type === 'update' && event.data?.is_online === true) {
        // Simulate matcher accepting
        setMatchedWalker(event.data);
      }
    });

    return unsubscribe;
  }, [notificationsSent]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* MAPA PLACEHOLDER */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
        <div className="text-center">
          <MapPin size={64} className="text-slate-400 mx-auto mb-4 opacity-30" />
          <p className="text-slate-400 text-sm font-semibold">Mapa em tempo real</p>
        </div>
      </div>

      {/* PAINEL DE PROCURA (FLUTUANTE NO FUNDO) */}
      <div className="absolute bottom-10 left-6 right-6 z-50">
        <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white animate-in slide-in-from-bottom-8 duration-700">
          
          {/* CABEÇALHO */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black uppercase text-slate-900 text-sm mb-1">
                Procurando Profissional
              </h3>
              <p className="text-xs text-slate-500">
                {selectedPets.map(p => p.name).join(", ")} • {duration} min • {duration === 30 ? '12€' : '20€'}
              </p>
            </div>
            <button 
              onClick={onCancel}
              className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* SPINNER + TEXTO */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-2 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {notificationsSent ? "À espera de resposta..." : "Enviando pedidos..."}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {onlineWalkers.length > 0 
                    ? `${notificationIndex} de ${onlineWalkers.length} profissionais contactados`
                    : "Carregando profissionais..."}
                </p>
              </div>
            </div>

            {/* BOTÃO CANCELAR */}
            <Button 
              onClick={onCancel}
              variant="outline"
              size="sm"
              className="text-xs px-3 h-9"
            >
              Cancelar
            </Button>
          </div>

          {/* DICA */}
          <p className="text-[9px] text-slate-400 text-center mt-3 italic">
            Receberá notificação quando um profissional aceitar o seu pedido
          </p>
        </div>
      </div>

    </div>
  );
}