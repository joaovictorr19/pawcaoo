import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function BasicInfoSection({ user, userProfile }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    city: user.city || "",
    phone: user.phone || "",
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.entities.User.update(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("Utilizador atualizado!");
      setIsEditing(false);
    },
    onError: (error) => toast.error("Erro: " + error.message),
  });

  const handleSave = () => {
    if (!formData.full_name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    updateUserMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Informações Básicas</CardTitle>
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
                <Label>Nome Completo</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="mt-1 h-9"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateUserMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  {updateUserMutation.isPending ? (
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
                      full_name: user.full_name || "",
                      city: user.city || "",
                      phone: user.phone || "",
                    });
                  }}
                  className="gap-2"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Nome
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {user.full_name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Email
                </p>
                <code className="text-sm bg-white px-2 py-1 rounded border border-gray-200 text-gray-700 font-mono">
                  {user.email}
                </code>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Cidade
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {user.city || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Telefone
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {user.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Tipo
                </p>
                <div className="mt-1">
                  {user.role === "admin" ? (
                    <Badge className="bg-red-100 text-red-800 font-semibold">
                      👑 Admin
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 font-semibold">
                      👤 Utilizador
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Registado
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {new Date(user.created_date).toLocaleDateString("pt-PT")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}