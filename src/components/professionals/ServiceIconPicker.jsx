import React from "react";
import {
  PawPrint, Footprints, Bone, Heart, Award, Trophy, BedDouble, Home,
  Calendar, Clock, Sparkles, Scissors, Bath, Droplet, Dumbbell, Baby,
  ShieldCheck, Stethoscope, Sun, Moon, Zap, Camera, Coffee,
} from "lucide-react";

const SERVICE_ICONS = [
  { name: "PawPrint", Icon: PawPrint },
  { name: "Footprints", Icon: Footprints },
  { name: "Bone", Icon: Bone },
  { name: "Heart", Icon: Heart },
  { name: "Award", Icon: Award },
  { name: "Trophy", Icon: Trophy },
  { name: "BedDouble", Icon: BedDouble },
  { name: "Home", Icon: Home },
  { name: "Calendar", Icon: Calendar },
  { name: "Clock", Icon: Clock },
  { name: "Sparkles", Icon: Sparkles },
  { name: "Scissors", Icon: Scissors },
  { name: "Bath", Icon: Bath },
  { name: "Droplet", Icon: Droplet },
  { name: "Dumbbell", Icon: Dumbbell },
  { name: "Baby", Icon: Baby },
  { name: "ShieldCheck", Icon: ShieldCheck },
  { name: "Stethoscope", Icon: Stethoscope },
  { name: "Sun", Icon: Sun },
  { name: "Moon", Icon: Moon },
  { name: "Zap", Icon: Zap },
  { name: "Camera", Icon: Camera },
  { name: "Coffee", Icon: Coffee },
];

export const SERVICE_ICON_MAP = Object.fromEntries(
  SERVICE_ICONS.map(({ name, Icon }) => [name, Icon])
);

export function getServiceIcon(iconName, fallback) {
  return (iconName && SERVICE_ICON_MAP[iconName]) || fallback || PawPrint;
}

export default function ServiceIconPicker({ value, onChange, variant = "light" }) {
  const unselectedCls =
    variant === "dark"
      ? "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
      : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent";
  const labelCls =
    variant === "dark"
      ? "text-[10px] font-bold text-slate-400 uppercase tracking-wider"
      : "text-xs font-bold text-slate-600 uppercase tracking-wider";

  return (
    <div>
      <label className={`${labelCls} block mb-2`}>
        Ícone do Serviço
      </label>
      <div className="grid grid-cols-7 sm:grid-cols-8 gap-2">
        {SERVICE_ICONS.map(({ name, Icon }) => (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
              value === name
                ? "bg-orange-500 text-white shadow-md scale-105 border border-orange-400"
                : unselectedCls
            }`}
            title={name}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </div>
    </div>
  );
}