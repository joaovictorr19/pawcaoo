import React, { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { shareLegacyCard } from "@/lib/shareLegacyCard";

/** Botão de partilha de uma carta — usa a partilha do telemóvel ou copia o link. */
export default function LegacyShareButton({ card, className = "" }) {
  const [justShared, setJustShared] = useState(false);

  if (!card) return null;

  const handleShare = async () => {
    const result = await shareLegacyCard(card);
    if (result === "copied") toast.success("Link da carta copiado");
    if (result === "failed") toast.error("Não foi possível partilhar a carta");
    if (result === "shared") {
      setJustShared(true);
      window.setTimeout(() => setJustShared(false), 1800);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-black/50 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300 transition-colors duration-300 hover:bg-amber-500/15 active:scale-95 ${className}`}
      aria-label={`Partilhar a carta ${card.title}`}
    >
      {justShared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {justShared ? "Partilhada" : "Partilhar"}
    </button>
  );
}