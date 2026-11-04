import { base44 } from "@/api/base44Client";

/** Campos de atribuição e entrega de um prémio (um único vencedor por prémio). */
export const emptyAward = () => ({
  winner_email: "",
  winner_name: "",
  redeemed_at: null,
  redeemed_by: "",
});

/** Extrai os campos de atribuição de um prémio guardado. */
export function readAward(prize) {
  return {
    winner_email: prize?.winner_email || "",
    winner_name: prize?.winner_name || "",
    redeemed_at: prize?.redeemed_at || null,
    redeemed_by: prize?.redeemed_by || "",
  };
}

export const isPrizeRedeemed = (prize) => !!prize?.redeemed_at;

export function formatAwardDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Regista (ou anula) a entrega de um prémio mensal — o servidor recusa uma segunda entrega. */
export async function callPrizeAward({
  collection,
  monthKey,
  category,
  position,
  action = "redeem",
  winnerEmail = "",
  winnerName = "",
}) {
  try {
    const response = await base44.functions.invoke("redeemMonthlyPrize", {
      collection,
      month_key: monthKey,
      category,
      position,
      action,
      winner_email: winnerEmail,
      winner_name: winnerName,
    });
    return response.data?.item || null;
  } catch (error) {
    const message =
      error?.response?.data?.error || error?.message || "Não foi possível registar a entrega";
    throw new Error(message);
  }
}