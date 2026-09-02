import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Truck, MapPin, Hotel, Package, PackageOpen, Sparkles, ArrowRight } from "lucide-react";
import ProductPurchaseModal from "@/components/shop/ProductPurchaseModal";

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "food", label: "Alimentação" },
  { id: "toys", label: "Brinquedos" },
  { id: "accessories", label: "Acessórios" },
  { id: "grooming", label: "Tosquia & Cuidados" },
  { id: "health", label: "Saúde" },
  { id: "training", label: "Treino" },
  { id: "other", label: "Outros" },
];

const DELIVERY = {
  shipping: { label: "Entrega", icon: Truck },
  pickup: { label: "Recolha", icon: MapPin },
  with_stay: { label: "Com estadia", icon: Hotel },
};

export default function Shop() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["shopCurrentUser"],
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shopProducts"],
    queryFn: () =>
      base44.entities.PartnerProduct.filter(
        { moderation_status: "approved", is_available: true },
        "-created_date",
        60
      ),
    initialData: [],
  });

  const locations = useMemo(
    () => [...new Set(products.map((p) => p.partner_location).filter(Boolean))].sort(),
    [products]
  );

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (category !== "all" && p.category !== category) return false;
        if (location !== "all" && p.partner_location !== location) return false;
        if (search) {
          const haystack = `${p.product_name} ${p.description || ""} ${p.partner_name || ""}`.toLowerCase();
          if (!haystack.includes(search.toLowerCase())) return false;
        }
        return true;
      }),
    [products, category, location, search]
  );

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Loja de Parceiros | PawCão</title>
        <meta
          name="description"
          content="Produtos e serviços avulsos dos profissionais PawCão verificados — ração, brinquedos, acessórios e mais. Entrega, recolha ou na sua próxima estadia."
        />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-12">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-slate-900 tracking-tight">
            Loja de <span className="text-teal-600">Parceiros</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base mt-2 max-w-2xl">
            Produtos e serviços vendidos diretamente pelos profissionais verificados da PawCão —
            hotéis, passeadores, treinadores e tosquiadores que já cuidam do teu cão.
          </p>
        </div>

        {/* Filtros */}
        <div className="space-y-3 mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procurar produtos, serviços ou parceiros..."
                className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
              />
            </div>
            {locations.length > 0 && (
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 px-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="all">Todas as localizações</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 h-9 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                  category === cat.id
                    ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20"
                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grelha de produtos */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-slate-200" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">Nenhum produto encontrado</p>
            <p className="text-sm text-slate-500 mt-1">
              Ajusta os filtros ou volta mais tarde — novos parceiros chegam a toda a hora.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((product) => {
              const delivery = DELIVERY[product.delivery_method] || DELIVERY.pickup;
              const soldOut = (product.stock_quantity || 0) < 1;
              return (
                <button
                  key={product.id}
                  onClick={() => {
                    if (!user) {
                      navigate(`/login?from=${encodeURIComponent("/Shop")}`);
                      return;
                    }
                    if (!soldOut) setSelectedProduct(product);
                  }}
                  className="group text-left bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(13,148,131,0.12)] hover:ring-1 hover:ring-teal-500/20 transition-all overflow-hidden active:scale-[0.98]"
                >
                  <div className="w-full h-48 bg-slate-100 relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                    {soldOut && (
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-900/80 text-white text-[11px] font-bold">
                        Esgotado
                      </span>
                    )}
                    {product.product_type === "service" && !soldOut && (
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-teal-600 text-white text-[11px] font-bold">
                        Serviço
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {product.partner_name}
                      {product.partner_location ? ` · ${product.partner_location}` : ""}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[2rem]">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-lg font-black text-teal-700">
                        €{(product.price_euro || 0).toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-full px-2.5 py-1">
                        <delivery.icon className="w-3.5 h-3.5 text-teal-600" />
                        {delivery.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* CTA para profissionais */}
        <div className="mt-12 rounded-3xl p-8 md:p-10 bg-gradient-to-br from-violet-300/80 via-sky-200/80 to-teal-200/80 border border-white/60 backdrop-blur-sm text-center">
          <Sparkles className="w-8 h-8 text-slate-900 mx-auto mb-3" />
          <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900">
            Vende os teus produtos na PawCão
          </h2>
          <p className="text-slate-700/90 text-sm md:text-base mt-2 max-w-xl mx-auto">
            Profissionais verificados têm vitrine pública, pagamentos por cartão ou carteira PawCão
            e o valor cai direto no extrato — com uma comissão justa.
          </p>
          <a
            href={createPageUrl("BecomeProfessional")}
            className="inline-flex items-center gap-2 mt-6 bg-white text-[#1a1a1a] rounded-full px-7 py-3.5 font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Tornar-me parceiro
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {selectedProduct && (
        <ProductPurchaseModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}