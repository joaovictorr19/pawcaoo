import React from "react";
import { Filter } from "lucide-react";
import { REGIMES, COUNTRIES, ACCOUNT_STATUSES } from "@/lib/accountLabels";

const selectCls =
  "h-9 rounded-xl border border-white/60 bg-white/70 px-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30";

/**
 * Filtros por regime, país, estado e revisão, com contagens por grupo.
 */
export default function AccountFiltersBar({ filters, onChange, counts }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  const isActive =
    filters.regime !== "all" ||
    filters.country !== "all" ||
    filters.status !== "all" ||
    filters.review !== "all";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <Filter className="w-3 h-3" />
        Regime
      </span>

      <select
        aria-label="Filtrar por regime"
        className={selectCls}
        value={filters.regime}
        onChange={(e) => set("regime", e.target.value)}
      >
        <option value="all">Todos ({counts.synced})</option>
        {REGIMES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label} ({counts.regimes[r.value] || 0})
          </option>
        ))}
        <option value="undefined">Sem registo ({counts.unsynced})</option>
      </select>

      <select
        aria-label="Filtrar por país"
        className={selectCls}
        value={filters.country}
        onChange={(e) => set("country", e.target.value)}
      >
        <option value="all">Todos os países</option>
        {COUNTRIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label} ({counts.countries[c.value] || 0})
          </option>
        ))}
        <option value="undefined">País por definir ({counts.missingCountry})</option>
      </select>

      <select
        aria-label="Filtrar por estado"
        className={selectCls}
        value={filters.status}
        onChange={(e) => set("status", e.target.value)}
      >
        <option value="all">Todos os estados</option>
        {ACCOUNT_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label} ({counts.statuses[s.value] || 0})
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por revisão"
        className={selectCls}
        value={filters.review}
        onChange={(e) => set("review", e.target.value)}
      >
        <option value="all">Revisão: todas</option>
        <option value="pending">Para rever ({counts.reviewPending || 0})</option>
        <option value="resolved">Revisados ({counts.reviewResolved || 0})</option>
      </select>

      {isActive && (
        <button
          type="button"
          onClick={() => onChange({ regime: "all", country: "all", status: "all", review: "all" })}
          className="text-[10px] font-bold text-teal-700 underline"
        >
          Limpar
        </button>
      )}
    </div>
  );
}