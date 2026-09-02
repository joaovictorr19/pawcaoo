import React from "react";

/**
 * Skeleton que replica fielmente o layout do ProfessionalCard
 * (avatar 64px, nome, localização, preço e seta) para evitar salto de layout.
 */
export function ProfessionalCardSkeleton() {
  return (
    <div className="bg-white rounded-[2.5rem] p-4 mb-3 border border-slate-100 shadow-sm flex gap-4 items-center">
      {/* Avatar — mesmas dimensões do card real (w-16 h-16 rounded-2xl) */}
      <div className="relative w-16 h-16 shrink-0 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white">
        <ShimmerOverlay />
      </div>

      {/* Nome + emblemas + localização */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="relative h-3.5 w-1/2 rounded bg-slate-100 overflow-hidden">
            <ShimmerOverlay />
          </div>
          <div className="relative h-3 w-3 rounded-full bg-slate-100 overflow-hidden shrink-0">
            <ShimmerOverlay />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-2.5 w-14 rounded-full bg-slate-100 overflow-hidden">
            <ShimmerOverlay />
          </div>
          <div className="relative h-2.5 w-16 rounded bg-slate-100 overflow-hidden">
            <ShimmerOverlay />
          </div>
        </div>
      </div>

      {/* Preço + seta */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <div className="relative h-3 w-9 rounded bg-slate-100 overflow-hidden">
          <ShimmerOverlay />
        </div>
        <div className="relative h-4 w-4 rounded bg-slate-100 overflow-hidden">
          <ShimmerOverlay />
        </div>
      </div>
    </div>
  );
}

const ShimmerOverlay = () => (
  <div
    className="absolute inset-0 pro-skeleton-shimmer pointer-events-none"
    style={{
      background:
        "linear-gradient(90deg, rgba(226,232,240,0) 0%, rgba(241,245,249,0.9) 50%, rgba(226,232,240,0) 100%)",
      backgroundSize: "200% 100%",
    }}
  />
);

<style>{`
  @keyframes pro-skeleton-sweep {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .pro-skeleton-shimmer {
    animation: pro-skeleton-sweep 1.8s infinite linear;
  }
`}</style>;

export default ProfessionalCardSkeleton;