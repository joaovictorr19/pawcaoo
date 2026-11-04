import React from "react";
import { CheckCircle2, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAwardDate, isPrizeRedeemed } from "@/lib/prizeAwards";

/** Vencedor e estado de entrega de um prémio (disponível / entregue). */
export default function PrizeAwardStatus({
  winnerEmail,
  winnerName,
  redeemedAt,
  isBusy = false,
  onRedeem,
  onClear,
}) {
  const redeemed = isPrizeRedeemed({ redeemed_at: redeemedAt });
  const hasWinner = !!String(winnerEmail || "").trim();

  return (
    <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Vencedor</p>

      {hasWinner ? (
        <p className="break-all text-sm font-bold text-slate-900">
          {winnerName?.trim() || winnerEmail}
        </p>
      ) : (
        <p className="text-sm text-slate-400">Ainda sem vencedor</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            redeemed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {redeemed ? <CheckCircle2 className="h-3 w-3" /> : <Gift className="h-3 w-3" />}
          {redeemed ? `Prémio entregue · ${formatAwardDate(redeemedAt)}` : "Prémio disponível"}
        </span>

        {!redeemed && hasWinner && (
          <Button
            type="button"
            onClick={onRedeem}
            disabled={isBusy}
            className="h-auto min-h-0 gap-1 rounded-full bg-teal-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-teal-700"
          >
            {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
            Registar entrega
          </Button>
        )}

        {redeemed && (
          <button
            type="button"
            onClick={onClear}
            disabled={isBusy}
            className="h-auto min-h-0 rounded-full px-1 py-0 text-[11px] font-semibold text-slate-500 underline hover:text-slate-700"
          >
            Anular entrega
          </button>
        )}
      </div>

      {!redeemed && hasWinner && (
        <p className="text-[10px] leading-snug text-slate-400">
          Cada prémio só pode ser entregue uma vez.
        </p>
      )}
    </div>
  );
}