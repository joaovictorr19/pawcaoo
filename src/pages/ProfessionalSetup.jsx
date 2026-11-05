import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, MapPin, Euro, Dog, Clock, ChevronRight, ChevronLeft, CheckCircle, Upload, Phone, Zap, Globe } from "lucide-react";
import { submitProfessionalProfile, LANGUAGES } from "@/lib/professionalOnboarding";

const STEPS = ["Perfil", "Tipo", "Serviços", "Preferências", "Conclusão"];

const ANIMALS = [
  { value: "dogs", label: "Cães", icon: "🐕" },
  { value: "cats", label: "Gatos", icon: "🐈" },
  { value: "reptiles", label: "Répteis", icon: "🦎" },
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

const SERVICE_PRESETS = [
  { key: "walk_30", service_name: "Passeio 30 min", description: "Passeio individual rápido", defaultPrice: 10, service_type: "standard", is_active: true },
  { key: "walk_60", service_name: "Passeio 1h", description: "Passeio individual de 1 hora", defaultPrice: 15, service_type: "standard", is_active: true },
  { key: "group_walk", service_name: "Passeio em Grupo", description: "Passeio social com vários cães", defaultPrice: 12, service_type: "group_walk", is_active: true },
  { key: "home_visit", service_name: "Visita ao domicílio", description: "Visita para alimentação e companhia", defaultPrice: 14, service_type: "standard", is_active: true },
  { key: "training_session", service_name: "Sessão de treino", description: "Sessão individual de treino", defaultPrice: 25, service_type: "standard", is_active: true },
];

const DOCUMENT_RULES = {
  portugal: {
    taxLabel: "NIF",
    taxField: "tax_id_portugal",
    extraLabel: null,
    extraField: null,
  },
  spain: {
    taxLabel: "NIF / NIE / CIF",
    taxField: "tax_id_spain",
    extraLabel: null,
    extraField: null,
  },
  france: {
    taxLabel: "Número Fiscal",
    taxField: "tax_id_france",
    extraLabel: "Tipo de prestador",
    extraField: "france_professional_type",
  },
};

export default function ProfessionalSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem('professional_setup_form');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Erro ao restaurar form', e);
    }
    return {
    walker_name: "",
    location: "",
    latitude: null,
    longitude: null,
    bio: "",
    photo_url: "",
    cover_photo_url: "",
    whatsapp_number: "",
    professional_type: "walker",
    hourly_rate: "15",
    services_offered: SERVICE_PRESETS.map(service => ({ ...service, price: service.defaultPrice })),
    accepted_animals: ["dogs"],
    dog_sizes: ["small", "medium", "large"],
    availability: ["morning", "afternoon"],
    instant_booking: true,
    work_radius_km: 5,
    portfolio: [],
    id_document_url: "",
    proof_of_address_url: "",
    country_of_operation: "portugal",
    tax_id_portugal: "",
    tax_id_spain: "",
    tax_id_france: "",
    france_professional_type: "professional",
    // Hotel specific
    hotel_name: "",
    hotel_description: "",
    hotel_full_address: "",
    hotel_price_per_night: "30",
    hotel_price_daycare: "15",
    hotel_checkin_time: "09:00",
    hotel_checkout_time: "18:00",
    hotel_capacity_total: "5",
    hotel_amenities: [],
    hotel_accepted_sizes: ["small", "medium", "large"],
    experience_years: "",
    languages_spoken: ["Português"],
    };
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Pré-preencher form com dados existentes
  const { data: existingProfile } = useQuery({
    queryKey: ['existingProfessionalProfile', user?.email],
    queryFn: async () => {
      if (!user?.id) return null;
      const profiles = await base44.entities.WalkerProfile.filter({ user_id: user.id });
      return profiles[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 0,
  });

  useEffect(() => {
    if (formInitialized) return;
    if (!user) return;
    // existingProfile may be null (no profile) or an object
    if (existingProfile === undefined) return; // still loading

    setFormInitialized(true);
    setIsLoadingData(false);
    if (existingProfile) {
      const presetServices = SERVICE_PRESETS.map((preset) => {
        const existingService = existingProfile.services_offered?.find(
          (service) => service.key === preset.key || service.service_name === preset.service_name
        );
        return existingService
          ? { ...preset, ...existingService, price: existingService.price ?? preset.defaultPrice, is_active: existingService.is_active ?? true }
          : { ...preset, price: preset.defaultPrice, is_active: true };
      });

      setForm(prev => ({
        ...prev,
        walker_name: existingProfile.walker_name || user.full_name || "",
        location: existingProfile.location || "",
        latitude: existingProfile.latitude || null,
        longitude: existingProfile.longitude || null,
        bio: existingProfile.bio || "",
        photo_url: existingProfile.photo_url || "",
        cover_photo_url: existingProfile.cover_photo_url || "",
        whatsapp_number: existingProfile.whatsapp_number || "",
        hourly_rate: String(existingProfile.hourly_rate || "15"),
        services_offered: presetServices,
        accepted_animals: existingProfile.accepted_animals?.length ? existingProfile.accepted_animals : prev.accepted_animals,
        dog_sizes: existingProfile.dog_sizes?.length ? existingProfile.dog_sizes : prev.dog_sizes,
        availability: existingProfile.availability?.length ? existingProfile.availability : prev.availability,
        instant_booking: existingProfile.instant_booking ?? true,
        work_radius_km: existingProfile.service_areas?.[0]?.radius_km || 5,
        portfolio: existingProfile.portfolio?.length ? existingProfile.portfolio : prev.portfolio,
        id_document_url: existingProfile.id_document_url || "",
        proof_of_address_url: existingProfile.proof_of_address_url || "",
        professional_type: existingProfile.is_verified_trainer ? 'both' : 'walker',
        country_of_operation: existingProfile.country_of_operation || "portugal",
        tax_id_portugal: existingProfile.tax_id_portugal || "",
        tax_id_spain: existingProfile.tax_id_spain || "",
        tax_id_france: existingProfile.tax_id_france || "",
        france_professional_type: existingProfile.france_professional_type || "professional",
        experience_years: existingProfile.experience_years != null ? String(existingProfile.experience_years) : "",
        languages_spoken: existingProfile.languages_spoken?.length ? existingProfile.languages_spoken : prev.languages_spoken,
      }));
    } else if (user.full_name) {
      setForm(prev => ({ ...prev, walker_name: user.full_name }));
    }
  }, [existingProfile, user, formInitialized]);

  const set = (key, val) => {
    setForm(prev => {
      const updated = { ...prev, [key]: val };
      try {
        sessionStorage.setItem('professional_setup_form', JSON.stringify(updated));
      } catch (e) { /* intentionally ignored */ }
      return updated;
    });
  };

  const toggleArr = (key, val) => {
    const arr = form[key] || [];
    set(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("photo_url", file_url);
      toast.success("Foto carregada!");
    } catch {
      toast.error("Erro no upload.");
    }
    setUploading(false);
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("cover_photo_url", file_url);
      toast.success("Capa atualizada!");
    } catch {
      toast.error("Erro ao enviar a capa.");
    }
    setUploading(false);
  };

  const handlePortfolioUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files.slice(0, Math.max(0, 6 - (form.portfolio?.length || 0)))) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({
          media_url: file_url,
          media_type: 'photo',
          title: 'Portfólio',
          category: 'walk',
          is_featured: false,
        });
      }
      set("portfolio", [...(form.portfolio || []), ...uploaded].slice(0, 6));
      toast.success("Portfólio atualizado!");
    } catch {
      toast.error("Erro ao carregar portfólio.");
    }
    setUploading(false);
  };

  const handleOptionalDocumentUpload = async (e, field, successMessage) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set(field, file_url);
      toast.success(successMessage);
    } catch {
      toast.error("Erro ao carregar documento.");
    }
    setUploading(false);
  };

  const isEditing = formInitialized;

  const canProceed = () => {
    if (step === 0) return form.walker_name.trim() && form.location.trim() && String(form.experience_years).trim() !== "" && (form.languages_spoken || []).length > 0;
    if (step === 2) {
      if (form.professional_type === 'hotel') return form.hotel_name.trim().length > 0;
      return parseFloat(form.hourly_rate) > 0;
    }
    return true;
  };

  const handleFinish = async () => {
   if (!user) return;
   const requiredName = form.professional_type === "hotel"
     ? String(form.hotel_name || "").trim()
     : String(form.walker_name || "").trim();
   if (!requiredName) {
     toast.error(form.professional_type === "hotel" ? "Indica o nome do hotel." : "Indica o teu nome profissional no primeiro passo do formulário.");
     setStep(0);
     return;
   }
   if (String(form.experience_years).trim() === "" || (form.languages_spoken || []).length === 0) {
     toast.error("Indica os teus anos de experiência e pelo menos um idioma no primeiro passo.");
     setStep(0);
     return;
   }
   setLoading(true);
   try {
     const formForSubmit = {
       ...form,
       // Map hotel price fields to the shared function's expected names
       hotel_price_per_night: form.hotel_price_per_night,
       hotel_price_daycare: form.hotel_price_daycare,
     };
     const profile = await submitProfessionalProfile(user, formForSubmit, isEditing, queryClient, navigate);
     if (isEditing) {
       toast.success("Alterações guardadas! ✅");
     } else {
       toast.success("Perfil submetido para aprovação! Aguarda verificação da equipa PawCão. 🎉");
     }
     navigate(createPageUrl("ProfessionalHubV2"), { replace: true });
   } catch (e) {
     console.error(e);
     toast.error("Erro ao guardar perfil: " + e.message);
   } finally {
     setLoading(false);
   }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-sm font-medium">A carregar perfil...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-10 pt-6">
      <div className="w-full max-w-2xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </motion.button>

        {/* Progress */}
        <motion.div className="mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="flex gap-2 mb-4">
            {STEPS.map((s, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
              Passo {step + 1} de {STEPS.length}
            </p>
            <p className="text-white font-bold text-lg">{STEPS[step]}</p>
          </div>
        </motion.div>

        {/* STEP 0 - Perfil */}
         {step === 0 && (
           <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
               <div>
                 <h2 className="text-3xl md:text-4xl font-bold text-white">O teu perfil público</h2>
                 <p className="text-slate-400 text-base mt-2 font-light">Como os donos de animais te vão conhecer.</p>
               </div>

              {/* Foto */}
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex-shrink-0">
                  {form.photo_url ? (
                    <img src={form.photo_url} className="w-full h-full object-cover" alt="foto" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                </div>
                <label className="flex-1">
                  <div className={`w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium cursor-pointer text-center transition-all ${uploading ? 'opacity-50' : ''}`}>
                    <Upload className="inline w-4 h-4 mr-2" />
                    {uploading ? "A carregar..." : "Adicionar Foto"}
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                </label>
              </div>

              {/* Capa */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Foto de capa</label>
                <div className="relative w-full h-28 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700">
                  {form.cover_photo_url ? (
                    <img src={form.cover_photo_url} className="w-full h-full object-cover" alt="capa" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-7 h-7 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2">
                    <label>
                      <div className={`px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-slate-200 rounded-lg text-xs font-medium cursor-pointer transition-all ${uploading ? 'opacity-50' : ''}`}>
                        <Upload className="inline w-3 h-3 mr-1" /> {uploading ? 'A carregar...' : 'Alterar capa'}
                      </div>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nome Profissional *</label>
                <input
                  value={form.walker_name}
                  onChange={e => set("walker_name", e.target.value)}
                  placeholder={user?.full_name || "O teu nome"}
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 focus:ring-0 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Localização *
                </label>
                <input
                  value={form.location}
                  onChange={e => set("location", e.target.value)}
                  placeholder="Lisboa, Porto, Braga..."
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm"
                />
                {form.location && (
                  <div className="mt-2 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
                    💡 A coordenada será determinada automaticamente pela localização.
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Anos de experiência *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.experience_years}
                  onChange={e => set("experience_years", e.target.value)}
                  placeholder="0"
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Idiomas aceitos *
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleArr("languages_spoken", lang)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${(form.languages_spoken || []).includes(lang) ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-slate-800 bg-slate-900 text-slate-300'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> WhatsApp
                </label>
                <input
                  value={form.whatsapp_number}
                  onChange={e => set("whatsapp_number", e.target.value)}
                  placeholder="351912345678"
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={e => set("bio", e.target.value)}
                  placeholder="Conta a tua experiência com animais..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm resize-none"
                />
                </div>

                <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Portfólio (opcional)</label>
                <div className="grid grid-cols-3 gap-3">
                  {(form.portfolio || []).map((item, index) => (
                    <div key={index} className="relative h-24 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                      <img src={item.media_url} alt="Portfólio" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => set("portfolio", form.portfolio.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(form.portfolio || []).length < 6 && (
                    <label className={`h-24 rounded-xl border border-dashed border-slate-600 bg-slate-900 flex items-center justify-center text-slate-400 text-xs cursor-pointer ${uploading ? 'opacity-50' : ''}`}>
                      <div className="text-center">
                        <Upload className="w-4 h-4 mx-auto mb-1" />
                        Adicionar
                      </div>
                      <input type="file" accept="image/*" multiple onChange={handlePortfolioUpload} className="hidden" disabled={uploading} />
                      </label>
                      )}
                      </div>
                      </div>
                      </motion.div>
                      )}

          {/* STEP 1 - Tipo */}
          {step === 1 && (
            <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">O teu papel</h2>
                <p className="text-slate-400 text-base mt-2 font-light">Que tipo de serviços pretendes oferecer?</p>
              </div>
              <div className="space-y-3">
                {[
                  { value: "walker", label: "Dog Walker 🦮", desc: "Passeios, guarda, visitas domiciliárias" },
                  { value: "trainer", label: "Treinador 🎓", desc: "Adestramento, treino comportamental" },
                  { value: "both", label: "Dog Walker + Treinador 🌟", desc: "Oferece ambos os serviços" },
                  { value: "hotel", label: "Hotel Canino 🏨", desc: "Alojamento, creche e serviços de hotel para cães" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => set("professional_type", opt.value)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                      form.professional_type === opt.value
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-white font-bold">{opt.label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{opt.desc}</p>
                    {form.professional_type === opt.value && (
                      <CheckCircle className="w-4 h-4 text-orange-500 absolute right-4 top-1/2 -translate-y-1/2" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2 - Serviços ou Hotel Details */}
          {step === 2 && form.professional_type === 'hotel' && (
            <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Detalhes do Hotel 🏨</h2>
                <p className="text-slate-400 text-base mt-2 font-light">Informações sobre o teu hotel canino.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nome do Hotel *</label>
                <input value={form.hotel_name} onChange={e => set("hotel_name", e.target.value)} placeholder="Ex: Hotel PawCão Lisboa" className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Morada Completa</label>
                <input value={form.hotel_full_address} onChange={e => set("hotel_full_address", e.target.value)} placeholder="Rua, nº, cidade, código postal" className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Preço/Noite (€)</label>
                  <input type="number" min="0" value={form.hotel_price_per_night} onChange={e => set("hotel_price_per_night", e.target.value)} className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Preço Creche/Dia (€)</label>
                  <input type="number" min="0" value={form.hotel_price_daycare} onChange={e => set("hotel_price_daycare", e.target.value)} className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Check-in</label>
                  <input type="time" value={form.hotel_checkin_time} onChange={e => set("hotel_checkin_time", e.target.value)} className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Check-out</label>
                  <input type="time" value={form.hotel_checkout_time} onChange={e => set("hotel_checkout_time", e.target.value)} className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Capacidade Total (nº de cães)</label>
                <input type="number" min="1" value={form.hotel_capacity_total} onChange={e => set("hotel_capacity_total", e.target.value)} className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tamanhos aceites</p>
                <div className="grid grid-cols-2 gap-2">
                  {DOG_SIZES.map(s => (
                    <button key={s.value} onClick={() => {
                      const arr = form.hotel_accepted_sizes || [];
                      set("hotel_accepted_sizes", arr.includes(s.value) ? arr.filter(x => x !== s.value) : [...arr, s.value]);
                    }} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${(form.hotel_accepted_sizes || []).includes(s.value) ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800 bg-slate-900'}`}>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{s.label}</p>
                        <p className="text-xs text-slate-400">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Comodidades</p>
                <div className="grid grid-cols-2 gap-2">
                  {["Jardim", "Piscina", "Webcam", "Ar condicionado", "Passeios incluídos", "Veterinário parceiro", "Transporte", "Grooming"].map(amenity => (
                    <button key={amenity} onClick={() => {
                      const arr = form.hotel_amenities || [];
                      set("hotel_amenities", arr.includes(amenity) ? arr.filter(x => x !== amenity) : [...arr, amenity]);
                    }} className={`p-3 rounded-xl border-2 text-xs font-bold text-left transition-all ${(form.hotel_amenities || []).includes(amenity) ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>
              </motion.div>
              )}

              {step === 2 && form.professional_type !== 'hotel' && (
            <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Serviços & Preços</h2>
                <p className="text-slate-400 text-base mt-2 font-light">Define o que ofereces e quanto cobras.</p>
              </div>

              <div className="p-4 bg-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm">Preço base por hora</p>
                  <p className="text-slate-400 text-xs">Cães e Gatos</p>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="w-4 h-4 text-orange-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.hourly_rate}
                    onChange={e => set("hourly_rate", e.target.value)}
                    className="w-16 bg-transparent text-orange-400 font-black text-xl text-right outline-none"
                  />
                </div>
              </div>

              <div>
                <p className="text-white text-sm font-bold mb-3">Serviços rápidos</p>
                <div className="space-y-3">
                  {SERVICE_PRESETS.map((preset) => {
                    const i = form.services_offered.findIndex((service) => service.key === preset.key || service.service_name === preset.service_name);
                    const svc = i >= 0 ? form.services_offered[i] : { ...preset, price: preset.defaultPrice };

                    return (
                      <div key={preset.key} className="p-3 bg-slate-800 rounded-xl space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-white font-bold text-sm">{svc.service_name}</p>
                            <p className="text-slate-400 text-xs">{svc.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextServices = [...form.services_offered];
                              if (i >= 0) {
                                nextServices[i] = { ...nextServices[i], is_active: !(nextServices[i].is_active ?? true) };
                              } else {
                                nextServices.push({ ...preset, price: preset.defaultPrice, is_active: false });
                              }
                              set("services_offered", nextServices);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${svc.is_active !== false ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}
                          >
                            {svc.is_active !== false ? 'Ativo' : 'Oculto'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1 w-24 px-2 py-2 bg-slate-700 rounded-lg border border-slate-600">
                          <Euro className="w-3 h-3 text-orange-400 flex-shrink-0" />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={svc.price || ""}
                            onChange={e => {
                              const nextPrice = parseFloat(e.target.value) || 0;
                              const nextServices = [...form.services_offered];
                              if (i >= 0) {
                                nextServices[i] = { ...nextServices[i], price: nextPrice };
                              } else {
                                nextServices.push({ ...preset, price: nextPrice, is_active: true });
                              }
                              set("services_offered", nextServices);
                            }}
                            className="w-full bg-transparent text-white text-xs outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              </motion.div>
              )}

              {/* STEP 3 - Preferências */}
          {step === 3 && (
            <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Preferências</h2>
                <p className="text-slate-400 text-base mt-2 font-light">Define quem podes ajudar e quando.</p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Animais que aceitas</p>
                <div className="grid grid-cols-3 gap-2">
                  {ANIMALS.map(a => (
                    <button
                      key={a.value}
                      onClick={() => toggleArr("accepted_animals", a.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        form.accepted_animals.includes(a.value)
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-800 bg-slate-900'
                      }`}
                    >
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
                    <button
                      key={s.value}
                      onClick={() => toggleArr("dog_sizes", s.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        form.dog_sizes.includes(s.value)
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-800 bg-slate-900'
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{s.label}</p>
                        <p className="text-xs text-slate-400">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* PawGo */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-orange-400" /> PawGo — Pedidos em Tempo Real
                </p>
                <button
                    onClick={() => set("instant_booking", !form.instant_booking)}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                      form.instant_booking ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-900'
                    }`}
                  >
                    <div>
                      <p className="text-white font-bold text-sm">Ativar PawGo</p>
                      <p className="text-slate-400 text-xs mt-0.5">Receber pedidos urgentes de passeio em tempo real</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full transition-all ${
                      form.instant_booking ? 'bg-orange-500' : 'bg-slate-700'
                    } flex items-center px-1`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        form.instant_booking ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </div>
                  </button>
              </div>

              {/* Raio de Trabalho */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Raio de Trabalho
                </p>
                <div className="p-4 bg-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white text-sm">Distância máxima</p>
                    <p className="text-orange-400 font-black text-lg">{form.work_radius_km} km</p>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={form.work_radius_km}
                    onChange={e => set("work_radius_km", parseInt(e.target.value))}
                    className="w-full accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Disponibilidade
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABILITY_SLOTS.map(sl => (
                    <button
                      key={sl.value}
                      onClick={() => toggleArr("availability", sl.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        form.availability.includes(sl.value)
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-slate-800 bg-slate-900'
                      }`}
                    >
                      <span className="text-xl">{sl.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white">{sl.label}</p>
                        <p className="text-xs text-slate-400">{sl.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documentos e país</p>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">País de operação</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'portugal', label: 'Portugal' },
                      { value: 'spain', label: 'Espanha' },
                      { value: 'france', label: 'França' },
                    ].map((country) => (
                      <button
                        key={country.value}
                        type="button"
                        onClick={() => set('country_of_operation', country.value)}
                        className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${form.country_of_operation === country.value ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-slate-800 bg-slate-900 text-slate-300'}`}
                      >
                        {country.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">{DOCUMENT_RULES[form.country_of_operation].taxLabel}</label>
                  <input
                    value={form[DOCUMENT_RULES[form.country_of_operation].taxField] || ''}
                    onChange={e => set(DOCUMENT_RULES[form.country_of_operation].taxField, e.target.value)}
                    placeholder={`Inserir ${DOCUMENT_RULES[form.country_of_operation].taxLabel}`}
                    className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-orange-500 outline-none text-sm"
                  />
                </div>

                {form.country_of_operation === 'france' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Tipo de prestador</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'professional', label: 'Profissional' },
                        { value: 'individual', label: 'Particular' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => set('france_professional_type', option.value)}
                          className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${form.france_professional_type === option.value ? 'border-orange-500 bg-orange-500/10 text-white' : 'border-slate-800 bg-slate-900 text-slate-300'}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3">
                  <label className={`w-full p-4 rounded-2xl border-2 ${form.id_document_url ? 'border-green-500 bg-green-500/10' : 'border-slate-800 bg-slate-900'} cursor-pointer`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">Documento de identificação</p>
                        <p className="text-xs text-slate-400">Portugal, Espanha ou França</p>
                      </div>
                      <span className="text-xs text-orange-400 font-bold">{form.id_document_url ? 'Carregado' : 'Carregar'}</span>
                    </div>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleOptionalDocumentUpload(e, 'id_document_url', 'Documento carregado!')} className="hidden" disabled={uploading} />
                  </label>

                  <label className={`w-full p-4 rounded-2xl border-2 ${form.proof_of_address_url ? 'border-green-500 bg-green-500/10' : 'border-slate-800 bg-slate-900'} cursor-pointer`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">Comprovativo de morada</p>
                        <p className="text-xs text-slate-400">Documento recente do país escolhido</p>
                      </div>
                      <span className="text-xs text-orange-400 font-bold">{form.proof_of_address_url ? 'Carregado' : 'Carregar'}</span>
                    </div>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => handleOptionalDocumentUpload(e, 'proof_of_address_url', 'Comprovativo carregado!')} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>
              </motion.div>
              )}

              {/* STEP 4 - Confirmação */}
          {step === 4 && (
            <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="text-center">
                <motion.div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
                  <CheckCircle className="w-10 h-10 text-blue-600" />
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">Tudo pronto!</h2>
                <p className="text-slate-400 text-base mt-2 font-light">Confirma os teus dados e cria o perfil.</p>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  {form.photo_url && (
                    <img src={form.photo_url} className="w-14 h-14 rounded-xl object-cover" alt="foto" />
                  )}
                  <div>
                    <p className="text-white font-black text-lg">{form.professional_type === 'hotel' ? (form.hotel_name || form.walker_name) : (form.walker_name || user?.full_name)}</p>
                    <p className="text-slate-400 text-sm">{form.professional_type === 'hotel' ? (form.hotel_full_address || form.location) : form.location}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest">Tipo</p>
                    <p className="text-white font-bold text-sm">
                      {form.professional_type === 'walker' ? '🦮 Dog Walker' :
                       form.professional_type === 'trainer' ? '🎓 Treinador' :
                       form.professional_type === 'both' ? '🌟 Dog Walker+Treinador' :
                       '🏨 Hotel Canino'}
                    </p>
                  </div>
                  {form.professional_type === 'hotel' ? (
                    <>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest">Preço/Noite</p>
                        <p className="text-purple-400 font-black text-sm">{form.hotel_price_per_night}€</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest">Capacidade</p>
                        <p className="text-white font-bold text-sm">{form.hotel_capacity_total} cães</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest">Comodidades</p>
                        <p className="text-white font-bold text-sm">{(form.hotel_amenities || []).length} selecionadas</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest">Preço/hora</p>
                        <p className="text-orange-400 font-black text-sm">{form.hourly_rate}€</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest">Serviços</p>
                        <p className="text-white font-bold text-sm">{form.services_offered.filter(s => s.service_name).length} serviços</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest">Animais</p>
                        <p className="text-white font-bold text-sm">{form.accepted_animals.length} tipos</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {form.professional_type !== 'hotel' && (
              <div className="flex gap-3">
                <div className="flex-1 bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-500 text-xs uppercase tracking-widest">PawGo</p>
                  <p className={`font-bold text-sm ${form.instant_booking ? 'text-orange-400' : 'text-slate-400'}`}>{form.instant_booking ? '⚡ Ativo' : '❌ Inativo'}</p>
                </div>
                <div className="flex-1 bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-500 text-xs uppercase tracking-widest">Raio</p>
                  <p className="text-white font-bold text-sm">{form.work_radius_km} km</p>
                </div>
              </div>
              )}

              <div className="bg-slate-800/50 border border-orange-500/20 rounded-xl p-3 text-xs text-slate-400">
                ⚠️ O teu perfil ficará em análise. A equipa PawCão verificará os teus dados e serás notificado quando aprovado.
              </div>
              </motion.div>
              )}

              {/* Navigation Buttons */}
              <motion.div className="flex gap-3 mt-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          {step > 0 && (
            <Button
              onClick={() => setStep(s => s - 1)}
              variant="outline"
              className="flex-1 h-12 border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 bg-white rounded-2xl font-semibold transition-all"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold disabled:opacity-50 transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40"
            >
              Continuar <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 disabled:opacity-50 transition-all"
            >
              {loading ? "A guardar..." : isEditing ? "Guardar Alterações ✅" : "Criar Perfil 🚀"}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}