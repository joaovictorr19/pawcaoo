import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Save, AlertCircle, PlusCircle, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import BreedSelector from "../components/professionals/BreedSelector";
import ServiceAreaSelector from "../components/professionals/ServiceAreaSelector";
import OptimizedImageUpload from "../components/adoption/OptimizedImageUpload";
import ImageCropModal from "../components/ui/ImageCropModal";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditWalkerProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [editingImageType, setEditingImageType] = useState('photo'); // 'photo' or 'cover'

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
      
      // CRITICAL: ALL changes require admin approval - create request only
      await base44.entities.ProfileEditRequest.create({
        profile_type: 'walker',
        profile_id: walkerProfile.id,
        requester_email: currentUser.email,
        requester_name: currentUser.full_name,
        changes_requested: changes,
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

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Use URL.createObjectURL instead of FileReader for better performance and to avoid CORS/Tainted Canvas issues
    const objectUrl = URL.createObjectURL(file);
    setTempImageUrl(objectUrl);
    setCropModalOpen(true);
  };

  const handleCroppedImage = async (croppedFile) => {
    setUploading(true);
    setCropModalOpen(false);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
      
      if (editingImageType === 'photo') {
        setFormData({ ...formData, photo_url: file_url });
        
        // Sync immediately with User Profile and Auth as requested
        try {
          await base44.auth.updateMe({ profile_photo_url: file_url });
          
          // Update UserProfile entity if exists
          const userProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
          if (userProfiles && userProfiles.length > 0) {
             await base44.entities.UserProfile.update(userProfiles[0].id, { profile_photo_url: file_url });
          }
          
          // Invalidate queries to update header avatar immediately
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          toast.success("Foto atualizada e sincronizada com seu perfil pessoal!");
        } catch (syncError) {
          console.error("Error syncing photo:", syncError);
          toast.success("Foto ajustada! (Sincronização pendente)");
        }
      } else {
        // Cover Photo
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
    const oldServices = walkerProfile.services_offered;
    const oldHourlyRate = walkerProfile.hourly_rate;

    const hasSensitiveChanges = 
        JSON.stringify(newServices) !== JSON.stringify(oldServices) ||
        newHourlyRate !== oldHourlyRate;

    // Separate changes
    const sensitiveChanges = {};
    const directChanges = {};

    Object.keys(formData).forEach(key => {
      if (JSON.stringify(formData[key]) !== JSON.stringify(walkerProfile[key])) {
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
            await base44.entities.WalkerProfile.update(walkerProfile.id, directChanges);
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
        // If only direct changes, refresh
        queryClient.invalidateQueries(['myWalkerProfile']);
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
        <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!walkerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Perfil não encontrado</h2>
            <p className="text-gray-600 mb-6">Você ainda não tem um perfil de passeador.</p>
            <Button onClick={() => navigate(createPageUrl('BecomeWalker'))}>
              Criar Perfil de Passeador
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
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
            <strong>Alterações sujeitas a aprovação:</strong> Todas as edições serão revisadas por um administrador antes de serem publicadas.
          </AlertDescription>
        </Alert>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
            <CardTitle className="text-2xl">Editar Perfil de Passeador</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo */}
              <div className="space-y-2">
                <Label>Foto de Perfil</Label>
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Profile Photo */}
                  <div className="flex flex-col items-center gap-2">
                    <Label className="text-sm font-medium">Foto de Perfil</Label>
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-green-100 group shadow-lg">
                      {formData.photo_url ? (
                        <img
                          src={formData.photo_url}
                          alt="Profile"
                          className="w-full h-full object-cover object-center bg-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.walker_name || 'W') + '&background=10b981&color=fff&size=400';
                          }}
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
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('photo').click()}>
                      Alterar Foto
                    </Button>
                  </div>

                  {/* Cover Photo */}
                  <div className="flex-1 w-full space-y-2">
                    <Label className="text-sm font-medium">Foto de Capa</Label>
                    <div className="relative w-full h-32 md:h-40 rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50 group shadow-md">
                      {formData.cover_photo_url ? (
                        <img
                          src={formData.cover_photo_url}
                          alt="Cover"
                          className="w-full h-full object-cover object-center bg-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                          }}
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
                         <Button variant="outline" size="sm" onClick={() => document.getElementById('cover').click()}>
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
                    value={formData.walker_name || ""}
                    onChange={(e) => setFormData({...formData, walker_name: e.target.value})}
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
                  <Label>Taxa Horária (€)</Label>
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
                    value={formData.whatsapp_number || ""}
                    onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value.replace(/\D/g, '')})}
                    placeholder="351912345678"
                  />
                </div>

                <div className="space-y-2">
                  <Label>MBWay (Pagamentos)</Label>
                  <Input
                    value={formData.mbway_number || ""}
                    onChange={(e) => setFormData({...formData, mbway_number: e.target.value})}
                    placeholder="912345678"
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
              <div className="border-t-2 border-green-100 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-xl font-bold">Serviços Oferecidos</Label>
                  <Button type="button" variant="outline" onClick={addService}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Adicionar Serviço
                  </Button>
                </div>

                {(formData.services_offered || []).map((service, index) => (
                  <Card key={index} className="p-4 bg-green-50 border-2 border-green-200">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Serviço #{index + 1}</h4>
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

              {/* Availability */}
              <div className="space-y-3">
                <Label>Disponibilidade</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: "morning", label: "Manhã" },
                    { value: "afternoon", label: "Tarde" },
                    { value: "evening", label: "Noite" },
                    { value: "night", label: "Madrugada" },
                  ].map(time => (
                    <div key={time.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={(formData.availability || []).includes(time.value)}
                        onCheckedChange={() => toggleArrayItem('availability', time.value)}
                      />
                      <label className="text-sm font-medium cursor-pointer">
                        {time.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio */}
              <div className="space-y-2 border-t-2 border-green-100 pt-6">
                <Label className="block text-base font-semibold">Portfolio de Trabalhos</Label>
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
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
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
            // Reset inputs
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