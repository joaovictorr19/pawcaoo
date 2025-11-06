import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, Award, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Componente especializado para upload de imagens de emblemas
 * - Aceita apenas PNG para suportar transparência
 * - Otimiza para 512x512px (tamanho ideal para emblemas)
 * - Comprime para máximo 500KB
 * - Preview com fundo transparente/branco alternado
 */
const compressBadgeImage = async (file, maxSizeKB = 500, targetSize = 512) => {
  return new Promise((resolve, reject) => {
    // Verificar se é PNG
    if (!file.type.includes('png')) {
      reject(new Error('Apenas imagens PNG são aceites para emblemas (suporta transparência)'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Criar canvas com tamanho ideal para emblemas (512x512)
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        
        const ctx = canvas.getContext('2d');
        
        // Preservar transparência
        ctx.clearRect(0, 0, targetSize, targetSize);
        
        // Desenhar imagem centralizada e redimensionada
        const scale = Math.min(targetSize / img.width, targetSize / img.height);
        const x = (targetSize - img.width * scale) / 2;
        const y = (targetSize - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        // Tentar diferentes níveis de qualidade
        let quality = 0.9;
        
        const tryCompress = () => {
          canvas.toBlob(
            (newBlob) => {
              if (!newBlob) {
                reject(new Error('Erro ao processar imagem'));
                return;
              }

              const sizeKB = newBlob.size / 1024;
              
              if (sizeKB <= maxSizeKB || quality <= 0.5) {
                // Sucesso ou qualidade mínima atingida
                const compressedFile = new File(
                  [newBlob], 
                  file.name.replace(/\.[^/.]+$/, '.png'),
                  { type: 'image/png' }
                );
                
                resolve({
                  file: compressedFile,
                  originalSize: file.size / 1024,
                  compressedSize: newBlob.size / 1024,
                  dimensions: `${targetSize}x${targetSize}`,
                  hasTransparency: true
                });
              } else {
                // Tentar qualidade menor
                quality -= 0.1;
                tryCompress();
              }
            },
            'image/png',
            quality
          );
        };
        
        tryCompress();
      };
      
      img.onerror = () => reject(new Error('Falha ao carregar imagem'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Falha ao ler ficheiro'));
    reader.readAsDataURL(file);
  });
};

export default function BadgeImageUpload({ 
  onImageChange, 
  currentImageUrl = null,
  badgeName = "Emblema",
  maxSizeKB = 500,
  targetSize = 512
}) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [showTransparent, setShowTransparent] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Verificar se é PNG
    if (!file.type.includes('png')) {
      toast.error('❌ Apenas imagens PNG são aceites', {
        description: 'PNG suporta transparência, ideal para emblemas'
      });
      return;
    }

    setCompressing(true);
    
    try {
      // Comprimir e otimizar
      const result = await compressBadgeImage(file, maxSizeKB, targetSize);
      
      toast.success(
        `✅ Imagem otimizada: ${result.originalSize.toFixed(0)}KB → ${result.compressedSize.toFixed(0)}KB`,
        { 
          description: `Dimensões: ${result.dimensions}px • Transparência preservada`,
          duration: 3000 
        }
      );

      setCompressing(false);
      setUploading(true);

      // Upload para servidor
      const { file_url } = await base44.integrations.Core.UploadFile({ file: result.file });
      
      setImageUrl(file_url);
      onImageChange(file_url);
      
      toast.success(`🎉 Emblema "${badgeName}" carregado com sucesso!`);
    } catch (error) {
      console.error('Badge upload error:', error);
      toast.error('❌ Erro ao processar emblema', {
        description: error.message
      });
    } finally {
      setCompressing(false);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    onImageChange(null);
    toast.success('Emblema removido');
  };

  return (
    <div className="space-y-4">
      {/* Upload Button ou Preview */}
      {!imageUrl ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || compressing}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || compressing}
            className="w-full h-32 border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50"
          >
            {compressing ? (
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-purple-600 mx-auto mb-3 animate-spin" />
                <p className="text-sm font-medium text-purple-700">Otimizando emblema...</p>
                <p className="text-xs text-gray-500 mt-1">Redimensionando para {targetSize}x{targetSize}px</p>
              </div>
            ) : uploading ? (
              <div className="text-center">
                <Upload className="w-10 h-10 text-purple-600 mx-auto mb-3 animate-bounce" />
                <p className="text-sm font-medium text-purple-700">Fazendo upload...</p>
              </div>
            ) : (
              <div className="text-center">
                <Award className="w-12 h-12 text-purple-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-purple-700 mb-1">
                  Carregar Imagem do Emblema
                </p>
                <p className="text-xs text-gray-600">
                  PNG apenas • {targetSize}x{targetSize}px • Máx {maxSizeKB}KB
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  ✨ Suporta transparência
                </p>
              </div>
            )}
          </Button>
        </div>
      ) : (
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Preview com fundo alternável */}
              <div className="flex-shrink-0">
                <div 
                  className={`w-32 h-32 rounded-2xl border-4 border-purple-300 overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                    showTransparent 
                      ? 'bg-transparent' 
                      : 'bg-white'
                  }`}
                  onClick={() => setShowTransparent(!showTransparent)}
                  style={showTransparent ? {
                    backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                  } : {}}
                >
                  <img
                    src={imageUrl}
                    alt={badgeName}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <p className="text-center text-xs text-gray-600 mt-2">
                  {showTransparent ? '🔲 Fundo xadrez' : '⬜ Fundo branco'}
                </p>
                <p className="text-center text-xs text-gray-500">
                  Clique para alternar
                </p>
              </div>

              {/* Informações */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Emblema Carregado
                    </h4>
                    <p className="text-sm text-gray-600">{badgeName}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveImage}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Otimizado para {targetSize}x{targetSize}px
                  </Badge>
                  <Badge className="bg-blue-600 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Transparência preservada
                  </Badge>
                  <Badge className="bg-purple-600 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    &lt;{maxSizeKB}KB
                  </Badge>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 w-full border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Substituir Imagem
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-2">💡 Dicas para Emblemas Perfeitos:</p>
            <ul className="space-y-1 text-xs">
              <li>✓ <strong>Formato:</strong> Use apenas PNG para preservar transparência</li>
              <li>✓ <strong>Tamanho:</strong> {targetSize}x{targetSize}px (quadrado) é ideal</li>
              <li>✓ <strong>Fundo:</strong> Transparente ou com cor sólida</li>
              <li>✓ <strong>Design:</strong> Simples e reconhecível em tamanhos pequenos</li>
              <li>✓ <strong>Cores:</strong> Use cores vibrantes que se destaquem</li>
              <li>✓ <strong>Detalhes:</strong> Evite detalhes muito finos (podem desaparecer)</li>
            </ul>
            <p className="mt-3 text-blue-700 font-semibold">
              🎨 A imagem será automaticamente otimizada e redimensionada!
            </p>
          </div>
        </div>
      </div>

      {/* Exemplos de Raridade */}
      <div className="bg-gradient-to-r from-gray-900 to-purple-900 rounded-xl p-4 text-white">
        <p className="font-semibold mb-3 text-sm flex items-center gap-2">
          <Award className="w-4 h-4" />
          Recomendações por Raridade:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/10 rounded-lg p-2">
            <p className="font-bold text-gray-300">Common</p>
            <p className="text-gray-400">Cinza/Prata</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="font-bold text-blue-400">Rare</p>
            <p className="text-gray-400">Azul/Ciano</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="font-bold text-purple-400">Epic</p>
            <p className="text-gray-400">Roxo/Rosa</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="font-bold text-yellow-400">Legendary</p>
            <p className="text-gray-400">Dourado/Laranja</p>
          </div>
        </div>
      </div>
    </div>
  );
}