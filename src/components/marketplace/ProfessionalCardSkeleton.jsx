import React from "react";

/**
 * Skeleton que replica fielmente o layout vertical do ProfessionalCard
 * (imagem dominante em cima, conteúdo em baixo) para evitar salto de layout.
 */
export function ProfessionalCardSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] mb-3 border border-slate-100 shadow-sm overflow-hidden flex flex-col">
      {/* Imagem */}
      <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
        <ShimmerOverlay />
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col flex-1 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <div className="relative h-4 w-1/2 rounded bg-slate-100 overflow-hidden">
            <ShimmerOverlay />
          </div>
          <div className="relative h-3 w-3 rounded-full bg-slate-100 overflow-hidden shrink-0">
            <ShimmerOverlay />
          </div>
        </div>
        <div className="relative h-2.5 w-full rounded bg-slate-100 overflow-hidden">
          <ShimmerOverlay />
        </div>
        <div className="relative h-2.5 w-3/4 rounded bg-slate-100 overflow-hidden">
          <ShimmerOverlay />
        </div>
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 mt-auto">
          <div className="relative h-2.5 w-16 rounded bg-slate-100 overflow-hidden">
            <ShimmerOverlay />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="relative h-3.5 w-10 rounded bg-slate-100 overflow-hidden">
              <ShimmerOverlay />
            </div>
            <div className="relative h-4 w-4 rounded bg-slate-100 overflow-hidden">
              <ShimmerOverlay />
            </div>
          </div>
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