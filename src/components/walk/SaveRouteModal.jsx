import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bookmark, X } from "lucide-react";

export default function SaveRouteModal({ 
  isOpen, 
  onClose, 
  routeData,
  userEmail
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    route_name: "",
    difficulty_level: "moderate",
    tags: [],
    notes: "",
    is_public: false
  });
  const [newTag, setNewTag] = useState("");

  const saveRouteMutation = useMutation({
    mutationFn: async (data) => {
      const routePayload = {
        walker_email: userEmail,
        route_name: data.route_name,
        coordinates: routeData.coordinates,
        distance_km: routeData.distance_km,
        estimated_duration_minutes: routeData.duration_minutes,
        difficulty_level: data.difficulty_level,
        tags: data.tags,
        notes: data.notes,
        is_public: data.is_public,
        times_used: 0,
        average_rating: 0
      };

      return await base44.entities.SavedRoute.create(routePayload);
    },
    onSuccess: () => {
      toast.success('✅ Rota guardada com sucesso!');
      queryClient.invalidateQueries(['mySavedRoutes']);
      onClose();
      setFormData({
        route_name: "",
        difficulty_level: "moderate",
        tags: [],
        notes: "",
        is_public: false
      });
    },
    onError: (error) => {
      toast.error('Erro ao guardar rota');
      console.error(error);
    }
  });

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.route_name.trim()) {
      toast.error('Indique um nome para a rota');
      return;
    }
    saveRouteMutation.mutate(formData);
  };

  if (!routeData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-600" />
            Guardar Rota
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome da Rota *</Label>
            <Input
              value={formData.route_name}
              onChange={(e) => setFormData(prev => ({ ...prev, route_name: e.target.value }))}
              placeholder="Ex: Parque da Cidade"
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="text-gray-500">Distância:</span>
              <span className="ml-1 font-semibold">{routeData.distance_km?.toFixed(2)} km</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Tempo:</span>
              <span className="ml-1 font-semibold">{routeData.duration_minutes} min</span>
            </div>
          </div>

          <div>
            <Label>Dificuldade</Label>
            <Select value={formData.difficulty_level} onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty_level: v }))}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">😊 Fácil</SelectItem>
                <SelectItem value="moderate">🚶 Moderada</SelectItem>
                <SelectItem value="hard">🏃 Difícil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Ex: parque, urbano"
                className="h-8 text-sm"
              />
              <Button type="button" size="sm" onClick={handleAddTag} className="h-8">
                +
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {formData.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre a rota..."
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <Label className="text-sm font-semibold text-blue-900">Tornar Pública</Label>
              <p className="text-xs text-blue-700">Outros passeadores poderão usar esta rota</p>
            </div>
            <Switch
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saveRouteMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {saveRouteMutation.isPending ? 'A guardar...' : 'Guardar Rota'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}