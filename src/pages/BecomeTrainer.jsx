
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Award, Upload, Shield, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion"; // Import AnimatePresence
import BreedSelector from "../components/professionals/BreedSelector";
import ServiceAreaSelector from "../components/professionals/ServiceAreaSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import OptimizedImageUpload from "../components/adoption/OptimizedImageUpload"; // New import

export default function BecomeTrainer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [uploading, setUploading] = useState({
    photo: false,
    video: false, // New field for video upload status
    id: false,
    background: false,
    address: false,
    certificates: {}
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    trainer_name: "",
    photo_url: "",
    video_intro_url: "", // New field
    bio: "",
    location: "",
    service_areas: [],
    hourly_rate: "",
    services_offered: [], // New field
    experience_years: "",
    success_rate: null, // New field
    phone: "",
    training_specialties: [],
    training_methodologies: [],
    dog_sizes: [], // Existing field
    dog_breeds_handled: [], // New field
    breed_specialization: [], // New field
    consultation_options: [],
    availability: [],
    certifications: [],
    id_document_url: "",
    background_check_url: "",
    background_check_provider: "", // New field
    proof_of_address_url: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_routing_number: "",
    portfolio: [], // New field for trainer's portfolio
  });

  const trainingMethodologies = [
    { value: "positive_reinforcement", label: t('positiveReinforcement', language), description: t('positiveReinforcementDesc', language) },
    { value: "clicker_training", label: t('clickerTraining', language), description: t('clickerTrainingDesc', language) },
    { value: "model_rival", label: t('modelRival', language), description: t('modelRivalDesc', language) },
    { value: "relationship_based", label: t('relationshipBased', language), description: t('relationshipBasedDesc', language) },
    { value: "science_based", label: t('scienceBased', language), description: t('scienceBasedDesc', language) },
    { value: "balanced_training", label: t('balancedTraining', language), description: t('balancedTrainingDesc', language) },
  ];

  const createTrainerMutation = useMutation({
    mutationFn: (data) => base44.entities.TrainerProfile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      navigate(createPageUrl('Trainers'));
    },
  });

  const handleFileUpload = async (e, fieldName, uploadingKey) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [uploadingKey]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [fieldName]: file_url });
      toast.success("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Upload failed", {
        description: error.message || 'Please try again.'
      });
    }
    setUploading(prev => ({ ...prev, [uploadingKey]: false }));
  };

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, { name: "", issuing_organization: "", year: "", certificate_url: "" }]
    });
  };

  const updateCertification = (index, field, value) => {
    const updated = [...formData.certifications];
    updated[index][field] = value;
    setFormData({ ...formData, certifications: updated });
  };

  const addService = () => {
    setFormData({
      ...formData,
      services_offered: [...formData.services_offered, {
        service_name: "",
        description: "",
        duration_options: [],
        price: null, // Use null for initial price to allow easier validation later if 0 is a valid price
        package_options: [] // Placeholder for future use, not in current form
      }]
    });
  };

  const updateService = (index, field, value) => {
    const updated = [...formData.services_offered];
    // Special handling for price to ensure it's a number or null
    if (field === 'price') {
      updated[index][field] = value === '' ? null : parseFloat(value);
    } else {
      updated[index][field] = value;
    }
    setFormData({ ...formData, services_offered: updated });
  };

  const removeService = (index) => {
    setFormData({
      ...formData,
      services_offered: formData.services_offered.filter((_, i) => i !== index)
    });
  };

  const toggleArrayItem = (field, value) => {
    const current = formData[field];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const toggleMethodology = (methodValue, setAsPrimary = false) => {
    const existing = formData.training_methodologies.find(m => m.methodology_name === methodValue);

    if (existing) {
      if (setAsPrimary) {
        // Toggle primary status for the clicked methodology, and ensure only one is primary
        setFormData({
          ...formData,
          training_methodologies: formData.training_methodologies.map(m =>
            m.methodology_name === methodValue
              ? { ...m, primary: !m.primary } // Toggle primary for this one
              : { ...m, primary: false } // Set others to not primary
          )
        });
      } else {
        // Remove methodology if checkbox is unchecked
        setFormData({
          ...formData,
          training_methodologies: formData.training_methodologies.filter(m => m.methodology_name !== methodValue)
        });
      }
    } else {
      // Add new methodology if checkbox is checked
      const methodology = trainingMethodologies.find(m => m.value === methodValue);
      setFormData({
        ...formData,
        training_methodologies: [
          ...formData.training_methodologies,
          {
            methodology_name: methodology.value,
            description: methodology.description,
            primary: false // Default to not primary when first added
          }
        ]
      });
    }
  };

  const canProceedToNextStep = (step) => {
    let missingFields = [];

    switch (step) {
      case 1:
        if (formData.trainer_name.trim() === "") missingFields.push("Your Name");
        if (formData.photo_url.trim() === "") missingFields.push("Profile Photo");
        if (formData.bio.trim() === "") missingFields.push("Professional Bio");
        if (formData.location.trim() === "") missingFields.push("Location");
        if (formData.hourly_rate === "" || isNaN(parseFloat(formData.hourly_rate))) missingFields.push("Hourly Rate");
        if (formData.experience_years === "" || isNaN(parseFloat(formData.experience_years))) missingFields.push("Years of Experience");
        if (formData.success_rate === null || isNaN(parseFloat(formData.success_rate)) || parseFloat(formData.success_rate) < 0 || parseFloat(formData.success_rate) > 100) missingFields.push("Success Rate");
        if (formData.phone.trim() === "") missingFields.push("Phone Number");
        if (formData.training_specialties.length === 0) missingFields.push("Training Specialties");
        if (formData.training_methodologies.length === 0) missingFields.push("Training Methodologies");
        if (formData.consultation_options.length === 0) missingFields.push("Consultation Methods");

        // Validate services if any are added
        if (formData.services_offered.length > 0) {
          formData.services_offered.forEach((service, idx) => {
            if (service.service_name.trim() === "") {
              missingFields.push(`Service #${idx + 1} Name`);
            }
            if (service.price === null || isNaN(parseFloat(service.price))) {
              missingFields.push(`Service #${idx + 1} Price`);
            }
          });
        }
        break;
      case 2:
        if (formData.id_document_url.trim() === "") missingFields.push("Government ID");
        if (formData.proof_of_address_url.trim() === "") missingFields.push("Proof of Address");
        // Certifications are optional, background check is optional
        break;
      case 3:
        if (formData.bank_account_holder.trim() === "") missingFields.push("Account Holder Name");
        if (formData.bank_account_number.trim() === "") missingFields.push("Bank Account Number");
        if (formData.bank_routing_number.trim() === "") missingFields.push("Routing Number");
        break;
      default:
        // Should not happen
        missingFields.push("Unknown step validation error.");
    }

    if (missingFields.length > 0) {
      toast.error("Missing Required Fields", {
        description: missingFields.join(', ')
      });
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (canProceedToNextStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canProceedToNextStep(totalSteps)) { // Final check for the last step's requirements
      return;
    }

    // Prepare data for submission - convert hourly_rate, experience_years, and success_rate to numbers
    const dataToSubmit = {
      ...formData,
      hourly_rate: parseFloat(formData.hourly_rate),
      experience_years: parseFloat(formData.experience_years),
      success_rate: formData.success_rate !== null ? parseFloat(formData.success_rate) : null,
      services_offered: formData.services_offered.map(service => ({
        ...service,
        price: service.price !== null ? parseFloat(service.price) : null // Ensure price is number or null
      })),
      verification_status: "pending"
    };

    try {
      await createTrainerMutation.mutateAsync(dataToSubmit);
      toast.success("Profile submitted successfully!", {
        description: "Your trainer profile is under verification"
      });
    } catch (error) {
      console.error("Error submitting trainer profile:", error);
      toast.error("Error submitting profile", {
        description: error.message || 'Please try again.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('becomeTrainerTitle', language)}</h1>
          <p className="text-gray-600 text-lg">{t('becomeTrainerSubtitle', language)}</p>
        </div>

        <Alert className="mb-6 border-purple-200 bg-purple-50">
          <Shield className="h-5 w-5 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <strong>{t('professionalStandards', language)}</strong> {t('professionalStandardsDesc', language)}
          </AlertDescription>
        </Alert>

        {/* Progress Indicator */}
        <div className="mb-8 flex justify-center space-x-2">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-2 w-1/3 rounded-full ${
                index + 1 <= currentStep ? "bg-purple-600" : "bg-gray-300"
              }`}
            ></div>
          ))}
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-500 text-white">
            <CardTitle className="text-2xl">
              {currentStep === 1 && t('createYourProfile', language)}
              {currentStep === 2 && t('certificationsVerification', language)}
              {currentStep === 3 && t('paymentInformation', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Profile Photo */}
                  <div className="space-y-2">
                    <Label htmlFor="photo">{t('profilePhoto', language)} *</Label>
                    <div className="flex items-center gap-4">
                      {formData.photo_url ? (
                        <img
                          src={formData.photo_url}
                          alt="Preview"
                          className="w-32 h-32 rounded-xl object-cover border-4 border-purple-100"
                        />
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center border-4 border-gray-200">
                          <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'photo_url', 'photo')}
                          disabled={uploading.photo}
                          required
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          {uploading.photo ? t('uploadingPhoto', language) : t('uploadFriendlyPhoto', language)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Video Introduction */}
                  <div className="space-y-2 border-t-2 border-purple-100 pt-6">
                    <Label htmlFor="video_intro_upload">{t('videoIntroduction', language)} 📹</Label>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-3">
                      <p className="text-sm text-blue-900">
                        {t('videoIntroTip', language)}
                      </p>
                    </div>
                    {formData.video_intro_url ? (
                      <div className="flex items-center justify-center">
                        <video
                          src={formData.video_intro_url}
                          controls
                          className="w-full max-w-md rounded-xl border-4 border-purple-100"
                        />
                      </div>
                    ) : (
                      <div className="w-full max-w-md bg-gray-100 rounded-xl flex items-center justify-center border-4 border-gray-200 h-48">
                        <Upload className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <Input
                      id="video_intro_upload"
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

                  {/* Portfolio - Using Optimized Component */}
                  <div className="space-y-2 border-t-2 border-purple-100 pt-6">
                    <Label className="mb-3 block text-base font-semibold">
                      {t('trainingPortfolio', language)} 🏆 {t('optionalRecommended', language)}
                    </Label>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('portfolioDescription', language)}
                    </p>
                    <OptimizedImageUpload
                      onImagesChange={(urls) => {
                        const portfolio = urls.map(url => ({
                          media_url: url,
                          media_type: 'photo',
                          title: t('trainingExample', language),
                          category: 'training_session',
                          is_featured: false
                        }));
                        setFormData({ ...formData, portfolio });
                      }}
                      currentImages={formData.portfolio?.map(p => p.media_url) || []}
                      maxImages={15}
                      maxSizeKB={500}
                      showPreview={true}
                      language={language}
                    />
                  </div>

                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-6 border-t-2 border-purple-100 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="trainer_name">{t('yourName', language)} *</Label>
                      <Input
                        id="trainer_name"
                        required
                        value={formData.trainer_name}
                        onChange={(e) => setFormData({...formData, trainer_name: e.target.value})}
                        placeholder={t('joaoSilva', language)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('phoneNumber', language)} *</Label>
                      <Input
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+351 21 123 4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">{t('location', language)} *</Label>
                      <Input
                        id="location"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder={t('lisboaPortugal', language)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate">{t('hourlyRate', language)} *</Label>
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="0.01"
                        required
                        value={formData.hourly_rate}
                        onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                        placeholder="50"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">{t('professionalBio', language)} *</Label>
                    <Textarea
                      id="bio"
                      required
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder={t('professionalBioPlaceholder', language)}
                      rows={5}
                    />
                  </div>

                  {/* Service Areas */}
                  <div className="space-y-2 border-t-2 border-purple-100 pt-6">
                    <Label>{t('serviceAreas', language)}</Label>
                    <ServiceAreaSelector
                      serviceAreas={formData.service_areas}
                      onChange={(areas) => setFormData({...formData, service_areas: areas})}
                    />
                  </div>

                  {/* Training Specialties */}
                  <div className="space-y-3 border-t-2 border-purple-100 pt-6">
                    <Label className="text-lg font-semibold">{t('trainingSpecialties', language)} * 🎯</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('trainingSpecialtiesDesc', language)}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { value: "basic_obedience", label: t('basicObedience', language), desc: t('basicObedienceDesc', language) },
                        { value: "advanced_obedience", label: t('advancedObedience', language), desc: t('advancedObedienceDesc', language) },
                        { value: "behavior_modification", label: t('behaviorModification', language), desc: t('behaviorModificationDesc', language) },
                        { value: "puppy_training", label: t('puppyTraining', language), desc: t('puppyTrainingDesc', language) },
                        { value: "socialization", label: t('socialization', language), desc: t('socializationDesc', language) },
                        { value: "aggression", label: t('aggressionIssues', language), desc: t('aggressionIssuesDesc', language) },
                        { value: "anxiety", label: t('anxietyFear', language), desc: t('anxietyFearDesc', language) },
                        { value: "potty_training", label: t('pottyTraining', language), desc: t('pottyTrainingDesc', language) },
                        { value: "leash_training", label: t('leashTraining', language), desc: t('leashTrainingDesc', language) },
                        { value: "service_dog", label: t('serviceDogTraining', language), desc: t('serviceDogTrainingDesc', language) },
                        { value: "therapy_dog", label: t('therapyDogTraining', language), desc: t('therapyDogTrainingDesc', language) },
                        { value: "agility", label: t('agilityTraining', language), desc: t('agilityTrainingDesc', language) },
                        { value: "tricks", label: t('tricksCommands', language), desc: t('tricksCommandsDesc', language) },
                      ].map(specialty => (
                        <div key={specialty.value} className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          formData.training_specialties.includes(specialty.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => toggleArrayItem('training_specialties', specialty.value)}>
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`specialty-${specialty.value}`}
                              checked={formData.training_specialties.includes(specialty.value)}
                              onCheckedChange={() => toggleArrayItem('training_specialties', specialty.value)}
                            />
                            <div className="flex-1">
                              <label htmlFor={`specialty-${specialty.value}`} className="text-sm font-semibold cursor-pointer text-gray-900">
                                {specialty.label}
                              </label>
                              <p className="text-xs text-gray-600 mt-1">{specialty.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Training Methodologies */}
                  <div className="space-y-3 border-t-2 border-purple-100 pt-6">
                    <Label className="text-lg font-semibold">{t('trainingMethodologies', language)} * 🎓</Label>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('trainingMethodologiesDesc', language)}
                    </p>
                    <div className="grid gap-3">
                      {trainingMethodologies.map(method => {
                        const selected = formData.training_methodologies.find(m => m.methodology_name === method.value);
                        return (
                          <div key={method.value} className={`border-2 rounded-xl p-4 transition-all ${
                            selected?.primary
                              ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                              : selected
                              ? 'border-purple-300 bg-purple-25'
                              : 'border-gray-200 hover:border-purple-200'
                          }`}>
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={`method-${method.value}`}
                                checked={!!selected}
                                onCheckedChange={() => toggleMethodology(method.value)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <label htmlFor={`method-${method.value}`} className="font-semibold text-gray-900 cursor-pointer">
                                    {method.label}
                                  </label>
                                  {selected && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={selected.primary ? "default" : "outline"}
                                      onClick={() => toggleMethodology(method.value, true)}
                                      className="text-xs"
                                    >
                                      {selected.primary ? t('primaryMethod', language) : t('setPrimary', language)}
                                    </Button>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Professional Track Record */}
                  <div className="border-t-2 border-purple-100 pt-6">
                    <h3 className="text-lg font-semibold mb-4">{t('professionalTrackRecord', language)}</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="experience_years">{t('yearsOfExperience', language)} *</Label>
                        <Input
                          id="experience_years"
                          type="number"
                          required
                          value={formData.experience_years}
                          onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                          placeholder="5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="success_rate">{t('successRate', language)} *</Label>
                        <Input
                          id="success_rate"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          required
                          value={formData.success_rate === null ? '' : formData.success_rate}
                          onChange={(e) => setFormData({...formData, success_rate: parseFloat(e.target.value)})}
                          placeholder="95"
                        />
                        <p className="text-xs text-gray-500">
                          {t('successRateDesc', language)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dog Breeds */}
                  <div className="space-y-2 border-t-2 border-purple-100 pt-6">
                    <Label>{t('dogBreedsExperience', language)}</Label>
                    <BreedSelector
                      selectedBreeds={formData.dog_breeds_handled}
                      onChange={(breeds) => setFormData({...formData, dog_breeds_handled: breeds})}
                      specializationBreeds={formData.breed_specialization}
                      onSpecializationChange={(breeds) => setFormData({...formData, breed_specialization: breeds})}
                    />
                  </div>

                  {/* Consultation Options */}
                  <div className="space-y-3 border-t-2 border-purple-100 pt-6">
                    <Label>{t('consultationMethods', language)} *</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: "in_person", label: t('inPerson', language) },
                        { value: "online", label: t('online', language) },
                        { value: "hybrid", label: t('hybrid', language) },
                      ].map(method => (
                        <div key={method.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`method-consultation-${method.value}`}
                            checked={formData.consultation_options.includes(method.value)}
                            onCheckedChange={() => toggleArrayItem('consultation_options', method.value)}
                          />
                          <label htmlFor={`method-consultation-${method.value}`} className="text-sm font-medium cursor-pointer">
                            {method.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Services Offered */}
                  <div className="border-t-2 border-purple-100 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xl font-bold">{t('servicesPackages', language)}</Label>
                        <p className="text-sm text-gray-600 mt-1">{t('servicesPackagesDesc', language)}</p>
                      </div>
                      <Button type="button" variant="outline" onClick={addService}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        {t('addService', language)}
                      </Button>
                    </div>

                    {formData.services_offered.map((service, index) => (
                      <Card key={index} className="p-4 bg-purple-50 border-2 border-purple-200">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{t('programNumber', language).replace('#', `#${index + 1}`)}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(index)}
                              className="text-red-600"
                            >
                              {t('remove', language)}
                            </Button>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`service-name-${index}`}>{t('serviceName', language)}</Label>
                              <Input
                                id={`service-name-${index}`}
                                placeholder={t('serviceNamePlaceholder', language)}
                                value={service.service_name}
                                onChange={(e) => updateService(index, 'service_name', e.target.value)}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`service-price-${index}`}>{t('singleSessionPrice', language)} (€)</Label>
                              <Input
                                id={`service-price-${index}`}
                                type="number"
                                step="0.01"
                                placeholder="50.00"
                                value={service.price === null ? '' : service.price}
                                onChange={(e) => updateService(index, 'price', e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`service-description-${index}`}>{t('description', language)}</Label>
                            <Textarea
                              id={`service-description-${index}`}
                              placeholder={t('descriptionPlaceholder', language)}
                              value={service.description}
                              onChange={(e) => updateService(index, 'description', e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>{t('sessionDurationOptions', language)}</Label>
                            <div className="flex flex-wrap gap-2">
                              {['45min', '1hr', '1.5hr', '2hr'].map(duration => (
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
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Certifications */}
                  <div className="border-t-2 border-purple-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Award className="w-6 h-6 text-purple-600" />
                        {t('professionalCertifications', language)}
                      </h3>
                      <Button type="button" variant="outline" onClick={addCertification}>
                        {t('addCertification', language)}
                      </Button>
                    </div>
                    {formData.certifications.map((cert, index) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-4 mb-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input
                            placeholder={t('certificationName', language)}
                            value={cert.name}
                            onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          />
                          <Input
                            placeholder={t('issuingOrganization', language)}
                            value={cert.issuing_organization}
                            onChange={(e) => updateCertification(index, 'issuing_organization', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder={t('year', language)}
                            value={cert.year}
                            onChange={(e) => updateCertification(index, 'year', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Verification Documents */}
                  <div className="border-t-2 border-purple-100 pt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="w-6 h-6 text-purple-600" />
                      {t('verificationDocuments', language)} *
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="id_document_upload">{t('governmentId', language)} *</Label>
                        <Input
                          id="id_document_upload"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'id_document_url', 'id')}
                          disabled={uploading.id}
                          required
                        />
                        {formData.id_document_url && <p className="text-sm text-green-600">✓ {t('documentUploaded', language)}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="background_check_provider">{t('backgroundCheck', language)} 🛡️</Label>
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-3">
                          <p className="text-sm text-purple-900">
                            {t('buildTrustWithClients', language)}
                          </p>
                        </div>
                        <Select
                          value={formData.background_check_provider}
                          onValueChange={(value) => setFormData({...formData, background_check_provider: value})}
                        >
                          <SelectTrigger id="background_check_provider">
                            <SelectValue placeholder={t('selectProvider', language)} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checkr">Checkr</SelectItem>
                            <SelectItem value="sterling">Sterling</SelectItem>
                            <SelectItem value="goodhire">GoodHire</SelectItem>
                            <SelectItem value="certn">Certn</SelectItem>
                            <SelectItem value="other">{t('other', language)}</SelectItem>
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
                          <p className="text-sm text-green-600">✓ {t('documentUploaded', language)}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proof_of_address_upload">{t('proofOfAddress', language)} *</Label>
                        <Input
                          id="proof_of_address_upload"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'proof_of_address_url', 'address')}
                          disabled={uploading.address}
                          required
                        />
                        {formData.proof_of_address_url && <p className="text-sm text-green-600">✓ {t('documentUploaded', language)}</p>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="border-t-2 border-purple-100 pt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('paymentInformation', language)} *</h3>
                    <p className="text-gray-600 mb-4">{t('paymentInfoDesc', language)}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bank_account_holder">{t('accountHolderName', language)} *</Label>
                        <Input
                          id="bank_account_holder"
                          required
                          value={formData.bank_account_holder}
                          onChange={(e) => setFormData({...formData, bank_account_holder: e.target.value})}
                          placeholder={t('joaoSilva', language)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number">{t('bankAccountNumber', language)} *</Label>
                        <Input
                          id="bank_account_number"
                          required
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                          placeholder="PT50000201231234567890154"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_routing_number">{t('swiftBicCode', language)} *</Label>
                        <Input
                          id="bank_routing_number"
                          required
                          value={formData.bank_routing_number}
                          onChange={(e) => setFormData({...formData, bank_routing_number: e.target.value})}
                          placeholder="BOFAPORTXXX"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4 pt-6">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousStep}
                    className="flex-1"
                  >
                    {t('previous', language)}
                  </Button>
                )}
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!canProceedToNextStep(currentStep)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                  >
                    {t('next', language)}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createTrainerMutation.isPending || !canProceedToNextStep(currentStep)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                  >
                    {createTrainerMutation.isPending ? t('submitting', language) : t('submitForVerification', language)}
                  </Button>
                )}
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
