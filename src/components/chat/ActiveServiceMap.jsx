import React from "react";
import { Map, MapMarker, MarkerContent, MarkerLabel, MapControls } from "@/components/ui/map";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin } from "lucide-react";

export default function ActiveServiceMap({ booking, currentUserEmail }) {
  if (!booking?.pickup_lat || !booking?.pickup_lng) return null;

  const isProfessional = currentUserEmail === booking.walker_email || currentUserEmail === booking.trainer_email;
  const isActive = booking.status === 'in_progress';

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
      <Map
        initialViewState={{
          longitude: booking.pickup_lng,
          latitude: booking.pickup_lat,
          zoom: 14,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <MapControls position="top-right" showZoom showLocate={isProfessional} />

        {/* Pickup Location Marker */}
        <MapMarker
          longitude={booking.pickup_lng}
          latitude={booking.pickup_lat}
        >
          <MarkerContent className="relative">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <MarkerLabel className="bg-white px-2 py-1 rounded shadow-md text-xs font-semibold whitespace-nowrap">
              📍 {booking.pickup_address?.split(',')[0] || 'Recolha'}
            </MarkerLabel>
          </MarkerContent>
        </MapMarker>

        {/* Professional's current location if in progress */}
        {isActive && booking.walker_lat && booking.walker_lng && (
          <MapMarker
            longitude={booking.walker_lng}
            latitude={booking.walker_lat}
          >
            <MarkerContent>
              <div className="relative">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <MarkerLabel className="bg-blue-600 text-white px-2 py-1 rounded shadow-md text-xs font-semibold">
                {isProfessional ? '🚶 Você' : '🚶 Profissional'}
              </MarkerLabel>
            </MarkerContent>
          </MapMarker>
        )}
      </Map>

      {/* Quick Actions */}
      {isProfessional && (
        <div className="absolute bottom-2 left-2 right-2 flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${booking.pickup_lat},${booking.pickup_lng}`;
              window.open(mapsUrl, '_blank');
            }}
            className="flex-1 bg-white/95 hover:bg-white text-gray-900 shadow-lg h-9"
          >
            <Navigation className="w-4 h-4 mr-1" />
            Rota Google Maps
          </Button>
        </div>
      )}
    </div>
  );
}