import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dog, GraduationCap, Upload, CheckCircle2, Sparkles, PlusCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import BreedSelector from "../components/professionals/BreedSelector";
import ServiceAreaSelector from "../components/professionals/ServiceAreaSelector";
import CustomServiceManager from "../components/professionals/CustomServiceManager";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import OptimizedImageUpload from "../components/adoption/OptimizedImageUpload";
import { toast } from "sonner";
import CenteredAvatarUpload from "@/components/ui/CenteredAvatarUpload";

export default function BecomeProfessional() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploading, setUploading] = useState({ photo: false, video: false, id: false, address: false });
  
  const [professionalType, setProfessionalType] = useState(""); // walker, trainer, both
  
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    photo_url: "",
    cover_photo_url: "",
    video_intro_url: "",
    bio: "",
    location: "",
    service_areas: [],
    hourly_rate: "",
    services_offered: [],
    experience_years: "",
    phone: "",
    whatsapp_number: "",
    dog_sizes: [],
    dog_breeds_handled: [],
    breed_specialization: [],
    availability: [],
    id_document_url: "",
    proof_of_address_url: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_routing_number: "",
    mbway_number: "",
    portfolio: [],
    languages_spoken: [],
    // Trainer specific
    training_specialties: [],
    training_methodologies: [],
    consultation_options: [],
    training_philosophy: "",
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data) => {
      const results = {};
      
      // Create Walker Profile
      if (professionalType === 'walker' || professionalType === 'both') {
        results.walker = await base44.entities.WalkerProfile.create({
          walker_name: data.name,
          age: data.age,
          photo_url: data.photo_url,
          cover_photo_url: data.cover_photo_url,
          video_intro_url: data.video_intro_url,
          bio: data.bio,
          location: data.location,
          service_areas: data.service_areas,
          hourly_rate: data.hourly_rate,
          services_offered: data.services_offered,
          experience_years: data.experience_years,
          phone: data.phone,
          whatsapp_number: data.whatsapp_number,
          dog_sizes: data.dog_sizes,
          dog_breeds_handled: data.dog_breeds_handled,
          breed_specialization: data.breed_specialization,
          availability: data.availability,
          id_document_url: data.id_document_url,
          proof_of_address_url: data.proof_of_address_url,
          bank_account_holder: data.bank_account_holder,
          bank_account_number: data.bank_account_number,
          bank_routing_number: data.bank_routing_number,
          mbway_number: data.mbway_number,
          portfolio: data.portfolio,
          languages_spoken: data.languages_spoken,
          verification_status: "pending"
        });
      }
      
      // Create Trainer Profile
      if (professionalType === 'trainer' || professionalType === 'both') {
        results.trainer = await base44.entities.TrainerProfile.create({
          trainer_name: data.name,
          photo_url: data.photo_url,
          video_intro_url: data.video_intro_url,
          bio: data.bio,
          location: data.location,
          service_areas: data.service_areas,
          hourly_rate: data.hourly_rate,
          services_offered: data.services_offered,
          experience_years: data.experience_years,
          phone: data.phone,
          dog_sizes: data.dog_sizes,
          dog_breeds_handled: data.dog_breeds_handled,
          breed_specialization: data.breed_specialization,
          availability: data.availability,
          id_document_url: data.id_document_url,
          proof_of_address_url: data.proof_of_address_url,
          training_specialties: data.training_specialties,
          training_methodologies: data.training_methodologies,
          consultation_options: data.consultation_options,
          training_philosophy: data.training_philosophy,
          portfolio: data.portfolio,
          languages: data.languages_spoken,
          verification_status: "pending"
        });
      }

      // Update user account_type
      await base44.auth.updateMe({ account_type: professionalType });
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      setShowSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl('ProfessionalDashboard'));
      }, 3000);
    },
    onError: (error) => {
      console.error("Error creating profile:", error);
      toast.error("Erro ao criar perfil: " + error.message);
    }
  });

  const handleFileUpload = async (e, fieldName, uploadingKey) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [uploadingKey]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [fieldName]: file_url });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao fazer upload do ficheiro.");
    }
    setUploading(prev => ({ ...prev, [uploadingKey]: false }));
  };

  if (!userLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Necessário</h2>
            <p className="text-gray-600 mb-6">
              Você precisa estar logado para se candidatar como profissional.
            </p>
            <Button 
              onClick={() => base44.auth.redirectToLogin(window.location.href)} 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!professionalType) {
      toast.error("Por favor selecione o tipo de profissional");
      return;
    }

    const rate = parseFloat(formData.hourly_rate);
    const exp = parseFloat(formData.experience_years);
    const ageNum = parseFloat(formData.age);

    if (isNaN(rate) || rate <= 0) {
      toast.error("Taxa horária inválida.");
      return;
    }

    if (!formData.whatsapp_number) {
      toast.error("WhatsApp é obrigatório.");
      return;
    }

    await createProfileMutation.mutateAsync({
      ...formData,
      hourly_rate: rate,
      experience_years: isNaN(exp) ? 0 : exp,
      age: isNaN(ageNum) ? 0 : ageNum,
    });
  };

  const toggleArrayItem = (field, value) => {
    const current = formData[field];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const progress = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Torne-se um Profissional</h1>
          <p className="text-gray-600 text-lg">
            Passeador, Treinador ou Ambos - Você Escolhe!
          </p>
          
          <div className="max-w-2xl mx-auto mt-6">
            <Progress value={progress} className="h-3 mb-3" />
            <div className="flex justify-between text-sm">
              <span className={`font-semibold ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                Tipo & Perfil
              </span>
              <span className={`font-semibold ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                Documentos
              </span>
              <span className={`font-semibold ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                Pagamento
              </span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            >
              <Card className="max-w-md border-0 shadow-2xl">
                <CardContent className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-12 h-12 text-green-600" />
                    </div>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Candidatura Recebida!</h2>
                  <p className="text-lg text-gray-600">
                    Iremos analisar o seu perfil em até 24-48 horas.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              {currentStep === 1 && <>📋 Tipo de Profissional & Perfil</>}
              {currentStep === 2 && <>📄 Documentos de Verificação</>}
              {currentStep === 3 && <>💳 Informação de Pagamento</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                {/* STEP 1: TYPE SELECTION & PROFILE */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Professional Type Selection */}
                    <div className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl border-2 border-blue-200">
                      <Label className="text-xl font-bold">Quero ser:</Label>
                      <RadioGroup value={professionalType} onValueChange={setProfessionalType}>
                        <div className="grid md:grid-cols-3 gap-4">
                          <Card className={`cursor-pointer transition-all ${professionalType === 'walker' ? 'ring-4 ring-green-500 bg-green-50' : 'hover:shadow-lg'}`}
                            onClick={() => setProfessionalType('walker')}>
                            <CardContent className="p-6 text-center">
                              <RadioGroupItem value="walker" id="walker" className="sr-only" />
                              <Dog className="w-12 h-12 text-green-600 mx-auto mb-3" />
                              <h3 className="font-bold text-lg mb-2">Passeador</h3>
                              <p className="text-sm text-gray-600">Passeios e cuidados com cães</p>
                            </CardContent>
                          </Card>

                          <Card className={`cursor-pointer transition-all ${professionalType === 'trainer' ? 'ring-4 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'}`}
                            onClick={() => setProfessionalType('trainer')}>
                            <CardContent className="p-6 text-center">
                              <RadioGroupItem value="trainer" id="trainer" className="sr-only" />
                              <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                              <h3 className="font-bold text-lg mb-2">Treinador</h3>
                              <p className="text-sm text-gray-600">Treino e comportamento canino</p>
                            </CardContent>
                          </Card>

                          <Card className={`cursor-pointer transition-all ${professionalType === 'both' ? 'ring-4 ring-purple-500 bg-purple-50' : 'hover:shadow-lg'}`}
                            onClick={() => setProfessionalType('both')}>
                            <CardContent className="p-6 text-center">
                              <RadioGroupItem value="both" id="both" className="sr-only" />
                              <div className="flex justify-center gap-2 mb-3">
                                <Dog className="w-10 h-10 text-green-600" />
                                <GraduationCap className="w-10 h-10 text-blue-600" />
                              </div>
                              <h3 className="font-bold text-lg mb-2">Ambos</h3>
                              <p className="text-sm text-gray-600">Passeador & Treinador</p>
                            </CardContent>
                          </Card>
                        </div>
                      </RadioGroup>
                    </div>

                    {professionalType && (
                      <>
                        {/* Profile Photo */}
                        <div className="flex flex-col items-center justify-center w-full my-6">
                          <CenteredAvatarUpload 
                            currentImageUrl={formData.photo_url}
                            onImageChange={(url) => setFormData(prev => ({ ...prev, photo_url: url }))}
                          />
                        </div>

                        {/* Cover Photo */}
                        <div className="space-y-2">
                          <Label>Foto de Capa (Opcional)</Label>
                          <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden relative">
                            {formData.cover_photo_url ? (
                              <>
                                <img src={formData.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="absolute bottom-2 right-2"
                                  onClick={() => document.getElementById('cover_photo_input').click()}
                                >
                                  Alterar
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => document.getElementById('cover_photo_input').click()}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Carregar Capa
                              </Button>
                            )}
                            <Input
                              id="cover_photo_input"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, 'cover_photo_url', 'photo')}
                            />
                          </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Seu Nome *</Label>
                            <Input
                              required
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              placeholder="João Silva"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Idade</Label>
                            <Input
                              type="number"
                              value={formData.age}
                              onChange={(e) => setFormData({...formData, age: e.target.value})}
                              placeholder="25"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Telefone *</Label>
                            <Input
                              required
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              placeholder="+351 21 123 4567"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>WhatsApp *</Label>
                            <Input
                              required
                              value={formData.whatsapp_number}
                              onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value.replace(/\D/g, '')})}
                              placeholder="351912345678"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Localização *</Label>
                            <Input
                              required
                              value={formData.location}
                              onChange={(e) => setFormData({...formData, location: e.target.value})}
                              placeholder="Lisboa, Portugal"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Taxa Horária (€) *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              required
                              value={formData.hourly_rate}
                              onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                              placeholder="25"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Anos de Experiência</Label>
                            <Input
                              type="number"
                              value={formData.experience_years}
                              onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                              placeholder="3"
                            />
                          </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-2">
                          <Label>Sobre Você</Label>
                          <Textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            placeholder="Conte-nos sobre sua experiência com cães..."
                            rows={5}
                          />
                        </div>

                        {/* Custom Services */}
                        <CustomServiceManager
                          services={formData.services_offered}
                          onUpdate={(services) => setFormData({...formData, services_offered: services})}
                        />

                        {/* Service Areas */}
                        <div className="space-y-2">
                          <Label>Áreas de Serviço</Label>
                          <ServiceAreaSelector
                            serviceAreas={formData.service_areas}
                            onChange={(areas) => setFormData({...formData, service_areas: areas})}
                          />
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
                                  id={`size-${size.value}`}
                                  checked={formData.dog_sizes.includes(size.value)}
                                  onCheckedChange={() => toggleArrayItem('dog_sizes', size.value)}
                                />
                                <label htmlFor={`size-${size.value}`} className="text-sm font-medium cursor-pointer">
                                  {size.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Breeds */}
                        <div className="space-y-2">
                          <Label>Raças com Experiência</Label>
                          <BreedSelector
                            selectedBreeds={formData.dog_breeds_handled}
                            onChange={(breeds) => setFormData({...formData, dog_breeds_handled: breeds})}
                            specializationBreeds={formData.breed_specialization}
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
                                  id={`time-${time.value}`}
                                  checked={formData.availability.includes(time.value)}
                                  onCheckedChange={() => toggleArrayItem('availability', time.value)}
                                />
                                <label htmlFor={`time-${time.value}`} className="text-sm font-medium cursor-pointer">
                                  {time.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Languages */}
                        <div className="space-y-3">
                          <Label>Idiomas Falados</Label>
                          <div className="flex flex-wrap gap-2">
                            {["Português", "English", "Español", "Français", "Deutsch"].map(lang => (
                              <div key={lang} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border">
                                <Checkbox
                                  id={`lang-${lang}`}
                                  checked={formData.languages_spoken?.includes(lang)}
                                  onCheckedChange={() => toggleArrayItem('languages_spoken', lang)}
                                />
                                <label htmlFor={`lang-${lang}`} className="text-sm cursor-pointer">
                                  {lang}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Trainer Specific Fields */}
                        {(professionalType === 'trainer' || professionalType === 'both') && (
                          <div className="border-t-2 border-blue-200 pt-6 space-y-6">
                            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                              <GraduationCap className="w-6 h-6" />
                              Informações de Treino
                            </h3>

                            <div className="space-y-2">
                              <Label>Filosofia de Treino</Label>
                              <Textarea
                                value={formData.training_philosophy}
                                onChange={(e) => setFormData({...formData, training_philosophy: e.target.value})}
                                placeholder="Descreva sua abordagem e filosofia de treino..."
                                rows={4}
                              />
                            </div>

                            <div className="space-y-3">
                              <Label>Especialidades de Treino</Label>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { value: "basic_obedience", label: "Obediência Básica" },
                                  { value: "advanced_obedience", label: "Obediência Avançada" },
                                  { value: "behavior_modification", label: "Modificação de Comportamento" },
                                  { value: "puppy_training", label: "Treino de Cachorros" },
                                  { value: "aggression", label: "Agressão" },
                                  { value: "anxiety", label: "Ansiedade" },
                                ].map(spec => (
                                  <div key={spec.value} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`spec-${spec.value}`}
                                      checked={formData.training_specialties.includes(spec.value)}
                                      onCheckedChange={() => toggleArrayItem('training_specialties', spec.value)}
                                    />
                                    <label htmlFor={`spec-${spec.value}`} className="text-sm cursor-pointer">
                                      {spec.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label>Tipo de Consulta</Label>
                              <div className="flex flex-wrap gap-3">
                                {[
                                  { value: "in_person", label: "Presencial" },
                                  { value: "online", label: "Online" },
                                  { value: "hybrid", label: "Híbrido" },
                                ].map(opt => (
                                  <div key={opt.value} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`consult-${opt.value}`}
                                      checked={formData.consultation_options.includes(opt.value)}
                                      onCheckedChange={() => toggleArrayItem('consultation_options', opt.value)}
                                    />
                                    <label htmlFor={`consult-${opt.value}`} className="text-sm cursor-pointer">
                                      {opt.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Portfolio */}
                        <div className="space-y-2 border-t-2 border-green-100 pt-6">
                          <Label className="block text-base font-semibold">🖼️ Portfólio (Opcional)</Label>
                          <p className="text-sm text-gray-600 mb-4">
                            Fotos de passeios anteriores, cães felizes, etc.
                          </p>
                          <OptimizedImageUpload
                            onImagesChange={(urls) => {
                              const portfolio = urls.map(url => ({
                                media_url: url,
                                media_type: 'photo',
                                title: 'Trabalho',
                                category: 'walk',
                                is_featured: false
                              }));
                              setFormData({ ...formData, portfolio });
                            }}
                            currentImages={formData.portfolio?.map(p => p.media_url) || []}
                            maxImages={12}
                            maxSizeKB={500}
                            showPreview={true}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          if (!professionalType) {
                            toast.error("Selecione o tipo de profissional");
                            return;
                          }
                          setCurrentStep(2);
                        }}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        disabled={!professionalType}
                      >
                        Próximo: Documentos →
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: DOCUMENTS */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription>
                        <strong>Verificação Simplificada:</strong> Apenas ID e Comprovativo de Morada são necessários.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>Documento de Identificação *</Label>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'id_document_url', 'id')}
                        disabled={uploading.id}
                      />
                      {formData.id_document_url && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Documento carregado
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Comprovativo de Morada *</Label>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, 'proof_of_address_url', 'address')}
                        disabled={uploading.address}
                      />
                      {formData.proof_of_address_url && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          Documento carregado
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                        ← Anterior
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
                      >
                        Próximo: Pagamento →
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: PAYMENT */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Nome do Titular da Conta</Label>
                        <Input
                          value={formData.bank_account_holder}
                          onChange={(e) => setFormData({...formData, bank_account_holder: e.target.value})}
                          placeholder="João Silva"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>IBAN</Label>
                        <Input
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                          placeholder="PT50000201231234567890154"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>SWIFT/BIC</Label>
                        <Input
                          value={formData.bank_routing_number}
                          onChange={(e) => setFormData({...formData, bank_routing_number: e.target.value})}
                          placeholder="BOFAPORTXXX"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>MBWay (Opcional)</Label>
                        <Input
                          value={formData.mbway_number}
                          onChange={(e) => setFormData({...formData, mbway_number: e.target.value})}
                          placeholder="912345678"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                        ← Anterior
                      </Button>
                      <Button
                        type="submit"
                        disabled={createProfileMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold shadow-xl"
                      >
                        {createProfileMutation.isPending ? (
                          "Submetendo..."
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Submeter para Verificação
                          </span>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}