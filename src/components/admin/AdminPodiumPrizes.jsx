import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Building2, Footprints, Loader2, Save, Trophy } from "lucide-react";
import { PODIUM_POSITIONS } from "@/lib/podiumPrizes";
import { getMonthKey, getMonthLabel } from "@/lib/stagePrizes";

const CATEGORIES = [
  { key: "hotel_prizes", label: "Pódio dos Hotéis", icon: Building2 },
  { key: "walker_prizes", label: "Pódio dos Passeadores", icon: Footprints },
];

const emptyPositions = () =>
  PODIUM_POSITIONS.map((position) => ({ position, title: "", description: "", image_url: "" }));

const readPositions = (list) =>
  PODIUM_POSITIONS.map((position) => {
    const match = (Array.isArray(list) ? list : []).find((prize) => Number(prize?.position) === position);
    return {
      position,
      title: match?.title || "",
      description: match?.description || "",
      image_url: match?.image_url || "",
    };
  });

/** Prémios mensais dos pódios de hotéis e passeadores. */
export default function AdminPodiumPrizes() {
  const queryClient = useQueryClient();
  const [monthKey, setMonthKey] = useState(getMonthKey);
  const [prizes, setPrizes] = useState({
    hotel_prizes: emptyPositions(),
    walker_prizes: emptyPositions(),
  });
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { data: record = null, isLoading } = useQuery({
    queryKey: ["adminMonthlyPodiumPrize", monthKey],
    queryFn: async () => {
      const rows = await base44.entities.MonthlyPodiumPrize.filter({ month_key: monthKey });
      return rows[0] || null;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isLoading) return;
    setPrizes({
      hotel_prizes: readPositions(record?.hotel_prizes),
      walker_prizes: readPositions(record?.walker_prizes),
    });
    setIsActive(record?.is_active !== false);
  }, [record, isLoading]);

  const updatePrize = (categoryKey, position, field, value) => {
    setPrizes((prev) => ({
      ...prev,
      [categoryKey]: prev[categoryKey].map((prize) =>
        prize.position === position ? { ...prize, [field]: value } : prize
      ),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const clean = (list) =>
      list.map((prize) => ({
        position: prize.position,
        title: prize.title.trim(),
        description: prize.description.trim(),
        image_url: prize.image_url.trim(),
      }));

    try {
      const payload = {
        month_key: monthKey,
        month_label: getMonthLabel(monthKey),
        is_active: isActive,
        hotel_prizes: clean(prizes.hotel_prizes),
        walker_prizes: clean(prizes.walker_prizes),
      };

      if (record?.id) {
        await base44.entities.MonthlyPodiumPrize.update(record.id, payload);
      } else {
        await base44.entities.MonthlyPodiumPrize.create(payload);
      }

      queryClient.invalidateQueries({ queryKey: ["adminMonthlyPodiumPrize", monthKey] });
      queryClient.invalidateQueries({ queryKey: ["monthlyPodiumPrize", monthKey] });
      toast.success(`Prémios dos pódios de ${getMonthLabel(monthKey)} guardados`);
    } catch (error) {
      toast.error(error?.message || "Não foi possível guardar os prémios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div>
            <p className="flex items-center gap-2 text-lg font-black text-slate-900">
              <Trophy className="h-5 w-5 text-teal-600" /> Prémios dos pódios de profissionais
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Os três profissionais de cada categoria com mais avaliações recebidas no mês sobem ao pódio. Defina aqui o
              prémio de cada lugar.
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
        <div className="space-y-4">
          {CATEGORIES.map((category) => (
            <div key={category.key} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-black text-slate-900">
                <category.icon className="h-4 w-4 text-teal-600" /> {category.label}
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {prizes[category.key].map((prize) => (
                  <div key={prize.position} className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
                      {prize.position}º lugar
                    </span>

                    <Input
                      placeholder="Nome do prémio"
                      value={prize.title}
                      onChange={(event) => updatePrize(category.key, prize.position, "title", event.target.value)}
                      className="rounded-xl bg-white"
                    />

                    <Textarea
                      placeholder="Descrição curta do prémio"
                      value={prize.description}
                      onChange={(event) => updatePrize(category.key, prize.position, "description", event.target.value)}
                      rows={2}
                      className="resize-none rounded-xl bg-white"
                    />

                    <Input
                      placeholder="URL da imagem (opcional)"
                      value={prize.image_url}
                      onChange={(event) => updatePrize(category.key, prize.position, "image_url", event.target.value)}
                      className="rounded-xl bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}