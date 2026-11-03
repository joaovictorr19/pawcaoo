import React from "react";
import { AlertTriangle, Check } from "lucide-react";
import {
  regimeMeta, countryMeta, statusMeta, REVIEW_ACTION_LABELS,
  effectiveRegime, effectiveCountry, isManuallyConfirmed, isReviewPending, isReviewResolved,
} from "@/lib/accountLabels";

const chip = "px-1.5 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap";

/**
 * Consolida regime, país e estado de uma conta num bloco de etiquetas.
 * Mostra o valor confirmado pelo admin quando existe, e separa o caso
 * "por rever" do caso já "revisado". Sem registo mostra "Sem registo".
 */
export default function AccountBadges({ account }) {
  if (!account) {
    return <span className={"bg-slate-50 text-slate-400 border-slate-200 " + chip}>Sem registo</span>;
  }

  const regime = regimeMeta(effectiveRegime(account));
  const country = countryMeta(effectiveCountry(account));
  const status = statusMeta(account.status);
  const manual = isManuallyConfirmed(account);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {regime ? (
        <span className={regime.cls + " " + chip}>{regime.label}</span>
      ) : (
        <span className={"bg-slate-50 text-slate-400 border-slate-200 " + chip}>Regime —</span>
      )}

      {country ? (
        <span className={"bg-slate-50 text-slate-600 border-slate-200 " + chip} title={country.label}>
          {country.short}
        </span>
      ) : (
        <span className={"bg-slate-50 text-slate-400 border-slate-200 " + chip}>País —</span>
      )}

      {status && account.status !== "not_applicable" && (
        <span className={status.cls + " " + chip}>{status.label}</span>
      )}

      {manual && (
        <span
          className={"inline-flex items-center gap-0.5 bg-teal-50 text-teal-700 border-teal-200 " + chip}
          title={"Confirmado manualmente" + (account.reviewed_by ? " por " + account.reviewed_by : "")}
        >
          <Check className="w-2.5 h-2.5" />
          Manual
        </span>
      )}

      {isReviewPending(account) && (
        <span
          className={"inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border-amber-200 " + chip}
          title={account.review_notes || "Caso para revisão"}
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          Rever
        </span>
      )}

      {isReviewResolved(account) && (
        <span
          className={"inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 " + chip}
          title={REVIEW_ACTION_LABELS[account.review_action] || "Caso revisto"}
        >
          <Check className="w-2.5 h-2.5" />
          Revisado
        </span>
      )}
    </div>
  );
}