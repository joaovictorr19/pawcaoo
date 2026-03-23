import { AlertTriangle, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export function SOSButton({ userId }) {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef(null);

  const startPress = () => {
    setIsPressing(true);
    // Vibração inicial de aviso
    if ("vibrate" in navigator) navigator.vibrate(100);
    
    timerRef.current = setTimeout(() => {
      triggerSOS();
    }, 2500); // Precisa segurar 2.5 segundos para evitar erro
  };

  const cancelPress = () => {
    setIsPressing(false);
    clearTimeout(timerRef.current);
  };

  const triggerSOS = async () => {
    if ("vibrate" in navigator) navigator.vibrate([500, 200, 500]); // SOS Morse pattern
    
    try {
      // Atualiza o User.json para modo emergência
      await base44.entities.User.update(userId, {
        "pawgo_status.emergency_mode": {
          is_active: true,
          activated_at: new Date().toISOString()
        }
      });
      toast.error("🚨 ALERTA SOS ENVIADO AO ADMIN!");
    } catch (e) {
      toast.error("Falha ao enviar SOS. Tente ligar 112.");
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <button
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        className={`w-full h-20 rounded-2xl flex items-center justify-center gap-4 transition-all duration-300 select-none
          ${isPressing 
            ? 'bg-red-700 scale-95 shadow-inner' 
            : 'bg-red-600 shadow-[0_8px_0_rgb(153,27,27)] active:shadow-none active:translate-y-[4px]'
          } text-white`}
      >
        <div className={`p-2 rounded-full bg-white/20 ${isPressing ? 'animate-ping' : 'animate-pulse'}`}>
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="text-left">
          <span className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Segurança Total</span>
          <span className="block text-lg font-black tracking-tighter">
            {isPressing ? "SOLTE PARA CANCELAR" : "BOTÃO DE PÂNICO"}
          </span>
        </div>
      </button>
      
      {/* Barra de progresso visual enquanto segura */}
      {isPressing && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/40" 
             style={{ 
               width: '100%',
               animation: 'progress 2.5s linear forwards'
             }} />
      )}
      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}