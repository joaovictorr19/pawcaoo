import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { createPageUrl } from "@/utils";
import PartnerStorePanel from "@/components/shop/PartnerStorePanel";
import PickupConfigSection from "@/components/shop/PickupConfigSection";
import PageLoader from "@/components/ui/PageLoader";
import {
  Store, MapPin, Wallet, BadgeCheck, Clock, XCircle, Plus, ChevronLeft,
} from "lucide-react";

const VERIFICATION = {
  verified: {
    label: "Loja verificada",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: BadgeCheck,
  },
  pending: {
    label: "Em análise",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: Clock,
  },
  requires_documents: {
    label: "Documentos necessários",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: Clock,
  },
  rejected: {
    label: "Rejeitada",
    cls: "bg-red-50 text-red-600 border-red-200",
    Icon: XCircle,
  },
};

export default function StoreDashboard() {
  const navigate = useNavigate();

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: shopProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["myShopProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const profiles = await base44.entities.WalkerProfile.filter({
        user_id: user.id,
        professional_type: "shop",
      });
      return profiles[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  if (loadingUser || loadingProfile) {
    return <PageLoader />;
  }

  if (!user) return null;

  if (!shopProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ainda não tens uma loja</h1>
          <p className="text-sm text-slate-500 mb-6">
            Cria a tua loja em 2 minutos e começa a vender ração, brinquedos e acessórios na Loja PawCão.
          </p>
          <button
            onClick={() => navigate("/ShopOnboarding")}
            className="w-full h-12 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/30"
          >
            Criar a minha loja 🛍️
          </button>
        </div>
      </div>
    );
  }

  const verif = VERIFICATION[shopProfile.verification_status] || VERIFICATION.pending;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-10 space-y-5">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
          aria-label="Voltar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-extrabold text-slate-900">Minha Loja</h1>
      </div>

      {/* Cabeçalho da loja */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-teal-50 flex-shrink-0">
            {shopProfile.photo_url ? (
              <img src={shopProfile.photo_url} className="w-full h-full object-cover" alt="logo" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store className="w-7 h-7 text-teal-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-slate-900 truncate">
                {shopProfile.walker_name}
              </h2>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${verif.cls}`}>
                <verif.Icon className="w-3 h-3" />
                {verif.label}
              </span>
            </div>
            {shopProfile.location && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {shopProfile.location}
              </p>
            )}
          </div>
          <Link
            to="/ShopOnboarding"
            className="flex-shrink-0 h-9 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 text-xs font-bold flex items-center"
          >
            Editar
          </Link>
        </div>
      </div>

      {/* Estados de verificação */}
      {shopProfile.verification_status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-red-700">Loja rejeitada</p>
          <p className="text-xs text-red-600 mt-1">
            {shopProfile.rejection_reason || "Contacta o suporte PawCão para mais detalhes."}
          </p>
        </div>
      )}
      {shopProfile.verification_status !== "verified" && shopProfile.verification_status !== "rejected" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-700">A tua loja está em análise ⏳</p>
          <p className="text-xs text-amber-700/80 mt-1">
            Podes criar produtos já agora — cada produto fica em aprovação e fica visível na Loja depois de a equipa PawCão validar.
          </p>
        </div>
      )}

      {/* Carteira / levantamentos */}
      <Link
        to={createPageUrl("MyWallet")}
        className="flex items-center justify-between bg-white rounded-3xl border border-slate-200 shadow-sm p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Carteira e levantamentos</p>
            <p className="text-xs text-slate-400">Consulta o saldo e pede transferências dos teus ganhos</p>
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-slate-300 rotate-180" />
      </Link>

      {/* Configuração de recolha (morada + horário privados) */}
      <PickupConfigSection shopProfile={shopProfile} />

      {/* Gestão de produtos e encomendas */}
      <PartnerStorePanel
        user={user}
        professionalProfile={shopProfile}
        variant="light"
        autoApprove={false}
      />
    </div>
  );
}