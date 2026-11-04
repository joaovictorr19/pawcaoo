import React from "react";
import { MapPin, Home, Trees, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const methods = [
  {
    id: "walker_pickup",
    icon: MapPin,
    title: "Recolha em Casa",
    description: "O Dog Walker vai buscar o(s) teu(s) animal(ais) à tua morada."
  },
  {
    id: "owner_dropoff",
    icon: Home,
    title: "Eu Levo o Animal",
    description: "Levas o(s) animal(ais) a um ponto de encontro acordado."
  }
];

const dropoffTypes = [
  { id: "park", icon: Trees, label: "Parque / Espaço Público" },
  { id: "professional_home", icon: Building2, label: "Casa do Profissional" },
  { id: "other", icon: MapPin, label: "Outro Local" }
];

export default function PickupMethodSelector({ pickupMethod, dropoffLocationType, onMethodChange, onDropoffTypeChange }) {
  return (
    <div className="space-y-4">
      {/* Method Selection */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = pickupMethod === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onMethodChange(method.id)}
              className={cn(
                "tap-stable flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-colors duration-200",
                isSelected
                  ? "border-[#0d9483] bg-[#0d9483]/12 shadow-[0_10px_22px_-12px_rgba(13,148,131,0.65)]"
                  : "border-slate-200 bg-white shadow-[0_2px_6px_-2px_rgba(15,23,42,0.12)]"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                isSelected ? "bg-[#0d9483] shadow-[0_2px_6px_-1px_rgba(13,148,131,0.6)]" : "bg-slate-100"
              )}>
                <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-slate-500")} />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{method.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{method.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dropoff type sub-selection */}
      {pickupMethod === "owner_dropoff" && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">Tipo de local de entrega</p>
          <div className="flex flex-wrap gap-2">
            {dropoffTypes.map((dt) => {
              const Icon = dt.icon;
              const isSelected = dropoffLocationType === dt.id;
              return (
                <button
                  key={dt.id}
                  onClick={() => onDropoffTypeChange(dt.id)}
                  className={cn(
                    "tap-stable flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-xs font-semibold transition-colors duration-200",
                    isSelected
                      ? "border-[#0d9483] bg-[#0d9483] text-white shadow-[0_6px_14px_-6px_rgba(13,148,131,0.8)]"
                      : "border-slate-200 bg-white text-slate-700 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.12)]"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {dt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}