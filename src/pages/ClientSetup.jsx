import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Camera, MapPin, Phone, ChevronRight, ChevronLeft,
  CheckCircle, Upload, Plus, Trash2, User, Home, PawPrint
} from "lucide-react";

const STEPS = ["Perfil", "Morada", "Os meus animais", "Conclusão"];

const DOG_SIZES = [
  { value: "small", label: "Pequeno", desc: "até 10kg" },
  { value: "medium", label: "Médio", desc: "10-25kg" },
  { value: "large", label: "Grande", desc: "25-45kg" },
  { value: "extra_large", label: "XL", desc: "+45kg" },
];

const ANIMAL_TYPES = [
  { value: "dog", label: "Cão", icon: "🐕" },
  { value: "cat", label: "Gato", icon: "🐈" },
  { value: "rabbit", label: "Coelho", icon: "🐇" },
  { value: "bird", label: "Ave", icon: "🦜" },
  { value: "reptile", label: "Réptil", icon: "🦎" },
  { value: "other", label: "Outro", icon: "🐾" },
];

const emptyAnimal = () => ({
  dog_id: `pet_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  dog_name: "",
  dog_breed: "",
  dog_size: "medium",
  dog_age: "",
  photo_url: "",
  bio: "",
  special_needs: "",
  animal_type: "dog",
});

export default function ClientSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAnimalIdx, setUploadingAnimalIdx] = useState(null);
  const [formInitialized, setFormInitialized] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    photo_url: "",
    bio: "",
    // Morada completa para rotas
    street: "",
    door_number: "",
    floor_apt: "",
    postal_code: "",
    city: "",
    country: "Portugal",
    latitude: null,
    longitude: null,
    // Animais
    owned_dogs: [],
  });

  const { data: user, isError: userError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    retry: 1,
  });

  const { data: userProfile, isError: profileError } = useQuery({
    queryKey: ["clientSetupProfile", user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 0,
    retry: 1,
  });

  useEffect(() => {
    if (formInitialized) return;
    if (!user) {
      if (userError) { setFormInitialized(true); }
      return;
    }
    if (userProfile === undefined) {
      if (profileError) { setFormInitialized(true); }
      return;
    }

    setFormInitialized(true);
    setForm(prev => ({
      ...prev,
      full_name: userProfile?.full_name || user.full_name || "",
      photo_url: userProfile?.profile_photo_url || user.profile_photo_url || "",
      bio: userProfile?.bio || "",
      city: userProfile?.city || "",
      owned_dogs: userProfile?.owned_dogs?.length ? userProfile.owned_dogs : [],
    }));
  }, [userProfile, user, formInitialized, userError, profileError]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

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

  const handleAnimalPhotoUpload = async (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAnimalIdx(idx);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const animals = [...form.owned_dogs];
      animals[idx] = { ...animals[idx], photo_url: file_url };
      set("owned_dogs", animals);
      toast.success("Foto do animal carregada!");
    } catch {
      toast.error("Erro no upload.");
    }
    setUploadingAnimalIdx(null);
  };

  const updateAnimal = (idx, field, val) => {
    const animals = [...form.owned_dogs];
    animals[idx] = { ...animals[idx], [field]: val };
    set("owned_dogs", animals);
  };

  const addAnimal = () => set("owned_dogs", [...form.owned_dogs, emptyAnimal()]);
  const removeAnimal = (idx) => set("owned_dogs", form.owned_dogs.filter((_, i) => i !== idx));

  const geocodeAddress = async () => {
    const address = `${form.street} ${form.door_number}, ${form.postal_code} ${form.city}, ${form.country}`;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch {}
    // fallback: só cidade
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.city + ', ' + form.country)}&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch {}
    return { lat: 38.7223, lng: -9.1393 };
  };

  const canProceed = () => {
    if (step === 0) return form.full_name.trim().length > 0;
    if (step === 1) return form.street.trim() && form.city.trim() && form.postal_code.trim();
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Geocodificar morada
      const { lat, lng } = await geocodeAddress();

      const fullAddress = [form.street, form.door_number, form.floor_apt]
        .filter(Boolean).join(", ") + (form.postal_code ? `, ${form.postal_code}` : "") + (form.city ? ` ${form.city}` : "") + (form.country ? `, ${form.country}` : "");

      // Atualizar Auth User
      await base44.auth.updateMe({
        full_name: form.full_name,
        profile_photo_url: form.photo_url || user.profile_photo_url,
        phone: form.phone,
        city: form.city,
      });

      // Criar/atualizar UserProfile
      const profileData = {
        user_email: user.email,
        user_id: user.id,
        full_name: form.full_name,
        profile_photo_url: form.photo_url || user.profile_photo_url || "",
        bio: form.bio,
        city: form.city,
        owned_dogs: form.owned_dogs.map(a => ({
          dog_id: a.dog_id,
          dog_name: a.dog_name,
          dog_breed: a.dog_breed,
          dog_size: a.dog_size,
          dog_age: parseFloat(a.dog_age) || 0,
          photo_url: a.photo_url,
          bio: a.bio,
          special_needs: a.special_needs,
        })),
        // Dados de morada para PawGo
        profile_stats: {
          ...(userProfile?.profile_stats || {}),
          address: fullAddress,
          street: form.street,
          door_number: form.door_number,
          floor_apt: form.floor_apt,
          postal_code: form.postal_code,
          city: form.city,
          country: form.country,
          latitude: lat,
          longitude: lng,
          pickup_address: fullAddress,
          pickup_lat: lat,
          pickup_lng: lng,
          phone: form.phone,
        },
      };

      if (userProfile?.id) {
        await base44.entities.UserProfile.update(userProfile.id, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }

      // Sincronizar animais com DogProfile (ficha completa)
      for (const animal of form.owned_dogs) {
        if (!animal.dog_name?.trim()) continue;
        const existingProfiles = await base44.entities.DogProfile.filter({ owner_email: user.email });
        const existing = existingProfiles.find(p => p.dog_id === animal.dog_id || p.dog_name === animal.dog_name);
        const dogData = {
          owner_email: user.email,
          dog_id: animal.dog_id,
          dog_name: animal.dog_name,
          animal_type: animal.animal_type || 'dog',
          breed: animal.dog_breed,
          age: parseFloat(animal.dog_age) || 0,
          size: animal.dog_size,
          photo_url: animal.photo_url,
          bio: animal.bio,
          special_needs: animal.special_needs,
          pickup_address: fullAddress,
          pickup_city: form.city,
          owner_phone: form.phone,
        };
        if (existing) {
          await base44.entities.DogProfile.update(existing.id, dogData);
        } else {
          await base44.entities.DogProfile.create(dogData);
        }
      }

      queryClient.invalidateQueries(["currentUser"]);
      queryClient.invalidateQueries(["clientSetupProfile"]);
      queryClient.invalidateQueries(["dogProfiles"]);
      toast.success("Perfil criado com sucesso! Bem-vindo à PawCão 🐾");
      navigate(createPageUrl("Home"), { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao guardar perfil: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-10 pt-6">
      <div className="w-full max-w-md mx-auto">
        {/* Back */}
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-1.5 mb-3">
            {STEPS.map((s, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-blue-500' : 'bg-slate-800'}`} />
            ))}
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Passo {step + 1} de {STEPS.length} — <span className="text-white">{STEPS[step]}</span>
          </p>
        </div>

        <AnimatePresence mode="wait">

          {/* STEP 0 - Perfil */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">O teu perfil</h2>
                <p className="text-slate-400 text-sm mt-1">Como os profissionais te irão conhecer.</p>
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

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" /> Nome Completo *
                </label>
                <input
                  value={form.full_name}
                  onChange={e => set("full_name", e.target.value)}
                  placeholder={user?.full_name || "O teu nome"}
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Telefone / WhatsApp
                </label>
                <input
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="+351 912 345 678"
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nota pessoal (opcional)</label>
                <textarea
                  value={form.bio}
                  onChange={e => set("bio", e.target.value)}
                  placeholder="Algo sobre ti e os teus animais..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-sm resize-none"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 1 - Morada */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">A tua morada</h2>
                <p className="text-slate-400 text-sm mt-1">Para o profissional saber onde ir buscar o teu animal.</p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-start gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                A morada é usada para gerar rotas automáticas no PawGo. Os dados são privados e só partilhados com profissionais contratados.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Rua / Avenida *</label>
                <input
                  value={form.street}
                  onChange={e => set("street", e.target.value)}
                  placeholder="Rua das Flores"
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Nº da Porta *</label>
                  <input
                    value={form.door_number}
                    onChange={e => set("door_number", e.target.value)}
                    placeholder="12"
                    className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Andar / Apt.</label>
                  <input
                    value={form.floor_apt}
                    onChange={e => set("floor_apt", e.target.value)}
                    placeholder="2º Esq"
                    className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Código Postal *</label>
                  <input
                    value={form.postal_code}
                    onChange={e => set("postal_code", e.target.value)}
                    placeholder="1000-001"
                    className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Cidade *</label>
                  <input
                    value={form.city}
                    onChange={e => set("city", e.target.value)}
                    placeholder="Lisboa"
                    className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">País</label>
                <select
                  value={form.country}
                  onChange={e => set("country", e.target.value)}
                  className="w-full h-12 px-4 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-sm"
                >
                  <option value="Portugal">Portugal</option>
                  <option value="Spain">Espanha</option>
                  <option value="France">França</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Instruções de acesso (opcional)</label>
                <textarea
                  value={form.access_notes || ""}
                  onChange={e => set("access_notes", e.target.value)}
                  placeholder="Ex: Campainha 2B, portão azul, código 1234..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800 text-white rounded-xl border border-slate-700 focus:border-blue-500 outline-none text-sm resize-none"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 2 - Animais */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Os teus animais</h2>
                <p className="text-slate-400 text-sm mt-1">Regista os teus animais para facilitar as reservas.</p>
              </div>

              {form.owned_dogs.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <PawPrint className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Ainda não tens animais registados.</p>
                  <p className="text-xs mt-1">Podes adicionar mais tarde.</p>
                </div>
              )}

              <div className="space-y-4">
                {form.owned_dogs.map((animal, idx) => (
                  <div key={animal.dog_id} className="bg-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-bold text-sm">Animal {idx + 1}</p>
                      <button onClick={() => removeAnimal(idx)} className="text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Tipo de animal */}
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Tipo</p>
                      <div className="flex gap-2 flex-wrap">
                        {ANIMAL_TYPES.map(t => (
                          <button
                            key={t.value}
                            onClick={() => updateAnimal(idx, "animal_type", t.value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              (animal.animal_type || "dog") === t.value
                                ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                                : 'border-slate-700 bg-slate-900 text-slate-400'
                            }`}
                          >
                            <span>{t.icon}</span> {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Foto + Nome */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
                        {animal.photo_url ? (
                          <img src={animal.photo_url} className="w-full h-full object-cover" alt="animal" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {ANIMAL_TYPES.find(t => t.value === (animal.animal_type || "dog"))?.icon || "🐾"}
                          </div>
                        )}
                      </div>
                      <label className="flex-1 cursor-pointer">
                        <div className={`w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium text-center transition-all ${uploadingAnimalIdx === idx ? 'opacity-50' : ''}`}>
                          <Upload className="inline w-3 h-3 mr-1" />
                          {uploadingAnimalIdx === idx ? "A carregar..." : "Foto"}
                        </div>
                        <input type="file" accept="image/*" onChange={e => handleAnimalPhotoUpload(e, idx)} className="hidden" disabled={uploadingAnimalIdx === idx} />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Nome *</label>
                        <input
                          value={animal.dog_name}
                          onChange={e => updateAnimal(idx, "dog_name", e.target.value)}
                          placeholder="Rex"
                          className="w-full h-9 px-3 bg-slate-700 text-white rounded-lg text-xs outline-none border border-slate-600 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Raça</label>
                        <input
                          value={animal.dog_breed}
                          onChange={e => updateAnimal(idx, "dog_breed", e.target.value)}
                          placeholder="Labrador"
                          className="w-full h-9 px-3 bg-slate-700 text-white rounded-lg text-xs outline-none border border-slate-600 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Idade (anos)</label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          value={animal.dog_age}
                          onChange={e => updateAnimal(idx, "dog_age", e.target.value)}
                          placeholder="3"
                          className="w-full h-9 px-3 bg-slate-700 text-white rounded-lg text-xs outline-none border border-slate-600 focus:border-blue-500"
                        />
                      </div>
                      {(animal.animal_type === "dog" || !animal.animal_type) && (
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Tamanho</label>
                          <select
                            value={animal.dog_size}
                            onChange={e => updateAnimal(idx, "dog_size", e.target.value)}
                            className="w-full h-9 px-3 bg-slate-700 text-white rounded-lg text-xs outline-none border border-slate-600 focus:border-blue-500"
                          >
                            {DOG_SIZES.map(s => (
                              <option key={s.value} value={s.value}>{s.label} ({s.desc})</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Necessidades especiais</label>
                      <input
                        value={animal.special_needs}
                        onChange={e => updateAnimal(idx, "special_needs", e.target.value)}
                        placeholder="Medicação, alergias, comportamento..."
                        className="w-full h-9 px-3 bg-slate-700 text-white rounded-lg text-xs outline-none border border-slate-600 focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addAnimal}
                className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl text-slate-400 hover:text-blue-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar Animal
              </button>
            </motion.div>
          )}

          {/* STEP 3 - Confirmação */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Tudo pronto!</h2>
                <p className="text-slate-400 text-sm mt-2">Confirma os teus dados antes de guardar.</p>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  {form.photo_url && (
                    <img src={form.photo_url} className="w-14 h-14 rounded-xl object-cover" alt="foto" />
                  )}
                  <div>
                    <p className="text-white font-black text-lg">{form.full_name || user?.full_name}</p>
                    <p className="text-slate-400 text-sm">{form.city}</p>
                    {form.phone && <p className="text-slate-500 text-xs mt-0.5">{form.phone}</p>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700 space-y-2">
                  <div className="flex items-start gap-2">
                    <Home className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-widest mb-0.5">Morada</p>
                      <p className="text-white text-sm">
                        {[form.street, form.door_number, form.floor_apt].filter(Boolean).join(", ")}
                      </p>
                      <p className="text-slate-400 text-xs">{form.postal_code} {form.city}, {form.country}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <PawPrint className="w-4 h-4 text-slate-500" />
                    <p className="text-slate-400 text-xs uppercase tracking-widest">Animais</p>
                  </div>
                  {form.owned_dogs.length === 0 ? (
                    <p className="text-slate-500 text-sm">Nenhum animal registado</p>
                  ) : (
                    <div className="flex gap-3 flex-wrap">
                      {form.owned_dogs.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-700 rounded-xl px-3 py-2">
                          {a.photo_url ? (
                            <img src={a.photo_url} className="w-8 h-8 rounded-lg object-cover" alt={a.dog_name} />
                          ) : (
                            <span className="text-lg">{ANIMAL_TYPES.find(t => t.value === (a.animal_type || "dog"))?.icon || "🐾"}</span>
                          )}
                          <div>
                            <p className="text-white text-xs font-bold">{a.dog_name || "Sem nome"}</p>
                            <p className="text-slate-400 text-xs">{a.dog_breed}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-3 text-xs text-slate-400">
                🐾 A tua morada é guardada de forma segura e só partilhada com profissionais que contratares via PawGo.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button
              onClick={() => setStep(s => s - 1)}
              variant="outline"
              className="flex-1 h-13 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 bg-transparent rounded-2xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1 h-13 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold disabled:opacity-40"
            >
              Continuar <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 h-13 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-900/50"
            >
              {loading ? "A guardar..." : "Criar Perfil 🐾"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}