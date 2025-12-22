import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Save, AlertCircle, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import BreedSelector from "../components/professionals/BreedSelector";
import ServiceAreaSelector from "../components/professionals/ServiceAreaSelector";
import OptimizedImageUpload from "../components/adoption/OptimizedImageUpload";
import ImageCropModal from "../components/ui/ImageCropModal";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditTrainerProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [editingImageType, setEditingImageType] = useState('photo');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: trainerProfile, isLoading } = useQuery({
    queryKey: ['myTrainerProfile', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.TrainerProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const [formData, setFormData] = useState({});

  React.useEffect(() => {
    if (trainerProfile) {
      setFormData({ ...trainerProfile });
    }
  }, [trainerProfile]);

  const submitEditRequestMutation = useMutation({
    mutationFn: async (changes) => {
      const currentUser = await base44.auth.me();
      
      await base44.entities.ProfileEditRequest.create({
        profile_id: trainerProfile.id,
        profile_type: 'trainer',
        professional_name: trainerProfile.trainer_name,
        professional_email: currentUser.email,
        requested_changes: changes,
        original_data: {
          services_offered: trainerProfile.services_offered,
          hourly_rate: trainerProfile.hourly_rate
        },
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileEditRequests'] });
      toast.success('✅ Alterações enviadas para aprovação do administrador. Suas mudanças serão aplicadas após revisão.', {
        duration: 5000
      });
      setTimeout(() => navigate(createPageUrl('ProfessionalDashboard')), 2000);
    },
    onError: (error) => {
      toast.error('Erro ao enviar: ' + error.message);
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
          if (userProfiles && userProfiles.length > 0) {
             await base44.entities.UserProfile.update(userProfiles[0].id, { profile_photo_url: file_url });
          }
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          toast.success("Foto atualizada e sincronizada!");
        } catch (syncError) {
          console.error("Error syncing photo:", syncError);
          toast.success("Foto ajustada!");
        }
      } else {
        setFormData({ ...formData, cover_photo_url: file_url });
        toast.success("Foto de capa carregada!");
      }
    } catch (error) {
      toast.error("Erro ao fazer upload.");
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
      toast.error("Erro ao fazer upload do vídeo.");
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for sensitive changes (Services or Price)
    const newServices = formData.services_offered;
    const newHourlyRate = parseFloat(formData.hourly_rate);
    const oldServices = trainerProfile.services_offered;
    const oldHourlyRate = trainerProfile.hourly_rate;

    // Separate changes
    const sensitiveChanges = {};
    const directChanges = {};

    Object.keys(formData).forEach(key => {
      if (JSON.stringify(formData[key]) !== JSON.stringify(trainerProfile[key])) {
        if (key === 'services_offered' || key === 'hourly_rate') {
           sensitiveChanges[key] = formData[key];
        } else {
           directChanges[key] = formData[key];
        }
      }
    });

    // Handle Direct Changes (Bio, Location, Photos, etc)
    if (Object.keys(directChanges).length > 0) {
        try {
            await base44.entities.TrainerProfile.update(trainerProfile.id, directChanges);
            toast.success("Informações gerais atualizadas!");
        } catch (err) {
            console.error("Failed to update direct info", err);
            toast.error("Erro ao atualizar informações gerais.");
        }
    }

    // Handle Sensitive Changes (Edit Request)
    if (Object.keys(sensitiveChanges).length > 0) {
        submitEditRequestMutation.mutate(sensitiveChanges);
    } else if (Object.keys(directChanges).length > 0) {
        queryClient.invalidateQueries(['myTrainerProfile']);
        setTimeout(() => navigate(createPageUrl('ProfessionalDashboard')), 1000);
    } else {
        toast.info('Nenhuma alteração detectada.');
    }
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
        duration_options: [],
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => base44.auth.redirectToLogin(window.location.href)}>
          Entrar
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!trainerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Perfil não encontrado</h2>
            <p className="text-gray-600 mb-6">Você ainda não tem um perfil de treinador.</p>
            <Button onClick={() => navigate(createPageUrl('BecomeTrainer'))}>
              Criar Perfil de Treinador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Alterações sujeitas a aprovação:</strong> Mudanças de preços e serviços necessitam aprovação do Admin.
          </AlertDescription>
        </Alert>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl">Editar Perfil de Treinador</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photos */}
              <div className="space-y-2">
                <Label>Fotos</Label>
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <Label className="text-sm font-medium">Foto de Perfil</Label>
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-100 group shadow-lg">
                      {formData.photo_url ? (
                        <img
                          src={formData.photo_url}
                          alt="Profile"
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label htmlFor="photo" className="cursor-pointer p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors">
                          <Upload className="w-5 h-5 text-white" />
                        </label>
                      </div>
                    </div>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                         const file = e.target.files[0];
                         if(file) {
                             const objectUrl = URL.createObjectURL(file);
                             setTempImageUrl(objectUrl);
                             setCropModalOpen(true);
                             setEditingImageType('photo');
                         }
                      }}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('photo').click()}>
                      Alterar Foto
                    </Button>
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <Label className="text-sm font-medium">Foto de Capa</Label>
                    <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50 group shadow-md">
                      {formData.cover_photo_url ? (
                        <img
                          src={formData.cover_photo_url}
                          alt="Cover"
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 gap-2">
                          <Upload className="w-5 h-5" />
                          <span>Adicionar Capa</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label htmlFor="cover" className="cursor-pointer p-3 bg-white/20 rounded-full hover:bg-white/40 transition-colors">
                          <Upload className="w-6 h-6 text-white" />
                        </label>
                      </div>
                    </div>
                    <Input
                      id="cover"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                         const file = e.target.files[0];
                         if(file) {
                             const objectUrl = URL.createObjectURL(file);
                             setTempImageUrl(objectUrl);
                             setCropModalOpen(true);
                             setEditingImageType('cover');
                         }
                      }}
                      className="hidden"
                    />
                    <div className="flex justify-end">
                         <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('cover').click()}>
                            Alterar Capa
                         </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Video */}
              <div className="space-y-2">
                <Label>Vídeo de Apresentação</Label>
                {formData.video_intro_url && (
                  <video src={formData.video_intro_url} controls className="w-full max-w-md rounded-xl mb-2" />
                )}
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploading}
                />
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.trainer_name || ""}
                    onChange={(e) => setFormData({...formData, trainer_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Localização</Label>
                  <Input
                    value={formData.location || ""}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preço Base (€/hora)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate || ""}
                    onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="351912345678"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label>Sobre Você</Label>
                <Textarea
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={5}
                />
              </div>

              {/* Service Areas */}
              <div className="space-y-2">
                <Label>Áreas de Serviço</Label>
                <ServiceAreaSelector
                  serviceAreas={formData.service_areas || []}
                  onChange={(areas) => setFormData({...formData, service_areas: areas})}
                />
              </div>

              {/* Services */}
              <div className="border-t-2 border-blue-100 pt-6 space-y-4">
                <Label className="text-xl font-bold">Serviços de Treino</Label>
                
                <Alert className="border-orange-300 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900 text-sm">
                    Alterações de preços e serviços necessitam aprovação do Admin antes de aparecerem no site.
                  </AlertDescription>
                </Alert>

                {(formData.services_offered || []).map((service, index) => (
                  <Card key={index} className="p-4 bg-blue-50 border-2 border-blue-200">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{service.service_name}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(index)}
                          className="text-red-600"
                        >
                          Remover
                        </Button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <Input
                          placeholder="Nome do Serviço"
                          value={service.service_name || ""}
                          onChange={(e) => updateService(index, 'service_name', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Preço (€)"
                          value={service.price || ""}
                          onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <Textarea
                        placeholder="Descrição"
                        value={service.description || ""}
                        onChange={(e) => updateService(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </Card>
                ))}

                <Button type="button" variant="outline" onClick={addService} className="w-full">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Adicionar Novo Serviço
                </Button>
              </div>

              {/* Dog Sizes */}
              <div className="space-y-3">
                <Label>Tamanhos de Cães</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: "small", label: "Pequeno" },
                    { value: "medium", label: "Médio" },
                    { value: "large", label: "Grande" },
                    { value: "extra_large", label: "Extra Grande" },
                  ].map(size => (
                    <div key={size.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={(formData.dog_sizes || []).includes(size.value)}
                        onCheckedChange={() => toggleArrayItem('dog_sizes', size.value)}
                      />
                      <label className="text-sm font-medium cursor-pointer">
                        {size.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dog Breeds */}
              <div className="space-y-2">
                <Label>Raças com Experiência</Label>
                <BreedSelector
                  selectedBreeds={formData.dog_breeds_handled || []}
                  onChange={(breeds) => setFormData({...formData, dog_breeds_handled: breeds})}
                  specializationBreeds={formData.breed_specialization || []}
                  onSpecializationChange={(breeds) => setFormData({...formData, breed_specialization: breeds})}
                />
              </div>

              {/* Portfolio */}
              <div className="space-y-2 border-t-2 border-blue-100 pt-6">
                <Label className="block text-base font-semibold">Portfolio de Trabalhos</Label>
                <OptimizedImageUpload
                  onImagesChange={(urls) => {
                    const portfolio = urls.map(url => ({
                      media_url: url,
                      media_type: 'photo',
                      title: 'Treino',
                      category: 'training',
                      is_featured: false
                    }));
                    setFormData({ ...formData, portfolio });
                  }}
                  currentImages={(formData.portfolio || []).map(p => p.media_url)}
                  maxImages={12}
                  maxSizeKB={500}
                  showPreview={true}
                />
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitEditRequestMutation.isPending || uploading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {submitEditRequestMutation.isPending ? 'Enviando...' : 'Salvar e Solicitar Aprovação'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <ImageCropModal
          isOpen={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setTempImageUrl(null);
            const photoInput = document.getElementById('photo');
            if(photoInput) photoInput.value = '';
            const coverInput = document.getElementById('cover');
            if(coverInput) coverInput.value = '';
          }}
          imageUrl={tempImageUrl}
          onSave={handleCroppedImage}
          aspectRatio={editingImageType === 'cover' ? 3 : 1}
          circularCrop={editingImageType === 'photo'}
        />
      </div>
    </div>
  );
}