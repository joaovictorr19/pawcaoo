import React from "react";
import { MapPin, Home, Trees, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const methods = [
  {
    id: "walker_pickup",
    icon: MapPin,
    title: "Recolha em Casa",
    description: "O passeador vai buscar o(s) teu(s) animal(ais) à tua morada.",
    color: "green"
  },
  {
    id: "owner_dropoff",
    icon: Home,
    title: "Eu Levo o Animal",
    description: "Levas o(s) animal(ais) a um ponto de encontro acordado.",
    color: "blue"
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = pickupMethod === method.id;
          return (
            <button
              key={method.id}
              onClick={() => onMethodChange(method.id)}
              className={cn(
                "flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                isSelected && method.color === "green"
                  ? "border-green-500 bg-green-50"
                  : isSelected && method.color === "blue"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                isSelected && method.color === "green" ? "bg-green-500" :
                isSelected && method.color === "blue" ? "bg-blue-500" : "bg-gray-100"
              )}>
                <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-gray-500")} />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{method.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{method.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dropoff type sub-selection */}
      {pickupMethod === "owner_dropoff" && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Tipo de local de entrega:</p>
          <div className="flex flex-wrap gap-2">
            {dropoffTypes.map((dt) => {
              const Icon = dt.icon;
              const isSelected = dropoffLocationType === dt.id;
              return (
                <button
                  key={dt.id}
                  onClick={() => onDropoffTypeChange(dt.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium transition-all",
                    isSelected
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
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