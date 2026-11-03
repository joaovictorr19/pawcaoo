import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Gift, Lock } from "lucide-react";
import { STAGE_COUNT, getMonthKey, getMonthLabel, buildStages } from "@/lib/stagePrizes";

/**
 * Barra de progresso do Legado dividida em quatro etapas.
 * Cada etapa apresenta o prémio mensal configurado no painel de administração
 * e fica conquistada quando o progresso do nível chega à respetiva meta.
 */
export default function LegacyStageProgress({ progress = 0 }) {
  const monthKey = getMonthKey();

  const { data: config = null } = useQuery({
    queryKey: ["monthlyStagePrize", monthKey],
    queryFn: async () => {
      const rows = await base44.entities.MonthlyStagePrize.filter({ month_key: monthKey });
      return rows[0] || null;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const value = Math.min(100, Math.max(0, Number(progress) || 0));
  const stages = buildStages(config, value);
  const unlockedCount = stages.filter((stage) => stage.unlocked).length;

  return (
    <div className="w-full">
      <div className="mb-3 flex items-end justify-between gap-2 px-0.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500/70">
          Prémios de {getMonthLabel(monthKey)}
        </p>
        <span className="text-[10px] font-bold text-amber-400/80">
          {unlockedCount}/{STAGE_COUNT} etapas
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        {stages.map((stage, index) => {
          const previousThreshold = index === 0 ? 0 : stages[index - 1].threshold;
          const span = stage.threshold - previousThreshold;
          const fill = stage.unlocked
            ? 100
            : Math.min(100, Math.max(0, ((value - previousThreshold) / span) * 100));

          return (
            <div
              key={stage.position}
              className="flex flex-col items-center"
              title={stage.description || stage.title}
            >
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-900 ring-1 ring-inset ring-amber-500/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-300 transition-all duration-700"
                  style={{ width: `${fill}%` }}
                />
              </div>

              {stage.image_url ? (
                <div className={`mt-2 h-10 w-10 overflow-hidden rounded-full border-2 ${stage.unlocked ? "border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.45)]" : "border-amber-500/25"}`}>
                  <img
                    src={stage.image_url}
                    alt={stage.title}
                    className={`h-full w-full object-cover ${stage.unlocked ? "" : "opacity-40 grayscale"}`}
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  className={`mt-2 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    stage.unlocked
                      ? "border-amber-400 bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-[0_0_14px_rgba(245,158,11,0.45)]"
                      : "border-amber-500/25 bg-neutral-900 text-amber-500/40"
                  }`}
                >
                  {stage.unlocked ? <Gift className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                </div>
              )}

              <p
                className={`mt-1.5 min-h-[26px] break-words text-center text-[10px] font-bold leading-tight ${
                  stage.unlocked ? "text-amber-300" : "text-neutral-500"
                }`}
              >
                {stage.title}
              </p>
              <span
                className={`mt-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                  stage.unlocked ? "text-amber-500/70" : "text-neutral-600"
                }`}
              >
                {stage.unlocked ? "Conquistado" : `${Math.round(stage.threshold)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}