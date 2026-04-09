import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, Plus, Trash2, Heart, Syringe, AlertTriangle, Smile } from "lucide-react";

const TEMPERAMENTS = ["Calmo", "Energético", "Ansioso", "Sociável", "Tímido", "Agressivo", "Brincalhão", "Independente", "Carinhoso", "Protetor"];
const HEALTH_EVENT_TYPES = ["Vacina", "Consulta", "Cirurgia", "Medicação", "Exame", "Outro"];

export default function DogHealthProfileModal({ dog, userEmail, allDogs, onClose }) {
  const queryClient = useQueryClient();

  const initialDog = dog || {};
  const [form, setForm] = useState({
    dog_id: initialDog.dog_id || `dog_${Date.now()}`,
    dog_name: initialDog.dog_name || "",
    dog_breed: initialDog.dog_breed || "",
    dog_size: initialDog.dog_size || "medium",
    dog_age: initialDog.dog_age || "",
    photo_url: initialDog.photo_url || "",
    bio: initialDog.bio || "",
    special_needs: initialDog.special_needs || "",
    temperament: initialDog.temperament || [],
    health_history: initialDog.health_history || [],
    allergies: initialDog.allergies || "",
    vet_name: initialDog.vet_name || "",
    vet_phone: initialDog.vet_phone || "",
    microchip_number: initialDog.microchip_number || "",
    neutered: initialDog.neutered || false,
  });

  const [newHealth, setNewHealth] = useState({ type: "Vacina", date: "", description: "", vet: "" });
  const [addingHealth, setAddingHealth] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    setUploading(false);
  };

  const toggleTemperament = (t) => {
    setForm(f => ({
      ...f,
      temperament: f.temperament?.includes(t) ? f.temperament.filter(x => x !== t) : [...(f.temperament || []), t]
    }));
  };

  const addHealthEvent = () => {
    if (!newHealth.description) return;
    setForm(f => ({ ...f, health_history: [...(f.health_history || []), { ...newHealth }] }));
    setNewHealth({ type: "Vacina", date: "", description: "", vet: "" });
    setAddingHealth(false);
  };

  const removeHealthEvent = (idx) => setForm(f => ({ ...f, health_history: f.health_history.filter((_, i) => i !== idx) }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: userEmail });
      const profile = profiles[0];
      if (!profile) throw new Error("Perfil não encontrado");

      const updatedDogs = dog
        ? (profile.owned_dogs || []).map(d => d.dog_id === dog.dog_id ? form : d)
        : [...(profile.owned_dogs || []), form];

      return base44.entities.UserProfile.update(profile.id, { owned_dogs: updatedDogs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      queryClient.invalidateQueries(['currentUser']);
      toast.success("Perfil do animal guardado!");
      onClose();
    }
  });

  const SIZES = [{ k: "small", l: "Pequeno" }, { k: "medium", l: "Médio" }, { k: "large", l: "Grande" }, { k: "extra_large", l: "XL" }];

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl p-6 overflow-y-auto"
        style={{ maxHeight: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-black text-gray-900">🐶 {dog ? `Editar ${dog.dog_name}` : "Novo Animal"}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Photo */}
        <div className="flex items-center gap-4 mb-5">
          <label className="cursor-pointer">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-orange-400 transition-colors">
              {form.photo_url ? <img src={form.photo_url} className="w-full h-full object-cover" alt="dog" /> : <span className="text-2xl">{uploading ? "⏳" : "📷"}</span>}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          <div className="flex-1 space-y-2">
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" placeholder="Nome do animal *" value={form.dog_name} onChange={e => setForm(f => ({ ...f, dog_name: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" placeholder="Raça" value={form.dog_breed} onChange={e => setForm(f => ({ ...f, dog_breed: e.target.value }))} />
          </div>
        </div>

        {/* Size + Age */}
        <div className="flex gap-2 mb-4">
          {SIZES.map(s => (
            <button key={s.k} onClick={() => setForm(f => ({ ...f, dog_size: s.k }))}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${form.dog_size === s.k ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600"}`}>
              {s.l}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <input type="number" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" placeholder="Idade (anos)" value={form.dog_age} onChange={e => setForm(f => ({ ...f, dog_age: e.target.value }))} />
          <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" placeholder="Nº microchip" value={form.microchip_number} onChange={e => setForm(f => ({ ...f, microchip_number: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="neut" checked={form.neutered} onChange={e => setForm(f => ({ ...f, neutered: e.target.checked }))} className="accent-orange-500" />
          <label htmlFor="neut" className="text-sm text-gray-700">Esterilizado/Castrado</label>
        </div>

        {/* Temperament */}
        <div className="mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><Smile className="w-3.5 h-3.5" /> Temperamento</p>
          <div className="flex flex-wrap gap-2">
            {TEMPERAMENTS.map(t => (
              <button key={t} onClick={() => toggleTemperament(t)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${form.temperament?.includes(t) ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-600"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Bio + Notes */}
        <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none mb-3" rows={2} placeholder="Descrição / personalidade" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
        <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none mb-4" rows={2} placeholder="Necessidades especiais (medicação, comportamento...)" value={form.special_needs} onChange={e => setForm(f => ({ ...f, special_needs: e.target.value }))} />

        {/* Allergies */}
        <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 mb-4" placeholder="Alergias conhecidas" value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} />

        {/* Vet */}
        <div className="flex gap-2 mb-4">
          <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" placeholder="Veterinário" value={form.vet_name} onChange={e => setForm(f => ({ ...f, vet_name: e.target.value }))} />
          <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400" placeholder="Telemóvel vet." value={form.vet_phone} onChange={e => setForm(f => ({ ...f, vet_phone: e.target.value }))} />
        </div>

        {/* Health History */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Syringe className="w-3.5 h-3.5" /> Histórico de Saúde</p>
            <button onClick={() => setAddingHealth(true)} className="text-orange-500 text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Adicionar</button>
          </div>

          {(form.health_history || []).length === 0 && <p className="text-gray-400 text-xs text-center py-3">Sem registos de saúde</p>}
          <div className="space-y-2">
            {(form.health_history || []).map((h, i) => (
              <div key={i} className="flex items-start justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{h.type}</span>
                  <p className="text-sm text-gray-700 mt-1">{h.description}</p>
                  {h.date && <p className="text-xs text-gray-400">{h.date}{h.vet ? ` • ${h.vet}` : ''}</p>}
                </div>
                <button onClick={() => removeHealthEvent(i)} className="text-red-400 ml-2 flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {addingHealth && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mt-2 border border-gray-200">
              <div className="flex gap-2">
                <select className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" value={newHealth.type} onChange={e => setNewHealth(h => ({ ...h, type: e.target.value }))}>
                  {HEALTH_EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <input type="date" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" value={newHealth.date} onChange={e => setNewHealth(h => ({ ...h, date: e.target.value }))} />
              </div>
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" placeholder="Descrição *" value={newHealth.description} onChange={e => setNewHealth(h => ({ ...h, description: e.target.value }))} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" placeholder="Veterinário" value={newHealth.vet} onChange={e => setNewHealth(h => ({ ...h, vet: e.target.value }))} />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 text-sm rounded-xl" onClick={() => setAddingHealth(false)}>Cancelar</Button>
                <Button className="flex-1 text-sm rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold" onClick={addHealthEvent}>Adicionar</Button>
              </div>
            </div>
          )}
        </div>

        <Button onClick={() => saveMutation.mutate()} disabled={!form.dog_name || saveMutation.isPending} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl h-12">
          {saveMutation.isPending ? "A guardar..." : "Guardar Perfil"}
        </Button>
      </div>
    </div>
  );
}