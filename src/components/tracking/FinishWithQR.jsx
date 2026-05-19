import { useState, useRef, useEffect } from "react";
import { QrCode, ShieldCheck, Camera, X } from "lucide-react";
import { tryDecodeQR, validateForBooking } from '@/utils/qrTokens';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function FinishWithQR({ booking, onValidated }) {
  const [scanning, setScanning] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const validate = (text) => {
    const decoded = tryDecodeQR(text);
    const res = validateForBooking(booking, decoded, 'END');
    if (res.valid && res.step === 'end') {
      setIsValidated(true);
      setScanning(false);
      toast.success("Código Validado! Identidade confirmada.");
      onValidated?.();
    } else {
      toast.error("Código inválido para este passeio.");
    }
  };

  const stopCamera = () => {
    clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!scanning) { stopCamera(); return; }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // BarcodeDetector API (Chrome/Edge/Android)
        if ("BarcodeDetector" in window) {
          const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
          intervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) validate(codes[0].rawValue);
            } catch { /* ignore */ }
          }, 500);
        }
      } catch {
        toast.error("Não foi possível aceder à câmara.");
        setScanning(false);
      }
    };

    startCamera();
    return stopCamera;
  }, [scanning]);

  if (isValidated) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-[2.5rem] p-6 text-center animate-in zoom-in-95 duration-300">
        <ShieldCheck size={40} className="text-green-500 mx-auto mb-2" />
        <p className="text-green-600 font-black text-[10px] uppercase tracking-widest">
          Entrega Validada com Sucesso
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-center border border-white/10 shadow-2xl space-y-6">
      <div className="w-16 h-16 bg-orange-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/20">
        <QrCode size={32} className="text-white" />
      </div>

      <div>
        <h3 className="text-white font-black text-sm uppercase tracking-widest mb-2">
          Confirmação de Entrega
        </h3>
        <p className="text-slate-400 text-[10px] font-bold leading-relaxed uppercase">
          Pede ao tutor para mostrar o QR Code<br />para libertares o teu pagamento.
        </p>
      </div>

      {scanning ? (
        <div className="space-y-3">
          <div className="relative rounded-3xl overflow-hidden border-2 border-orange-500 aspect-square">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* BarcodeDetector não disponível — aviso */}
            {"BarcodeDetector" in window ? null : (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
                <p className="text-white text-xs text-center">
                  Scanner automático não disponível neste dispositivo. Usa o upload abaixo.
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={() => setScanning(false)}
            className="text-slate-400 text-xs w-full"
          >
            <X size={14} className="mr-1" /> Cancelar
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setScanning(true)}
          className="w-full bg-white text-slate-900 h-14 rounded-2xl font-black uppercase text-[10px]"
        >
          <Camera size={14} className="mr-2" /> Abrir Scanner
        </Button>
      )}
    </div>
  );
}