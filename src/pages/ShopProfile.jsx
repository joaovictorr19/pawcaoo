import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { getCurrentUser } from "@/utils/getCurrentUser";
import ProductPurchaseModal from "@/components/shop/ProductPurchaseModal";
import ShopPrice from "@/components/shop/ShopPrice";
import PageLoader from "@/components/ui/PageLoader";
import {
  Store, MapPin, BadgeCheck, Clock, ChevronLeft, Package, PackageOpen,
  Truck, Hotel, ArrowRight, Sparkles,
} from "lucide-react";

const DELIVERY = {
  shipping: { label: "Entrega", icon: Truck },
  pickup: { label: "Recolha", icon: MapPin },
  with_stay: { label: "Com estadia", icon: Hotel },
};

const TYPE_LABEL = {
  shop: "Loja",
  hotel: "Hotel",
  walker: "Profissional",
  trainer: "Treinador",
  both: "Profissional",
};

const VERIF = {
  verified: { label: "Verificado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: BadgeCheck },
  pending: { label: "Em análise", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
  requires_documents: { label: "Em análise", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Clock },
  rejected: { label: "Rejeitado", cls: "bg-red-50 text-red-600 border-red-200", Icon: Clock },
};

export default function ShopProfile() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["shopCurrentUser"],
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: shop, isLoading: loadingShop } = useQuery({
    queryKey: ["shopProfile", profileId],
    queryFn: () => base44.entities.WalkerProfile.get(profileId),
    enabled: !!profileId,
    retry: 1,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["shopProductsByPartner", profileId],
    queryFn: () =>
      base44.entities.PartnerProduct.filter(
        { partner_id: profileId, moderation_status: "approved", is_available: true },
        "-created_date",
        60
      ),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  if (loadingShop) return <PageLoader />;

  if (!shop) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <PackageOpen className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Perfil não encontrado</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">Este perfil pode ter sido removido ou não está disponível.</p>
        <Link to={createPageUrl("Shop")} className="inline-flex items-center gap-2 text-sm font-bold text-teal-600">
          <ChevronLeft className="w-4 h-4" /> Voltar à Loja
        </Link>
      </div>
    );
  }

  const verif = VERIF[shop.verification_status] || VERIF.pending;
  const typeLabel = TYPE_LABEL[shop.professional_type] || "Parceiro";

  const handleOpenProduct = (product) => {
    if (!user) {
      navigate(`/login?from=${encodeURIComponent(`/loja/${profileId}`)}`);
      return;
    }
    if ((product.stock_quantity || 0) < 1) return;
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{shop.walker_name || typeLabel} | Loja PawCão</title>
        <meta name="description" content={shop.bio ? shop.bio.slice(0, 150) : `Produtos de ${shop.walker_name} na Loja PawCão.`} />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-12">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Cabeçalho do parceiro */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 md:p-7 mb-6">
          <div className="flex items-start gap-4 md:gap-5">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-teal-50 flex-shrink-0">
              {shop.photo_url ? (
                <img src={shop.photo_url} alt={shop.walker_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {shop.professional_type === "hotel" ? (
                    <Hotel className="w-9 h-9 text-teal-400" />
                  ) : (
                    <Store className="w-9 h-9 text-teal-400" />
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight">
                  {shop.walker_name}
                </h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${verif.cls}`}>
                  <verif.Icon className="w-3 h-3" />
                  {verif.label}
                </span>
              </div>
              {shop.location && (
                <p className="text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {shop.location}
                </p>
              )}
              {shop.bio && (
                <p className="text-sm text-slate-600 mt-3 leading-relaxed line-clamp-3">{shop.bio}</p>
              )}
              {!loadingProducts && (
                <p className="text-xs font-semibold text-teal-700 mt-3">
                  {typeLabel} · {products.length} {products.length === 1 ? "artigo disponível" : "artigos disponíveis"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Produtos */}
        {loadingProducts ? (
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
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <PackageOpen className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">Sem artigos disponíveis</p>
            <p className="text-sm text-slate-500 mt-1">Esta loja ainda não tem produtos à venda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {products.map((product) => {
              const delivery = DELIVERY[product.delivery_method] || DELIVERY.pickup;
              const soldOut = (product.stock_quantity || 0) < 1;
              return (
                <button
                  key={product.id}
                  onClick={() => handleOpenProduct(product)}
                  className="group text-left bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(13,148,131,0.12)] hover:ring-1 hover:ring-teal-500/20 transition-all overflow-hidden active:scale-[0.98] flex sm:flex-col"
                >
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
                  <div className="flex-1 min-w-0 p-3.5 sm:p-4 flex flex-col">
                    <p className="font-bold text-slate-900 text-sm leading-snug">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 hidden sm:block">
                      {product.description || "\u00A0"}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t border-slate-100">
                      <ShopPrice product={product} size="md" />
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

        {/* Voltar à vitrine */}
        <div className="mt-10 text-center">
          <Link
            to={createPageUrl("Shop")}
            className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700"
          >
            Ver todas as lojas na vitrine PawCão
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {selectedProduct && (
        <ProductPurchaseModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}