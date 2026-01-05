import React, { useState, useRef } from 'react';
import { Map } from '@/components/ui/map';
import MapControls from '@/components/ui/MapControls';

export function WalkerSearchMap({ walkers = [], userLocation, onWalkerClick }) {
  const mapRef = useRef(null);

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleLocate = (coords) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 14,
        duration: 1500
      });
    }
  };

  return (
    <Map
      initialViewState={{
        longitude: userLocation?.lng || -9.1393,
        latitude: userLocation?.lat || 38.7223,
        zoom: 12,
      }}
      className="w-full h-full"
      onMapLoad={handleMapLoad}
    >
      <MapControls
        position="top-right"
        showZoom={true}
        showCompass={true}
        showLocate={true}
        onLocate={handleLocate}
      />
      {/* Markers will be added here in the next step */}
    </Map>
  );
}