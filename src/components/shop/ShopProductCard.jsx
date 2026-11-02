import React from "react";
import { Package, Truck, MapPin, Hotel, Store, ShoppingBag } from "lucide-react";
import ShopPrice from "@/components/shop/ShopPrice";

const DELIVERY = {
  shipping: { label: "Entrega", icon: Truck },
  pickup: { label: "Recolha", icon: MapPin },
  with_stay: { label: "Com estadia", icon: Hotel },
};

export default function ShopProductCard({ product, moreCount = 0, onOpen, onOpenShop }) {
  const delivery = DELIVERY[product.delivery_method] || DELIVERY.pickup;
  const stock = product.stock_quantity || 0;
  const soldOut = stock < 1;
  const lowStock = !soldOut && stock <= 3;

  const open = () => !soldOut && onOpen(product);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className={`group text-left bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(13,148,131,0.12)] hover:ring-1 hover:ring-teal-500/20 transition-all overflow-hidden active:scale-[0.99] flex sm:flex-col outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
        soldOut ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {/* Imagem — compacta à esquerda no telemóvel, em cima no desktop */}
      <div className="w-28 min-h-[128px] self-stretch sm:w-full sm:h-52 shrink-0 relative overflow-hidden bg-slate-100 rounded-2xl sm:rounded-none p-2 sm:p-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <Package className="w-8 h-8 text-slate-300" />
        </div>
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.product_name}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className={`relative w-full h-full object-contain sm:object-cover transition-transform duration-500 ${
              soldOut ? "opacity-60" : "group-hover:scale-105"
            }`}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none hidden sm:block" />
        {soldOut && (
          <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold">
            Esgotado
          </span>
        )}
        {!soldOut && product.product_type === "service" && (
          <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-teal-600 text-white text-[10px] font-bold">
            Serviço
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenShop(product.partner_id);
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline transition-colors"
          >
            <Store className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-[150px]">
              {product.partner_name || "Parceiro PawCão"}
            </span>
          </button>
          {moreCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenShop(product.partner_id);
              }}
              className="text-[10px] font-semibold text-slate-400 hover:text-teal-700 transition-colors"
            >
              +{moreCount} artigos
            </button>
          )}
        </div>

        <p className="font-bold text-slate-900 text-[13px] sm:text-sm leading-snug mt-1 line-clamp-3 sm:line-clamp-2">
          {product.product_name}
        </p>
        <p className="hidden sm:block text-xs text-slate-500 mt-1 line-clamp-2">
          {product.description || "\u00A0"}
        </p>

        {/* Preço */}
        <div className="flex items-baseline gap-1.5 mt-1.5 sm:mt-2">
          <ShopPrice product={product} size="md" />
          {product.product_type === "service" && (
            <span className="text-[10px] font-semibold text-slate-400">por serviço</span>
          )}
        </div>

        {/* Entrega e stock */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-2 py-0.5">
            <delivery.icon className="w-3 h-3 text-teal-600" />
            {delivery.label}
          </span>
          {lowStock && (
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
              Últimas {stock} un.
            </span>
          )}
        </div>

        {/* Ação */}
        <button
          type="button"
          disabled={soldOut}
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className={`mt-3 w-full h-9 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            soldOut
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-teal-700 text-white hover:bg-teal-800 shadow-sm active:scale-[0.98]"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {soldOut ? "Indisponível" : "Comprar"}
        </button>
      </div>
    </div>
  );
}