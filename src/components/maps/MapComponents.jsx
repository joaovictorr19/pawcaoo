import React from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Map route polyline
export function MapRoute({ coordinates, color = '#000000', width = 4, opacity = 1 }) {
  // Convert [lng, lat] to [lat, lng] for Leaflet
  const leafletCoords = coordinates.map(coord => [coord[1], coord[0]]);
  return (
    <Polyline
      positions={leafletCoords}
      color={color}
      weight={width}
      opacity={opacity}
    />
  );
}

// Map marker wrapper
export function MapMarker({ longitude, latitude, children }) {
  const position = [latitude, longitude];
  
  return (
    <Marker position={position}>
      {children}
    </Marker>
  );
}

// Marker content wrapper
export function MarkerContent({ children }) {
  return children;
}

// Marker tooltip
export function MarkerTooltip({ children }) {
  return <div className="hidden">{children}</div>;
}

// Marker popup
export function MarkerPopup({ children, className = '' }) {
  return (
    <Popup className={className}>
      {children}
    </Popup>
  );
}