/**
 * Etiquetas e classes de apresentação do modelo canónico de conta.
 * Valores alinhados com base44/shared/accountRegistry.ts (fonte única de derivação).
 */

export const REGIMES = [
  { value: "customer", label: "Cliente", cls: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "walker", label: "Passeador", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "trainer", label: "Treinador", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "hotel", label: "Hotel", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "shop", label: "Loja", cls: "bg-orange-50 text-orange-700 border-orange-200" },
];

export const COUNTRIES = [
  { value: "portugal", label: "Portugal", short: "PT" },
  { value: "spain", label: "Espanha", short: "ES" },
  { value: "france", label: "França", short: "FR" },
];

export const ACCOUNT_STATUSES = [
  { value: "verified", label: "Verificado", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "pending", label: "Em análise", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "requires_documents", label: "Docs em falta", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "rejected", label: "Rejeitado", cls: "bg-red-50 text-red-600 border-red-200" },
  { value: "not_applicable", label: "Sem verificação", cls: "bg-slate-100 text-slate-500 border-slate-200" },
];

export const REVIEW_LABELS = {
  missing_country: "País por definir",
  missing_regime: "Regime por definir",
  conflict: "Perfis em conflito",
  no_profile: "Sem perfil profissional",
};

export const regimeMeta = (value) => REGIMES.find((r) => r.value === value) || null;
export const countryMeta = (value) => COUNTRIES.find((c) => c.value === value) || null;
export const statusMeta = (value) => ACCOUNT_STATUSES.find((s) => s.value === value) || null;