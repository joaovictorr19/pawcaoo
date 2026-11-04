import React from "react";
import { Check, PawPrint } from "lucide-react";

const SIZE_LABELS = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  extra_large: "Extra Grande",
};

/**
 * Lista de seleção de animais — usada em todos os fluxos de reserva
 * (hotel, passeador/treinador e pedido de passeio).
 *
 * `tap-stable` anula a escala global aplicada ao toque: o cartão nunca
 * muda de tamanho ao selecionar. O animal escolhido fica com superfície
 * sólida na cor da marca e marca de confirmação branca.
 */
export default function AnimalSelectList({ dogs = [], selectedIds = [], onToggle }) {
  return (
    <div className="space-y-2">
      {dogs.map((dog) => {
        const isSelected = selectedIds.includes(dog.id);
        return (
          <button
            key={dog.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(dog)}
            className={`tap-stable w-full flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-colors duration-150 ${
              isSelected
                ? "border-[#0d9483] bg-[#0d9483] shadow-[0_10px_24px_-10px_rgba(13,148,131,0.8)]"
                : "border-slate-200 bg-white shadow-[0_2px_8px_-3px_rgba(15,23,42,0.18)]"
            }`}
          >
            {dog.photo_url ? (
              <img
                src={dog.photo_url}
                alt={dog.dog_name}
                className={`w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ${
                  isSelected ? "ring-white/50" : "ring-black/5"
                }`}
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <PawPrint className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-slate-900"}`}>
                {dog.dog_name}
              </p>
              <p className={`text-[11px] truncate ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                {isSelected ? "Selecionado" : (dog.breed || SIZE_LABELS[dog.size] || "Animal")}
              </p>
            </div>
            <span
              className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                isSelected ? "border-white bg-white" : "border-slate-300 bg-white"
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5 text-[#0d9483] stroke-[3.5]" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}