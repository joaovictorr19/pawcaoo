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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import OptimizedImageUpload from "../adoption/OptimizedImageUpload";
import ImageCropModal from "../ui/ImageCropModal";
import CenteredAvatarUpload from "../ui/CenteredAvatarUpload";
import BreedSelector from "../professionals/BreedSelector";
import HotelPartnersStep from "./HotelPartnersStep";
import SaveConfirmation from "@/components/ui/SaveConfirmation";

const STEPS_DEFAULT = ["Perfil", "Serviços", "Preferências", "Documentos"];
const STEPS_HOTEL = ["Hotel", "Serviços", "Dog Walkers", "Documentos"];

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

// Shared input style
const inputCls = "w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400";
const sectionCls = "bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4";
const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5";

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
      instagram_url: existingProfile.instagram_url || "",
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
    instagram_url: "",
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
  const [showSaved, setShowSaved] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    setErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const errorCls = "border-red-400 focus:border-red-400 focus:ring-red-100";
  const FieldError = ({ field }) => errors[field] ? (
    <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> {errors[field]}
    </p>
  ) : null;

  const validateStep = (step) => {
    const errs = {};
    if (step === 0) {
      if (!professionalType) errs.professional_type = "Selecione o tipo de profissional";
      if (!formData.name.trim()) errs.name = "O nome profissional é obrigatório";
      if (!formData.location.trim()) errs.location = "A localização é obrigatória";
    }
    if (step === 1 && isHotelType && !((formData.hotel_details?.price_per_night || 0) > 0)) {
      errs.price_per_night = "Defina o preço por noite";
    }
    if (step === 1 && !isHotelType && !(parseFloat(formData.hourly_rate) > 0)) {
      errs.hourly_rate = "Defina um preço por hora válido";
    }
    if (step === 3 && !isEditing) {
      if (!formData.country_of_operation) {
        errs.country_of_operation = "Selecione o país de operação";
      } else {
        const rule = DOCUMENT_RULES[formData.country_of_operation];
        if (formData.country_of_operation === 'france') {
          if (!formData.france_professional_type) errs.france_professional_type = "Indique se é Profissional ou Particular";
          if (formData.france_professional_type === 'professional' && !formData.tax_id_france.trim()) errs.tax_id_france = "O Número Fiscal é obrigatório";
        } else if (rule && !formData[rule.taxField].trim()) {
          errs[rule.taxField] = `O ${rule.taxLabel} é obrigatório`;
        }
      }
    }
    return errs;
  };

  const tryProceed = (step, nextStep) => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Preencha os campos obrigatórios assinalados.");
      return;
    }
    setErrors({});
    setCurrentStep(nextStep);
  };
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

  const canProceed = () => {
    if (currentStep === 0) return formData.name.trim() && formData.location.trim() && professionalType;
    if (currentStep === 1 && isHotelType) return (formData.hotel_details?.price_per_night || 0) > 0;
    if (currentStep === 1 && !isHotelType) return parseFloat(formData.hourly_rate) > 0;
    // Step 3: só bloqueia em criação nova (não em edição)
    if (currentStep === 3 && !isEditing) {
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
      const impersonation = JSON.parse(localStorage.getItem('impersonation') || 'null');
      const updateMe = async (payload) => {
        if (impersonation?.targetUserId) {
          await base44.functions.invoke('updateUserAsAdmin', { targetUserId: impersonation.targetUserId, updateData: payload });
        } else {
          await base44.auth.updateMe(payload);
        }
      };
      const isHotel = professionalType === 'hotel';
      const isWalker = !isHotel && (professionalType === 'walker' || professionalType === 'both');
      const isTrainer = !isHotel && (professionalType === 'trainer' || professionalType === 'both');

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
        phone: data.phone, whatsapp_number: data.whatsapp_number?.replace(/\D/g, ''), instagram_url: data.instagram_url,
        dog_sizes: data.dog_sizes, accepted_animals: data.accepted_animals,
        availability: data.availability, portfolio: data.portfolio,
        id_document_url: data.id_document_url, proof_of_address_url: data.proof_of_address_url,
        country_of_operation: data.country_of_operation, tax_id_portugal: data.tax_id_portugal,
        tax_id_spain: data.tax_id_spain, tax_id_france: data.tax_id_france,
        france_professional_type: data.france_professional_type, mbway_number: data.mbway_number,
        latitude: lat, longitude: lng, service_areas: serviceAreas, user_id: user.id,
        verification_status: "pending", is_active: false,
      };

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
        await updateMe({ account_type: 'hotel', profile_photo_url: data.photo_url || user?.profile_photo_url, city: data.location, full_name: data.name });
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
        const existingTrainers = await base44.entities.TrainerProfile.filter({ user_id: user.id });
        if (existingTrainers.length > 0) {
          await base44.entities.TrainerProfile.update(existingTrainers[0].id, trainerData);
        } else {
          const res = await base44.entities.TrainerProfile.create(trainerData);
          if (!savedProfileId) savedProfileId = res.id;
        }
      }

      await updateMe({ account_type: professionalType, profile_photo_url: data.photo_url || user?.profile_photo_url, city: data.location, full_name: data.name });

      const userProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      const profileUpdate = { full_name: data.name, profile_photo_url: data.photo_url || user?.profile_photo_url, city: data.location, bio: data.bio };
      if (userProfiles.length > 0) await base44.entities.UserProfile.update(userProfiles[0].id, profileUpdate);

      await base44.entities.ProfileEditRequest.create({
        profile_id: savedProfileId,
        profile_type: professionalType,
        professional_name: data.name,
        professional_email: user.email,
        requested_changes: { name: data.name, location: data.location, hourly_rate: data.hourly_rate, bio: data.bio },
        original_data: professionalProfile || {},
        status: 'pending',
      });

      if (!isEditing) {
        try { await base44.functions.invoke('notifyAdminProfessional', { professional_name: data.name, professional_type: professionalType, professional_email: user.email }); } catch {}
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
      if (isEditing) {
        setShowSaved(true);
      } else {
        onDone();
      }
    },
    onError: (e) => toast.error("Erro: " + e.message),
    onSettled: () => setLoading(false),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateStep(currentStep);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Preencha os campos obrigatórios assinalados.");
      return;
    }
    setErrors({});
    setLoading(true);
    submitMutation.mutate(formData);
  };

  // Shared toggle button style
  const toggleBtn = (active, colorActive = "border-orange-400 bg-orange-50") =>
    `transition-all border-2 rounded-xl ${active ? colorActive + " shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`;

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-10 pt-6">
      <div className="w-full max-w-md mx-auto">
        {/* Back + title */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={onDone} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" /> Voltar ao Painel
          </button>
          <span className="text-slate-400 text-sm">{isEditing ? 'Editar Perfil' : 'Criar Perfil'}</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-1.5 mb-3">
            {STEPS.map((s, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-orange-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <p className="text-slate-400 text-xs font-medium">
            Passo {currentStep + 1} de {STEPS.length} — <span className="text-slate-700 font-semibold">{STEPS[currentStep]}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* STEP 0: Perfil */}
          {currentStep === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-24">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">O teu perfil público</h2>
                <p className="text-slate-500 text-sm mt-1">Como os donos de animais te vão conhecer.</p>
              </div>

              {/* Tipo de Profissional */}
              <div className={sectionCls}>
                <label className={labelCls}>Tipo de Profissional *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "walker", label: "Dog Walker", icon: <Dog className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" /> },
                    { value: "trainer", label: "Treinador", icon: <GraduationCap className="w-6 h-6 text-blue-500 mx-auto mb-1.5" /> },
                    { value: "both", label: "Ambos", icon: <div className="flex justify-center gap-1 mb-1.5"><Dog className="w-5 h-5 text-emerald-500" /><GraduationCap className="w-5 h-5 text-blue-500" /></div> },
                    { value: "hotel", label: "Hotel Canino", icon: <span className="text-2xl block mb-1.5 text-center">🏨</span> },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setProfessionalType(opt.value); setErrors(prev => { const n = { ...prev }; delete n.professional_type; return n; }); }}
                      className={`p-4 rounded-xl text-center transition-all ${
                        professionalType === opt.value
                          ? (opt.value === 'hotel' ? 'border-2 border-purple-400 bg-purple-50' : 'border-2 border-orange-400 bg-orange-50')
                          : 'border-2 border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {opt.icon}
                      <p className="text-xs font-semibold text-slate-700">{opt.label}</p>
                    </button>
                  ))}
                </div>
                <FieldError field="professional_type" />
              </div>

              {/* Foto */}
              <div className="flex flex-col items-center justify-center w-full">
                <CenteredAvatarUpload currentImageUrl={formData.photo_url} onImageChange={(url) => set("photo_url", url)} />
              </div>

              {/* Foto de capa */}
              <div className={sectionCls}>
                <label className={labelCls}>Foto de Capa (Opcional)</label>
                <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  {formData.cover_photo_url ? (
                    <img src={formData.cover_photo_url} className="w-full h-full object-cover" alt="capa" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Camera className="w-6 h-6 text-slate-300" /></div>
                  )}
                  <div className="absolute bottom-2 right-2">
                    <label>
                      <div className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-lg text-xs cursor-pointer shadow-sm font-medium">
                        <Upload className="inline w-3 h-3 mr-1" /> Alterar
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChangeForCrop(e, "cover")} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Nome, Localização, WhatsApp, Bio */}
              <div className={sectionCls}>
                <div>
                  <label className={labelCls}>Nome Profissional *</label>
                  <input value={formData.name} onChange={e => set("name", e.target.value)} placeholder="O teu nome" className={`${inputCls} ${errors.name ? errorCls : ''}`} />
                  <FieldError field="name" />
                </div>
                <div>
                  <label className={`${labelCls} flex items-center gap-1`}><MapPin className="w-3 h-3" /> Localização *</label>
                  <input value={formData.location} onChange={e => set("location", e.target.value)} placeholder="Lisboa, Porto..." className={`${inputCls} ${errors.location ? errorCls : ''}`} />
                  <FieldError field="location" />
                </div>
                <div>
                  <label className={`${labelCls} flex items-center gap-1`}><Phone className="w-3 h-3" /> WhatsApp</label>
                  <input value={formData.whatsapp_number} onChange={e => set("whatsapp_number", e.target.value)} placeholder="351912345678" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Instagram (opcional)</label>
                  <input value={formData.instagram_url} onChange={e => set("instagram_url", e.target.value)} placeholder="https://instagram.com/oseuperfil" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Bio</label>
                  <textarea value={formData.bio} onChange={e => set("bio", e.target.value)} placeholder="A tua experiência com animais..."
                    rows={3} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 resize-none" />
                </div>
              </div>

              <Button type="button" onClick={() => tryProceed(0, 1)}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold">
                Continuar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* STEP 1: Serviços Hotel */}
          {currentStep === 1 && isHotelType && (
            <motion.div key="s1h" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-24">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Serviços & Preços</h2>
                <p className="text-slate-500 text-sm mt-1">Define os serviços e preços do hotel.</p>
              </div>

              <div className={sectionCls}>
                <h3 className="text-sm font-semibold text-slate-700">Capacidade</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Capacidade Total", key: "capacity_total" },
                    { label: "Disponíveis Hoje", key: "capacity_available" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className={labelCls}>{f.label}</label>
                      <input type="number" min="1" value={formData.hotel_details?.[f.key] || ''} onChange={e => set('hotel_details', { ...formData.hotel_details, [f.key]: parseInt(e.target.value) })} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              <div className={sectionCls}>
                <h3 className="text-sm font-semibold text-slate-700">Preços</h3>
                {[
                  { label: "Alojamento (por noite/cão)", key: "price_per_night" },
                  { label: "Creche Diária (por dia/cão)", key: "price_daycare" },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600">{f.label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500 text-sm font-semibold">€</span>
                      <input type="number" min="0" step="1" value={formData.hotel_details?.[f.key] || ''}
                        onChange={e => set('hotel_details', { ...formData.hotel_details, [f.key]: parseFloat(e.target.value) })}
                        className="w-16 bg-transparent text-orange-500 font-bold text-lg text-right outline-none" />
                    </div>
                  </div>
                ))}
                <FieldError field="price_per_night" />
              </div>

              <div className={sectionCls}>
                <h3 className="text-sm font-semibold text-slate-700">Horários</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[{ label: "Check-in", key: "checkin_time" }, { label: "Check-out", key: "checkout_time" }].map(f => (
                    <div key={f.key}>
                      <label className={labelCls}>{f.label}</label>
                      <input type="time" value={formData.hotel_details?.[f.key] || ''} onChange={e => set('hotel_details', { ...formData.hotel_details, [f.key]: e.target.value })} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              <div className={sectionCls}>
                <h3 className="text-sm font-semibold text-slate-700">Comodidades</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Jardim', 'Piscina', 'Webcam ao vivo', 'Relatórios diários', 'Transporte', 'Veterinário parceiro', 'Passeios incluídos', 'Grooming disponível'].map(a => {
                    const active = (formData.hotel_details?.amenities || []).includes(a);
                    return (
                      <button key={a} type="button"
                        onClick={() => {
                          const curr = formData.hotel_details?.amenities || [];
                          set('hotel_details', { ...formData.hotel_details, amenities: curr.includes(a) ? curr.filter(x => x !== a) : [...curr, a] });
                        }}
                        className={`p-2.5 rounded-xl border-2 text-xs text-left font-medium transition-all ${active ? 'border-purple-400 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" onClick={() => setCurrentStep(0)} variant="outline" className="flex-1 h-12 border-slate-200 text-slate-600 rounded-2xl">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button type="button" onClick={() => tryProceed(1, 2)} className="flex-1 h-12 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-semibold">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Dog Walkers Parceiros (hotel) */}
          {currentStep === 2 && isHotelType && (
            <HotelPartnersStep formData={formData} set={set} onBack={() => setCurrentStep(1)} onNext={() => setCurrentStep(3)} />
          )}

          {/* STEP 1: Serviços (não-hotel) */}
          {currentStep === 1 && !isHotelType && (
            <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-24">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Serviços & Preços</h2>
                <p className="text-slate-500 text-sm mt-1">Define o que ofereces e quanto cobras.</p>
              </div>

              <div className={sectionCls}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Preço base por hora</p>
                    <p className="text-xs text-slate-400">Cães e Gatos</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Euro className="w-4 h-4 text-orange-500" />
                    <input type="number" min="0" step="0.5" value={formData.hourly_rate} onChange={e => set("hourly_rate", e.target.value)}
                      className="w-16 bg-transparent text-orange-500 font-bold text-xl text-right outline-none" />
                  </div>
                </div>
                <FieldError field="hourly_rate" />
              </div>

              <div className={sectionCls}>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Serviços Adicionais</h3>
                <div className="space-y-3">
                  {[
                    { key: "hasBoarding", priceKey: "boardingPrice", label: "Alojamento (Boarding)", desc: "Cuidado 24/7 na tua casa" },
                    { key: "hasHouseSitting", priceKey: "houseSittingPrice", label: "Casa-Sitting", desc: "Ficas na casa do cliente" },
                    { key: "hasDropIn", priceKey: "dropInPrice", label: "Visitas de Controlo", desc: "30-60 min, alimentação/medicação" },
                  ].map(svc => (
                    <div key={svc.key} className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${formData[svc.key] ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}>
                      <Checkbox checked={formData[svc.key]} onCheckedChange={c => set(svc.key, c)} className="mt-0.5" />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{svc.label}</p>
                          <p className="text-xs text-slate-400">{svc.desc}</p>
                        </div>
                        {formData[svc.key] && (
                          <input type="number" value={formData[svc.priceKey]} onChange={e => set(svc.priceKey, e.target.value)}
                            className="w-20 h-8 pl-3 text-sm bg-white text-slate-800 rounded-lg border border-slate-200 outline-none font-semibold" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={sectionCls}>
                <Label className="text-sm font-semibold text-slate-700">Portfólio (Opcional)</Label>
                <OptimizedImageUpload
                  onImagesChange={(urls) => set("portfolio", urls.map(url => ({ media_url: url, media_type: 'photo', title: 'Trabalho', category: 'walk', is_featured: false })))}
                  currentImages={formData.portfolio?.map(p => p.media_url) || []}
                  maxImages={12} maxSizeKB={500} showPreview={true}
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" onClick={() => setCurrentStep(0)} variant="outline" className="flex-1 h-12 border-slate-200 text-slate-600 rounded-2xl">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button type="button" onClick={() => tryProceed(1, 2)}
                  className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Preferências (não-hotel) */}
          {currentStep === 2 && !isHotelType && (
            <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-24">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Preferências</h2>
                <p className="text-slate-500 text-sm mt-1">Define quem podes ajudar e quando.</p>
              </div>

              <div className={sectionCls}>
                <label className={labelCls}>Animais que aceitas</label>
                <div className="grid grid-cols-3 gap-2">
                  {ANIMALS.map(a => (
                    <button key={a.value} type="button" onClick={() => toggleArr("accepted_animals", a.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${formData.accepted_animals.includes(a.value) ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <span className="text-xl">{a.icon}</span>
                      <span className="text-xs text-slate-700 font-medium">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={sectionCls}>
                <label className={labelCls}>Tamanhos de cão</label>
                <div className="grid grid-cols-2 gap-2">
                  {DOG_SIZES.map(s => (
                    <button key={s.value} type="button" onClick={() => toggleArr("dog_sizes", s.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${formData.dog_sizes.includes(s.value) ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <div><p className="text-sm font-semibold text-slate-700">{s.label}</p><p className="text-xs text-slate-400">{s.desc}</p></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={sectionCls}>
                <label className={`${labelCls} flex items-center gap-1`}><Clock className="w-3 h-3" /> Disponibilidade</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABILITY_SLOTS.map(sl => (
                    <button key={sl.value} type="button" onClick={() => toggleArr("availability", sl.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${formData.availability.includes(sl.value) ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <span className="text-xl">{sl.icon}</span>
                      <div><p className="text-sm font-semibold text-slate-700">{sl.label}</p><p className="text-xs text-slate-400">{sl.time}</p></div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={sectionCls}>
                <label className={`${labelCls} flex items-center gap-1`}><Zap className="w-3 h-3 text-orange-500" /> PawGo</label>
                <button type="button" onClick={() => set("instant_booking", !formData.instant_booking)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${formData.instant_booking ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white'}`}>
                  <div>
                    <p className="text-slate-800 font-semibold text-sm">Ativar PawGo</p>
                    <p className="text-slate-400 text-xs mt-0.5">Pedidos urgentes em tempo real</p>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-all ${formData.instant_booking ? 'bg-orange-500' : 'bg-slate-200'} flex items-center px-0.5`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${formData.instant_booking ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>

              <div className="flex gap-3">
                <Button type="button" onClick={() => setCurrentStep(1)} variant="outline" className="flex-1 h-12 border-slate-200 text-slate-600 rounded-2xl">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button type="button" onClick={() => setCurrentStep(3)} className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Documentos */}
          {currentStep === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-24">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Verificação & Pagamento</h2>
                <p className="text-slate-500 text-sm mt-1">Dados para verificação e recebimento.</p>
              </div>

              <div className={sectionCls}>
                <h3 className="text-sm font-semibold text-slate-700">País & Dados Fiscais</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'portugal', l: 'Portugal', flag: '🇵🇹' }, { v: 'spain', l: 'Espanha', flag: '🇪🇸' }, { v: 'france', l: 'França', flag: '🇫🇷' }].map(c => (
                    <button key={c.v} type="button" onClick={() => set('country_of_operation', c.v)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${formData.country_of_operation === c.v ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="text-2xl mb-1">{c.flag}</div>
                      <p className="text-xs font-semibold text-slate-700">{c.l}</p>
                    </button>
                  ))}
                </div>
                <FieldError field="country_of_operation" />
                {formData.country_of_operation && DOCUMENT_RULES[formData.country_of_operation] && (
                  <div>
                    <label className={labelCls}>{DOCUMENT_RULES[formData.country_of_operation].taxLabel} *</label>
                    <input value={formData[DOCUMENT_RULES[formData.country_of_operation].taxField]}
                      onChange={e => set(DOCUMENT_RULES[formData.country_of_operation].taxField, e.target.value)}
                      placeholder={`Inserir ${DOCUMENT_RULES[formData.country_of_operation].taxLabel}`}
                      className={`${inputCls} ${errors[DOCUMENT_RULES[formData.country_of_operation].taxField] ? errorCls : ''}`} />
                    <FieldError field={DOCUMENT_RULES[formData.country_of_operation].taxField} />
                  </div>
                )}
                {formData.country_of_operation === 'france' && (
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ v: 'professional', l: 'Profissional' }, { v: 'individual', l: 'Particular' }].map(opt => (
                        <button key={opt.v} type="button" onClick={() => set('france_professional_type', opt.v)}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${formData.france_professional_type === opt.v ? 'border-orange-400 bg-orange-50' : 'border-slate-200'}`}>
                          <p className="text-sm font-semibold text-slate-700">{opt.l}</p>
                        </button>
                      ))}
                    </div>
                    <FieldError field="france_professional_type" />
                  </div>
                )}
              </div>

              <div className={sectionCls}>
                <h3 className="text-sm font-semibold text-slate-700">Documentos de Verificação</h3>
                <Alert className="border-blue-200 bg-blue-50 text-blue-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">Opcional — pode enviar agora ou depois no painel.</AlertDescription>
                </Alert>
                {[
                  { label: "Documento de Identificação", field: "id_document_url", key: "id" },
                  { label: "Comprovativo de Morada", field: "proof_of_address_url", key: "address" },
                ].map(doc => (
                  <div key={doc.key}>
                    <label className={labelCls}>{doc.label} (Opcional)</label>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleDocUpload(e, doc.field, doc.key)} disabled={uploading[doc.key]} className="text-slate-500 text-sm" />
                    {formData[doc.field] && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" /> Carregado</p>
                    )}
                  </div>
                ))}
              </div>

              <div className={sectionCls}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-slate-700">Informação de Pagamento</h3>
                  <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                    <Shield className="w-3 h-3" /> Seguro
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "MBWay (recomendado)", field: "mbway_number", placeholder: "912345678" },
                    { label: "IBAN", field: "bank_account_number", placeholder: "PT50000201231234567890154" },
                    { label: "Nome do Titular", field: "bank_account_holder", placeholder: "João Silva" },
                  ].map(f => (
                    <div key={f.field}>
                      <label className={labelCls}>{f.label} (Opcional)</label>
                      <input value={formData[f.field] || ""} onChange={e => set(f.field, e.target.value)} placeholder={f.placeholder} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                ⚠️ O teu perfil ficará em análise. Serás notificado quando aprovado pela equipa PawCão.
              </div>

              <div className="flex gap-3">
                <Button type="button" onClick={() => setCurrentStep(2)} variant="outline" className="flex-1 h-12 border-slate-200 text-slate-600 rounded-2xl">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
                </Button>
                <Button type="submit" disabled={submitMutation.isPending || loading}
                  className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-semibold shadow-md">
                  {submitMutation.isPending ? "A guardar..." : isEditing ? "Guardar Alterações ✅" : "Criar Perfil 🚀"}
                </Button>
              </div>

              {showSaved && (
                <SaveConfirmation show={showSaved} message="Perfil guardado com sucesso! Aguardando aprovação. ✅" onDismiss={() => { setShowSaved(false); onDone(); }} duration={2500} />
              )}
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