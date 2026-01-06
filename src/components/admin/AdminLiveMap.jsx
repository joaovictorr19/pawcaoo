import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import UniversalMap from '@/components/maps/UniversalMap';
import { MapClusterLayer, MapPopup } from '@/components/ui/map';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Calendar, DollarSign, Navigation } from 'lucide-react';
import maplibregl from 'maplibre-gl';

export default function AdminLiveMap({ 
  walkers = [], 
  trainers = [], 
  users = [], 
  bookings = [],
  onUserClick 
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const markersRef = useRef([]);

  // Fetch ACTIVE walks in progress (real-time)
  const { data: activeWalks = [] } = useQuery({
    queryKey: ['activeWalksLive'],
    queryFn: async () => {
      const walks = await base44.entities.Booking.filter({ 
        status: 'in_progress' 
      }, '-updated_date', 100);
      return walks.filter(w => w.walker_lat && w.walker_lng);
    },
    refetchInterval: 10000, // Real-time polling every 10s
    staleTime: 5000,
  });

  console.log('🚶 Active walks tracked:', activeWalks.length);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, []);

  // Create GeoJSON for static professionals and clients
  const staticData = {
    type: 'FeatureCollection',
    features: [
      // Walkers (green)
      ...walkers
        .filter(w => w.latitude && w.longitude)
        .map(w => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [w.longitude, w.latitude]
          },
          properties: {
            id: w.id,
            email: w.created_by,
            full_name: w.walker_name,
            city: w.location || 'Sem cidade',
            account_type: 'walker',
            rating: w.rating,
            total_walks: w.total_walks,
            total_earnings: w.total_earnings,
            is_verified: w.verification_status === 'verified',
            profile_photo_url: w.photo_url
          }
        })),
      // Trainers (purple)
      ...trainers
        .filter(t => t.latitude && t.longitude)
        .map(t => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [t.longitude, t.latitude]
          },
          properties: {
            id: t.id,
            email: t.created_by,
            full_name: t.trainer_name || t.business_name,
            city: t.location || 'Sem cidade',
            account_type: 'trainer',
            rating: t.rating,
            is_verified: t.verification_status === 'verified',
            profile_photo_url: t.photo_url
          }
        })),
      // Users (blue)
      ...users
        .filter(u => u.latitude && u.longitude)
        .map(u => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [u.longitude, u.latitude]
          },
          properties: {
            id: u.id,
            email: u.email,
            full_name: u.full_name || 'Utilizador',
            city: u.city || 'Sem cidade',
            account_type: u.account_type || 'owner',
            total_bookings: bookings.filter(b => b.created_by === u.email).length,
            profile_photo_url: u.profile_photo_url
          }
        }))
    ]
  };

  // Render LIVE walker markers on top of clusters
  const renderLiveWalkers = (map) => {
    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    activeWalks.forEach(walk => {
      const el = document.createElement('div');
      el.className = 'live-walker-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="absolute -inset-3 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
          <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center relative z-10">
            <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="transform: rotate(45deg)">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([walk.walker_lng, walk.walker_lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <p class="font-bold text-sm">🚶 ${walk.walker_name}</p>
              <p class="text-xs text-gray-600">Passeio: ${walk.dog_name}</p>
              <p class="text-xs text-blue-600">⚡ EM MOVIMENTO</p>
            </div>
          `)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  return (
    <>
      <UniversalMap 
        center={[-8.6291, 41.1579]}
        zoom={7}
        onMapLoad={(mapInstance) => {
          console.log('🗺️ Admin map loaded, rendering live walkers...');
          renderLiveWalkers(mapInstance);
        }}
      >
        {/* Static Cluster Layer */}
        <MapClusterLayer
          data={staticData}
          clusterRadius={50}
          clusterMaxZoom={14}
          clusterColors={['#22c55e', '#eab308', '#ef4444']}
          pointColor="#3b82f6"
          onPointClick={(feature, coordinates) => {
            const props = feature.properties;
            setSelectedUser({
              ...props,
              coordinates
            });
          }}
        />

        {/* Popup for selected static user */}
        {selectedUser && (
          <MapPopup
            key={selectedUser.email}
            longitude={selectedUser.coordinates[0]}
            latitude={selectedUser.coordinates[1]}
            onClose={() => setSelectedUser(null)}
            closeButton
          >
            <div className="space-y-2 min-w-[220px] max-w-[280px]">
              <div className="flex items-center gap-2">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={selectedUser.profile_photo_url} />
                  <AvatarFallback className={`text-white text-xs ${
                    selectedUser.account_type === 'walker' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    selectedUser.account_type === 'trainer' ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                    'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    {selectedUser.full_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{selectedUser.full_name}</p>
                  <p className="text-xs text-gray-600 truncate">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs bg-gray-50 p-2 rounded-lg">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{selectedUser.city}</span>
                </p>
                {selectedUser.rating > 0 && (
                  <p className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    {selectedUser.rating?.toFixed(1)} ⭐
                  </p>
                )}
                {selectedUser.total_walks > 0 && (
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    {selectedUser.total_walks} passeios
                  </p>
                )}
                {selectedUser.total_earnings > 0 && (
                  <p className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    €{selectedUser.total_earnings?.toFixed(0)}
                  </p>
                )}
                {selectedUser.total_bookings > 0 && (
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    {selectedUser.total_bookings} reservas
                  </p>
                )}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Badge variant="outline" className={`text-xs capitalize ${
                  selectedUser.account_type === 'walker' ? 'border-green-500 text-green-700 bg-green-50' :
                  selectedUser.account_type === 'trainer' ? 'border-purple-500 text-purple-700 bg-purple-50' :
                  'border-blue-500 text-blue-700 bg-blue-50'
                }`}>
                  {selectedUser.account_type === 'walker' ? '🐕 Passeador' :
                   selectedUser.account_type === 'trainer' ? '🎓 Treinador' :
                   '👤 ' + (selectedUser.account_type || 'owner')}
                </Badge>
                {selectedUser.is_verified && (
                  <Badge className="bg-blue-500 text-white text-xs">✓ Verificado</Badge>
                )}
              </div>
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-xs mt-2"
                onClick={() => {
                  if (onUserClick) onUserClick(selectedUser);
                  setSelectedUser(null);
                }}
              >
                Ver Detalhes Completos
              </Button>
            </div>
          </MapPopup>
        )}
      </UniversalMap>

      {/* Render live walker markers after map loads */}
      <LiveWalkerMarkers walks={activeWalks} />
    </>
  );
}

// Component to render live walker markers
function LiveWalkerMarkers({ walks }) {
  const markersRef = useRef([]);

  useEffect(() => {
    const mapContainer = document.querySelector('.maplibregl-map');
    if (!mapContainer?._map) return;

    const map = mapContainer._map;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create new markers for active walks
    walks.forEach(walk => {
      const el = document.createElement('div');
      el.className = 'live-walker-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="absolute -inset-3 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
          <div class="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center relative z-10">
            <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="transform: rotate(45deg)">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([walk.walker_lng, walk.walker_lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div class="p-3">
              <p class="font-bold text-sm mb-1">🚶 ${walk.walker_name}</p>
              <p class="text-xs text-gray-600 mb-1">Cão: ${walk.dog_name}</p>
              <p class="text-xs text-blue-600 font-semibold">⚡ EM MOVIMENTO AO VIVO</p>
              <p class="text-xs text-gray-500 mt-1">Cliente: ${walk.owner_name}</p>
            </div>
          `)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    console.log('🔴 Rendered', walks.length, 'live walker markers');

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [walks]);

  return null;
}