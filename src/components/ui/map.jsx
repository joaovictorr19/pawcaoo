import React from 'react';

// No-op Map components to safely remove map libraries
export const Map = React.forwardRef(function Map({ children, className }, ref) {
  return (
    <div ref={ref} className={className} style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
});

export const Marker = () => null;
export const Source = () => null;
export const Layer = () => null;