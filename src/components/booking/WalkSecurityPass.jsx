import React from "react";
import QRCode from "react-qr-code";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Shield, CheckCircle } from "lucide-react";

export function WalkSecurityPass({ booking, onCodeShown }) {
  if (!booking) return null;

  const status = booking.status;
  const isPickup = status === 'confirmed' || status === 'pending';
  const isDropoff = status === 'in_progress';

  // Generate secure tokens if not exists
  const pickupToken = booking.pickup_token || `PK-${booking.id.slice(0, 8).toUpperCase()}`;
  const dropoffToken = booking.dropoff_token || `DO-${booking.id.slice(-8).toUpperCase()}`;

  const tokenToShow = isPickup ? pickupToken : dropoffToken;
  const title = isPickup ? "🟢 QR de Recolha (Início)" : "🔴 QR de Entrega (Final)";
  const description = isPickup 
    ? "Mostre este código ao passeador para autorizar o início do passeio." 
    : "Mostre este código ao passeador para confirmar a entrega do seu cão.";
  const buttonColor = isPickup ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700";
  const buttonText = isPickup ? "🔓 Autorizar Recolha" : "✅ Confirmar Entrega";

  const qrData = JSON.stringify({
    bookingId: booking.id,
    token: tokenToShow,
    type: isPickup ? 'START' : 'END',
    dogName: booking.dog_name,
    timestamp: new Date().toISOString()
  });

  return (
    <Dialog onOpenChange={(open) => open && onCodeShown?.()}>
      <DialogTrigger asChild>
        <Button className={`w-full ${buttonColor} h-14 text-base font-bold gap-3 shadow-xl rounded-xl`}>
          <QrCode className="w-5 h-5" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
          <Shield className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold mb-2 text-center text-slate-900">{title}</h3>
        <p className="text-center text-slate-600 mb-6 text-sm max-w-xs">
          {description}
        </p>
        
        <div className="p-6 bg-white rounded-2xl shadow-2xl border-4 border-dashed border-slate-300 mb-4">
          <QRCode 
            value={qrData} 
            size={220}
            level="H"
            className="w-full h-auto"
          />
        </div>

        <div className="bg-slate-900 rounded-xl p-4 w-full text-center shadow-lg mb-4">
          <p className="text-xs text-slate-400 mb-1">CÓDIGO DE SEGURANÇA</p>
          <p className="font-mono text-2xl md:text-3xl font-bold tracking-[0.3em] text-green-400">
            {tokenToShow}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3 w-full border-2 border-orange-200">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl">🐕</span>
          </div>
          <div>
            <p className="font-bold text-slate-900">{booking.dog_name}</p>
            <p className="text-xs text-slate-600">Passeio Seguro</p>
          </div>
          <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
        </div>

        <p className="text-xs text-center text-slate-500 mt-4">
          🔒 Código válido apenas para este passeio
        </p>
      </DialogContent>
    </Dialog>
  );
}

export default WalkSecurityPass;