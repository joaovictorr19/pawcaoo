import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RotateCw, ZoomIn, ZoomOut, Move, RefreshCw, Grid3X3, Check } from "lucide-react";

export default function ImageCropModal({ isOpen, onClose, imageUrl, onSave, aspectRatio = 1 }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Initialize container dimensions on mount to ensure canvas is ready
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updateSize = () => {
        if (containerRef.current) {
          setContainerSize({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight
          });
        }
      };
      
      // Delay slightly to allow modal animation to complete
      const timer = setTimeout(updateSize, 100);
      window.addEventListener('resize', updateSize);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateSize);
      };
    }
  }, [isOpen]);

  // Carregar e desenhar imagem inicial
  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      const img = new Image();
      // Try with crossOrigin anonymous first, but handle fallback
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        imageRef.current = img;
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
        requestAnimationFrame(drawImage);
      };
      
      img.onerror = () => {
        // Fallback: try loading without crossOrigin if it fails (might restrict saving but allows viewing)
        // Or just log error. Usually blob URLs work fine.
        console.warn("Failed to load image with crossOrigin. Retrying without.");
        const retryImg = new Image();
        retryImg.onload = () => {
            imageRef.current = retryImg;
            setZoom(1);
            setRotation(0);
            setPosition({ x: 0, y: 0 });
            requestAnimationFrame(drawImage);
        };
        retryImg.src = imageUrl;
      };

      img.src = imageUrl;
    }
  }, [imageUrl, containerSize]); // Re-init on container resize

  // Redesenhar quando estados mudam
  useEffect(() => {
    if (imageRef.current) {
      requestAnimationFrame(drawImage);
    }
  }, [zoom, rotation, position, aspectRatio, showGrid, containerSize]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    
    // Robust width calculation
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth * 0.9 || 350;
    const size = Math.min(containerWidth, 800); 
    
    if (size === 0) return; // Prevent 0 size canvas

    // Set canvas dimensions
    canvas.width = size;
    canvas.height = size / aspectRatio;

    // Draw checkerboard pattern for transparency
    const patternSize = 20;
    // White background for better visibility
    ctx.fillStyle = "#ffffff"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw checkerboard
    ctx.fillStyle = "#e5e5e5";
    for (let x = 0; x < canvas.width; x += patternSize) {
      for (let y = 0; y < canvas.height; y += patternSize) {
        if ((x / patternSize + y / patternSize) % 2 === 0) {
          ctx.fillRect(x, y, patternSize, patternSize);
        }
      }
    }
    
    // Draw image
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;
    // 'contain' logic: fit image fully visible initially
    const baseScale = Math.min(scaleX, scaleY); 
    
    // If we want 'cover' initially (fill the crop area), we'd use Math.max
    // But 'contain' is safer for user to see full image first.
    // User can zoom in.
    
    const currentScale = baseScale * zoom;

    ctx.scale(currentScale, currentScale);
    
    // Apply position (panning)
    // We want the panning to be 1:1 with mouse movement regardless of zoom/rotation
    // The transformation matrix order matters:
    // 1. Translate to center
    // 2. Rotate
    // 3. Scale
    // 4. Translate by position (adjusted for scale and rotation)
    
    // To make panning intuitive (moving mouse right moves image right on screen),
    // we need to apply the translation relative to the current rotation.
    
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(-rad);
    const sin = Math.sin(-rad);
    
    // Rotate the position vector to match the image's rotation
    const rotX = position.x * cos - position.y * sin;
    const rotY = position.x * sin + position.y * cos;

    ctx.translate(rotX / currentScale, rotY / currentScale);
    
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    // Draw Grid Overlay if enabled
    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      
      // Vertical lines (thirds)
      ctx.beginPath();
      ctx.moveTo(canvas.width / 3, 0);
      ctx.lineTo(canvas.width / 3, canvas.height);
      ctx.moveTo((canvas.width / 3) * 2, 0);
      ctx.lineTo((canvas.width / 3) * 2, canvas.height);
      
      // Horizontal lines (thirds)
      ctx.moveTo(0, canvas.height / 3);
      ctx.lineTo(canvas.width, canvas.height / 3);
      ctx.moveTo(0, (canvas.height / 3) * 2);
      ctx.lineTo(canvas.width, (canvas.height / 3) * 2);
      
      ctx.stroke();
      ctx.restore();
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Redraw without grid for saving
    const wasGridShown = showGrid;
    setShowGrid(false);
    
    // We need a slight delay or force a redraw logic, but drawImage is synchronous enough here
    // Let's modify drawImage to accept a 'noGrid' param or just manually redraw
    const image = imageRef.current;
    if (image) {
      const ctx = canvas.getContext("2d");
      // ... redraw logic duplicate or rely on state update? 
      // State update is async, so manual redraw is safer here
      
      // ---- Manual Redraw for Save (Copy of draw logic without grid) ----
      const size = canvas.width;
      ctx.fillStyle = "#ffffff"; // White background for save just in case
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      const scaleX = canvas.width / image.width;
      const scaleY = canvas.height / image.height;
      const baseScale = Math.min(scaleX, scaleY); 
      const currentScale = baseScale * zoom;
      ctx.scale(currentScale, currentScale);
      
      // Apply same position logic as drawImage
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const rotX = position.x * cos - position.y * sin;
      const rotY = position.x * sin + position.y * cos;
      
      ctx.translate(rotX / currentScale, rotY / currentScale);
      
      ctx.drawImage(image, -image.width / 2, -image.height / 2);
      ctx.restore();
      // ------------------------------------------------------------------

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], "cropped-profile.jpg", { type: "image/jpeg" });
          onSave(croppedFile);
        }
        setShowGrid(wasGridShown); // Restore grid state
      }, "image/jpeg", 0.95); // High quality
    }
  };

  // --- Mouse Events ---
  const handleMouseDown = (e) => {
    e.preventDefault(); 
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

  // --- Touch Events ---
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
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
      <DialogContent className="max-w-xl w-[95vw] p-0 overflow-hidden bg-white rounded-xl">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Ajustar Enquadramento</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowGrid(!showGrid)}
              className={showGrid ? "bg-gray-100" : ""}
              title="Alternar Grade"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-neutral-900 w-full relative group">
          <div 
            ref={containerRef}
            className="w-full flex items-center justify-center cursor-move overflow-hidden touch-none"
            style={{ minHeight: '350px' }}
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
              className="shadow-2xl bg-black"
              style={{ maxWidth: '100%', maxHeight: '60vh' }}
            />
          </div>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-full px-4 py-2 text-white text-xs font-medium pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
            <Move className="w-3 h-3" /> Arraste para mover
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Zoom Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ZoomIn className="w-4 h-4" /> Zoom
              </Label>
              <div className="flex items-center gap-2">
                 <Button 
                   variant="outline" 
                   size="icon" 
                   className="h-6 w-6" 
                   onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                 >
                   <ZoomOut className="w-3 h-3" />
                 </Button>
                 <span className="text-xs text-gray-500 w-8 text-center">{zoom.toFixed(1)}x</span>
                 <Button 
                   variant="outline" 
                   size="icon" 
                   className="h-6 w-6" 
                   onClick={() => setZoom(Math.min(5, zoom + 0.1))}
                 >
                   <ZoomIn className="w-3 h-3" />
                 </Button>
              </div>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(values) => setZoom(values[0])}
              min={0.5} // Allow zooming out more to fit large images
              max={4}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <RotateCw className="w-4 h-4" /> Rotação
              </Label>
              <span className="text-xs text-gray-500">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={(values) => setRotation(values[0])}
              min={-180}
              max={180}
              step={1}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setPosition({ x: 0, y: 0 });
              }}
              className="h-10"
            >
              <RefreshCw className="w-3 h-3 mr-2" />
              Resetar
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 h-10 text-white">
              <Check className="w-4 h-4 mr-2" />
              Confirmar Corte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}