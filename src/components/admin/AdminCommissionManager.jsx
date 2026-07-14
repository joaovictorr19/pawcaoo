import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Percent, Gift, Calendar, Save, Info } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_RATE = 10;

export default function AdminCommissionManager({ professionalProfile, professionalType, userToEdit }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState("default");
  const [customRate, setCustomRate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [zeroMonths, setZeroMonths] = useState(3);

  useEffect(() => {
    if (!professionalProfile) return;
    setMode(professionalProfile.commission_rate_mode || "default");
    setCustomRate(
      professionalProfile.custom_commission_rate != null
        ? String(professionalProfile.custom_commission_rate)
        : ""
    );
    setExpiryDate(professionalProfile.commission_rate_expiry || "");
  }, [professionalProfile]);

  const effectiveRate = (() => {
    if (mode === "zero" || mode === "zero_temporary") return 0;
    if (mode === "custom_percent" && customRate) return Number(customRate);
    if (professionalProfile?.exempt_from_platform_fees) return 0;
    return DEFAULT_RATE;
  })();

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!professionalProfile?.id) return;
      const payload = {
        commission_rate_mode: mode,
        custom_commission_rate: mode === "custom_percent" ? Number(customRate) : null,
        commission_rate_expiry: mode === "zero_temporary" ? expiryDate : null,
      };

      if (mode === "zero" || mode === "zero_temporary") {
        payload.exempt_from_platform_fees = true;
      } else {
        payload.exempt_from_platform_fees = false;
      }

      await base44.entities.WalkerProfile.update(professionalProfile.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAccountEditor", userToEdit?.id] });
      queryClient.invalidateQueries({ queryKey: ["allWalkersAdmin"] });
      toast.success("Taxa de comissão atualizada com sucesso.");
    },
    onError: (error) => toast.error(error.message || "Erro ao atualizar taxa."),
  });

  const applyZeroMonths = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + Number(zeroMonths));
    setExpiryDate(d.toISOString().split("T")[0]);
    setMode("zero_temporary");
  };

  const modes = [
    { value: "default", label: "Padrão", desc: `${DEFAULT_RATE}% por transação`, icon: Percent, color: "bg-slate-100 text-slate-700 border-slate-300" },
    { value: "custom_percent", label: "Personalizada", desc: "Escolher % por transação", icon: Percent, color: "bg-blue-50 text-blue-700 border-blue-300" },
    { value: "zero", label: "Taxa Zero", desc: "Sem comissão (permanente)", icon: Gift, color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
    { value: "zero_temporary", label: "Zero Temporário", desc: "Taxa zero por X meses", icon: Calendar, color: "bg-amber-50 text-amber-700 border-amber-300" },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 flex gap-3">
        <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-teal-900">Taxa de Comissão da Plataforma</p>
          <p className="text-xs text-teal-700 mt-1">
            Define quanto a plataforma retém de cada transação deste profissional. Pode aplicar taxa zero temporária para ofertas promocionais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = mode === m.value;
          return (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${isActive ? "border-teal-500 bg-teal-50 shadow-sm" : `border-slate-200 ${m.color} hover:border-slate-300`}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-bold">{m.label}</span>
              </div>
              <p className="text-[11px] text-slate-500">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {mode === "custom_percent" && (
        <div className="space-y-2">
          <Label>Percentual de comissão por transação (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              placeholder="Ex: 5"
              className="max-w-[120px]"
            />
            <span className="text-sm font-bold text-slate-600">%</span>
            <div className="flex gap-1 ml-2">
              {[0, 5, 10, 15].map((r) => (
                <Button key={r} size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setCustomRate(String(r))}>
                  {r}%
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "zero_temporary" && (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="space-y-2">
            <Label>Oferta: Taxa zero por X meses</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="24"
                value={zeroMonths}
                onChange={(e) => setZeroMonths(e.target.value)}
                className="max-w-[80px]"
              />
              <span className="text-sm font-bold text-slate-600">meses</span>
              <Button size="sm" variant="outline" className="ml-2" onClick={applyZeroMonths}>
                Aplicar
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Data de expiração (reverte para padrão)</Label>
            <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
          </div>
          {expiryDate && (
            <p className="text-xs text-amber-700">
              A taxa reverte automaticamente para {DEFAULT_RATE}% em {new Date(expiryDate).toLocaleDateString("pt-PT")}
            </p>
          )}
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Taxa efetiva atual</p>
          <p className="text-3xl font-black text-slate-900">{effectiveRate}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Por transação</p>
          {professionalProfile?.exempt_from_platform_fees && mode !== "zero" && mode !== "zero_temporary" && (
            <Badge className="bg-emerald-100 text-emerald-700 mt-1">Isento (legacy)</Badge>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || (mode === "custom_percent" && !customRate)} className="bg-teal-600 hover:bg-teal-700">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar taxa de comissão
        </Button>
      </div>
    </div>
  );
}