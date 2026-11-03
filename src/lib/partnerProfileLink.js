import { base44 } from "@/api/base44Client";
import { ensureProfileSlug } from "@/utils/profileSlug";

/**
 * Devolve o link do perfil público de um parceiro (hotel, passeador, treinador)
 * a partir do id do WalkerProfile — é nesse perfil que se faz a reserva.
 */
export async function resolvePartnerProfileLink(partnerId) {
  if (!partnerId) return null;
  try {
    const partner = await base44.entities.WalkerProfile.get(partnerId);
    const name = partner?.hotel_details?.hotel_name || partner?.walker_name;
    if (name && partner?.created_by) {
      const type = partner.professional_type === "hotel" ? "hotel" : "walker";
      const link = await ensureProfileSlug(name, partner.created_by, type);
      if (link && link !== "/") return link;
    }
  } catch (e) {
    /* perfil indisponível — cai para a loja do parceiro */
  }
  return `/loja/${partnerId}`;
}