import React from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, ChevronRight } from "lucide-react";
import {
  countryMeta,
  effectiveCountry,
  effectiveRegime,
  isReviewPending,
  regimeMeta,
  statusMeta,
} from "@/lib/accountLabels";
import { REGIME_HOME } from "@/lib/accountRegime";

/** Mostra o regime atual da conta antes de escolher um novo tipo de adesão. */
export default function AccountRegimeNotice({ account }) {
  const navigate = useNavigate();
  const regime = effectiveRegime(account);
  if (!account || !regime) return null;

  const country = countryMeta(effectiveCountry(account));
  const status = statusMeta(account.status);
  const review = isReviewPending(account);

  return (
    <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-300">
          <BadgeCheck className="w-3.5 h-3.5" /> A tua conta
        </span>
        <span className="text-white font-bold">{regimeMeta(regime)?.label || regime}</span>
        {country && <span className="text-slate-400 text-sm">{country.label}</span>}
        {status && (
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
            {status.label}
          </span>
        )}
      </div>

      {review && account.review_notes && (
        <p className="mt-2 text-xs text-amber-300/90">
          {account.review_notes} A equipa PawCão vai rever a conta.
        </p>
      )}

      {REGIME_HOME[regime] && (
        <button
          onClick={() => navigate(REGIME_HOME[regime])}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-300 hover:text-teal-200"
        >
          Abrir o teu painel <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}