import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Shield, Clock, CheckCircle2, Info } from 'lucide-react';
import { encodeQR, getEndToken } from '@/utils/qrTokens';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function WalkerFinalizeQR({ booking, onClientNotified }) {
  const [open, setOpen] = useState(false);
  const [notified, setNotified] = useState(false);

  const endToken = getEndToken(booking);
  const qrData = encodeQR(booking, 'END');

  const handleOpen = async (isOpen) => {
    setOpen(isOpen);
    if (isOpen && !notified) {
      setNotified(true);
      try {
        await base44.entities.Notification.create({
          recipient_email: booking.owner_email || booking.created_by,
          title: '🐾 Passeio pronto para finalizar',
          message: `${booking.walker_name || 'O Dog Walker'} está a aguardar a sua confirmação. Abra o seu Painel e leia o QR Code para liberar o pagamento.`,
          type: 'booking',
          icon: '🔍',
          link: '/ClientDashboard',
          related_id: booking.id
        });
        toast.success('Cliente notificado para finalizar o passeio');
        onClientNotified?.();
      } catch (e) {
        console.error('Notification error:', e);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 text-base font-bold gap-3 shadow-xl rounded-xl">
          <QrCode className="w-5 h-5" />
          Gerar QR de Finalização
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-6 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
          <Shield className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-xl md:text-2xl font-bold mb-2 text-center text-slate-900">
          🔴 QR de Finalização
        </h3>
        <p className="text-center text-slate-600 mb-6 text-sm max-w-xs">
          Mostre este código ao cliente. Ele vai ler com a câmara no Painel do Cliente para liberar o pagamento e concluir o passeio.
        </p>

        <div className="p-6 bg-white rounded-2xl shadow-2xl border-4 border-dashed border-blue-300 mb-4">
          <QRCode
            value={qrData}
            size={220}
            level="H"
            className="w-full h-auto"
            fgColor="#2563eb"
          />
        </div>

        <div className="bg-slate-900 rounded-xl p-4 w-full text-center shadow-lg mb-4">
          <p className="text-xs text-slate-400 mb-1">CÓDIGO DE SEGURANÇA</p>
          <p className="font-mono text-2xl md:text-3xl font-bold tracking-[0.3em] text-blue-400">
            {endToken}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3 w-full border-2 border-orange-200 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl">🐕</span>
          </div>
          <div>
            <p className="font-bold text-slate-900">{booking.dog_name}</p>
            <p className="text-xs text-slate-600">{booking.owner_name}</p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-blue-600 ml-auto" />
        </div>

        <div className="bg-blue-50 rounded-xl p-3 w-full flex items-start gap-2 border border-blue-200">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            O pagamento só é transferido após o cliente ler o código. Aguarde a confirmação no ecrã.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}