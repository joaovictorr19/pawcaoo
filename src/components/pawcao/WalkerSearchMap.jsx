import React from 'react';
import ReactMapGL from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

export function WalkerSearchMap({ walkers = [], userLocation, onWalkerClick }) {
  return (
    <ReactMapGL
      initialViewState={{
        longitude: userLocation?.lng || -9.1393,
        latitude: userLocation?.lat || 38.7223,
        zoom: 12,
      }}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      style={{ width: '100%', height: '100%' }}
    >
      {/* Markers will be added here in the next step */}
    </ReactMapGL>
  );
}