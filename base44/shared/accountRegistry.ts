/**
 * Modelo canónico de conta PawCão — derivação única (lado servidor).
 *
 * Regimes: customer | walker | trainer | hotel | shop
 * Países: portugal | spain | france
 * Estados: verified | pending | requires_documents | rejected | not_applicable
 *
 * Regras de precedência (explícitas, ver PRD Onda 1):
 * - Os perfis profissionais (WalkerProfile / TrainerProfile) prevalecem sobre o
 *   campo account_type do utilizador.
 * - Sem perfis e sem account_type profissional => cliente.
 * - Conta que se diz profissional mas não tem perfil => regime pretendido, marcado
 *   "no_profile" para revisão.
 * - Mais do que um tipo profissional => regime pela ordem shop > hotel > trainer >
 *   walker, marcado "conflict" com os tipos encontrados.
 * - País só vem de country_of_operation do perfil; nunca é inferido.
 */

export const REGIME_PRECEDENCE = ["shop", "hotel", "trainer", "walker"];
export const COUNTRY_VALUES = ["portugal", "spain", "france"];
const CLAIMED_PRO_TYPES = ["walker", "trainer", "both", "hotel", "shop", "professional"];

const norm = (value) => String(value ?? "").trim().toLowerCase();

export function normalizeEmail(email) {
  return norm(email);
}

export function displayNameFromEmail(email) {
  const local = String(email || "").split("@")[0] || "";
  const base = local.replace(/[._\-+]+/g, " ").replace(/\d+/g, " ").trim();
  if (!base) return "Sem nome";
  return base
    .split(/\s+/)
    .slice(0, 3)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function walkerTypes(profile) {
  const type = norm(profile?.professional_type);
  if (type === "hotel") return ["hotel"];
  if (type === "shop") return ["shop"];
  if (type === "trainer") return ["trainer"];
  if (type === "both") return ["walker", "trainer"];
  return ["walker"];
}

export function normalizeStatus(raw) {
  const status = norm(raw);
  if (status === "verified") return "verified";
  if (status === "rejected") return "rejected";
  if (status === "requires_documents") return "requires_documents";
  return "pending";
}

export function normalizeCountry(raw) {
  const country = norm(raw);
  return COUNTRY_VALUES.includes(country) ? country : null;
}

/**
 * Constrói a linha canónica de uma conta a partir dos dados existentes.
 * Nunca altera as origens — apenas lê e consolida.
 */
export function buildRegistryRow(user, walkerProfiles = [], trainerProfiles = []) {
  const email = norm(user?.email);
  const types = [];
  const profileIds = [];
  const profiles = [];

  walkerProfiles.forEach((profile) => {
    walkerTypes(profile).forEach((type) => types.push(type));
    if (profile?.id) profileIds.push(profile.id);
    profiles.push({ profile, type: walkerTypes(profile)[0] });
  });

  trainerProfiles.forEach((profile) => {
    types.push("trainer");
    if (profile?.id) profileIds.push(profile.id);
    profiles.push({ profile, type: "trainer" });
  });

  const uniqueTypes = [...new Set(types)];

  let regime = "customer";
  let reviewState = "ok";
  let reviewNotes = "";

  if (uniqueTypes.length === 0) {
    const claimed = norm(user?.account_type);
    if (CLAIMED_PRO_TYPES.includes(claimed)) {
      regime =
        claimed === "shop" ? "shop"
          : claimed === "hotel" ? "hotel"
            : claimed === "trainer" ? "trainer"
              : "walker";
      reviewState = "no_profile";
      reviewNotes = `Conta indica "${claimed}" mas não tem perfil profissional.`;
    }
  } else if (uniqueTypes.length === 1) {
    regime = uniqueTypes[0];
  } else {
    regime = REGIME_PRECEDENCE.find((type) => uniqueTypes.includes(type)) || "walker";
    reviewState = "conflict";
    reviewNotes = `Perfis encontrados: ${uniqueTypes.join(" + ")}.`;
  }

  // Perfil de origem do regime escolhido (para país e estado)
  const primaryEntry = profiles.find((entry) => entry.type === regime) || profiles[0] || null;

  let country = null;
  for (const entry of profiles) {
    const found = normalizeCountry(entry.profile?.country_of_operation);
    if (found) { country = found; break; }
  }
  if (!country && primaryEntry) {
    country = normalizeCountry(primaryEntry.profile?.country_of_operation);
  }

  if (!country && regime !== "customer" && reviewState === "ok") {
    reviewState = "missing_country";
    reviewNotes = "Conta profissional sem país de operação definido.";
  }

  let status = "not_applicable";
  if (regime !== "customer" || primaryEntry) {
    status = primaryEntry ? normalizeStatus(primaryEntry.profile?.verification_status) : "pending";
  }

  const row = {
    user_email: email,
    user_id: user?.id || "",
    display_name: norm(user?.full_name) ? String(user.full_name).trim() : displayNameFromEmail(email),
    auth_role: user?.role || "user",
    regime,
    status,
    review_state: reviewState,
    review_notes: reviewNotes,
    professional_types: uniqueTypes,
    professional_profile_ids: profileIds,
  };
  if (country) row.country = country;

  row.source_signature = signatureOf(row);
  return row;
}

/**
 * Assinatura estável dos dados consolidados — permite saltar registos inalterados
 * (migração idempotente).
 */
export function signatureOf(row) {
  return [
    row?.regime || "",
    row?.country || "",
    row?.status || "",
    row?.review_state || "",
    row?.review_notes || "",
    (row?.professional_types || []).join("+"),
    (row?.professional_profile_ids || []).sort().join(","),
    row?.display_name || "",
    row?.auth_role || "",
  ].join("|");
}

/** Campos decididos manualmente pelo admin — nunca são recalculados pela sincronização. */
export const OVERRIDE_FIELDS = [
  "confirmed_regime",
  "confirmed_country",
  "admin_notes",
  "reviewed_by",
  "reviewed_date",
  "review_action",
];

export function preservedOverrides(existing) {
  const kept = {};
  if (!existing) return kept;
  OVERRIDE_FIELDS.forEach((key) => {
    const value = existing[key];
    if (value !== undefined && value !== null && value !== "") kept[key] = value;
  });
  if (existing.review_resolved === true) kept.review_resolved = true;
  return kept;
}

/**
 * Consolida todas as contas: uma linha por utilizador, indexando os perfis por email.
 */
export function buildRegistryRows(users = [], walkerProfiles = [], trainerProfiles = []) {
  const walkersByEmail = new Map();
  const trainersByEmail = new Map();

  walkerProfiles.forEach((profile) => {
    const key = norm(profile?.created_by);
    if (!key) return;
    if (!walkersByEmail.has(key)) walkersByEmail.set(key, []);
    walkersByEmail.get(key).push(profile);
  });

  trainerProfiles.forEach((profile) => {
    const key = norm(profile?.created_by);
    if (!key) return;
    if (!trainersByEmail.has(key)) trainersByEmail.set(key, []);
    trainersByEmail.get(key).push(profile);
  });

  return users
    .filter((user) => norm(user?.email))
    .map((user) => {
      const email = norm(user.email);
      return buildRegistryRow(user, walkersByEmail.get(email) || [], trainersByEmail.get(email) || []);
    });
}