import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UniversalMap from '@/components/maps/UniversalMap';
import { MapClusterLayer, MapPopup, MapMarker } from '@/components/ui/map';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Calendar, DollarSign, MessageCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminLiveMap({ 
  users = [], 
  bookings = [],
  onUserClick 
}) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedWalk, setSelectedWalk] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Escuta mudanças no verification_status em tempo real
  useEffect(() => {
    const unsubscribe = base44.entities.WalkerProfile.subscribe((event) => {
      if (event.type === 'update' || event.type === 'create') {
        // Se houver alteração de status de verificação, recarrega a lista de utilizadores e passeadores
        queryClient.invalidateQueries({ queryKey: ['allUsers'] });
        queryClient.invalidateQueries({ queryKey: ['allWalkersAdmin'] });
      }
    });
    return () => unsubscribe();
  }, [queryClient]);

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
      queryClient.invalidateQueries(['activeWalksLive']);
      toast.success("Corrida encerrada com sucesso.");
      setSelectedWalk(null);
    },
    onError: (e) => toast.error("Erro ao encerrar: " + e.message)
  });

  // Create GeoJSON for users
  // Pino Verde: Passeador online.
  // Pino Amarelo: Treinador
  // Outros (clientes/offline): Azul (maybe we don't show all, but let's show all that have lat/lng)
  const features = [];
  
  users.forEach(u => {
    if (u.latitude && u.longitude) {
      const isWalker = u.account_type === 'walker' || u.account_type === 'both';
      const isTrainer = u.account_type === 'trainer' || u.account_type === 'both';
      const isOnline = u.pawgo_status?.is_online;
      
      let typeLabel = 'Cliente';
      let pinColor = '#3b82f6'; // Azul
      
      if (isWalker && isOnline) {
        pinColor = '#22c55e'; // Verde
        typeLabel = 'Passeador Online';
      } else if (isTrainer) {
        pinColor = '#eab308'; // Amarelo
        typeLabel = 'Treinador';
      } else if (isWalker) {
        pinColor = '#9ca3af'; // Cinza (offline)
        typeLabel = 'Passeador Offline';
      }

      features.push({
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
          type_label: typeLabel,
          pin_color: pinColor,
          is_online: isOnline,
          profile_photo_url: u.profile_photo_url,
          gamification_xp: u.gamification_xp || 0
        }
      });
    }
  });

  const staticData = {
    type: 'FeatureCollection',
    features
  };

  return (
    <>
      <UniversalMap 
        center={[-8.6291, 41.1579]}
        zoom={7}
      >
        <MapClusterLayer
          data={staticData}
          clusterRadius={50}
          clusterMaxZoom={14}
          clusterColors={['#22c55e', '#eab308', '#ef4444', '#3b82f6']}
          pointColor={['get', 'pin_color']}
          onPointClick={(feature, coordinates) => {
            const props = feature.properties;
            setSelectedUser({
              ...props,
              coordinates
            });
          }}
        />

        {/* Live Walks Markers (Blue Animated) */}
        {activeWalks.map(walk => (
          <MapMarker
            key={walk.id}
            longitude={walk.walker_lng}
            latitude={walk.walker_lat}
            onClick={() => setSelectedWalk(walk)}
          >
            <div className="relative cursor-pointer group">
              <div className="absolute -inset-3 bg-blue-500 rounded-full opacity-40 animate-ping group-hover:opacity-60"></div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center relative z-10 transition-transform group-hover:scale-110">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={walk.dogs?.[0]?.photo_url} />
                  <AvatarFallback className="text-xs bg-transparent">🐕</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </MapMarker>
        ))}

        {/* Popup for Live Walks */}
        {selectedWalk && (
          <MapPopup
            longitude={selectedWalk.walker_lng}
            latitude={selectedWalk.walker_lat}
            onClose={() => setSelectedWalk(null)}
            closeButton
          >
            <div className="space-y-3 min-w-[240px] max-w-[300px]">
              <div className="flex items-center gap-2 border-b pb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <h3 className="font-bold text-sm text-blue-800">Corrida em Curso</h3>
              </div>
              <div className="text-xs space-y-1">
                <p><strong>Passeador:</strong> {selectedWalk.walker_name}</p>
                <p><strong>Cão:</strong> {selectedWalk.dog_name || 'N/A'}</p>
                <p><strong>Tutor:</strong> {selectedWalk.owner_name}</p>
              </div>
              <div className="flex flex-col gap-2 mt-2 pt-2 border-t">
                <Button 
                  size="sm" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
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
          </MapPopup>
        )}

        {/* Popup for selected static user */}
        {selectedUser && (
          <MapPopup
            longitude={selectedUser.coordinates[0]}
            latitude={selectedUser.coordinates[1]}
            onClose={() => setSelectedUser(null)}
            closeButton
          >
            <div className="space-y-2 min-w-[220px] max-w-[280px]">
              <div className="flex items-center gap-2">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={selectedUser.profile_photo_url} />
                  <AvatarFallback className="text-white text-xs bg-gray-600">
                    {selectedUser.full_name?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{selectedUser.full_name}</p>
                  <p className="text-xs text-gray-600 truncate">{selectedUser.email}</p>
                </div>
              </div>
              
              <div className="flex gap-1.5 flex-wrap mt-1">
                <Badge variant="outline" className="text-xs">
                  {selectedUser.type_label}
                </Badge>
                {selectedUser.is_online && (
                  <Badge className="bg-green-500 text-white text-[10px]">Online (PawGo)</Badge>
                )}
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-[10px]">
                  {selectedUser.gamification_xp} XP
                </Badge>
              </div>

              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-xs mt-2"
                onClick={() => {
                  window.open(createPageUrl(`UserProfile?email=${selectedUser.email}`), '_blank');
                  setSelectedUser(null);
                }}
              >
                Ver Perfil
              </Button>
            </div>
          </MapPopup>
        )}
      </UniversalMap>
    </>
  );
}