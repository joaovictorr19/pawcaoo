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
 * O cartão tem exatamente as mesmas dimensões nos dois estados: a moldura
 * mantém 2px e o quadrado de marcação tem tamanho fixo, por isso nada salta
 * ou muda de forma ao tocar. Superfície sólida e sombra dão profundidade;
 * o estado escolhido pinta o cartão e levanta-o da página.
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
            className={`w-full flex items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-all duration-200 ${
              isSelected
                ? "border-[#0d9483] bg-[#0d9483]/12 shadow-[0_10px_22px_-12px_rgba(13,148,131,0.65)]"
                : "border-slate-200 bg-white shadow-[0_2px_6px_-2px_rgba(15,23,42,0.12)]"
            }`}
          >
            {dog.photo_url ? (
              <img
                src={dog.photo_url}
                alt={dog.dog_name}
                className="w-10 h-10 rounded-xl object-cover shrink-0 ring-1 ring-black/5"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-[#0d9483] text-white" : "bg-slate-100 text-slate-400"
                }`}
              >
                <PawPrint className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{dog.dog_name}</p>
              <p className="text-[11px] text-slate-500 truncate">
                {dog.breed || SIZE_LABELS[dog.size] || "Animal"}
              </p>
            </div>
            <span
              className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
                isSelected
                  ? "border-[#0d9483] bg-[#0d9483] shadow-[0_2px_6px_-1px_rgba(13,148,131,0.6)]"
                  : "border-slate-300 bg-white"
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-white stroke-[3.5]" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}