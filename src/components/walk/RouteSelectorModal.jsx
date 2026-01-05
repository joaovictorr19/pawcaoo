import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Map, MapRoute, MapMarker, MarkerContent } from "@/components/ui/map";
import { 
  Navigation, 
  Clock, 
  TrendingUp, 
  Star, 
  Bookmark,
  MapPin,
  Flame
} from "lucide-react";
import { toast } from "sonner";

export default function RouteSelectorModal({ isOpen, onClose, onSelectRoute, currentUserEmail }) {
  const queryClient = useQueryClient();
  const [previewRoute, setPreviewRoute] = useState(null);

  // Fetch user's saved routes
  const { data: mySavedRoutes = [] } = useQuery({
    queryKey: ['mySavedRoutes', currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return [];
      return await base44.entities.SavedRoute.filter({ walker_email: currentUserEmail }, '-times_used');
    },
    enabled: !!currentUserEmail && isOpen,
  });

  // Fetch popular public routes
  const { data: popularRoutes = [] } = useQuery({
    queryKey: ['popularRoutes'],
    queryFn: async () => {
      const routes = await base44.entities.SavedRoute.filter({ is_public: true }, '-times_used', 10);
      return routes;
    },
    enabled: isOpen,
  });

  // Suggested routes by duration
  const routesByDuration = {
    short: mySavedRoutes.concat(popularRoutes).filter(r => r.estimated_duration_minutes <= 30),
    medium: mySavedRoutes.concat(popularRoutes).filter(r => r.estimated_duration_minutes > 30 && r.estimated_duration_minutes <= 60),
    long: mySavedRoutes.concat(popularRoutes).filter(r => r.estimated_duration_minutes > 60),
  };

  const handleSelectRoute = (route) => {
    // Increment usage count
    base44.entities.SavedRoute.update(route.id, {
      times_used: (route.times_used || 0) + 1
    }).catch(err => console.log('Update count error:', err));

    onSelectRoute(route);
    onClose();
    toast.success(`Rota "${route.route_name}" selecionada!`);
  };

  const RouteCard = ({ route, isMine }) => (
    <div 
      className="bg-white border-2 border-gray-200 rounded-xl p-3 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all active:scale-98"
      onClick={() => handleSelectRoute(route)}
      onMouseEnter={() => setPreviewRoute(route)}
      onMouseLeave={() => setPreviewRoute(null)}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-bold text-gray-900 text-sm flex-1">{route.route_name}</h4>
        {isMine && <Bookmark className="w-4 h-4 text-blue-600 flex-shrink-0" />}
      </div>
      
      <div className="flex items-center gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Navigation className="w-3 h-3" />
          {route.distance_km?.toFixed(1)} km
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {route.estimated_duration_minutes} min
        </div>
        {route.times_used > 0 && (
          <div className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            {route.times_used}x
          </div>
        )}
      </div>

      {route.tags && route.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {route.tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Selecionar Rota</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 h-[70vh]">
          {/* Left: Route List */}
          <div className="overflow-y-auto p-4">
            <Tabs defaultValue="mine">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="mine">Minhas</TabsTrigger>
                <TabsTrigger value="popular">Populares</TabsTrigger>
                <TabsTrigger value="duration">Por Tempo</TabsTrigger>
              </TabsList>

              <TabsContent value="mine" className="space-y-2">
                {mySavedRoutes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhuma rota guardada ainda</p>
                  </div>
                ) : (
                  mySavedRoutes.map(route => <RouteCard key={route.id} route={route} isMine />)
                )}
              </TabsContent>

              <TabsContent value="popular" className="space-y-2">
                {popularRoutes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Nenhuma rota pública disponível
                  </div>
                ) : (
                  popularRoutes.map(route => <RouteCard key={route.id} route={route} />)
                )}
              </TabsContent>

              <TabsContent value="duration" className="space-y-3">
                <div>
                  <h4 className="font-semibold text-xs text-gray-600 mb-2">⚡ Rápidas (até 30 min)</h4>
                  <div className="space-y-2">
                    {routesByDuration.short.slice(0, 3).map(route => (
                      <RouteCard key={route.id} route={route} isMine={route.walker_email === currentUserEmail} />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-gray-600 mb-2">🚶 Médias (30-60 min)</h4>
                  <div className="space-y-2">
                    {routesByDuration.medium.slice(0, 3).map(route => (
                      <RouteCard key={route.id} route={route} isMine={route.walker_email === currentUserEmail} />
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-gray-600 mb-2">🏃 Longas (60+ min)</h4>
                  <div className="space-y-2">
                    {routesByDuration.long.slice(0, 3).map(route => (
                      <RouteCard key={route.id} route={route} isMine={route.walker_email === currentUserEmail} />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Map Preview */}
          <div className="bg-gray-100 relative">
            {previewRoute ? (
              <Map 
                center={previewRoute.coordinates[0] ? [previewRoute.coordinates[0].lng, previewRoute.coordinates[0].lat] : [-8.6291, 41.1579]}
                zoom={13}
              >
                <MapRoute 
                  coordinates={previewRoute.coordinates.map(c => [c.lng, c.lat])}
                  color="#3b82f6"
                  width={4}
                />
                {previewRoute.coordinates[0] && (
                  <MapMarker 
                    longitude={previewRoute.coordinates[0].lng} 
                    latitude={previewRoute.coordinates[0].lat}
                  >
                    <MarkerContent>
                      <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg" />
                    </MarkerContent>
                  </MapMarker>
                )}
              </Map>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MapPin className="w-16 h-16 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Passe o rato sobre uma rota para pré-visualizar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}