import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapControls } from '@/components/ui/map';
import { Button } from '@/components/ui/button';
import { Mountain, RotateCcw } from 'lucide-react';

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
  controlsPosition = "top-right",
  show3DControls = false,
  onMapClick
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);

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

    // Track pitch and bearing changes
    map.current.on('move', () => {
      if (map.current) {
        setPitch(Math.round(map.current.getPitch()));
        setBearing(Math.round(map.current.getBearing()));
      }
    });

    // Handle map clicks for manual correction
    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat
        });
      });
    }

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

  const handle3DView = () => {
    if (map.current) {
      map.current.easeTo({
        pitch: 60,
        bearing: -20,
        duration: 1000
      });
    }
  };

  const handleReset = () => {
    if (map.current) {
      map.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className={className} />
      {isReady && (
        <>
          {showControls && <MapControls position={controlsPosition} showZoom showLocate />}
          
          {/* 3D Controls */}
          {show3DControls && (
            <div className="absolute top-3 left-3 z-10 flex gap-2">
              <Button
                size="sm"
                className="bg-white/90 hover:bg-white text-gray-900 shadow-lg border border-gray-200"
                onClick={handle3DView}
              >
                <Mountain className="w-4 h-4 mr-1.5" />
                3D
              </Button>
              <Button
                size="sm"
                className="bg-white/90 hover:bg-white text-gray-900 shadow-lg border border-gray-200"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                2D
              </Button>
            </div>
          )}
          
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