import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Heart } from "lucide-react";
import { toast } from "sonner";
import AddEditDogForm from "./AddEditDogForm";

// Animal type config
const animalConfig = {
  dog: { icon: "🐕", label: "Cão", color: "bg-amber-100 text-amber-700" },
  cat: { icon: "🐱", label: "Gato", color: "bg-purple-100 text-purple-700" },
  reptile: { icon: "🦎", label: "Réptil", color: "bg-green-100 text-green-700" },
  arachnid: { icon: "🕷️", label: "Aracnídeo", color: "bg-gray-100 text-gray-700" },
  rodent: { icon: "🐹", label: "Roedor", color: "bg-orange-100 text-orange-700" },
  bird: { icon: "🐦", label: "Ave", color: "bg-blue-100 text-blue-700" },
};

export default function AnimalManagerModal({ isOpen, onClose, userEmail }) {
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['myAnimals', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return await base44.entities.DogProfile.filter({ owner_email: userEmail });
    },
    enabled: !!userEmail && isOpen,
  });

  const deleteAnimalMutation = useMutation({
    mutationFn: (animalId) => base44.entities.DogProfile.delete(animalId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myAnimals']);
      queryClient.invalidateQueries(['profileAnimals']);
      toast.success("Animal removido com sucesso!");
    },
    onError: () => toast.error("Erro ao remover animal"),
  });

  const handleEdit = (animal) => {
    setSelectedAnimal(animal);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedAnimal(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedAnimal(null);
  };

  const handleFormSave = () => {
    queryClient.invalidateQueries(['myAnimals']);
    queryClient.invalidateQueries(['profileAnimals']);
    handleFormClose();
  };

  if (showForm) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <AddEditDogForm
            dog={selectedAnimal}
            onClose={handleFormClose}
            onSave={handleFormSave}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[80vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Meus Animais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            onClick={handleAddNew}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white group h-12"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            <span>Adicionar Animal</span>
          </Button>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : animals.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl border-2 border-dashed border-pink-200">
              <div className="text-4xl mb-4">🐾</div>
              <p className="text-gray-600 mb-2">Ainda nao tem animais cadastrados</p>
              <p className="text-sm text-gray-500">Adicione caes, gatos, aves, repteis e mais!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {animals.map((animal) => {
                const type = animal.animal_type || 'dog';
                const config = animalConfig[type] || animalConfig.dog;
                
                return (
                  <Card key={animal.id} className="hover:shadow-lg transition-shadow border-l-4" style={{ borderLeftColor: type === 'dog' ? '#f59e0b' : type === 'cat' ? '#a855f7' : type === 'bird' ? '#3b82f6' : type === 'reptile' ? '#22c55e' : '#6b7280' }}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {animal.photo_url ? (
                            <img
                              src={animal.photo_url}
                              alt={animal.dog_name}
                              className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                              {config.icon}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base md:text-lg truncate">{animal.dog_name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge className={`${config.color} text-xs`}>
                              {config.label}
                            </Badge>
                            {animal.breed && (
                              <span className="text-xs text-gray-600 truncate">{animal.breed}</span>
                            )}
                            {animal.size && (
                              <span className="text-xs text-gray-500">
                                {animal.size === 'small' ? 'Peq.' : animal.size === 'medium' ? 'Med.' : animal.size === 'large' ? 'Grande' : 'XL'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(animal)}
                            className="h-9 w-9"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (confirm(`Remover ${animal.dog_name}?`)) {
                                deleteAnimalMutation.mutate(animal.id);
                              }
                            }}
                            className="text-red-600 hover:bg-red-50 h-9 w-9"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}