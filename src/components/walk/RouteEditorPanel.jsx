import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { 
  Navigation, 
  Edit3, 
  Trash2, 
  MapPin, 
  Undo,
  Save,
  Plus
} from "lucide-react";
import { toast } from "sonner";

export default function RouteEditorPanel({ 
  isOpen, 
  onClose, 
  routeCoordinates,
  onUpdateRoute,
  onAddWaypoint,
  onRemoveWaypoint,
  currentPosition
}) {
  const [editMode, setEditMode] = useState(false);

  const handleAddCurrentPosition = () => {
    if (!currentPosition) {
      toast.error('Aguarde sinal GPS...');
      return;
    }

    onAddWaypoint({
      lat: currentPosition.lat,
      lng: currentPosition.lng,
      timestamp: new Date().toISOString(),
      accuracy: currentPosition.accuracy
    });

    toast.success('Ponto adicionado à rota!');
  };

  const handleUndoLastPoint = () => {
    if (routeCoordinates.length > 0) {
      const newRoute = routeCoordinates.slice(0, -1);
      onUpdateRoute(newRoute);
      toast.success('Último ponto removido');
    }
  };

  const calculateRouteStats = () => {
    if (!routeCoordinates || routeCoordinates.length < 2) {
      return { distance: 0, points: 0 };
    }

    let totalDistance = 0;
    for (let i = 1; i < routeCoordinates.length; i++) {
      const R = 6371;
      const dLat = (routeCoordinates[i].lat - routeCoordinates[i-1].lat) * Math.PI / 180;
      const dLon = (routeCoordinates[i].lng - routeCoordinates[i-1].lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(routeCoordinates[i-1].lat * Math.PI / 180) * 
                Math.cos(routeCoordinates[i].lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalDistance += R * c;
    }

    return {
      distance: totalDistance,
      points: routeCoordinates.length
    };
  };

  const stats = calculateRouteStats();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[60vh]">
        <SheetHeader className="border-b pb-3">
          <SheetTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-600" />
            Editar Rota em Tempo Real
          </SheetTitle>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {/* Route Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-blue-700 font-medium">Distância</span>
              </div>
              <span className="text-lg font-bold text-blue-900">{stats.distance.toFixed(2)} km</span>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 font-medium">Pontos</span>
              </div>
              <span className="text-lg font-bold text-green-900">{stats.points}</span>
            </div>
          </div>

          {/* Edit Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleAddCurrentPosition}
              disabled={!currentPosition}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Posição Atual à Rota
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleUndoLastPoint}
                variant="outline"
                disabled={routeCoordinates.length === 0}
                className="h-10"
              >
                <Undo className="w-4 h-4 mr-2" />
                Desfazer
              </Button>
              <Button
                onClick={() => {
                  if (confirm('Limpar toda a rota atual?')) {
                    onUpdateRoute([]);
                    toast.success('Rota limpa');
                  }
                }}
                variant="outline"
                className="h-10 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            💡 <strong>Dica:</strong> Adicione pontos enquanto caminha para criar uma rota personalizada. 
            Pode guardá-la no final para usar em futuros passeios.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}