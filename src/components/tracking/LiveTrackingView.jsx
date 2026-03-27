import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { Dog, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LiveTrackingView({ walkerCoords, routeHistory, destination, dogName, distanceToHome }) {
  const center = walkerCoords?.lat && walkerCoords?.lng
    ? [walkerCoords.lat, walkerCoords.lng]
    : [41.1579, -8.6291];

  const polyline = (routeHistory || [])
    .filter(p => p.lat && p.lng)
    .map(p => [p.lat, p.lng]);

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
      <MapContainer center={center} zoom={15} style={{ width: '100%', height: '100%' }} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterUpdater center={center} />

        {polyline.length > 1 && (
          <Polyline
            positions={polyline}
            pathOptions={{ color: '#f97316', weight: 5, opacity: 0.9 }}
          />
        )}

        {walkerCoords?.lat && walkerCoords?.lng && (
          <Marker position={[walkerCoords.lat, walkerCoords.lng]} />
        )}

        {destination?.lat && destination?.lng && (
          <Marker position={[destination.lat, destination.lng]} />
        )}
      </MapContainer>

      {/* Status Card */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center justify-between z-[400]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Navigation className="w-6 h-6 text-orange-600 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-orange-600 tracking-widest">Em Trânsito</p>
            <p className="font-bold text-gray-900 text-sm">
              {dogName ? `O ${dogName} está em passeio` : 'O cão está em passeio'}
              {distanceToHome ? ` a ${distanceToHome}` : ''}
            </p>
          </div>
        </div>
        <Button size="sm" className="rounded-full bg-black text-white text-xs hover:bg-gray-800">SOS</Button>
      </div>
    </div>
  );
}