import { useEffect, useState } from "react";
import { MapPin, X, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function PawGoWaitingScreen({ selectedPets, duration, onCancel }) {
  const [status, setStatus] = useState("loading"); // loading | searching | error
  const [onlineWalkers, setOnlineWalkers] = useState([]);
  const [notificationsSent, setNotificationsSent] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. Carregar walkers online + enviar notificações
  useEffect(() => {
    const initSearch = async () => {
      try {
        console.log("🔍 Buscando walkers online...");
        
        // Buscar walkers online
        const walkers = await base44.entities.WalkerProfile.filter(
          { is_online: true },
          '-rating',
          50
        );

        const activeWalkers = (walkers || []).filter(w => w?.id && w?.is_active);
        console.log(`✅ Encontrados ${activeWalkers.length} walkers online`);

        if (activeWalkers.length === 0) {
          setStatus("error");
          setErrorMsg("Nenhum profissional disponível no momento. Tente novamente em alguns minutos.");
          return;
        }

        setOnlineWalkers(activeWalkers);
        setStatus("searching");

        // Enviar notificações 1 por 1
        for (let i = 0; i < activeWalkers.length; i++) {
          const walker = activeWalkers[i];
          console.log(`📤 Enviando notificação ${i + 1}/${activeWalkers.length} para ${walker.walker_name}`);

          try {
            const petNames = selectedPets.map(p => p.name || p.dog_name).join(", ");
            
            await base44.entities.Notification.create({
              recipient_email: walker.user_id || walker.created_by || walker.email,
              title: "📍 Novo Pedido PawGo",
              message: `${petNames} • ${duration} min`,
              type: "booking",
              priority: "urgent",
              is_read: false
            });

            setNotificationsSent(i + 1);
            await new Promise(r => setTimeout(r, 500));
          } catch (err) {
            console.error(`❌ Erro notificando ${walker.walker_name}:`, err);
          }
        }

        console.log("✅ Todas as notificações foram enviadas");

      } catch (error) {
        console.error("❌ Erro ao iniciar busca:", error);
        setStatus("error");
        setErrorMsg("Erro ao buscar profissionais. Tente novamente.");
      }
    };

    initSearch();
  }, [selectedPets, duration]);

  const petNames = selectedPets.map(p => p.name || p.dog_name).join(", ");

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* MAPA PLACEHOLDER */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
        <div className="text-center">
          <MapPin size={64} className="text-slate-400 mx-auto mb-4 opacity-30" />
          <p className="text-slate-400 text-sm font-semibold">Mapa em tempo real</p>
        </div>
      </div>

      {/* PAINEL DE PROCURA */}
      <div className="absolute bottom-6 sm:bottom-10 left-4 sm:left-6 right-4 sm:right-6 z-50">
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-[3rem] p-4 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white animate-in slide-in-from-bottom-8 duration-700">
          
          {/* CABEÇALHO */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-black uppercase text-slate-900 text-xs sm:text-sm mb-1 leading-tight">
                {status === "error" ? "Sem Profissionais" : "Procurando Profissional"}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                {petNames} • {duration} min • {duration === 30 ? '12€' : '20€'}
              </p>
            </div>
            <button 
              onClick={onCancel}
              className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-all ml-2"
            >
              <X size={16} className="sm:block hidden" />
              <X size={14} className="sm:hidden" />
            </button>
          </div>

          {/* CONTEÚDO */}
          {status === "error" ? (
            // Error state
            <div className="p-3 sm:p-4 bg-red-50 rounded-xl sm:rounded-[2rem] border border-red-200 mb-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-red-900 mb-2">{errorMsg}</p>
                  <Button 
                    onClick={onCancel}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white h-7 sm:h-8 text-[10px] sm:text-xs px-3"
                  >
                    Voltar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Loading/Searching state
            <div className="flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-[2rem] border border-slate-100">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                  <div className="absolute inset-0 border-2 border-slate-200 rounded-full"></div>
                  <div className="absolute inset-0 border-2 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight">
                    {status === "loading" ? "Carregando..." : "À espera..."}
                  </p>
                  <p className="text-[8px] sm:text-[10px] text-slate-400 mt-0.5 truncate">
                    {onlineWalkers.length > 0 
                      ? `${notificationsSent}/${onlineWalkers.length}`
                      : "Procurando..."}
                  </p>
                </div>
              </div>

              <Button 
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="text-[10px] sm:text-xs px-2 sm:px-3 h-7 sm:h-9 flex-shrink-0"
              >
                Cancelar
              </Button>
            </div>
          )}

          {/* DICA */}
          {status !== "error" && (
            <p className="text-[8px] sm:text-[9px] text-slate-400 text-center mt-2 sm:mt-3 italic">
              Receberá notificação quando um profissional aceitar
            </p>
          )}
        </div>
      </div>

    </div>
  );
}