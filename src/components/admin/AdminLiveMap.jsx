import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const parseLocation = (val) => {
  if (!val) return 0;
  return parseFloat(val.toString().replace(',', '.'));
};

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    },
    onError: (e) => toast.error("Erro ao encerrar: " + e.message)
  });

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-lg border-2 border-white relative">
      <MapContainer
        center={[41.1579, -8.6291]}
        zoom={7}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User markers */}
        {users.filter(u => u.latitude && u.longitude).map(u => {
          const isOnline = u.pawgo_status?.is_online;
          const color = isOnline ? '#22c55e' : '#9ca3af';
          return (
            <CircleMarker
              key={u.id}
              center={[parseLocation(u.latitude), parseLocation(u.longitude)]}
              radius={8}
              pathOptions={{ fillColor: color, color: '#fff', weight: 2, fillOpacity: 1 }}
            >
              <Popup>
                <div className="text-xs space-y-1 p-1">
                  <p className="font-bold">{u.full_name || u.email}</p>
                  <p className="text-gray-500">{u.email}</p>
                  {isOnline && <span className="bg-green-100 text-green-700 px-1 rounded text-[10px] font-bold">Online</span>}
                  <Button size="sm" className="w-full mt-1 h-7 text-xs" onClick={() => window.open(createPageUrl(`UserProfile?email=${u.email}`), '_blank')}>
                    Ver Perfil
                  </Button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Active walk markers */}
        {activeWalks.map(walk => {
          let isOutofBounds = false;
          if (walk.pickup_lat && walk.pickup_lng && walk.walker_lat && walk.walker_lng) {
            const dist = getDistanceInMeters(parseLocation(walk.pickup_lat), parseLocation(walk.pickup_lng), parseLocation(walk.walker_lat), parseLocation(walk.walker_lng));
            if (dist > 5000) isOutofBounds = true;
          }
          return (
            <CircleMarker
              key={walk.id}
              center={[parseLocation(walk.walker_lat), parseLocation(walk.walker_lng)]}
              radius={10}
              pathOptions={{ fillColor: isOutofBounds ? '#ef4444' : '#f97316', color: '#fff', weight: 2, fillOpacity: 1 }}
            >
              <Popup>
                <div className="text-xs space-y-1 p-1 min-w-[200px]">
                  <p className="font-bold text-orange-700">🐕 Passeio em Curso</p>
                  <p><strong>Passeador:</strong> {walk.walker_name}</p>
                  <p><strong>Cão:</strong> {walk.dog_name || 'N/A'}</p>
                  <p><strong>Tutor:</strong> {walk.owner_name}</p>
                  {isOutofBounds && <p className="text-red-600 font-bold">⚠️ Fora do raio!</p>}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full mt-1 h-7 text-xs"
                    onClick={() => { if (confirm("Encerrar corrida?")) endWalkMutation.mutate(walk.id); }}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Encerrar
                  </Button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}