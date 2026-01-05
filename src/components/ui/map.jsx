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
  const [isReady, setIsReady] = useState(false);

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

    // Store map in DOM for controls
    if (mapContainer.current) {
      mapContainer.current._map = map.current;
    }

    map.current.on('load', () => {
      console.log('✅ Map loaded successfully at', finalCenter);
      setIsReady(true);
      if (onMapLoad) {
        onMapLoad(map.current);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className={className} />
      {isReady && children}
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

  const handleZoomIn = () => {
    const mapEl = document.querySelector('.maplibregl-map');
    if (mapEl?._map) {
      mapEl._map.zoomIn();
      console.log('Zoom in clicked');
    }
  };

  const handleZoomOut = () => {
    const mapEl = document.querySelector('.maplibregl-map');
    if (mapEl?._map) {
      mapEl._map.zoomOut();
      console.log('Zoom out clicked');
    }
  };

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('Location found:', pos.coords);
          const mapEl = document.querySelector('.maplibregl-map');
          if (mapEl?._map) {
            mapEl._map.flyTo({
              center: [pos.coords.longitude, pos.coords.latitude],
              zoom: 13
            });
          }
          if (onLocate) {
            onLocate({ longitude: pos.coords.longitude, latitude: pos.coords.latitude });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Não foi possível obter sua localização');
        }
      );
    }
  };

  return (
    <div className={`absolute ${positionClasses[position]} flex flex-col gap-1 z-10`}>
      {showZoom && (
        <>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
            onClick={handleZoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-white/95 hover:bg-white shadow-md"
            onClick={handleZoomOut}
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
          onClick={handleLocate}
        >
          <Locate className="w-4 h-4" />
        </Button>
      )}
      {showCompass && (
        <div className="h-8 w-8 bg-white/95 rounded shadow-md flex items-center justify-center text-xs font-bold">
          N
        </div>
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

export function MapRoute({ 
  coordinates, 
  color = '#3b82f6', 
  width = 3, 
  opacity = 0.8,
  id,
  onClick
}) {
  const routeId = useRef(id || `route-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const mapContainer = document.querySelector('.maplibregl-map');
    if (!mapContainer?._map) return;

    const map = mapContainer._map;

    const setupRoute = () => {
      if (map.getSource(routeId.current)) return;

      map.addSource(routeId.current, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      map.addLayer({
        id: routeId.current,
        type: 'line',
        source: routeId.current,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': color,
          'line-width': width,
          'line-opacity': opacity
        }
      });

      if (onClick) {
        map.on('click', routeId.current, (e) => {
          onClick(e);
        });
        map.on('mouseenter', routeId.current, () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', routeId.current, () => {
          map.getCanvas().style.cursor = '';
        });
      }
    };

    if (map.loaded()) {
      setupRoute();
    } else {
      map.on('load', setupRoute);
    }

    return () => {
      if (onClick) {
        map.off('click', routeId.current);
        map.off('mouseenter', routeId.current);
        map.off('mouseleave', routeId.current);
      }
      if (map.getLayer(routeId.current)) {
        map.removeLayer(routeId.current);
      }
      if (map.getSource(routeId.current)) {
        map.removeSource(routeId.current);
      }
    };
  }, [coordinates, color, width, opacity, onClick]);

  return null;
}

export function MapClusterLayer({
  data,
  clusterRadius = 50,
  clusterMaxZoom = 14,
  clusterColors = ['#51bbd6', '#f1f075', '#f28cb1'],
  pointColor = '#11b4da',
  onPointClick,
  id
}) {
  const layerId = useRef(id || `cluster-${Math.random().toString(36).substr(2, 9)}`);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    const mapContainer = document.querySelector('.maplibregl-map');
    if (!mapContainer?._map) {
      console.log('❌ Map not found');
      return;
    }

    const map = mapContainer._map;

    const setupCluster = () => {
      // Clean up existing
      try {
        if (map.getLayer(`${layerId.current}-clusters`)) map.removeLayer(`${layerId.current}-clusters`);
        if (map.getLayer(`${layerId.current}-cluster-count`)) map.removeLayer(`${layerId.current}-cluster-count`);
        if (map.getLayer(`${layerId.current}-unclustered-point`)) map.removeLayer(`${layerId.current}-unclustered-point`);
        if (map.getSource(layerId.current)) map.removeSource(layerId.current);
      } catch (e) {
        console.log('Cleanup skipped:', e.message);
      }

      let geoJsonData = data;
      
      console.log('📍 Setting up cluster with', geoJsonData?.features?.length || 0, 'features');

      if (!geoJsonData || !geoJsonData.features || geoJsonData.features.length === 0) {
        console.log('⚠️ No features to display');
        return;
      }

      // Add source
      map.addSource(layerId.current, {
        type: 'geojson',
        data: geoJsonData,
        cluster: true,
        clusterMaxZoom: clusterMaxZoom,
        clusterRadius: clusterRadius
      });

      // Cluster circles
      map.addLayer({
        id: `${layerId.current}-clusters`,
        type: 'circle',
        source: layerId.current,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            clusterColors[0],
            100,
            clusterColors[1],
            750,
            clusterColors[2]
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      });

      // Cluster count
      map.addLayer({
        id: `${layerId.current}-cluster-count`,
        type: 'symbol',
        source: layerId.current,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Individual points
      map.addLayer({
        id: `${layerId.current}-unclustered-point`,
        type: 'circle',
        source: layerId.current,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': pointColor,
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Click handlers
      map.on('click', `${layerId.current}-clusters`, (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [`${layerId.current}-clusters`]
        });
        if (features[0]) {
          const clusterId = features[0].properties.cluster_id;
          map.getSource(layerId.current).getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (!err) {
              map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom
              });
            }
          });
        }
      });

      if (onPointClick) {
        map.on('click', `${layerId.current}-unclustered-point`, (e) => {
          if (e.features && e.features.length > 0) {
            const coordinates = e.features[0].geometry.coordinates.slice();
            onPointClick(e.features[0], coordinates);
          }
        });
      }

      // Cursor changes
      map.on('mouseenter', `${layerId.current}-clusters`, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', `${layerId.current}-clusters`, () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', `${layerId.current}-unclustered-point`, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', `${layerId.current}-unclustered-point`, () => {
        map.getCanvas().style.cursor = '';
      });

      console.log('✅ Cluster setup complete');
      setSetupComplete(true);
    };

    if (map.loaded()) {
      setupCluster();
    } else {
      map.on('load', setupCluster);
    }

    return () => {
      try {
        if (map.getLayer(`${layerId.current}-clusters`)) map.removeLayer(`${layerId.current}-clusters`);
        if (map.getLayer(`${layerId.current}-cluster-count`)) map.removeLayer(`${layerId.current}-cluster-count`);
        if (map.getLayer(`${layerId.current}-unclustered-point`)) map.removeLayer(`${layerId.current}-unclustered-point`);
        if (map.getSource(layerId.current)) map.removeSource(layerId.current);
      } catch (e) {
        console.log('Cleanup error (safe to ignore):', e.message);
      }
    };
  }, [data, clusterRadius, clusterMaxZoom, clusterColors, pointColor, onPointClick]);

  return null;
}