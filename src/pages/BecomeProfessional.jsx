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
import TrainingSpecializationManager from "../components/trainers/TrainingSpecializationManager";

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
    // Trainer specific (ALWAYS initialized as arrays)
    training_specialties: [],
    training_specializations: [],
    training_methodologies: [],
    consultation_options: [],
    training_philosophy: "",
    // Services check
    hasBoarding: false,
    boardingPrice: 25,
    hasHouseSitting: false,
    houseSittingPrice: 30,
    hasDropIn: false,
    dropInPrice: 15,
    // Multi-Country Tax Fields
    country_of_operation: "",
    tax_id_portugal: "",
    tax_id_spain: "",
    france_professional_type: "",
    tax_id_france: "",
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data) => {
      // SEMPRE criar apenas WalkerProfile (unificado)
      // Se for "both" ou "trainer", marcamos is_verified_trainer = true
      const isAlsoTrainer = professionalType === 'trainer' || professionalType === 'both';
      
      console.log('📝 Creating WalkerProfile with data:', { isAlsoTrainer, training_specializations: data.training_specializations });
      
      const walkerProfile = await base44.entities.WalkerProfile.create({
        walker_name: data.name,
        age: data.age || 0,
        photo_url: data.photo_url || "",
        cover_photo_url: data.cover_photo_url || "",
        video_intro_url: data.video_intro_url || "",
        bio: data.bio || "",
        location: data.location,
        service_areas: Array.isArray(data.service_areas) ? data.service_areas : [],
        hourly_rate: data.hourly_rate,
        services_offered: Array.isArray(data.services_offered) ? data.services_offered : [],
        experience_years: data.experience_years || 0,
        phone: data.phone || "",
        whatsapp_number: data.whatsapp_number,
        is_active: false,
        verification_status: "pending",
        dog_sizes: Array.isArray(data.dog_sizes) ? data.dog_sizes : [],
        dog_breeds_handled: Array.isArray(data.dog_breeds_handled) ? data.dog_breeds_handled : [],
        breed_specialization: Array.isArray(data.breed_specialization) ? data.breed_specialization : [],
        availability: Array.isArray(data.availability) ? data.availability : [],
        id_document_url: data.id_document_url || "",
        proof_of_address_url: data.proof_of_address_url || "",
        bank_account_holder: data.bank_account_holder || "",
        bank_account_number: data.bank_account_number || "",
        bank_routing_number: data.bank_routing_number || "",
        mbway_number: data.mbway_number || "",
        portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
        languages_spoken: Array.isArray(data.languages_spoken) ? data.languages_spoken : [],
        // Trainer fields (stored in same profile)
        is_verified_trainer: isAlsoTrainer,
        training_specialties: isAlsoTrainer ? (Array.isArray(data.training_specialties) ? data.training_specialties : []) : [],
        training_specializations: isAlsoTrainer ? (Array.isArray(data.training_specializations) ? data.training_specializations : []) : [],
        training_philosophy: isAlsoTrainer ? (data.training_philosophy || "") : "",
        consultation_options: isAlsoTrainer ? (Array.isArray(data.consultation_options) ? data.consultation_options : []) : [],
        // Multi-Country Tax Fields
        country_of_operation: data.country_of_operation,
        tax_id_portugal: data.tax_id_portugal || "",
        tax_id_spain: data.tax_id_spain || "",
        france_professional_type: data.france_professional_type || "",
        tax_id_france: data.tax_id_france || ""
      });
      
      console.log('✅ WalkerProfile created:', walkerProfile.id);

      // Update user account_type
      await base44.auth.updateMe({ account_type: professionalType });
      
      return { walker: walkerProfile };
    },
    onSuccess: (data) => {
      console.log('✅ Profile created successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      queryClient.invalidateQueries({ queryKey: ['allWalkers'] });
      setShowSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl('Home'));
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
    
    console.log('🚀 Submitting professional profile...', { professionalType, formData });
    
    if (!professionalType) {
      toast.error("Por favor selecione o tipo de profissional");
      return;
    }

    // Validação básica obrigatória
    if (!formData.name || !formData.location || !formData.whatsapp_number) {
      toast.error("Preencha todos os campos obrigatórios (Nome, Localização, WhatsApp)");
      return;
    }

    // Validação Fiscal por País
    if (!formData.country_of_operation) {
      toast.error("Selecione o país de atuação");
      return;
    }

    if (formData.country_of_operation === 'portugal' && !formData.tax_id_portugal) {
      toast.error("NIF Português é obrigatório");
      return;
    }

    if (formData.country_of_operation === 'spain' && !formData.tax_id_spain) {
      toast.error("NIF/NIE/CIF Espanhol é obrigatório");
      return;
    }

    if (formData.country_of_operation === 'france') {
      if (!formData.france_professional_type) {
        toast.error("Indique se é Profissional ou Particular (França)");
        return;
      }
      if (formData.france_professional_type === 'professional' && !formData.tax_id_france) {
        toast.error("Número Fiscal é obrigatório para Profissionais em França");
        return;
      }
    }

    const rate = parseFloat(formData.hourly_rate);
    const exp = parseFloat(formData.experience_years) || 0;
    const ageNum = parseFloat(formData.age) || 0;

    if (isNaN(rate) || rate <= 0) {
      toast.error("Por favor indique uma taxa horária válida (maior que 0)");
      return;
    }

    // Construct Services Array
    const services = [];
    // Default Walk
    services.push({
      service_name: 'Dog Walking',
      description: 'Passeio regular para exercício e necessidades.',
      duration_options: ['30 min', '60 min'],
      price: rate,
      custom_pricing: false
    });

    if (formData.hasBoarding) {
      services.push({
        service_name: 'Dog Boarding',
        description: 'Cuidado 24/7, ambiente familiar, fotos diárias.',
        duration_options: ['24h'],
        price: parseFloat(formData.boardingPrice) || 25,
        custom_pricing: true
      });
    }
    if (formData.hasHouseSitting) {
      services.push({
        service_name: 'House Sitting',
        description: 'Cão fica em casa, segurança da casa, mantém a rotina.',
        duration_options: ['24h'],
        price: parseFloat(formData.houseSittingPrice) || 30,
        custom_pricing: true
      });
    }
    if (formData.hasDropIn) {
      services.push({
        service_name: 'Drop-in Visits',
        description: '30-60 min, alimentação, medicação.',
        duration_options: ['30 min', '60 min'],
        price: parseFloat(formData.dropInPrice) || 15,
        custom_pricing: true
      });
    }

    // Garantir que arrays de treinador estão sempre definidos (mesmo vazios)
    const finalData = {
      ...formData,
      hourly_rate: rate,
      services_offered: services,
      experience_years: exp,
      age: ageNum,
      is_active: false,
      verification_status: 'pending',
      // CRITICAL: Garantir arrays sempre definidos
      training_specializations: Array.isArray(formData.training_specializations) ? formData.training_specializations : [],
      training_specialties: Array.isArray(formData.training_specialties) ? formData.training_specialties : [],
      consultation_options: Array.isArray(formData.consultation_options) ? formData.consultation_options : []
    };

    console.log('✅ Final data prepared:', finalData);
    
    await createProfileMutation.mutateAsync(finalData);
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
                Tipo & Pessoal
              </span>
              <span className={`font-semibold ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                Serviços & Disponibilidade
              </span>
              <span className={`font-semibold ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                Verificação & Pagamento
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
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Candidatura Enviada!</h2>
                  <p className="text-lg text-gray-700 mb-2 font-semibold">
                    A sua candidatura está em análise
                  </p>
                  <p className="text-base text-gray-600 mb-6">
                    Iremos verificar os seus dados e documentos nas próximas 24-48 horas. Receberá um email quando o seu perfil for aprovado.
                  </p>
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-700">
                      Enquanto aguarda, pode explorar a plataforma e ver outros profissionais.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              {currentStep === 1 && <>Tipo de Profissional & Dados Pessoais</>}
              {currentStep === 2 && <>Serviços & Disponibilidade</>}
              {currentStep === 3 && <>Verificação & Pagamento</>}
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
                          <div 
                            className={`cursor-pointer transition-all rounded-lg border-2 p-6 text-center ${professionalType === 'walker' ? 'ring-4 ring-green-500 bg-green-50 border-green-500' : 'border-gray-200 hover:shadow-lg'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setProfessionalType('walker');
                            }}>
                            <Dog className="w-12 h-12 text-green-600 mx-auto mb-3" />
                            <h3 className="font-bold text-lg mb-2">Passeador</h3>
                            <p className="text-sm text-gray-600">Passeios e cuidados com cães</p>
                          </div>

                          <div 
                            className={`cursor-pointer transition-all rounded-lg border-2 p-6 text-center ${professionalType === 'trainer' ? 'ring-4 ring-blue-500 bg-blue-50 border-blue-500' : 'border-gray-200 hover:shadow-lg'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setProfessionalType('trainer');
                            }}>
                            <GraduationCap className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                            <h3 className="font-bold text-lg mb-2">Treinador</h3>
                            <p className="text-sm text-gray-600">Treino e comportamento canino</p>
                          </div>

                          <div 
                            className={`cursor-pointer transition-all rounded-lg border-2 p-6 text-center ${professionalType === 'both' ? 'ring-4 ring-purple-500 bg-purple-50 border-purple-500' : 'border-gray-200 hover:shadow-lg'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              setProfessionalType('both');
                            }}>
                            <div className="flex justify-center gap-2 mb-3">
                              <Dog className="w-10 h-10 text-green-600" />
                              <GraduationCap className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Ambos</h3>
                            <p className="text-sm text-gray-600">Passeador & Treinador</p>
                          </div>
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
                          if (!formData.name?.trim()) {
                            toast.error("Por favor indique o seu nome");
                            return;
                          }
                          if (!formData.location?.trim()) {
                            toast.error("Por favor indique a sua localização");
                            return;
                          }
                          if (!formData.whatsapp_number?.trim()) {
                            toast.error("Por favor indique o seu WhatsApp");
                            return;
                          }
                          if (!formData.hourly_rate || parseFloat(formData.hourly_rate) <= 0) {
                            toast.error("Por favor indique uma taxa horária válida");
                            return;
                          }
                          setCurrentStep(2);
                        }}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                        disabled={!professionalType}
                      >
                        Próximo: Serviços & Disponibilidade →
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: SERVICES & AVAILABILITY */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Fixed Service Selection */}
                    <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        Serviços Adicionais
                      </h3>
                      
                      {/* Alojamento */}
                      <div className="flex items-start gap-4">
                        <div className="flex items-center h-10">
                          <Checkbox
                            id="hasBoarding"
                            checked={formData.hasBoarding}
                            onCheckedChange={(c) => setFormData({...formData, hasBoarding: c})}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="hasBoarding" className="font-semibold text-gray-800">Alojamento para Cães (Boarding)</Label>
                            {formData.hasBoarding && (
                              <div className="relative w-24">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">€</span>
                                <Input 
                                  type="number" 
                                  className="h-8 pl-5 text-sm" 
                                  placeholder="25"
                                  value={formData.boardingPrice}
                                  onChange={(e) => setFormData({...formData, boardingPrice: e.target.value})}
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Cuidado 24/7 na sua casa, ambiente familiar, fotos diárias.</p>
                        </div>
                      </div>

                      {/* Casa Sitting */}
                      <div className="flex items-start gap-4">
                        <div className="flex items-center h-10">
                          <Checkbox
                            id="hasHouseSitting"
                            checked={formData.hasHouseSitting}
                            onCheckedChange={(c) => setFormData({...formData, hasHouseSitting: c})}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="hasHouseSitting" className="font-semibold text-gray-800">Casa-Sitting</Label>
                            {formData.hasHouseSitting && (
                              <div className="relative w-24">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">€</span>
                                <Input 
                                  type="number" 
                                  className="h-8 pl-5 text-sm" 
                                  placeholder="30"
                                  value={formData.houseSittingPrice}
                                  onChange={(e) => setFormData({...formData, houseSittingPrice: e.target.value})}
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Você fica na casa do cliente. Segurança da casa, mantém a rotina do cão.</p>
                        </div>
                      </div>

                      {/* Visitas */}
                      <div className="flex items-start gap-4">
                        <div className="flex items-center h-10">
                          <Checkbox
                            id="hasDropIn"
                            checked={formData.hasDropIn}
                            onCheckedChange={(c) => setFormData({...formData, hasDropIn: c})}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="hasDropIn" className="font-semibold text-gray-800">Visitas de Controlo (Drop-in)</Label>
                            {formData.hasDropIn && (
                              <div className="relative w-24">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">€</span>
                                <Input 
                                  type="number" 
                                  className="h-8 pl-5 text-sm" 
                                  placeholder="15"
                                  value={formData.dropInPrice}
                                  onChange={(e) => setFormData({...formData, dropInPrice: e.target.value})}
                                />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Visitas de 30-60 min para alimentação, medicação e companhia.</p>
                        </div>
                      </div>
                    </div>

                    {/* Service Areas */}
                    <div className="space-y-2">
                      <Label>Áreas de Serviço</Label>
                      <ServiceAreaSelector
                        serviceAreas={formData.service_areas}
                        onChange={(areas) => setFormData(prev => ({...prev, service_areas: areas}))}
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
                        onChange={(breeds) => setFormData(prev => ({...prev, dog_breeds_handled: breeds}))}
                        specializationBreeds={formData.breed_specialization}
                        onSpecializationChange={(breeds) => setFormData(prev => ({...prev, breed_specialization: breeds}))}
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
                        <h3 className="text-xl font-bold text-blue-900">
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

                        <TrainingSpecializationManager
                          specializations={formData.training_specializations || []}
                          onChange={(specs) => {
                            console.log('🎓 Specs updated:', specs);
                            setFormData({...formData, training_specializations: specs || []});
                          }}
                        />

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
                      <Label className="block text-base font-semibold">Portfólio (Opcional)</Label>
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

                    <div className="flex gap-3">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                        ← Anterior
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-blue-600"
                      >
                        Próximo: Verificação & Pagamento →
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: VERIFICATION & PAYMENT */}
                {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* País e Dados Fiscais */}
                  <div className="space-y-4 bg-yellow-50 border-2 border-yellow-300 p-6 rounded-xl">
                    <h3 className="font-bold text-lg text-gray-900">
                      País de Atuação & Dados Fiscais
                    </h3>
                    
                    <div className="space-y-2">
                      <Label>Onde Presta Serviços? *</Label>
                      <RadioGroup value={formData.country_of_operation} onValueChange={(val) => setFormData({...formData, country_of_operation: val})}>
                        <div className="grid grid-cols-3 gap-3">
                          <div 
                            className={`cursor-pointer transition-all rounded-lg border-2 p-4 text-center ${formData.country_of_operation === 'portugal' ? 'ring-2 ring-green-500 bg-green-50 border-green-500' : 'border-gray-200 hover:shadow-md hover:border-green-300'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData({...formData, country_of_operation: 'portugal'});
                            }}>
                            <div className="text-3xl mb-2">🇵🇹</div>
                            <h4 className="font-bold text-sm">Portugal</h4>
                          </div>

                          <div 
                            className={`cursor-pointer transition-all rounded-lg border-2 p-4 text-center ${formData.country_of_operation === 'spain' ? 'ring-2 ring-red-500 bg-red-50 border-red-500' : 'border-gray-200 hover:shadow-md hover:border-red-300'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData({...formData, country_of_operation: 'spain'});
                            }}>
                            <div className="text-3xl mb-2">🇪🇸</div>
                            <h4 className="font-bold text-sm">Espanha</h4>
                          </div>

                          <div 
                            className={`cursor-pointer transition-all rounded-lg border-2 p-4 text-center ${formData.country_of_operation === 'france' ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500' : 'border-gray-200 hover:shadow-md hover:border-blue-300'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData({...formData, country_of_operation: 'france'});
                            }}>
                            <div className="text-3xl mb-2">🇫🇷</div>
                            <h4 className="font-bold text-sm">França</h4>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Portugal: NIF */}
                    {formData.country_of_operation === 'portugal' && (
                      <div className="space-y-2 bg-white p-4 rounded-lg border-2 border-green-200">
                        <Label>NIF (Número de Identificação Fiscal) *</Label>
                        <Input
                          required
                          value={formData.tax_id_portugal}
                          onChange={(e) => setFormData({...formData, tax_id_portugal: e.target.value})}
                          placeholder="123456789"
                          maxLength={9}
                        />
                        <p className="text-xs text-gray-600">Obrigatório para emissão de Recibos Verdes ou Fatura</p>
                      </div>
                    )}

                    {/* Spain: NIF/NIE/CIF */}
                    {formData.country_of_operation === 'spain' && (
                      <div className="space-y-2 bg-white p-4 rounded-lg border-2 border-red-200">
                        <Label>NIF / NIE / CIF *</Label>
                        <Input
                          required
                          value={formData.tax_id_spain}
                          onChange={(e) => setFormData({...formData, tax_id_spain: e.target.value})}
                          placeholder="12345678A ou X1234567A"
                        />
                        <p className="text-xs text-gray-600">Obrigatório para autónomos ou empresas (Hacienda)</p>
                      </div>
                    )}

                    {/* France: Profissional ou Particular */}
                    {formData.country_of_operation === 'france' && (
                      <div className="space-y-4 bg-white p-4 rounded-lg border-2 border-blue-200">
                        <div className="space-y-2">
                        <Label>Tipo de Prestador *</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div 
                            className={`cursor-pointer rounded-lg border-2 p-3 text-center ${formData.france_professional_type === 'professional' ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500' : 'border-gray-200 hover:shadow-md'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData({...formData, france_professional_type: 'professional'});
                            }}>
                            <div className="font-semibold text-sm">Profissional</div>
                            <p className="text-xs text-gray-600">Auto-entrepreneur / Empresa</p>
                          </div>

                          <div 
                            className={`cursor-pointer rounded-lg border-2 p-3 text-center ${formData.france_professional_type === 'individual' ? 'ring-2 ring-green-500 bg-green-50 border-green-500' : 'border-gray-200 hover:shadow-md'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData({...formData, france_professional_type: 'individual', tax_id_france: ''});
                            }}>
                            <div className="font-semibold text-sm">Particular</div>
                            <p className="text-xs text-gray-600">Pessoa física</p>
                          </div>
                        </div>
                        </div>

                        <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-300">
                          <Label>Número Fiscal Francês {formData.france_professional_type === 'professional' ? '*' : '(Opcional)'}</Label>
                          <Input
                            required={formData.france_professional_type === 'professional'}
                            value={formData.tax_id_france}
                            onChange={(e) => setFormData({...formData, tax_id_france: e.target.value})}
                            placeholder={formData.france_professional_type === 'professional' ? "12345678901234 (SIRET)" : "Número fiscal (se tiver)"}
                          />
                          <p className="text-xs text-gray-600">
                            {formData.france_professional_type === 'professional' 
                              ? "SIRET obrigatório para auto-entrepreneurs e empresas" 
                              : "Particulares não precisam de SIRET. Declaração via CESU."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documentos de Verificação */}
                  <div className="space-y-4 bg-purple-50 border-2 border-purple-300 p-6 rounded-xl">
                    <h3 className="font-bold text-lg text-gray-900">
                      Documentos de Verificação
                    </h3>
                    <Alert className="border-blue-200 bg-blue-50">
                      <AlertDescription>
                        <strong>Opcional:</strong> Pode enviar agora ou depois no Painel Profissional.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>Documento de Identificação (Opcional)</Label>
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
                      <Label>Comprovativo de Morada (Opcional)</Label>
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
                  </div>

                  {/* Informação de Pagamento */}
                  <div className="space-y-4 bg-orange-50 border-2 border-orange-300 p-6 rounded-xl">
                    <h3 className="font-bold text-lg text-gray-900">
                      Informação de Pagamento
                    </h3>
                    <Alert className="border-blue-300 bg-blue-50">
                      <AlertDescription className="text-sm">
                        <strong>Opcional:</strong> Pode adicionar seus dados bancários agora ou depois no Painel Profissional. 
                        Os pagamentos ficarão retidos na sua carteira até configurar o método de saque.
                      </AlertDescription>
                    </Alert>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Nome do Titular da Conta (Opcional)</Label>
                        <Input
                          value={formData.bank_account_holder || ""}
                          onChange={(e) => setFormData({...formData, bank_account_holder: e.target.value})}
                          placeholder="João Silva"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>IBAN (Opcional)</Label>
                        <Input
                          value={formData.bank_account_number || ""}
                          onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                          placeholder="PT50000201231234567890154"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>SWIFT/BIC (Opcional)</Label>
                        <Input
                          value={formData.bank_routing_number || ""}
                          onChange={(e) => setFormData({...formData, bank_routing_number: e.target.value})}
                          placeholder="BOFAPORTXXX"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>MBWay (Opcional)</Label>
                        <Input
                          value={formData.mbway_number || ""}
                          onChange={(e) => setFormData({...formData, mbway_number: e.target.value})}
                          placeholder="912345678"
                        />
                        <p className="text-xs text-gray-500">
                          Sugestão: MBWay é o método mais rápido para receber pagamentos
                        </p>
                      </div>
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