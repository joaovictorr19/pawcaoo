import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, Save, AlertCircle, PlusCircle, Trash2, Camera, Video, MapPin, Phone, Euro, Clock, Dog, User, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import BreedSelector from "../components/professionals/BreedSelector";
import ServiceAreaSelector from "../components/professionals/ServiceAreaSelector";
import OptimizedImageUpload from "../components/adoption/OptimizedImageUpload";
import ImageCropModal from "../components/ui/ImageCropModal";

export default function EditWalkerProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [editingImageType, setEditingImageType] = useState('photo');
  const [activeSection, setActiveSection] = useState('photos');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: walkerProfile, isLoading } = useQuery({
    queryKey: ['myWalkerProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.WalkerProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({});

  React.useEffect(() => {
    if (walkerProfile) {
      setFormData({ ...walkerProfile });
    }
  }, [walkerProfile]);

  const submitEditRequestMutation = useMutation({
    mutationFn: async (changes) => {
      const currentUser = await base44.auth.me();
      await base44.entities.ProfileEditRequest.create({
        profile_id: walkerProfile.id,
        profile_type: 'walker',
        professional_name: walkerProfile.walker_name,
        professional_email: currentUser.email,
        requested_changes: changes,
        original_data: walkerProfile,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileEditRequests'] });
      toast.success('✅ Alterações enviadas para aprovação!');
      setTimeout(() => navigate(createPageUrl('ProfessionalDashboard')), 1500);
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    }
  });

  const handleCroppedImage = async (croppedFile) => {
    setUploading(true);
    setCropModalOpen(false);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
      
      if (editingImageType === 'photo') {
        setFormData({ ...formData, photo_url: file_url });
        try {
          await base44.auth.updateMe({ profile_photo_url: file_url });
          const userProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
          if (userProfiles?.length > 0) {
            await base44.entities.UserProfile.update(userProfiles[0].id, { profile_photo_url: file_url });
          }
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          toast.success("Foto atualizada!");
        } catch (syncError) {
          toast.success("Foto carregada!");
        }
      } else {
        setFormData({ ...formData, cover_photo_url: file_url });
        toast.success("Capa atualizada!");
      }
    } catch (error) {
      toast.error("Erro no upload.");
    }
    
    setUploading(false);
    setTempImageUrl(null);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, video_intro_url: file_url });
      toast.success("Vídeo carregado!");
    } catch (error) {
      toast.error("Erro no upload do vídeo.");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allChanges = {};
    Object.keys(formData).forEach(key => {
      if (['id', 'created_by', 'created_date', 'updated_date'].includes(key)) return;
      if (JSON.stringify(formData[key]) !== JSON.stringify(walkerProfile[key])) {
        allChanges[key] = formData[key];
      }
    });

    if (Object.keys(allChanges).length === 0) {
      toast.info('Nenhuma alteração detectada.');
      return;
    }
    submitEditRequestMutation.mutate(allChanges);
  };

  const toggleArrayItem = (field, value) => {
    const current = formData[field] || [];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const addService = () => {
    setFormData({
      ...formData,
      services_offered: [...(formData.services_offered || []), {
        service_name: "",
        description: "",
        price: 0
      }]
    });
  };

  const updateService = (index, field, value) => {
    const updated = [...(formData.services_offered || [])];
    updated[index][field] = value;
    setFormData({ ...formData, services_offered: updated });
  };

  const removeService = (index) => {
    setFormData({
      ...formData,
      services_offered: (formData.services_offered || []).filter((_, i) => i !== index)
    });
  };

  // Loading & Error States
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Faça login para continuar</p>
            <Button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="w-full">
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!walkerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Perfil não encontrado</h2>
            <p className="text-gray-600 mb-4 text-sm">Você ainda não tem um perfil de passeador.</p>
            <Button onClick={() => navigate(createPageUrl('BecomeProfessional'))} className="w-full">
              Criar Perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sections = [
    { id: 'photos', label: 'Fotos', icon: Camera },
    { id: 'info', label: 'Info', icon: User },
    { id: 'services', label: 'Serviços', icon: Briefcase },
    { id: 'preferences', label: 'Preferências', icon: Dog },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate">Editar Perfil</h1>
            <p className="text-xs text-gray-500">Passeador Profissional</p>
          </div>
          <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-xs shrink-0">
            Requer Aprovação
          </Badge>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-white border-b sticky top-[57px] z-30">
        <div className="max-w-2xl mx-auto px-2">
          <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-4 pb-32">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* PHOTOS SECTION */}
          {activeSection === 'photos' && (
            <div className="space-y-4">
              {/* Profile Photo */}
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Foto de Perfil</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 shrink-0">
                      {formData.photo_url ? (
                        <img src={formData.photo_url} alt="Perfil" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-gray-500">Foto quadrada, mínimo 400x400px</p>
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setTempImageUrl(URL.createObjectURL(file));
                            setCropModalOpen(true);
                            setEditingImageType('photo');
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('photo').click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Enviando...' : 'Alterar Foto'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cover Photo */}
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Foto de Capa</Label>
                  <div 
                    className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-dashed border-gray-300 cursor-pointer hover:border-green-400 transition-colors"
                    onClick={() => document.getElementById('cover').click()}
                  >
                    {formData.cover_photo_url ? (
                      <img src={formData.cover_photo_url} alt="Capa" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-xs">Toque para adicionar</span>
                      </div>
                    )}
                  </div>
                  <Input
                    id="cover"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setTempImageUrl(URL.createObjectURL(file));
                        setCropModalOpen(true);
                        setEditingImageType('cover');
                      }
                    }}
                    className="hidden"
                  />
                </CardContent>
              </Card>

              {/* Video */}
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Vídeo de Apresentação</Label>
                  {formData.video_intro_url ? (
                    <video src={formData.video_intro_url} controls className="w-full rounded-xl mb-3" />
                  ) : (
                    <div className="w-full h-24 rounded-xl bg-gray-100 flex flex-col items-center justify-center text-gray-400 mb-3">
                      <Video className="w-6 h-6 mb-1" />
                      <span className="text-xs">Nenhum vídeo</span>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                    className="text-sm"
                  />
                </CardContent>
              </Card>

              {/* Portfolio */}
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Portfolio</Label>
                  <OptimizedImageUpload
                    onImagesChange={(urls) => {
                      const portfolio = urls.map(url => ({
                        media_url: url,
                        media_type: 'photo',
                        title: 'Passeio',
                        category: 'walk',
                        is_featured: false
                      }));
                      setFormData({ ...formData, portfolio });
                    }}
                    currentImages={(formData.portfolio || []).map(p => p.media_url)}
                    maxImages={12}
                    maxSizeKB={500}
                    showPreview={true}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* INFO SECTION */}
          {activeSection === 'info' && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Nome Profissional</Label>
                    <Input
                      value={formData.walker_name || ""}
                      onChange={(e) => setFormData({...formData, walker_name: e.target.value})}
                      placeholder="Seu nome completo"
                      className="h-11"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> Localização
                    </Label>
                    <Input
                      value={formData.location || ""}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="Cidade, Zona"
                      className="h-11"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <Phone className="w-4 h-4" /> WhatsApp
                      </Label>
                      <Input
                        value={formData.whatsapp_number || ""}
                        onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value.replace(/\D/g, '')})}
                        placeholder="351912345678"
                        className="h-11"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1.5 block">MBWay</Label>
                      <Input
                        value={formData.mbway_number || ""}
                        onChange={(e) => setFormData({...formData, mbway_number: e.target.value})}
                        placeholder="912345678"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Sobre Você</Label>
                    <Textarea
                      value={formData.bio || ""}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Conte sua experiência com animais..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Service Areas */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Áreas de Serviço</Label>
                  <ServiceAreaSelector
                    serviceAreas={formData.service_areas || []}
                    onChange={(areas) => setFormData({...formData, service_areas: areas})}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* SERVICES SECTION */}
          {activeSection === 'services' && (
            <div className="space-y-4">
              {/* Pricing */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Preços Base</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Euro className="w-3 h-3" /> Cães/Gatos (€/hora)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.hourly_rate || ""}
                        onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
                        placeholder="10"
                        className="h-11"
                      />
                    </div>
                    {(formData.accepted_animals || []).some(a => ['reptiles', 'arachnids', 'rodents', 'birds'].includes(a)) && (
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 block">Exóticos (€/visita)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.exotic_rate || ""}
                          onChange={(e) => setFormData({...formData, exotic_rate: parseFloat(e.target.value)})}
                          placeholder="20"
                          className="h-11"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Services */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Serviços Personalizados</Label>
                  <div className="space-y-3">
                    {(formData.services_offered || []).map((service, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <Input
                            placeholder="Nome do serviço"
                            value={service.service_name || ""}
                            onChange={(e) => updateService(index, 'service_name', e.target.value)}
                            className="flex-1 h-9 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeService(index)}
                            className="shrink-0 text-red-500 h-9 w-9"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Preço €"
                            value={service.price || ""}
                            onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-24 h-9 text-sm"
                          />
                          <Input
                            placeholder="Descrição breve"
                            value={service.description || ""}
                            onChange={(e) => updateService(index, 'description', e.target.value)}
                            className="flex-1 h-9 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addService} className="w-full h-10">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Adicionar Serviço
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* PREFERENCES SECTION */}
          {activeSection === 'preferences' && (
            <div className="space-y-4">
              {/* Animals */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Animais que Aceito</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "dogs", label: "Cães", icon: "🐕" },
                      { value: "cats", label: "Gatos", icon: "🐈" },
                      { value: "reptiles", label: "Répteis", icon: "🦎" },
                      { value: "arachnids", label: "Aracnídeos", icon: "🕷️" },
                      { value: "rodents", label: "Roedores", icon: "🐹" },
                      { value: "birds", label: "Aves", icon: "🦜" },
                    ].map(animal => (
                      <button
                        key={animal.value}
                        type="button"
                        onClick={() => toggleArrayItem('accepted_animals', animal.value)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                          (formData.accepted_animals || ['dogs']).includes(animal.value)
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{animal.icon}</span>
                        <span className="text-xs font-medium">{animal.label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Dog Sizes */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Tamanhos de Cães</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "small", label: "Pequeno", desc: "até 10kg" },
                      { value: "medium", label: "Médio", desc: "10-25kg" },
                      { value: "large", label: "Grande", desc: "25-45kg" },
                      { value: "extra_large", label: "Extra Grande", desc: "+45kg" },
                    ].map(size => (
                      <button
                        key={size.value}
                        type="button"
                        onClick={() => toggleArrayItem('dog_sizes', size.value)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          (formData.dog_sizes || []).includes(size.value)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <Checkbox checked={(formData.dog_sizes || []).includes(size.value)} className="pointer-events-none" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-800">{size.label}</p>
                          <p className="text-xs text-gray-500">{size.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Availability */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Disponibilidade
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "morning", label: "Manhã", time: "6h-12h", icon: "🌅" },
                      { value: "afternoon", label: "Tarde", time: "12h-18h", icon: "☀️" },
                      { value: "evening", label: "Noite", time: "18h-22h", icon: "🌙" },
                      { value: "night", label: "Madrugada", time: "22h-6h", icon: "🌃" },
                    ].map(time => (
                      <button
                        key={time.value}
                        type="button"
                        onClick={() => toggleArrayItem('availability', time.value)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                          (formData.availability || []).includes(time.value)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl">{time.icon}</span>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-800">{time.label}</p>
                          <p className="text-xs text-gray-500">{time.time}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Breeds */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Raças com Experiência</Label>
                  <BreedSelector
                    selectedBreeds={formData.dog_breeds_handled || []}
                    onChange={(breeds) => setFormData({...formData, dog_breeds_handled: breeds})}
                    specializationBreeds={formData.breed_specialization || []}
                    onSpecializationChange={(breeds) => setFormData({...formData, breed_specialization: breeds})}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </form>
      </div>

      {/* Fixed Bottom Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}
            className="flex-1 h-12"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitEditRequestMutation.isPending || uploading}
            className="flex-1 h-12 bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {submitEditRequestMutation.isPending ? 'Enviando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false);
          setTempImageUrl(null);
        }}
        imageUrl={tempImageUrl}
        onSave={handleCroppedImage}
        aspectRatio={editingImageType === 'cover' ? 3 : 1}
        circularCrop={editingImageType === 'photo'}
      />
    </div>
  );
}