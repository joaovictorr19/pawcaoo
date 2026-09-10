import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Gift, Sparkles, ChevronRight } from "lucide-react";

/**
 * Banner de destaque no topo da Loja mostrando mimos grátis da PawCão.
 * Estilo "Soft Gradient Horizon" com glassmorphism.
 */
export default function MimosHighlightBanner({ onOpenMimo }) {
  const { data: mimos = [] } = useQuery({
    queryKey: ["shopMimosHighlight"],
    queryFn: () =>
      base44.entities.PartnerProduct.filter(
        {
          is_pawcao_mimo: true,
          is_available: true,
          moderation_status: "approved",
        },
        "-created_date",
        10
      ),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Mimos com stock > 0 (ou ilimitado)
  const available = mimos.filter((m) => (m.stock_quantity || 0) >= 1);

  if (available.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/40 backdrop-blur-md shadow-[0_8px_32px_rgba(13,148,131,0.12)]">
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #c7d2fe 0%, #bae6fd 40%, #99f6e4 100%)",
          }}
        />
        <div className="absolute inset-0 bg-white/20" />

        <div className="relative p-5 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-white/70 shadow-sm">
              <Gift className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg md:text-xl text-slate-900 flex items-center gap-1.5">
                Mimos grátis PawCão
                <Sparkles className="w-4 h-4 text-teal-600" />
              </h2>
              <p className="text-xs text-slate-700/80">
                Oferece um petisco ao teu cão — o hotel entrega durante a estadia 🐾
              </p>
            </div>
          </div>

          {/* Horizontal scroll of mimos */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
            {available.map((mimo) => (
              <button
                key={mimo.id}
                onClick={() => onOpenMimo(mimo)}
                className="group snap-start shrink-0 w-36 text-left active:scale-[0.97] transition-transform"
              >
                <div className="relative w-full h-24 rounded-2xl overflow-hidden bg-white/50 shadow-sm">
                  {mimo.image_url ? (
                    <img
                      src={mimo.image_url}
                      alt={mimo.product_name}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-6 h-6 text-teal-400" />
                    </div>
                  )}
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center gap-0.5">
                    <Gift className="w-2.5 h-2.5" /> Grátis
                  </span>
                </div>
                <p className="font-bold text-slate-900 text-xs leading-tight mt-1.5 truncate">
                  {mimo.product_name}
                </p>
                <p className="text-[10px] text-slate-600/70 flex items-center gap-0.5 mt-0.5">
                  Resgatar <ChevronRight className="w-2.5 h-2.5" />
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}