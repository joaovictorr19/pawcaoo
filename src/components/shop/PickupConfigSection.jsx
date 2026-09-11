import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MapPin, Clock, Save, Loader2 } from "lucide-react";

const DAYS = [
  { key: "monday", label: "Segunda" },
  { key: "tuesday", label: "Terça" },
  { key: "wednesday", label: "Quarta" },
  { key: "thursday", label: "Quinta" },
  { key: "friday", label: "Sexta" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const EMPTY_SCHEDULE = DAYS.reduce((acc, d) => {
  acc[d.key] = { open: false, open_time: "10:00", close_time: "18:00" };
  return acc;
}, {});

export default function PickupConfigSection({ shopProfile }) {
  const queryClient = useQueryClient();
  const existing = shopProfile?.shop_pickup_config || {};
  const [config, setConfig] = useState({
    full_address: existing.full_address || "",
    city: existing.city || "",
    postal_code: existing.postal_code || "",
    notes: existing.notes || "",
    weekly_schedule: { ...EMPTY_SCHEDULE, ...(existing.weekly_schedule || {}) },
  });
  const [saving, setSaving] = useState(false);

  const setField = (field, value) => setConfig((c) => ({ ...c, [field]: value }));
  const setDay = (key, field, value) =>
    setConfig((c) => ({
      ...c,
      weekly_schedule: {
        ...c.weekly_schedule,
        [key]: { ...c.weekly_schedule[key], [field]: value },
      },
    }));

  const handleSave = async () => {
    if (!config.full_address?.trim()) {
      toast.error("Indica a morada de recolha");
      return;
    }
    setSaving(true);
    try {
      await base44.entities.WalkerProfile.update(shopProfile.id, { shop_pickup_config: config });
      toast.success("Configuração de recolha guardada");
      queryClient.invalidateQueries({ queryKey: ["myShopProfile"] });
    } catch (e) {
      toast.error("Erro ao guardar a configuração");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
          <MapPin className="w-4 h-4 text-teal-600" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Recolha no local</h3>
          <p className="text-xs text-slate-400">
            Morada e horário só visíveis pelo cliente no momento da compra
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-slate-700">Morada de recolha</label>
        <input
          value={config.full_address}
          onChange={(e) => setField("full_address", e.target.value)}
          placeholder="Rua, número, porta..."
          className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
        />
        <div className="grid grid-cols-2 gap-2.5">
          <input
            value={config.postal_code}
            onChange={(e) => setField("postal_code", e.target.value)}
            placeholder="Código postal"
            className="h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
          <input
            value={config.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="Cidade"
            className="h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
        <textarea
          value={config.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Instruções (ex: porta lateral, interfone) — opcional"
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Clock className="w-3.5 h-3.5 text-teal-600" /> Horário de recolha
        </div>
        <div className="space-y-1.5">
          {DAYS.map((d) => {
            const day = config.weekly_schedule[d.key] || {
              open: false,
              open_time: "10:00",
              close_time: "18:00",
            };
            return (
              <div key={d.key} className="flex items-center gap-2.5 py-1">
                <button
                  type="button"
                  onClick={() => setDay(d.key, "open", !day.open)}
                  className={`w-10 h-6 rounded-full flex items-center transition-all px-0.5 ${
                    day.open ? "bg-teal-600 justify-end" : "bg-slate-200 justify-start"
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
                </button>
                <span
                  className={`text-sm w-20 ${
                    day.open ? "font-semibold text-slate-800" : "text-slate-400"
                  }`}
                >
                  {d.label}
                </span>
                {day.open ? (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="time"
                      value={day.open_time || "10:00"}
                      onChange={(e) => setDay(d.key, "open_time", e.target.value)}
                      className="h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                    <span className="text-xs text-slate-400">–</span>
                    <input
                      type="time"
                      value={day.close_time || "18:00"}
                      onChange={(e) => setDay(d.key, "close_time", e.target.value)}
                      className="h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    />
                  </div>
                ) : (
                  <span className="ml-auto text-xs text-slate-400">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "A guardar..." : "Guardar recolha"}
      </button>
    </div>
  );
}