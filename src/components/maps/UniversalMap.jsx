import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { MapControls } from '@/components/ui/map.jsx';
import 'leaflet/dist/leaflet.css';

function MapCenterUpdater({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      // center is [lng, lat] — leaflet wants [lat, lng]
      map.setView([center[1], center[0]], zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}

export default function UniversalMap({
  center = [-8.6291, 41.1579],
  zoom = 13,
  className = "w-full h-full",
  children,
  onMapLoad,
  showControls = true,
  controlsPosition = "top-right",
  show3DControls = false,
  onMapClick
}) {
  let safeCenter = center;
  if (!center || !Array.isArray(center) || center.length !== 2 ||
      isNaN(center[0]) || isNaN(center[1])) {
    safeCenter = [-8.6291, 41.1579];
  }

  // Leaflet expects [lat, lng], but we receive [lng, lat]
  const leafletCenter = [safeCenter[1], safeCenter[0]];

  return (
    <div className={`relative ${className}`} style={{ minHeight: 300 }}>
      <MapContainer
        center={leafletCenter}
        zoom={zoom}
        style={{ width: '100%', height: '100%', minHeight: 300 }}
        className="z-0 rounded-xl"
        whenCreated={onMapLoad}
        onClick={onMapClick ? (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }) : undefined}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapCenterUpdater center={safeCenter} zoom={zoom} />
        {showControls && <MapControls position={controlsPosition} showLocate />}
        {children}
      </MapContainer>
    </div>
  );
}

export function createMapMarker() { return null; }
export function createMapPopup() { return null; }