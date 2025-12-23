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
      toast.success('✅ Todas as alterações foram enviadas para aprovação do administrador. Suas mudanças serão aplicadas após revisão.', {
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
    
    // ALL changes now require admin approval
    const allChanges = {};

    Object.keys(formData).forEach(key => {
      // Skip id, created_by, created_date, updated_date
      if (['id', 'created_by', 'created_date', 'updated_date'].includes(key)) return;
      
      if (JSON.stringify(formData[key]) !== JSON.stringify(walkerProfile[key])) {
        allChanges[key] = formData[key];
      }
    });

    if (Object.keys(allChanges).length === 0) {
      toast.info('Nenhuma alteração detectada.');
      return;
    }

    // Send ALL changes to admin approval
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}
          className="mb-4 md:mb-6"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Alert className="mb-4 md:mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
          <AlertDescription className="text-orange-900 text-xs md:text-sm">
            <strong>⚠️ Aprovação necessária:</strong> Todas as edições serão enviadas para revisão do administrador.
          </AlertDescription>
        </Alert>

        <Card className="glass-panel border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-2xl">
            <CardTitle className="text-xl md:text-2xl">Editar Perfil de Passeador</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-8 bg-white">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Photo */}
              <div className="space-y-3">
                <Label className="text-sm md:text-base font-semibold">Fotos do Perfil</Label>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
                  {/* Profile Photo */}
                  <div className="flex flex-col items-center gap-3 w-full md:w-auto">
                    <Label className="text-xs md:text-sm font-medium text-gray-700">Foto de Perfil</Label>
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-green-200 group shadow-lg bg-white">
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
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label htmlFor="photo" className="cursor-pointer p-3 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg">
                          <Upload className="w-5 h-5 text-green-600" />
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
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('photo').click()} className="w-full md:w-auto">
                      <Upload className="w-4 h-4 mr-2" />
                      Alterar Foto
                    </Button>
                  </div>

                  {/* Cover Photo */}
                  <div className="flex-1 w-full space-y-3">
                    <Label className="text-xs md:text-sm font-medium text-gray-700">Foto de Capa</Label>
                    <div className="relative w-full h-40 md:h-48 rounded-2xl overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-green-50 to-blue-50 group shadow-md">
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
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label htmlFor="cover" className="cursor-pointer p-3 bg-white/90 rounded-full hover:bg-white transition-colors shadow-lg">
                          <Upload className="w-6 h-6 text-green-600" />
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
                    <Button variant="outline" size="sm" onClick={() => document.getElementById('cover').click()} className="w-full md:w-auto">
                      <Upload className="w-4 h-4 mr-2" />
                      Alterar Capa
                    </Button>
                  </div>
                </div>
              </div>

              {/* Video */}
              <div className="space-y-3">
                <Label className="text-sm md:text-base font-semibold">Vídeo de Apresentação</Label>
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
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Nome</Label>
                  <Input
                    value={formData.walker_name || ""}
                    onChange={(e) => setFormData({...formData, walker_name: e.target.value})}
                    className="h-10 md:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Localização</Label>
                  <Input
                    value={formData.location || ""}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="h-10 md:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Preço Base - Cães/Gatos (€/hora)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate || ""}
                    onChange={(e) => setFormData({...formData, hourly_rate: parseFloat(e.target.value)})}
                    placeholder="Ex: 10€"
                    className="h-10 md:h-11"
                  />
                </div>

                {/* Exotic Rate - Only show if accepts exotic animals */}
                {(formData.accepted_animals || []).some(a => ['reptiles', 'arachnids', 'rodents', 'birds'].includes(a)) && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Preço Exóticos (€/visita)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.exotic_rate || ""}
                      onChange={(e) => setFormData({...formData, exotic_rate: parseFloat(e.target.value)})}
                      placeholder="Ex: 20€"
                      className="h-10 md:h-11"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">WhatsApp</Label>
                  <Input
                    value={formData.whatsapp_number || ""}
                    onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value.replace(/\D/g, '')})}
                    placeholder="351912345678"
                    className="h-10 md:h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">MBWay (Pagamentos)</Label>
                  <Input
                    value={formData.mbway_number || ""}
                    onChange={(e) => setFormData({...formData, mbway_number: e.target.value})}
                    placeholder="912345678"
                    className="h-10 md:h-11"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-3">
                <Label className="text-sm md:text-base font-semibold text-gray-700">Sobre Você</Label>
                <Textarea
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={4}
                  className="resize-none"
                  placeholder="Conte um pouco sobre sua experiência..."
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

              {/* Services - Structured */}
              <div className="border-t-2 border-gray-100 pt-4 md:pt-6 space-y-4">
                <Label className="text-base md:text-xl font-bold text-gray-800">Serviços Oferecidos</Label>
                


                {/* Display Current Services */}
                {(formData.services_offered || []).map((service, index) => (
                  <Card key={index} className="p-3 md:p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 shadow-sm">
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm md:text-base text-gray-800">{service.service_name || 'Novo Serviço'}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(index)}
                          className="text-red-600 h-8"
                        >
                          Remover
                        </Button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-3 md:gap-4">
                        <Input
                          placeholder="Nome do Serviço"
                          value={service.service_name || ""}
                          onChange={(e) => updateService(index, 'service_name', e.target.value)}
                          className="h-10"
                        />
                        <Input
                          type="number"
                          placeholder="Preço (€)"
                          value={service.price || ""}
                          onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                          className="h-10"
                        />
                      </div>

                      <Textarea
                        placeholder="Descrição do serviço"
                        value={service.description || ""}
                        onChange={(e) => updateService(index, 'description', e.target.value)}
                        rows={2}
                        className="resize-none text-sm"
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
                <Label className="text-sm md:text-base font-semibold text-gray-700">Tamanhos de Cães</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { value: "small", label: "Pequeno" },
                    { value: "medium", label: "Médio" },
                    { value: "large", label: "Grande" },
                    { value: "extra_large", label: "Extra Grande" },
                  ].map(size => (
                    <div key={size.value} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <Checkbox
                        checked={(formData.dog_sizes || []).includes(size.value)}
                        onCheckedChange={() => toggleArrayItem('dog_sizes', size.value)}
                      />
                      <label className="text-xs md:text-sm font-medium cursor-pointer text-gray-700">
                        {size.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dog Breeds */}
              <div className="space-y-3">
                <Label className="text-sm md:text-base font-semibold text-gray-700">Raças com Experiência</Label>
                <BreedSelector
                  selectedBreeds={formData.dog_breeds_handled || []}
                  onChange={(breeds) => setFormData({...formData, dog_breeds_handled: breeds})}
                  specializationBreeds={formData.breed_specialization || []}
                  onSpecializationChange={(breeds) => setFormData({...formData, breed_specialization: breeds})}
                />
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <Label className="text-sm md:text-base font-semibold text-gray-700">Disponibilidade</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { value: "morning", label: "Manhã", icon: "🌅" },
                    { value: "afternoon", label: "Tarde", icon: "☀️" },
                    { value: "evening", label: "Noite", icon: "🌙" },
                    { value: "night", label: "Madrugada", icon: "🌃" },
                  ].map(time => (
                    <div key={time.value} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <Checkbox
                        checked={(formData.availability || []).includes(time.value)}
                        onCheckedChange={() => toggleArrayItem('availability', time.value)}
                      />
                      <label className="text-xs md:text-sm font-medium cursor-pointer text-gray-700">
                        {time.icon} {time.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Animais Aceites */}
              <div className="space-y-3">
                <Label className="text-sm md:text-base font-semibold text-gray-700">Animais Aceites</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {[
                    { value: "dogs", label: "Cães", icon: "🐕" },
                    { value: "cats", label: "Gatos", icon: "🐈" },
                    { value: "reptiles", label: "Répteis", icon: "🦎" },
                    { value: "arachnids", label: "Aracnídeos", icon: "🕷️" },
                    { value: "rodents", label: "Roedores", icon: "🐹" },
                    { value: "birds", label: "Aves", icon: "🦜" },
                  ].map(animal => (
                    <div key={animal.value} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <Checkbox
                        checked={(formData.accepted_animals || ['dogs']).includes(animal.value)}
                        onCheckedChange={() => toggleArrayItem('accepted_animals', animal.value)}
                      />
                      <label className="text-xs md:text-sm font-medium cursor-pointer text-gray-700">
                        {animal.icon} {animal.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-3 border-t-2 border-gray-100 pt-4 md:pt-6">
                <Label className="text-sm md:text-base font-semibold text-gray-700">Sobre Você</Label>
                <Textarea
                  value={formData.bio || ""}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  rows={5}
                  className="resize-none"
                  placeholder="Conte sobre sua experiência e paixão por animais..."
                />
              </div>

              {/* Portfolio */}
              <div className="space-y-3 border-t-2 border-gray-100 pt-4 md:pt-6">
                <Label className="block text-sm md:text-base font-semibold text-gray-700">Portfolio de Trabalhos</Label>
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

              <div className="flex flex-col md:flex-row gap-3 pt-6 border-t-2 border-gray-100 sticky bottom-0 bg-white pb-2 md:pb-0 md:static">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('ProfessionalDashboard'))}
                  className="flex-1 h-11 md:h-10 order-2 md:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitEditRequestMutation.isPending || uploading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-11 md:h-10 order-1 md:order-2 shadow-lg"
                >
                  <Save className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  {submitEditRequestMutation.isPending ? 'Enviando...' : 'Enviar para Aprovação'}
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