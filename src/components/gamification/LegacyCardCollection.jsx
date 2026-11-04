import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Trophy, X } from "lucide-react";
import LegacyCard from "@/components/gamification/LegacyCard";
import LegacyCardMini from "@/components/gamification/LegacyCardMini";
import { RARITY_LABEL } from "@/lib/legacyCards";

/** Estante com todas as cartas: as conquistadas ficam guardadas para sempre. */
export default function LegacyCardCollection({ cards, collectionPoints }) {
  const [openCard, setOpenCard] = useState(null);
  const [flipped, setFlipped] = useState(false);

  const earnedCount = cards.filter((card) => card.earned).length;

  useEffect(() => {
    if (!openCard) return;
    const onKey = (event) => event.key === "Escape" && setOpenCard(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openCard]);

  const handleOpen = (card) => {
    setFlipped(false);
    setOpenCard(card);
  };

  return (
    <div className="rounded-3xl border border-amber-500/15 bg-neutral-900/40 p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-amber-400">
            <Trophy className="h-4 w-4" />
            A tua coleção
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Uma carta por provação. Depois de conquistada, fica sempre contigo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-amber-500/25 bg-black/40 px-3 py-1 text-[11px] font-bold text-amber-300">
            {earnedCount}/{cards.length} cartas
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-black/40 px-3 py-1 text-[11px] font-bold text-amber-300">
            <Sparkles className="h-3 w-3" />
            {collectionPoints} pts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 md:grid-cols-6">
        {cards.map((card) => (
          <LegacyCardMini key={card.id} card={card} onClick={() => handleOpen(card)} />
        ))}
      </div>

      <AnimatePresence>
        {openCard && (
          <motion.div
            className="fixed inset-0 z-[13000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpenCard(null)}
          >
            <motion.div
              className="relative flex max-h-full flex-col items-center gap-4 overflow-y-auto rounded-3xl border border-amber-500/20 bg-neutral-950/95 px-6 py-7"
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpenCard(null)}
                aria-label="Fechar"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-amber-500/25 text-amber-400 transition-colors hover:bg-amber-500/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <p className="text-center text-[10px] font-bold uppercase tracking-[0.24em] text-amber-400">
                {openCard.title} · {RARITY_LABEL[openCard.rarity]}
              </p>

              <div style={{ "--lc-w": "250px" }}>
                <LegacyCard
                  card={openCard}
                  flipped={flipped}
                  onFlip={() => setFlipped((prev) => !prev)}
                />
              </div>

              <p className="text-center text-[11px] text-gray-500">
                {openCard.earned
                  ? `${openCard.points} pontos na coleção · ${openCard.xp} XP recebidos`
                  : `Progresso ${openCard.progress}/${openCard.total}`}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}