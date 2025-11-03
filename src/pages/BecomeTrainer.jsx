
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Award, Upload, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion"; // Added for multi-step form animations
import BreedSelector from "../components/professionals/BreedSelector"; // New import
import ServiceAreaSelector from "../components/professionals/ServiceAreaSelector"; // New import

export default function BecomeTrainer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState({
    photo: false,
    id: false,
    background: false, // This field is not currently used in the form, but kept as per original structure
    address: false,
    certificates: {} // This field is not currently used in the form, but kept as per original structure
  });

  const [currentStep, setCurrentStep] = useState(1); // State for multi-step form
  const totalSteps = 3; // Define total number of steps

  const [formData, setFormData] = useState({
    trainer_name: "",
    photo_url: "",
    bio: "",
    location: "",
    service_areas: [], // New field
    hourly_rate: "",
    experience_years: "",
    phone: "",
    training_specialties: [],
    training_methodologies: [], // New field
    dog_sizes: [], // Existing field
    dog_breeds_handled: [], // New field
    breed_specialization: [], // New field
    consultation_options: [],
    availability: [],
    // languages: [], // Removed as per outline, as it's not present in the new formData definition
    certifications: [],
    id_document_url: "",
    background_check_url: "", // This field is not currently used in the form, but kept as per original structure
    proof_of_address_url: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_routing_number: "",
  });

  const trainingMethodologies = [ // New constant data
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

  const toggleArrayItem = (field, value) => {
    const current = formData[field];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setFormData({ ...formData, [field]: updated });
  };

  const toggleMethodology = (methodValue, setAsPrimary = false) => { // Implemented as per outline
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

  const canProceedToNextStep = (step) => { // Logic to determine if user can proceed to next step
    switch (step) {
      case 1:
        return (
          formData.trainer_name.trim() !== "" &&
          formData.photo_url.trim() !== "" &&
          formData.bio.trim() !== "" &&
          formData.location.trim() !== "" &&
          formData.hourly_rate !== "" &&
          formData.experience_years !== "" &&
          formData.phone.trim() !== "" &&
          formData.training_specialties.length > 0 &&
          formData.training_methodologies.length > 0 &&
          formData.consultation_options.length > 0
          // service_areas, dog_breeds_handled, breed_specialization are optional for proceeding
        );
      case 2:
        return (
          formData.id_document_url.trim() !== "" &&
          formData.proof_of_address_url.trim() !== ""
          // Certifications are optional to have, but if present, fields inside should be valid
        );
      case 3:
        return (
          formData.bank_account_holder.trim() !== "" &&
          formData.bank_account_number.trim() !== "" &&
          formData.bank_routing_number.trim() !== ""
        );
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (canProceedToNextStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      alert("Please fill in all required fields to proceed.");
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canProceedToNextStep(totalSteps)) { // Final check for the last step's requirements
      alert("Please fill in all required fields to submit your application.");
      return;
    }
    await createTrainerMutation.mutateAsync({
      ...formData,
      hourly_rate: parseFloat(formData.hourly_rate),
      experience_years: parseFloat(formData.experience_years),
      verification_status: "pending"
    });
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

                  {/* Basic Info */}
                  <div className="grid md:grid-cols-2 gap-6">
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

                  {/* Service Areas - NEW */}
                  <div className="space-y-2">
                    <Label>Service Areas</Label>
                    <ServiceAreaSelector
                      serviceAreas={formData.service_areas}
                      onChange={(areas) => setFormData({...formData, service_areas: areas})}
                    />
                  </div>

                  {/* Training Specialties */}
                  <div className="space-y-3">
                    <Label>Training Specialties *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { value: "basic_obedience", label: "Basic Obedience" },
                        { value: "behavior_modification", label: "Behavior Modification" },
                        { value: "puppy_training", label: "Puppy Training" },
                        { value: "aggression", label: "Aggression" },
                        { value: "anxiety", label: "Anxiety & Fear" },
                        { value: "socialization", label: "Socialization" },
                      ].map(specialty => (
                        <div key={specialty.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`specialty-${specialty.value}`}
                            checked={formData.training_specialties.includes(specialty.value)}
                            onCheckedChange={() => toggleArrayItem('training_specialties', specialty.value)}
                          />
                          <label htmlFor={`specialty-${specialty.value}`} className="text-sm font-medium cursor-pointer">
                            {specialty.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Training Methodologies - NEW */}
                  <div className="space-y-3">
                    <Label>Training Methodologies *</Label>
                    <p className="text-sm text-gray-600 mb-3">
                      Select all that apply. Mark one as primary.
                    </p>
                    <div className="grid gap-3">
                      {trainingMethodologies.map(method => {
                        const selected = formData.training_methodologies.find(m => m.methodology_name === method.value);
                        return (
                          <div key={method.value} className={`border-2 rounded-xl p-4 transition-all ${
                            selected?.primary
                              ? 'border-purple-500 bg-purple-50'
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
                                      {selected.primary ? "★ Primary" : "Set as Primary"}
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

                  {/* Dog Breeds - NEW */}
                  <div className="space-y-2">
                    <Label>Dog Breeds You Have Experience With</Label>
                    <BreedSelector
                      selectedBreeds={formData.dog_breeds_handled}
                      onChange={(breeds) => setFormData({...formData, dog_breeds_handled: breeds})}
                      specializationBreeds={formData.breed_specialization}
                      onSpecializationChange={(breeds) => setFormData({...formData, breed_specialization: breeds})}
                    />
                  </div>

                  {/* Consultation Options */}
                  <div className="space-y-3">
                    <Label>Consultation Methods *</Label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: "in_person", label: "In-Person" },
                        { value: "online", label: "Online" },
                        { value: "hybrid", label: "Hybrid" },
                      ].map(method => (
                        <div key={method.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`method-consultation-${method.value}`} // Unique ID to avoid conflict with training methodologies
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
                        <Label>Government ID *</Label>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(e, 'id_document_url', 'id')}
                          disabled={uploading.id}
                          required
                        />
                        {formData.id_document_url && <p className="text-sm text-green-600">✓ Uploaded</p>}
                      </div>

                      <div className="space-y-2">
                        <Label>Proof of Address *</Label>
                        <Input
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
                        <Label>Account Holder Name *</Label>
                        <Input
                          required
                          value={formData.bank_account_holder}
                          onChange={(e) => setFormData({...formData, bank_account_holder: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bank Account Number *</Label>
                        <Input
                          required
                          value={formData.bank_account_number}
                          onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Routing Number *</Label>
                        <Input
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
