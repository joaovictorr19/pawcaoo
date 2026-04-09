import React from 'react';
import ReactMapGL, { MapRef, Marker, Source, Layer } from 'react-map-gl/maplibre';
import type { MarkerProps, SourceProps, LayerProps } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapProps {
  children?: React.ReactNode;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  mapStyle?: string;
  className?: string;
}

const Map = React.forwardRef<MapRef, MapProps>(
  ({ children, initialViewState, mapStyle, className }, ref) => {
    return (
      <ReactMapGL
        ref={ref}
        initialViewState={
          initialViewState || {
            longitude: -9.1393,
            latitude: 38.7223,
            zoom: 13,
          }
        }
        mapStyle={
          mapStyle || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
        }
        style={{ width: '100%', height: '100%' }}
        className={className}
      >
        {children}
      </ReactMapGL>
    );
  }
);

Map.displayName = 'Map';

export { Map, Marker, Source, Layer };
export type { MarkerProps, SourceProps, LayerProps };