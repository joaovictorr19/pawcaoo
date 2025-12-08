import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dog, Upload, DollarSign, Shield, FileText, CheckCircle2, Sparkles, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import BreedSelector from "../components/professionals/BreedSelector";
import ServiceAreaSelector from "../components/professionals/ServiceAreaSelector";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import OptimizedImageUpload from "../components/adoption/OptimizedImageUpload";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import ImageCropModal from "../components/ui/ImageCropModal";
import CenteredAvatarUpload from "@/components/ui/CenteredAvatarUpload";

export default function BecomeWalker() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploading, setUploading] = useState({
    photo: false,
    video: false,
    id: false,
    background: false,
    address: false
  });
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(null);
  const [cropFieldName, setCropFieldName] = useState(null);
  
  const [formData, setFormData] = useState({
    walker_name: "",
    photo_url: "",
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
    background_check_url: "",
    background_check_provider: "",
    proof_of_address_url: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_routing_number: "",
    portfolio: [],
    cover_photo_url: "",
    languages_spoken: [],
  });

  const [formErrors, setFormErrors] = useState({});

  // Validation function - All steps are now optional for easier registration
  const validateStep1 = () => {
    const errors = {};
    // Validate WhatsApp is present as requested
    if (!formData.whatsapp_number) {
      errors.whatsapp = "WhatsApp number is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    // Validation disabled - all fields are optional
    setFormErrors({});
    return true;
  };

  const validateStep3 = () => {
    // Validation disabled - all fields are optional
    setFormErrors({});
    return true;
  };

  const createWalkerMutation = useMutation({
    mutationFn: async (data) => {
      // Data is now saved for verification purposes
      return await base44.entities.WalkerProfile.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walkers'] });
      setShowSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl('Home'));
      }, 3000);
    },
    onError: (error) => {
      console.error("Error creating walker profile:", error);
      toast.error(t("errorCreatingProfile", language) + ": " + error.message);
    }
  });

  const handleFileUpload = async (e, fieldName, uploadingKey) => {
    const file = e.target.files[0];
    if (!file) return;

    // Se for foto de perfil, abrir modal de crop
    if (fieldName === 'photo_url' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempImageUrl(event.target.result);
        setCropFieldName(fieldName);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Upload direto para outros tipos
    setUploading(prev => ({ ...prev, [uploadingKey]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [fieldName]: file_url });
      setFormErrors(prev => ({ ...prev, [uploadingKey]: undefined }));
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(t("fileUploadError", language) || "Erro ao fazer upload do ficheiro.");
    }
    setUploading(prev => ({ ...prev, [uploadingKey]: false }));
  };

  const handleCroppedImage = async (croppedFile) => {
    setUploading(prev => ({ ...prev, photo: true }));
    setCropModalOpen(false);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
      setFormData({ ...formData, [cropFieldName]: file_url });
      setFormErrors(prev => ({ ...prev, photo: undefined }));
      toast.success("Foto ajustada com sucesso!");
    } catch (error) {
      console.error("Error uploading cropped image:", error);
      toast.error("Erro ao fazer upload da imagem.");
    }
    
    setUploading(prev => ({ ...prev, photo: false }));
    setTempImageUrl(null);
    setCropFieldName(null);
  };

  // Check for user login
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  if (!userLoading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('loginRequired', language) || "Login Necessário"}</h2>
            <p className="text-gray-600 mb-6">
              {t('loginToBecomeWalker', language) || "Você precisa estar logado para se candidatar como passeador."}
            </p>
            <Button 
              onClick={() => base44.auth.redirectToLogin(window.location.href)} 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {t('login', language) || "Entrar"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep3()) {
      toast.error(t("pleaseCorrectErrors", language) || "Por favor corrija os erros para prosseguir.");
      return;
    }

    // Validate numeric fields
    const rate = parseFloat(formData.hourly_rate);
    const exp = parseFloat(formData.experience_years);

    if (isNaN(rate)) {
      toast.error(t("invalidHourlyRate", language) || "Taxa horária inválida.");
      return;
    }

    try {
      await createWalkerMutation.mutateAsync({
        ...formData,
        hourly_rate: rate,
        experience_years: isNaN(exp) ? 0 : exp,
        verification_status: "pending",
        created_by: user?.email // Explicitly associating with user, though RLS handles it typically
      });
    } catch (error) {
      // Error is handled in onError of mutation
      console.error("Submission error caught:", error);
    }
  };

  const toggleArrayItem = (field, value) => {
    const current = formData[field];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
    // Clear specific errors related to these array fields if they exist
    if (field === 'dog_sizes' && updated.length > 0) setFormErrors(prev => ({ ...prev, sizes: undefined }));
    if (field === 'availability' && updated.length > 0) setFormErrors(prev => ({ ...prev, availability: undefined }));
  };

  const addService = () => {
    setFormData({
      ...formData,
      services_offered: [...formData.services_offered, {
        service_name: "",
        description: "",
        duration_options: [],
        price: 0,
        custom_pricing: false
      }]
    });
  };

  const addCommonService = (type) => {
    let name = "";
    let desc = "";
    
    if (type === 'walk') {
      name = t('walkService', language);
      desc = t('walkDesc', language);
    } else if (type === 'sitting') {
      name = t('sittingService', language);
      desc = t('sittingDesc', language);
    } else if (type === 'grooming') {
      name = t('groomingService', language);
      desc = t('groomingDesc', language);
    }

    setFormData({
      ...formData,
      services_offered: [...formData.services_offered, {
        service_name: name,
        description: desc,
        duration_options: ['1hr'],
        price: 0,
        custom_pricing: false
      }]
    });
    toast.success(t('serviceAdded', language));
  };

  const updateService = (index, field, value) => {
    const updated = [...formData.services_offered];
    updated[index][field] = value;
    setFormData({ ...formData, services_offered: updated });
  };

  const removeService = (index) => {
    setFormData({
      ...formData,
      services_offered: formData.services_offered.filter((_, i) => i !== index)
    });
  };

  // The `canProceedToStep` checks are now handled by `validateStepX` functions on button click.
  const progress = currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Dog className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('becomeWalkerTitle', language)}</h1>
          <p className="text-gray-600 text-lg mb-4">
            {t('becomeWalkerSubtitle', language)}
          </p>
          
          <div className="max-w-2xl mx-auto mb-6">
            <Progress value={progress} className="h-3 mb-3" />
            <div className="flex justify-between text-sm">
              <span className={`font-semibold ${currentStep >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                {t('step1Profile', language)}
              </span>
              <span className={`font-semibold ${currentStep >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
                {t('step2Documents', language)}
              </span>
              <span className={`font-semibold ${currentStep >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                {t('step3Payment', language)}
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
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('applicationReceived', language)}</h2>
                  <p className="text-lg text-gray-600">
                    {t('verificationTime', language)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <ImageCropModal
          isOpen={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            setTempImageUrl(null);
          }}
          imageUrl={tempImageUrl}
          onSave={handleCroppedImage}
          aspectRatio={1}
          circularCrop={cropFieldName === 'photo_url'}
        />

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>{t('professionalStandards', language)}</strong> {t('professionalStandardsDesc', language)}
          </AlertDescription>
        </Alert>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              {currentStep === 1 && <><Dog className="w-6 h-6" /> {t('step1Profile', language)}</>}
              {currentStep === 2 && <><Shield className="w-6 h-6" /> {t('step2Documents', language)}</>}
              {currentStep === 3 && <><DollarSign className="w-6 h-6" /> {t('step3Payment', language)}</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                {/* STEP 1: PROFILE */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Profile Photo */}
                    <div className="space-y-2 mb-6">
                      <Label htmlFor="photo">{t('profilePhoto', language)}</Label>
                      <CenteredAvatarUpload 
                        currentImageUrl={formData.photo_url}
                        onImageChange={(url) => {
                          setFormData(prev => ({ ...prev, photo_url: url }));
                          setFormErrors(prev => ({ ...prev, photo: undefined }));
                        }}
                      />
                      {formErrors.photo && (
                        <p className="text-sm text-red-600">{formErrors.photo}</p>
                      )}
                    </div>

                    {/* Cover Photo */}
                    <div className="space-y-2 mb-6">
                      <Label>{t('coverPhoto', language) || "Foto de Capa (Opcional)"}</Label>
                      <div className="w-full h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden relative">
                        {formData.cover_photo_url ? (
                          <>
                            <img src={formData.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute bottom-2 right-2 opacity-90"
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
                            disabled={Object.values(uploading).some(v => v)}
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
                          disabled={Object.values(uploading).some(v => v)}
                        />
                      </div>
                    </div>

                    {/* Video Introduction */}
                    <div className="space-y-2 mb-6 border-t-2 border-green-100 pt-6">
                      <Label htmlFor="video">{t('videoIntroduction', language)} 📹</Label>
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-3">
                        <p className="text-sm text-blue-900">
                          {t('videoIntroTip', language)}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-4">
                        {formData.video_intro_url ? (
                          <video
                            src={formData.video_intro_url}
                            controls
                            className="w-full max-w-md rounded-xl border-4 border-green-100"
                          />
                        ) : (
                          <div className="w-full max-w-md bg-gray-100 rounded-xl flex items-center justify-center border-4 border-gray-200 h-48">
                            <Upload className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <Input
                          id="video"
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e, 'video_intro_url', 'video')}
                          disabled={uploading.video}
                          className="mt-3"
                        />
                        <p className="text-sm text-gray-500">
                          {uploading.video ? t('uploadingVideo', language) : t('videoFormats', language)}
                        </p>
                      </div>
                    </div>

                    {/* Languages Spoken */}
                    <div className="space-y-2 mb-6 border-t-2 border-green-100 pt-6">
                        <Label>{t('languagesSpoken', language) || "Idiomas Falados"}</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {["Português", "English", "Español", "Français", "Deutsch"].map(lang => (
                            <div key={lang} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
                                <Checkbox
                                id={`lang-${lang}`}
                                checked={formData.languages_spoken?.includes(lang)}
                                onCheckedChange={() => toggleArrayItem('languages_spoken', lang)}
                                />
                                <label htmlFor={`lang-${lang}`} className="text-sm cursor-pointer select-none">
                                {lang}
                                </label>
                            </div>
                            ))}
                        </div>
                    </div>

                    {/* Portfolio Photos - Using Optimized Component */}
                    <div className="space-y-2 mb-6 border-t-2 border-green-100 pt-6">
                      <Label className="block text-base font-semibold flex items-center gap-2">
                        🖼️ {t('portfolioPhotos', language)}
                      </Label>
                      <p className="text-sm text-gray-600 mb-4">
                        {t('portfolioPhotosTip', language)}
                      </p>
                      <OptimizedImageUpload
                        onImagesChange={(urls) => {
                          const portfolio = urls.map(url => ({
                            media_url: url,
                            media_type: 'photo',
                            title: t('walk', language) || 'Passeio', // Default title, can be made configurable if needed
                            category: 'walk', // Default category
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

                    {/* Basic Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="walker_name">{t('yourName', language)}</Label>
                        <Input
                          id="walker_name"
                          required
                          value={formData.walker_name}
                          onChange={(e) => {
                            setFormData({...formData, walker_name: e.target.value});
                            setFormErrors(prev => ({ ...prev, name: undefined })); // Clear error on change
                          }}
                          placeholder="João Silva"
                          className={formErrors.name ? "border-red-500" : ""}
                        />
                        {formErrors.name && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('phoneNumber', language)}</Label>
                        <Input
                          id="phone"
                          required
                          value={formData.phone}
                          onChange={(e) => {
                            setFormData({...formData, phone: e.target.value});
                            setFormErrors(prev => ({ ...prev, phone: undefined })); // Clear error on change
                          }}
                          placeholder="+351 21 123 4567"
                          className={formErrors.phone ? "border-red-500" : ""}
                        />
                        {formErrors.phone && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.phone}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp_number">{t('whatsappRequired', language)}</Label>
                        <Input
                          id="whatsapp_number"
                          required
                          value={formData.whatsapp_number}
                          onChange={(e) => {
                            // Allow only numbers
                            const val = e.target.value.replace(/\D/g, '');
                            setFormData({...formData, whatsapp_number: val});
                            setFormErrors(prev => ({ ...prev, whatsapp: undefined }));
                          }}
                          placeholder="351912345678"
                          className={formErrors.whatsapp ? "border-red-500" : ""}
                        />
                        <p className="text-xs text-gray-500">{t('whatsappTip', language)}</p>
                        {formErrors.whatsapp && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.whatsapp}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">{t('location', language)}</Label>
                        <Input
                          id="location"
                          // required removed
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          placeholder="Lisboa, Portugal"
                        />
                      </div>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-2">
                              <Label htmlFor="hourly_rate">{t('hourlyRate', language)}</Label>
                              <Input
                                id="hourly_rate"
                                type="number"
                                step="0.01"
                                // required removed
                                value={formData.hourly_rate}
                                onChange={(e) => {
                                  setFormData({...formData, hourly_rate: e.target.value});
                                  setFormErrors(prev => ({ ...prev, rate: undefined })); // Clear error on change
                                }}
                                placeholder="25"
                                className={formErrors.rate ? "border-red-500" : ""}
                              />
                              <p className="text-xs text-gray-500">{t('platformCommission', language)}</p>
                              {formErrors.rate && (
                                <p className="text-sm text-red-600 mt-1">{formErrors.rate}</p>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('hourlyRateTip', language)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <div className="space-y-2">
                        <Label htmlFor="experience_years">{t('yearsOfExperience', language)}</Label>
                        <Input
                          id="experience_years"
                          type="number"
                          value={formData.experience_years}
                          onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                          placeholder="3"
                        />
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">{t('aboutYou', language)}</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder={t('aboutYouPlaceholder', language)}
                        rows={5}
                      />
                    </div>

                    {/* Services Offered */}
                    <div className="border-t-2 border-green-100 pt-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <Label className="text-xl font-bold">{t('servicesOffered', language)}</Label>
                            <p className="text-sm text-gray-600 mt-1">{t('servicesOfferedDesc', language)}</p>
                          </div>
                        </div>

                        {/* Common Services Suggestions */}
                        <div className="bg-green-50/50 rounded-lg p-3 mb-4">
                          <p className="text-xs font-semibold text-green-800 mb-2 uppercase tracking-wide">{t('commonServices', language)}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => addCommonService('walk')}
                              className="bg-white border-green-200 text-green-700 hover:bg-green-100"
                            >
                              🐕 {t('walkService', language)}
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => addCommonService('sitting')}
                              className="bg-white border-green-200 text-green-700 hover:bg-green-100"
                            >
                              🏠 {t('sittingService', language)}
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => addCommonService('grooming')}
                              className="bg-white border-green-200 text-green-700 hover:bg-green-100"
                            >
                              ✂️ {t('groomingService', language)}
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={addService}
                              className="text-gray-500 hover:text-green-700"
                            >
                              <PlusCircle className="w-4 h-4 mr-1" />
                              {t('addService', language)}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {formData.services_offered.map((service, index) => (
                        <Card key={index} className="p-4 bg-green-50 border-2 border-green-200">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900">{t('serviceNumber', language).replace('#', `#${index + 1}`)}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeService(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                {t('removeService', language)}
                              </Button>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>{t('serviceName', language)}</Label>
                                <Input
                                  placeholder={t('serviceNamePlaceholder', language)}
                                  value={service.service_name}
                                  onChange={(e) => updateService(index, 'service_name', e.target.value)}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>{t('price', language)} (€)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="25.00"
                                  value={service.price || ""}
                                  onChange={(e) => updateService(index, 'price', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>{t('description', language)}</Label>
                              <Textarea
                                placeholder={t('descriptionPlaceholder', language)}
                                value={service.description}
                                onChange={(e) => updateService(index, 'description', e.target.value)}
                                rows={3}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t('durationOptions', language)}</Label>
                              <div className="flex flex-wrap gap-2">
                                {['30min', '1hr', '1.5hr', '2hr'].map(duration => (
                                  <label key={duration} className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox
                                      checked={service.duration_options?.includes(duration)}
                                      onCheckedChange={() => {
                                        const current = service.duration_options || [];
                                        const updated = current.includes(duration)
                                          ? current.filter(d => d !== duration)
                                          : [...current, duration];
                                        updateService(index, 'duration_options', updated);
                                      }}
                                    />
                                    <span className="text-sm">{duration}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {/* Service Areas */}
                    <div className="space-y-2">
                      <Label>{t('serviceAreas', language)}</Label>
                      <ServiceAreaSelector
                        serviceAreas={formData.service_areas}
                        onChange={(areas) => setFormData({...formData, service_areas: areas})}
                      />
                    </div>

                    {/* Dog Sizes */}
                    <div className="space-y-3">
                      <Label>{t('dogSizesYouHandle', language)}</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { value: "small", label: t('small', language) },
                          { value: "medium", label: t('medium', language) },
                          { value: "large", label: t('large', language) },
                          { value: "extra_large", label: t('extraLarge', language) },
                        ].map(size => (
                          <div key={size.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`size-${size.value}`}
                              checked={formData.dog_sizes.includes(size.value)}
                              onCheckedChange={() => toggleArrayItem('dog_sizes', size.value)}
                              className={formErrors.sizes && !formData.dog_sizes.includes(size.value) ? "border-red-500" : ""}
                            />
                            <label htmlFor={`size-${size.value}`} className="text-sm font-medium cursor-pointer">
                              {size.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      {formErrors.sizes && (
                        <p className="text-sm text-red-600">{formErrors.sizes}</p>
                      )}
                    </div>

                    {/* Dog Breeds */}
                    <div className="space-y-2">
                      <Label>{t('dogBreedsExperience', language)}</Label>
                      <BreedSelector
                        selectedBreeds={formData.dog_breeds_handled}
                        onChange={(breeds) => setFormData({...formData, dog_breeds_handled: breeds})}
                        specializationBreeds={formData.breed_specialization}
                        onSpecializationChange={(breeds) => setFormData({...formData, breed_specialization: breeds})}
                      />
                    </div>

                    {/* Availability */}
                    <div className="space-y-3">
                      <Label>{t('yourAvailability', language)}</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { value: "morning", label: t('morning', language) },
                          { value: "afternoon", label: t('afternoon', language) },
                          { value: "evening", label: t('evening', language) },
                          { value: "night", label: t('night', language) },
                        ].map(time => (
                          <div key={time.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`time-${time.value}`}
                              checked={formData.availability.includes(time.value)}
                              onCheckedChange={() => toggleArrayItem('availability', time.value)}
                              className={formErrors.availability && !formData.availability.includes(time.value) ? "border-red-500" : ""}
                            />
                            <label htmlFor={`time-${time.value}`} className="text-sm font-medium cursor-pointer">
                              {time.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      {formErrors.availability && (
                        <p className="text-sm text-red-600">{formErrors.availability}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => {
                          if (validateStep1()) {
                            setCurrentStep(2);
                          } else {
                            toast.error(t("pleaseCorrectErrors", language) || "Por favor corrija os erros para prosseguir.");
                          }
                        }}
                        className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600"
                      >
                        {t('next', language)}: {t('step2Documents', language).split(':')[1]} →
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-2">
                            <Label>{t('governmentId', language)}</Label>
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(e, 'id_document_url', 'id')}
                              disabled={uploading.id}
                              // required removed
                              className={formErrors.id ? "border-red-500" : ""}
                            />
                            {formData.id_document_url && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                {t('documentUploaded', language)}
                              </div>
                            )}
                            {uploading.id && <p className="text-sm text-gray-500">{t('uploadingPhoto', language)}</p>}
                            {formErrors.id && (
                              <p className="text-sm text-red-600 mt-1">{formErrors.id}</p>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('idVerificationTip', language)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-2">
                            <Label>{t('backgroundCheck', language)} 🛡️</Label>
                            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-3">
                              <p className="text-sm text-green-900">
                                {t('backgroundCheckTip', language)}
                              </p>
                            </div>
                            <Select
                              value={formData.background_check_provider}
                              onValueChange={(value) => setFormData({...formData, background_check_provider: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t('selectProvider', language)} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="checkr">Checkr</SelectItem>
                                <SelectItem value="sterling">Sterling</SelectItem>
                                <SelectItem value="goodhire">GoodHire</SelectItem>
                                <SelectItem value="certn">Certn</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(e, 'background_check_url', 'background')}
                              disabled={uploading.background}
                              className="mt-2"
                            />
                            {formData.background_check_url && (
                              <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                                <CheckCircle2 className="w-4 h-4" />
                                {t('documentUploaded', language)}
                              </div>
                            )}
                            {uploading.background && <p className="text-sm text-gray-500">{t('uploadingPhoto', language)}</p>}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('backgroundCheckTipLong', language)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="space-y-2">
                            <Label>{t('proofOfAddress', language)}</Label>
                            <Input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(e, 'proof_of_address_url', 'address')}
                              disabled={uploading.address}
                              // required removed
                              className={formErrors.address ? "border-red-500" : ""}
                            />
                            {formData.proof_of_address_url && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                {t('documentUploaded', language)}
                              </div>
                            )}
                            {uploading.address && <p className="text-sm text-gray-500">{t('uploadingPhoto', language)}</p>}
                            {formErrors.address && (
                              <p className="text-sm text-red-600 mt-1">{formErrors.address}</p>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('addressVerificationTip', language)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        ← {t('previous', language)}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          if (validateStep2()) {
                            setCurrentStep(3);
                          } else {
                            toast.error(t("pleaseCorrectErrors", language) || "Por favor corrija os erros para prosseguir.");
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-500"
                      >
                        {t('next', language)}: Info de Pagamento →
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
                    <p className="text-gray-600">{t('paymentInfoDesc', language)}</p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bank_account_holder">{t('accountHolderName', language)}</Label>
                        <Input
                          id="bank_account_holder"
                          // required removed
                          value={formData.bank_account_holder}
                          onChange={(e) => {
                            setFormData({...formData, bank_account_holder: e.target.value});
                            setFormErrors(prev => ({ ...prev, holder: undefined })); // Clear error on change
                          }}
                          placeholder="João Silva"
                          className={formErrors.holder ? "border-red-500" : ""}
                        />
                        {formErrors.holder && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.holder}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number">{t('bankAccountNumber', language)}</Label>
                        <Input
                          id="bank_account_number"
                          // required removed
                          value={formData.bank_account_number}
                          onChange={(e) => {
                            setFormData({...formData, bank_account_number: e.target.value});
                            setFormErrors(prev => ({ ...prev, account: undefined })); // Clear error on change
                          }}
                          placeholder="PT50000201231234567890154"
                          className={formErrors.account ? "border-red-500" : ""}
                        />
                        {formErrors.account && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.account}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bank_routing_number">{t('swiftBicCode', language)}</Label>
                        <Input
                          id="bank_routing_number"
                          // required removed
                          value={formData.bank_routing_number}
                          onChange={(e) => {
                            setFormData({...formData, bank_routing_number: e.target.value});
                            setFormErrors(prev => ({ ...prev, routing: undefined })); // Clear error on change
                          }}
                          placeholder="BOFAPORTXXX"
                          className={formErrors.routing ? "border-red-500" : ""}
                        />
                        {formErrors.routing && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.routing}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="flex-1"
                      >
                        ← {t('previous', language)}
                      </Button>
                      <Button
                        type="submit"
                        disabled={createWalkerMutation.isPending || Object.values(uploading).some(v => v)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white h-14 text-lg font-semibold shadow-xl"
                      >
                        {createWalkerMutation.isPending ? (
                          t('submitting', language)
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            {t('submitForVerification', language)}
                          </>
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