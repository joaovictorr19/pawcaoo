import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dog, Upload, X, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function AddEditDogForm({ dog, onSuccess, onCancel }) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState(dog || {
    dog_name: "",
    photo_url: "",
    breed: "",
    age: "",
    weight: "",
    size: "",
    gender: "",
    color: "",
    microchip_number: "",
    is_vaccinated: true,
    vaccination_date: "",
    vet_name: "",
    vet_phone: "",
    medical_conditions: "",
    medications: [],
    allergies: "",
    energy_level: "normal",
    socialization: "friendly",
    behavioral_notes: "",
    favorite_toys: "",
    favorite_treats: "",
    special_commands: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    is_active: true
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, photo_url: file_url });
      toast.success("Foto carregada com sucesso!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao carregar foto");
    }
    setUploading(false);
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medications: [...(formData.medications || []), { name: "", dosage: "", frequency: "" }]
    });
  };

  const updateMedication = (index, field, value) => {
    const updated = [...formData.medications];
    updated[index][field] = value;
    setFormData({ ...formData, medications: updated });
  };

  const removeMedication = (index) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (dog) {
        await base44.entities.DogProfile.update(dog.id, formData);
        toast.success("Perfil do cão atualizado!");
      } else {
        await base44.entities.DogProfile.create(formData);
        toast.success("Perfil do cão criado!");
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving dog profile:", error);
      toast.error("Erro ao salvar perfil");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <Card className="max-w-4xl w-full my-8">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
          <CardTitle className="text-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dog className="w-6 h-6" />
              {dog ? "Editar Perfil do Cão" : "Adicionar Novo Cão"}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo */}
            <div>
              <Label>Foto do Cão *</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.photo_url ? (
                  <img
                    src={formData.photo_url}
                    alt="Dog preview"
                    className="w-32 h-32 rounded-xl object-cover border-4 border-green-200"
                  />
                ) : (
                  <div className="w-32 h-32 bg-green-100 rounded-xl flex items-center justify-center border-4 border-green-200">
                    <Upload className="w-8 h-8 text-green-400" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {uploading ? "Carregando..." : "Adicione uma foto clara do seu cão"}
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Cão *</Label>
                <Input
                  required
                  value={formData.dog_name}
                  onChange={(e) => setFormData({...formData, dog_name: e.target.value})}
                  placeholder="Max"
                />
              </div>
              <div>
                <Label>Raça</Label>
                <Input
                  value={formData.breed}
                  onChange={(e) => setFormData({...formData, breed: e.target.value})}
                  placeholder="Labrador"
                />
              </div>
              <div>
                <Label>Idade (anos)</Label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  placeholder="5"
                />
              </div>
              <div>
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  placeholder="25"
                />
              </div>
              <div>
                <Label>Tamanho *</Label>
                <Select 
                  required
                  value={formData.size}
                  onValueChange={(value) => setFormData({...formData, size: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
                <Label>Sexo</Label>
                <Select 
                  value={formData.gender}
                  onValueChange={(value) => setFormData({...formData, gender: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Macho</SelectItem>
                    <SelectItem value="female">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cor</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                  placeholder="Dourado"
                />
              </div>
              <div>
                <Label>Número do Microchip</Label>
                <Input
                  value={formData.microchip_number}
                  onChange={(e) => setFormData({...formData, microchip_number: e.target.value})}
                  placeholder="123456789"
                />
              </div>
            </div>

            {/* Health Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Informações de Saúde</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="vaccinated"
                    checked={formData.is_vaccinated}
                    onCheckedChange={(checked) => setFormData({...formData, is_vaccinated: checked})}
                  />
                  <Label htmlFor="vaccinated">Vacinação em dia</Label>
                </div>

                {formData.is_vaccinated && (
                  <div>
                    <Label>Data da Última Vacinação</Label>
                    <Input
                      type="date"
                      value={formData.vaccination_date}
                      onChange={(e) => setFormData({...formData, vaccination_date: e.target.value})}
                    />
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Veterinário</Label>
                    <Input
                      value={formData.vet_name}
                      onChange={(e) => setFormData({...formData, vet_name: e.target.value})}
                      placeholder="Dr. Silva"
                    />
                  </div>
                  <div>
                    <Label>Telefone do Veterinário</Label>
                    <Input
                      value={formData.vet_phone}
                      onChange={(e) => setFormData({...formData, vet_phone: e.target.value})}
                      placeholder="+351 912 345 678"
                    />
                  </div>
                </div>

                <div>
                  <Label>Condições Médicas</Label>
                  <Textarea
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({...formData, medical_conditions: e.target.value})}
                    placeholder="Descreva condições médicas..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Alergias</Label>
                  <Input
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    placeholder="Ex: pólen, certos alimentos..."
                  />
                </div>

                {/* Medications */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Medicações</Label>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={addMedication}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                  {formData.medications?.map((med, idx) => (
                    <div key={idx} className="grid md:grid-cols-3 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                      <Input
                        placeholder="Nome"
                        value={med.name}
                        onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Dosagem"
                        value={med.dosage}
                        onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Frequência"
                          value={med.frequency}
                          onChange={(e) => updateMedication(idx, 'frequency', e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeMedication(idx)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Behavior */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Comportamento</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nível de Energia</Label>
                  <Select 
                    value={formData.energy_level}
                    onValueChange={(value) => setFormData({...formData, energy_level: value})}
                  >
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
                  <Label>Socialização</Label>
                  <Select 
                    value={formData.socialization}
                    onValueChange={(value) => setFormData({...formData, socialization: value})}
                  >
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
              <div className="mt-4">
                <Label>Notas de Comportamento</Label>
                <Textarea
                  value={formData.behavioral_notes}
                  onChange={(e) => setFormData({...formData, behavioral_notes: e.target.value})}
                  placeholder="Ex: Adora outros cães, medo de trovões..."
                  rows={3}
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Informações Adicionais</h3>
              <div className="space-y-4">
                <div>
                  <Label>Brinquedos Favoritos</Label>
                  <Input
                    value={formData.favorite_toys}
                    onChange={(e) => setFormData({...formData, favorite_toys: e.target.value})}
                    placeholder="Bola, corda..."
                  />
                </div>
                <div>
                  <Label>Petiscos Favoritos</Label>
                  <Input
                    value={formData.favorite_treats}
                    onChange={(e) => setFormData({...formData, favorite_treats: e.target.value})}
                    placeholder="Biscoitos, cenoura..."
                  />
                </div>
                <div>
                  <Label>Comandos Especiais</Label>
                  <Input
                    value={formData.special_commands}
                    onChange={(e) => setFormData({...formData, special_commands: e.target.value})}
                    placeholder="Senta, deita, fica..."
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">Contato de Emergência</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                    placeholder="Maria Silva"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                    placeholder="+351 913 456 789"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 border-t pt-6">
              <Checkbox
                id="active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <Label htmlFor="active">Perfil ativo (visível para passeios)</Label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
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
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500"
                disabled={uploading}
              >
                {dog ? "Atualizar" : "Adicionar"} Cão
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}