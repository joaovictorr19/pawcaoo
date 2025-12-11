import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Upload, PlusCircle, Trash2, ArrowLeft, CheckCircle2, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/components/LanguageContext"; // Corrected import
import { t } from "@/components/translations";
import OptimizedImageUpload from "../components/adoption/OptimizedImageUpload";

export default function CreateAdoptionListing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [step, setStep] = useState(1); // Renamed currentStep to step
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    pet_name: "",
    pet_type: "dog",
    breed: "",
    mixed_breed: false,
    age_years: 0,
    age_months: 0,
    gender: "",
    size: "",
    weight_kg: 0,
    color: "",
    photos: [],
    video_url: "",
    description: "",
    temperament: {},
    good_with: {},
    special_needs: "",
    medical_history: "",
    medical_conditions: "",
    is_neutered: false,
    is_vaccinated: false,
    microchipped: false,
    microchip_number: "",
    rescue_story: "",
    location_city: user?.city || "",
    location_postal_code: user?.postal_code || "",
    shelter_name: "",
    shelter_type: "individual",
    contact_email: user?.email || "",
    contact_phone: user?.phone || "",
    contact_whatsapp: user?.phone || "", // Added WhatsApp field
    adoption_fee: 0,
    fee_includes: [],
    requirements: {},
    ideal_home: "",
    urgency_level: "normal",
    tags: []
  });

  const createListingMutation = useMutation({
    mutationFn: (data) => base44.entities.AdoptionListing.create({
      ...data,
      status: 'available',
      date_posted: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoptionListings'] });
      setShowSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl('AdoptionListings'));
      }, 2000);
    },
    onError: (error) => {
      toast.error("Failed to create listing: " + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevents default form submission if this was a form
    createListingMutation.mutate(formData);
  };

  const progress = (step / 3) * 100; // Updated currentStep to step

  const stepTitles = {
    1: { pt: "Passo 1: Informações Básicas", en: "Step 1: Basic Information", es: "Paso 1: Información Básica" },
    2: { pt: "Passo 2: Saúde & Personalidade", en: "Step 2: Health & Personality", es: "Paso 2: Salud y Personalidad" },
    3: { pt: "Passo 3: Detalhes da Adoção", en: "Step 3: Adoption Details", es: "Paso 3: Detalles de Adopción" }
  };

  const progressLabels = {
    basicInfo: { pt: "Info Básica", en: "Basic Info", es: "Info Básica" },
    health: { pt: "Saúde", en: "Health", es: "Salud" },
    adoption: { pt: "Adoção", en: "Adoption", es: "Adopción" }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate(createPageUrl('AdoptionListings'))}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'pt' ? 'Voltar' : language === 'es' ? 'Volver' : 'Back'}
        </Button>

        {/* Header */}
        <div className="text-center mb-6">
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Home className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 via-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            {t('createAdoptionListing', language)}
          </h1>
          <p className="text-lg text-gray-700 font-medium">
            {t('helpFindHome', language)}
          </p>

          <div className="max-w-2xl mx-auto mt-5">
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <Progress value={progress} className="h-3 mb-3 bg-gray-100" />
              <div className="flex justify-between text-sm">
                <span className={`font-bold transition-colors ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
                  {progressLabels.basicInfo[language]}
                </span>
                <span className={`font-bold transition-colors ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                  {progressLabels.health[language]}
                </span>
                <span className={`font-bold transition-colors ${step >= 3 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {progressLabels.adoption[language]}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 via-blue-600 to-emerald-600 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <CardTitle className="text-2xl font-bold relative z-10">
              {stepTitles[step][language]}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {/* STEP 1 */}
              {step === 1 && ( // Updated currentStep to step
                <motion.div
                  key="step1" // Added key
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} // Added exit animation
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      {t('basicInfo', language)}
                    </h3>
                  </div>

                  {/* Photos Upload - Using Optimized Component */}
                  <div>
                    <Label className="text-lg font-semibold mb-3 block flex items-center gap-2">
                      📸 Fotos do Pet *
                      <span className="text-sm font-normal text-gray-500">(mínimo 1, máximo 8)</span>
                    </Label>
                    <OptimizedImageUpload
                      onImagesChange={(urls) => setFormData({ ...formData, photos: urls })}
                      currentImages={formData.photos}
                      maxImages={8}
                      maxSizeKB={500}
                      showPreview={true}
                    />
                  </div>

                  {/* Video URL */}
                  <div className="space-y-2">
                    <Label>Video URL (Optional)</Label>
                    <Input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                      placeholder="Link to a YouTube or Vimeo video"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Pet Name *</Label>
                      <Input
                        required
                        value={formData.pet_name}
                        onChange={(e) => setFormData({...formData, pet_name: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Pet Type *</Label>
                      <Select value={formData.pet_type} onValueChange={(v) => setFormData({...formData, pet_type: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dog">🐕 Dog</SelectItem>
                          <SelectItem value="cat">🐱 Cat</SelectItem>
                          <SelectItem value="bird">🦜 Bird</SelectItem>
                          <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
                          <SelectItem value="other">🐾 Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Breed *</Label>
                      <Input
                        required
                        value={formData.breed}
                        onChange={(e) => setFormData({...formData, breed: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Age (Years)</Label>
                      <Input
                        type="number"
                        value={formData.age_years}
                        onChange={(e) => setFormData({...formData, age_years: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Age (Months)</Label>
                      <Input
                        type="number"
                        value={formData.age_months}
                        onChange={(e) => setFormData({...formData, age_months: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Select value={formData.size} onValueChange={(v) => setFormData({...formData, size: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="extra_large">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Weight (kg)</Label>
                      <Input
                        type="number"
                        value={formData.weight_kg}
                        onChange={(e) => setFormData({...formData, weight_kg: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={5}
                      placeholder="Tell us about this pet's personality, habits, likes/dislikes..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!formData.pet_name || !formData.description || formData.photos.length === 0}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      Next: Health & Personality →
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2 */}
              {step === 2 && ( // Updated currentStep to step
                <motion.div
                  key="step2" // Added key
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} // Added exit animation
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Good With</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="children"
                          checked={formData.good_with.children}
                          onCheckedChange={(v) => setFormData({...formData, good_with: {...formData.good_with, children: v}})}
                        />
                        <label htmlFor="children">Children</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="dogs"
                          checked={formData.good_with.dogs}
                          onCheckedChange={(v) => setFormData({...formData, good_with: {...formData.good_with, dogs: v}})}
                        />
                        <label htmlFor="dogs">Other Dogs</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cats"
                          checked={formData.good_with.cats}
                          onCheckedChange={(v) => setFormData({...formData, good_with: {...formData.good_with, cats: v}})}
                        />
                        <label htmlFor="cats">Cats</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="other-pets"
                          checked={formData.good_with.other_pets}
                          onCheckedChange={(v) => setFormData({...formData, good_with: {...formData.good_with, other_pets: v}})}
                        />
                        <label htmlFor="other-pets">Other Pets</label>
                      </div>
                    </div>
                  </div>

                  {/* Temperament Section - New */}
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Personalidade & Temperamento</Label>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Nível de Energia</Label>
                        <Select 
                          value={formData.temperament?.energy_level || "moderate"} 
                          onValueChange={(v) => setFormData({...formData, temperament: {...formData.temperament, energy_level: v}})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa (Sofá)</SelectItem>
                            <SelectItem value="moderate">Moderada (Passeios normais)</SelectItem>
                            <SelectItem value="high">Alta (Atleta)</SelectItem>
                            <SelectItem value="very_high">Muito Alta (Incansável)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Amabilidade com Estranhos</Label>
                        <Select 
                          value={formData.temperament?.friendliness_to_strangers || "moderate"} 
                          onValueChange={(v) => setFormData({...formData, temperament: {...formData.temperament, friendliness_to_strangers: v}})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Tímido/Reservado</SelectItem>
                            <SelectItem value="moderate">Amigável</SelectItem>
                            <SelectItem value="high">Ama todo mundo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Brincadeira</Label>
                        <Select 
                          value={formData.temperament?.playfulness || "moderate"} 
                          onValueChange={(v) => setFormData({...formData, temperament: {...formData.temperament, playfulness: v}})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Prefere dormir</SelectItem>
                            <SelectItem value="moderate">Gosta de brincar</SelectItem>
                            <SelectItem value="high">Brincalhão o dia todo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Facilidade de Treino</Label>
                        <Select 
                          value={formData.temperament?.trainability || "moderate"} 
                          onValueChange={(v) => setFormData({...formData, temperament: {...formData.temperament, trainability: v}})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Teimoso / Independente</SelectItem>
                            <SelectItem value="moderate">Aprende bem</SelectItem>
                            <SelectItem value="high">Muito inteligente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">Health Status</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="neutered"
                          checked={formData.is_neutered}
                          onCheckedChange={(v) => setFormData({...formData, is_neutered: v})}
                        />
                        <label htmlFor="neutered">Spayed/Neutered</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vaccinated"
                          checked={formData.is_vaccinated}
                          onCheckedChange={(v) => setFormData({...formData, is_vaccinated: v})}
                        />
                        <label htmlFor="vaccinated">Vaccinated</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="microchipped"
                          checked={formData.microchipped}
                          onCheckedChange={(v) => setFormData({...formData, microchipped: v})}
                        />
                        <label htmlFor="microchipped">Microchipped</label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Medical History (Vaccines, Surgeries, etc.)</Label>
                    <Textarea
                      value={formData.medical_history}
                      onChange={(e) => setFormData({...formData, medical_history: e.target.value})}
                      rows={3}
                      placeholder="Detailed medical history..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Medical Conditions (if any)</Label>
                    <Textarea
                      value={formData.medical_conditions}
                      onChange={(e) => setFormData({...formData, medical_conditions: e.target.value})}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Special Needs</Label>
                    <Textarea
                      value={formData.special_needs}
                      onChange={(e) => setFormData({...formData, special_needs: e.target.value})}
                      rows={2}
                      placeholder="Any special requirements..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rescue Story</Label>
                    <Textarea
                      value={formData.rescue_story}
                      onChange={(e) => setFormData({...formData, rescue_story: e.target.value})}
                      rows={4}
                      placeholder="Share this pet's story..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 border-2 border-green-200 hover:bg-green-50"
                    >
                      ← Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      Next: Adoption Details →
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3 */}
              {step === 3 && ( // Updated currentStep to step
                <motion.div
                  key="step3" // Added key
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }} // Added exit animation
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {language === 'pt' ? 'Detalhes de Contato' :
                       language === 'es' ? 'Detalles de Contacto' :
                       'Contact Details'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {language === 'pt' ? 'Forneça seus dados de contato para que os interessados possam entrar em contato.' :
                       language === 'es' ? 'Proporciona tus datos de contacto para que los interesados puedan comunicarse.' :
                       'Provide your contact details so interested adopters can reach you.'}
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Urgency Level</Label>
                      <Select value={formData.urgency_level} onValueChange={(v) => setFormData({...formData, urgency_level: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Organization Name (if applicable)</Label>
                      <Input
                        value={formData.shelter_name}
                        onChange={(e) => setFormData({...formData, shelter_name: e.target.value})}
                        placeholder="Shelter or rescue organization name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Contact Phone *</Label>
                      <Input
                        required
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                        placeholder="+351 ..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>WhatsApp Number</Label>
                      <Input
                        value={formData.contact_whatsapp}
                        onChange={(e) => setFormData({...formData, contact_whatsapp: e.target.value})}
                        placeholder="+351 ... (same as phone if applicable)"
                      />
                      <p className="text-xs text-gray-500">
                        {language === 'pt' ? 'Facilita o contacto direto com interessados' :
                         language === 'es' ? 'Facilita el contacto directo con interesados' :
                         'Makes it easier for interested people to contact you'}
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Contact Email *</Label>
                      <Input
                        required
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ideal Home Description</Label>
                    <Textarea
                      value={formData.ideal_home}
                      onChange={(e) => setFormData({...formData, ideal_home: e.target.value})}
                      rows={4}
                      placeholder="Describe the ideal home for this pet..."
                    />
                  </div>

                  {/* Info Box */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-900 mb-2">
                          {language === 'pt' ? 'Adoção Responsável' :
                           language === 'es' ? 'Adopción Responsable' :
                           'Responsible Adoption'}
                        </h4>
                        <p className="text-sm text-green-800">
                          {language === 'pt' ? 'Não cobramos taxa de adoção. O importante é encontrar o lar perfeito para cada pet. Os interessados devem contactá-lo diretamente para conhecer o pet e completar o processo de adoção.' :
                           language === 'es' ? 'No cobramos tarifa de adopción. Lo importante es encontrar el hogar perfecto para cada mascota. Los interesados deben contactarte directamente para conocer a la mascota y completar el proceso de adopción.' :
                           'We don\'t charge adoption fees. What matters is finding the perfect home for each pet. Interested people should contact you directly to meet the pet and complete the adoption process.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1 border-2 border-green-200 hover:bg-green-50"
                    >
                      ← Previous
                    </Button>
                    <Button
                      type="submit"
                      disabled={createListingMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-green-600 via-blue-600 to-emerald-600 hover:from-green-700 hover:via-blue-700 hover:to-emerald-700 text-white h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                      onClick={handleSubmit}
                    >
                      {createListingMutation.isPending ? "Publicando..." : "Publicar para Adoção"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="max-w-md"
              >
                <Card className="border-0 shadow-2xl">
                  <CardContent className="p-12 text-center">
                    <motion.div 
                      className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <CheckCircle2 className="w-12 h-12 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-blue-600 bg-clip-text text-transparent mb-4">
                    {language === 'pt' ? 'Listagem Publicada!' :
                     language === 'es' ? '¡Anuncio Publicado!' :
                     'Listing Posted!'}
                  </h2>
                  <p className="text-gray-600">
                    {language === 'pt' ? 'Sua listagem está agora ativa e visível para potenciais adotantes.' :
                     language === 'es' ? 'Tu anuncio ya está activo y visible para posibles adoptantes.' :
                     'Your listing is now live and visible to potential adopters.'}
                  </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}