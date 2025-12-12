import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Upload, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function FinishRideModal({ 
  isOpen, 
  onClose, 
  booking,
  distanceToDestination,
  onConfirm 
}) {
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFarFromDestination = distanceToDestination > 50;

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      setPhoto(file);
      toast.success('✅ Foto carregada!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validações
    if (!photoUrl) {
      toast.error('📸 Foto de entrega é obrigatória!');
      return;
    }

    if (isFarFromDestination && !justification.trim()) {
      toast.error('Por favor, justifique a entrega longe do destino');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        photoUrl,
        forcedFinishReason: isFarFromDestination ? justification : null,
        actualDistance: distanceToDestination
      });
    } catch (error) {
      console.error('Erro ao finalizar:', error);
      toast.error('Erro ao finalizar passeio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {isFarFromDestination ? (
              <>
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                Atenção: Longe do Destino
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                Finalizar Passeio
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Alerta de Distância */}
          {isFarFromDestination && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-bold mb-1">Você está a {Math.round(distanceToDestination)}m do destino</p>
                  <p>Para finalizar longe da casa do cliente, você deve:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Enviar uma foto comprovando a entrega</li>
                    <li>Justificar o motivo da entrega fora do local</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Info do Passeio */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
            <p><strong>Cão:</strong> {booking.dog_name}</p>
            <p><strong>Cliente:</strong> {booking.owner_name}</p>
            <p><strong>Distância Percorrida:</strong> {booking.distance_km || 0} km</p>
          </div>

          {/* Upload de Foto */}
          <div className="space-y-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600" />
              Foto de Entrega <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-gray-600 mb-2">
              Tire uma foto do cão em segurança (pode ser com o cliente ou no local de entrega)
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              {photoUrl ? (
                <div className="space-y-3">
                  <img 
                    src={photoUrl} 
                    alt="Foto de entrega" 
                    className="max-h-48 mx-auto rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPhotoUrl("");
                      setPhoto(null);
                    }}
                  >
                    Trocar Foto
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex flex-col items-center gap-2">
                    {uploading ? (
                      <>
                        <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                        <p className="text-sm text-gray-600">Enviando...</p>
                      </>
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">
                          Tirar Foto / Escolher da Galeria
                        </p>
                        <p className="text-xs text-gray-500">
                          Clique para abrir a câmera ou galeria
                        </p>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Justificativa (Apenas se longe) */}
          {isFarFromDestination && (
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                Justificativa <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Cliente pediu para entregar em outro endereço, encontrei o cliente no parque, etc."
                rows={3}
                className="resize-none"
              />
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || uploading || !photoUrl}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Entrega
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}