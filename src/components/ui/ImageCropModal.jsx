import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RotateCw, ZoomIn, ZoomOut, Move } from "lucide-react";

export default function ImageCropModal({ isOpen, onClose, imageUrl, onSave, aspectRatio = 1 }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      const croppedFile = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
      onSave(croppedFile);
    }, "image/jpeg", 0.9);
  };

  const drawImage = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    const size = 400;
    canvas.width = size;
    canvas.height = size / aspectRatio;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.translate(position.x, position.y);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();
  };

  React.useEffect(() => {
    if (imageUrl && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        drawImage();
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  React.useEffect(() => {
    drawImage();
  }, [zoom, rotation, position]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajustar Imagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div 
            className="relative bg-gray-100 rounded-lg overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-auto border-2 border-gray-300"
            />
            <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-gray-600 flex items-center gap-1">
              <Move className="w-3 h-3" />
              Arraste para posicionar
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4" />
                Zoom: {zoom.toFixed(1)}x
              </Label>
              <Slider
                value={[zoom]}
                onValueChange={(values) => setZoom(values[0])}
                min={0.5}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RotateCw className="w-4 h-4" />
                Rotação: {rotation}°
              </Label>
              <Slider
                value={[rotation]}
                onValueChange={(values) => setRotation(values[0])}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setZoom(1);
                  setRotation(0);
                  setPosition({ x: 0, y: 0 });
                }}
                className="flex-1"
              >
                Resetar
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Salvar Imagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}