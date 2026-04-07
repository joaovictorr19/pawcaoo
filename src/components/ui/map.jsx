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

const MapMarker = Marker;

const MarkerContent = ({ children, className }) => (
  <div className={className}>{children}</div>
);

const MapRoute = ({ coordinates, color = '#3b82f6', width = 4 }) => {
  if (!coordinates || coordinates.length < 2) return null;
  const geojson = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: coordinates.map(c => [c.lng !== undefined ? c.lng : c[0], c.lat !== undefined ? c.lat : c[1]])
    }
  };
  return (
    <Source type="geojson" data={geojson}>
      <Layer type="line" paint={{ 'line-color': color, 'line-width': width, 'line-cap': 'round', 'line-join': 'round' }} />
    </Source>
  );
};

const MapControls = ({ children }) => <>{children}</>;

export { Map, Marker, Source, Layer, MapMarker, MarkerContent, MapRoute, MapControls };