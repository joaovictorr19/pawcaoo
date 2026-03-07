import React, { useState } from "react";
import { MapPin, Clock, Calendar, Dog, Navigation, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function WalkRequestCard({ booking, onAccept, userLocation }) {
  const [isAccepting, setIsAccepting] = useState(false);

  // Calculate distance if user location is available
  const distance = (userLocation?.lat && userLocation?.lng && booking.pickup_lat && booking.pickup_lng)
    ? calculateDistance(userLocation.lat, userLocation.lng, booking.pickup_lat, booking.pickup_lng)
    : null;

  const handleAccept = async () => {
    setIsAccepting(true);
    await onAccept(booking);
    setIsAccepting(false);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
      {/* Top Badge: Time created */}
      <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-bl-xl">
        há {formatDistanceToNow(new Date(booking.created_date), { locale: pt })}
      </div>

      <div className="flex gap-4">
        {/* Left: Map/Icon Placeholder */}
        <div className="shrink-0 w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">
          {booking.dogs && booking.dogs[0]?.photo_url ? (
            <img src={booking.dogs[0].photo_url} alt="Dog" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <span>🐾</span>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex-1 space-y-2">
          {/* Header */}
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">
              {booking.total_dogs > 1 ? `${booking.total_dogs} Cães` : booking.dog_name || "Passeio"}
              <span className="font-normal text-gray-500 text-xs ml-2">
                • {booking.owner_name?.split(' ')[0]}
              </span>
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[180px]">
                {booking.pickup_address || "Localização partilhada"}
              </span>
              {distance && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-1 bg-gray-100 text-gray-600">
                  {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                </Badge>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              {new Date(booking.walk_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              {booking.walk_time === 'morning' ? 'Manhã' : booking.walk_time === 'afternoon' ? 'Tarde' : 'Noite'}
              <span className="text-gray-400">({booking.duration_hours}h)</span>
            </div>
          </div>

          {/* Footer: Price & Action */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-medium uppercase">Valor</span>
              <span className="text-lg font-bold text-green-600">€{booking.service_amount}</span>
            </div>
            <Button 
              onClick={handleAccept} 
              disabled={isAccepting}
              className="bg-gray-900 hover:bg-black text-white rounded-xl h-10 px-6 shadow-lg shadow-gray-200 transition-all active:scale-95"
            >
              {isAccepting ? "Aceitando..." : "Aceitar Pedido"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Haversine formula for distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}