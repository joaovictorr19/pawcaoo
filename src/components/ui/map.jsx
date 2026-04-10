import React from 'react';

// Neutral placeholder module for map — required by app structure but does nothing
export type MarkerProps = any;
export type SourceProps = any;
export type LayerProps = any;

const Map = React.forwardRef<any, any>(function Map(_props, _ref) {
  return null;
});

export const Marker: React.FC<MarkerProps> = () => null;
export const Source: React.FC<SourceProps> = () => null;
export const Layer: React.FC<LayerProps> = () => null;

Map.displayName = 'Map';

export { Map };
export default Map;