import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Camera, MapPin, Euro, Dog, Clock, ChevronRight, ChevronLeft,
  CheckCircle, Upload, Phone, Zap, Video, AlertCircle, GraduationCap, Shield
} from "lucide-react";
import { RadioGroup } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import OptimizedImageUpload from "../adoption/OptimizedImageUpload";
import ImageCropModal from "../ui/ImageCropModal";
import CenteredAvatarUpload from "../ui/CenteredAvatarUpload";
import BreedSelector from "../professionals/BreedSelector";
import HotelPartnersStep from "./HotelPartnersStep";

const STEPS_DEFAULT = ["Perfil", "Serviços", "Preferências", "Documentos"];
const STEPS_HOTEL = ["Hotel", "Serviços", "Passeadores", "Documentos"];

const ANIMALS = [
  { value: "dogs", label: "Cães", icon: "🐕" },
  { value: "cats", label: "Gatos", icon: "🐈" },
  { value: "reptiles", label: "Répteis", icon: "🦎" },
  { value: "arachnids", label: "Aracnídeos", icon: "🕷️" },
  { value: "rodents", label: "Roedores", icon: "🐹" },
  { value: "birds", label: "Aves", icon: "🦜" },
];

const DOG_SIZES = [
  { value: "small", label: "Pequeno", desc: "até 10kg" },
  { value: "medium", label: "Médio", desc: "10-25kg" },
  { value: "large", label: "Grande", desc: "25-45kg" },
  { value: "extra_large", label: "XL", desc: "+45kg" },
];

const AVAILABILITY_SLOTS = [
  { value: "morning", label: "Manhã", time: "6h-12h", icon: "🌅" },
  { value: "afternoon", label: "Tarde", time: "12h-18h", icon: "☀️" },
  { value: "evening", label: "Noite", time: "18h-22h", icon: "🌙" },
  { value: "night", label: "Madrugada", time: "22h-6h", icon: "🌃" },
];

const DOCUMENT_RULES = {
  portugal: { taxLabel: "NIF", taxField: "tax_id_portugal" },
  spain: { taxLabel: "NIF / NIE / CIF", taxField: "tax_id_spain" },
  france: { taxLabel: "Número Fiscal", taxField: "tax_id_france" },
};

function buildInitialForm(user, existingProfile) {
  if (existingProfile) {
    return {
      name: existingProfile.walker_name || existingProfile.trainer_name || user?.full_name || "",
      hotel_details: existingProfile.hotel_details || { partner_walkers: [], amenities: [], accepted_dog_sizes: [], capacity_total: 10, price_per_night: 25, price_daycare: 15, checkin_time: "14:00", checkout_time: "12:00" },
      photo_url: existingProfile.photo_url || user?.profile_photo_url || "",
      cover_photo_url: existingProfile.cover_photo_url || "",
      video_intro_url: existingProfile.video_intro_url || "",
      bio: existingProfile.bio || "",
      location: existingProfile.location || "",
      service_areas: existingProfile.service_areas || [],
      hourly_rate: String(existingProfile.hourly_rate || "15"),
      exotic_rate: String(existingProfile.exotic_rate || ""),
      services_offered: existingProfile.services_offered || [],
      experience_years: String(existingProfile.experience_years || ""),
      phone: existingProfile.phone || "",
      whatsapp_number: existingProfile.whatsapp_number || "",
      dog_sizes: existingProfile.dog_sizes || [],
      dog_breeds_handled: existingProfile.dog_breeds_handled || [],
      breed_specialization: existingProfile.breed_specialization || [],
      accepted_animals: existingProfile.accepted_animals || ["dogs"],
      availability: existingProfile.availability || [],
      id_document_url: existingProfile.id_document_url || "",
      proof_of_address_url: existingProfile.proof_of_address_url || "",
      mbway_number: existingProfile.mbway_number || "",
      bank_account_holder: existingProfile.bank_account_holder || "",
      bank_account_number: existingProfile.bank_account_number || "",
      bank_routing_number: existingProfile.bank_routing_number || "",
      portfolio: existingProfile.portfolio || [],
      languages_spoken: existingProfile.languages_spoken || [],
      training_philosophy: existingProfile.training_philosophy || "",
      training_specializations: existingProfile.training_specializations || [],
      consultation_options: existingProfile.consultation_options || [],
      hasBoarding: existingProfile.services_offered?.some(s => s.service_name === 'Dog Boarding') || false,
      boardingPrice: existingProfile.services_offered?.find(s => s.service_name === 'Dog Boarding')?.price || 25,
      hasHouseSitting: existingProfile.services_offered?.some(s => s.service_name === 'House Sitting') || false,
      houseSittingPrice: existingProfile.services_offered?.find(s => s.service_name === 'House Sitting')?.price || 30,
      hasDropIn: existingProfile.services_offered?.some(s => s.service_name === 'Drop-in Visits') || false,
      dropInPrice: existingProfile.services_offered?.find(s => s.service_name === 'Drop-in Visits')?.price || 15,
      country_of_operation: existingProfile.country_of_operation || "portugal",
      tax_id_portugal: existingProfile.tax_id_portugal || "",
      tax_id_spain: existingProfile.tax_id_spain || "",
      tax_id_france: existingProfile.tax_id_france || "",
      france_professional_type: existingProfile.france_professional_type || "",
      instant_booking: existingProfile.instant_booking ?? true,
      work_radius_km: existingProfile.service_areas?.[0]?.radius_km || 5,
    };
  }
  return {
    name: user?.full_name || "",
    photo_url: user?.profile_photo_url || "",
    cover_photo_url: "",
    video_intro_url: "",
    bio: "",
    location: user?.city || "",
    service_areas: [],
    hourly_rate: "15",
    exotic_rate: "",
    services_offered: [],
    experience_years: "",
    phone: user?.phone || "",
    whatsapp_number: user?.phone || "",
    dog_sizes: ["small", "medium", "large"],
    dog_breeds_handled: [],
    breed_specialization: [],
    accepted_animals: ["dogs"],
    availability: ["morning", "afternoon"],
    id_document_url: "",
    proof_of_address_url: "",
    mbway_number: "",
    bank_account_holder: "",
    bank_account_number: "",
    bank_routing_number: "",
    portfolio: [],
    languages_spoken: [],
    training_philosophy: "",
    training_specializations: [],
    consultation_options: [],
    hasBoarding: false, boardingPrice: 25,
    hasHouseSitting: false, houseSittingPrice: 30,
    hasDropIn: false, dropInPrice: 15,
    country_of_operation: "portugal",
    tax_id_portugal: "", tax_id_spain: "", tax_id_france: "",
    france_professional_type: "",
    instant_booking: true,
    work_radius_km: 5,
    hotel_details: { partner_walkers: [], amenities: [], accepted_dog_sizes: [], capacity_total: 10, price_per_night: 25, price_daycare: 15, checkin_time: "14:00", checkout_time: "12:00" },
  };
}

export default function ProfessionalProfileForm({ user, professionalProfile, onDone }) {
  const queryClient = useQueryClient();
  const isEditing = !!professionalProfile;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({});
  const [professionalType, setProfessionalType] = useState(() => {
    if (!professionalProfile) return "";
    if (professionalProfile.professional_type === 'hotel') return "hotel";
    if (professionalProfile.is_verified_trainer) {
      return professionalProfile.walker_name ? "both" : "trainer";
    }
    return professionalProfile.walker_name ? "walker" : "";
  });

  const isHotelType = professionalType === 'hotel';
  const STEPS = isHotelType ? STEPS_HOTEL : STEPS_DEFAULT;

  const [formData, setFormData] = useState(() => buildInitialForm(user, professionalProfile));
  const [cropModal, setCropModal] = useState({ open: false, url: null, type: "photo" });

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const toggleArr = (key, val) => {
    const arr = formData[key] || [];
    set(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleFileChangeForCrop = (e, type) => {
    const file = e.target.files?.[0];
    if (file) setCropModal({ open: true, url: URL.createObjectURL(file), type });
  };

  const handleCroppedImage = async (croppedFile) => {
    const type = cropModal.type;
    setCropModal({ open: false, url: null, type: "photo" });
    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: croppedFile });
      set(type === "photo" ? "photo_url" : "cover_photo_url", file_url);
      toast.success("Imagem carregada!");
    } catch { toast.error("Erro no upload."); }
    setUploading(prev => ({ ...prev, [type]: false }));
  };

  const handleDocUpload = async (e, field, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(prev => ({ ...prev, [key]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set(field, file_url);
      toast.success("Documento carregado!");
    } catch { toast.error("Erro ao carregar documento."); }
    setUploading(prev => ({ ...prev, [key]: false }));
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(prev => ({ ...prev, video: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("video_intro_url", file_url);
      toast.success("Vídeo carregado!");
    } catch { toast.error("Erro ao carregar vídeo."); }
    setUploading(prev => ({ ...prev, video: false }));
  };

  const canProceed = () => {
    if (currentStep === 0) return formData.name.trim() && formData.location.trim() && professionalType;
    if (currentStep === 1 && isHotelType) return (formData.hotel_details?.price_per_night || 0) > 0;
    if (currentStep === 1 && !isHotelType) return parseFloat(formData.hourly_rate) > 0;
    if (currentStep === 3) {
      if (!formData.country_of_operation) return false;
      if (formData.country_of_operation === 'portugal' && !formData.tax_id_portugal) return false;
      if (formData.country_of_operation === 'spain' && !formData.tax_id_spain) return false;
      if (formData.country_of_operation === 'france') {
        if (!formData.france_professional_type) return false;
        if (formData.france_professional_type === 'professional' && !formData.tax_id_france) return false;
      }
    }
    return true;
  };

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const isHotel = professionalType === 'hotel';
      const isWalker = !isHotel && (professionalType === 'walker' || professionalType === 'both');
      const isTrainer = !isHotel && (professionalType === 'trainer' || professionalType === 'both');

      // Geocode
      let lat = 38.7223, lng = -9.1393;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.location)}`);
        const geo = await res.json();
        if (geo[0]) { lat = parseFloat(geo[0].lat); lng = parseFloat(geo[0].lon); }
      } catch {}

      const serviceAreas = data.service_areas?.length ? data.service_areas : [{ area_name: data.location, radius_km: data.work_radius_km || 5, latitude: lat, longitude: lng }];

      const commonData = {
        location: data.location, bio: data.bio, photo_url: data.photo_url,
        cover_photo_url: data.cover_photo_url, video_intro_url: data.video_intro_url,
        phone: data.phone, whatsapp_number: data.whatsapp_number?.replace(/\D/g, ''),
        dog_sizes: data.dog_sizes, accepted_animals: data.accepted_animals,
        availability: data.availability, portfolio: data.portfolio,
        id_document_url: data.id_document_url, proof_of_address_url: data.proof_of_address_url,
        country_of_operation: data.country_of_operation, tax_id_portugal: data.tax_id_portugal,
        tax_id_spain: data.tax_id_spain, tax_id_france: data.tax_id_france,
        france_professional_type: data.france_professional_type, mbway_number: data.mbway_number,
        latitude: lat, longitude: lng, service_areas: serviceAreas, user_id: user.id,
        // Always set to pending when submitting for admin review
        verification_status: "pending", is_active: false,
      };

      // Build services
      const services = [];
      services.push({ service_name: 'Dog Walking', description: 'Passeio regular.', price: parseFloat(data.hourly_rate), is_active: true });
      if (data.hasBoarding) services.push({ service_name: 'Dog Boarding', price: parseFloat(data.boardingPrice), is_active: true });
      if (data.hasHouseSitting) services.push({ service_name: 'House Sitting', price: parseFloat(data.houseSittingPrice), is_active: true });
      if (data.hasDropIn) services.push({ service_name: 'Drop-in Visits', price: parseFloat(data.dropInPrice), is_active: true });

      let savedProfileId = professionalProfile?.id;

      if (isHotel) {
        const hotelData = {
          ...commonData,
          walker_name: data.name,
          professional_type: 'hotel',
          hotel_details: data.hotel_details,
          hourly_rate: data.hotel_details?.price_per_night || 0,
          services_offered: [
            { service_name: 'Alojamento', service_type: 'boarding', price: data.hotel_details?.price_per_night || 0, is_active: true },
            { service_name: 'Creche Diária', service_type: 'daycare', price: data.hotel_details?.price_daycare || 0, is_active: true },
          ],
        };
        if (isEditing && professionalProfile?.id) {
          await base44.entities.WalkerProfile.update(professionalProfile.id, hotelData);
        } else {
          const res = await base44.entities.WalkerProfile.create(hotelData);
          savedProfileId = res.id;
        }
        await base44.auth.updateMe({ account_type: 'hotel', profile_photo_url: data.photo_url || user?.profile_photo_url, city: data.location, full_name: data.name });
        const userProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
        if (userProfiles.length > 0) await base44.entities.UserProfile.update(userProfiles[0].id, { full_name: data.name, profile_photo_url: data.photo_url, city: data.location });
        await base44.entities.ProfileEditRequest.create({ profile_id: savedProfileId, profile_type: 'hotel', professional_name: data.name, professional_email: user.email, requested_changes: { hotel_details: data.hotel_details }, original_data: professionalProfile || {}, status: 'pending' });
        if (!isEditing) { try { await base44.functions.invoke('notifyAdminProfessional', { professional_name: data.name, professional_type: 'hotel', professional_email: user.email }); } catch {} }
        return;
      }

      if (isWalker) {
        const walkerData = {
          ...commonData, walker_name: data.name,
          hourly_rate: parseFloat(data.hourly_rate), services_offered: services,
          experience_years: parseFloat(data.experience_years) || 0,
          dog_breeds_handled: data.dog_breeds_handled, breed_specialization: data.breed_specialization,
          instant_booking: data.instant_booking, is_verified_trainer: professionalType === 'both',
        };
        if (isEditing && professionalProfile?.walker_name) {
          await base44.entities.WalkerProfile.update(professionalProfile.id, walkerData);
        } else {
          const res = await base44.entities.WalkerProfile.create(walkerData);
          savedProfileId = res.id;
        }
      }

      if (isTrainer) {
        const trainerData = {
          ...commonData, trainer_name: data.name,
          hourly_rate: parseFloat(data.hourly_rate), services_offered: services,
          training_philosophy: data.training_philosophy,
          training_specializations: data.training_specializations,
          consultation_options: data.consultation_options,
        };
        const existingTrainers = await base44.entities.TrainerProfile.filter({ created_by: user.email });
        if (existingTrainers.length > 0) {
          await base44.entities.TrainerProfile.update(existingTrainers[0].id, trainerData);
        } else {
          const res = await base44.entities.TrainerProfile.create(trainerData);
          if (!savedProfileId) savedProfileId = res.id;
        }
      }

      // Update auth user
      await base44.auth.updateMe({
        account_type: professionalType,
        profile_photo_url: data.photo_url || user?.profile_photo_url,
        city: data.location,
        full_name: data.name,
      });

      // Sync UserProfile
      const userProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      const profileUpdate = { full_name: data.name, profile_photo_url: data.photo_url || user?.profile_photo_url, city: data.location, bio: data.bio };
      if (userProfiles.length > 0) {
        await base44.entities.UserProfile.update(userProfiles[0].id, profileUpdate);
      }

      // Create ProfileEditRequest for admin review
      await base44.entities.ProfileEditRequest.create({
        profile_id: savedProfileId,
        profile_type: professionalType,
        professional_name: data.name,
        professional_email: user.email,
        requested_changes: { name: data.name, location: data.location, hourly_rate: data.hourly_rate, bio: data.bio },
        original_data: professionalProfile || {},
        status: 'pending',
      });

      // Notify admin for new profiles
      if (!isEditing) {
        try {
          await base44.functions.invoke('notifyAdminProfessional', { professional_name: data.name, professional_type: professionalType, professional_email: user.email });
        } catch {}
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['myProfessionalProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allWalkers'] });
      queryClient.invalidateQueries({ queryKey: ['allTrainers'] });
      queryClient.invalidateQueries({ queryKey: ['featuredWalkers'] });
      queryClient.invalidateQueries({ queryKey: ['existingProfessionalProfile'] });
      queryClient.invalidateQueries({ queryKey: ['myWalkerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['myTrainerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profileEditRequests'] });
      toast.success(isEditing ? "Perfil atualizado! Aguardando aprovação. ✅" : "Perfil submetido para aprovação! 🎉");
      onDone();
    },
    onError: (e) => toast.error("Erro: " + e.message),
    onSettled: () => setLoading(false),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canProceed()) { toast.error("Preencha todos os campos obrigatórios."); return; }
    setLoading(true);
    submitMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-10 pt-6">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={onDone} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" /> Voltar ao Painel
          </button>
          <span className="text-slate-400 text-sm">{isEditing ? 'Editar Perfil' : 'Criar Perfil'}</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-1.5 mb-3">
            {STEPS.map((s, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-orange-500' : 'bg-slate-800'}`} />
            ))}
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Passo {currentStep + 1} de {STEPS.length} — <span className="text-white">{STEPS[currentStep]}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* STEP 0: Perfil */}
          {currentStep === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 pb-24">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">O teu perfil público</h2>
                <p className="text-slate-400 text-sm mt-1">Como os donos de animais te vão conhecer.</p>
              </div>

              {/* Type Selection */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Profissional *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "walker", label: "Passeador", icon: <Dog className="w-8 h-8 text-green-400 mx-auto mb-2" /> },
                    { value: "trainer", label: "Treinador", icon: <GraduationCap className="w-8 h-8 text-blue-400 mx-auto mb-2" /> },
                    { value: "both", label: "Ambos", icon: <div className="flex justify-center gap-1 mb-2"><Dog className="w-6 h-6 text-green-400" /><GraduationCap className="w-6 h-6 text-blue-400" /></div> },
                    { value: "hotel", label: "Hotel Canino", icon: <span className="text-3xl block mb-2 text-center">🏨</span> },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => setProfessionalType(opt.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${professionalType === opt.value ? (opt.value === 'hotel' ? 'border-purple-500 bg-purple-500/10' : 'border-orange-500 bg-orange-500/10') : 'border-slate-800 bg-slate-900 hover:border-slate-700'}`}>
                      {opt.icon}
                      <p className="text-xs font-bold text-white">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo */}
              <div className="flex flex-col items-center justify-center w-full my-2">
                <CenteredAvatarUpload currentImageUrl={formData.photo_url} onImageChange={(url) => set("photo_url", url)} />
              </div>

              {/* Cover */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Foto de Capa (Opcional)</Label>
                <div className="relative w-full h-28 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700">
                  {formData.cover_photo_url ? (
                    <img src={formData.cover_photo_url} className="w-full h-full object-cover" alt="capa" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Camera className="w-7 h-7 text-slate-600" /></div>
                  )}
                  <div className="absolute bottom-2 right-2">
                    <label>
                      <div className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-slate-200 rounded-lg text-xs cursor-pointer">
                        <Upload className="inline w-3 h-3 mr-1" /> Alterar capa
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChangeForCrop(e, "cover")} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nome Profissional *</Label>
                <input value={formData.name} onChange={e => set("name", e.target.value)} placeholder="O teu nome"
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><MapPin className="w-3 h-3" /> Localização *</Label>
                <input value={formData.location} onChange={e => set("location", e.target.value)} placeholder="Lisboa, Porto..."
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Phone className="w-3 h-3" /> WhatsApp</Label>
                <input value={formData.whatsapp_number} onChange={e => set("whatsapp_number", e.target.value)} placeholder="351912345678"
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bio</Label>
                <Textarea value={formData.bio} onChange={e => set("bio", e.target.value)} placeholder="A tua experiência com animais..."
                  rows={3} className="bg-slate-800 text-white border-slate-700 focus:border-orange-500 outline-none text-sm resize-none rounded-xl" />
              </div>

              <div className="flex gap-3 mt-8">
                <Button type="button" onClick={() => setCurrentStep(1)} disabled={!canProceed()}
                  className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold disabled:opacity-40">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Serviços Hotel */}
          {currentStep === 1 && isHotelType && (
            <motion.div key="s1h" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 pb-24">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Serviços & Preços</h2>
                <p className="text-slate-400 text-sm mt-1">Define os serviços e preços do hotel.</p>
              </div>
              <div className="p-4 bg-slate-800 rounded-2xl space-y-4">
                <h3 className="text-white font-bold text-sm">Capacidade</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400 uppercase tracking-widest">Capacidade Total</Label>
                    <input type="number" min="1" value={formData.hotel_details?.capacity_total || ''} onChange={e => set('hotel_details', { ...formData.hotel_details, capacity_total: parseInt(e.target.value) })}
                      className="w-full h-10 px-3 bg-slate-900 text-white rounded-xl border border-slate-700 outline-none text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400 uppercase tracking-widest">Disponíveis Hoje</Label>
                    <input type="number" min="0" value={formData.hotel_details?.capacity_available || ''} onChange={e => set('hotel_details', { ...formData.hotel_details, capacity_available: parseInt(e.target.value) })}
                      className="w-full h-10 px-3 bg-slate-900 text-white rounded-xl border border-slate-700 outline-none text-sm" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-800 rounded-2xl space-y-4">
                <h3 className="text-white font-bold text-sm">Preços</h3>
                {[
                  { label: "Alojamento (por noite/cão)", key: "price_per_night" },
                  { label: "Creche Diária (por dia/cão)", key: "price_daycare" },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{f.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-orange-400 text-sm">€</span>
                      <input type="number" min="0" step="1" value={formData.hotel_details?.[f.key] || ''}
                        onChange={e => set('hotel_details', { ...formData.hotel_details, [f.key]: parseFloat(e.target.value) })}
                        className="w-16 bg-transparent text-orange-400 font-black text-lg text-right outline-none" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-800 rounded-2xl space-y-3">
                <h3 className="text-white font-bold text-sm">Horários Check-in / Check-out</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: "Check-in", key: "checkin_time" }, { label: "Check-out", key: "checkout_time" }].map(f => (
                    <div key={f.key} className="space-y-1">
                      <Label className="text-xs text-slate-400 uppercase tracking-widest">{f.label}</Label>
                      <input type="time" value={formData.hotel_details?.[f.key] || ''} onChange={e => set('hotel_details', { ...formData.hotel_details, [f.key]: e.target.value })}
                        className="w-full h-10 px-3 bg-slate-900 text-white rounded-xl border border-slate-700 outline-none text-sm" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-slate-800 rounded-2xl space-y-3">
                <h3 className="text-white font-bold text-sm">Comodidades</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Jardim', 'Piscina', 'Webcam ao vivo', 'Relatórios diários', 'Transporte', 'Veterinário parceiro', 'Passeios incluídos', 'Grooming disponível'].map(a => (
                    <button key={a} type="button" onClick={() => {
                      const curr = formData.hotel_details?.amenities || [];
                      set('hotel_details', { ...formData.hotel_details, amenities: curr.includes(a) ? curr.filter(x => x !== a) : [...curr, a] });
                    }} className={`p-2 rounded-xl border-2 text-xs text-left transition-all ${(formData.hotel_details?.amenities || []).includes(a) ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-slate-700 text-slate-400'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <Button type="button" onClick={() => setCurrentStep(0)} variant="outline" className="flex-1 h-12 border-slate-700 text-slate-400 hover:text-white bg-transparent rounded-2xl">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button type="button" onClick={() => setCurrentStep(2)} className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Passeadores Parceiros (apenas hotel) */}
          {currentStep === 2 && isHotelType && (
            <HotelPartnersStep formData={formData} set={set} onBack={() => setCurrentStep(1)} onNext={() => setCurrentStep(3)} />
          )}

          {/* STEP 1: Serviços */}
          {currentStep === 1 && !isHotelType && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 pb-24">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Serviços & Preços</h2>
                <p className="text-slate-400 text-sm mt-1">Define o que ofereces e quanto cobras.</p>
              </div>

              <div className="p-4 bg-slate-800 rounded-2xl flex items-center justify-between">
                <div><p className="text-white font-bold text-sm">Preço base por hora</p><p className="text-slate-400 text-xs">Cães e Gatos</p></div>
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-orange-400" />
                  <input type="number" min="0" step="0.5" value={formData.hourly_rate} onChange={e => set("hourly_rate", e.target.value)}
                    className="w-16 bg-transparent text-orange-400 font-black text-xl text-right outline-none" />
                </div>
              </div>

              {/* Serviços adicionais */}
              <div className="space-y-3">
                {[
                  { key: "hasBoarding", priceKey: "boardingPrice", label: "Alojamento (Boarding)", desc: "Cuidado 24/7 na tua casa", defaultPrice: 25 },
                  { key: "hasHouseSitting", priceKey: "houseSittingPrice", label: "Casa-Sitting", desc: "Ficas na casa do cliente", defaultPrice: 30 },
                  { key: "hasDropIn", priceKey: "dropInPrice", label: "Visitas de Controlo", desc: "30-60 min, alimentação/medicação", defaultPrice: 15 },
                ].map(svc => (
                  <div key={svc.key} className="flex items-start gap-4 p-3 bg-slate-800 rounded-xl border border-slate-700">
                    <Checkbox checked={formData[svc.key]} onCheckedChange={c => set(svc.key, c)} className="mt-1" />
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white text-sm">{svc.label}</p>
                        <p className="text-xs text-slate-400">{svc.desc}</p>
                      </div>
                      {formData[svc.key] && (
                        <input type="number" value={formData[svc.priceKey]} onChange={e => set(svc.priceKey, e.target.value)}
                          className="w-20 h-8 pl-4 text-sm bg-slate-900 text-white rounded-lg border border-slate-600 outline-none" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Portfolio */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <Label className="block text-sm font-semibold text-white">Portfólio (Opcional)</Label>
                <OptimizedImageUpload
                  onImagesChange={(urls) => set("portfolio", urls.map(url => ({ media_url: url, media_type: 'photo', title: 'Trabalho', category: 'walk', is_featured: false })))}
                  currentImages={formData.portfolio?.map(p => p.media_url) || []}
                  maxImages={12} maxSizeKB={500} showPreview={true}
                />
              </div>

              <div className="flex gap-3 mt-8">
                <Button type="button" onClick={() => setCurrentStep(0)} variant="outline" className="flex-1 h-12 border-slate-700 text-slate-400 hover:text-white bg-transparent rounded-2xl">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button type="button" onClick={() => setCurrentStep(2)} disabled={!canProceed()}
                  className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold disabled:opacity-40">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Preferências (não-hotel) */}
          {currentStep === 2 && !isHotelType && (
            <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 pb-24">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Preferências</h2>
                <p className="text-slate-400 text-sm mt-1">Define quem podes ajudar e quando.</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Animais que aceitas</p>
                <div className="grid grid-cols-3 gap-2">
                  {ANIMALS.map(a => (
                    <button key={a.value} type="button" onClick={() => toggleArr("accepted_animals", a.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${formData.accepted_animals.includes(a.value) ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-900'}`}>
                      <span className="text-2xl">{a.icon}</span>
                      <span className="text-xs text-white font-medium">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tamanhos de cão</p>
                <div className="grid grid-cols-2 gap-2">
                  {DOG_SIZES.map(s => (
                    <button key={s.value} type="button" onClick={() => toggleArr("dog_sizes", s.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${formData.dog_sizes.includes(s.value) ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-900'}`}>
                      <div className="text-left"><p className="text-sm font-bold text-white">{s.label}</p><p className="text-xs text-slate-400">{s.desc}</p></div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Clock className="w-3 h-3" /> Disponibilidade</p>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABILITY_SLOTS.map(sl => (
                    <button key={sl.value} type="button" onClick={() => toggleArr("availability", sl.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${formData.availability.includes(sl.value) ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-900'}`}>
                      <span className="text-xl">{sl.icon}</span>
                      <div className="text-left"><p className="text-sm font-bold text-white">{sl.label}</p><p className="text-xs text-slate-400">{sl.time}</p></div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><Zap className="w-3 h-3 text-orange-400" /> PawGo</p>
                <button type="button" onClick={() => set("instant_booking", !formData.instant_booking)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${formData.instant_booking ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-900'}`}>
                  <div><p className="text-white font-bold text-sm">Ativar PawGo</p><p className="text-slate-400 text-xs mt-0.5">Pedidos urgentes em tempo real</p></div>
                  <div className={`w-12 h-6 rounded-full transition-all ${formData.instant_booking ? 'bg-orange-500' : 'bg-slate-700'} flex items-center px-1`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.instant_booking ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>

              <div className="flex gap-3 mt-8">
                <Button type="button" onClick={() => setCurrentStep(1)} variant="outline" className="flex-1 h-12 border-slate-700 text-slate-400 hover:text-white bg-transparent rounded-2xl">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button type="button" onClick={() => setCurrentStep(3)}
                  className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Documentos */}
          {currentStep === 3 && (isHotelType || !isHotelType) && (
            <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 pb-24">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Verificação & Pagamento</h2>
                <p className="text-slate-400 text-sm mt-1">Dados necessários para verificação e recebimento.</p>
              </div>

              {/* País */}
              <div className="space-y-4 bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                <h3 className="font-bold text-white">País & Dados Fiscais</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[{ v: 'portugal', l: 'Portugal', flag: '🇵🇹' }, { v: 'spain', l: 'Espanha', flag: '🇪🇸' }, { v: 'france', l: 'França', flag: '🇫🇷' }].map(c => (
                    <button key={c.v} type="button" onClick={() => set('country_of_operation', c.v)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${formData.country_of_operation === c.v ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700'}`}>
                      <div className="text-2xl mb-1">{c.flag}</div>
                      <p className="text-xs font-bold text-white">{c.l}</p>
                    </button>
                  ))}
                </div>
                {formData.country_of_operation && DOCUMENT_RULES[formData.country_of_operation] && (
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{DOCUMENT_RULES[formData.country_of_operation].taxLabel} *</Label>
                    <input value={formData[DOCUMENT_RULES[formData.country_of_operation].taxField]}
                      onChange={e => set(DOCUMENT_RULES[formData.country_of_operation].taxField, e.target.value)}
                      placeholder={`Inserir ${DOCUMENT_RULES[formData.country_of_operation].taxLabel}`}
                      className="w-full h-12 px-4 bg-slate-900 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
                  </div>
                )}
                {formData.country_of_operation === 'france' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[{ v: 'professional', l: 'Profissional' }, { v: 'individual', l: 'Particular' }].map(opt => (
                      <button key={opt.v} type="button" onClick={() => set('france_professional_type', opt.v)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${formData.france_professional_type === opt.v ? 'border-orange-500 bg-orange-500/10' : 'border-slate-700'}`}>
                        <p className="text-sm font-bold text-white">{opt.l}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Documentos */}
              <div className="space-y-4 bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                <h3 className="font-bold text-white">Documentos de Verificação</h3>
                <Alert className="border-blue-500/30 bg-blue-500/10 text-blue-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Opcional: pode enviar agora ou depois no painel.</AlertDescription>
                </Alert>
                {[
                  { label: "Documento de Identificação", field: "id_document_url", key: "id" },
                  { label: "Comprovativo de Morada", field: "proof_of_address_url", key: "address" },
                ].map(doc => (
                  <div key={doc.key} className="space-y-1">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{doc.label} (Opcional)</Label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleDocUpload(e, doc.field, doc.key)} disabled={uploading[doc.key]} className="text-slate-400 text-sm" />
                    {formData[doc.field] && <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Carregado</p>}
                  </div>
                ))}
              </div>

              {/* Pagamento */}
              <div className="space-y-4 bg-slate-800 border border-slate-700 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Informação de Pagamento</h3>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" /> Seguro</span>
                </div>
                {[
                  { label: "MBWay (recomendado)", field: "mbway_number", placeholder: "912345678" },
                  { label: "IBAN", field: "bank_account_number", placeholder: "PT50000201231234567890154" },
                  { label: "Nome do Titular", field: "bank_account_holder", placeholder: "João Silva" },
                ].map(f => (
                  <div key={f.field} className="space-y-1">
                    <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{f.label} (Opcional)</Label>
                    <input value={formData[f.field] || ""} onChange={e => set(f.field, e.target.value)} placeholder={f.placeholder}
                      className="w-full h-11 px-4 bg-slate-900 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/50 border border-orange-500/20 rounded-xl p-3 text-xs text-slate-400">
                ⚠️ O teu perfil ficará em análise. Serás notificado quando aprovado pela equipa PawCão.
              </div>

              <div className="flex gap-3 mt-8">
                <Button type="button" onClick={() => setCurrentStep(2)} variant="outline" className="flex-1 h-12 border-slate-700 text-slate-400 hover:text-white bg-transparent rounded-2xl">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button type="submit" disabled={submitMutation.isPending || loading}
                  className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-lg">
                  {submitMutation.isPending ? "A guardar..." : isEditing ? "Guardar Alterações ✅" : "Criar Perfil 🚀"}
                </Button>
              </div>
            </motion.div>
          )}
        </form>

        <ImageCropModal
          isOpen={cropModal.open}
          onClose={() => setCropModal({ open: false, url: null, type: "photo" })}
          imageUrl={cropModal.url}
          onSave={handleCroppedImage}
          aspectRatio={cropModal.type === "cover" ? 3 : 1}
          circularCrop={cropModal.type === "photo"}
        />
      </div>
    </div>
  );
}