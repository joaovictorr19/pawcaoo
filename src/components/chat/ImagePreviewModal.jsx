import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImagePreviewModal({ imageUrl, isOpen, onClose }) {
  const [zoom, setZoom] = React.useState(1);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "imagem.jpg";
    link.click();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.max(0.5, z - 0.25));
            }}
          >
            <ZoomOut className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.min(3, z + 0.25));
            }}
          >
            <ZoomIn className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
          >
            <Download className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Image */}
        <motion.img
          src={imageUrl}
          alt="Preview"
          className="max-w-[90vw] max-h-[90vh] object-contain"
          style={{ transform: `scale(${zoom})` }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: zoom, opacity: 1 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>
  );
}