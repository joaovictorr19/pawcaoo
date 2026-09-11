import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Default visual configs per seal type — used when no SealConfiguration record exists
export const SEAL_DEFAULTS = {
  hotel_canino: {
    seal_type: "hotel_canino",
    border_color: "#7c3aed",
    shadow_style: "subtle",
    glow_intensity: 0,
    border_width: 1,
    badge_label: "Hotel Canino",
    badge_icon: "Building2",
  },
  parceiro_pawgo: {
    seal_type: "parceiro_pawgo",
    border_color: "#f59e0b",
    shadow_style: "subtle",
    glow_intensity: 0,
    border_width: 1,
    badge_label: "Parceiro PawGo",
    badge_icon: "Award",
  },
  equipa_pawcao: {
    seal_type: "equipa_pawcao",
    border_color: "#10b981",
    shadow_style: "medium",
    glow_intensity: 20,
    border_width: 2,
    badge_label: "Equipa PawCão",
    badge_icon: "Shield",
  },
  treinador_verificado: {
    seal_type: "treinador_verificado",
    border_color: "#4f46e5",
    shadow_style: "subtle",
    glow_intensity: 0,
    border_width: 1,
    badge_label: "Treinador Verificado",
    badge_icon: "GraduationCap",
  },
};

// Determines which seals apply to a given WalkerProfile
export function getProfileSeals(walker) {
  const seals = [];
  if (walker?.professional_type === "hotel") seals.push("hotel_canino");
  if (walker?.has_pawcao_seal) seals.push("parceiro_pawgo");
  if (walker?.is_pawcao_employee) seals.push("equipa_pawcao");
  if (walker?.is_verified_trainer) seals.push("treinador_verificado");
  return seals;
}

// Build an inline style object from a seal config for the card border
export function sealToBorderStyle(config, isHovered = false) {
  if (!config) return null;
  const shadowMap = {
    none: "none",
    subtle: `0 2px 12px ${hexToRgba(config.border_color, isHovered ? 0.20 : 0.08)}`,
    medium: `0 4px 20px ${hexToRgba(config.border_color, isHovered ? 0.28 : 0.14)}`,
    strong: `0 8px 30px ${hexToRgba(config.border_color, isHovered ? 0.36 : 0.20)}`,
  };
  const glow = config.glow_intensity > 0
    ? `, 0 0 ${config.glow_intensity / 3}px ${hexToRgba(config.border_color, config.glow_intensity / 100)}`
    : "";
  return {
    borderColor: hexToRgba(config.border_color, 0.25),
    borderWidth: `${config.border_width}px`,
    boxShadow: shadowMap[config.shadow_style] + glow,
  };
}

// Build a badge style (for the category label on the card)
export function sealToBadgeStyle(config) {
  if (!config) return null;
  return {
    backgroundColor: config.border_color,
  };
}

function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== "string") return `rgba(0,0,0,${alpha})`;
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Hook: fetches all SealConfiguration records, merges with defaults
export function useSealConfiguration() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
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
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const getConfig = (sealType) => {
    if (!sealType) return null;
    return data?.[sealType] || SEAL_DEFAULTS[sealType] || null;
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sealConfigurations"] });
  };

  return { sealConfigs: data || {}, getConfig, isLoading, invalidate };
}