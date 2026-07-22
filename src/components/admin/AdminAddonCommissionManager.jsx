import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Package, Info, Percent } from "lucide-react";
import { toast } from "sonner";

export default function AdminAddonCommissionManager() {
  const queryClient = useQueryClient();
  const [rate, setRate] = useState("2");
  const [saving, setSaving] = useState(false);

  const { data: setting, isLoading } = useQuery({
    queryKey: ["platformSetting", "hotel_addon_commission_rate"],
    queryFn: async () => {
      const results = await base44.entities.PlatformSetting.filter({
        key: "hotel_addon_commission_rate",
      });
      return results?.[0] || null;
    },
    staleTime: 30 * 1000,
  });

  React.useEffect(() => {
    if (setting) setRate(String(setting.value));
  }, [setting]);

  const handleSave = async () => {
    const numRate = Number(rate);
    if (isNaN(numRate) || numRate < 0 || numRate > 100) {
      toast.error("Insere uma percentagem válida (0-100)");
      return;
    }
    setSaving(true);
    try {
      if (setting) {
        await base44.entities.PlatformSetting.update(setting.id, { value: numRate });
      } else {
        await base44.entities.PlatformSetting.create({
          key: "hotel_addon_commission_rate",
          value: numRate,
          label: "Comissão de Produtos e Serviços do Hotel",
          description: "Percentagem aplicada sobre vendas de produtos e serviços extra durante estadias de hotel",
          category: "commission",
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["platformSetting"] });
      toast.success(`Comissão atualizada para ${numRate}%`);
    } catch (e) {
      toast.error(e.message || "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 flex gap-3">
        <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-teal-900">Comissão sobre Produtos e Serviços de Hotel</p>
          <p className="text-xs text-teal-700 mt-1">
            Esta percentagem é aplicada sobre todas as vendas de produtos (ração, brinquedos, acessórios) e serviços extra (banhos, passeios, grooming) faturados durante estadias de hotel. A comissão é retida pela plataforma e o hotel recebe o valor líquido.
          </p>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-600">Percentagem de comissão (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="max-w-[120px] rounded-xl"
            />
            <span className="text-sm font-bold text-slate-600">%</span>
          </div>
        </div>
        <div className="flex gap-1">
          {[0, 2, 5, 10].map((r) => (
            <button
              key={r}
              onClick={() => setRate(String(r))}
              className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-medium"
            >
              {r}%
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center">
            <Percent className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Taxa ativa</p>
            <p className="text-2xl font-black text-slate-900">{rate}%</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400">Por venda de produto/serviço</p>
          <p className="text-[10px] text-slate-400">Hotel recebe {100 - Number(rate || 0)}%</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-teal-600 hover:bg-teal-700"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
          Guardar comissão
        </Button>
      </div>
    </div>
  );
}