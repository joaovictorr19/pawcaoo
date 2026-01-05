import React from 'react';
import Map, { Marker, NavigationControl, GeolocateControl, FullscreenControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapComponentProps {
  children?: React.ReactNode;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  style?: React.CSSProperties;
  className?: string;
  onMove?: (evt: any) => void;
  onClick?: (evt: any) => void;
}

const MapComponent = React.forwardRef<any, MapComponentProps>(
  ({ children, initialViewState, style, className, onMove, onClick, ...props }, ref) => {
    return (
      <Map
        ref={ref}
        initialViewState={
          initialViewState || {
            longitude: -8.6291,
            latitude: 41.1579,
            zoom: 13,
          }
        }
        style={{ width: '100%', height: '100%', ...style }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        onMove={onMove}
        onClick={onClick}
        {...props}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />
        <FullscreenControl position="top-right" />
        {children}
      </Map>
    );
  }
);

MapComponent.displayName = 'Map';

export { MapComponent as Map, Marker, NavigationControl, GeolocateControl, FullscreenControl };
export default MapComponent;