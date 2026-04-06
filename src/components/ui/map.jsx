import React from 'react';
import ReactMapGL, { Marker, Source, Layer, NavigationControl, FullscreenControl, GeolocateControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const Map = React.forwardRef(
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

// MapRoute - line/polyline on map
export function MapRoute({ coordinates, color = '#000', width = 3, opacity = 1 }) {
  const geojson = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    }]
  };

  return (
    <Source id={`route-${Date.now()}`} type="geojson" data={geojson}>
      <Layer
        id={`route-layer-${Date.now()}`}
        type="line"
        paint={{
          'line-color': color,
          'line-width': width,
          'line-opacity': opacity
        }}
      />
    </Source>
  );
}

// MapMarker - marker component
export function MapMarker({ longitude, latitude, children, ...props }) {
  return (
    <Marker longitude={longitude} latitude={latitude} {...props}>
      {children}
    </Marker>
  );
}

// MarkerContent - wrapper for marker content
export function MarkerContent({ children }) {
  return <div className="flex items-center justify-center">{children}</div>;
}

export { Map, Marker, Source, Layer, NavigationControl, FullscreenControl, GeolocateControl };