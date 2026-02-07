import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfessionalSection({
  user,
  walkerProfile,
  trainerProfile,
}) {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [professionalType, setProfessionalType] = useState("walker");
  const [formData, setFormData] = useState({
    walker_name: user.full_name || "",
    location: user.city || "",
    hourly_rate: 15,
    whatsapp_number: user.phone || "",
    bio: "",
    experience_years: 1,
  });

  const createProfessionalMutation = useMutation({
    mutationFn: async (data) => {
      const operations = [];
      let newAccountType = user.account_type || "owner";

      if (professionalType === "walker" || professionalType === "both") {
        const existingWalker = await base44.asServiceRole.entities.WalkerProfile.filter(
          { created_by: user.email }
        );
        if (existingWalker.length > 0) {
          throw new Error("Este utilizador já tem conta de Passeador");
        }

        operations.push(
          base44.asServiceRole.entities.WalkerProfile.create({
            walker_name: data.walker_name,
            location: data.location,
            hourly_rate: data.hourly_rate,
            whatsapp_number: data.whatsapp_number,
            bio: data.bio,
            experience_years: data.experience_years,
            created_by: user.email,
            is_active: true,
            verification_status: "verified",
          })
        );
        newAccountType = professionalType === "both" ? "both" : "walker";
      }

      if (professionalType === "trainer" || professionalType === "both") {
        const existingTrainer = await base44.asServiceRole.entities.TrainerProfile.filter(
          { created_by: user.email }
        );
        if (existingTrainer.length > 0) {
          throw new Error("Este utilizador já tem conta de Treinador");
        }

        operations.push(
          base44.asServiceRole.entities.TrainerProfile.create({
            trainer_name: data.walker_name,
            location: data.location,
            hourly_rate: data.hourly_rate,
            phone: data.whatsapp_number,
            bio: data.bio,
            experience_years: data.experience_years,
            created_by: user.email,
            is_active: true,
            verification_status: "verified",
          })
        );
        newAccountType = professionalType === "both" ? "both" : "trainer";
      }

      operations.push(
        base44.asServiceRole.entities.User.update(user.id, {
          account_type: newAccountType,
        })
      );

      return Promise.all(operations);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walkerProfile", user.email] });
      queryClient.invalidateQueries({ queryKey: ["trainerProfile", user.email] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("Conta profissional criada!");
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      walker_name: user.full_name || "",
      location: user.city || "",
      hourly_rate: 15,
      whatsapp_number: user.phone || "",
      bio: "",
      experience_years: 1,
    });
    setProfessionalType("walker");
  };

  const handleCreate = () => {
    if (!formData.walker_name.trim() || !formData.location.trim()) {
      toast.error("Preencha os dados obrigatórios");
      return;
    }
    createProfessionalMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      {/* Walker Profile Card */}
      {walkerProfile ? (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              🚶 Passeador
              <Badge className="bg-green-100 text-green-800">Criado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600">Taxa Horária</p>
                <p className="font-semibold text-gray-900">
                  €{walkerProfile.hourly_rate}/h
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">Estado</p>
                <p className="font-semibold text-gray-900">
                  {walkerProfile.verification_status}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Trainer Profile Card */}
      {trainerProfile ? (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              🎓 Treinador
              <Badge className="bg-purple-100 text-purple-800">Criado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600">Taxa Horária</p>
                <p className="font-semibold text-gray-900">
                  €{trainerProfile.hourly_rate}/h
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600">Estado</p>
                <p className="font-semibold text-gray-900">
                  {trainerProfile.verification_status}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Create Professional Button */}
      {!walkerProfile && !trainerProfile ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Nenhuma conta profissional criada
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Conta Profissional
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Create Dialog */}
      {showCreateDialog && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle>Criar Conta Profissional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={professionalType} onValueChange={setProfessionalType}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walker">Passeador</SelectItem>
                  <SelectItem value="trainer">Treinador</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nome Profissional</Label>
              <Input
                value={formData.walker_name}
                onChange={(e) =>
                  setFormData({ ...formData, walker_name: e.target.value })
                }
                className="mt-1 h-9"
              />
            </div>

            <div>
              <Label>Localização</Label>
              <Input
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="mt-1 h-9"
              />
            </div>

            <div>
              <Label>Taxa Horária (€)</Label>
              <Input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) =>
                  setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })
                }
                className="mt-1 h-9"
              />
            </div>

            <div>
              <Label>WhatsApp</Label>
              <Input
                value={formData.whatsapp_number}
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp_number: e.target.value })
                }
                className="mt-1 h-9"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreate}
                disabled={createProfessionalMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {createProfessionalMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Criar"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}