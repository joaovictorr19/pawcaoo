import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PawGoWaitingScreen({ selectedPets, duration, onCancel }) {
  const [status, setStatus] = useState("loading");
  const [notificationsSent, setNotificationsSent] = useState(0);
  const [totalWalkers, setTotalWalkers] = useState(0);

  useEffect(() => {
    const initSearch = async () => {
      try {
        const walkers = await base44.entities.WalkerProfile.filter(
          { is_online: true },
          '-rating',
          50
        );

        const activeWalkers = (walkers || []).filter(w => w?.id);
        setTotalWalkers(activeWalkers.length);

        if (activeWalkers.length === 0) {
          setStatus("error");
          return;
        }

        setStatus("searching");

        for (let i = 0; i < activeWalkers.length; i++) {
          const walker = activeWalkers[i];
          const petNames = selectedPets.map(p => p.name || p.dog_name).join(", ");
          
          try {
            await base44.entities.Notification.create({
              recipient_email: walker.user_id || walker.created_by || walker.email,
              title: "📍 Novo Pedido PawGo",
              message: `${petNames} • ${duration} min`,
              type: "booking",
              priority: "urgent"
            });
            setNotificationsSent(i + 1);
          } catch (err) {
            console.error(`Erro notificando walker:`, err);
          }

          await new Promise(r => setTimeout(r, 800));
        }
      } catch (error) {
        console.error("Erro ao iniciar busca:", error);
        setStatus("error");
      }
    };

    initSearch();
  }, [selectedPets, duration]);

  const petNames = selectedPets.map(p => p.name || p.dog_name).join(", ");

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden">
      {/* MAPA FULL-SCREEN */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
        {/* Padrão de mapa estilo Uber */}
        <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Orbs animados de fundo */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-orange-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* PAINEL DE PROCURA - ESTILO UBER */}
      <div className="absolute inset-0 flex flex-col items-center justify-between pointer-events-none">
        {/* TOPO - Info minimalista */}
        <div className="pt-6 px-4 pointer-events-auto w-full max-w-md mx-auto">
          <button 
            onClick={onCancel}
            className="ml-auto block w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-slate-700 hover:bg-white transition-all shadow-sm"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* CENTRO - Animação de procura */}
        <div className="flex flex-col items-center justify-center flex-1 pointer-events-none">
          {status === "error" ? (
            // Estado de erro
            <div className="text-center px-6 mb-20">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">Sem Profissionais</h2>
              <p className="text-sm text-slate-600 mb-6">Nenhum profissional disponível agora. Tente novamente em poucos minutos.</p>
              <button
                onClick={onCancel}
                className="pointer-events-auto bg-slate-900 text-white px-6 py-3 rounded-full font-semibold text-sm hover:bg-slate-800 transition-all"
              >
                Voltar
              </button>
            </div>
          ) : (
            // Estado de carregamento/procura
            <div className="text-center mb-32 px-6">
              {/* Spinner principal com múltiplos anéis */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                {/* Anel 1 */}
                <div className="absolute inset-0 border-2 border-transparent border-t-orange-500 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                
                {/* Anel 2 */}
                <div className="absolute inset-2 border-2 border-transparent border-r-blue-500 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
                
                {/* Anel 3 */}
                <div className="absolute inset-4 border-2 border-transparent border-b-slate-400 rounded-full animate-spin" style={{ animationDuration: '4s' }}></div>

                {/* Centro com ícone */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-orange-600 animate-bounce" />
                </div>
              </div>

              {/* Texto dinâmico */}
              <h2 className="text-2xl font-black text-slate-900 mb-1">
                Procurando Profissional
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                {petNames} • {duration} minutos
              </p>

              {/* Contadores */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-md rounded-full text-xs font-semibold text-slate-700">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {totalWalkers > 0 
                  ? `${notificationsSent} de ${totalWalkers} contactados`
                  : 'Procurando...'}
              </div>
            </div>
          )}
        </div>

        {/* FUNDO - Dica */}
        {status !== "error" && (
          <div className="pb-8 px-6 text-center pointer-events-none">
            <p className="text-xs text-slate-500 italic">
              Receberá notificação assim que alguém aceitar
            </p>
          </div>
        )}
      </div>

      {/* Botão Cancelar flutuante (mobile) */}
      {status !== "error" && (
        <button
          onClick={onCancel}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-white text-slate-900 px-6 py-3 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl transition-all md:hidden"
        >
          Cancelar Procura
        </button>
      )}
    </div>
  );
}