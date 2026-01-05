import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from './button';
import { ZoomIn, ZoomOut, Locate, Maximize } from 'lucide-react';

export function Map({ 
  initialViewState = { 
    longitude: -9.1393, 
    latitude: 38.7223, 
    zoom: 12 
  },
  center,
  zoom,
  className = "w-full h-full",
  children,
  onMapLoad
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const finalCenter = center || [initialViewState.longitude, initialViewState.latitude];
  const finalZoom = zoom !== undefined ? zoom : initialViewState.zoom;

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: finalCenter,
      zoom: finalZoom
    });

    if (onMapLoad) {
      map.current.on('load', () => {
        onMapLoad(map.current);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className={className} />
      {children}
    </div>
  );
}

export function MapControls({ 
  position = "bottom-right",
  showZoom = true,
  showCompass = false,
  showLocate = false,
  showFullscreen = false,
  onLocate
}) {
  const positionClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2"
  };

  return (
    <div className={`absolute ${positionClasses[position]} flex flex-col gap-1 z-10`}>
      {showZoom && (
        <>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
            onClick={(e) => {
              const mapEl = e.currentTarget.closest('.relative').querySelector('.maplibregl-map');
              if (mapEl?._map) mapEl._map.zoomIn();
            }}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
            onClick={(e) => {
              const mapEl = e.currentTarget.closest('.relative').querySelector('.maplibregl-map');
              if (mapEl?._map) mapEl._map.zoomOut();
            }}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </>
      )}
      {showLocate && (
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                if (onLocate) {
                  onLocate({ longitude: pos.coords.longitude, latitude: pos.coords.latitude });
                }
              });
            }
          }}
        >
          <Locate className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}