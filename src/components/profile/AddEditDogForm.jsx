import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dog, Upload, X, Plus, Save, Heart, Camera } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import OptimizedImageUpload from "../adoption/OptimizedImageUpload";
import { createPageUrl } from "@/utils";

export default function AddEditDogForm({ dog, onClose, onSave }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // `isEditing` is not explicitly used anymore, but its logic is implied by `!!dog` for conditional rendering/text.

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Define default values for all possible fields
  const defaultFormData = {
    dog_name: "",
    pet_type: "dog",
    breed: "",
    age: "",
    date_of_birth: "",
    weight: "",
    size: "medium",
    gender: "male",
    color: "",
    photo_url: "",
    gallery_photos: [],
    owner_phone: "",
    default_pickup_address: "",
    bio: "",
    is_adopted: false,
    adoption_date: "",
    adoption_story: "",
    microchip_number: "",
    is_neutered: false,
    is_vaccinated: true,
    vaccination_date: "",
    vet_name: "",
    vet_phone: "",
    vet_clinic_name: "",
    vet_address: "",
    medical_conditions: "",
    allergies: "",
    energy_level: "normal",
    socialization: "friendly",
    gets_along_with: { dogs: true, cats: true, children: true, strangers: true },
    behavioral_notes: "",
    favorite_toys: "",
    favorite_treats: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    insurance_provider: "",
    insurance_policy_number: "",
  };

  // Initialize formData: if editing, merge existing dog data with defaults,
  // ensuring nested objects like gets_along_with are also merged.
  const [formData, setFormData] = useState(dog ? {
    ...defaultFormData,
    ...dog,
    gets_along_with: { ...defaultFormData.gets_along_with, ...(dog.gets_along_with || {}) },
  } : defaultFormData);

  const [uploading, setUploading] = useState(false);
  const [useOwnerAddress, setUseOwnerAddress] = useState(false);

  // Auto-fill owner address and phone
  React.useEffect(() => {
    if (useOwnerAddress && user?.address) {
      setFormData(prev => ({ ...prev, default_pickup_address: user.address }));
    }
  }, [useOwnerAddress, user?.address]);

  React.useEffect(() => {
    if (user?.phone && !formData.owner_phone) {
      setFormData(prev => ({ ...prev, owner_phone: user.phone }));
    }
  }, [user?.phone]);
  // uploadingVet is removed as its related UI is removed.

  const saveDogMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.email) {
        throw new Error("Usuário não autenticado");
      }

      // Clean payload: remove undefined values and empty strings for optional fields
      const cleanPayload = Object.entries(data).reduce((acc, [key, value]) => {
        // Keep required fields even if empty
        if (['dog_name', 'size', 'owner_email', 'pet_type'].includes(key)) {
          acc[key] = value || (key === 'pet_type' ? 'dog' : key === 'size' ? 'medium' : '');
        }
        // For owner_phone and default_pickup_address, include even if empty string
        else if (['owner_phone', 'default_pickup_address'].includes(key)) {
          acc[key] = value || '';
        }
        // For numbers, convert empty strings to undefined
        else if (['age', 'weight'].includes(key)) {
          acc[key] = value === '' || value === null ? undefined : value;
        }
        // For objects like gets_along_with, always include
        else if (key === 'gets_along_with' && typeof value === 'object') {
          acc[key] = value;
        }
        // For optional fields, only include if they have a value
        else if (value !== undefined && value !== '' && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});

      const payload = {
        ...cleanPayload,
        owner_email: user.email,
        pet_type: cleanPayload.pet_type || 'dog',
        size: cleanPayload.size || 'medium',
        owner_phone: data.owner_phone || '',
        default_pickup_address: data.default_pickup_address || ''
      };

      console.log('💾 Saving dog payload:', payload);

      try {
        if (dog?.id) {
          const result = await base44.entities.DogProfile.update(dog.id, payload);
          console.log('✅ Dog updated successfully:', result);
          return result;
        } else {
          const result = await base44.entities.DogProfile.create(payload);
          console.log('✅ Dog created successfully:', result);
          return result;
        }
      } catch (error) {
        console.error('❌ Error saving dog:', error);
        console.error('Failed payload:', payload);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myDogs']);
      queryClient.invalidateQueries(['dogsCount']);
      toast.success(dog ? "Pet atualizado com sucesso!" : "Pet adicionado com sucesso!");
      if (onSave) onSave();
    },
    onError: (error) => {
      console.error("❌ Mutation error:", error);
      const errorMsg = error.message || error.toString() || "Erro desconhecido";
      toast.error(`Erro ao salvar pet: ${errorMsg}`, {
        description: 'Verifique os dados e tente novamente.'
      });
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, photo_url: file_url });
      toast.success("Foto carregada!");
    } catch (error) {
      toast.error("Erro ao carregar foto");
    } finally {
      setUploading(false);
    }
  };

  // handleVetDocumentUpload is removed as its related UI is removed.

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.dog_name || !formData.size || !formData.pet_type) {
      toast.error("Preencha os campos obrigatórios (Nome do Pet, Tipo de Animal, Tamanho)");
      return;
    }

    saveDogMutation.mutate(formData);
  };

  const petTypeOptions = [
    { value: "dog", label: "🐕 Cão", icon: "🐕" },
    { value: "cat", label: "🐱 Gato", icon: "🐱" },
    { value: "bird", label: "🦜 Pássaro", icon: "🦜" },
    { value: "rabbit", label: "🐰 Coelho", icon: "🐰" },
    { value: "hamster", label: "🐹 Hamster", icon: "🐹" },
    { value: "guinea_pig", label: "🐹 Porquinho da Índia", icon: "🐹" },
    { value: "turtle", label: "🐢 Tartaruga", icon: "🐢" },
    { value: "fish", label: "🐠 Peixe", icon: "🐠" },
    { value: "other", label: "🐾 Outro", icon: "🐾" }
  ];

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 md:p-6">
        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
          <Dog className="w-5 h-5 md:w-6 md:h-6" />
          {dog ? 'Editar Pet' : 'Adicionar Novo Pet'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-6"> {/* Added form tag here */}
          {/* Photo Principal */}
          <div>
            <Label className="mb-3 block text-sm md:text-base font-semibold">Foto Principal *</Label>
            <div className="flex flex-col md:flex-row items-start gap-4">
              {formData.photo_url ? (
                <div className="relative">
                  <img
                    src={formData.photo_url}
                    alt="Pet"
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-green-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, photo_url: "" })}
                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center hover:border-green-500 hover:bg-green-50 transition-colors">
                    {uploading ? (
                      <Upload className="w-8 h-8 text-gray-400 animate-bounce" />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">Upload</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
              )}
              <div className="flex-1">
                <p className="text-xs md:text-sm text-gray-600">
                  Foto principal do seu pet que aparecerá no perfil
                </p>
                <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                  💡 Otimizada automaticamente para &lt;500KB
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Gallery Photos - Using Optimized Component */}
          <div>
            <Label className="mb-3 block text-sm md:text-base font-semibold flex items-center gap-2">
              🖼️ Galeria de Fotos
              <span className="text-xs md:text-sm font-normal text-gray-500">(opcional)</span>
            </Label>
            <OptimizedImageUpload
              onImagesChange={(urls) => setFormData({ ...formData, gallery_photos: urls })}
              currentImages={formData.gallery_photos}
              maxImages={10}
              maxSizeKB={500}
              showPreview={true}
            />
          </div>

          <Separator />

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 h-auto gap-1 p-1">
              <TabsTrigger value="basic" className="text-xs md:text-sm py-2">Básico</TabsTrigger>
              <TabsTrigger value="health" className="text-xs md:text-sm py-2">Saúde</TabsTrigger>
              <TabsTrigger value="behavior" className="text-xs md:text-sm py-2">Comportamento</TabsTrigger>
              <TabsTrigger value="emergency" className="text-xs md:text-sm py-2">Emergência</TabsTrigger>
            </TabsList>

            {/* BASIC INFO TAB */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="dog_name" className="text-sm">Nome do Pet *</Label>
                    <Input
                      id="dog_name"
                      value={formData.dog_name}
                      onChange={(e) => setFormData({ ...formData, dog_name: e.target.value })}
                      placeholder="Ex: Rex, Luna..."
                      required
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="owner_phone" className="text-sm">Celular do Dono *</Label>
                    <Input
                      id="owner_phone"
                      value={formData.owner_phone}
                      onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                      placeholder="+351 XXX XXX XXX"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="pet_type" className="text-sm">Tipo de Animal *</Label>
                    <Select
                      value={formData.pet_type}
                      onValueChange={(value) => setFormData({ ...formData, pet_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {petTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="breed" className="text-sm">Raça</Label>
                    <Input
                      id="breed"
                      value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      placeholder={formData.pet_type === 'dog' ? "Ex: Labrador, SRD..." : "Raça ou espécie"}
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="age" className="text-sm">Idade (anos)</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || "" })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="date_of_birth" className="text-sm">Data de Nascimento</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="weight" className="text-sm">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || "" })}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="size" className="text-sm">Tamanho *</Label>
                    <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
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

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="gender" className="text-sm">Sexo</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Macho ♂️</SelectItem>
                        <SelectItem value="female">Fêmea ♀️</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="color" className="text-sm">Cor</Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="Ex: Preto, Dourado..."
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <Label htmlFor="microchip_number" className="text-sm">Número do Microchip</Label>
                    <Input
                      id="microchip_number"
                      value={formData.microchip_number}
                      onChange={(e) => setFormData({ ...formData, microchip_number: e.target.value })}
                      placeholder="Ex: 123456789012345"
                    />
                  </div>
                </div>

                {/* Pickup Address */}
                <div className="border-2 border-purple-200 rounded-xl p-3 md:p-4 bg-purple-50">
                  <Label htmlFor="default_pickup_address" className="text-sm md:text-base font-semibold text-purple-900 mb-2 block">
                    📍 Local de Recolha Padrão
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="use_owner_address"
                        checked={useOwnerAddress}
                        onChange={(e) => setUseOwnerAddress(e.target.checked)}
                        className="w-4 h-4 text-purple-600"
                      />
                      <Label htmlFor="use_owner_address" className="cursor-pointer text-sm">
                        Usar meu endereço de perfil
                      </Label>
                    </div>
                    <Input
                      id="default_pickup_address"
                      value={formData.default_pickup_address}
                      onChange={(e) => setFormData({ ...formData, default_pickup_address: e.target.value })}
                      placeholder="Ex: Rua das Flores, 123, Lisboa"
                      className="bg-white"
                    />
                    <p className="text-xs text-purple-700">
                      💡 Este endereço será usado automaticamente ao agendar passeios
                    </p>
                  </div>
                </div>

                {/* Adoption Section */}
                <div className="border-2 border-pink-200 rounded-xl p-3 md:p-4 bg-pink-50">
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <input
                      type="checkbox"
                      id="is_adopted"
                      checked={formData.is_adopted}
                      onChange={(e) => setFormData({ ...formData, is_adopted: e.target.checked })}
                      className="w-4 h-4 text-pink-600"
                    />
                    <Label htmlFor="is_adopted" className="cursor-pointer font-semibold text-pink-900">
                      <Heart className="w-4 h-4 inline mr-1 fill-pink-500 text-pink-500" />
                      Este pet foi adotado
                    </Label>
                  </div>

                  {formData.is_adopted && (
                    <div className="space-y-3 mt-3">
                      <div>
                        <Label htmlFor="adoption_date" className="text-sm">Data de Adoção</Label>
                        <Input
                          type="date"
                          id="adoption_date"
                          value={formData.adoption_date}
                          onChange={(e) => setFormData({ ...formData, adoption_date: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="adoption_story" className="text-sm">História de Adoção</Label>
                        <Textarea
                          id="adoption_story"
                          value={formData.adoption_story}
                          onChange={(e) => setFormData({ ...formData, adoption_story: e.target.value })}
                          placeholder="Conte a história de como adotou este pet..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Bio Section */}
                <div>
                  <Label htmlFor="bio" className="text-sm">Bio do Pet</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Conte sobre a personalidade do seu pet..."
                    rows={3}
                    className="mt-2"
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">{formData.bio?.length || 0}/200</p>
                </div>
              </div>
            </TabsContent>

            {/* HEALTH TAB */}
            <TabsContent value="health" className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="flex items-center gap-3 p-3 md:p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    id="is_vaccinated"
                    checked={formData.is_vaccinated}
                    onChange={(e) => setFormData({ ...formData, is_vaccinated: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <Label htmlFor="is_vaccinated" className="cursor-pointer text-sm">
                    Vacinação em dia
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-3 md:p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    id="is_neutered"
                    checked={formData.is_neutered}
                    onChange={(e) => setFormData({ ...formData, is_neutered: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <Label htmlFor="is_neutered" className="cursor-pointer text-sm">
                    Castrado/Esterilizado
                  </Label>
                </div>
              </div>

              {formData.is_vaccinated && ( // Show vaccination date if vaccinated
                <div>
                  <Label htmlFor="vaccination_date" className="text-sm">Data da Última Vacinação</Label>
                  <Input
                    id="vaccination_date"
                    type="date"
                    value={formData.vaccination_date}
                    onChange={(e) => setFormData({ ...formData, vaccination_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="vet_name" className="text-sm">Nome do Veterinário</Label>
                  <Input
                    id="vet_name"
                    value={formData.vet_name}
                    onChange={(e) => setFormData({ ...formData, vet_name: e.target.value })}
                    placeholder="Dr. João Silva"
                  />
                </div>

                <div>
                  <Label htmlFor="vet_phone" className="text-sm">Telefone do Veterinário</Label>
                  <Input
                    id="vet_phone"
                    value={formData.vet_phone}
                    onChange={(e) => setFormData({ ...formData, vet_phone: e.target.value })}
                    placeholder="+351 XXX XXX XXX"
                  />
                </div>

                <div>
                  <Label htmlFor="vet_clinic_name" className="text-sm">Nome da Clínica</Label>
                  <Input
                    id="vet_clinic_name"
                    value={formData.vet_clinic_name}
                    onChange={(e) => setFormData({ ...formData, vet_clinic_name: e.target.value })}
                    placeholder="Clínica Veterinária..."
                  />
                </div>

                <div>
                  <Label htmlFor="vet_address" className="text-sm">Morada da Clínica</Label>
                  <Input
                    id="vet_address"
                    value={formData.vet_address}
                    onChange={(e) => setFormData({ ...formData, vet_address: e.target.value })}
                    placeholder="Rua, Cidade..."
                  />
                </div>
              </div>

              {/* "Carregar Registos Veterinários" section removed */}

              <div>
                <Label htmlFor="medical_conditions" className="text-sm">Condições Médicas</Label>
                <Textarea
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  placeholder="Descreva qualquer condição médica conhecida..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="allergies" className="text-sm">Alergias</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Liste alergias conhecidas..."
                  rows={2}
                />
              </div>
            </TabsContent>

            {/* BEHAVIOR TAB */}
            <TabsContent value="behavior" className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="energy_level" className="text-sm">Nível de Energia</Label>
                  <Select value={formData.energy_level} onValueChange={(value) => setFormData({ ...formData, energy_level: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="very_high">Muito Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="socialization" className="text-sm">Socialização</Label>
                  <Select value={formData.socialization} onValueChange={(value) => setFormData({ ...formData, socialization: value })}>
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
                <Label className="text-sm">Dá-se bem com:</Label>
                <div className="grid grid-cols-2 gap-2 md:gap-3 mt-2">
                  {['dogs', 'cats', 'children', 'strangers'].map((key) => (
                    <div key={key} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        id={`gets_along_${key}`}
                        checked={formData.gets_along_with?.[key] ?? true}
                        onChange={(e) => setFormData({
                          ...formData,
                          gets_along_with: {
                            ...formData.gets_along_with,
                            [key]: e.target.checked
                          }
                        })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor={`gets_along_${key}`} className="cursor-pointer capitalize text-xs md:text-sm">
                        {key === 'dogs' ? 'Cães' : key === 'cats' ? 'Gatos' : key === 'children' ? 'Crianças' : 'Estranhos'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="behavioral_notes" className="text-sm">Notas de Comportamento</Label>
                <Textarea
                  id="behavioral_notes"
                  value={formData.behavioral_notes}
                  onChange={(e) => setFormData({ ...formData, behavioral_notes: e.target.value })}
                  placeholder="Informações importantes sobre o comportamento..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="favorite_toys" className="text-sm">Brinquedos Favoritos</Label>
                <Input
                  id="favorite_toys"
                  value={formData.favorite_toys}
                  onChange={(e) => setFormData({ ...formData, favorite_toys: e.target.value })}
                  placeholder="Ex: Bola, corda..."
                />
              </div>

              <div>
                <Label htmlFor="favorite_treats" className="text-sm">Petiscos Favoritos</Label>
                <Input
                  id="favorite_treats"
                  value={formData.favorite_treats}
                  onChange={(e) => setFormData({ ...formData, favorite_treats: e.target.value })}
                  placeholder="Ex: Frango, queijo..."
                />
              </div>

              {/* Emergency Walk Button */}
              <div className="border-2 border-red-200 rounded-xl p-3 md:p-4 bg-red-50 mt-4">
                <Button
                  type="button"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 md:py-3 text-sm md:text-base"
                  onClick={() => {
                    if (!formData.dog_name) {
                      toast.error("Salve o perfil do cão primeiro!");
                      return;
                    }
                    navigate(createPageUrl('PostEmergency') + `?dogName=${formData.dog_name}&dogPhoto=${formData.photo_url || ''}`);
                  }}
                >
                  🆘 Publicar Passeio de Emergência
                </Button>
                <p className="text-xs text-red-700 mt-2 text-center">
                  Precisa de um passeador urgente? Crie um pedido de emergência!
                </p>
              </div>
              </TabsContent>

            {/* EMERGENCY TAB */}
            <TabsContent value="emergency" className="space-y-3 md:space-y-4">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                <p className="text-sm text-orange-800 font-medium">
                  ⚠️ Estas informações serão usadas em caso de emergência
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name" className="text-sm">Contato de Emergência</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact_phone" className="text-sm">Telefone de Emergência</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    placeholder="+351 XXX XXX XXX"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="emergency_contact_relationship" className="text-sm">Relação</Label>
                  <Input
                    id="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                    placeholder="Ex: Pai, Mãe, Irmão..."
                  />
                </div>
              </div>

              <div className="border-t pt-3 md:pt-4 mt-3 md:mt-4">
                <h4 className="text-sm md:text-base font-semibold mb-3">Seguro de Pet</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="insurance_provider" className="text-sm">Seguradora</Label>
                    <Input
                      id="insurance_provider"
                      value={formData.insurance_provider}
                      onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                      placeholder="Nome da seguradora"
                    />
                  </div>

                  <div>
                    <Label htmlFor="insurance_policy_number" className="text-sm">Número da Apólice</Label>
                    <Input
                      id="insurance_policy_number"
                      value={formData.insurance_policy_number}
                      onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                      placeholder="XXXXXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 mt-4 md:mt-6 pt-4 md:pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full md:flex-1 h-11 md:h-10 text-sm md:text-base"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveDogMutation.isPending}
              className="w-full md:flex-1 bg-gradient-to-r from-green-600 to-blue-600 h-11 md:h-10 text-sm md:text-base"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveDogMutation.isPending ? "Salvando..." : dog ? "Salvar Alterações" : "Adicionar Pet"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}