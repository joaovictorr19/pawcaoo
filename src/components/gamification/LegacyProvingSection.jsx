import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LegacyCard from "@/components/gamification/LegacyCard";
import LegacyCardCollection from "@/components/gamification/LegacyCardCollection";
import LegacyShareButton from "@/components/gamification/LegacyShareButton";
import { useLegacyCards } from "@/hooks/useLegacyCards";

const spring = { type: "spring", stiffness: 240, damping: 28, mass: 0.9 };

const slide = {
  enter: (direction) => ({ opacity: 0, x: direction * 110, scale: 0.94 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (direction) => ({ opacity: 0, x: direction * -110, scale: 0.94 }),
};

/** As Provações: cartas colecionáveis com progresso real da conta. */
export default function LegacyProvingSection({ user, userProfile }) {
  const { cards, collectionPoints, isLoading } = useLegacyCards({
    email: user?.email,
    userProfile,
  });

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [flippedId, setFlippedId] = useState(null);

  const total = cards.length;
  const reduceMotion =
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  useEffect(() => {
    if (index > total - 1) setIndex(0);
  }, [total, index]);

  const goTo = (next, forcedDirection) => {
    if (!total) return;
    const wrapped = ((next % total) + total) % total;
    if (wrapped === index) return;
    setFlippedId(null);
    setDirection(forcedDirection ?? (next > index ? 1 : -1));
    setIndex(wrapped);
  };

  const at = (offset) => cards[((index + offset) % total + total) % total];
  const center = total ? at(0) : null;
  const left = total ? at(-1) : null;
  const right = total ? at(1) : null;

  return (
    <section className="relative border-t border-amber-500/10 px-3 py-10 md:px-4 md:py-16">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-500/60 md:tracking-[0.3em]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          As Provações
        </motion.h2>
        <p className="mb-8 text-center text-xs text-gray-600 md:mb-10">
          Cada provação concluída dá-te uma carta única. As cartas ficam na tua coleção para sempre.
        </p>

        {isLoading ? (
          <div className="flex h-80 items-center justify-center gap-2 text-sm text-amber-500/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            A revelar as cartas…
          </div>
        ) : (
          <div className="relative overflow-x-clip">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goTo(index - 1, -1)}
              aria-label="Carta anterior"
              className="absolute left-0 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 rounded-full border border-amber-500/30 bg-black/60 text-amber-400 hover:bg-amber-500/20 md:inline-flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => goTo(index + 1, 1)}
              aria-label="Carta seguinte"
              className="absolute right-0 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 rounded-full border border-amber-500/30 bg-black/60 text-amber-400 hover:bg-amber-500/20 md:inline-flex"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <div className="flex w-full items-center justify-center gap-4 py-3 md:gap-6 md:px-20 md:py-6">
              <motion.div
                key={`left-${left?.id}`}
                className="hidden shrink-0 md:block"
                initial={{ opacity: 0, x: -26, rotate: -16, scale: 0.72 }}
                animate={{ opacity: 0.5, x: 0, rotate: -9, scale: 0.82 }}
                transition={spring}
                onClick={() => goTo(index - 1, -1)}
                aria-hidden="true"
              >
                {left && <LegacyCard card={left} flipped={false} />}
              </motion.div>

              <AnimatePresence mode="wait" initial={false} custom={direction}>
                {center && (
                  <motion.div
                    key={center.id}
                    custom={direction}
                    variants={slide}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={spring}
                    drag={reduceMotion ? false : "x"}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.22}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -55 || info.velocity.x < -420) goTo(index + 1, 1);
                      else if (info.offset.x > 55 || info.velocity.x > 420) goTo(index - 1, -1);
                    }}
                    className="mx-auto shrink-0 touch-pan-y"
                    style={{ "--lc-w": "clamp(200px, 62vw, 250px)" }}
                  >
                    <LegacyCard
                      card={center}
                      flipped={flippedId === center.id}
                      onFlip={() => setFlippedId((prev) => (prev === center.id ? null : center.id))}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                key={`right-${right?.id}`}
                className="hidden shrink-0 md:block"
                initial={{ opacity: 0, x: 26, rotate: 16, scale: 0.72 }}
                animate={{ opacity: 0.5, x: 0, rotate: 9, scale: 0.82 }}
                transition={spring}
                onClick={() => goTo(index + 1, 1)}
                aria-hidden="true"
              >
                {right && <LegacyCard card={right} flipped={false} />}
              </motion.div>
            </div>

            {/* Controlos compactos no telemóvel */}
            <div className="mt-3 flex items-center justify-center md:hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-black/45 px-1.5 py-1">
                <button
                  type="button"
                  onClick={() => goTo(index - 1, -1)}
                  aria-label="Carta anterior"
                  className="grid h-8 w-8 min-h-0 min-w-0 place-items-center rounded-full text-amber-400 active:scale-90"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="min-w-[44px] text-center text-[11px] font-bold tabular-nums text-amber-300">
                  {index + 1}/{total}
                </span>

                <button
                  type="button"
                  onClick={() => goTo(index + 1, 1)}
                  aria-label="Carta seguinte"
                  className="grid h-8 w-8 min-h-0 min-w-0 place-items-center rounded-full text-amber-400 active:scale-90"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Pontos de navegação no desktop */}
            <div className="mt-4 hidden items-center justify-center gap-1.5 md:flex">
              {cards.map((card, dotIndex) => (
                <button
                  key={card.id}
                  onClick={() => goTo(dotIndex, dotIndex > index ? 1 : -1)}
                  aria-label={`Ir para ${card.title}`}
                  aria-current={dotIndex === index}
                  className={`h-1.5 min-h-0 min-w-0 rounded-full p-0 transition-all duration-500 ${
                    dotIndex === index
                      ? "w-7 bg-amber-400"
                      : card.earned
                        ? "w-1.5 bg-amber-500/50"
                        : "w-1.5 bg-neutral-700 hover:bg-neutral-600"
                  }`}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-col items-center gap-2">
              <LegacyShareButton card={center} />
              <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600 md:hidden">
                Desliza a carta para o lado
              </p>
            </div>
          </div>
        )}

        <div className="mt-10">
          <LegacyCardCollection cards={cards} collectionPoints={collectionPoints} />
        </div>
      </div>
    </section>
  );
}