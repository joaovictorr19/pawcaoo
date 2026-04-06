import React, { useRef, useState } from 'react';
import ReactMapGL, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

export const Map = React.forwardRef(
  ({ children, initialViewState, mapStyle, className, onMapLoad, style, ...props }, ref) => {
    return (
      <ReactMapGL
        ref={ref}
        initialViewState={
          initialViewState || { longitude: -9.1393, latitude: 38.7223, zoom: 13 }
        }
        mapStyle={mapStyle || DEFAULT_MAP_STYLE}
        style={style || { width: '100%', height: '100%' }}
        className={className}
        onLoad={onMapLoad}
        {...props}
      >
        {children}
      </ReactMapGL>
    );
  }
);
Map.displayName = 'Map';

export function MapMarker({ longitude, latitude, children, ...props }) {
  return (
    <Marker longitude={longitude} latitude={latitude} {...props}>
      {children}
    </Marker>
  );
}

export function MarkerContent({ children }) {
  return <div className="marker-content">{children}</div>;
}

export function MarkerTooltip({ children }) {
  return (
    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
      {children}
    </div>
  );
}

export function MarkerPopup({ children, className }) {
  return (
    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 ${className || ''}`}>
      {children}
    </div>
  );
}

export function MapRoute({ coordinates, color = '#3b82f6', width = 3, opacity = 0.8 }) {
  if (!coordinates || coordinates.length < 2) return null;
  
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates,
    },
  };

  const layerId = `route-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <Source id={layerId} type="geojson" data={geojson}>
      <Layer
        id={`${layerId}-line`}
        type="line"
        paint={{
          'line-color': color,
          'line-width': width,
          'line-opacity': opacity,
        }}
        layout={{
          'line-join': 'round',
          'line-cap': 'round',
        }}
      />
    </Source>
  );
}

export { Marker, Source, Layer };