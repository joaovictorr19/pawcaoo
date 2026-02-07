import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Save, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function ProfessionalVerificationPanel({ user, type = "walker", onClose }) {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  
  // State for form data
  const [verificationData, setVerificationData] = useState({
    verification_status: "pending",
    is_verified_trainer: false,
    is_pawcao_employee: false,
    has_pawcao_seal: false,
    is_verified: false,
  });

  const entityName = type === "walker" ? "WalkerProfile" : "TrainerProfile";
  const profileKey = type === "walker" ? "walkerProfile" : "trainerProfile";
  const title = type === "walker" ? "Verificações do Passeador" : "Verificações do Treinador";

  const { data: profileList, isLoading } = useQuery({
    queryKey: [profileKey, user?.email],
    queryFn: () =>
      type === "walker" 
        ? base44.asServiceRole.entities.WalkerProfile.filter({ created_by: user.email })
        : base44.asServiceRole.entities.TrainerProfile.filter({ created_by: user.email }),
    enabled: !!user?.email,
  });

  React.useEffect(() => {
    if (profileList && profileList.length > 0) {
      const profile = profileList[0];
      setVerificationData({
        verification_status: profile.verification_status || "pending",
        is_verified_trainer: profile.is_verified_trainer || false,
        is_pawcao_employee: profile.is_pawcao_employee || false,
        has_pawcao_seal: profile.has_pawcao_seal || false, // Walker only usually
        is_verified: profile.is_verified || false, // Trainer has this explicit field too
      });
    }
  }, [profileList]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!profileList || profileList.length === 0) {
        throw new Error(`Nenhum perfil de ${type === "walker" ? "passeador" : "treinador"} encontrado`);
      }
      
      const entity = type === "walker" 
        ? base44.asServiceRole.entities.WalkerProfile 
        : base44.asServiceRole.entities.TrainerProfile;

      return await entity.update(profileList[0].id, verificationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [profileKey, user.email] });
      toast.success("Verificações atualizadas!");
      setEditMode(false);
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!profileList || profileList.length === 0) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6 relative">
             <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2"
          >
            <X className="w-4 h-4" />
          </Button>
          <p className="text-sm text-yellow-800">
            Este utilizador não tem perfil de {type === "walker" ? "passeador" : "treinador"} criado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={`pb-4 ${type === 'walker' ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'bg-gradient-to-r from-blue-50 to-cyan-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${type === 'walker' ? 'text-purple-600' : 'text-blue-600'}`} />
            <CardTitle>{title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {editMode ? (
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Status de Verificação</Label>
              <Select
                value={verificationData.verification_status}
                onValueChange={(val) =>
                  setVerificationData({ ...verificationData, verification_status: val })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requires_documents">Requer Documentos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="verified">Verificado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <Label className="text-sm font-medium">Treinador Verificado (Badge)</Label>
                <input
                  type="checkbox"
                  checked={verificationData.is_verified_trainer}
                  onChange={(e) =>
                    setVerificationData({
                      ...verificationData,
                      is_verified_trainer: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <Label className="text-sm font-medium">Funcionário PawCão</Label>
                <input
                  type="checkbox"
                  checked={verificationData.is_pawcao_employee}
                  onChange={(e) =>
                    setVerificationData({
                      ...verificationData,
                      is_pawcao_employee: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              {type === "walker" && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <Label className="text-sm font-medium">Selo Oficial PawCão</Label>
                  <input
                    type="checkbox"
                    checked={verificationData.has_pawcao_seal}
                    onChange={(e) =>
                      setVerificationData({
                        ...verificationData,
                        has_pawcao_seal: e.target.checked,
                      })
                    }
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
              )}
              
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Is Verified (Genérico)</Label>
                  <input
                    type="checkbox"
                    checked={verificationData.is_verified}
                    onChange={(e) =>
                      setVerificationData({
                        ...verificationData,
                        is_verified: e.target.checked,
                      })
                    }
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditMode(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Status</span>
              <Badge variant="outline">
                {verificationData.verification_status}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Treinador Verificado</span>
              <Badge variant={verificationData.is_verified_trainer ? "default" : "secondary"}>
                {verificationData.is_verified_trainer ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Funcionário PawCão</span>
              <Badge variant={verificationData.is_pawcao_employee ? "default" : "secondary"}>
                {verificationData.is_pawcao_employee ? "✓" : "✗"}
              </Badge>
            </div>
            {type === "walker" && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Selo Oficial</span>
                <Badge variant={verificationData.has_pawcao_seal ? "default" : "secondary"}>
                  {verificationData.has_pawcao_seal ? "✓" : "✗"}
                </Badge>
              </div>
            )}
             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm">Is Verified</span>
                <Badge variant={verificationData.is_verified ? "default" : "secondary"}>
                  {verificationData.is_verified ? "✓" : "✗"}
                </Badge>
              </div>

            <Button
              onClick={() => setEditMode(true)}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Editar Verificações
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}