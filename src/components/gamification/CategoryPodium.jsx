import React from "react";
import { motion } from "framer-motion";
import { Building2, Footprints, Gift, Star } from "lucide-react";
import PodiumPedestal from "@/components/gamification/PodiumPedestal";

const ACCENTS = {
  hotel: {
    border: "border-teal-500/25",
    chip: "bg-teal-500/15 text-teal-300 border-teal-500/25",
    medal: "text-teal-300",
  },
  walker: {
    border: "border-amber-500/25",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    medal: "text-amber-300",
  },
};

const ICONS = { hotel: Building2, walker: Footprints };

/** Um pódio de categoria: três posições ordenadas por avaliações recebidas no mês. */
export default function CategoryPodium({
  category,
  title,
  subtitle,
  entries = [],
  prizes = [],
  isLoading,
  labels = {},
  emptyTitle,
  emptyText,
}) {
  const accent = ACCENTS[category] || ACCENTS.walker;
  const Icon = ICONS[category] || Footprints;

  const place = (position) =>
    entries[position - 1] || { name: "", points: 0, reviews: 0, photoUrl: "" };
  const prizeFor = (position) => prizes[position - 1] || { title: "" };

  return (
    <div className={`rounded-3xl border ${accent.border} bg-black/25 p-4 sm:p-5`}>
      <div className="mb-5 flex items-center gap-3">
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl border ${accent.chip}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="font-heading text-sm font-extrabold tracking-tight text-white">{title}</h3>
          <p className="text-[11px] leading-tight text-gray-500">{subtitle}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-xs text-gray-600 animate-pulse">{labels.loading}</p>
      ) : entries.length === 0 ? (
        <motion.div
          className="rounded-2xl border border-white/5 bg-neutral-900/50 px-4 py-5 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{emptyTitle}</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[11px] leading-relaxed text-gray-600">{emptyText}</p>
        </motion.div>
      ) : (
        <>
          <div className="flex items-end justify-center gap-1 sm:gap-2 md:gap-4">
            <PodiumPedestal
              position={2}
              delay={0.2}
              name={place(2).name}
              photoUrl={place(2).photoUrl}
              points={place(2).points}
              reviews={place(2).reviews}
            />
            <PodiumPedestal
              position={1}
              delay={0}
              name={place(1).name}
              photoUrl={place(1).photoUrl}
              points={place(1).points}
              reviews={place(1).reviews}
            />
            <PodiumPedestal
              position={3}
              delay={0.4}
              name={place(3).name}
              photoUrl={place(3).photoUrl}
              points={place(3).points}
              reviews={place(3).reviews}
            />
          </div>

          <div className="mt-5 space-y-1.5">
            {[1, 2, 3].map((position) => (
              <div
                key={position}
                className="flex items-center gap-2 rounded-xl border border-white/5 bg-black/40 px-2.5 py-2"
              >
                <span className={`w-4 flex-none text-[11px] font-black ${accent.medal}`}>{position}º</span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-white">
                  {place(position).name || labels.openSlot}
                </span>
                <span className="flex flex-none items-center gap-1 text-[10px] font-semibold text-gray-500">
                  <Star className="h-2.5 w-2.5 fill-current text-amber-500/70" />
                  {place(position).reviews} {labels.reviewsLabel}
                </span>
                <span
                  className={`flex max-w-[45%] flex-none items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[9px] font-bold ${accent.chip}`}
                >
                  <Gift className="h-2.5 w-2.5 flex-none" />
                  <span className="truncate">{prizeFor(position).title || labels.prizePending}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}