import React from 'react';

export interface MapProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Map = React.forwardRef<HTMLDivElement, MapProps>(
  ({ children, className, style }, ref) => {
    return (
      <div
        ref={ref as any}
        className={className}
        style={{ width: '100%', height: '100%', ...style }}
        aria-label="Map placeholder"
      >
        {children}
      </div>
    );
  }
);

Map.displayName = 'Map';

export const Marker: React.FC<{ children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const Source: React.FC<{ children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export const Layer: React.FC<{ children?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);

export type MarkerProps = React.ComponentProps<typeof Marker>;
export type SourceProps = React.ComponentProps<typeof Source>;
export type LayerProps = React.ComponentProps<typeof Layer>;