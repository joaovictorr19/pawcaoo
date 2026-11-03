import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccountBadges from "./AccountBadges";
import AccountResolveModal from "./AccountResolveModal";
import { isReviewPending, isReviewResolved, REVIEW_LABELS } from "@/lib/accountLabels";

/**
 * Fila de casos do registo de contas que exigem decisão administrativa.
 * Mostra primeiro o que está por rever; os casos já decididos contam-se à parte.
 */
export default function AccountReviewPanel({ accounts = [], onResolved }) {
  const [selected, setSelected] = useState(null);

  const pending = useMemo(() => accounts.filter(isReviewPending), [accounts]);
  const resolvedCount = useMemo(() => accounts.filter(isReviewResolved).length, [accounts]);

  return (
    <div className="glass-admin-section rounded-3xl border border-white/50 shadow-sm p-4 md:p-5 mt-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm md:text-base font-black text-slate-900">
            <ClipboardCheck className="w-4 h-4 text-amber-600" />
            Revisão de contas
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Casos em que os perfis não permitem decidir sozinhos. Confirmar um regime ou país
            sobrevive às sincronizações seguintes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest">
            {pending.length} por rever
          </span>
          <span className="px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
            {resolvedCount} revistos
          </span>
        </div>
      </div>

      {pending.length === 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Sem casos para revisão.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-white/50">
          {pending.map((account) => (
            <li key={account.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {account.display_name || account.user_email}
                  <span className="ml-1 font-normal text-slate-400">{account.user_email}</span>
                </p>
                <p className="flex items-center gap-1 text-[11px] text-amber-800">
                  <AlertTriangle className="w-3 h-3" />
                  {REVIEW_LABELS[account.review_state] || account.review_state}
                  {account.review_notes ? <span className="text-slate-500">· {account.review_notes}</span> : null}
                </p>
                <div className="mt-1">
                  <AccountBadges account={account} />
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setSelected(account)}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white shrink-0"
              >
                Rever
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AccountResolveModal
        account={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onResolved={() => { setSelected(null); onResolved?.(); }}
      />
    </div>
  );
}