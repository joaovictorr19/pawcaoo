import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export async function runProRepair() {
  const toastId = toast.loading("A iniciar reparação de perfis...");

  try {
    // 1. Puxar todos os utilizadores para podermos filtrar os profissionais
    const professionals = await base44.entities.User.list('-created_date', 5000);

    let fixedCount = 0;

    for (const pro of professionals) {
      if (['walker', 'trainer', 'both'].includes(pro.account_type)) {
        const needsProfile = !pro.professional_profile;
        const needsWallet = !pro.wallet;

        if (needsProfile || needsWallet) {
          // 2. Criar a estrutura em falta sem apagar o que já lá está
          await base44.entities.User.update(pro.id, {
            professional_profile: pro.professional_profile || {
              verification_status: 'pending',
              is_trained: false,
              is_pawcao: false,
              bio: "Profissional PawGo em verificação.",
              category: 'Passeador',
              avatar_url: pro.photo_url || pro.profile_photo_url || "", // Recupera a foto antiga se existir
              cover_url: ""
            },
            wallet: pro.wallet || {
              free_walks: 0,
              balance: 0,
              currency: 'EUR'
            }
          });
          fixedCount++;
        }
      }
    }

    toast.success(`Reparação concluída!`, {
      id: toastId,
      description: `${fixedCount} perfis foram normalizados.`
    });
  } catch (error) {
    console.error("Erro na reparação:", error);
    toast.error("Falha ao reparar base de dados.", { id: toastId });
  }
}