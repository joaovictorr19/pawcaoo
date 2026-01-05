import React, { useState } from 'react';
import { Map, Marker } from '@/components/ui/map';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Navigation, X } from 'lucide-react';

const ClientPickupMap = ({ pickupLocation }) => {
  const [showPopup, setShowPopup] = useState(false);

  if (!pickupLocation?.lat || !pickupLocation?.lng) {
    return (
      <Card className="p-4 text-center text-gray-500">
        <Home className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm">Localização de recolha não disponível</p>
      </Card>
    );
  }

  const handleNavigate = () => {
    const coords = `${pickupLocation.lat},${pickupLocation.lng}`;
    
    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      // Try Waze first, fallback to Apple Maps
      window.location.href = `waze://?ll=${coords}&navigate=yes`;
      setTimeout(() => {
        window.location.href = `maps://maps.apple.com/?daddr=${coords}`;
      }, 500);
    } else if (isAndroid) {
      // Try Waze first, fallback to Google Maps
      window.location.href = `waze://?ll=${coords}&navigate=yes`;
      setTimeout(() => {
        window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
      }, 500);
    } else {
      // Desktop - Google Maps
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords}`, '_blank');
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <div className="relative h-64 md:h-80">
        <Map
          initialViewState={{
            longitude: pickupLocation.lng,
            latitude: pickupLocation.lat,
            zoom: 15,
          }}
        >
          <Marker
            longitude={pickupLocation.lng}
            latitude={pickupLocation.lat}
            onClick={() => setShowPopup(!showPopup)}
          >
            <div className="cursor-pointer transition-transform hover:scale-110 active:scale-95">
              <div className="bg-green-600 rounded-full p-3 shadow-lg border-4 border-white">
                <Home className="w-6 h-6 text-white" />
              </div>
            </div>
          </Marker>
        </Map>

        {/* Popup Overlay */}
        {showPopup && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-start gap-2 flex-1">
                <div className="bg-green-100 rounded-lg p-2">
                  <Home className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 mb-1">Localização de Recolha</p>
                  <p className="text-xs text-gray-600 break-words">
                    {pickupLocation.address || `${pickupLocation.lat.toFixed(4)}, ${pickupLocation.lng.toFixed(4)}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <Button
              onClick={handleNavigate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              size="sm"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Navegar
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ClientPickupMap;