import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Gift, Loader2, Save } from "lucide-react";
import { STAGE_POSITIONS, getMonthKey, getMonthLabel, stageThreshold } from "@/lib/stagePrizes";
import { callPrizeAward, emptyAward, readAward } from "@/lib/prizeAwards";
import PrizeAwardStatus from "@/components/admin/prizes/PrizeAwardStatus";

const emptyStages = () =>
  STAGE_POSITIONS.map((position) => ({
    position,
    title: "",
    description: "",
    image_url: "",
    ...emptyAward(),
  }));

/** Gestão dos quatro prémios mensais das etapas de O Legado. */
export default function AdminLegacyPrizes() {
  const queryClient = useQueryClient();
  const [monthKey, setMonthKey] = useState(getMonthKey);
  const [stages, setStages] = useState(emptyStages);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyPosition, setBusyPosition] = useState(null);

  const { data: record = null, isLoading } = useQuery({
    queryKey: ["adminMonthlyStagePrize", monthKey],
    queryFn: async () => {
      const rows = await base44.entities.MonthlyStagePrize.filter({ month_key: monthKey });
      return rows[0] || null;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isLoading) return;
    const configured = Array.isArray(record?.stages) ? record.stages : [];
    setStages(
      STAGE_POSITIONS.map((position) => {
        const match = configured.find((stage) => Number(stage?.position) === position);
        return {
          position,
          title: match?.title || "",
          description: match?.description || "",
          image_url: match?.image_url || "",
          ...readAward(match),
        };
      })
    );
    setIsActive(record?.is_active !== false);
  }, [record, isLoading]);

  const updateStage = (position, field, value) => {
    setStages((prev) =>
      prev.map((stage) => (stage.position === position ? { ...stage, [field]: value } : stage))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        month_key: monthKey,
        month_label: getMonthLabel(monthKey),
        is_active: isActive,
        stages: stages.map((stage) => ({
          position: stage.position,
          title: stage.title.trim(),
          description: stage.description.trim(),
          image_url: stage.image_url.trim(),
          winner_email: (stage.winner_email || "").trim(),
          winner_name: (stage.winner_name || "").trim(),
          redeemed_at: stage.redeemed_at || null,
          redeemed_by: stage.redeemed_by || "",
        })),
      };

      if (record?.id) {
        await base44.entities.MonthlyStagePrize.update(record.id, payload);
      } else {
        await base44.entities.MonthlyStagePrize.create(payload);
      }

      queryClient.invalidateQueries({ queryKey: ["adminMonthlyStagePrize", monthKey] });
      queryClient.invalidateQueries({ queryKey: ["monthlyStagePrize", monthKey] });
      toast.success(`Prémios de ${getMonthLabel(monthKey)} guardados`);
    } catch (error) {
      toast.error(error?.message || "Não foi possível guardar os prémios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAward = async (position, action) => {
    const stage = stages.find((item) => item.position === position);
    if (!stage) return;

    setBusyPosition(position);
    try {
      const item = await callPrizeAward({
        collection: "MonthlyStagePrize",
        monthKey,
        category: "stages",
        position,
        action,
        winnerEmail: action === "redeem" ? (stage.winner_email || "").trim() : "",
        winnerName: action === "redeem" ? (stage.winner_name || "").trim() : "",
      });

      setStages((prev) =>
        prev.map((entry) => (entry.position === position ? { ...entry, ...readAward(item) } : entry))
      );
      queryClient.invalidateQueries({ queryKey: ["adminMonthlyStagePrize", monthKey] });
      queryClient.invalidateQueries({ queryKey: ["monthlyStagePrize", monthKey] });
      toast.success(action === "redeem" ? "Entrega registada" : "Entrega anulada");
    } catch (error) {
      toast.error(error?.message || "Não foi possível registar a entrega");
    } finally {
      setBusyPosition(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div>
            <p className="flex items-center gap-2 text-lg font-black text-slate-900">
              <Gift className="h-5 w-5 text-amber-500" /> Prémios mensais das etapas
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Cada etapa fica conquistada ao atingir 5, 10, 20 e 40 pontos no mês (reservas concluídas + 1 ponto por review), na página O Legado.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Mês</span>
              <Input
                type="month"
                value={monthKey}
                onChange={(event) => setMonthKey(event.target.value || getMonthKey())}
                className="w-44 rounded-xl"
              />
            </label>

            <label className="flex items-center gap-2 pt-4">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <span className="text-sm font-semibold text-slate-700">Prémios visíveis</span>
            </label>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar prémios
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> A carregar prémios de {getMonthLabel(monthKey)}…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {stages.map((stage) => (
            <div
              key={stage.position}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-slate-900">Etapa {stage.position}</p>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                  {stageThreshold(stage.position)} pontos
                </span>
              </div>

              <Input
                placeholder="Nome do prémio"
                value={stage.title}
                onChange={(event) => updateStage(stage.position, "title", event.target.value)}
                className="rounded-xl"
              />

              <Textarea
                placeholder="Descrição curta do prémio"
                value={stage.description}
                onChange={(event) => updateStage(stage.position, "description", event.target.value)}
                rows={2}
                className="resize-none rounded-xl"
              />

              <Input
                placeholder="URL da imagem (opcional)"
                value={stage.image_url}
                onChange={(event) => updateStage(stage.position, "image_url", event.target.value)}
                className="rounded-xl"
              />

              <Input
                placeholder="Vencedor (email)"
                value={stage.winner_email}
                onChange={(event) => updateStage(stage.position, "winner_email", event.target.value)}
                disabled={!!stage.redeemed_at}
                className="rounded-xl"
              />

              <PrizeAwardStatus
                winnerEmail={stage.winner_email}
                winnerName={stage.winner_name}
                redeemedAt={stage.redeemed_at}
                isBusy={busyPosition === stage.position}
                onRedeem={() => handleAward(stage.position, "redeem")}
                onClear={() => handleAward(stage.position, "clear")}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}