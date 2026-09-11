import React, { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { Flame, Package, Truck, MapPin, Hotel, ChevronRight } from "lucide-react";

const DELIVERY = {
  shipping: { label: "Entrega", icon: Truck },
  pickup: { label: "Recolha", icon: MapPin },
  with_stay: { label: "Com estadia", icon: Hotel },
};

export default function FeaturedProducts({ onOpenProduct }) {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ["shopCurrentUser"],
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // 1. Buscar encomendas pagas para calcular os mais vendidos
  const { data: orders = [] } = useQuery({
    queryKey: ["featuredOrders"],
    queryFn: () =>
      base44.entities.ProductOrder.filter(
        { payment_status: "paid" },
        "-created_date",
        100
      ),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // 2. Agregar quantidade por product_id
  const bestsellerIds = useMemo(() => {
    const counts = {};
    for (const order of orders) {
      for (const item of order.items || []) {
        if (item.product_id) {
          counts[item.product_id] = (counts[item.product_id] || 0) + (item.quantity || 1);
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id]) => id);
  }, [orders]);

  const hasOrders = bestsellerIds.length > 0;

  // 3. Buscar produtos — bestsellers se houver vendas, senão os mais recentes
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["featuredProducts", hasOrders ? "bestsellers" : "recent", bestsellerIds],
    queryFn: async () => {
      if (hasOrders) {
        const results = await Promise.all(
          bestsellerIds.map((id) =>
            base44.entities.PartnerProduct.get(id).catch(() => null)
          )
        );
        return results
          .filter((p) => p && p.is_available && p.moderation_status === "approved")
          .slice(0, 8);
      }
      // Sem vendas — mostrar os mais recentes
      return base44.entities.PartnerProduct.filter(
        { moderation_status: "approved", is_available: true },
        "-created_date",
        8
      );
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  if (!isLoading && products.length === 0) return null;
  const showSkeleton = isLoading && products.length === 0;

  const handleOpen = (product) => {
    if (!user) {
      navigate(`/login?from=${encodeURIComponent("/Shop")}`);
      return;
    }
    if ((product.stock_quantity || 0) < 1) return;
    onOpenProduct?.(product);
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-base md:text-lg text-slate-900 leading-tight">
              {hasOrders ? "Mais Populares" : "Novidades da Loja"}
            </h2>
            <p className="text-[11px] text-slate-400 leading-tight">
              {hasOrders ? "O que os clientes mais compram" : "Os produtos mais recentes"}
            </p>
          </div>
        </div>
      </div>

      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {showSkeleton
          ? [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[180px] md:w-[200px] bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden animate-pulse"
              >
                <div className="w-full h-28 bg-slate-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-200 rounded w-full" />
                  <div className="h-2.5 bg-slate-200 rounded w-2/3" />
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                    <div className="h-4 bg-slate-200 rounded w-10" />
                    <div className="h-4 bg-slate-200 rounded w-14 rounded-full" />
                  </div>
                </div>
              </div>
            ))
          : products.map((product, idx) => {
          const delivery = DELIVERY[product.delivery_method] || DELIVERY.pickup;
          const soldOut = (product.stock_quantity || 0) < 1;
          return (
            <button
              key={product.id}
              onClick={() => handleOpen(product)}
              className="group relative flex-shrink-0 w-[180px] md:w-[200px] text-left bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(13,148,131,0.12)] hover:ring-1 hover:ring-teal-500/20 transition-all overflow-hidden active:scale-[0.98]"
              style={{ scrollSnapAlign: "start" }}
            >
              {hasOrders && (
                <span className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-orange-500 text-white text-[11px] font-black flex items-center justify-center shadow-md">
                  {idx + 1}
                </span>
              )}
              <div className="w-full h-28 relative overflow-hidden bg-slate-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-7 h-7 text-slate-300" />
                </div>
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                {soldOut && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[9px] font-bold">
                    Esgotado
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="font-bold text-slate-900 text-xs leading-snug line-clamp-2">
                  {product.product_name}
                </p>
                <p className="text-[10px] text-teal-700 font-semibold mt-0.5 truncate">
                  {product.partner_name}
                </p>
                <div className="flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-slate-100">
                  <span className="text-sm font-black text-teal-700 leading-none">
                    €{(product.price_euro || 0).toFixed(2)}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-1.5 py-0.5">
                    <delivery.icon className="w-3 h-3 text-teal-600" />
                    {delivery.label}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}