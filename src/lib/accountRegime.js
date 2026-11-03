import { base44 } from "@/api/base44Client";

/**
 * Acesso do próprio utilizador ao registo canónico da conta.
 * O AccountRegistry só é legível por admins — a leitura passa pelo backend.
 */

export const REGIME_HOME = {
  customer: "/ClientDashboard",
  walker: "/ProfessionalHubV2",
  trainer: "/ProfessionalHubV2",
  hotel: "/HotelDashboard",
  shop: "/StoreDashboard",
};

export async function fetchMyAccount() {
  const response = await base44.functions.invoke("myAccountRegistry", {});
  return response?.data?.account || null;
}

/** Chamado no fim de cada adesão: registra/atualiza a conta para o admin. */
export async function registerOwnAccount() {
  try {
    await base44.functions.invoke("myAccountRegistry", { sync: true });
  } catch (error) {
    console.warn("Registo canónico da conta não atualizado:", error?.message);
  }
}