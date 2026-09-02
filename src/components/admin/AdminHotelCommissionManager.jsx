import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Percent, Gift, Calendar, Hotel, Search, Store } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_RATE = 10;

const MODE_LABELS = {
  default: { label: "Padrão", color: "bg-slate-100 text-slate-700", rate: DEFAULT_RATE },
  custom_percent: { label: "Personalizada", color: "bg-blue-100 text-blue-700" },
  zero: { label: "Taxa Zero", color: "bg-emerald-100 text-emerald-700", rate: 0 },
  zero_temporary: { label: "Zero Temporário", color: "bg-amber-100 text-amber-700", rate: 0 },
};

function getEffectiveRate(hotel) {
  const mode = hotel.commission_rate_mode || "default";
  if (mode === "zero" || mode === "zero_temporary") return 0;
  if (mode === "custom_percent") return hotel.custom_commission_rate ?? DEFAULT_RATE;
  if (hotel.exempt_from_platform_fees) return 0;
  return DEFAULT_RATE;
}

function HotelCommissionRow({ hotel }) {
  const queryClient = useQueryClient();
  const isShop = hotel.professional_type === "shop";
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState(hotel.commission_rate_mode || "default");
  const [customRate, setCustomRate] = useState(
    hotel.custom_commission_rate != null ? String(hotel.custom_commission_rate) : ""
  );
  const [expiryDate, setExpiryDate] = useState(hotel.commission_rate_expiry || "");
  const [borneBy, setBorneBy] = useState(hotel.commission_borne_by || "hotel");
  const [saving, setSaving] = useState(false);

  const effectiveRate = getEffectiveRate(hotel);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        commission_rate_mode: mode,
        custom_commission_rate: mode === "custom_percent" ? Number(customRate) : null,
        commission_rate_expiry: mode === "zero_temporary" ? expiryDate : null,
        exempt_from_platform_fees: mode === "zero" || mode === "zero_temporary",
        ...(isShop ? {} : { commission_borne_by: borneBy }),
      };
      await base44.entities.WalkerProfile.update(hotel.id, payload);
      await queryClient.invalidateQueries({ queryKey: ["adminHotelCommissions"] });
      toast.success(isShop ? "Comissão da loja atualizada." : "Comissão do hotel atualizada.");
      setEditing(false);
    } catch (e) {
      toast.error(e.message || "Erro ao guardar.");
    } finally {
      setSaving(false);
    }
  };

  const modes = [
    { value: "default", label: "Padrão", desc: isShop ? "Taxa global da Loja" : `${DEFAULT_RATE}% do hotel`, icon: Percent },
    { value: "custom_percent", label: "Personalizada", desc: "Escolher %", icon: Percent },
    { value: "zero", label: "Taxa Zero", desc: "Hotel isento", icon: Gift },
    { value: "zero_temporary", label: "Zero Temp.", desc: "Por X tempo", icon: Calendar },
  ];

  const currentMode = MODE_LABELS[hotel.commission_rate_mode || "default"] || MODE_LABELS.default;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
          {isShop ? <Store className="w-5 h-5 text-teal-600" /> : <Hotel className="w-5 h-5 text-teal-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-slate-900 truncate">
              {hotel.hotel_details?.hotel_name || hotel.walker_name || "Sem nome"}
            </p>
            <Badge className={currentMode.color + " text-xs font-bold"}>{currentMode.label}</Badge>
          </div>
          <p className="text-xs text-slate-400 truncate">{hotel.location || "—"} · {hotel.created_by || ""}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span className="text-slate-500">
              Taxa efetiva:{" "}
              <strong className="text-slate-900">
                {isShop && (hotel.commission_rate_mode || "default") === "default"
                  ? "taxa global da Loja"
                  : `${effectiveRate}%`}
              </strong>
            </span>
            {!isShop && (
              <>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">
                  Modelo: <strong className={hotel.commission_borne_by === 'client' ? 'text-orange-600' : 'text-teal-700'}>
                    {hotel.commission_borne_by === 'client' ? 'cliente paga taxa' : 'comissão do hotel'}
                  </strong>
                  {hotel.commission_borne_by === 'client' ? ' (taxa adicionada ao cliente)' : ' (cliente paga só o serviço)'}
                </span>
              </>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditing(!editing)}
          className="rounded-xl flex-shrink-0"
        >
          {editing ? "Fechar" : "Ajustar"}
        </Button>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          {!isShop && (
          <>
          <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
            <p className="text-xs text-teal-800">
              💡 Escolhe <strong>quem paga a comissão</strong> para este hotel. Podes mudar por cada hotel conforme o acordo comercial.
            </p>
          </div>

          {/* Bearer toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBorneBy("hotel")}
              className={"rounded-xl border-2 p-3 text-left transition-all " +
                (borneBy === "hotel" ? "border-teal-500 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300")}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Hotel className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Hotel paga</span>
              </div>
              <p className="text-[10px] text-slate-500">Taxa retirada do hotel · cliente paga só o serviço</p>
            </button>
            <button
              onClick={() => setBorneBy("client")}
              className={"rounded-xl border-2 p-3 text-left transition-all " +
                (borneBy === "client" ? "border-orange-500 bg-orange-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300")}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <Percent className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Cliente paga</span>
              </div>
              <p className="text-[10px] text-slate-500">Taxa adicionada ao cliente · hotel recebe valor cheio</p>
            </button>
          </div>
          </>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {modes.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={"rounded-xl border-2 p-3 text-left transition-all " +
                    (isActive ? "border-teal-500 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300")}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{m.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{m.desc}</p>
                </button>
              );
            })}
          </div>

          {mode === "custom_percent" && (
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-slate-600 whitespace-nowrap">Comissão (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                placeholder="Ex: 5"
                className="max-w-[100px] rounded-xl"
              />
              <span className="text-sm font-bold text-slate-600">%</span>
              <div className="flex gap-1 ml-1">
                {[0, 5, 10, 15].map((r) => (
                  <button key={r} onClick={() => setCustomRate(String(r))}
                    className="h-7 px-2 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "zero_temporary" && (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
              <Label className="text-xs font-bold text-slate-600">Expira em (reverte para padrão)</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="max-w-[200px] rounded-xl" />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-xl bg-teal-600 hover:bg-teal-700">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminHotelCommissionManager() {
  const [search, setSearch] = useState("");

  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ["adminHotelCommissions"],
    queryFn: async () => {
      const [hotelList, shopList] = await Promise.all([
        base44.entities.WalkerProfile.filter({ professional_type: "hotel" }, "-created_date", 200),
        base44.entities.WalkerProfile.filter({ professional_type: "shop" }, "-created_date", 200),
      ]);
      return [
        ...(Array.isArray(hotelList) ? hotelList : []),
        ...(Array.isArray(shopList) ? shopList : []),
      ];
    },
    staleTime: 30 * 1000,
  });

  const filtered = hotels.filter((h) => {
    const q = search.toLowerCase();
    return !q ||
      h.walker_name?.toLowerCase().includes(q) ||
      h.hotel_details?.hotel_name?.toLowerCase().includes(q) ||
      h.location?.toLowerCase().includes(q) ||
      h.created_by?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar hotel ou loja..."
            className="pl-9 rounded-xl border-slate-200"
          />
        </div>
        <span className="text-sm text-slate-500 font-medium">{filtered.length} parceiros</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-12 text-center text-slate-400 text-sm">
          Nenhum hotel encontrado.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((hotel) => (
            <HotelCommissionRow key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}
    </div>
  );
}