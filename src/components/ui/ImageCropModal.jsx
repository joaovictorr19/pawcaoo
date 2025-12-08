import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RotateCw, ZoomIn, Move, RefreshCw } from "lucide-react";

export default function ImageCropModal({ isOpen, onClose, imageUrl, onSave, aspectRatio = 1 }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Carregar e desenhar imagem inicial
  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        // Reset state on new image
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
        drawImage();
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  // Redesenhar quando estados mudam
  useEffect(() => {
    if (imageRef.current) {
      drawImage();
    }
  }, [zoom, rotation, position, aspectRatio]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    
    // Define canvas size based on container or fixed max width
    const containerWidth = containerRef.current?.clientWidth || 400;
    const size = Math.min(containerWidth, 500); // Max width 500px
    
    // Set canvas dimensions
    canvas.width = size;
    canvas.height = size / aspectRatio;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Save context state
    ctx.save();
    
    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Calculate base scale to fit image in canvas ("contain")
    // We want the image to cover the canvas initially if possible, or contain
    // Let's use "cover" logic so no white space initially, but allow zoom out
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;
    // Use max to cover, min to contain. Let's start with a scale that fits nicely.
    // Base scale ensures image is visible.
    const baseScale = Math.min(scaleX, scaleY) * 0.8; // 80% fit initially to allow context

    // Apply zoom and base scale
    // Multiplicamos o zoom pelo baseScale para que zoom=1 seja "ajustado"
    // Mas para crop, geralmente queremos que o usuário dê zoom in.
    // Vamos fazer um "cover" scale se o usuário quiser preencher tudo.
    
    // Better approach: 
    // Calculate scale to maintain aspect ratio and fit/cover based on zoom
    const currentScale = baseScale * zoom;

    ctx.scale(currentScale, currentScale);
    
    // Apply translation (pan)
    // Need to adjust position logic because of scale/rotation
    // Position is in screen pixels, need to divide by scale to move image correctly relative to view
    ctx.translate(position.x / currentScale, position.y / currentScale);
    
    // Draw image centered
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    
    ctx.restore();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        // Create a new file from the blob
        const croppedFile = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
        onSave(croppedFile);
      }
    }, "image/jpeg", 0.9);
  };

  // --- Mouse Events ---
  const handleMouseDown = (e) => {
    e.preventDefault(); // Prevent text selection
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- Touch Events (Mobile) ---
  const handleTouchStart = (e) => {
    // e.preventDefault(); // Sometimes prevents scrolling, be careful
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    // Prevent scrolling while dragging image
    if (e.cancelable) e.preventDefault(); 
    
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl w-[95vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Ajustar Imagem</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div 
            ref={containerRef}
            className="relative bg-neutral-900 rounded-lg overflow-hidden cursor-move touch-none flex items-center justify-center"
            style={{ minHeight: '300px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto shadow-2xl"
            />
            
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white flex items-center gap-2 pointer-events-none border border-white/10">
              <Move className="w-3 h-3" />
              <span>Arraste para mover</span>
            </div>
          </div>

          <div className="space-y-5 px-1">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <ZoomIn className="w-4 h-4 text-gray-500" />
                  Zoom
                </Label>
                <span className="text-xs text-gray-500">{zoom.toFixed(1)}x</span>
              </div>
              <Slider
                value={[zoom]}
                onValueChange={(values) => setZoom(values[0])}
                min={0.1}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <RotateCw className="w-4 h-4 text-gray-500" />
                  Rotação
                </Label>
                <span className="text-xs text-gray-500">{rotation}°</span>
              </div>
              <Slider
                value={[rotation]}
                onValueChange={(values) => setRotation(values[0])}
                min={0}
                max={360}
                step={90}
                className="w-full"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setPosition({ x: 0, y: 0 });
              }}
              className="w-full"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Resetar Posição
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-white">
            Salvar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}