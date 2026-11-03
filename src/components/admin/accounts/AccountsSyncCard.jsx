import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, ScanSearch, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REGIMES, COUNTRIES } from "@/lib/accountLabels";

/**
 * Prepara e aplica o registo canónico de contas.
 * Analisar é sempre só leitura; escrever exige o botão de aplicar.
 */
export default function AccountsSyncCard({ onSynced }) {
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(null);

  const run = async (dryRun) => {
    setBusy(dryRun ? "analyze" : "apply");
    try {
      const response = await base44.functions.invoke("syncAccountRegistry", { dry_run: dryRun });
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      setReport(data);
      if (dryRun) {
        toast.success("Análise concluída — nada foi alterado.");
      } else {
        toast.success(`Registo atualizado: ${data.created} criados, ${data.updated} atualizados.`);
        onSynced?.();
      }
    } catch (error) {
      toast.error(error?.message || "Não foi possível sincronizar as contas.");
    } finally {
      setBusy(null);
    }
  };

  const pendingTotal = (report?.pending_create || 0) + (report?.pending_update || 0);

  return (
    <div className="glass-admin-section rounded-3xl border border-white/50 shadow-sm p-4 md:p-5 mt-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm md:text-base font-black text-slate-900">Registo de contas</h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            Consolida regime, país e estado a partir dos perfis existentes. Analisar não altera nada;
            só o botão de aplicar escreve o registo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => run(true)}
            disabled={!!busy}
            className="bg-white/60 hover:bg-white border-white/50 rounded-xl"
          >
            {busy === "analyze" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ScanSearch className="w-4 h-4 mr-2" />}
            Analisar
          </Button>
          <Button
            size="sm"
            onClick={() => run(false)}
            disabled={!!busy}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
          >
            {busy === "apply" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Aplicar sincronização
          </Button>
        </div>
      </div>

      {report && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat label="Contas lidas" value={report.scanned_accounts} />
            <Stat label={report.dry_run ? "A criar" : "Criadas"} value={report.dry_run ? report.pending_create : report.created} />
            <Stat label={report.dry_run ? "A atualizar" : "Atualizadas"} value={report.dry_run ? report.pending_update : report.updated} />
            <Stat
              label="Para revisão"
              value={report.reviews}
              tone={report.reviews > 0 ? "warn" : "ok"}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {REGIMES.map((regime) => (
              <span key={regime.value} className={"px-2 py-0.5 rounded-md border text-[10px] font-bold " + regime.cls}>
                {regime.label} {report.by_regime?.[regime.value] || 0}
              </span>
            ))}
            {COUNTRIES.map((country) => (
              <span key={country.value} className="px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-600 text-[10px] font-bold">
                {country.short} {report.by_country?.[country.value] || 0}
              </span>
            ))}
          </div>

          {report.review_samples?.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700">
                <AlertTriangle className="w-3 h-3" /> Casos para revisão
                {report.reviews_resolved > 0 && (
                  <span className="text-emerald-700">· {report.reviews_resolved} já revistos</span>
                )}
              </p>
              <ul className="mt-2 space-y-1">
                {report.review_samples.map((sample) => (
                  <li key={sample.email} className="text-[11px] text-amber-900/80">
                    <span className="font-semibold">{sample.email}</span>
                    <span className="text-amber-700"> · {sample.review_notes || sample.review_state}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!report.dry_run && pendingTotal === 0 && (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" /> Registo já estava atualizado.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }) {
  const toneCls =
    tone === "warn"
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : tone === "ok"
        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : "text-slate-800 bg-white/60 border-white/50";
  return (
    <div className={"rounded-xl border px-3 py-2 " + toneCls}>
      <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-lg font-black leading-tight">{value ?? 0}</p>
    </div>
  );
}