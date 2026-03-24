import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Map, { Source, Layer, Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, MessageCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

export default function AdminLiveMap({ users = [], bookings = [], onUserClick }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedWalk, setSelectedWalk] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const alarmSound = useRef(null);

  useEffect(() => {
    alarmSound.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const { data: activeWalks = [] } = useQuery({
    queryKey: ['activeWalksLive'],
    queryFn: async () => {
      const walks = await base44.entities.Booking.filter({ status: 'in_progress' }, '-updated_date', 100);
      return walks.filter(w => w.walker_lat && w.walker_lng);
    },
    refetchInterval: 10000,
  });

  const endWalkMutation = useMutation({
    mutationFn: async (walkId) => {
      await base44.entities.Booking.update(walkId, {
        status: 'completed',
        completed_date: new Date().toISOString(),
        forced_finish_reason: 'Encerrado por Administrador'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeWalksLive'] });
      toast.success("Corrida encerrada com sucesso.");
      setSelectedWalk(null);
    },
    onError: (e) => toast.error("Erro ao encerrar: " + e.message)
  });

  useEffect(() => {
    let violation = false;
    activeWalks.forEach(w => {
      if (w.pickup_lat && w.pickup_lng && w.walker_lat && w.walker_lng) {
        const dist = getDistanceInMeters(w.pickup_lat, w.pickup_lng, w.walker_lat, w.walker_lng);
        if (dist > 5000) violation = true;
      }
    });

    if (violation) {
      toast.error('⚠️ ALERTA DE GEOFENCING: Passeador fora do raio de 5km!');
      alarmSound.current?.play().catch(() => {});
    }
  }, [activeWalks]);

  const features = useMemo(() => {
    const f = [];
    users.forEach(u => {
      if (u.latitude && u.longitude) {
        const isWalker = u.account_type === 'walker' || u.account_type === 'both';
        const isTrainer = u.account_type === 'trainer' || u.account_type === 'both';
        const isOnline = u.pawgo_status?.is_online;
        
        let typeLabel = 'Cliente';
        let pinColor = '#3b82f6'; // Default azul
        
        if (isWalker && isOnline) {
          pinColor = '#22c55e'; // Verde para Online
          typeLabel = 'Passeador Online';
        } else if (isTrainer && isOnline) {
          pinColor = '#22c55e'; // Verde para Online
          typeLabel = 'Treinador Online';
        } else if (isTrainer) {
          pinColor = '#eab308'; // Amarelo
          typeLabel = 'Treinador Offline';
        } else if (isWalker) {
          pinColor = '#9ca3af'; // Cinza
          typeLabel = 'Passeador Offline';
        }

        f.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [u.longitude, u.latitude] },
          properties: {
            id: u.id,
            email: u.email,
            full_name: u.full_name || 'Utilizador',
            type_label: typeLabel,
            pin_color: pinColor,
            is_online: isOnline,
            profile_photo_url: u.profile_photo_url,
            gamification_xp: u.gamification_xp || 0
          }
        });
      }
    });
    return f;
  }, [users]);

  const staticData = useMemo(() => ({
    type: 'FeatureCollection',
    features
  }), [features]);

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-lg border-2 border-white relative">
      <Map
        initialViewState={{ longitude: -8.6291, latitude: 41.1579, zoom: 7 }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        interactiveLayerIds={['unclustered-point']}
        onClick={(e) => {
            const feature = e.features?.[0];
            if (feature?.layer.id === 'unclustered-point') {
                setSelectedUser({ ...feature.properties, coordinates: feature.geometry.coordinates });
            }
        }}
      >
        <Source
          id="users-source"
          type="geojson"
          data={staticData}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': ['step', ['get', 'point_count'], '#51bbd6', 10, '#f1f075', 50, '#f28cb1'],
              'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff'
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 14
            }}
            paint={{ 'text-color': '#ffffff' }}
          />
          <Layer
            id="unclustered-point"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-color': ['get', 'pin_color'],
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff'
            }}
          />
        </Source>

        {activeWalks.map(walk => {
          let isOutofBounds = false;
          if (walk.pickup_lat && walk.pickup_lng && walk.walker_lat && walk.walker_lng) {
             const dist = getDistanceInMeters(walk.pickup_lat, walk.pickup_lng, walk.walker_lat, walk.walker_lng);
             if (dist > 5000) isOutofBounds = true;
          }

          return (
          <Marker
            key={walk.id}
            longitude={walk.walker_lng}
            latitude={walk.walker_lat}
            anchor="bottom"
            onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedWalk(walk);
            }}
          >
            <div className="relative cursor-pointer group">
              <div className={`absolute -inset-3 rounded-full opacity-40 animate-ping group-hover:opacity-60 ${isOutofBounds ? 'bg-red-500' : 'bg-orange-500'}`}></div>
              <div className={`w-12 h-12 rounded-full border-4 border-white shadow-2xl flex items-center justify-center relative z-10 transition-transform group-hover:scale-110 ${isOutofBounds ? 'bg-red-600' : 'bg-orange-500'}`}>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={walk.dogs?.[0]?.photo_url} />
                  <AvatarFallback className="text-xs bg-transparent text-white">🐕</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </Marker>
          );
        })}

        {selectedWalk && (
          <Popup
            longitude={selectedWalk.walker_lng}
            latitude={selectedWalk.walker_lat}
            onClose={() => setSelectedWalk(null)}
            closeButton
            anchor="bottom"
            offset={40}
            className="rounded-xl overflow-hidden"
          >
            <div className="space-y-3 min-w-[240px] max-w-[300px] p-1">
              <div className="flex items-center gap-2 border-b pb-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-sm text-orange-800">Corrida em Curso</h3>
              </div>
              <div className="text-xs space-y-1 text-gray-700">
                <p><strong>Passeador:</strong> {selectedWalk.walker_name}</p>
                <p><strong>Cão:</strong> {selectedWalk.dog_name || 'N/A'}</p>
                <p><strong>Tutor:</strong> {selectedWalk.owner_name}</p>
              </div>
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t">
                <Button 
                  size="sm" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => navigate(createPageUrl(`Chat?user=${selectedWalk.walker_email}`))}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Assumir Chat (Admin)
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Encerrar corrida de emergência?")) {
                      endWalkMutation.mutate(selectedWalk.id);
                    }
                  }}
                  disabled={endWalkMutation.isPending}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {endWalkMutation.isPending ? 'A Encerrar...' : 'Encerrar Corrida'}
                </Button>
              </div>
            </div>
          </Popup>
        )}

        {selectedUser && (
          <Popup
            longitude={selectedUser.coordinates[0]}
            latitude={selectedUser.coordinates[1]}
            onClose={() => setSelectedUser(null)}
            closeButton
            anchor="bottom"
            offset={15}
            className="rounded-xl overflow-hidden"
          >
            <div className="space-y-2 min-w-[220px] max-w-[280px] p-1">
              <div className="flex items-center gap-2">
                <Avatar className="w-12 h-12 flex-shrink-0 border-2 border-gray-100">
                  <AvatarImage src={selectedUser.profile_photo_url} />
                  <AvatarFallback className="text-white text-xs bg-gray-600">
                    {selectedUser.full_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{selectedUser.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="flex gap-1.5 flex-wrap mt-1">
                <Badge variant="outline" className="text-[10px] bg-gray-50">
                  {selectedUser.type_label}
                </Badge>
                {selectedUser.is_online && (
                  <Badge className="bg-blue-500 text-white text-[10px] border-0">Online</Badge>
                )}
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-[10px] border-0">
                  {selectedUser.gamification_xp} XP
                </Badge>
              </div>

              <Button
                size="sm"
                className="w-full bg-black hover:bg-gray-800 text-white text-xs mt-2 h-8"
                onClick={() => {
                  window.open(createPageUrl(`UserProfile?email=${selectedUser.email}`), '_blank');
                  setSelectedUser(null);
                }}
              >
                Ver Perfil
              </Button>
            </div>
          </Popup>
        )}
        
        <NavigationControl position="top-right" />
      </Map>
    </div>
  );
}