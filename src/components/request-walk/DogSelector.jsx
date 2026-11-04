import React from "react";
import { PlusCircle } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import AnimalSelectList from "@/components/booking/AnimalSelectList";

export default function DogSelector({ dogs, selectedDogIds, onToggle }) {
  const navigate = useNavigate();

  if (!dogs || dogs.length === 0) {
    return (
      <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl">
        <p className="text-slate-500 text-sm mb-3">Ainda não tens animais registados.</p>
        <button
          onClick={() => navigate(createPageUrl("AnimalProfile"))}
          className="text-[#0d9483] font-semibold text-sm flex items-center gap-1 mx-auto hover:underline"
        >
          <PlusCircle className="w-4 h-4" />
          Adicionar Animal
        </button>
      </div>
    );
  }

  return (
    <AnimalSelectList
      dogs={dogs}
      selectedIds={selectedDogIds}
      onToggle={onToggle}
    />
  );
}