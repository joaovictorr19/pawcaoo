import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function WalkerBookingCard({ booking, onAccept, onDecline }) {
  const navigate = useNavigate();

  // Determine main action button
  const getMainActionButton = () => {
    if (booking.status === 'confirmed') {
      return (
        <Button
          onClick={async () => {
            try {
              await base44.entities.Booking.update(booking.id, { 
                status: 'in_progress',
                walk_start_time: new Date().toISOString()
              });
              navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${booking.id}`));
            } catch (error) {
              console.error('Start service error:', error);
            }
          }}
          className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg font-bold text-lg"
        >
          ⚡ INICIAR PASSEIO
        </Button>
      );
    }

    if (booking.status === 'in_progress') {
      return (
        <Button
          onClick={() => navigate(createPageUrl(`ActiveWalkDashboard?bookingId=${booking.id}`))}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg font-bold text-lg animate-pulse"
        >
          🗺️ ABRIR MAPA / CHAT
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all p-4">
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

          {/* Secondary Actions */}
          {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
            <Button
              onClick={() => navigate(createPageUrl(`Chat?bookingId=${booking.id}`))}
              variant="outline"
              className="w-full bg-blue-50 border-2 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}