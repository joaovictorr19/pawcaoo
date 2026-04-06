import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Camera, MapPin, Euro, Dog, Clock, ChevronRight, ChevronLeft, CheckCircle, Upload, Phone, Zap } from "lucide-react";

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

export default function ProfessionalSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    // Step 0 - Perfil
    walker_name: "",
    location: "",
    bio: "",
    photo_url: "",
    whatsapp_number: "",
    // Step 1 - Tipo
    professional_type: "walker", // walker | trainer | both
    // Step 2 - Serviços
    hourly_rate: "15",
    services_offered: [
      { service_name: "Passeio 1h", price: 15, description: "Passeio individual de 1 hora" },
    ],
    // Step 3 - Preferências
    accepted_animals: ["dogs"],
    dog_sizes: ["small", "medium", "large"],
    availability: ["morning", "afternoon"],
    // PawGo & Raio
    pawgo_enabled: true,
    work_radius_km: 5,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

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

  const canProceed = () => {
    if (step === 0) return form.walker_name.trim() && form.location.trim();
    if (step === 2) return parseFloat(form.hourly_rate) > 0;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Criar WalkerProfile
      const profileData = {
        walker_name: form.walker_name || user.full_name,
        location: form.location,
        bio: form.bio,
        photo_url: form.photo_url || user.profile_photo_url || "",
        hourly_rate: parseFloat(form.hourly_rate) || 15,
        whatsapp_number: form.whatsapp_number || "",
        services_offered: form.services_offered,
        accepted_animals: form.accepted_animals,
        dog_sizes: form.dog_sizes,
        availability: form.availability,
        is_active: true,
        is_online: false,
        verification_status: "pending",
        instant_booking: form.pawgo_enabled,
        service_areas: [{
          area_name: form.location,
          radius_km: form.work_radius_km,
        }],
        user_id: user.id,
      };

      // Verificar se já existe
      const existing = await base44.entities.WalkerProfile.filter({ created_by: user.email });
      let profile;
      if (existing.length > 0) {
        profile = await base44.entities.WalkerProfile.update(existing[0].id, profileData);
      } else {
        profile = await base44.entities.WalkerProfile.create(profileData);
      }

      // Atualizar User Auth
      await base44.auth.updateMe({
        account_type: form.professional_type,
        profile_photo_url: form.photo_url || user.profile_photo_url,
        city: form.location,
      });

      // Sincronizar UserProfile
      const userProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (userProfiles.length > 0) {
        await base44.entities.UserProfile.update(userProfiles[0].id, {
          full_name: form.walker_name || user.full_name,
          profile_photo_url: form.photo_url || user.profile_photo_url,
          city: form.location,
          bio: form.bio,
        });
      }

      queryClient.invalidateQueries(['currentUser']);
      queryClient.invalidateQueries(['myProfessionalProfile']);
      toast.success("Perfil criado com sucesso! 🎉");
      navigate(createPageUrl("ProfessionalHubV2"));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao criar perfil: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-1.5 mb-3">
            {STEPS.map((s, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-orange-500' : 'bg-slate-800'}`} />
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
                <h2 className="text-3xl font-black text-white tracking-tighter">O teu perfil público</h2>
                <p className="text-slate-400 text-sm mt-1">Como os donos de animais te vão conhecer.</p>
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
            </motion.div>
          )}

          {/* STEP 1 - Tipo */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">O teu papel</h2>
                <p className="text-slate-400 text-sm mt-1">Que tipo de serviços pretendes oferecer?</p>
              </div>
              <div className="space-y-3">
                {[
                  { value: "walker", label: "Passeador 🦮", desc: "Passeios, guarda, visitas domiciliárias" },
                  { value: "trainer", label: "Treinador 🎓", desc: "Adestramento, treino comportamental" },
                  { value: "both", label: "Ambos 🌟", desc: "Passeador + Treinador" },
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

          {/* STEP 2 - Serviços */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Serviços & Preços</h2>
                <p className="text-slate-400 text-sm mt-1">Define o que ofereces e quanto cobras.</p>
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
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white text-sm font-bold">Serviços Detalhados</p>
                  <button
                    onClick={() => set("services_offered", [...form.services_offered, { service_name: "", price: 0, description: "" }])}
                    className="text-orange-400 text-xs font-bold hover:text-orange-300"
                  >+ Adicionar</button>
                </div>
                <div className="space-y-3">
                  {form.services_offered.map((svc, i) => (
                    <div key={i} className="p-3 bg-slate-800 rounded-xl space-y-2">
                      <div className="flex gap-2">
                        <input
                          placeholder="Nome do serviço"
                          value={svc.service_name}
                          onChange={e => {
                            const arr = [...form.services_offered];
                            arr[i].service_name = e.target.value;
                            set("services_offered", arr);
                          }}
                          className="flex-1 h-9 px-3 bg-slate-700 text-white rounded-lg text-xs outline-none border border-slate-600 focus:border-orange-500"
                        />
                        <div className="flex items-center gap-1 w-24 px-2 bg-slate-700 rounded-lg border border-slate-600">
                          <Euro className="w-3 h-3 text-orange-400 flex-shrink-0" />
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={svc.price || ""}
                            onChange={e => {
                              const arr = [...form.services_offered];
                              arr[i].price = parseFloat(e.target.value) || 0;
                              set("services_offered", arr);
                            }}
                            className="w-full bg-transparent text-white text-xs outline-none"
                          />
                        </div>
                        {form.services_offered.length > 1 && (
                          <button
                            onClick={() => set("services_offered", form.services_offered.filter((_, j) => j !== i))}
                            className="text-red-400 text-xs px-2"
                          >✕</button>
                        )}
                      </div>
                      <input
                        placeholder="Descrição breve"
                        value={svc.description}
                        onChange={e => {
                          const arr = [...form.services_offered];
                          arr[i].description = e.target.value;
                          set("services_offered", arr);
                        }}
                        className="w-full h-8 px-3 bg-slate-700 text-white rounded-lg text-xs outline-none border border-slate-600 focus:border-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3 - Preferências */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Preferências</h2>
                <p className="text-slate-400 text-sm mt-1">Define quem podes ajudar e quando.</p>
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
                  onClick={() => set("pawgo_enabled", !form.pawgo_enabled)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    form.pawgo_enabled ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <div>
                    <p className="text-white font-bold text-sm">Ativar PawGo</p>
                    <p className="text-slate-400 text-xs mt-0.5">Receber pedidos urgentes de passeio em tempo real</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-all ${
                    form.pawgo_enabled ? 'bg-orange-500' : 'bg-slate-700'
                  } flex items-center px-1`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      form.pawgo_enabled ? 'translate-x-6' : 'translate-x-0'
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
            </motion.div>
          )}

          {/* STEP 4 - Confirmação */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-orange-500" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Tudo pronto!</h2>
                <p className="text-slate-400 text-sm mt-2">Confirma os teus dados e cria o perfil.</p>
              </div>

              <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  {form.photo_url && (
                    <img src={form.photo_url} className="w-14 h-14 rounded-xl object-cover" alt="foto" />
                  )}
                  <div>
                    <p className="text-white font-black text-lg">{form.walker_name || user?.full_name}</p>
                    <p className="text-slate-400 text-sm">{form.location}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-widest">Tipo</p>
                    <p className="text-white font-bold text-sm capitalize">{form.professional_type}</p>
                  </div>
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
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-500 text-xs uppercase tracking-widest">PawGo</p>
                  <p className={`font-bold text-sm ${form.pawgo_enabled ? 'text-orange-400' : 'text-slate-400'}`}>{form.pawgo_enabled ? '⚡ Ativo' : '❌ Inativo'}</p>
                </div>
                <div className="flex-1 bg-slate-800 rounded-xl p-3">
                  <p className="text-slate-500 text-xs uppercase tracking-widest">Raio</p>
                  <p className="text-white font-bold text-sm">{form.work_radius_km} km</p>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-orange-500/20 rounded-xl p-3 text-xs text-slate-400">
                ⚠️ O teu perfil ficará em análise. A equipa PawCão verificará os teus dados e serás notificado quando aprovado.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
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
              className="flex-1 h-13 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold disabled:opacity-40"
            >
              Continuar <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 h-13 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-bold shadow-lg shadow-orange-900/50"
            >
              {loading ? "A criar perfil..." : "Criar Perfil 🚀"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}