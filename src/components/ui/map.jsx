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

// Alias components used in various parts of the app
const MapMarker = Marker;
const MarkerContent = ({ children }) => <>{children}</>;
const MarkerTooltip = ({ children }) => <>{children}</>;
const MarkerPopup = ({ children }) => <>{children}</>;
const MapRoute = () => null;

export { Map, Marker, Source, Layer, MapMarker, MarkerContent, MarkerTooltip, MarkerPopup, MapRoute };