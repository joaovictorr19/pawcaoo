import React from "react";
import { WalkScanner } from "@/components/booking/WalkScanner";

export default function CockpitPendingStartState({ booking, isOwnerParticipant, isWalkerParticipant, onStartSuccess, onStartError }) {
  return (
    <div className="h-[100dvh] bg-gray-900 flex items-center justify-center p-4">
      <div className="text-white text-center max-w-md space-y-4">
        <h2 className="text-2xl font-bold">Validação de início pendente</h2>
        <p className="text-gray-400">
          {isOwnerParticipant
            ? 'Mostre o QR de início ao profissional para começar o passeio.'
            : 'Leia o QR de início do cliente para iniciar o passeio.'}
        </p>
        {isWalkerParticipant && (
          <WalkScanner
            booking={booking}
            type="START"
            onScanSuccess={onStartSuccess}
            onScanError={onStartError}
          />
        )}
      </div>
    </div>
  );
}