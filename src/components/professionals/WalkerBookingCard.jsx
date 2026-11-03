import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, MessageCircle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { WalkScanner } from "@/components/booking/WalkScanner";

export default function WalkerBookingCard({ booking, onAccept, onDecline }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Determine main action button
  const getMainActionButton = () => {
    if (booking.status === 'pending') {
      return (
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            onClick={async () => {
              if (isProcessing) return;
              setIsProcessing(true);
              
              try {
                await onAccept();
                toast.success('✅ Pedido aceite!');
              } catch (error) {
                console.error('Accept error:', error);
                toast.error('Erro ao aceitar');
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg font-bold"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                ACEITAR
              </>
            )}
          </Button>
          <Button
            onClick={async () => {
              if (isProcessing) return;
              if (!confirm('Recusar esta reserva?')) return;
              
              setIsProcessing(true);
              try {
                await onDecline();
                toast.success('Pedido recusado');
              } catch (error) {
                console.error('Decline error:', error);
                toast.error('Erro ao recusar');
              } finally {
                setIsProcessing(false);
              }
            }}
            disabled={isProcessing}
            variant="outline"
            className="h-12 border-2 border-red-300 text-red-600 hover:bg-red-50 font-bold"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                RECUSAR
              </>
            )}
          </Button>
        </div>
      );
    }
    
    if (booking.status === 'confirmed') {
      return (
        <WalkScanner 
          booking={booking}
          type="START"
          onScanSuccess={async () => {
            queryClient.invalidateQueries(['myWalkBookings']);
            navigate(createPageUrl('ActiveWalkDashboard') + `?bookingId=${booking.id}`);
          }}
          onScanError={() => {
            toast.error('Código inválido - tente novamente');
          }}
        />
      );
    }

    if (booking.status === 'in_progress') {
      return (
        <Button
          onClick={() => {
            if (!booking.id) {
              toast.error('Erro: ID de reserva inválido');
              return;
            }
            navigate(createPageUrl('ActiveWalkDashboard') + `?bookingId=${booking.id}`);
          }}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg font-bold text-lg animate-pulse"
        >
          🗺️ ABRIR MAPA / CHAT
        </Button>
      );
    }

    if (booking.status === 'service_completed') {
      return (
        <Button
          onClick={async () => {
            if (isProcessing) return;
            if (!confirm('Confirmar que recebeu o pagamento?')) return;
            
            setIsProcessing(true);
            try {
              await base44.entities.Booking.update(booking.id, {
                status: 'completed',
                payment_status: 'released',
                completed_date: new Date().toISOString()
              });
              queryClient.invalidateQueries(['myWalkBookings']);
              toast.success('💰 Pagamento confirmado!');
            } catch (error) {
              console.error('Payment confirm error:', error);
              toast.error('Erro ao confirmar pagamento');
            } finally {
              setIsProcessing(false);
            }
          }}
          disabled={isProcessing}
          className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg font-bold text-lg animate-pulse"
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            '💰 CONFIRMAR PAGAMENTO'
          )}
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all overflow-hidden">
      {/* Test/Paid Badge Banner */}
      {(booking.is_test_booking || booking.payment_status === 'released' || booking.payment_status === 'completed') && (
        <div className={`px-4 py-2 text-center text-sm font-bold ${
          booking.is_test_booking 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
        }`}>
          {booking.is_test_booking ? '🧪 RESERVA DE TESTE' : '✅ PAGAMENTO CONFIRMADO'}
        </div>
      )}
      
      <div className="p-4">
        <div className="grid md:grid-cols-[1fr,auto] gap-4">
          {/* Left: Booking Details */}
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-bold text-xl text-gray-900">{booking.dog_name}</h3>
              <Badge variant="outline" className="text-xs font-semibold">
                {booking.dog_size === 'small' && '🐕 Pequeno'}
                {booking.dog_size === 'medium' && '🐕 Médio'}
                {booking.dog_size === 'large' && '🐕 Grande'}
                {booking.dog_size === 'extra_large' && '🐕 XL'}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-700 font-semibold mb-1">
              {booking.owner_name}
            </p>
            
            <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
              <Clock className="w-4 h-4" />
              {format(new Date(booking.walk_date || booking.session_date), 'dd/MM/yyyy', { locale: ptBR })} • 
              {booking.walk_time || booking.session_time} • 
              {booking.duration_hours}h
            </p>
            
            {booking.pickup_address && (
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-2 font-medium bg-gray-50 p-2 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" /> 
                {booking.pickup_address}
              </p>
            )}
            
            {booking.special_notes && (
              <div className="mt-3 p-3 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                <p className="text-xs text-gray-800">
                  <strong>⚠️ Notas:</strong> {booking.special_notes}
                </p>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col items-end gap-2 min-w-[200px]">
            <div className="text-3xl font-bold text-green-600 mb-2">
              €{booking.service_amount}
            </div>

            {/* Main Action Button */}
            {getMainActionButton()}

            {/* Chat button removed - integrated into main action */}
          </div>
        </div>
      </div>
    </div>
  );
}