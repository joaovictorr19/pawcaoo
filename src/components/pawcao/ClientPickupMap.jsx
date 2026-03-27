import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Home, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function ClientPickupMap({
  pickupLocation = {
    lat: 38.7223,
    lng: -9.1393,
    address: 'Lisboa, Portugal',
    clientName: 'Cliente'
  }
}) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[pickupLocation.lat, pickupLocation.lng]}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        className="z-0 rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[pickupLocation.lat, pickupLocation.lng]}>
          <Popup>
            <div className="p-2 min-w-[200px]">
              <p className="font-bold text-sm">🐕 {pickupLocation.clientName}</p>
              <p className="text-xs text-gray-500 mt-1">📍 {pickupLocation.address}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${pickupLocation.lat},${pickupLocation.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 bg-green-600 text-white text-center text-xs py-1.5 rounded font-semibold hover:bg-green-700"
              >
                Abrir no Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Info Card */}
      <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 z-[400] max-w-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Home className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900 mb-1">Local de Recolha</h3>
            <p className="text-xs text-gray-600 mb-1">{pickupLocation.clientName}</p>
            <p className="text-xs text-gray-500 truncate">{pickupLocation.address}</p>
          </div>
        </div>
      </div>

      {/* Navigation Button */}
      <div className="absolute bottom-4 right-4 z-[400]">
        <Button
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${pickupLocation.lat},${pickupLocation.lng}`, '_blank')}
        >
          <Navigation className="w-5 h-5 mr-2" />
          Navegar
        </Button>
      </div>
    </div>
  );
}