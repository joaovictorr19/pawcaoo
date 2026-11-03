import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";
import { fetchMyAccount } from "@/lib/accountRegime";
import {
  countryMeta,
  effectiveCountry,
  effectiveRegime,
  isReviewPending,
  regimeMeta,
  statusMeta,
} from "@/lib/accountLabels";

/** Estado canónico da conta, igual ao que o admin vê — mostrado no painel da loja. */
export default function StoreAccountStatus() {
  const { data: account } = useQuery({
    queryKey: ["myAccountRegime"],
    queryFn: fetchMyAccount,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (!account) return null;

  const regime = effectiveRegime(account);
  const regimes = regimeMeta(regime);
  const country = countryMeta(effectiveCountry(account));
  const status = statusMeta(account.status);
  const notShop = !!regime && regime !== "shop";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Conta PawCão
        </span>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${regimes?.cls || "bg-slate-100 text-slate-600 border-slate-200"}`}>
          <BadgeCheck className="w-3 h-3" />
          {regimes?.label || regime}
        </span>
        {country && <span className="text-xs font-semibold text-slate-500">{country.label}</span>}
        {status && (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.cls}`}>
            {status.label}
          </span>
        )}
      </div>

      {notShop && (
        <p className="mt-2 text-xs font-semibold text-red-600">
          A tua conta está registada como {regimes?.label || regime}. A loja só fica publicada depois de a equipa PawCão
          resolver o regime da conta.
        </p>
      )}
      {!notShop && isReviewPending(account) && account.review_notes && (
        <p className="mt-2 text-xs text-amber-700">{account.review_notes}</p>
      )}
    </div>
  );
}