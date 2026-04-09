import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export function WalkerSearchMap({ walkers = [], userLocation, onWalkerClick }) {
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [38.7223, -9.1393];

  return (
    <MapContainer center={center} zoom={12} style={{ width: '100%', height: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {walkers.map((walker) =>
        walker.latitude && walker.longitude ? (
          <Marker key={walker.id} position={[walker.latitude, walker.longitude]}>
            <Popup>{walker.walker_name || walker.trainer_name}</Popup>
          </Marker>
        ) : null
      )}
    </MapContainer>
  );
}

export default WalkerSearchMap;