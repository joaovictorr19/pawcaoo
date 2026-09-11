import React, { useRef, useState, useCallback } from "react";
import { Move, RotateCcw, Check } from "lucide-react";

/**
 * Preview do card (h-48, object-cover) com drag para ajustar object-position.
 * x e y em percentagem (0-100). Default: x=50, y=0 (equivale a object-top + center).
 */
export default function CardPhotoAdjuster({
  imageUrl,
  focusX = 50,
  focusY = 0,
  onChange,
  label = "Ajustar Enquadramento do Card",
}) {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localX, setLocalX] = useState(focusX);
  const [localY, setLocalY] = useState(focusY);
  const dragStart = useRef({ x: 0, y: 0, focusX: 50, focusY: 0 });

  const updateFromPointer = useCallback((clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    // Convert pixels to percentage of container dimensions
    const pctX = dragStart.current.focusX + (dx / rect.width) * 100;
    const pctY = dragStart.current.focusY + (dy / rect.height) * 100;
    const clampedX = Math.max(0, Math.min(100, pctX));
    const clampedY = Math.max(0, Math.min(100, pctY));
    setLocalX(clampedX);
    setLocalY(clampedY);
  }, []);

  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, focusX: localX, focusY: localY };
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    e.stopPropagation();
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    e.target.releasePointerCapture?.(e.pointerId);
    onChange?.(localX, localY);
  };

  const reset = () => {
    setLocalX(50);
    setLocalY(0);
    onChange?.(50, 0);
  };

  const objectPosition = `${localX}% ${localY}%`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Move className="w-4 h-4 text-teal-500" /> {label}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Arraste a foto para enquadrar o rosto no card da home</p>
        </div>
        <button type="button" onClick={reset}
          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
          <RotateCcw className="w-3 h-3" /> Resetar
        </button>
      </div>

      {/* Card preview — same aspect ratio as the home ProfessionalCard (h-48, ~340px wide) */}
      <div
        ref={containerRef}
        className="relative w-full max-w-[340px] mx-auto h-48 overflow-hidden rounded-xl bg-slate-100 cursor-move touch-none select-none"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Preview card"
            className="w-full h-full object-cover pointer-events-none"
            style={{ objectPosition }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            Sem foto — carregue uma foto acima primeiro
          </div>
        )}

        {/* Drag hint overlay */}
        {imageUrl && (
          <div className={"absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs font-medium pointer-events-none flex items-center gap-1.5 transition-opacity " + (dragging ? "opacity-100" : "opacity-70")}>
            <Move className="w-3 h-3" /> Arraste para mover
          </div>
        )}

        {/* Rule-of-thirds guide */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
        </div>
      </div>

      {/* Live status */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Posição: <span className="font-semibold text-slate-600">{Math.round(localX)}% × {Math.round(localY)}%</span>
        </span>
        <span className="text-emerald-600 flex items-center gap-1 font-medium">
          <Check className="w-3 h-3" /> Atualiza ao guardar
        </span>
      </div>
    </div>
  );
}