import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, ShieldQuestion, UserRoundCog, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { REGIMES, COUNTRIES, REVIEW_LABELS, effectiveRegime, effectiveCountry } from "@/lib/accountLabels";

const selectCls =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30";

/**
 * Resolve um caso de revisão: consulta os dados de origem, confirma regime/país,
 * corrige a indicação da conta, pede onboarding ou mantém o caso em revisão.
 */
export default function AccountResolveModal({ account, open, onClose, onResolved }) {
  const [regime, setRegime] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (!open || !account) return;
    setRegime(effectiveRegime(account) || "");
    setCountry(effectiveCountry(account) || "");
    setNotes(account.admin_notes || "");
    setBusy(null);
  }, [open, account]);

  if (!account) return null;

  const noProfile = account.review_state === "no_profile";

  const submit = async (action) => {
    setBusy(action);
    try {
      const response = await base44.functions.invoke("resolveAccountRegistry", {
        user_email: account.user_email,
        action,
        confirmed_regime: regime || undefined,
        confirmed_country: country || undefined,
        notes: notes || undefined,
      });
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      toast.success("Revisão guardada.");
      onResolved?.();
    } catch (error) {
      toast.error(error?.message || "Não foi possível guardar a revisão.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-black text-slate-900">Rever conta</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {account.display_name} · {account.user_email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
              <ShieldQuestion className="w-3 h-3" />
              {REVIEW_LABELS[account.review_state] || "Caso para revisão"}
            </p>
            <p className="mt-1 text-[11px] text-amber-900/80">{account.review_notes || "Sem detalhe."}</p>
            <p className="mt-1 text-[10px] font-semibold text-amber-800">
              Detetado: {account.regime || "—"} · {account.country || "país por definir"}
              {account.professional_types?.length ? " · perfis: " + account.professional_types.join(" + ") : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Regime
              <select className={selectCls + " mt-1"} value={regime} onChange={(e) => setRegime(e.target.value)}>
                <option value="">Não definido</option>
                {REGIMES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </label>

            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              País
              <select className={selectCls + " mt-1"} value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">Não definido</option>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
            Nota interna
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Motivo da decisão (opcional)"
              className="mt-1 text-sm"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              onClick={() => submit("confirm")}
              disabled={!!busy || (!regime && !country)}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
            >
              {busy === "confirm" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar revisão
            </Button>

            <Button
              variant="outline"
              onClick={() => submit("keep")}
              disabled={!!busy}
              className="rounded-xl bg-white"
            >
              Manter em revisão
            </Button>

            {noProfile && (
              <>
                <Button
                  variant="outline"
                  onClick={() => submit("onboarding_requested")}
                  disabled={!!busy}
                  className="rounded-xl bg-white"
                >
                  {busy === "onboarding_requested" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                  Pedir onboarding
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => submit("claim_corrected")}
                  disabled={!!busy}
                  className="rounded-xl text-red-600 hover:bg-red-50"
                >
                  {busy === "claim_corrected" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserRoundCog className="w-3.5 h-3.5 mr-2" />}
                  Corrigir indicação
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}