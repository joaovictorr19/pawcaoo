import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import UniversalMap from '@/components/maps/UniversalMap';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, User, Dog, Zap, MessageCircle, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminLiveMap({ className }) {
  const queryClient = useQueryClient();
  const [selectedProfile, setSelectedProfile] = useState(null);

  // 1. Fetch ALL active walkers (online)
  const { data: onlineWalkers = [] } = useQuery({
    queryKey: ['adminLiveWalkers'],
    queryFn: async () => {
      // Fetch online walkers
      const walkers = await base44.entities.WalkerProfile.filter({ 
        is_online: true,
        is_active: true
      });
      return walkers;
    },
    refetchInterval: 10000 // Refresh every 10s
  });

  // 2. Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = base44.entities.WalkerProfile.subscribe((event) => {
      // Invalidate on ANY change to refresh map
      if (event.type === 'update' || event.type === 'create') {
        queryClient.invalidateQueries({ queryKey: ['adminLiveWalkers'] });
        
        // Specifically listen for verification_status changes
        if (event.data?.verification_status === 'verified' && event.data?.has_pawcao_seal) {
          // Could trigger a toast or animation here
          console.log('New verified walker!', event.data.walker_name);
        }
      }
    });
    return () => unsubscribe();
  }, [queryClient]);

  // 3. Prepare markers
  const markers = onlineWalkers.map(walker => ({
    id: walker.id,
    lat: walker.latitude || 38.7223, // Default Lisbon if missing
    lng: walker.longitude || -9.1393,
    title: walker.walker_name,
    color: walker.verification_status === 'verified' ? '#22c55e' : '#f59e0b', // Green for verified, Amber for pending
    icon: walker.verification_status === 'verified' ? 'shield-check' : 'user',
    data: walker
  }));

  const handleMarkerClick = (marker) => {
    setSelectedProfile(marker.data);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px] ${className}`}>
      {/* Map Section */}
      <div className="lg:col-span-2 rounded-xl overflow-hidden border shadow-sm relative">
        <UniversalMap
          markers={markers}
          onMarkerClick={handleMarkerClick}
          center={[38.7223, -9.1393]} // Lisbon center
          zoom={12}
          className="w-full h-full"
        />
        
        {/* Quick Stats Overlay */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-md z-[1000]">
          <div className="flex items-center gap-3 text-sm font-medium">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {onlineWalkers.length} Online
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {onlineWalkers.filter(w => w.verification_status === 'verified').length} Verificados
            </div>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <Card className="h-full overflow-hidden flex flex-col">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Live Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedProfile ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage src={selectedProfile.photo_url} />
                  <AvatarFallback>{selectedProfile.walker_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{selectedProfile.walker_name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedProfile.verification_status === 'verified' ? "default" : "secondary"} className={selectedProfile.verification_status === 'verified' ? "bg-green-600" : ""}>
                      {selectedProfile.verification_status === 'verified' ? 'Verificado' : 'Pendente'}
                    </Badge>
                    <span className="text-xs text-gray-500">ID: {selectedProfile.id.slice(0,6)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-gray-500 block text-xs">Localização</span>
                  {selectedProfile.location || 'N/A'}
                </div>
                <div className="bg-slate-50 p-2 rounded">
                  <span className="text-gray-500 block text-xs">Rate</span>
                  {selectedProfile.hourly_rate}€/h
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button className="w-full gap-2" size="sm">
                  <MessageCircle className="w-4 h-4" /> Iniciar Chat
                </Button>
                <Button variant="outline" className="w-full gap-2 text-red-600 hover:bg-red-50" size="sm">
                  <AlertCircle className="w-4 h-4" /> Suspender
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Selecione um profissional no mapa para ver detalhes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}