// Escolhe o perfil profissional principal de uma lista de WalkerProfiles.
// Prioriza perfis de profissional (walker/trainer/both) sobre hotel/shop e,
// entre iguais, prefere ativos e verificados. Evita que uma conta com vários
// perfis (ex.: hotéis de demonstração anexados à conta) seja exibida como hotel.
export const pickPrimaryWalkerProfile = (profiles) => {
  if (!Array.isArray(profiles) || profiles.length === 0) return null;

  const score = (p) => {
    let s = 0;
    const type = p?.professional_type;
    if (type === "walker" || type === "trainer" || type === "both") s += 100;
    if (type === "hotel" || type === "shop") s -= 100;
    if (p?.is_active) s += 10;
    if (p?.verification_status === "verified") s += 5;
    return s;
  };

  return [...profiles].sort((a, b) => score(b) - score(a))[0];
};