import { RARITY_LABEL } from "@/lib/legacyCards";

/** Link partilhável para a página de O Legado. */
export function legacyCardShareUrl() {
  if (typeof window === "undefined") return "https://pawcao.base44.app/Gamification";
  return `${window.location.origin}/Gamification`;
}

export function legacyCardSharePayload(card) {
  const label = RARITY_LABEL[card.rarity] || "";
  return {
    title: `${card.title} · PawCão`,
    text: card.earned
      ? `Conquistei a carta "${card.title}" (${label}, ${card.points} pts) na minha coleção PawCão.`
      : `Estou a caminho da carta "${card.title}" (${label}) na coleção PawCão.`,
    url: legacyCardShareUrl(),
  };
}

const copyText = async (text) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* tenta o método antigo abaixo */
  }
  try {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
};

/** Partilha nativa no telemóvel; se não existir, copia o link. */
export async function shareLegacyCard(card) {
  const payload = legacyCardSharePayload(card);

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (error) {
      if (error?.name === "AbortError") return "cancelled";
    }
  }

  const copied = await copyText(`${payload.text} ${payload.url}`);
  return copied ? "copied" : "failed";
}