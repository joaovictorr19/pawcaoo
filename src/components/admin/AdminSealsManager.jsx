import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Search, Building2, Award, Shield, GraduationCap, Save, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { SEAL_DEFAULTS, getProfileSeals, sealToBorderStyle, sealToBadgeStyle } from "@/hooks/useSealConfiguration";

const SEAL_ICONS = {
  hotel_canino: Building2,
  parceiro_pawgo: Award,
  equipa_pawcao: Shield,
  treinador_verificado: GraduationCap,
};

const SHADOW_LABELS = {
  none: "Nenhuma",
  subtle: "Subtil",
  medium: "Média",
  strong: "Forte",
};

export default function AdminSealsManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeal, setSelectedSeal] = useState("hotel_canino");
  const [editConfig, setEditConfig] = useState(null);

  // Fetch all WalkerProfiles for seal assignment management
  const { data: allWalkers = [], isLoading } = useQuery({
    queryKey: ["allWalkersSeals"],
    placeholderData: keepPreviousData,
    queryFn: () => base44.entities.WalkerProfile.list("-created_date", 5000),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch SealConfiguration records
  const { data: sealConfigs = {} } = useQuery({
    queryKey: ["sealConfigurations"],
    queryFn: async () => {
      try {
        const records = await base44.entities.SealConfiguration.list("-created_date", 50);
        const map = {};
        for (const r of (records || [])) {
          map[r.seal_type] = { ...SEAL_DEFAULTS[r.seal_type], ...r };
        }
        return map;
      } catch {
        return {};
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Filtered walkers by search term
  const filteredWalkers = useMemo(() => {
    if (!searchTerm.trim()) return allWalkers;
    const term = searchTerm.toLowerCase();
    return allWalkers.filter(w =>
      (w.walker_name || "").toLowerCase().includes(term) ||
      (w.hotel_details?.hotel_name || "").toLowerCase().includes(term) ||
      (w.created_by || "").toLowerCase().includes(term)
    );
  }, [allWalkers, searchTerm]);

  // Seal assignment counts
  const sealCounts = useMemo(() => {
    const counts = { hotel_canino: 0, parceiro_pawgo: 0, equipa_pawcao: 0, treinador_verificado: 0 };
    for (const w of allWalkers) {
      const seals = getProfileSeals(w);
      for (const s of seals) counts[s]++;
    }
    return counts;
  }, [allWalkers]);

  // Load config for editing when seal selection changes
  const currentConfig = editConfig || sealConfigs[selectedSeal] || SEAL_DEFAULTS[selectedSeal];

  // Toggle a seal on a walker profile
  const toggleSealMutation = useMutation({
    mutationFn: async ({ walker, sealType, newValue }) => {
      const updates = {};
      if (sealType === "hotel_canino") {
        updates.professional_type = newValue ? "hotel" : "walker";
      } else if (sealType === "parceiro_pawgo") {
        updates.has_pawcao_seal = newValue;
      } else if (sealType === "equipa_pawcao") {
        updates.is_pawcao_employee = newValue;
        if (newValue) updates.has_pawcao_seal = true;
      } else if (sealType === "treinador_verificado") {
        updates.is_verified_trainer = newValue;
      }
      await base44.entities.WalkerProfile.update(walker.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allWalkersSeals"] });
      queryClient.invalidateQueries({ queryKey: ["walkers"] });
      queryClient.invalidateQueries({ queryKey: ["sealConfigurations"] });
    },
    onError: (error) => toast.error("Erro: " + (error.message || "Erro desconhecido")),
  });

  // Save seal visual configuration
  const saveConfigMutation = useMutation({
    mutationFn: async (config) => {
      const existing = await base44.entities.SealConfiguration.filter({ seal_type: config.seal_type });
      if (existing?.length > 0) {
        await base44.entities.SealConfiguration.update(existing[0].id, config);
      } else {
        await base44.entities.SealConfiguration.create(config);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sealConfigurations"] });
      toast.success("Configuração de selo guardada!");
    },
    onError: (error) => toast.error("Erro: " + (error.message || "Erro ao guardar")),
  });

  const handleToggleSeal = (walker, sealType, currentValue) => {
    toggleSealMutation.mutate({ walker, sealType, newValue: !currentValue });
  };

  const handleSaveConfig = () => {
    saveConfigMutation.mutate(currentConfig);
  };

  const handleResetConfig = () => {
    setEditConfig({ ...SEAL_DEFAULTS[selectedSeal] });
    toast.info("Configuração resetada para os defaults");
  };

  const handleSealSelect = (sealType) => {
    setSelectedSeal(sealType);
    setEditConfig(null); // Reset to use fetched config or default
  };

  const updateConfigField = (field, value) => {
    setEditConfig({ ...currentConfig, [field]: value });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* LEFT: Seal Assignments */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" /> Atribuição de Selos
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Alterna os selos por profissional</p>
        </div>

        {/* Seal count summary */}
        <div className="grid grid-cols-4 gap-2 px-5 py-3 border-b border-slate-100">
          {Object.keys(SEAL_DEFAULTS).map((sealType) => {
            const Icon = SEAL_ICONS[sealType];
            const config = sealConfigs[sealType] || SEAL_DEFAULTS[sealType];
            const isActive = selectedSeal === sealType;
            return (
              <button
                key={sealType}
                onClick={() => handleSealSelect(sealType)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${isActive ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <Icon className="w-4 h-4" style={{ color: config.border_color }} />
                <span className="text-base font-black text-slate-900">{sealCounts[sealType]}</span>
                <span className="text-[9px] font-bold text-slate-500 leading-tight text-center">{config.badge_label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Pesquisar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Walker list with toggles */}
        <div className="flex-1 overflow-y-auto max-h-[520px]">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : filteredWalkers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">Nenhum profissional encontrado.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filteredWalkers.slice(0, 100).map(walker => {
                const seals = getProfileSeals(walker);
                const name = walker.hotel_details?.hotel_name || walker.walker_name || walker.created_by || "Sem nome";
                return (
                  <div key={walker.id} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{walker.created_by || "—"}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {Object.keys(SEAL_DEFAULTS).map(sealType => {
                          const Icon = SEAL_ICONS[sealType];
                          const config = sealConfigs[sealType] || SEAL_DEFAULTS[sealType];
                          const hasSeal = seals.includes(sealType);
                          return (
                            <button
                              key={sealType}
                              onClick={() => handleToggleSeal(walker, sealType, hasSeal)}
                              disabled={toggleSealMutation.isPending}
                              title={config.badge_label}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${hasSeal ? "border-transparent shadow-sm" : "border-slate-200 bg-slate-50 opacity-40 hover:opacity-70"}`}
                              style={hasSeal ? { backgroundColor: config.border_color, color: "#fff" } : {}}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredWalkers.length > 100 && (
                <div className="px-5 py-3 text-center text-xs text-slate-400">A mostrar primeiros 100 resultados. Use a pesquisa para filtrar.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Visual Configuration Editor */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-teal-600" /> Configuração Visual
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Personaliza a borda e o efeito de cada selo</p>
        </div>

        {/* Seal selector tabs */}
        <div className="flex gap-2 px-5 py-3 border-b border-slate-100">
          {Object.keys(SEAL_DEFAULTS).map(sealType => {
            const Icon = SEAL_ICONS[sealType];
            const config = sealConfigs[sealType] || SEAL_DEFAULTS[sealType];
            const isActive = selectedSeal === sealType;
            return (
              <button
                key={sealType}
                onClick={() => handleSealSelect(sealType)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${isActive ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                style={isActive ? { backgroundColor: config.border_color } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.badge_label}
              </button>
            );
          })}
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Live preview */}
          <div className="rounded-2xl border-2 border-dashed border-slate-100 p-4 bg-slate-50/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Pré-visualização</p>
            <div
              className="bg-white rounded-2xl overflow-hidden max-w-[200px] mx-auto transition-all"
              style={sealToBorderStyle(currentConfig, false) || {}}
            >
              <div className="relative w-full h-28 bg-slate-100 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-slate-400" />
                </div>
                <span
                  className="absolute top-2 left-2 text-[9px] font-black text-white px-2.5 py-1 rounded-full uppercase tracking-tighter shadow-md"
                  style={sealToBadgeStyle(currentConfig) || {}}
                >
                  {currentConfig?.badge_label}
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-slate-900">Nome do Profissional</p>
                <p className="text-[10px] text-slate-400">Lisboa</p>
              </div>
            </div>
          </div>

          {/* Badge label */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Etiqueta do Selo</Label>
            <Input
              value={currentConfig?.badge_label || ""}
              onChange={(e) => updateConfigField("badge_label", e.target.value)}
              className="h-9 text-sm"
              placeholder="Hotel Canino"
            />
          </div>

          {/* Border color */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Cor da Borda</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentConfig?.border_color || "#7c3aed"}
                onChange={(e) => updateConfigField("border_color", e.target.value)}
                className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer bg-white"
              />
              <Input
                value={currentConfig?.border_color || ""}
                onChange={(e) => updateConfigField("border_color", e.target.value)}
                className="h-9 text-sm flex-1 font-mono"
                placeholder="#7c3aed"
              />
            </div>
          </div>

          {/* Border width */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Largura da Borda: {currentConfig?.border_width}px</Label>
            <input
              type="range"
              min="1"
              max="6"
              value={currentConfig?.border_width || 1}
              onChange={(e) => updateConfigField("border_width", parseInt(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>

          {/* Shadow style */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Estilo da Sombra</Label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(SHADOW_LABELS).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => updateConfigField("shadow_style", value)}
                  className={`px-2 py-2 rounded-lg border text-[11px] font-bold transition-all ${currentConfig?.shadow_style === value ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Glow intensity */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Intensidade do Brilho: {currentConfig?.glow_intensity || 0}%</Label>
            <input
              type="range"
              min="0"
              max="100"
              value={currentConfig?.glow_intensity || 0}
              onChange={(e) => updateConfigField("glow_intensity", parseInt(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveConfig}
              disabled={saveConfigMutation.isPending}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white gap-2"
            >
              <Save className="w-4 h-4" /> Guardar
            </Button>
            <Button
              onClick={handleResetConfig}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}