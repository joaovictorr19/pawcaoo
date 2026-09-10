import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Gift, Package, Sparkles } from "lucide-react";

export default function MimosSection({ onOpenMimo }) {
  const { data: mimos = [], isLoading } = useQuery({
    queryKey: ["shopMimos"],
    queryFn: () =>
      base44.entities.PartnerProduct.filter(
        { moderation_status: "approved", is_available: true, delivery_method: "with_stay" },
        "-created_date",
        30
      ),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-teal-600" />
          <h2 className="font-heading font-extrabold text-xl text-slate-900">Mimos</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse h-36" />
          ))}
        </div>
      </div>
    );
  }

  if (mimos.length === 0) return null;

  const freeMimos = mimos.filter((m) => m.is_pawcao_mimo);
  const paidMimos = mimos.filter((m) => !m.is_pawcao_mimo);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-5 h-5 text-teal-600" />
        <h2 className="font-heading font-extrabold text-xl text-slate-900">Mimos</h2>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Oferece um petisco ao teu cão durante a estadia — o hotel entrega e partilha uma foto no diário 🐾
      </p>

      {/* Mimos grátis da PawCão */}
      {freeMimos.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-sm font-bold text-teal-700">Oferta PawCão</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {freeMimos.map((mimo) => (
              <MimoCard key={mimo.id} mimo={mimo} onOpen={() => onOpenMimo(mimo)} />
            ))}
          </div>
        </div>
      )}

      {/* Mimos pagos dos hotéis */}
      {paidMimos.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-sm font-bold text-slate-600">Mimos dos hotéis</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {paidMimos.map((mimo) => (
              <MimoCard key={mimo.id} mimo={mimo} onOpen={() => onOpenMimo(mimo)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MimoCard({ mimo, onOpen }) {
  const isFree = mimo.is_pawcao_mimo;
  const soldOut = (mimo.stock_quantity || 0) < 1;

  return (
    <button
      onClick={onOpen}
      disabled={soldOut}
      className="group text-left bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(13,148,131,0.12)] hover:ring-1 hover:ring-teal-500/20 transition-all overflow-hidden active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="w-full h-24 relative overflow-hidden bg-slate-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="w-6 h-6 text-slate-300" />
        </div>
        {mimo.image_url && (
          <img
            src={mimo.image_url}
            alt={mimo.product_name}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        )}
        {soldOut ? (
          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[9px] font-bold">
            Esgotado
          </span>
        ) : isFree ? (
          <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center gap-0.5">
            <Gift className="w-2.5 h-2.5" /> Grátis
          </span>
        ) : null}
      </div>
      <div className="p-2.5">
        <p className="font-bold text-slate-900 text-xs leading-tight truncate">{mimo.product_name}</p>
        <p className="text-[10px] text-slate-400 truncate">{mimo.partner_name}</p>
        <p className="mt-1 text-sm font-black text-teal-700">
          {isFree ? "Oferta" : `€${(mimo.price_euro || 0).toFixed(2)}`}
        </p>
      </div>
    </button>
  );
}