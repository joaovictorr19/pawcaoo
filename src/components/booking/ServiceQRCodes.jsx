import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, PlayCircle, StopCircle, MapPin, Clock, User } from 'lucide-react';
import { getStartToken, getEndToken, encodeQR } from '@/utils/qrTokens';

/**
 * Mostra os 2 QR Codes para o cliente:
 * - QR de INÍCIO: profissional escaneia ao chegar para iniciar o serviço
 * - QR de FIM: cliente mostra ao profissional para confirmar entrega e liberar pagamento
 */
export default function ServiceQRCodes({ booking }) {
  if (!booking) return null;

  const startToken = getStartToken(booking);
  const endToken = getEndToken(booking);

  const isStarted = ['in_progress', 'service_completed', 'completed'].includes(booking.status);
  const isFinished = ['service_completed', 'completed'].includes(booking.status);

  return (
    <div className="space-y-4">
      {/* Info do serviço */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
        <h3 className="font-bold text-blue-900 flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Os Seus Códigos QR
        </h3>
        <p className="text-sm text-blue-700">
          Guarde estes códigos. O profissional irá ler o QR de Início ao chegar e o QR de Fim ao entregar o seu animal.
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-blue-800">
          {booking.walk_date && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {booking.walk_date} {booking.walk_time && `às ${booking.walk_time}`}
            </span>
          )}
          {booking.walker_name && (
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {booking.walker_name}
            </span>
          )}
          {booking.pickup_address && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {booking.pickup_address}
            </span>
          )}
        </div>
      </div>

      {/* QR INÍCIO */}
      <Card className={`border-2 transition-all ${isStarted ? 'border-gray-200 opacity-60' : 'border-green-400 shadow-lg shadow-green-100'}`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isStarted ? 'bg-gray-200' : 'bg-green-100'}`}>
              <PlayCircle className={`w-5 h-5 ${isStarted ? 'text-gray-400' : 'text-green-600'}`} />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">QR de INÍCIO</p>
              <p className="text-xs text-gray-500">
                {isStarted ? '✅ Serviço já iniciado' : 'O profissional escaneia ao chegar'}
              </p>
            </div>
          </div>
          <div className={`flex justify-center p-4 rounded-xl ${isStarted ? 'bg-gray-100' : 'bg-white'}`}>
            <QRCode
              value={encodeQR(booking, "START")}
              size={160}
              style={{ opacity: isStarted ? 0.4 : 1 }}
            />
          </div>
          <p className="text-center font-mono text-sm font-bold text-gray-600 mt-3 tracking-widest">
            {startToken}
          </p>
        </CardContent>
      </Card>

      {/* QR FIM */}
      <Card className={`border-2 transition-all ${isFinished ? 'border-gray-200 opacity-60' : 'border-red-400 shadow-lg shadow-red-100'}`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isFinished ? 'bg-gray-200' : 'bg-red-100'}`}>
              <StopCircle className={`w-5 h-5 ${isFinished ? 'text-gray-400' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">QR de FIM</p>
              <p className="text-xs text-gray-500">
                {isFinished ? '✅ Serviço concluído e pago' : 'Mostre ao profissional no final — libera o pagamento'}
              </p>
            </div>
          </div>
          <div className={`flex justify-center p-4 rounded-xl ${isFinished ? 'bg-gray-100' : 'bg-white'}`}>
            <QRCode
              value={encodeQR(booking, "END")}
              size={160}
              fgColor={isFinished ? '#9ca3af' : '#dc2626'}
              style={{ opacity: isFinished ? 0.4 : 1 }}
            />
          </div>
          <p className="text-center font-mono text-sm font-bold text-gray-600 mt-3 tracking-widest">
            {endToken}
          </p>
          {!isFinished && (
            <div className="mt-3 bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-700 text-center font-medium">
                ⚠️ Só mostre este código quando o profissional entregar o seu animal
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}