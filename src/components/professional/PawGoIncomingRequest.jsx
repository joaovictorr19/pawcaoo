import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

// Hook para tocar o alerta sonoro
export function usePawGoAlert() {
  const playPawGoAlert = () => {
    try {
      const audio = new Audio('/sounds/pawgo-notification.mp3');
      audio.play().catch(err => {
      });
    } catch (err) {
      console.error("Erro ao carregar áudio:", err);
    }
  };

  return { playPawGoAlert };
}

// Componente principal - Pop-up de aceitação
export default function PawGoIncomingRequest({ request, onAccept, onDecline }) {
  const [timer, setTimer] = useState(30);
  const { playPawGoAlert } = usePawGoAlert();

  // Timer com auto-recusa aos 0 segundos
  useEffect(() => {
    if (timer > 0) {
      const timeout = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timeout);
    } else if (timer === 0 && onDecline) {
      onDecline();
    }
  }, [timer, onDecline]);

  // Tocar som quando o popup aparece
  useEffect(() => {
    playPawGoAlert();
  }, [playPawGoAlert]);

  const handleAccept = () => {
    if (onAccept) onAccept(request);
  };

  const handleDecline = () => {
    setTimer(0);
    if (onDecline) onDecline(request);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[3rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-4 border-orange-500 animate-in zoom-in duration-300">
        
        {/* Cabeçalho com Timer */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 animate-pulse bg-orange-600/50" />
          <p className="text-white font-black uppercase text-[10px] tracking-[0.2em] relative z-10">Novo Pedido PawGo</p>
          <div className={`text-4xl font-black text-white relative z-10 ${timer <= 10 ? 'animate-bounce' : ''}`}>
            {timer}s
          </div>
        </div>

        <div className="p-8 text-center">
          {/* Foto do Pet */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            {request.dog_photo_url || request.pet_photo ? (
              <img 
                src={request.dog_photo_url || request.pet_photo}
                className="w-full h-full object-cover rounded-[2.5rem] border-4 border-slate-100 shadow-xl"
                alt={request.dog_name || request.pet_name}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl rounded-[2.5rem] border-4 border-slate-100 shadow-xl bg-slate-100">
                🐕
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-xl text-white shadow-lg animate-bounce">
              <Zap size={20} fill="currentColor" />
            </div>
          </div>

          {/* Nome do Pet */}
          <h2 className="text-2xl font-black text-slate-900 uppercase italic mb-2">
            {request.dog_name || request.pet_name || 'Pet'}
          </h2>
          
          {/* Detalhes do Passeio */}
          <p className="text-slate-400 font-bold text-[10px] uppercase mb-6 tracking-tighter">
            Passeio de {request.duration || 30} min • {request.distance || 0}m de ti
          </p>

          {/* Preço e Informação */}
          {request.total_amount && (
            <div className="bg-slate-50 rounded-2xl p-3 mb-6 border border-slate-200">
              <p className="text-xs text-slate-600 font-bold uppercase tracking-widest mb-1">Valor do Passeio</p>
              <p className="text-2xl font-black text-orange-500">€{request.total_amount.toFixed(2)}</p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleAccept}
              className="w-full h-16 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-green-500/30 active:scale-95 transition-all hover:shadow-green-500/50"
            >
              Aceitar Passeio
            </button>
            <button 
              onClick={handleDecline}
              className="w-full h-12 text-slate-400 font-bold uppercase text-[10px] hover:text-red-500 transition-colors active:scale-95"
            >
              Recusar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}