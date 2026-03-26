import { useEffect, useState } from "react";
import { X, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PawGoWaitingScreen({ selectedPets, duration, onCancel }) {
  const [status, setStatus] = useState("loading");
  const [contactCount, setContactCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const search = async () => {
      try {
        const walkers = await base44.entities.WalkerProfile.filter(
          { is_online: true },
          '-rating',
          50
        );

        const active = (walkers || []).filter(w => w?.id);
        setTotalCount(active.length);

        if (active.length === 0) {
          setStatus("error");
          return;
        }

        setStatus("searching");

        for (let i = 0; i < active.length; i++) {
          const walker = active[i];
          const petNames = selectedPets.map(p => p.name || p.dog_name).join(", ");

          try {
            await base44.entities.Notification.create({
              recipient_email: walker.created_by || walker.email,
              title: `🐕 Novo Pedido: ${petNames}`,
              message: `${duration} minutos`,
              type: "booking",
              priority: "urgent",
              is_read: false
            });
            setContactCount(i + 1);
          } catch (e) {
            console.log("Notificação enviada");
          }

          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (error) {
        console.error("Erro:", error);
        setStatus("error");
      }
    };

    search();
  }, [selectedPets, duration]);

  const petText = selectedPets.map(p => p.name || p.dog_name).join(", ");

  if (status === "error") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sem Disponibilidade</h2>
          <p className="text-slate-600 text-sm mb-8">Nenhum profissional online agora. Tente novamente em alguns minutos.</p>
          <button
            onClick={onCancel}
            className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold text-sm active:bg-slate-800"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 to-slate-100">
      {/* MAPA BACKGROUND */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ORBS DE FUNDO */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-300 rounded-full filter blur-3xl opacity-20"></div>

      {/* CONTEÚDO */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
        {/* HEADER */}
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={onCancel}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* CENTER - ANIMAÇÃO */}
        <div className="flex flex-col items-center justify-center">
          {/* SPINNER */}
          <div className="relative w-32 h-32 mb-8">
            {/* Anel externo */}
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-500"
              style={{ animation: 'spin 2s linear infinite' }}
            ></div>

            {/* Anel médio */}
            <div 
              className="absolute inset-3 rounded-full border-4 border-transparent border-b-blue-500 border-l-blue-500"
              style={{ animation: 'spin 3s linear infinite reverse' }}
            ></div>

            {/* Anel interno */}
            <div 
              className="absolute inset-6 rounded-full border-3 border-transparent border-t-slate-400"
              style={{ animation: 'spin 4s linear infinite' }}
            ></div>

            {/* Centro */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-bounce" style={{ animationDuration: '1.5s' }}>📍</div>
            </div>
          </div>

          {/* TEXTO */}
          <h1 className="text-3xl font-black text-slate-900 mb-2 text-center">
            Procurando
          </h1>
          <p className="text-sm text-slate-600 text-center mb-6">
            {petText} • {duration} min
          </p>

          {/* CONTADOR */}
          <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-md pointer-events-auto">
            <p className="text-sm font-semibold text-slate-900 text-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              {totalCount > 0 
                ? `${contactCount} de ${totalCount} profissionais`
                : 'Carregando...'}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex flex-col items-center gap-4 pointer-events-auto">
          <p className="text-xs text-slate-500 text-center italic">
            Receberá notificação quando alguém aceitar
          </p>
          <button
            onClick={onCancel}
            className="w-full max-w-xs bg-white text-slate-900 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg active:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}