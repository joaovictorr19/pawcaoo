import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Upload, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function BadgeUploadManager() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    badge_id: "",
    name: "",
    description: "",
    rarity: "common",
    category: "achievement",
    is_active: true,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ["badgeDefinitions"],
    queryFn: () => base44.entities.BadgeDefinition.filter({ is_active: true }),
    staleTime: 30000,
  });

  const createBadgeMutation = useMutation({
    mutationFn: async (data) => {
      let imageUrl = null;

      if (imageFile) {
        const uploadedFile = await base44.integrations.Core.UploadFile({
          file: imageFile,
        });
        imageUrl = uploadedFile.file_url;
      }

      return base44.entities.BadgeDefinition.create({
        badge_id: data.badge_id.toLowerCase().replace(/\s+/g, "_"),
        name: data.name,
        description: data.description,
        icon: "•",
        image_png_file: imageUrl || "",
        image_url: imageUrl || "",
        rarity: data.rarity,
        category: data.category,
        is_active: data.is_active,
        xp_reward: 0,
        color: "bg-gray-100",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badgeDefinitions"] });
      toast.success("Emblema criado com sucesso!");
      resetForm();
      setShowDialog(false);
    },
    onError: (error) => {
      console.error("Error:", error);
      toast.error("Erro ao criar emblema: " + error.message);
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter menos de 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({
      badge_id: "",
      name: "",
      description: "",
      rarity: "common",
      category: "achievement",
      is_active: true,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = () => {
    if (!formData.badge_id.trim() || !formData.name.trim()) {
      toast.error("Preencha o ID e o nome do emblema");
      return;
    }

    if (!imageFile) {
      toast.error("Selecione uma imagem para o emblema");
      return;
    }

    createBadgeMutation.mutate(formData);
  };

  return (
    <div className="space-y-4">
      <Card className="bg-white shadow-sm border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">Emblemas ({badges.length})</CardTitle>
          <Button
            onClick={() => setShowDialog(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Emblema
          </Button>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Nenhum emblema criado ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-3 border border-gray-200 rounded-lg flex items-center gap-3 hover:bg-gray-50"
                >
                  <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded">
                    {badge.image_png_file || badge.image_url ? (
                      <img
                        src={badge.image_png_file || badge.image_url}
                        alt={badge.name}
                        className="w-7 h-7 object-contain"
                      />
                    ) : (
                      <span className="text-lg">{badge.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">
                      {badge.name}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {badge.rarity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Badge Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Novo Emblema</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label className="text-sm font-semibold">Imagem do Emblema</Label>
              <div className="mt-2 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="badge-image-input"
                />
                <label
                  htmlFor="badge-image-input"
                  className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-contain"
                    />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        Clique para enviar imagem
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG (máx 5MB)</p>
                    </>
                  )}
                </label>
                {imageFile && (
                  <button
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Badge ID */}
            <div>
              <Label htmlFor="badge-id" className="text-sm font-semibold">
                ID Único
              </Label>
              <Input
                id="badge-id"
                value={formData.badge_id}
                onChange={(e) =>
                  setFormData({ ...formData, badge_id: e.target.value })
                }
                placeholder="ex: primeiro_passeio"
                className="mt-1 h-9"
              />
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="badge-name" className="text-sm font-semibold">
                Nome
              </Label>
              <Input
                id="badge-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Primeiro Passeio"
                className="mt-1 h-9"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="badge-desc" className="text-sm font-semibold">
                Descrição
              </Label>
              <Input
                id="badge-desc"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição breve"
                className="mt-1 h-9"
              />
            </div>

            {/* Rarity */}
            <div>
              <Label htmlFor="rarity" className="text-sm font-semibold">
                Raridade
              </Label>
              <Select
                value={formData.rarity}
                onValueChange={(value) =>
                  setFormData({ ...formData, rarity: value })
                }
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Comum</SelectItem>
                  <SelectItem value="rare">Rara</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Lendária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category" className="text-sm font-semibold">
                Categoria
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="milestone">Marco</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="activity">Atividade</SelectItem>
                  <SelectItem value="achievement">Conquista</SelectItem>
                  <SelectItem value="community">Comunidade</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createBadgeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createBadgeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Criar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}