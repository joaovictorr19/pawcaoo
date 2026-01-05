import React, { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export function Map({ 
  initialViewState = { 
    longitude: -9.1393, 
    latitude: 38.7223, 
    zoom: 12 
  },
  className = "w-full h-full",
  children 
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [initialViewState.longitude, initialViewState.latitude],
      zoom: initialViewState.zoom
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div ref={mapContainer} className={className} />
  );
}