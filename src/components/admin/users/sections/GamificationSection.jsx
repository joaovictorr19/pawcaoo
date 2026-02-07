import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function GamificationSection({ user, userProfile }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    gamification_xp: userProfile?.gamification_xp || 0,
    gamification_level: userProfile?.gamification_level || 1,
  });

  const updateXpMutation = useMutation({
    mutationFn: () => {
      if (!userProfile?.id) {
        throw new Error("Perfil de utilizador não encontrado");
      }
      return base44.entities.UserProfile.update(userProfile.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", user.email] });
      toast.success("Gamificação atualizada!");
      setIsEditing(false);
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  if (!userProfile) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="py-8 text-center text-gray-500">
          Perfil de gamificação não encontrado
        </CardContent>
      </Card>
    );
  }

  const xpForNextLevel = formData.gamification_level * 1000;
  const progressPercentage = (formData.gamification_xp % 1000) / 10;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              ⚡ Gamificação
            </CardTitle>
            {!isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div>
                <Label>XP Total</Label>
                <Input
                  type="number"
                  value={formData.gamification_xp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gamification_xp: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label>Nível</Label>
                <Input
                  type="number"
                  value={formData.gamification_level}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gamification_level: parseInt(e.target.value) || 1,
                    })
                  }
                  className="mt-1 h-9"
                  min="1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => updateXpMutation.mutate()}
                  disabled={updateXpMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                >
                  {updateXpMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      gamification_xp: userProfile.gamification_xp || 0,
                      gamification_level: userProfile.gamification_level || 1,
                    });
                  }}
                  className="flex-1 gap-2"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    XP Total
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {userProfile.gamification_xp.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Nível
                  </p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {userProfile.gamification_level}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                  Progresso para Próximo Nível
                </p>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full transition-all"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    {formData.gamification_xp % 1000} / 1000 XP
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}