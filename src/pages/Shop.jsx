import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Package, PackageOpen, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import ProductPurchaseModal from "@/components/shop/ProductPurchaseModal";
import ShopProductCard from "@/components/shop/ShopProductCard";
import FeaturedProducts from "@/components/shop/FeaturedProducts";
import ShopOffersCarousel from "@/components/shop/ShopOffersCarousel";
import MimosSection from "@/components/shop/MimosSection";
import MimosHighlightBanner from "@/components/shop/MimosHighlightBanner";
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

export default function Shop() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const { data: products = [], isLoading, isFetching, refetch } = useQuery({
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

  const handleOpenShop = (partnerId) => {
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

        {/* Banner de destaque — mimos grátis PawCão */}
        <MimosHighlightBanner onOpenMimo={setSelectedMimo} />

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

        {/* Contagem + botão atualizar */}
        <div className="flex items-center justify-between mb-3">
          {!isLoading ? (
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {filtered.length} {filtered.length === 1 ? "artigo" : "artigos"}
            </p>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {user && (
              <a
                href={createPageUrl("MyOrders")}
                className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-all active:scale-95"
              >
                <Package className="w-3.5 h-3.5" />
                Encomendas
              </a>
            )}
            <button
              onClick={() => {
                refetch();
                queryClient.invalidateQueries({ queryKey: ["featuredProducts"] });
                queryClient.invalidateQueries({ queryKey: ["featuredOrders"] });
                queryClient.invalidateQueries({ queryKey: ["shopOffers"] });
              }}
              disabled={isFetching}
              title="Atualizar loja"
              className="flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-bold text-slate-500 bg-white border border-slate-200 hover:border-teal-300 hover:text-teal-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "A atualizar..." : "Atualizar"}
            </button>
          </div>
        </div>

        {/* Lista de produtos */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 overflow-hidden animate-pulse">
                <div className="w-full h-56 bg-slate-200" />
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
            {filtered.map((product) => (
              <ShopProductCard
                key={product.id}
                product={product}
                moreCount={Math.max(0, (partnerProductCount[product.partner_id] || 0) - 1)}
                onOpen={handleOpenProduct}
                onOpenShop={handleOpenShop}
              />
            ))}
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