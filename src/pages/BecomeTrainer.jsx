
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
import { motion } from "framer-motion";
import BreedSelector from "../components/professionals/BreedSelector";
import ServiceAreaSelector from "../components/professionals/ServiceAreaSelector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BecomeTrainer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  });

  const trainingMethodologies = [
    { value: "positive_reinforcement", label: "Positive Reinforcement", description: "Reward-based training focusing on desired behaviors" },
    { value: "clicker_training", label: "Clicker Training", description: "Using a marker signal to communicate correct behavior" },
    { value: "model_rival", label: "Model-Rival", description: "Dog learns by observing another dog or person" },
    { value: "relationship_based", label: "Relationship-Based", description: "Focus on building trust and communication" },
    { value: "science_based", label: "Science-Based", description: "Evidence-based methods from behavioral science" },
    { value: "balanced_training", label: "Balanced Training", description: "Combination of positive and corrective methods" },
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
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Error uploading ${uploadingKey}: ${error.message || 'Please try again.'}`);
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
      alert(`Please fill in the following required fields to proceed:\n- ${missingFields.join('\n- ')}`);
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
    } catch (error) {
      console.error("Error submitting trainer profile:", error);
      alert(`Error submitting profile: ${error.message || 'Please try again.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Become a Certified Trainer</h1>
          <p className="text-gray-600 text-lg">Join our network of professional dog trainers</p>
        </div>

        <Alert className="mb-6 border-purple-200 bg-purple-50">
          <Shield className="h-5 w-5 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <strong>Professional Standards:</strong> All trainers must submit certifications and documents for verification.
            This ensures quality training for all dogs on our platform.
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
              {currentStep === 1 && "Create Your Trainer Profile - Basic Info"}
              {currentStep === 2 && "Certifications & Verification"}
              {currentStep === 3 && "Payment Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Profile Photo */}
                  <div className="space-y-2">
                    <Label htmlFor="photo">Profile Photo *</Label>
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
                          {uploading.photo ? "Uploading..." : "Upload a professional photo"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* NEW: Video Introduction */}
                  <div className="space-y-2 border-t-2 border-purple-100 pt-6">
                    <Label htmlFor="video_intro_upload">Video Introduction (Optional but Recommended) 📹</Label>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-3">
                      <p className="text-sm text-blue-900">
                        <strong>💡 Show your training style!</strong> Record a 1-2 minute video demonstrating your approach and personality.
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
                      {uploading.video ? "Uploading video..." : "MP4, MOV, AVI (max 100MB)"}
                    </p>
                  </div>

                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-6 border-t-2 border-purple-100 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="trainer_name">Your Name *</Label>
                      <Input
                        id="trainer_name"
                        required
                        value={formData.trainer_name}
                        onChange={(e) => setFormData({...formData, trainer_name: e.target.value})}
                        placeholder="John Smith"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+351 21 123 4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        placeholder="Lisbon, Portugal"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate">Hourly Rate (€) *</Label>
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
                    <Label htmlFor="bio">Professional Bio *</Label>
                    <Textarea
                      id="bio"
                      required
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Describe your training philosophy, methods, and what makes you unique..."
                      rows={5}
                    />
                  </div>

                  {/* Service Areas */}
                  <div className="space-y-2 border-t-2 border-purple-100 pt-6">
                    <Label>Service Areas</Label>
                    <ServiceAreaSelector
                      serviceAreas={formData.service_areas}
                      onChange={(areas) => setFormData({...formData, service_areas: areas})}
                    />
                  </div>

                  {/* Training Specialties - ENHANCED */}
                  <div className="space-y-3 border-t-2 border-purple-100 pt-6">
                    <Label className="text-lg font-semibold">Training Specialties * 🎯</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Select all training areas you specialize in. These will be searchable by potential clients.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { value: "basic_obedience", label: "Basic Obedience", desc: "Sit, stay, come, heel basics" },
                        { value: "advanced_obedience", label: "Advanced Obedience", desc: "Off-leash control, complex commands" },
                        { value: "behavior_modification", label: "Behavior Modification", desc: "Correcting unwanted behaviors" },
                        { value: "puppy_training", label: "Puppy Training", desc: "Early socialization & basics" },
                        { value: "socialization", label: "Socialization", desc: "Interaction with people & dogs" },
                        { value: "aggression", label: "Aggression Issues", desc: "Managing aggressive behavior" },
                        { value: "anxiety", label: "Anxiety & Fear", desc: "Separation anxiety, phobias" },
                        { value: "potty_training", label: "Potty Training", desc: "Housebreaking & accidents" },
                        { value: "leash_training", label: "Leash Training", desc: "Pulling, lunging prevention" },
                        { value: "service_dog", label: "Service Dog Training", desc: "Task-specific training" },
                        { value: "therapy_dog", label: "Therapy Dog Training", desc: "Certification preparation" },
                        { value: "agility", label: "Agility Training", desc: "Obstacle courses, competitions" },
                        { value: "tricks", label: "Tricks & Commands", desc: "Fun tricks and advanced commands" },
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

                  {/* Training Methodologies - ENHANCED */}
                  <div className="space-y-3 border-t-2 border-purple-100 pt-6">
                    <Label className="text-lg font-semibold">Training Methodologies * 🎓</Label>
                    <p className="text-sm text-gray-600 mb-3">
                      Select all methodologies you use. Mark one as your primary approach. This helps clients find trainers that match their training philosophy.
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
                                      {selected.primary ? "★ Primary Method" : "Set as Primary"}
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

                  {/* Success Rate & Experience - NEW SECTION */}
                  <div className="border-t-2 border-purple-100 pt-6">
                    <h3 className="text-lg font-semibold mb-4">Professional Track Record</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="experience_years">Years of Experience *</Label>
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
                        <Label htmlFor="success_rate">Success Rate (%) *</Label>
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
                          Percentage of clients who achieved their training goals
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dog Breeds - NEW */}
                  <div className="space-y-2 border-t-2 border-purple-100 pt-6">
                    <Label>Dog Breeds You Have Experience With</Label>
                    <BreedSelector
                      selectedBreeds={formData.dog_breeds_handled}
                      onChange={(breeds) => setFormData({...formData, dog_breeds_handled: breeds})}
                      specializationBreeds={formData.breed_specialization}
                      onSpecializationChange={(breeds) => setFormData({...formData, breed_specialization: breeds})}
                    />
                  </div>

                  {/* Consultation Options */}
                  <div className="space-y-3 border-t-2 border-purple-100 pt-6">
                    <Label>Consultation Methods *</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: "in_person", label: "In-Person" },
                        { value: "online", label: "Online" },
                        { value: "hybrid", label: "Hybrid" },
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

                  {/* NEW: Services Offered */}
                  <div className="border-t-2 border-purple-100 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xl font-bold">Services & Packages</Label>
                        <p className="text-sm text-gray-600 mt-1">Define your training programs and pricing</p>
                      </div>
                      <Button type="button" variant="outline" onClick={addService}>
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add Service
                      </Button>
                    </div>

                    {formData.services_offered.map((service, index) => (
                      <Card key={index} className="p-4 bg-purple-50 border-2 border-purple-200">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">Program #{index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeService(index)}
                              className="text-red-600"
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`service-name-${index}`}>Service Name</Label>
                              <Input
                                id={`service-name-${index}`}
                                placeholder="e.g., Basic Obedience"
                                value={service.service_name}
                                onChange={(e) => updateService(index, 'service_name', e.target.value)}
                                required // Made required if service exists
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`service-price-${index}`}>Single Session Price (€)</Label>
                              <Input
                                id={`service-price-${index}`}
                                type="number"
                                step="0.01"
                                placeholder="50.00"
                                value={service.price === null ? '' : service.price} // Handle null for empty input
                                onChange={(e) => updateService(index, 'price', e.target.value)}
                                required // Made required if service exists
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`service-description-${index}`}>Description</Label>
                            <Textarea
                              id={`service-description-${index}`}
                              placeholder="What does this training program include..."
                              value={service.description}
                              onChange={(e) => updateService(index, 'description', e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Session Duration Options</Label>
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
                        Professional Certifications
                      </h3>
                      <Button type="button" variant="outline" onClick={addCertification}>
                        Add Certification
                      </Button>
                    </div>
                    {formData.certifications.map((cert, index) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-4 mb-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <Input
                            placeholder="Certification Name"
                            value={cert.name}
                            onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          />
                          <Input
                            placeholder="Issuing Organization"
                            value={cert.issuing_organization}
                            onChange={(e) => updateCertification(index, 'issuing_organization', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Year"
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
                      Verification Documents *
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="id_document_upload">Government ID *</Label>
                        <Input
                          id="id_document_upload"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'id_document_url', 'id')}
                          disabled={uploading.id}
                          required
                        />
                        {formData.id_document_url && <p className="text-sm text-green-600">✓ Uploaded</p>}
                      </div>

                      {/* ENHANCED: Background Check */}
                      <div className="space-y-2">
                        <Label htmlFor="background_check_provider">Background Check (Highly Recommended) 🛡️</Label>
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-3">
                          <p className="text-sm text-purple-900">
                            <strong>✓ Build trust with clients!</strong> Upload a background check from a trusted provider.
                          </p>
                        </div>
                        <Select
                          value={formData.background_check_provider}
                          onValueChange={(value) => setFormData({...formData, background_check_provider: value})}
                        >
                          <SelectTrigger id="background_check_provider">
                            <SelectValue placeholder="Select Provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checkr">Checkr</SelectItem>
                            <SelectItem value="sterling">Sterling</SelectItem>
                            <SelectItem value="goodhire">GoodHire</SelectItem>
                            <SelectItem value="certn">Certn</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
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
                          <p className="text-sm text-green-600">✓ Document uploaded</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="proof_of_address_upload">Proof of Address *</Label>
                        <Input
                          id="proof_of_address_upload"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'proof_of_address_url', 'address')}
                          disabled={uploading.address}
                          required
                        />
                        {formData.proof_of_address_url && <p className="text-sm text-green-600">✓ Uploaded</p>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Banking Info */}
                  <div className="border-t-2 border-purple-100 pt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Information *</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bank_account_holder">Account Holder Name *</Label>
                        <Input
                          id="bank_account_holder"
                          required
                          value={formData.bank_account_holder}
                          onChange={(e) => setFormData({...formData, bank_account_holder: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_account_number">Bank Account Number *</Label>
                        <Input
                          id="bank_account_number"
                          required
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bank_routing_number">Routing Number *</Label>
                        <Input
                          id="bank_routing_number"
                          required
                          value={formData.bank_routing_number}
                          onChange={(e) => setFormData({...formData, bank_routing_number: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex gap-4 pt-6">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousStep}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                )}
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!canProceedToNextStep(currentStep)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createTrainerMutation.isPending || !canProceedToNextStep(currentStep)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
                  >
                    {createTrainerMutation.isPending ? "Submitting..." : "Submit for Verification"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
