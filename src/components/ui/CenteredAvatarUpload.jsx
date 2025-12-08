import React, { useState } from 'react';
import { Upload, Loader2, Camera, User } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function CenteredAvatarUpload({ currentImageUrl, onImageChange, size = "large" }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem é muito grande (Máx 5MB)");
      return;
    }

    setIsUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error("URL não retornada");

      onImageChange(file_url);
      toast.success("Foto carregada com sucesso!");
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Falha ao enviar imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const dimensions = size === "large" ? "w-32 h-32" : "w-24 h-24";
  const iconSize = size === "large" ? "w-12 h-12" : "w-8 h-8";

  return (
    <div className="flex flex-col items-center justify-center w-full mb-6">
      <div className="relative group">
        <div className={`
          ${dimensions} rounded-full border-4 border-white shadow-xl overflow-hidden 
          bg-gray-100 flex items-center justify-center relative
          ${isUploading ? 'opacity-50' : ''}
        `}>
          {currentImageUrl ? (
            <img 
              src={currentImageUrl} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className={`${iconSize} text-gray-400`} />
          )}
          
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        <label className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-full cursor-pointer shadow-lg transition-all transform hover:scale-110 active:scale-95 z-10">
          <Camera className="w-4 h-4" />
          <input 
            type="file" 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </div>
      <p className="mt-3 text-sm text-gray-500 font-medium">
        {isUploading ? "A carregar..." : "Foto de Perfil"}
      </p>
    </div>
  );
}