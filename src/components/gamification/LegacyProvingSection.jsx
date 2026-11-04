import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LegacyCard from "@/components/gamification/LegacyCard";
import LegacyCardCollection from "@/components/gamification/LegacyCardCollection";
import { useLegacyCards } from "@/hooks/useLegacyCards";

const spring = { type: "spring", stiffness: 240, damping: 28, mass: 0.9 };

/** As Provações: cartas colecionáveis com progresso real da conta. */
export default function LegacyProvingSection({ user, userProfile }) {
  const { cards, collectionPoints, isLoading } = useLegacyCards({
    email: user?.email,
    userProfile,
  });

  const [index, setIndex] = useState(0);
  const [flippedId, setFlippedId] = useState(null);

  const total = cards.length;

  useEffect(() => {
    if (index > total - 1) setIndex(0);
  }, [total, index]);

  const goTo = (next) => {
    setFlippedId(null);
    setIndex(((next % total) + total) % total);
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
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => goTo(index - 1)}
              aria-label="Carta anterior"
              className="absolute left-0 top-1/2 z-30 h-11 w-11 -translate-y-1/2 rounded-full border border-amber-500/30 bg-black/60 text-amber-400 hover:bg-amber-500/20 md:h-12 md:w-12"
            >
              <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => goTo(index + 1)}
              aria-label="Carta seguinte"
              className="absolute right-0 top-1/2 z-30 h-11 w-11 -translate-y-1/2 rounded-full border border-amber-500/30 bg-black/60 text-amber-400 hover:bg-amber-500/20 md:h-12 md:w-12"
            >
              <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
            </Button>

            <div className="flex items-center justify-center gap-4 px-12 py-4 md:gap-6 md:px-20 md:py-6">
              <motion.div
                key={`left-${left?.id}`}
                className="hidden shrink-0 md:block"
                initial={{ opacity: 0, x: -26, rotate: -16, scale: 0.72 }}
                animate={{ opacity: 0.5, x: 0, rotate: -9, scale: 0.82 }}
                transition={spring}
                onClick={() => goTo(index - 1)}
                aria-hidden="true"
              >
                {left && <LegacyCard card={left} flipped={false} />}
              </motion.div>

              <AnimatePresence mode="wait" initial={false}>
                {center && (
                  <motion.div
                    key={center.id}
                    initial={{ opacity: 0, y: 22, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -18, scale: 0.95 }}
                    transition={spring}
                    className="shrink-0"
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
                onClick={() => goTo(index + 1)}
                aria-hidden="true"
              >
                {right && <LegacyCard card={right} flipped={false} />}
              </motion.div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5">
              {cards.map((card, dotIndex) => (
                <button
                  key={card.id}
                  onClick={() => goTo(dotIndex)}
                  aria-label={`Ir para ${card.title}`}
                  aria-current={dotIndex === index}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    dotIndex === index
                      ? "w-7 bg-amber-400"
                      : card.earned
                        ? "w-1.5 bg-amber-500/50"
                        : "w-1.5 bg-neutral-700 hover:bg-neutral-600"
                  }`}
                />
              ))}
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