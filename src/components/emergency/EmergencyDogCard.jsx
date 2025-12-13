import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Zap, AlertCircle, User, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTheme } from "@/components/ThemeContext";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function EmergencyDogCard({ walk, distance }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const deleteWalkMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.EmergencyWalk.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyWalks'] });
      toast.success("Pedido de emergência apagado com sucesso.");
    },
  });
  const { colors } = useTheme();

  const getSizeLabel = (size) => {
    const labels = {
      small: "Small",
      medium: "Medium",
      large: "Large",
      extra_large: "XL"
    };
    return labels[size] || size;
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      urgent: "bg-yellow-100 text-yellow-800 border-yellow-300",
      very_urgent: "bg-orange-100 text-orange-800 border-orange-300",
      immediate: "bg-red-100 text-red-800 border-red-300 animate-pulse"
    };
    return colors[urgency] || colors.urgent;
  };

  const getUrgencyLabel = (urgency) => {
    const labels = {
      urgent: "Urgent",
      very_urgent: "Very Urgent",
      immediate: "IMMEDIATE"
    };
    return labels[urgency] || "Urgent";
  };

  return (
    <Card className="glass-panel overflow-hidden hover:shadow-xl transition-all duration-300 group border border-orange-200 relative rounded-2xl">
      {/* Urgency Badge Overlay */}
      <div className="absolute top-2 left-2 z-10">
        <Badge className={`${getUrgencyColor(walk.urgency_level)} border font-semibold text-xs px-2 py-0.5 shadow-md`}>
          <Zap className="w-3 h-3 mr-1" />
          {getUrgencyLabel(walk.urgency_level)}
        </Badge>
      </div>

      {/* Dog Photo */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 to-yellow-100">
        {walk.dog_photo_url ? (
          <img
            src={walk.dog_photo_url}
            alt={`Emergency Walk needed for ${walk.dog_name} in ${walk.location}`}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-orange-600">
                {walk.dog_name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        
        {/* Payment Badge */}
        <div className="absolute bottom-2 right-2">
          <Badge className="bg-green-500 text-white border-0 shadow-md text-sm px-3 py-1">
            <DollarSign className="w-4 h-4 mr-1" />
            ${walk.offered_amount}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {walk.dog_name}
          </h3>
          {distance !== null && (
            <div className="flex items-center text-gray-600 text-xs mb-1">
              <MapPin className="w-3 h-3 mr-1" />
              {distance.toFixed(1)} km de distância
            </div>
          )}
          {walk.dog_breed && (
            <p className="text-gray-600 text-xs">
              {walk.dog_breed} • {getSizeLabel(walk.dog_size)}
            </p>
          )}
        </div>

        {/* Time Needed */}
        <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
          <div className="flex items-center gap-2 text-orange-700">
            <Clock className="w-4 h-4" />
            <div className="text-xs">
              <span className="font-semibold">{walk.needed_time}</span>
              <span className="mx-1">•</span>
              <span>{walk.duration_hours}h</span>
            </div>
          </div>
        </div>

        {walk.special_notes && (
          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
            <p className="text-xs text-blue-900 line-clamp-2">
              {walk.special_notes}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md h-10 text-sm font-semibold"
            onClick={() => navigate(createPageUrl(`EmergencyWalkDetails?id=${walk.id}`))}
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Ver Detalhes
          </Button>
          
          {(user?.role === 'admin' || walk.created_by === user?.email) && (
            <Button 
              variant="destructive"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Tem certeza que deseja apagar este pedido?')) {
                  deleteWalkMutation.mutate(walk.id);
                }
              }}
              disabled={deleteWalkMutation.isPending}
              className="shadow-md h-10 w-10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}