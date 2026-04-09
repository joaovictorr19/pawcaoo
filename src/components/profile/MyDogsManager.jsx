import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Heart, Syringe } from "lucide-react";
import DogHealthProfileModal from "./DogHealthProfileModal";

const SIZE_LABELS = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "XL" };

export default function MyDogsManager({ userEmail }) {
  const queryClient = useQueryClient();
  const [selectedDog, setSelectedDog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile', userEmail],
    queryFn: () => base44.entities.UserProfile.filter({ user_email: userEmail }),
    enabled: !!userEmail,
  });

  const profile = profiles[0];
  const dogs = profile?.owned_dogs || [];

  const deleteMutation = useMutation({
    mutationFn: (dogId) => base44.entities.UserProfile.update(profile.id, {
      owned_dogs: dogs.filter(d => d.dog_id !== dogId)
    }),
    onSuccess: () => { queryClient.invalidateQueries(['userProfile']); toast.success("Animal removido"); }
  });

  const openNew = () => { setSelectedDog(null); setShowModal(true); };
  const openEdit = (dog) => { setSelectedDog(dog); setShowModal(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Os meus animais</h2>
        <Button onClick={openNew} className="bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      {dogs.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="py-12 text-center">
            <span className="text-5xl">🐾</span>
            <p className="text-gray-500 mt-3 mb-4">Ainda não tens animais registados</p>
            <Button onClick={openNew} className="bg-gray-900 text-white rounded-xl font-bold">Registar primeiro animal</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {dogs.map(dog => (
            <Card key={dog.dog_id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {dog.photo_url ? <img src={dog.photo_url} className="w-full h-full object-cover" alt={dog.dog_name} /> : <span className="text-2xl">🐶</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{dog.dog_name}</p>
                        <p className="text-xs text-gray-500">{dog.dog_breed || "Raça desconhecida"} • {SIZE_LABELS[dog.dog_size] || dog.dog_size}</p>
                        {dog.dog_age && <p className="text-xs text-gray-400">{dog.dog_age} ano{dog.dog_age !== 1 ? 's' : ''}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(dog)} className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors">
                          <Edit2 className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(dog.dog_id)} className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                    {(dog.temperament || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dog.temperament.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] bg-orange-50 text-orange-600 font-bold px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                        {dog.temperament.length > 3 && <span className="text-[10px] text-gray-400">+{dog.temperament.length - 3}</span>}
                      </div>
                    )}
                    {(dog.health_history || []).length > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1.5">
                        <Syringe className="w-3 h-3" /> {dog.health_history.length} registo{dog.health_history.length !== 1 ? 's' : ''} de saúde
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <DogHealthProfileModal
          dog={selectedDog}
          userEmail={userEmail}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}