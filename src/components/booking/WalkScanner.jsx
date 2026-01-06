import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, ScanLine, X, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function WalkScanner({ booking, onScanSuccess, onScanError, type = 'START' }) {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Manual code verification (fallback if camera fails)
  const handleManualVerify = async () => {
    if (!manualCode) {
      toast.error('Insira o código');
      return;
    }

    setLoading(true);
    try {
      const expectedToken = type === 'START' 
        ? (booking.pickup_token || `PK-${booking.id.slice(0, 8).toUpperCase()}`)
        : (booking.dropoff_token || `DO-${booking.id.slice(-8).toUpperCase()}`);

      if (manualCode.toUpperCase() === expectedToken.toUpperCase()) {
        await handleSuccessfulScan({ token: expectedToken, type, bookingId: booking.id });
      } else {
        toast.error('❌ Código incorreto!');
        onScanError?.();
      }
    } catch (error) {
      toast.error('Erro ao verificar código');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessfulScan = async (data) => {
    try {
      // Update booking status
      if (type === 'START') {
        await base44.entities.Booking.update(booking.id, {
          status: 'in_progress',
          walk_start_time: new Date().toISOString()
        });
        toast.success('✅ Passeio iniciado com sucesso!', {
          description: 'GPS ativado automaticamente'
        });
      } else {
        await base44.entities.Booking.update(booking.id, {
          status: 'service_completed',
          completed_date: new Date().toISOString()
        });
        toast.success('✅ Entrega confirmada!', {
          description: 'Pagamento será processado'
        });
      }

      setScanning(false);
      stopCamera();
      onScanSuccess?.(data);
    } catch (error) {
      console.error('Scan processing error:', error);
      toast.error('Erro ao processar verificação');
      onScanError?.(error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
      setScanning(true);
      toast.info('📸 Câmera ativa - Aponte para o QR Code');
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Erro ao acessar câmera', {
        description: 'Use o código manual como alternativa'
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  // Mock QR reading (real implementation would use jsQR or similar)
  const simulateScan = () => {
    const expectedToken = type === 'START' 
      ? (booking.pickup_token || `PK-${booking.id.slice(0, 8).toUpperCase()}`)
      : (booking.dropoff_token || `DO-${booking.id.slice(-8).toUpperCase()}`);
    
    handleSuccessfulScan({ token: expectedToken, type, bookingId: booking.id });
  };

  const buttonColor = type === 'START' 
    ? 'bg-green-600 hover:bg-green-700' 
    : 'bg-blue-600 hover:bg-blue-700';
  const buttonText = type === 'START' ? '🟢 Ler QR de Início' : '🔴 Ler QR de Entrega';

  return (
    <>
      <Button 
        onClick={startCamera}
        disabled={loading}
        className={`${buttonColor} w-full h-14 text-base font-bold rounded-xl shadow-xl gap-3`}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verificando...
          </>
        ) : (
          <>
            <Camera className="w-5 h-5" />
            {buttonText}
          </>
        )}
      </Button>

      {/* Scanner Dialog */}
      <Dialog open={scanning} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-md p-0 bg-black border-0">
          <div className="relative w-full aspect-square bg-gray-900 overflow-hidden">
            {/* Camera Feed */}
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64 border-4 border-green-500 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.5)]">
                {/* Animated scanning line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500 shadow-[0_0_20px_rgba(34,197,94,1)] animate-[scan_2s_ease-in-out_infinite]" />
                
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              </div>

              <p className="text-white font-bold mt-6 text-lg drop-shadow-lg">
                Aponte para o QR Code do cliente
              </p>
            </div>

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <ScanLine className="w-5 h-5 animate-pulse" />
                  <span className="font-bold">A procurar QR Code...</span>
                </div>
                <button 
                  onClick={stopCamera}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
              <div className="space-y-3">
                {/* Test button (development only) */}
                <Button
                  onClick={simulateScan}
                  variant="secondary"
                  className="w-full h-12 bg-white/20 hover:bg-white/30 text-white font-bold backdrop-blur-sm"
                >
                  🧪 Simular Scan (Teste)
                </Button>

                {/* Manual entry */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                  <p className="text-white text-sm mb-2 font-medium">Câmera não funciona? Insira manualmente:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="PK-XXXXXXXX"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/90 text-gray-900 font-mono font-bold text-center uppercase"
                      maxLength={12}
                    />
                    <Button
                      onClick={handleManualVerify}
                      disabled={loading || !manualCode}
                      className="bg-green-600 hover:bg-green-700 px-6"
                    >
                      {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'OK'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 4px); }
        }
      `}</style>
    </>
  );
}