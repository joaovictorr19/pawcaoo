import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dog, Upload, X, Plus, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AddEditDogForm({ dog, onCancel, onSuccess }) {
  const queryClient = useQueryClient();
  const isEditing = !!dog;

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState(dog || {
    dog_name: "",
    breed: "",
    age: "",
    size: "medium",
    gender: "male",
    weight: "",
    is_vaccinated: true,
    is_neutered: false,
    energy_level: "normal",
    socialization: "friendly"
  });

  const [uploading, setUploading] = useState(false);
  const [uploadingVet, setUploadingVet] = useState(false);

  const saveDogMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        owner_email: user.email
      };
      
      if (isEditing) {
        return base44.entities.DogProfile.update(dog.id, payload);
      } else {
        return base44.entities.DogProfile.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myDogs']);
      toast.success(isEditing ? "Pet atualizado com sucesso!" : "Pet adicionado com sucesso!");
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast.error("Erro ao salvar pet");
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

  const handleVetDocumentUpload = async (e, recordType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingVet(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (recordType === 'vaccination') {
        const newRecord = {
          vaccine_name: "Nova Vacina",
          date_administered: new Date().toISOString().split('T')[0],
          document_url: file_url
        };
        setFormData({
          ...formData,
          vaccination_records: [...(formData.vaccination_records || []), newRecord]
        });
      } else {
        const newRecord = {
          record_type: "other",
          date: new Date().toISOString().split('T')[0],
          title: "Novo Registo",
          document_url: file_url
        };
        setFormData({
          ...formData,
          medical_records: [...(formData.medical_records || []), newRecord]
        });
      }
      
      toast.success("Documento carregado!");
    } catch (error) {
      toast.error("Erro ao carregar documento");
    } finally {
      setUploadingVet(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.dog_name || !formData.size) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    saveDogMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-2 border-green-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Dog className="w-5 h-5 text-green-600" />
            {isEditing ? `Editar ${dog.dog_name}` : "Adicionar Novo Pet"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="health">Saúde</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="emergency">Emergência</TabsTrigger>
            </TabsList>

            {/* BASIC INFO TAB */}
            <TabsContent value="basic" className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {formData.photo_url ? (
                    <img
                      src={formData.photo_url}
                      alt="Pet"
                      className="w-32 h-32 rounded-full object-cover border-4 border-green-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-green-200">
                      <Dog className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="animate-spin">⏳</div>
                    ) : (
                      <Upload className="w-5 h-5 text-white" />
                    )}
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dog_name">Nome do Pet *</Label>
                  <Input
                    id="dog_name"
                    value={formData.dog_name}
                    onChange={(e) => setFormData({ ...formData, dog_name: e.target.value })}
                    placeholder="Ex: Rex, Luna..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="breed">Raça</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="Ex: Labrador, SRD..."
                  />
                </div>

                <div>
                  <Label htmlFor="age">Idade (anos)</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="size">Tamanho *</Label>
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

                <div>
                  <Label htmlFor="gender">Sexo</Label>
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

                <div>
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Ex: Preto, Dourado..."
                  />
                </div>

                <div>
                  <Label htmlFor="microchip_number">Número do Microchip</Label>
                  <Input
                    id="microchip_number"
                    value={formData.microchip_number}
                    onChange={(e) => setFormData({ ...formData, microchip_number: e.target.value })}
                    placeholder="Ex: 123456789012345"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Biografia / Personalidade</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Conte-nos sobre a personalidade do seu pet..."
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* HEALTH TAB */}
            <TabsContent value="health" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    id="is_vaccinated"
                    checked={formData.is_vaccinated}
                    onChange={(e) => setFormData({ ...formData, is_vaccinated: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <Label htmlFor="is_vaccinated" className="cursor-pointer">
                    Vacinação em dia
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    id="is_neutered"
                    checked={formData.is_neutered}
                    onChange={(e) => setFormData({ ...formData, is_neutered: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <Label htmlFor="is_neutered" className="cursor-pointer">
                    Castrado/Esterilizado
                  </Label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vet_name">Nome do Veterinário</Label>
                  <Input
                    id="vet_name"
                    value={formData.vet_name}
                    onChange={(e) => setFormData({ ...formData, vet_name: e.target.value })}
                    placeholder="Dr. João Silva"
                  />
                </div>

                <div>
                  <Label htmlFor="vet_phone">Telefone do Veterinário</Label>
                  <Input
                    id="vet_phone"
                    value={formData.vet_phone}
                    onChange={(e) => setFormData({ ...formData, vet_phone: e.target.value })}
                    placeholder="+351 XXX XXX XXX"
                  />
                </div>

                <div>
                  <Label htmlFor="vet_clinic_name">Nome da Clínica</Label>
                  <Input
                    id="vet_clinic_name"
                    value={formData.vet_clinic_name}
                    onChange={(e) => setFormData({ ...formData, vet_clinic_name: e.target.value })}
                    placeholder="Clínica Veterinária..."
                  />
                </div>

                <div>
                  <Label htmlFor="vet_address">Morada da Clínica</Label>
                  <Input
                    id="vet_address"
                    value={formData.vet_address}
                    onChange={(e) => setFormData({ ...formData, vet_address: e.target.value })}
                    placeholder="Rua, Cidade..."
                  />
                </div>
              </div>

              <div>
                <Label>Carregar Registos Veterinários</Label>
                <div className="grid md:grid-cols-2 gap-3 mt-2">
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-4 hover:bg-green-50 transition-colors text-center">
                      <Upload className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-700">Registo de Vacinação</p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => handleVetDocumentUpload(e, 'vaccination')}
                      disabled={uploadingVet}
                    />
                  </label>

                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 hover:bg-blue-50 transition-colors text-center">
                      <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-700">Registo Médico</p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => handleVetDocumentUpload(e, 'medical')}
                      disabled={uploadingVet}
                    />
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="medical_conditions">Condições Médicas</Label>
                <Textarea
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  placeholder="Descreva qualquer condição médica conhecida..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="allergies">Alergias</Label>
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
            <TabsContent value="behavior" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="energy_level">Nível de Energia</Label>
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
                  <Label htmlFor="socialization">Socialização</Label>
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
                <Label>Dá-se bem com:</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {['dogs', 'cats', 'children', 'strangers'].map((key) => (
                    <div key={key} className="flex items-center gap-3 p-3 border rounded-lg">
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
                      <Label htmlFor={`gets_along_${key}`} className="cursor-pointer capitalize">
                        {key === 'dogs' ? 'Cães' : key === 'cats' ? 'Gatos' : key === 'children' ? 'Crianças' : 'Estranhos'}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="behavioral_notes">Notas de Comportamento</Label>
                <Textarea
                  id="behavioral_notes"
                  value={formData.behavioral_notes}
                  onChange={(e) => setFormData({ ...formData, behavioral_notes: e.target.value })}
                  placeholder="Informações importantes sobre o comportamento..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="favorite_toys">Brinquedos Favoritos</Label>
                <Input
                  id="favorite_toys"
                  value={formData.favorite_toys}
                  onChange={(e) => setFormData({ ...formData, favorite_toys: e.target.value })}
                  placeholder="Ex: Bola, corda..."
                />
              </div>

              <div>
                <Label htmlFor="favorite_treats">Petiscos Favoritos</Label>
                <Input
                  id="favorite_treats"
                  value={formData.favorite_treats}
                  onChange={(e) => setFormData({ ...formData, favorite_treats: e.target.value })}
                  placeholder="Ex: Frango, queijo..."
                />
              </div>
            </TabsContent>

            {/* EMERGENCY TAB */}
            <TabsContent value="emergency" className="space-y-4">
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-800 font-medium">
                  ⚠️ Estas informações serão usadas em caso de emergência
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergency_contact_name">Contato de Emergência</Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="emergency_contact_phone">Telefone de Emergência</Label>
                  <Input
                    id="emergency_contact_phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                    placeholder="+351 XXX XXX XXX"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="emergency_contact_relationship">Relação</Label>
                  <Input
                    id="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                    placeholder="Ex: Pai, Mãe, Irmão..."
                  />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Seguro de Pet</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="insurance_provider">Seguradora</Label>
                    <Input
                      id="insurance_provider"
                      value={formData.insurance_provider}
                      onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                      placeholder="Nome da seguradora"
                    />
                  </div>

                  <div>
                    <Label htmlFor="insurance_policy_number">Número da Apólice</Label>
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
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saveDogMutation.isPending}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveDogMutation.isPending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Adicionar Pet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}