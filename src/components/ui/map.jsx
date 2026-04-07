import React, { useRef, useEffect, useState } from 'react';
import ReactMapGL, { Marker, Source, Layer, NavigationControl, GeolocateControl, FullscreenControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

// Map — accepts center=[lng,lat] + zoom, or initialViewState
export const Map = React.forwardRef(({ children, center, zoom, initialViewState, mapStyle, className, style }, ref) => {
  const viewState = initialViewState || (center ? {
    longitude: center[0],
    latitude: center[1],
    zoom: zoom || 13,
  } : { longitude: -9.1393, latitude: 38.7223, zoom: 13 });

  return (
    <ReactMapGL
      ref={ref}
      initialViewState={viewState}
      mapStyle={mapStyle || DEFAULT_STYLE}
      style={{ width: '100%', height: '100%', ...style }}
      className={className}
    >
      {children}
    </ReactMapGL>
  );
});
Map.displayName = 'Map';

// MapControls
export function MapControls({ position = 'top-right', showZoom, showCompass, showLocate, showFullscreen }) {
  return (
    <>
      {(showZoom || showCompass) && <NavigationControl position={position} showCompass={!!showCompass} showZoom={!!showZoom} />}
      {showLocate && <GeolocateControl position={position} />}
      {showFullscreen && <FullscreenControl position={position} />}
    </>
  );
}

// MapMarker — wraps react-map-gl Marker, renders MarkerContent and MarkerTooltip as children
export function MapMarker({ longitude, latitude, children }) {
  const [showTooltip, setShowTooltip] = useState(false);

  const content = [];
  const tooltip = [];
  React.Children.forEach(children, child => {
    if (!child) return;
    if (child.type === MarkerContent) content.push(child);
    else if (child.type === MarkerTooltip) tooltip.push(child);
    else content.push(child);
  });

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {content}
        {showTooltip && tooltip.length > 0 && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50">
            {tooltip}
          </div>
        )}
      </div>
    </Marker>
  );
}

// MarkerContent — just renders its children
export function MarkerContent({ children }) {
  return <>{children}</>;
}

// MarkerTooltip — renders a small tooltip bubble
export function MarkerTooltip({ children }) {
  return (
    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
      {children}
    </div>
  );
}

// MapRoute — renders a GeoJSON line on the map
export function MapRoute({ coordinates, color = '#3b82f6', width = 4, opacity = 1, id }) {
  const routeId = id || 'route-' + Math.random().toString(36).slice(2, 8);

  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: coordinates,
    },
  };

  return (
    <Source id={routeId} type="geojson" data={geojson}>
      <Layer
        id={routeId + '-line'}
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