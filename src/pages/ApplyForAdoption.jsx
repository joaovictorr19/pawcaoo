import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Home, ArrowLeft, CheckCircle2, PlusCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function ApplyForAdoption() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get('listing_id');
  const [currentStep, setCurrentStep] = useState(1);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: listing } = useQuery({
    queryKey: ['adoptionListing', listingId],
    queryFn: async () => {
      const listings = await base44.entities.AdoptionListing.list();
      return listings.find(l => l.id === listingId);
    },
    enabled: !!listingId,
  });

  const [formData, setFormData] = useState({
    applicant_name: user?.full_name || "",
    applicant_phone: user?.phone || "",
    applicant_address: user?.address || "",
    applicant_city: user?.city || "",
    applicant_postal_code: user?.postal_code || "",
    age: "",
    occupation: "",
    home_type: "",
    home_ownership: "",
    landlord_approval: false,
    has_yard: false,
    yard_fenced: false,
    household_members: 1,
    children_ages: [],
    current_pets: [],
    previous_pet_experience: "",
    vet_reference: { vet_name: "", vet_clinic: "", vet_phone: "" },
    personal_references: [],
    hours_alone: 0,
    exercise_plan: "",
    reason_for_adoption: "",
    experience_with_breed: "",
    prepared_for_costs: false,
    long_term_commitment: "",
    emergency_plan: "",
    additional_info: "",
    agree_to_home_visit: false,
    agree_to_follow_up: false
  });

  const submitApplicationMutation = useMutation({
    mutationFn: async (data) => {
      const application = await base44.entities.AdoptionApplication.create({
        listing_id: listingId,
        pet_name: listing.pet_name,
        applicant_email: user.email,
        ...data,
        application_status: 'pending'
      });

      // Update listing applications count
      await base44.entities.AdoptionListing.update(listingId, {
        applications_count: (listing.applications_count || 0) + 1
      });

      // Notify listing owner
      await base44.entities.Notification.create({
      recipient_email: listing.created_by,
      title: `New Adoption Application for ${listing.pet_name}`,
      message: `${data.applicant_name} has applied to adopt ${listing.pet_name}`,
      type: "system",
      related_id: application.id,
      priority: "high",
      action_url: `ManageAdoptionListings?tab=applications`
      });

      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoptionListings'] });
      toast.success("Application submitted successfully! 🎉");
      navigate(createPageUrl('MyAdoptionApplications'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    submitApplicationMutation.mutate(formData);
  };

  const addPet = () => {
    setFormData({
      ...formData,
      current_pets: [...formData.current_pets, { pet_type: "", breed: "", age: 0, spayed_neutered: false }]
    });
  };

  const removePet = (index) => {
    setFormData({
      ...formData,
      current_pets: formData.current_pets.filter((_, i) => i !== index)
    });
  };

  const updatePet = (index, field, value) => {
    const updated = [...formData.current_pets];
    updated[index][field] = value;
    setFormData({ ...formData, current_pets: updated });
  };

  const addReference = () => {
    setFormData({
      ...formData,
      personal_references: [...formData.personal_references, { name: "", relationship: "", phone: "", email: "" }]
    });
  };

  const removeReference = (index) => {
    setFormData({
      ...formData,
      personal_references: formData.personal_references.filter((_, i) => i !== index)
    });
  };

  const updateReference = (index, field, value) => {
    const updated = [...formData.personal_references];
    updated[index][field] = value;
    setFormData({ ...formData, personal_references: updated });
  };

  const progress = (currentStep / 3) * 100;

  const stepTitles = {
    1: { pt: "Passo 1: Sobre Você", en: "Step 1: About You", es: "Paso 1: Sobre Ti" },
    2: { pt: "Passo 2: Sua Casa", en: "Step 2: Your Home Environment", es: "Paso 2: Tu Hogar" },
    3: { pt: "Passo 3: Experiência & Compromisso", en: "Step 3: Experience & Commitment", es: "Paso 3: Experiencia y Compromiso" }
  };

  const progressLabels = {
    aboutYou: { pt: "Sobre Você", en: "About You", es: "Sobre Ti" },
    yourHome: { pt: "Sua Casa", en: "Your Home", es: "Tu Hogar" },
    experience: { pt: "Experiência", en: "Experience", es: "Experiencia" }
  };

  if (!listing) {
    return <div className="min-h-screen flex items-center justify-center">
      {language === 'pt' ? 'A carregar...' : language === 'es' ? 'Cargando...' : 'Loading...'}
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${listingId}`))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'pt' ? 'Voltar' : language === 'es' ? 'Volver' : 'Back'}
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {language === 'pt' ? `Candidatar-se para Adotar ${listing.pet_name}` :
             language === 'es' ? `Solicitar Adopción de ${listing.pet_name}` :
             `Apply to Adopt ${listing.pet_name}`}
          </h1>
          <p className="text-lg text-gray-600">
            {language === 'pt' ? 'Ajude-nos a encontrar o lar perfeito para este pet especial' :
             language === 'es' ? 'Ayúdanos a encontrar el hogar perfecto para esta mascota especial' :
             'Help us find the perfect home for this special pet'}
          </p>

          {/* Progress */}
          <div className="max-w-2xl mx-auto mt-6">
            <Progress value={progress} className="h-3 mb-3" />
            <div className="flex justify-between text-sm">
              <span className={`font-semibold ${currentStep >= 1 ? 'text-purple-600' : 'text-gray-400'}`}>
                {progressLabels.aboutYou[language]}
              </span>
              <span className={`font-semibold ${currentStep >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>
                {progressLabels.yourHome[language]}
              </span>
              <span className={`font-semibold ${currentStep >= 3 ? 'text-purple-600' : 'text-gray-400'}`}>
                {progressLabels.experience[language]}
              </span>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
            <CardTitle className="text-2xl">
              {stepTitles[currentStep][language]}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* STEP 1: ABOUT YOU */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Full Name *</Label>
                        <Input
                          required
                          value={formData.applicant_name}
                          onChange={(e) => setFormData({...formData, applicant_name: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Phone Number *</Label>
                        <Input
                          required
                          value={formData.applicant_phone}
                          onChange={(e) => setFormData({...formData, applicant_phone: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Age *</Label>
                        <Input
                          type="number"
                          required
                          value={formData.age}
                          onChange={(e) => setFormData({...formData, age: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Occupation *</Label>
                        <Input
                          required
                          value={formData.occupation}
                          onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Address *</Label>
                        <Input
                          required
                          value={formData.applicant_address}
                          onChange={(e) => setFormData({...formData, applicant_address: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>City *</Label>
                        <Input
                          required
                          value={formData.applicant_city}
                          onChange={(e) => setFormData({...formData, applicant_city: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Postal Code *</Label>
                        <Input
                          required
                          value={formData.applicant_postal_code}
                          onChange={(e) => setFormData({...formData, applicant_postal_code: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="bg-gradient-to-r from-pink-600 to-purple-600"
                      >
                        Next: Home Info →
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: HOME */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Home Type *</Label>
                        <Select value={formData.home_type} onValueChange={(v) => setFormData({...formData, home_type: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="house">House</SelectItem>
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                            <SelectItem value="farm">Farm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Do you own or rent? *</Label>
                        <Select value={formData.home_ownership} onValueChange={(v) => setFormData({...formData, home_ownership: v})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="own">Own</SelectItem>
                            <SelectItem value="rent">Rent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.home_ownership === "rent" && (
                        <div className="md:col-span-2 flex items-center space-x-2">
                          <Checkbox
                            id="landlord"
                            checked={formData.landlord_approval}
                            onCheckedChange={(v) => setFormData({...formData, landlord_approval: v})}
                          />
                          <label htmlFor="landlord" className="text-sm">
                            I have my landlord's approval to have pets
                          </label>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="yard"
                          checked={formData.has_yard}
                          onCheckedChange={(v) => setFormData({...formData, has_yard: v})}
                        />
                        <label htmlFor="yard" className="text-sm">
                          I have a yard
                        </label>
                      </div>

                      {formData.has_yard && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fenced"
                            checked={formData.yard_fenced}
                            onCheckedChange={(v) => setFormData({...formData, yard_fenced: v})}
                          />
                          <label htmlFor="fenced" className="text-sm">
                            Yard is fenced
                          </label>
                        </div>
                      )}

                      <div className="space-y-2 md:col-span-2">
                        <Label>Household Members *</Label>
                        <Input
                          type="number"
                          required
                          value={formData.household_members}
                          onChange={(e) => setFormData({...formData, household_members: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    {/* Current Pets */}
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-lg">Current Pets</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addPet}>
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Add Pet
                        </Button>
                      </div>

                      {formData.current_pets.map((pet, index) => (
                        <Card key={index} className="p-4 mb-4 bg-purple-50">
                          <div className="grid md:grid-cols-3 gap-4">
                            <Input
                              placeholder="Pet type"
                              value={pet.pet_type}
                              onChange={(e) => updatePet(index, 'pet_type', e.target.value)}
                            />
                            <Input
                              placeholder="Breed"
                              value={pet.breed}
                              onChange={(e) => updatePet(index, 'breed', e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Age"
                                value={pet.age}
                                onChange={(e) => updatePet(index, 'age', parseInt(e.target.value))}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePet(index)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1"
                      >
                        ← Previous
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600"
                      >
                        Next: Experience →
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: EXPERIENCE */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label>Why do you want to adopt {listing.pet_name}? *</Label>
                      <Textarea
                        required
                        value={formData.reason_for_adoption}
                        onChange={(e) => setFormData({...formData, reason_for_adoption: e.target.value})}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Previous Pet Experience *</Label>
                      <Textarea
                        required
                        value={formData.previous_pet_experience}
                        onChange={(e) => setFormData({...formData, previous_pet_experience: e.target.value})}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Exercise & Activity Plan *</Label>
                      <Textarea
                        required
                        value={formData.exercise_plan}
                        onChange={(e) => setFormData({...formData, exercise_plan: e.target.value})}
                        placeholder="How will you exercise and keep this pet active?"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Hours Pet Would Be Alone Daily *</Label>
                      <Input
                        type="number"
                        required
                        value={formData.hours_alone}
                        onChange={(e) => setFormData({...formData, hours_alone: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Long-Term Commitment Plan *</Label>
                      <Textarea
                        required
                        value={formData.long_term_commitment}
                        onChange={(e) => setFormData({...formData, long_term_commitment: e.target.value})}
                        placeholder="How will you care for this pet over its lifetime (10-15+ years)?"
                        rows={3}
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-4 border-t pt-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="costs"
                          checked={formData.prepared_for_costs}
                          onCheckedChange={(v) => setFormData({...formData, prepared_for_costs: v})}
                          required
                        />
                        <label htmlFor="costs" className="text-sm">
                          I understand and am prepared for the ongoing costs (food, vet, emergency care, etc.) *
                        </label>
                      </div>

                      {listing.requirements?.home_visit_required && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="home-visit"
                            checked={formData.agree_to_home_visit}
                            onCheckedChange={(v) => setFormData({...formData, agree_to_home_visit: v})}
                            required
                          />
                          <label htmlFor="home-visit" className="text-sm">
                            I agree to a home visit if required *
                          </label>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="follow-up"
                          checked={formData.agree_to_follow_up}
                          onCheckedChange={(v) => setFormData({...formData, agree_to_follow_up: v})}
                          required
                        />
                        <label htmlFor="follow-up" className="text-sm">
                          I agree to follow-up checks to ensure the pet's well-being *
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="flex-1"
                      >
                        ← Previous
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitApplicationMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white h-14 text-lg font-semibold"
                      >
                        {submitApplicationMutation.isPending ? (
                          "Submitting..."
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            Submit Application
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