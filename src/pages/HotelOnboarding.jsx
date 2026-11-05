import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Camera, MapPin, ChevronRight, ChevronLeft, CheckCircle, Upload,
  Phone, Building2, Clock, Users, PawPrint, Globe
} from "lucide-react";
import {
  DOG_SIZES, AMENITIES, DOCUMENT_RULES, ANIMALS, LANGUAGES,
  uploadFile, submitProfessionalProfile,
} from "@/lib/professionalOnboarding";

const STEPS = ["Identidade", "Infraestrutura", "Serviços", "Documentos", "Confirmação"];

export default function HotelOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [form, setForm] = useState(() => {
    try {
      const saved = sessionStorage.getItem("hotel_onboarding_form");
      if (saved) return JSON.parse(saved);
    } catch (e) { /* intentionally ignored */ }
    return {
      walker_name: "",
      location: "",
      bio: "",
      photo_url: "",
      cover_photo_url: "",
      whatsapp_number: "",
      professional_type: "hotel",
      hotel_name: "",
      hotel_full_address: "",
      hotel_checkin_time: "09:00",
      hotel_checkout_time: "18:00",
      hotel_capacity_total: "5",
      hotel_amenities: [],
      hotel_accepted_sizes: ["small", "medium", "large"],
      accepted_animals: ["dogs"],
      hotel_services: [
        { service_id: "boarding", service_name: "Alojamento", service_type: "boarding", capacity_total: 5, price_per_day: 25, is_active: true },
        { service_id: "daycare", service_name: "Creche Diária", service_type: "daycare", capacity_total: 5, price_per_day: 15, is_active: true },
      ],
      country_of_operation: "portugal",
      tax_id_portugal: "",
      tax_id_spain: "",
      tax_id_france: "",
      france_professional_type: "professional",
      id_document_url: "",
      proof_of_address_url: "",
      experience_years: "",
      languages_spoken: ["Português"],
    };
  });

  const { data: user, isError: userError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    retry: 1,
  });

  const { data: existingProfile, isError: profileError } = useQuery({
    queryKey: ["existingHotelProfile", user?.email],
    queryFn: async () => {
      if (!user?.id) return null;
      const profiles = await base44.entities.WalkerProfile.filter({
        user_id: user.id,
        professional_type: "hotel",
      });
      return profiles[0] || null;
    },
    enabled: !!user?.id,
    staleTime: 0,
    retry: 1,
  });

  useEffect(() => {
    if (formInitialized) return;
    if (!user) {
      if (userError) { setFormInitialized(true); setIsLoadingData(false); }
      return;
    }
    if (existingProfile === undefined) {
      if (profileError) { setFormInitialized(true); setIsLoadingData(false); }
      return;
    }

    setFormInitialized(true);
    setIsLoadingData(false);

    if (existingProfile) {
      const hd = existingProfile.hotel_details || {};
      setForm(prev => ({
        ...prev,
        walker_name: existingProfile.walker_name || user.full_name || "",
        location: existingProfile.location || "",
        bio: existingProfile.bio || "",
        photo_url: existingProfile.photo_url || "",
        cover_photo_url: existingProfile.cover_photo_url || "",
        whatsapp_number: existingProfile.whatsapp_number || "",
        hotel_name: hd.hotel_name || "",
        hotel_full_address: hd.full_address || "",
        hotel_checkin_time: hd.checkin_time || "09:00",
        hotel_checkout_time: hd.checkout_time || "18:00",
        hotel_capacity_total: String(hd.capacity_total || 5),
        hotel_amenities: hd.amenities || [],
        hotel_accepted_sizes: hd.accepted_dog_sizes || ["small", "medium", "large"],
        accepted_animals: existingProfile.accepted_animals || ["dogs"],
        hotel_services: hd.services?.length ? hd.services : prev.hotel_services,
        country_of_operation: existingProfile.country_of_operation || "portugal",
        tax_id_portugal: existingProfile.tax_id_portugal || "",
        tax_id_spain: existingProfile.tax_id_spain || "",
        tax_id_france: existingProfile.tax_id_france || "",
        france_professional_type: existingProfile.france_professional_type || "professional",
        id_document_url: existingProfile.id_document_url || "",
        proof_of_address_url: existingProfile.proof_of_address_url || "",
        experience_years: existingProfile.experience_years != null ? String(existingProfile.experience_years) : "",
        languages_spoken: existingProfile.languages_spoken?.length ? existingProfile.languages_spoken : prev.languages_spoken,
      }));
    } else if (user.full_name) {
      setForm(prev => ({ ...prev, walker_name: user.full_name, hotel_name: user.full_name }));
    }
  }, [existingProfile, user, formInitialized, userError, profileError]);

  const set = (key, val) => {
    setForm(prev => {
      const updated = { ...prev, [key]: val };
      try { sessionStorage.setItem("hotel_onboarding_form", JSON.stringify(updated)); } catch (e) { /* intentionally ignored */ }
      return updated;
    });
  };

  const toggleArr = (key, val) => {
    const arr = form[key] || [];
    set(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleUpload = async (e, field, successMsg) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      set(field, url);
      toast.success(successMsg);
    } catch {
      toast.error("Erro no upload.");
    }
    setUploading(false);
  };

  const updateService = (idx, field, value) => {
    const services = [...form.hotel_services];
    services[idx] = { ...services[idx], [field]: value };
    set("hotel_services", services);
  };

  const isEditing = !!(formInitialized && existingProfile);

  const canProceed = () => {
    if (step === 0) return form.hotel_name.trim() && form.location.trim() && String(form.experience_years).trim() !== "" && (form.languages_spoken || []).length > 0;
    if (step === 1) return parseInt(form.hotel_capacity_total) > 0;
    return true;
  };

  const handleFinish = async () => {
    if (!user) {
      toast.info("Precisas de criar uma conta para guardar o teu hotel.");
      navigate(`/register?from=${encodeURIComponent('/HotelOnboarding')}`);
      return;
    }
    setLoading(true);
    try {
      await submitProfessionalProfile(user, form, isEditing, queryClient, navigate);
      sessionStorage.removeItem("hotel_onboarding_form");
      if (isEditing) {
        toast.success("Alterações do hotel enviadas para aprovação do admin! ⏳");
      } else {
        toast.success("Perfil de hotel submetido para aprovação! 🏨");
      }
      navigate(createPageUrl("HotelDashboard"), { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar perfil: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="w-16 h-16 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-sm font-medium">A carregar perfil...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-10 pt-6">
      <div className="w-full max-w-2xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white text-sm font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </motion.button>

        {/* Progress */}
        <motion.div className="mb-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex gap-2 mb-4">
            {STEPS.map((s, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-purple-600" : "bg-slate-200"}`} />
            ))}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Passo {step + 1} de {STEPS.length}</p>
            <p className="text-white font-bold text-lg">{STEPS[step]}</p>
          </div>
        </motion.div>

        {/* STEP 0 - Identidade */}
        {step === 0 && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Identidade do Hotel 🏨</h2>
              <p className="text-slate-400 text-base mt-2 font-light">Como os donos vão conhecer o teu hotel.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 flex-shrink-0">
                {form.photo_url ? (
                  <img src={form.photo_url} className="w-full h-full object-cover" alt="foto" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Camera className="w-8 h-8 text-slate-600" /></div>
                )}
              </div>
              <label className="flex-1">
                <div className={`w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium cursor-pointer text-center ${uploading ? "opacity-50" : ""}`}>
                  <Upload className="inline w-4 h-4 mr-2" />{uploading ? "A carregar..." : "Logo / Foto"}
                </div>
                <input type="file" accept="image/*" onChange={e => handleUpload(e, "photo_url", "Foto carregada!")} className="hidden" disabled={uploading} />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Foto de capa</label>
              <div className="relative w-full h-28 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700">
                {form.cover_photo_url ? (
                  <img src={form.cover_photo_url} className="w-full h-full object-cover" alt="capa" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Camera className="w-7 h-7 text-slate-600" /></div>
                )}
                <div className="absolute bottom-2 right-2">
                  <label>
                    <div className={`px-3 py-1.5 bg-slate-900/80 text-slate-200 rounded-lg text-xs font-medium cursor-pointer ${uploading ? "opacity-50" : ""}`}>
                      <Upload className="inline w-3 h-3 mr-1" /> Alterar
                    </div>
                    <input type="file" accept="image/*" onChange={e => handleUpload(e, "cover_photo_url", "Capa atualizada!")} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Building2 className="w-3 h-3" /> Nome do Hotel *</label>
              <input value={form.hotel_name} onChange={e => set("hotel_name", e.target.value)} placeholder="Ex: Hotel PawCão Lisboa" className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 outline-none text-sm" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Cidade / Região *</label>
              <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="Lisboa, Porto..." className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 outline-none text-sm" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Morada Completa</label>
              <input value={form.hotel_full_address} onChange={e => set("hotel_full_address", e.target.value)} placeholder="Rua, nº, código postal" className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 outline-none text-sm" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3" /> WhatsApp</label>
              <input value={form.whatsapp_number} onChange={e => set("whatsapp_number", e.target.value)} placeholder="351912345678" className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 outline-none text-sm" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Anos de Experiência *</label>
              <input type="number" min="0" value={form.experience_years} onChange={e => set("experience_years", e.target.value)} placeholder="0" className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 outline-none text-sm" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Globe className="w-3 h-3" /> Idiomas aceitos *</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button key={lang} type="button" onClick={() => toggleArr("languages_spoken", lang)} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${(form.languages_spoken || []).includes(lang) ? "border-purple-500 bg-purple-500/10 text-white" : "border-slate-800 bg-slate-900 text-slate-300"}`}>{lang}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Descrição do Hotel</label>
              <textarea value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Descreve o teu hotel, infraestrutura, experiência..." rows={3} className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 outline-none text-sm resize-none" />
            </div>
          </motion.div>
        )}

        {/* STEP 1 - Infraestrutura */}
        {step === 1 && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Infraestrutura</h2>
              <p className="text-slate-400 text-base mt-2 font-light">Capacidade, horários e comodidades.</p>
            </div>

            <div className="p-4 bg-slate-800 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <p className="text-white font-bold text-sm">Capacidade Total</p>
                </div>
                <p className="text-purple-400 font-black text-2xl">{form.hotel_capacity_total}</p>
              </div>
              <p className="text-slate-400 text-xs mb-3">Nº máximo de cães em simultâneo</p>
              <input type="range" min="1" max="50" value={form.hotel_capacity_total} onChange={e => set("hotel_capacity_total", e.target.value)} className="w-full accent-purple-500" />
              <div className="flex justify-between text-xs text-slate-500 mt-1"><span>1</span><span>50</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Check-in</label>
                <input type="time" value={form.hotel_checkin_time} onChange={e => set("hotel_checkin_time", e.target.value)} className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 outline-none text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Check-out</label>
                <input type="time" value={form.hotel_checkout_time} onChange={e => set("hotel_checkout_time", e.target.value)} className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 outline-none text-sm" />
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><PawPrint className="w-3 h-3" /> Tamanhos aceites</p>
              <div className="grid grid-cols-2 gap-2">
                {DOG_SIZES.map(s => (
                  <button key={s.value} onClick={() => toggleArr("hotel_accepted_sizes", s.value)} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${(form.hotel_accepted_sizes || []).includes(s.value) ? "border-purple-500 bg-purple-500/10" : "border-slate-800 bg-slate-900"}`}>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{s.label}</p>
                      <p className="text-xs text-slate-400">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1"><PawPrint className="w-3 h-3" /> Animais aceites</p>
              <div className="grid grid-cols-2 gap-2">
                {ANIMALS.map(a => (
                  <button key={a.value} onClick={() => toggleArr("accepted_animals", a.value)} className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${(form.accepted_animals || ["dogs"]).includes(a.value) ? "border-purple-500 bg-purple-500/10 text-white" : "border-slate-800 bg-slate-900 text-slate-400"}`}>
                    <span className="text-lg">{a.icon}</span>
                    <span className="text-sm font-bold">{a.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Se aceita exóticos (lontras, répteis, aves, etc.), selecione os tipos relevantes.</p>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Comodidades</p>
              <div className="grid grid-cols-2 gap-2">
                {AMENITIES.map(a => (
                  <button key={a} onClick={() => toggleArr("hotel_amenities", a)} className={`p-3 rounded-xl border-2 text-xs font-bold text-left transition-all ${(form.hotel_amenities || []).includes(a) ? "border-purple-500 bg-purple-500/10 text-white" : "border-slate-800 bg-slate-900 text-slate-400"}`}>{a}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2 - Serviços & Preços */}
        {step === 2 && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Serviços & Preços</h2>
              <p className="text-slate-400 text-base mt-2 font-light">Define os serviços oferecidos e capacidades individuais.</p>
            </div>

            <div className="space-y-3">
              {form.hotel_services.map((svc, idx) => (
                <div key={idx} className="p-4 bg-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-bold text-sm">{svc.service_name}</p>
                    <button onClick={() => updateService(idx, "is_active", !svc.is_active)} className={`px-3 py-1 rounded-full text-xs font-bold ${svc.is_active ? "bg-green-500/20 text-green-300 border border-green-500/30" : "bg-slate-700 text-slate-300 border border-slate-600"}`}>
                      {svc.is_active ? "Ativo" : "Inativo"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Preço/Dia (€)</label>
                      <input type="number" min="0" value={svc.price_per_day || ""} onChange={e => updateService(idx, "price_per_day", parseFloat(e.target.value) || 0)} className="w-full h-10 px-3 bg-slate-700 text-white rounded-lg border border-slate-600 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Capacidade</label>
                      <input type="number" min="1" value={svc.capacity_total || ""} onChange={e => updateService(idx, "capacity_total", parseInt(e.target.value) || 1)} className="w-full h-10 px-3 bg-slate-700 text-white rounded-lg border border-slate-600 outline-none text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-3 text-xs text-slate-400">
              💡 Podes ajustar preços e capacidades individuais mais tarde no Dashboard do Hotel.
            </div>
          </motion.div>
        )}

        {/* STEP 3 - Documentos */}
        {step === 3 && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Documentos & País</h2>
              <p className="text-slate-400 text-base mt-2 font-light">Informação fiscal e verificação.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">País de operação</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "portugal", label: "Portugal" },
                  { value: "spain", label: "Espanha" },
                  { value: "france", label: "França" },
                ].map(c => (
                  <button key={c.value} onClick={() => set("country_of_operation", c.value)} className={`p-3 rounded-xl border-2 text-xs font-bold ${form.country_of_operation === c.value ? "border-purple-500 bg-purple-500/10 text-white" : "border-slate-800 bg-slate-900 text-slate-300"}`}>{c.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">{DOCUMENT_RULES[form.country_of_operation].taxLabel}</label>
              <input value={form[DOCUMENT_RULES[form.country_of_operation].taxField] || ""} onChange={e => set(DOCUMENT_RULES[form.country_of_operation].taxField, e.target.value)} placeholder={`Inserir ${DOCUMENT_RULES[form.country_of_operation].taxLabel}`} className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-purple-500 outline-none text-sm" />
            </div>

            {form.country_of_operation === "france" && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Tipo de prestador</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: "professional", label: "Profissional" }, { value: "individual", label: "Particular" }].map(o => (
                    <button key={o.value} onClick={() => set("france_professional_type", o.value)} className={`p-3 rounded-xl border-2 text-xs font-bold ${form.france_professional_type === o.value ? "border-purple-500 bg-purple-500/10 text-white" : "border-slate-800 bg-slate-900 text-slate-300"}`}>{o.label}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-3">
              <label className={`w-full p-4 rounded-2xl border-2 ${form.id_document_url ? "border-green-500 bg-green-500/10" : "border-slate-800 bg-slate-900"} cursor-pointer`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">Documento de identificação</p>
                    <p className="text-xs text-slate-400">CC, Passaporte ou NIF da empresa</p>
                  </div>
                  <span className="text-xs text-purple-400 font-bold">{form.id_document_url ? "Carregado" : "Carregar"}</span>
                </div>
                <input type="file" accept="image/*,.pdf" onChange={e => handleUpload(e, "id_document_url", "Documento carregado!")} className="hidden" disabled={uploading} />
              </label>

              <label className={`w-full p-4 rounded-2xl border-2 ${form.proof_of_address_url ? "border-green-500 bg-green-500/10" : "border-slate-800 bg-slate-900"} cursor-pointer`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">Comprovativo de morada</p>
                    <p className="text-xs text-slate-400">Documento recente do país escolhido</p>
                  </div>
                  <span className="text-xs text-purple-400 font-bold">{form.proof_of_address_url ? "Carregado" : "Carregar"}</span>
                </div>
                <input type="file" accept="image/*,.pdf" onChange={e => handleUpload(e, "proof_of_address_url", "Comprovativo carregado!")} className="hidden" disabled={uploading} />
              </label>
            </div>
          </motion.div>
        )}

        {/* STEP 4 - Confirmação */}
        {step === 4 && (
          <motion.div className="space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center">
              <motion.div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}>
                <CheckCircle className="w-10 h-10 text-purple-600" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Tudo pronto!</h2>
              <p className="text-slate-400 text-base mt-2 font-light">Confirma os dados do teu hotel.</p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                {form.photo_url && <img src={form.photo_url} className="w-14 h-14 rounded-xl object-cover" alt="foto" />}
                <div>
                  <p className="text-white font-black text-lg">{form.hotel_name || form.walker_name}</p>
                  <p className="text-slate-400 text-sm">{form.hotel_full_address || form.location}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest">Capacidade</p>
                  <p className="text-white font-bold text-sm">{form.hotel_capacity_total} cães</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest">Check-in/out</p>
                  <p className="text-white font-bold text-sm">{form.hotel_checkin_time} / {form.hotel_checkout_time}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest">Serviços</p>
                  <p className="text-white font-bold text-sm">{form.hotel_services.filter(s => s.is_active).length} ativos</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-widest">Comodidades</p>
                  <p className="text-white font-bold text-sm">{(form.hotel_amenities || []).length} selecionadas</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-purple-500/20 rounded-xl p-3 text-xs text-slate-400">
              ⚠️ O teu hotel ficará em análise. A equipa PawCão verificará os dados e serás notificado quando aprovado.
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div className="flex gap-3 mt-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {step > 0 && (
            <Button onClick={() => setStep(s => s - 1)} variant="outline" className="flex-1 h-12 border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 bg-white rounded-2xl font-semibold">
              <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-semibold disabled:opacity-50 shadow-lg shadow-purple-600/30">
              Continuar <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading} className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-semibold shadow-lg shadow-purple-600/30 disabled:opacity-50">
              {loading ? "A guardar..." : isEditing ? "Guardar Alterações ✅" : "Criar Hotel 🏨"}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}