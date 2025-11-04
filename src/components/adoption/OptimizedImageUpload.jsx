import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

/**
 * Compresses an image file to ensure it's under maxSizeKB
 * Uses canvas to resize and compress while maintaining aspect ratio
 */
const compressImage = async (file, maxSizeKB = 500, maxWidth = 1920, maxHeight = 1080) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different quality levels to get under maxSizeKB
        let quality = 0.9;
        let blob = null;
        
        const tryCompress = () => {
          canvas.toBlob(
            (newBlob) => {
              const sizeKB = newBlob.size / 1024;
              
              if (sizeKB <= maxSizeKB || quality <= 0.3) {
                // Success or reached minimum quality
                const compressedFile = new File(
                  [newBlob], 
                  file.name.replace(/\.[^/.]+$/, '.jpg'),
                  { type: 'image/jpeg' }
                );
                resolve({
                  file: compressedFile,
                  originalSize: file.size / 1024,
                  compressedSize: newBlob.size / 1024,
                  compressionRatio: ((1 - newBlob.size / file.size) * 100).toFixed(1)
                });
              } else {
                // Try lower quality
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/jpeg',
            quality
          );
        };
        
        tryCompress();
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export default function OptimizedImageUpload({ 
  onImagesChange, 
  currentImages = [], 
  maxImages = 5,
  maxSizeKB = 500,
  showPreview = true 
}) {
  const [images, setImages] = useState(currentImages);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    if (images.length + files.length > maxImages) {
      toast.error(`Máximo ${maxImages} fotos permitidas`);
      return;
    }

    setCompressing(true);
    
    try {
      const compressedResults = [];
      
      for (const file of files) {
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} não é uma imagem`);
          continue;
        }

        // Compress the image
        const result = await compressImage(file, maxSizeKB);
        compressedResults.push(result);
        
        toast.success(
          `${file.name} comprimido: ${result.originalSize.toFixed(0)}KB → ${result.compressedSize.toFixed(0)}KB (${result.compressionRatio}% redução)`,
          { duration: 3000 }
        );
      }

      setCompressing(false);
      setUploading(true);

      // Upload compressed images
      const uploadedUrls = [];
      
      for (const { file } of compressedResults) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }

      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      onImagesChange(newImages);
      
      toast.success(`${uploadedUrls.length} foto(s) carregada(s) com sucesso! 🎉`);
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Erro ao processar imagens');
    } finally {
      setCompressing(false);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
    toast.success('Foto removida');
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {canAddMore && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || compressing}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || compressing}
            className="w-full h-24 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50"
          >
            {compressing ? (
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-purple-600 mx-auto mb-2 animate-spin" />
                <p className="text-sm font-medium text-purple-700">Comprimindo imagens...</p>
                <p className="text-xs text-gray-500">Otimizando para &lt;{maxSizeKB}KB</p>
              </div>
            ) : uploading ? (
              <div className="text-center">
                <Upload className="w-8 h-8 text-purple-600 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-medium text-purple-700">Fazendo upload...</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-purple-700">
                  Adicionar Fotos ({images.length}/{maxImages})
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Clique para selecionar • Otimização automática para {maxSizeKB}KB
                </p>
              </div>
            )}
          </Button>
        </div>
      )}

      {/* Image Previews */}
      {showPreview && images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">
              Fotos Carregadas ({images.length}/{maxImages})
            </p>
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" />
              <span>Otimizadas &lt;{maxSizeKB}KB cada</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {images.map((url, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                  <img
                    src={url}
                    alt={`Pet ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  disabled={uploading || compressing}
                  className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Primary Badge */}
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Dica:</strong> A primeira foto será a imagem principal. 
              Arraste para reordenar após fazer upload de todas.
              Todas as imagens são automaticamente otimizadas para carregamento rápido.
            </span>
          </p>
        </div>
      )}

      {/* Info Box */}
      {images.length === 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">💡 Dicas para Melhores Fotos:</p>
              <ul className="space-y-1 text-xs">
                <li>✓ Use luz natural quando possível</li>
                <li>✓ Mostre o pet de diferentes ângulos</li>
                <li>✓ Capture a personalidade do pet</li>
                <li>✓ Inclua fotos de corpo inteiro e close-ups</li>
                <li>✓ Evite fundos confusos ou escuros</li>
              </ul>
              <p className="mt-2 text-blue-700">
                <strong>Fotos otimizadas = Carregamento rápido = Mais visualizações!</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}