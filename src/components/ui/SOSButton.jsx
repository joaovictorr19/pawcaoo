import { AlertTriangle, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SOSButton({ userId, currentCoords }) {
  const [isPressing, setIsPressing] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerSOS = async () => {
    setLoading(true);
    try {
      const user = await base44.entities.User.filter({ id: userId }).then(r => r[0]);
      await base44.entities.User.update(userId, {
        pawgo_status: {
          ...(user?.pawgo_status || {}),
          emergency_mode: {
            is_active: true,
            started_at: new Date().toISOString(),
            last_emergency_location: currentCoords || { lat: 0, lng: 0 },
            alert_message: "SOS disparado pelo profissional!"
          }
        }
      });
      toast.error("🚨 ALERTA DE EMERGÊNCIA ENVIADO!", { duration: 10000 });
    } catch (e) {
      toast.error("Erro ao enviar SOS!");
    } finally {
      setLoading(false);
      setIsPressing(false);
    }
  };

  const startPress = (e) => {
    if (e.type === 'touchstart') e.preventDefault(); // Prevent default text selection/context menu on mobile
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      triggerSOS();
    }, 2000); // 2 seconds to trigger
  };

  const cancelPress = () => {
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return (
    <button
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      disabled={loading}
      className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all select-none ${
        isPressing ? 'bg-red-800 scale-95' : 'bg-red-600'
      } text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]`}
      style={{ WebkitTouchCallout: 'none', userSelect: 'none' }}
    >
      {loading ? <Loader2 className="animate-spin" /> : <AlertTriangle className={isPressing ? "animate-ping" : "animate-pulse"} />}
      {isPressing ? "SEGURE PARA CONFIRMAR..." : "BOTÃO DE PÂNICO (SOS)"}
    </button>
  );
}