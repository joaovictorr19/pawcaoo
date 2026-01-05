import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from './button';
import { ZoomIn, ZoomOut, Locate, Maximize } from 'lucide-react';

export function Map({ 
  initialViewState = { 
    longitude: -9.1393, 
    latitude: 38.7223, 
    zoom: 12 
  },
  center,
  zoom,
  className = "w-full h-full",
  children,
  onMapLoad
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const finalCenter = center || [initialViewState.longitude, initialViewState.latitude];
  const finalZoom = zoom !== undefined ? zoom : initialViewState.zoom;

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: finalCenter,
      zoom: finalZoom
    });

    if (onMapLoad) {
      map.current.on('load', () => {
        onMapLoad(map.current);
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className={className} />
      {children}
    </div>
  );
}

export function MapControls({ 
  position = "bottom-right",
  showZoom = true,
  showCompass = false,
  showLocate = false,
  showFullscreen = false,
  onLocate
}) {
  const positionClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2"
  };

  return (
    <div className={`absolute ${positionClasses[position]} flex flex-col gap-1 z-10`}>
      {showZoom && (
        <>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
            onClick={(e) => {
              const mapEl = e.currentTarget.closest('.relative').querySelector('.maplibregl-map');
              if (mapEl?._map) mapEl._map.zoomIn();
            }}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
            onClick={(e) => {
              const mapEl = e.currentTarget.closest('.relative').querySelector('.maplibregl-map');
              if (mapEl?._map) mapEl._map.zoomOut();
            }}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </>
      )}
      {showLocate && (
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition((pos) => {
                if (onLocate) {
                  onLocate({ longitude: pos.coords.longitude, latitude: pos.coords.latitude });
                }
              });
            }
          }}
        >
          <Locate className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export function MapMarker({ longitude, latitude, children }) {
  const markerRef = useRef(null);
  const popupRef = useRef(null);
  const [contentEl, setContentEl] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    const mapContainer = document.querySelector('.maplibregl-map');
    if (!mapContainer?._map || markerRef.current) return;

    const el = document.createElement('div');
    el.className = 'marker-container cursor-pointer';
    
    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .addTo(mapContainer._map);

    setContentEl(el);

    el.addEventListener('click', () => {
      setIsPopupOpen(prev => !prev);
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [longitude, latitude]);

  useEffect(() => {
    const mapContainer = document.querySelector('.maplibregl-map');
    if (!mapContainer?._map || !isPopupOpen || popupRef.current) return;

    const popup = React.Children.toArray(children).find(
      child => child.type === MarkerPopup
    );

    if (popup) {
      const popupInstance = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 25,
        className: 'map-popup'
      })
        .setLngLat([longitude, latitude])
        .setDOMContent(createPopupElement(popup))
        .addTo(mapContainer._map);

      popupInstance.on('close', () => {
        setIsPopupOpen(false);
      });

      popupRef.current = popupInstance;
    }

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, [isPopupOpen, longitude, latitude, children]);

  const createPopupElement = (popup) => {
    const div = document.createElement('div');
    div.className = popup.props.className || '';
    ReactDOM.render(popup.props.children, div);
    return div;
  };

  const content = React.Children.toArray(children).find(
    child => child.type === MarkerContent
  );
  const tooltip = React.Children.toArray(children).find(
    child => child.type === MarkerTooltip
  );

  return (
    <>
      {contentEl && content && ReactDOM.createPortal(content.props.children, contentEl)}
    </>
  );
}

export function MarkerContent({ children }) {
  return <>{children}</>;
}

export function MarkerLabel({ children, position = 'top' }) {
  const positionClasses = {
    top: '-top-6 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-1 left-1/2 -translate-x-1/2',
    left: 'right-full mr-1 top-1/2 -translate-y-1/2',
    right: 'left-full ml-1 top-1/2 -translate-y-1/2'
  };

  return (
    <div className={`absolute ${positionClasses[position]} bg-white text-gray-900 text-xs font-medium px-2 py-0.5 rounded shadow-md whitespace-nowrap pointer-events-none`}>
      {children}
    </div>
  );
}

export function MarkerTooltip({ children }) {
  return <>{children}</>;
}

export function MarkerPopup({ children, className }) {
  return <>{children}</>;
}

export function MapPopup({ 
  longitude, 
  latitude, 
  children, 
  onClose,
  closeButton = true,
  closeOnClick = true,
  focusAfterOpen = true,
  offset = 10,
  className 
}) {
  const popupRef = useRef(null);

  useEffect(() => {
    const mapContainer = document.querySelector('.maplibregl-map');
    if (!mapContainer?._map || popupRef.current) return;

    const popupInstance = new maplibregl.Popup({
      closeButton,
      closeOnClick,
      focusAfterOpen,
      offset,
      className: className || ''
    })
      .setLngLat([longitude, latitude])
      .setDOMContent(createPopupContent())
      .addTo(mapContainer._map);

    if (onClose) {
      popupInstance.on('close', onClose);
    }

    popupRef.current = popupInstance;

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, [longitude, latitude, closeButton, closeOnClick, focusAfterOpen, offset, className]);

  const createPopupContent = () => {
    const div = document.createElement('div');
    div.className = 'p-3';
    ReactDOM.render(children, div);
    return div;
  };

  return null;
}