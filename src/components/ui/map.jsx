import React from 'react';

// Lightweight placeholder Map without external dependencies
// Keeps the same API so existing code compiles even without map libraries

type MapProps = {
  children?: React.ReactNode;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom: number;
  };
  mapStyle?: string;
  className?: string;
};

const Map = React.forwardRef<HTMLDivElement, MapProps>(
  ({ children, initialViewState, mapStyle, className }, ref) => {
    const info = initialViewState
      ? `lng: ${initialViewState.longitude.toFixed(3)} | lat: ${initialViewState.latitude.toFixed(3)} | zoom: ${initialViewState.zoom}`
      : 'default view';

    return (
      <div
        ref={ref}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(135deg, rgba(241,245,249,1) 0%, rgba(226,232,240,1) 100%)',
          borderRadius: '0.75rem',
          border: '1px solid rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-label="Map placeholder"
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: 8,
            fontSize: 11,
          }}
        >
          Map preview disabled • {info}
        </div>
        <div style={{ width: '100%', height: '100%' }}>{children}</div>
      </div>
    );
  }
);

Map.displayName = 'Map';

// No-op stubs to avoid compile errors if used elsewhere
const Marker: React.FC<any> = () => null;
const Source: React.FC<any> = ({ children }) => <>{children}</>;
const Layer: React.FC<any> = ({ children }) => <>{children}</>;

// Type stubs for compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MarkerProps = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SourceProps = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LayerProps = any;

export { Map, Marker, Source, Layer };
export type { MarkerProps, SourceProps, LayerProps };