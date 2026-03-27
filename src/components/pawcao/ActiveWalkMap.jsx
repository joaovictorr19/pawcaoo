import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Dog } from 'lucide-react';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function ActiveWalkMap({
  currentLocation = { lat: 38.7223, lng: -9.1393 },
  pathHistory = [],
  startLocation = null
}) {
  // pathHistory is [[lng, lat], ...] — convert to [[lat, lng]] for leaflet
  const leafletPath = pathHistory.map(([lng, lat]) => [lat, lng]);

  const startPoint = startLocation
    ? [startLocation.lat, startLocation.lng]
    : leafletPath.length > 0 ? leafletPath[0] : [currentLocation.lat, currentLocation.lng];

  const currentPoint = [currentLocation.lat, currentLocation.lng];

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={currentPoint}
        zoom={15}
        style={{ width: '100%', height: '100%' }}
        className="z-0 rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={currentPoint} />

        {/* Route path */}
        {leafletPath.length > 1 && (
          <Polyline positions={leafletPath} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.8 }} />
        )}

        {/* Start marker */}
        <Marker position={startPoint} />

        {/* Current walker marker */}
        <Marker position={currentPoint} />
      </MapContainer>

      {/* Stats Overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-4 z-[400]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Dog className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Passeio em Curso</p>
            <p className="text-lg font-bold text-gray-900">
              {(pathHistory.length * 0.02).toFixed(2)} km
            </p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[400]">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-white"></div>
            <span className="text-gray-700">Início</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
            <span className="text-gray-700">Walker</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-blue-600 rounded"></div>
            <span className="text-gray-700">Trajeto</span>
          </div>
        </div>
      </div>
    </div>
  );
}