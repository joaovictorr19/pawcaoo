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

export default function WalkerVerificationPanel({ user, onClose }) {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [verificationData, setVerificationData] = useState({
    verification_status: "pending",
    is_verified_trainer: false,
    is_pawcao_employee: false,
    has_pawcao_seal: false,
  });

  const { data: walkerProfile, isLoading } = useQuery({
    queryKey: ["walkerProfile", user?.email],
    queryFn: () =>
      base44.asServiceRole.entities.WalkerProfile.filter({ created_by: user.email }),
  });

  React.useEffect(() => {
    if (walkerProfile && walkerProfile.length > 0) {
      const profile = walkerProfile[0];
      setVerificationData({
        verification_status: profile.verification_status || "pending",
        is_verified_trainer: profile.is_verified_trainer || false,
        is_pawcao_employee: profile.is_pawcao_employee || false,
        has_pawcao_seal: profile.has_pawcao_seal || false,
      });
    }
  }, [walkerProfile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!walkerProfile || walkerProfile.length === 0) {
        throw new Error("Nenhum perfil de passeador encontrado");
      }
      return await base44.asServiceRole.entities.WalkerProfile.update(
        walkerProfile[0].id,
        verificationData
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walkerProfile", user.email] });
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

  if (!walkerProfile || walkerProfile.length === 0) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <p className="text-sm text-yellow-800">
            Este utilizador não tem perfil de passeador criado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <CardTitle>Verificações do Passeador</CardTitle>
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
                <Label className="text-sm font-medium">Treinador Verificado</Label>
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
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Selo Oficial</span>
              <Badge variant={verificationData.has_pawcao_seal ? "default" : "secondary"}>
                {verificationData.has_pawcao_seal ? "✓" : "✗"}
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