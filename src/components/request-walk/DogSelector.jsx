import React from "react";
import { Check, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

const sizeLabels = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  extra_large: "Extra Grande"
};

export default function DogSelector({ dogs, selectedDogIds, onToggle }) {
  const navigate = useNavigate();

  if (!dogs || dogs.length === 0) {
    return (
      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-2xl">
        <p className="text-gray-500 text-sm mb-3">Ainda não tens animais registados.</p>
        <button
          onClick={() => navigate(createPageUrl("AnimalProfile"))}
          className="text-green-600 font-semibold text-sm flex items-center gap-1 mx-auto hover:underline"
        >
          <PlusCircle className="w-4 h-4" />
          Adicionar Animal
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {dogs.map((dog) => {
        const isSelected = selectedDogIds.includes(dog.id);
        return (
          <button
            key={dog.id}
            onClick={() => onToggle(dog)}
            className={cn(
              "relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all text-left",
              isSelected
                ? "border-green-500 bg-green-50 shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            )}
          >
            {isSelected && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </span>
            )}
            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {dog.photo_url ? (
                <img src={dog.photo_url} alt={dog.dog_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
              )}
            </div>
            <div className="text-center w-full">
              <p className="font-semibold text-gray-800 text-sm truncate">{dog.dog_name}</p>
              <p className="text-xs text-gray-500">{dog.breed || sizeLabels[dog.size] || "Animal"}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}