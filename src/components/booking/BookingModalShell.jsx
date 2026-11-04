import React, { useEffect } from "react";

/**
 * Moldura das janelas de reserva.
 *
 * Substitui a gaveta animada por uma superfície branca sólida: sem
 * transparência, sem desfoque e sem transformações no fundo da página.
 * Mobile = folha inferior; desktop = cartão centrado.
 */
export default function BookingModalShell({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[12000] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div
        className="relative w-full md:max-w-lg max-h-[92vh] md:max-h-[88vh] rounded-t-[1.25rem] md:rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-[0_-24px_60px_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: "#ffffff" }}
      >
        {children}
      </div>
    </div>
  );
}