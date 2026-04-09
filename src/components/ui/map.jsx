import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

export function Map({ children, initialViewState, className, style }) {
  const center = initialViewState
    ? [initialViewState.latitude, initialViewState.longitude]
    : [38.7223, -9.1393];
  const zoom = initialViewState?.zoom || 13;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </MapContainer>
  );
}

export { Marker, Popup, useMap };
export default Map;