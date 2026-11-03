import React from "react";
import { AlertTriangle } from "lucide-react";
import { regimeMeta, countryMeta, statusMeta, REVIEW_LABELS } from "@/lib/accountLabels";

const chip = "px-1.5 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap";

/**
 * Consolida regime, país e estado de uma conta num bloco de etiquetas.
 * Sem registo sincronizado mostra "Sem registo" em vez de adivinhar (PRD fluxo 4).
 */
export default function AccountBadges({ account }) {
  if (!account) {
    return <span className={"bg-slate-50 text-slate-400 border-slate-200 " + chip}>Sem registo</span>;
  }

  const regime = regimeMeta(account.regime);
  const country = countryMeta(account.country);
  const status = statusMeta(account.status);
  const review = REVIEW_LABELS[account.review_state];

  return (
    <div className="flex flex-wrap items-center gap-1">
      {regime ? (
        <span className={regime.cls + " " + chip}>{regime.label}</span>
      ) : (
        <span className={"bg-slate-50 text-slate-400 border-slate-200 " + chip}>Regime —</span>
      )}

      {country ? (
        <span
          className={"bg-slate-50 text-slate-600 border-slate-200 " + chip}
          title={country.label}
        >
          {country.short}
        </span>
      ) : (
        <span className={"bg-slate-50 text-slate-400 border-slate-200 " + chip}>País —</span>
      )}

      {status && account.status !== "not_applicable" && (
        <span className={status.cls + " " + chip}>{status.label}</span>
      )}

      {review && (
        <span
          className={"inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border-amber-200 " + chip}
          title={account.review_notes || review}
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          Rever
        </span>
      )}
    </div>
  );
}