import React from 'react';
import ReactMapGL, { Marker, Source, Layer } from 'react-map-gl/maplibre';
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

const MapRoute = ({ coordinates, ...props }) => {
  if (!coordinates?.length) return null;
  return (
    <Source {...props} type="geojson" data={{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates.map(c => [c.lng, c.lat])
      }
    }}>
      <Layer type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 2 }} />
    </Source>
  );
};

const MapControls = ({ children }) => {
  return <div className="absolute top-4 right-4 space-y-2">{children}</div>;
};

const MapMarker = ({ lat, lng, children, ...props }) => {
  return <Marker longitude={lng} latitude={lat} {...props}>{children}</Marker>;
};

const MarkerContent = ({ children }) => {
  return <div className="bg-white rounded-lg shadow-lg p-2">{children}</div>;
};

export { Map, Marker, Source, Layer, MapRoute, MapControls, MapMarker, MarkerContent };