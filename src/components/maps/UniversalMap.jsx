import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapControls } from '@/components/ui/map';

/**
 * UniversalMap - Single map component for all app views
 * Uses MapLibre GL JS with Positron (clean/light) style
 * Default center: Porto, Portugal
 */
export default function UniversalMap({ 
  center = [-8.6291, 41.1579], // Porto default
  zoom = 13,
  className = "w-full h-full",
  children,
  onMapLoad,
  showControls = true,
  controlsPosition = "top-right"
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: center,
      zoom: zoom,
      attributionControl: false
    });

    // Store map instance in DOM for child components
    if (mapContainer.current) {
      mapContainer.current._map = map.current;
    }

    // Add attribution control
    map.current.addControl(new maplibregl.AttributionControl({
      compact: true
    }), 'bottom-right');

    map.current.on('load', () => {
      console.log('🗺️ UniversalMap loaded at', center);
      setIsReady(true);
      if (onMapLoad) {
        onMapLoad(map.current);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (map.current && isReady) {
      map.current.flyTo({ center, zoom, duration: 1000 });
    }
  }, [center, zoom, isReady]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className={className} />
      {isReady && (
        <>
          {showControls && <MapControls position={controlsPosition} showZoom showLocate />}
          {children}
        </>
      )}
    </div>
  );
}

// Export helper to create markers
export function createMapMarker({ lng, lat, element }) {
  const mapContainer = document.querySelector('.maplibregl-map');
  if (!mapContainer?._map) return null;
  
  return new maplibregl.Marker({ element })
    .setLngLat([lng, lat])
    .addTo(mapContainer._map);
}

// Export helper to create popup
export function createMapPopup({ lng, lat, html, options = {} }) {
  const mapContainer = document.querySelector('.maplibregl-map');
  if (!mapContainer?._map) return null;
  
  return new maplibregl.Popup(options)
    .setLngLat([lng, lat])
    .setHTML(html)
    .addTo(mapContainer._map);
}