import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const checkpointIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function WalkRouteMap({ booking, checkpoints = [] }) {
  if (!booking?.route_coordinates || booking.route_coordinates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
        <p className="text-gray-500 font-medium">Nenhum dado de GPS registado para este passeio.</p>
        <p className="text-gray-400 text-sm mt-1">O rastreamento de rota não estava ativo ou não foi sincronizado.</p>
      </div>
    );
  }

  const positions = booking.route_coordinates.map(coord => [coord.lat, coord.lng]);
  const center = positions[Math.floor(positions.length / 2)] || [38.7223, -9.1393];

  const mapCheckpoints = checkpoints.filter(c => c.latitude && c.longitude);

  return (
    <div className="h-[350px] w-full rounded-lg overflow-hidden border border-gray-200 z-0">
      <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} color="#3b82f6" weight={5} opacity={0.8} />
        
        {/* Start Point */}
        {positions.length > 0 && (
          <Marker position={positions[0]}>
            <Popup>
              <strong>Início do Passeio</strong>
            </Popup>
          </Marker>
        )}
        
        {/* End Point */}
        {positions.length > 1 && (
          <Marker position={positions[positions.length - 1]}>
            <Popup>
              <strong>Fim do Passeio</strong>
            </Popup>
          </Marker>
        )}

        {/* Checkpoints */}
        {mapCheckpoints.map(cp => (
          <Marker key={cp.id} position={[cp.latitude, cp.longitude]} icon={checkpointIcon}>
            <Popup>
              <div className="text-sm min-w-[150px]">
                <strong className="block mb-1 capitalize text-orange-600">{cp.checkpoint_type.replace('_', ' ')}</strong>
                {cp.notes && <p className="mt-1 text-gray-700">{cp.notes}</p>}
                {cp.dog_behavior?.mood && <p className="mt-1">Humor: <strong>{cp.dog_behavior.mood}</strong></p>}
                {cp.dog_behavior?.energy_level && <p className="mt-1">Energia: <strong>{cp.dog_behavior.energy_level}</strong></p>}
                {cp.timestamp && <p className="mt-2 text-xs text-gray-400 border-t pt-1">{new Date(cp.timestamp).toLocaleTimeString()}</p>}
                {cp.photo_url && (
                  <img src={cp.photo_url} alt="Checkpoint" className="w-full h-auto mt-2 rounded-md" />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}