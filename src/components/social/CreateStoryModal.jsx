import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function CreateStoryModal({ isOpen, onClose, currentUser, onSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("photo");
  const [caption, setCaption] = useState("");
  const [dogName, setDogName] = useState("");

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    if (isVideo && file.size > 50 * 1024 * 1024) {
      toast.error("Vídeo muito grande! Máximo 50MB");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMediaUrl(file_url);
      setMediaType(isVideo ? 'video' : 'photo');
      toast.success("Mídia carregada!");
    } catch (error) {
      toast.error("Erro ao carregar mídia");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateStory = async () => {
    if (!mediaUrl) {
      toast.error("Adicione uma foto ou vídeo!");
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await base44.entities.SocialStory.create({
        author_email: currentUser.email,
        author_name: currentUser.full_name,
        author_photo_url: currentUser.profile_photo_url,
        dog_name: dogName,
        media_url: mediaUrl,
        media_type: mediaType,
        caption: caption,
        expires_at: expiresAt.toISOString(),
        is_active: true
      });

      toast.success("Story publicado! 🎉");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Erro ao publicar story");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-purple-600" />
            Criar Novo Story
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Upload */}
          <div>
            <Label>Foto ou Vídeo *</Label>
            <label className="cursor-pointer block mt-2">
              <div className="border-2 border-dashed border-purple-300 rounded-2xl p-8 hover:bg-purple-50 transition-colors">
                {mediaUrl ? (
                  <div className="relative">
                    {mediaType === 'photo' ? (
                      <img src={mediaUrl} className="w-full h-64 object-cover rounded-xl" alt="Story" />
                    ) : (
                      <video src={mediaUrl} className="w-full h-64 object-cover rounded-xl" controls />
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-purple-700">
                      {uploading ? "Carregando..." : "Clique para carregar"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Foto ou vídeo (máx 50MB)
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleMediaUpload}
                disabled={uploading}
              />
            </label>
          </div>

          {/* Caption */}
          <div>
            <Label>Legenda (opcional)</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Adicione uma legenda..."
              className="mt-2"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              {caption.length}/100 caracteres
            </p>
          </div>

          {/* Dog Name */}
          <div>
            <Label>Nome do Pet (opcional)</Label>
            <Input
              value={dogName}
              onChange={(e) => setDogName(e.target.value)}
              placeholder="Nome do seu pet..."
              className="mt-2"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateStory}
              disabled={!mediaUrl || uploading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              Publicar Story
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            ⏱️ Stories desaparecem após 24 horas
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}