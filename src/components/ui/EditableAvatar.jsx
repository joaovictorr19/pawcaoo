import React, { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export function EditableAvatar({ url, onUpload, isPending, disabled = false }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (disabled) return;

    setUploading(true);
    const toastId = toast.loading("Fazendo upload da nova foto...");
    
    try {
      // Ler arquivo como base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result;
          const { file_url } = await base44.integrations.Core.UploadFile({ file: base64Data });
          toast.success("Upload concluído!", { id: toastId });
          onUpload(file_url);
        } catch (err) {
          console.error("Upload failed", err);
          toast.error("Falha ao fazer upload da imagem.", { id: toastId });
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        toast.error("Erro ao ler arquivo.", { id: toastId });
        setUploading(false);
      };
    } catch (error) {
      console.error(error);
      toast.error("Erro no processamento.", { id: toastId });
      setUploading(false);
    }
  };

  const showLoading = isPending || uploading;

  return (
    <div className={`relative group ${disabled ? '' : 'cursor-pointer'}`}>
      <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl overflow-hidden border-4 border-white shadow-xl ring-4 ring-purple-100 bg-gray-100">
        {showLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-white">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <img 
            src={url || 'https://ui-avatars.com/api/?name=User&background=random'} 
            className="w-full h-full object-cover object-center" 
            alt="Avatar" 
          />
        )}
      </div>

      {!disabled && !showLoading && (
        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer">
          <Camera className="w-8 h-8 text-white" />
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </label>
      )}
    </div>
  );
}