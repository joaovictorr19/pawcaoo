import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, Trophy, X } from "lucide-react";
import LegacyCard from "@/components/gamification/LegacyCard";
import LegacyCardMini from "@/components/gamification/LegacyCardMini";
import LegacyShareButton from "@/components/gamification/LegacyShareButton";
import { RARITY_LABEL } from "@/lib/legacyCards";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

const slide = {
  enter: (direction) => ({ opacity: 0, x: direction * 90, scale: 0.94 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction) => ({ opacity: 0, x: direction * -90, scale: 0.94 }),
};

/** Estante com todas as cartas: as conquistadas ficam guardadas para sempre. */
export default function LegacyCardCollection({ cards, collectionPoints }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [direction, setDirection] = useState(1);
  const [flipped, setFlipped] = useState(false);

  const earnedCount = cards.filter((card) => card.earned).length;
  const openCard = openIndex === null ? null : cards[openIndex];
  const reduceMotion = prefersReducedMotion();

  const close = () => {
    setOpenIndex(null);
    setFlipped(false);
  };

  const goTo = (next) => {
    if (next < 0 || next > cards.length - 1 || next === openIndex) return;
    setDirection(next > openIndex ? 1 : -1);
    setFlipped(false);
    setOpenIndex(next);
  };

  const handleOpen = (card) => {
    const found = cards.findIndex((entry) => entry.id === card.id);
    setDirection(1);
    setFlipped(false);
    setOpenIndex(found === -1 ? 0 : found);
  };

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") goTo(openIndex + 1);
      if (event.key === "ArrowLeft") goTo(openIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, cards.length]);

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
            className="fixed inset-0 z-[13000] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            onClick={close}
          >
            <motion.div
              className="relative flex max-h-full w-full max-w-md flex-col items-center gap-4 overflow-y-auto rounded-3xl border border-amber-500/20 bg-neutral-950/95 px-4 py-6"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={close}
                aria-label="Fechar coleção"
                className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-amber-500/25 text-amber-400 transition-colors hover:bg-amber-500/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <p className="text-center text-[10px] font-bold uppercase tracking-[0.24em] text-amber-400">
                {openCard.title} · {RARITY_LABEL[openCard.rarity]}
              </p>

              <div className="relative flex w-full items-center justify-center">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.div
                    key={openCard.id}
                    custom={direction}
                    variants={slide}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 30 }}
                    drag={reduceMotion ? false : "x"}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.22}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -55 || info.velocity.x < -420) goTo(openIndex + 1);
                      else if (info.offset.x > 55 || info.velocity.x > 420) goTo(openIndex - 1);
                    }}
                    className="touch-pan-y"
                    style={{ "--lc-w": "clamp(190px, 62vw, 250px)" }}
                  >
                    <LegacyCard card={openCard} flipped={flipped} onFlip={() => setFlipped((prev) => !prev)} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex w-full items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => goTo(openIndex - 1)}
                  disabled={openIndex === 0}
                  aria-label="Carta anterior"
                  className="grid h-10 w-10 place-items-center rounded-full border border-amber-500/25 text-amber-400 transition-opacity disabled:opacity-25"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-[11px] font-bold text-gray-500">
                  {openIndex + 1} / {cards.length}
                </span>

                <button
                  type="button"
                  onClick={() => goTo(openIndex + 1)}
                  disabled={openIndex === cards.length - 1}
                  aria-label="Carta seguinte"
                  className="grid h-10 w-10 place-items-center rounded-full border border-amber-500/25 text-amber-400 transition-opacity disabled:opacity-25"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <p className="text-center text-[11px] text-gray-500">
                {openCard.earned
                  ? `${openCard.points} pontos na coleção · ${openCard.xp} XP recebidos`
                  : `Progresso ${openCard.progress}/${openCard.total} · ${openCard.xp} XP ao concluir`}
              </p>

              <LegacyShareButton card={openCard} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}