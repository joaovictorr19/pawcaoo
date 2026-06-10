import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Loader2, Save, Trash2, Camera } from "lucide-react";
import { toast } from "sonner";

const sectionCls = "bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4";
const labelCls = "text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5";
const inputCls = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-colors";
const textareaCls = "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 resize-none transition-colors";
const selectCls = "w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-colors appearance-none";

export default function EditAnimalProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const animalId = urlParams.get('id');
  const isNewAnimal = !animalId;

  const [uploading, setUploading] = useState(false);

  const { data: animal, isLoading } = useQuery({
    queryKey: ['animalProfile', animalId],
    queryFn: async () => {
      if (isNewAnimal) return null;
      const animals = await base44.entities.DogProfile.filter({ id: animalId });
      return animals[0];
    },
    enabled: !isNewAnimal,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const VACCINE_OPTIONS = [
    "Raiva",
    "Tosse do Canil (Bordetella)",
    "Polivalente (DHPPi / V8 / V10)",
    "Leishmaniose",
    "Leptospirose",
    "Gripe Canina",
  ];

  const [formData, setFormData] = useState({
    dog_name: "",
    animal_type: "dog",
    breed: "",
    age: "",
    weight: "",
    size: "medium",
    gender: "male",
    color: "",
    photo_url: "",
    bio: "",
    pickup_address: "",
    pickup_city: "",
    pickup_postal_code: "",
    owner_phone: "",
    energy_level: "normal",
    socialization: "friendly",
    reactive_to_dogs: false,
    reactive_to_people: false,
    reactive_to_noises: false,
    is_vaccinated: true,
    is_neutered: false,
    vaccines: [],
    deworming_internal: { last_date: "", product_name: "" },
    deworming_external: { last_date: "", product_name: "" },
    vet_clinic_name: "",
    vet_phone: "",
    medical_conditions: "",
    behavioral_notes: "",
    special_care_notes: "",
    other_observations: "",
  });

  useEffect(() => {
    if (animal) {
      setFormData({
        dog_name: animal.dog_name || "",
        animal_type: animal.animal_type || "dog",
        breed: animal.breed || "",
        age: animal.age || "",
        weight: animal.weight || "",
        size: animal.size || "medium",
        gender: animal.gender || "male",
        color: animal.color || "",
        photo_url: animal.photo_url || "",
        bio: animal.bio || "",
        pickup_address: animal.pickup_address || "",
        pickup_city: animal.pickup_city || "",
        pickup_postal_code: animal.pickup_postal_code || "",
        owner_phone: animal.owner_phone || user?.phone || "",
        energy_level: animal.energy_level || "normal",
        socialization: animal.socialization || "friendly",
        is_vaccinated: animal.is_vaccinated ?? true,
        is_neutered: animal.is_neutered ?? false,
        vaccines: animal.vaccines || [],
        deworming_internal: animal.deworming_internal || { last_date: "", product_name: "" },
        deworming_external: animal.deworming_external || { last_date: "", product_name: "" },
        vet_clinic_name: animal.vet_clinic_name || "",
        vet_phone: animal.vet_phone || "",
        medical_conditions: animal.medical_conditions || "",
        behavioral_notes: animal.behavioral_notes || "",
        special_care_notes: animal.special_care_notes || "",
        reactive_to_dogs: animal.reactive_to_dogs ?? false,
        reactive_to_people: animal.reactive_to_people ?? false,
        reactive_to_noises: animal.reactive_to_noises ?? false,
        other_observations: animal.other_observations || "",
      });
    }
  }, [animal, user]);

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('photo_url', file_url);
      toast.success("Foto carregada!");
    } catch {
      toast.error("Erro ao carregar foto");
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isNewAnimal) {
        return await base44.entities.DogProfile.create({ ...data, owner_email: user.email });
      } else {
        return await base44.entities.DogProfile.update(animalId, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['animalProfile']);
      queryClient.invalidateQueries(['myDogs']);
      toast.success(isNewAnimal ? "Animal adicionado!" : "Perfil atualizado!");
      navigate(-1);
    },
    onError: (error) => toast.error("Erro ao salvar: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.DogProfile.delete(animalId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myDogs']);
      toast.success("Animal removido");
      navigate(createPageUrl('Home'));
    },
    onError: (error) => toast.error("Erro ao remover: " + error.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.dog_name) { toast.error("Por favor insira o nome do animal"); return; }
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja remover este animal?")) deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="sticky top-0 md:top-16 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="font-semibold text-slate-900 text-sm">
            {isNewAnimal ? "Novo Animal" : "Editar Perfil"}
          </h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Foto */}
          <div className={sectionCls}>
            <label className={labelCls}>Foto do Animal</label>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Animal" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🐾</div>
                )}
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors border border-slate-200">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {uploading ? "A carregar..." : "Alterar Foto"}
                </div>
              </label>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🐾</span>
              <span className={labelCls + " mb-0"}>Informações Básicas</span>
            </div>

            <div>
              <label className={labelCls}>Nome do Animal *</label>
              <input value={formData.dog_name} onChange={e => set('dog_name', e.target.value)} placeholder="Ex: Rex" className={inputCls} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={formData.animal_type} onChange={e => set('animal_type', e.target.value)} className={selectCls}>
                  <option value="dog">🐕 Cão</option>
                  <option value="cat">🐱 Gato</option>
                  <option value="reptile">🦎 Réptil</option>
                  <option value="rodent">🐹 Roedor</option>
                  <option value="bird">🦜 Ave</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Raça</label>
                <input value={formData.breed} onChange={e => set('breed', e.target.value)} placeholder="Ex: Labrador" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Idade (anos)</label>
                <input type="number" value={formData.age} onChange={e => set('age', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Peso (kg)</label>
                <input type="number" value={formData.weight} onChange={e => set('weight', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tamanho</label>
                <select value={formData.size} onChange={e => set('size', e.target.value)} className={selectCls}>
                  <option value="small">Pequeno</option>
                  <option value="medium">Médio</option>
                  <option value="large">Grande</option>
                  <option value="extra_large">Extra Grande</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Sexo</label>
                <select value={formData.gender} onChange={e => set('gender', e.target.value)} className={selectCls}>
                  <option value="male">Macho</option>
                  <option value="female">Fêmea</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Biografia</label>
              <textarea value={formData.bio} onChange={e => set('bio', e.target.value)} placeholder="Conta sobre a personalidade do teu animal..." rows={3} className={textareaCls} />
            </div>
          </div>

          {/* Endereço & Contato */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">📍</span>
              <span className={labelCls + " mb-0"}>Endereço & Contato</span>
            </div>

            <div>
              <label className={labelCls}>Endereço de Recolha</label>
              <input value={formData.pickup_address} onChange={e => set('pickup_address', e.target.value)} placeholder="Rua, número, andar" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Cidade</label>
                <input value={formData.pickup_city} onChange={e => set('pickup_city', e.target.value)} placeholder="Lisboa" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Código Postal</label>
                <input value={formData.pickup_postal_code} onChange={e => set('pickup_postal_code', e.target.value)} placeholder="1000-001" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Telefone de Contato</label>
              <input type="tel" value={formData.owner_phone} onChange={e => set('owner_phone', e.target.value)} placeholder="+351 912 345 678" className={inputCls} />
            </div>
          </div>

          {/* Saúde */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🏥</span>
              <span className={labelCls + " mb-0"}>Saúde</span>
            </div>

            <div>
              <label className={labelCls}>Castrado</label>
              <select value={formData.is_neutered.toString()} onChange={e => set('is_neutered', e.target.value === 'true')} className={selectCls}>
                <option value="true">Sim ✅</option>
                <option value="false">Não</option>
              </select>
            </div>

            {/* Vacinas */}
            <div>
              <label className={labelCls}>💉 Vacinas</label>
              <p className="text-xs text-slate-400 mb-3">Registe cada vacina individualmente com a data da última dose</p>
              <div className="space-y-3">
                {VACCINE_OPTIONS.map((vaccineName) => {
                  const existing = formData.vaccines.find(v => v.vaccine_name === vaccineName);
                  const hasVaccine = !!existing;
                  return (
                    <div key={vaccineName} className={`rounded-xl border transition-all ${hasVaccine ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'}`}>
                      <label className="flex items-center gap-3 p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasVaccine}
                          className="w-4 h-4 accent-green-500"
                          onChange={(e) => {
                            if (e.target.checked) {
                              set('vaccines', [...formData.vaccines, { vaccine_name: vaccineName, last_date: "", next_date: "" }]);
                            } else {
                              set('vaccines', formData.vaccines.filter(v => v.vaccine_name !== vaccineName));
                            }
                          }}
                        />
                        <span className="text-sm font-semibold text-slate-800 flex-1">{vaccineName}</span>
                        {hasVaccine && <span className="text-xs text-green-600 font-medium">✓ Vacinado</span>}
                      </label>
                      {hasVaccine && (
                        <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Última dose</label>
                            <input
                              type="date"
                              value={existing.last_date || ""}
                              onChange={(e) => set('vaccines', formData.vaccines.map(v => v.vaccine_name === vaccineName ? { ...v, last_date: e.target.value } : v))}
                              className={inputCls + " h-9 text-xs"}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Próxima dose</label>
                            <input
                              type="date"
                              value={existing.next_date || ""}
                              onChange={(e) => set('vaccines', formData.vaccines.map(v => v.vaccine_name === vaccineName ? { ...v, next_date: e.target.value } : v))}
                              className={inputCls + " h-9 text-xs"}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desparasitação */}
            <div>
              <label className={labelCls}>🪱 Desparasitação Interna</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Última data</label>
                  <input
                    type="date"
                    value={formData.deworming_internal.last_date || ""}
                    onChange={e => set('deworming_internal', { ...formData.deworming_internal, last_date: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Produto</label>
                  <input
                    type="text"
                    value={formData.deworming_internal.product_name || ""}
                    onChange={e => set('deworming_internal', { ...formData.deworming_internal, product_name: e.target.value })}
                    placeholder="Ex: Milbemax"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>🦟 Desparasitação Externa</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Última data</label>
                  <input
                    type="date"
                    value={formData.deworming_external.last_date || ""}
                    onChange={e => set('deworming_external', { ...formData.deworming_external, last_date: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Produto</label>
                  <input
                    type="text"
                    value={formData.deworming_external.product_name || ""}
                    onChange={e => set('deworming_external', { ...formData.deworming_external, product_name: e.target.value })}
                    placeholder="Ex: Frontline, Bravecto"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Clínica Veterinária</label>
              <input value={formData.vet_clinic_name} onChange={e => set('vet_clinic_name', e.target.value)} placeholder="Nome da clínica" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Telefone do Veterinário</label>
              <input type="tel" value={formData.vet_phone} onChange={e => set('vet_phone', e.target.value)} placeholder="+351 ..." className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Condições Médicas</label>
              <textarea value={formData.medical_conditions} onChange={e => set('medical_conditions', e.target.value)} placeholder="Ex: Displasia da anca" rows={2} className={textareaCls} />
            </div>
          </div>

          {/* Comportamento */}
          <div className={sectionCls}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🧠</span>
              <span className={labelCls + " mb-0"}>Comportamento</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nível de Energia</label>
                <select value={formData.energy_level} onChange={e => set('energy_level', e.target.value)} className={selectCls}>
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="very_high">Muito Alta</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Socialização</label>
                <select value={formData.socialization} onChange={e => set('socialization', e.target.value)} className={selectCls}>
                  <option value="friendly">Amigável 😊</option>
                  <option value="neutral">Neutro</option>
                  <option value="shy">Tímido</option>
                  <option value="aggressive">Agressivo ⚠️</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Notas de Comportamento</label>
              <textarea value={formData.behavioral_notes} onChange={e => set('behavioral_notes', e.target.value)} placeholder="Ex: Gosta de brincar com outros cães..." rows={3} className={textareaCls} />
            </div>

            <div>
              <label className={labelCls}>Cuidados Especiais</label>
              <textarea value={formData.special_care_notes} onChange={e => set('special_care_notes', e.target.value)} placeholder="Ex: Precisa de medicação às 18h..." rows={2} className={textareaCls} />
            </div>

            {/* Reatividades */}
            <div>
              <label className={labelCls}>⚠️ Reatividades</label>
              <p className="text-xs text-slate-400 mb-3">Assinale se o animal reage de forma intensa a algum estímulo</p>
              <div className="space-y-2">
                {[
                  { key: "reactive_to_dogs", label: "🐕 Reativo a outros cães", desc: "Latidos, agressividade ou medo excessivo perto de outros cães" },
                  { key: "reactive_to_people", label: "👥 Reativo a pessoas", desc: "Desconforto, latidos ou agressividade com estranhos" },
                  { key: "reactive_to_noises", label: "🔊 Reativo a barulhos", desc: "Medo de trovões, fogos de artifício, carros, etc." },
                ].map(({ key, label, desc }) => (
                  <label key={key} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData[key] ? 'border-orange-300 bg-orange-50' : 'border-slate-200 hover:border-orange-200 bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={formData[key]}
                      onChange={(e) => set(key, e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-orange-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Outras Observações */}
            <div>
              <label className={labelCls}>📝 Outras Observações</label>
              <p className="text-xs text-slate-400 mb-1.5">Comportamentos específicos que o passeador deve saber</p>
              <textarea
                value={formData.other_observations}
                onChange={e => set('other_observations', e.target.value)}
                placeholder="Ex: Come tudo o que encontra no chão, não pode soltar a trela, ladra para motos..."
                rows={3}
                className={textareaCls}
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pb-4">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex-1 h-12 bg-slate-900 hover:bg-black text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saveMutation.isPending ? "A guardar..." : "Guardar"}
            </button>
            {!isNewAnimal && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-5 h-12 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}