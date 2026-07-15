import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Heart, Syringe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "XL" };
const ANIMAL_EMOJI = { dog: "🐶", cat: "🐱", reptile: "🦎", arachnid: "🕷️", rodent: "🐹", bird: "🐦" };

export default function MyDogsManager({ userEmail }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: dogs = [], isLoading } = useQuery({
    queryKey: ['myDogs', userEmail],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: userEmail }),
    enabled: !!userEmail,
  });

  const deleteMutation = useMutation({
    mutationFn: (dogId) => base44.entities.DogProfile.delete(dogId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myDogs']);
      queryClient.invalidateQueries(['clientDogs']);
      toast.success("Animal removido");
    },
    onError: () => toast.error("Erro ao remover animal"),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-400" /> Os meus animais
        </h2>
        <Button
          onClick={() => navigate(createPageUrl('EditAnimalProfile'))}
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dogs.length === 0 ? (
        <Card className="bg-slate-900 border border-white/5 border-dashed">
          <CardContent className="py-12 text-center">
            <span className="text-5xl">🐾</span>
            <p className="text-slate-400 mt-3 mb-4">Ainda não tens animais registados</p>
            <Button
              onClick={() => navigate(createPageUrl('EditAnimalProfile'))}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold"
            >
              Registar primeiro animal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {dogs.map(dog => (
            <Card key={dog.id} className="bg-slate-900 border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer" onClick={() => navigate(createPageUrl(`AnimalProfile?id=${dog.id}`))}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {dog.photo_url
                      ? <img src={dog.photo_url} className="w-full h-full object-cover" alt={dog.dog_name} />
                      : <span className="text-2xl">{ANIMAL_EMOJI[dog.animal_type] || "🐾"}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white">{dog.dog_name}</p>
                        <p className="text-xs text-slate-400">
                          {dog.breed || "Raça desconhecida"} • {SIZE_LABELS[dog.size] || dog.size || "—"}
                        </p>
                        {dog.age != null && (
                          <p className="text-xs text-slate-500">{dog.age} ano{dog.age !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(createPageUrl(`EditAnimalProfile?id=${dog.id}`))}
                          className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remover ${dog.dog_name}?`)) deleteMutation.mutate(dog.id);
                          }}
                          className="w-7 h-7 bg-red-500/10 rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                    {dog.is_vaccinated && (
                      <p className="text-xs text-green-400 flex items-center gap-1 mt-1.5">
                        <Syringe className="w-3 h-3" /> Vacinado
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}