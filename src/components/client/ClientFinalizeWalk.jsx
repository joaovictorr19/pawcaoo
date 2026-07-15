import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalkScanner } from '@/components/booking/WalkScanner';
import { ShieldCheck, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientFinalizeWalk({ booking }) {
  const [showInstructions, setShowInstructions] = useState(false);

  if (!booking) return null;

  const isCompleted = ['service_completed', 'completed'].includes(booking.status);

  return (
    <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white/80 mb-0.5">
              {isCompleted ? '✅ Passeio Concluído' : '🔍 Finalizar Passeio'}
            </p>
            <p className="font-bold text-white">{booking.dog_name} está de volta!</p>
            <p className="text-xs text-white/80">Com {booking.walker_name}</p>
          </div>
          <QrCode className="w-10 h-10 text-white/90 flex-shrink-0" />
        </div>

        {!isCompleted && (
          <>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="w-full flex items-center gap-2 text-white text-sm font-semibold"
              >
                <AlertCircle className="w-4 h-4" />
                {showInstructions ? 'Ocultar instruções' : 'Como finalizar e garantir o seu dinheiro?'}
              </button>
              <AnimatePresence>
                {showInstructions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 text-xs text-white/90">
                      <div className="flex gap-2">
                        <span className="font-bold text-white">1.</span>
                        <span>O passeador vai apresentar um <strong>QR Code de Finalização</strong> no telemóvel dele.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-white">2.</span>
                        <span>Toque em <strong>"Ler QR do Passeador"</strong> abaixo e aponte a câmara para o código.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-white">3.</span>
                        <span>O pagamento é <strong>automaticamente transferido</strong> para o passeador apenas após a leitura.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-white">4.</span>
                        <span>Não efetue pagamentos externos — todo o processo é seguro e gerido pela PawCão.</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <WalkScanner
              booking={booking}
              type="END"
              scannerLabel="📱 Ler QR do Passeador"
            />

            <div className="flex items-center gap-2 text-xs text-white/70">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>O seu dinheiro só é libertado quando confirmar a entrega do seu animal.</span>
            </div>
          </>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2 text-xs text-white/90">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Pagamento transferido para o passeador. Obrigado!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}