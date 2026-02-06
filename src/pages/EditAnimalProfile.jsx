import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function EditAnimalProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const animalId = urlParams.get('id');
  const isNewAnimal = !animalId;

  const [uploading, setUploading] = useState(false);

  const { data: animal, isLoading } = useQuery({
    queryKey: ['animalProfile', animalId],
    queryFn: async () => {
      if (isNewAnimal) return null;
      const animals = await base44.entities.DogProfile.filter({ id: animalId });
      return animals[0];
    },
    enabled: !isNewAnimal,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    dog_name: "",
    animal_type: "dog",
    breed: "",
    age: "",
    weight: "",
    size: "medium",
    gender: "male",
    color: "",
    photo_url: "",
    bio: "",
    pickup_address: "",
    pickup_city: "",
    pickup_postal_code: "",
    owner_phone: "",
    energy_level: "normal",
    socialization: "friendly",
    is_vaccinated: true,
    is_neutered: false,
    vet_clinic_name: "",
    vet_phone: "",
    medical_conditions: "",
    behavioral_notes: "",
    special_care_notes: "",
  });

  React.useEffect(() => {
    if (animal) {
      setFormData({
        dog_name: animal.dog_name || "",
        animal_type: animal.animal_type || "dog",
        breed: animal.breed || "",
        age: animal.age || "",
        weight: animal.weight || "",
        size: animal.size || "medium",
        gender: animal.gender || "male",
        color: animal.color || "",
        photo_url: animal.photo_url || "",
        bio: animal.bio || "",
        pickup_address: animal.pickup_address || "",
        pickup_city: animal.pickup_city || "",
        pickup_postal_code: animal.pickup_postal_code || "",
        owner_phone: animal.owner_phone || user?.phone || "",
        energy_level: animal.energy_level || "normal",
        socialization: animal.socialization || "friendly",
        is_vaccinated: animal.is_vaccinated ?? true,
        is_neutered: animal.is_neutered ?? false,
        vet_clinic_name: animal.vet_clinic_name || "",
        vet_phone: animal.vet_phone || "",
        medical_conditions: animal.medical_conditions || "",
        behavioral_notes: animal.behavioral_notes || "",
        special_care_notes: animal.special_care_notes || "",
      });
    }
  }, [animal, user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      toast.success("Foto carregada!");
    } catch (error) {
      toast.error("Erro ao carregar foto");
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isNewAnimal) {
        return await base44.entities.DogProfile.create({
          ...data,
          owner_email: user.email
        });
      } else {
        return await base44.entities.DogProfile.update(animalId, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['animalProfile']);
      queryClient.invalidateQueries(['myDogs']);
      toast.success(isNewAnimal ? "Animal adicionado!" : "Perfil atualizado!");
      navigate(createPageUrl('Home'));
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.DogProfile.delete(animalId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myDogs']);
      toast.success("Animal removido");
      navigate(createPageUrl('Home'));
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.dog_name) {
      toast.error("Por favor insira o nome do animal");
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja remover este animal?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="font-bold text-gray-900">
            {isNewAnimal ? "Novo Animal" : "Editar Perfil"}
          </h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-orange-100 to-pink-100">
                  {formData.photo_url ? (
                    <img src={formData.photo_url} alt="Animal" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      🐾
                    </div>
                  )}
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  <Button type="button" variant="outline" disabled={uploading} className="gap-2" asChild>
                    <span>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? "A carregar..." : "Alterar Foto"}
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Informações Básicas</h2>
              
              <div>
                <Label htmlFor="dog_name">Nome do Animal *</Label>
                <Input
                  id="dog_name"
                  value={formData.dog_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, dog_name: e.target.value }))}
                  placeholder="Ex: Rex"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="animal_type">Tipo</Label>
                  <Select value={formData.animal_type} onValueChange={(val) => setFormData(prev => ({ ...prev, animal_type: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">🐕 Cão</SelectItem>
                      <SelectItem value="cat">🐱 Gato</SelectItem>
                      <SelectItem value="reptile">🦎 Réptil</SelectItem>
                      <SelectItem value="rodent">🐹 Roedor</SelectItem>
                      <SelectItem value="bird">🦜 Ave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="breed">Raça</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData(prev => ({ ...prev, breed: e.target.value }))}
                    placeholder="Ex: Labrador"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Idade (anos)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">Tamanho</Label>
                  <Select value={formData.size} onValueChange={(val) => setFormData(prev => ({ ...prev, size: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                      <SelectItem value="extra_large">Extra Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="gender">Sexo</Label>
                  <Select value={formData.gender} onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Macho</SelectItem>
                      <SelectItem value="female">Fêmea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Conte sobre a personalidade do seu animal..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address & Contact */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Endereço & Contato</h2>
              
              <div>
                <Label htmlFor="pickup_address">Endereço de Recolha</Label>
                <Input
                  id="pickup_address"
                  value={formData.pickup_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, pickup_address: e.target.value }))}
                  placeholder="Rua, número, andar"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pickup_city">Cidade</Label>
                  <Input
                    id="pickup_city"
                    value={formData.pickup_city}
                    onChange={(e) => setFormData(prev => ({ ...prev, pickup_city: e.target.value }))}
                    placeholder="Lisboa"
                  />
                </div>
                <div>
                  <Label htmlFor="pickup_postal_code">Código Postal</Label>
                  <Input
                    id="pickup_postal_code"
                    value={formData.pickup_postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, pickup_postal_code: e.target.value }))}
                    placeholder="1000-001"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="owner_phone">Telefone de Contato</Label>
                <Input
                  id="owner_phone"
                  type="tel"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_phone: e.target.value }))}
                  placeholder="+351 912 345 678"
                />
              </div>
            </CardContent>
          </Card>

          {/* Health Info */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Saúde</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="is_vaccinated">Vacinado</Label>
                  <Select value={formData.is_vaccinated.toString()} onValueChange={(val) => setFormData(prev => ({ ...prev, is_vaccinated: val === 'true' }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="is_neutered">Castrado</Label>
                  <Select value={formData.is_neutered.toString()} onValueChange={(val) => setFormData(prev => ({ ...prev, is_neutered: val === 'true' }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="vet_clinic_name">Clínica Veterinária</Label>
                <Input
                  id="vet_clinic_name"
                  value={formData.vet_clinic_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, vet_clinic_name: e.target.value }))}
                  placeholder="Nome da clínica"
                />
              </div>

              <div>
                <Label htmlFor="vet_phone">Telefone do Veterinário</Label>
                <Input
                  id="vet_phone"
                  type="tel"
                  value={formData.vet_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, vet_phone: e.target.value }))}
                  placeholder="+351 ..."
                />
              </div>

              <div>
                <Label htmlFor="medical_conditions">Condições Médicas</Label>
                <Textarea
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, medical_conditions: e.target.value }))}
                  placeholder="Ex: Displasia da anca"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Behavior */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Comportamento</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="energy_level">Nível de Energia</Label>
                  <Select value={formData.energy_level} onValueChange={(val) => setFormData(prev => ({ ...prev, energy_level: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="very_high">Muito Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="socialization">Socialização</Label>
                  <Select value={formData.socialization} onValueChange={(val) => setFormData(prev => ({ ...prev, socialization: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Amigável</SelectItem>
                      <SelectItem value="neutral">Neutro</SelectItem>
                      <SelectItem value="shy">Tímido</SelectItem>
                      <SelectItem value="aggressive">Agressivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="behavioral_notes">Notas de Comportamento</Label>
                <Textarea
                  id="behavioral_notes"
                  value={formData.behavioral_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, behavioral_notes: e.target.value }))}
                  placeholder="Ex: Gosta de brincar com outros cães..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="special_care_notes">Cuidados Especiais</Label>
                <Textarea
                  id="special_care_notes"
                  value={formData.special_care_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, special_care_notes: e.target.value }))}
                  placeholder="Ex: Precisa de medicação às 18h..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </Button>
            {!isNewAnimal && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}