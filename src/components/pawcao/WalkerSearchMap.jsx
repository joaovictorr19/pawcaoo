import React from 'react';
import { Map } from '@/components/ui/map'; // now using lightweight placeholder // now using lightweight placeholder

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
      {/* Markers will be added here in the next step */}
    </Map>
  );
}