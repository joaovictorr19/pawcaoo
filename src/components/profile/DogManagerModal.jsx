import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AddEditDogForm from "./AddEditDogForm";

export default function DogManagerModal({ isOpen, onClose, userEmail }) {
  const [selectedDog, setSelectedDog] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: dogs = [], isLoading } = useQuery({
    queryKey: ['myDogs', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return await base44.entities.DogProfile.filter({ owner_email: userEmail });
    },
    enabled: !!userEmail && isOpen,
  });

  const deleteDogMutation = useMutation({
    mutationFn: (dogId) => base44.entities.DogProfile.delete(dogId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myDogs']);
      queryClient.invalidateQueries(['dogsCount']);
      toast.success("Cão removido com sucesso!");
    },
    onError: () => toast.error("Erro ao remover cão"),
  });

  const handleEdit = (dog) => {
    setSelectedDog(dog);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedDog(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedDog(null);
  };

  const handleFormSave = () => {
    queryClient.invalidateQueries(['myDogs']);
    queryClient.invalidateQueries(['dogsCount']);
    handleFormClose();
  };

  if (showForm) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <AddEditDogForm
            dog={selectedDog}
            onClose={handleFormClose}
            onSave={handleFormSave}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            🐾 Meus Cães
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            onClick={handleAddNew}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Novo Cão
          </Button>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : dogs.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
              <p className="text-gray-600 mb-4">Ainda não tem cães cadastrados</p>
              <p className="text-sm text-gray-500">Adicione seu primeiro pet!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dogs.map((dog) => (
                <Card key={dog.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {dog.photo_url && (
                        <img
                          src={dog.photo_url}
                          alt={dog.dog_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{dog.dog_name}</h3>
                        <p className="text-sm text-gray-600">
                          {dog.breed || 'SRD'} • {dog.size === 'small' ? 'Pequeno' : dog.size === 'medium' ? 'Médio' : dog.size === 'large' ? 'Grande' : 'Extra Grande'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(dog)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Remover ${dog.dog_name}?`)) {
                              deleteDogMutation.mutate(dog.id);
                            }
                          }}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}