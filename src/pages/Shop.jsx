import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Truck, MapPin, Hotel, Package, PackageOpen, Sparkles, ArrowRight, Store } from "lucide-react";
import ProductPurchaseModal from "@/components/shop/ProductPurchaseModal";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import ShopOffersCarousel from "@/components/shop/ShopOffersCarousel";
import MimosSection from "@/components/shop/MimosSection";
import MimoRedeemModal from "@/components/shop/MimoRedeemModal";

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
  const [selectedMimo, setSelectedMimo] = useState(null);

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
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
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

  // Contagem de produtos por loja (para o indicador "mais N produtos")
  const partnerProductCount = useMemo(() => {
    const map = {};
    for (const p of products) {
      if (p.partner_id) map[p.partner_id] = (map[p.partner_id] || 0) + 1;
    }
    return map;
  }, [products]);

  const handleOpenShop = (e, partnerId) => {
    e.stopPropagation();
    if (partnerId) navigate(`/loja/${partnerId}`);
  };

  const handleOpenProduct = (product) => {
    if (!user) {
      navigate(`/login?from=${encodeURIComponent("/Shop")}`);
      return;
    }
    if ((product.stock_quantity || 0) < 1) return;
    setSelectedProduct(product);
  };

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
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-[11px] font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Vitrine oficial dos parceiros PawCão
          </span>
          <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-slate-900 tracking-tight leading-tight">
            Loja de <span className="text-teal-600">Parceiros</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed">
            Produtos e serviços vendidos pelos mesmos profissionais que cuidam do teu cão — hotéis,
            passeadores, treinadores e tosquiadores verificados.
          </p>
        </div>

        {/* Ofertas relâmpago (banner rotativo) */}
        <ShopOffersCarousel />

        {/* Mimos — petiscos para oferecer ao cão durante a estadia */}
        <MimosSection onOpenMimo={setSelectedMimo} />

        {/* Produtos em destaque (mais vendidos) */}
        <FeaturedProducts onOpenProduct={setSelectedProduct} />

        {/* Filtros */}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-3.5 md:p-4 mb-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procurar na loja..."
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
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-3.5 h-9 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all border ${
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

        {/* Contagem */}
        {!isLoading && (
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            {filtered.length} {filtered.length === 1 ? "artigo" : "artigos"}
          </p>
        )}

        {/* Lista de produtos */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="w-full h-44 bg-slate-200" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">Nenhum artigo encontrado</p>
            <p className="text-sm text-slate-500 mt-1">
              Ajusta os filtros ou volta mais tarde — novos parceiros chegam a toda a hora.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {filtered.map((product) => {
              const delivery = DELIVERY[product.delivery_method] || DELIVERY.pickup;
              const soldOut = (product.stock_quantity || 0) < 1;
              return (
                <button
                  key={product.id}
                  onClick={() => handleOpenProduct(product)}
                  className="group text-left bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(13,148,131,0.12)] hover:ring-1 hover:ring-teal-500/20 transition-all overflow-hidden active:scale-[0.98] flex sm:flex-col"
                >
                  {/* Imagem — compacta à esquerda no telemóvel, em cima no desktop */}
                  <div className="w-28 h-28 sm:w-full sm:h-44 shrink-0 relative overflow-hidden bg-slate-100 rounded-2xl sm:rounded-none">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="w-8 h-8 text-slate-300" />
                    </div>
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    {soldOut ? (
                      <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-slate-900/80 text-white text-[10px] font-bold">
                        Esgotado
                      </span>
                    ) : product.product_type === "service" ? (
                      <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-teal-600 text-white text-[10px] font-bold">
                        Serviço
                      </span>
                    ) : null}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 p-3.5 sm:p-4 flex flex-col">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        onClick={(e) => handleOpenShop(e, product.partner_id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 hover:underline transition-colors"
                      >
                        <Store className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[140px]">{product.partner_name || "Parceiro PawCão"}</span>
                      </button>
                      {(partnerProductCount[product.partner_id] || 0) > 1 && (
                        <button
                          onClick={(e) => handleOpenShop(e, product.partner_id)}
                          className="text-[10px] font-semibold text-slate-400 hover:text-teal-700 transition-colors"
                        >
                          +{partnerProductCount[product.partner_id] - 1} produtos →
                        </button>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 text-sm leading-snug mt-1">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 hidden sm:block">
                      {product.description || "\u00A0"}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t border-slate-100">
                      <span className="text-lg font-black text-teal-700 leading-none">
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
        <div className="mt-10 rounded-3xl p-6 md:p-10 bg-gradient-to-br from-violet-300/80 via-sky-200/80 to-teal-200/80 border border-white/60 backdrop-blur-sm text-center">
          <Sparkles className="w-7 h-7 text-slate-900 mx-auto mb-3" />
          <h2 className="font-heading font-extrabold text-xl md:text-3xl text-slate-900">
            Vende os teus produtos na PawCão
          </h2>
          <p className="text-slate-700/90 text-sm md:text-base mt-2 max-w-xl mx-auto">
            Profissionais verificados têm vitrine pública, pagamentos por cartão ou carteira PawCão
            e o valor cai direto no extrato — com uma comissão justa.
          </p>
          <a
            href={createPageUrl("BecomeProfessional")}
            className="inline-flex items-center gap-2 mt-5 bg-white text-[#1a1a1a] rounded-full px-7 py-3.5 font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            Tornar-me parceiro
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {selectedProduct && (
        <ProductPurchaseModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
      {selectedMimo && (
        <MimoRedeemModal mimo={selectedMimo} onClose={() => setSelectedMimo(null)} />
      )}
    </div>
  );
}