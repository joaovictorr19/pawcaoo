import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { emptyServicePhotos } from "@/components/animal/servicePhotoConfig";

import PhotoSection from "@/components/animal/edit/PhotoSection";
import IdentitySection from "@/components/animal/edit/IdentitySection";
import AddressContactSection from "@/components/animal/edit/AddressContactSection";
import HealthSection from "@/components/animal/edit/HealthSection";
import BehaviorSection from "@/components/animal/edit/BehaviorSection";
import CareSection from "@/components/animal/edit/CareSection";
import EmergencySection from "@/components/animal/edit/EmergencySection";
import VetSection from "@/components/animal/edit/VetSection";
import FavoritesSection from "@/components/animal/edit/FavoritesSection";
import ServicePhotosSection from "@/components/animal/edit/ServicePhotosSection";

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
    queryFn: () => getCurrentUser(),
  });

  const [formData, setFormData] = useState(() => ({
    dog_name: "",
    animal_type: "dog",
    breed: "",
    age: "",
    age_months: 0,
    date_of_birth: "",
    microchip_number: "",
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
    gets_along_with: { dogs: true, cats: true, children: true, strangers: true },
    reactive_to_dogs: false,
    reactive_to_people: false,
    reactive_to_noises: false,
    is_vaccinated: true,
    is_neutered: false,
    vaccines: [],
    deworming_internal: { last_date: "", product_name: "" },
    deworming_external: { last_date: "", product_name: "" },
    vet_name: "",
    vet_clinic_name: "",
    vet_phone: "",
    vet_address: "",
    medical_conditions: "",
    medications: [],
    allergies: "",
    behavioral_notes: "",
    accustomed_to_being_alone: false,
    special_care_notes: "",
    other_observations: "",
    feeding_instructions: "",
    habitat_requirements: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    insurance_provider: "",
    insurance_policy_number: "",
    favorite_toys: "",
    favorite_treats: "",
    service_photos: emptyServicePhotos(),
  }));

  useEffect(() => {
    if (animal) {
      setFormData({
        dog_name: animal.dog_name || "",
        animal_type: animal.animal_type || "dog",
        breed: animal.breed || "",
        age: animal.age ?? "",
        age_months: animal.age_months ?? 0,
        date_of_birth: animal.date_of_birth || "",
        microchip_number: animal.microchip_number || "",
        weight: animal.weight ?? "",
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
        gets_along_with: animal.gets_along_with || { dogs: true, cats: true, children: true, strangers: true },
        is_vaccinated: animal.is_vaccinated ?? true,
        is_neutered: animal.is_neutered ?? false,
        vaccines: animal.vaccines || [],
        deworming_internal: animal.deworming_internal || { last_date: "", product_name: "" },
        deworming_external: animal.deworming_external || { last_date: "", product_name: "" },
        vet_name: animal.vet_name || "",
        vet_clinic_name: animal.vet_clinic_name || "",
        vet_phone: animal.vet_phone || "",
        vet_address: animal.vet_address || "",
        medical_conditions: animal.medical_conditions || "",
        medications: animal.medications || [],
        allergies: animal.allergies || "",
        behavioral_notes: animal.behavioral_notes || "",
        accustomed_to_being_alone: animal.accustomed_to_being_alone ?? false,
        special_care_notes: animal.special_care_notes || "",
        reactive_to_dogs: animal.reactive_to_dogs ?? false,
        reactive_to_people: animal.reactive_to_people ?? false,
        reactive_to_noises: animal.reactive_to_noises ?? false,
        other_observations: animal.other_observations || "",
        feeding_instructions: animal.feeding_instructions || "",
        habitat_requirements: animal.habitat_requirements || "",
        emergency_contact_name: animal.emergency_contact_name || "",
        emergency_contact_phone: animal.emergency_contact_phone || "",
        emergency_contact_relationship: animal.emergency_contact_relationship || "",
        insurance_provider: animal.insurance_provider || "",
        insurance_policy_number: animal.insurance_policy_number || "",
        favorite_toys: animal.favorite_toys || "",
        favorite_treats: animal.favorite_treats || "",
        service_photos: animal.service_photos || emptyServicePhotos(),
      });
    }
  }, [animal, user]);

  const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('photo_url', file_url);
      toast.success("Foto carregada!");
    } catch {
      toast.error("Erro ao carregar foto");
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isNewAnimal) {
        return await base44.entities.DogProfile.create({ ...data, owner_email: user.email });
      } else {
        return await base44.entities.DogProfile.update(animalId, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['animalProfile']);
      queryClient.invalidateQueries(['myDogs']);
      toast.success(isNewAnimal ? "Animal adicionado!" : "Perfil atualizado!");
      navigate(-1);
    },
    onError: (error) => toast.error("Erro ao salvar: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.DogProfile.delete(animalId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myDogs']);
      toast.success("Animal removido");
      navigate(createPageUrl('Home'));
    },
    onError: (error) => toast.error("Erro ao remover: " + error.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.dog_name) {
      toast.error("Por favor insira o nome do animal");
      return;
    }
    // Limpar payload: converter tipos e remover campos vazios opcionais
    const payload = Object.entries(formData).reduce((acc, [key, value]) => {
      if (key === 'service_photos') {
        // Manter service_photos sempre (objeto estruturado), mas remover arrays vazios
        const cleaned = {};
        Object.entries(value || {}).forEach(([sk, cats]) => {
          if (!cats || typeof cats !== 'object') return;
          const cleanedCats = {};
          Object.entries(cats).forEach(([ck, arr]) => {
            if (Array.isArray(arr) && arr.length > 0) cleanedCats[ck] = arr;
          });
          if (Object.keys(cleanedCats).length > 0) cleaned[sk] = cleanedCats;
        });
        acc[key] = cleaned;
        return acc;
      }
      if (key === 'gets_along_with' || key === 'deworming_internal' || key === 'deworming_external') {
        // Manter objetos mesmo que parcialmente preenchidos
        acc[key] = value;
        return acc;
      }
      if (key === 'vaccines' || key === 'medications') {
        // Manter arrays (vazios ou preenchidos)
        acc[key] = Array.isArray(value) ? value : [];
        return acc;
      }
      if (['age', 'age_months', 'weight'].includes(key)) {
        acc[key] = value === '' || value === null || value === undefined ? undefined : Number(value);
      } else if (typeof value === 'string' && value.trim() === '' && key !== 'dog_name') {
        acc[key] = undefined;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
    if (isNewAnimal && user?.email) payload.owner_email = user.email;
    saveMutation.mutate(payload);
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja remover este animal?")) deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="sticky top-0 md:top-16 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="font-semibold text-slate-900 text-sm">
            {isNewAnimal ? "Novo Animal" : "Editar Perfil"}
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <PhotoSection formData={formData} setUploading={setUploading} uploading={uploading} onUpload={handlePhotoUpload} />
          <IdentitySection formData={formData} set={set} />
          <AddressContactSection formData={formData} set={set} userPhone={user?.phone} />
          <HealthSection formData={formData} set={set} />
          <BehaviorSection formData={formData} set={set} />
          <CareSection formData={formData} set={set} />
          <EmergencySection formData={formData} set={set} />
          <VetSection formData={formData} set={set} />
          <FavoritesSection formData={formData} set={set} />
          <ServicePhotosSection formData={formData} set={set} />

          <div className="flex gap-3 pb-4">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 h-12 bg-slate-900 hover:bg-black text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saveMutation.isPending ? "A guardar..." : "Guardar"}
            </button>
            {!isNewAnimal && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-5 h-12 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}