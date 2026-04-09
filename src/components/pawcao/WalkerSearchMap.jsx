import React from 'react';
import { Map, Marker, Popup } from '@/components/ui/map';

export function WalkerSearchMap({ walkers = [], userLocation, onWalkerClick }) {
  return (
    <Map
      initialViewState={{
        longitude: userLocation?.lng || -9.1393,
        latitude: userLocation?.lat || 38.7223,
        zoom: 12,
      }}
      className="w-full h-full"
    >
      {walkers.map((walker) =>
        walker.latitude && walker.longitude ? (
          <Marker key={walker.id} position={[walker.latitude, walker.longitude]}>
            <Popup>{walker.walker_name || walker.trainer_name}</Popup>
          </Marker>
        ) : null
      )}
    </Map>
  );
}

export default WalkerSearchMap;