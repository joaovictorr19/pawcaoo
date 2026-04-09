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

export { Map, Marker, Source, Layer };