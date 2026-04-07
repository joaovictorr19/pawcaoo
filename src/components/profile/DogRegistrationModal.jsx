import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

const DOG_SIZES = [
  { value: "small", label: "Pequeno", desc: "até 10kg" },
  { value: "medium", label: "Médio", desc: "10-25kg" },
  { value: "large", label: "Grande", desc: "25-45kg" },
  { value: "extra_large", label: "XL", desc: "+45kg" },
];

export default function DogRegistrationModal({ isOpen, onClose, userEmail, onDogAdded }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dog, setDog] = useState({
    dog_id: Date.now().toString(),
    dog_name: "",
    dog_breed: "",
    dog_size: "medium",
    dog_age: "",
    photo_url: "",
    bio: "",
    special_needs: "",
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDog(prev => ({ ...prev, photo_url: file_url }));
      toast.success("Foto carregada!");
    } catch (err) {
      toast.error("Erro no upload.");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!dog.dog_name.trim() || !dog.dog_breed.trim()) {
      toast.error("Nome e raça são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_email: userEmail });
      if (!profiles || profiles.length === 0) {
        toast.error("Perfil de utilizador não encontrado");
        return;
      }

      const profile = profiles[0];
      const ownedDogs = profile.owned_dogs || [];
      ownedDogs.push(dog);

      await base44.entities.UserProfile.update(profile.id, {
        owned_dogs: ownedDogs,
      });

      toast.success(`${dog.dog_name} registado com sucesso! 🐕`);
      onDogAdded?.(dog);
      setDog({
        dog_id: Date.now().toString(),
        dog_name: "",
        dog_breed: "",
        dog_size: "medium",
        dog_age: "",
        photo_url: "",
        bio: "",
        special_needs: "",
      });
      onClose();
    } catch (err) {
      toast.error("Erro ao registar cão: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registar Novo Cão</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Foto */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 border-2 border-slate-300">
              {dog.photo_url ? (
                <img src={dog.photo_url} className="w-full h-full object-cover" alt={dog.dog_name} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <span className="text-2xl">🐕</span>
                </div>
              )}
            </div>
            <label className="flex-1">
              <div className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium cursor-pointer text-center transition-all">
                <Upload className="inline w-4 h-4 mr-1" />
                {uploading ? "A carregar..." : "Foto"}
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
          </div>

          {/* Nome */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Nome *</label>
            <Input
              placeholder="Ex: Max"
              value={dog.dog_name}
              onChange={(e) => setDog(prev => ({ ...prev, dog_name: e.target.value }))}
              className="h-10"
            />
          </div>

          {/* Raça */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Raça *</label>
            <Input
              placeholder="Ex: Golden Retriever"
              value={dog.dog_breed}
              onChange={(e) => setDog(prev => ({ ...prev, dog_breed: e.target.value }))}
              className="h-10"
            />
          </div>

          {/* Idade */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Idade (anos)</label>
            <Input
              type="number"
              placeholder="Ex: 3"
              value={dog.dog_age}
              onChange={(e) => setDog(prev => ({ ...prev, dog_age: parseFloat(e.target.value) || "" }))}
              className="h-10"
            />
          </div>

          {/* Tamanho */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Tamanho</label>
            <div className="grid grid-cols-2 gap-2">
              {DOG_SIZES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setDog(prev => ({ ...prev, dog_size: s.value }))}
                  className={`p-2 rounded-lg border-2 text-left transition-all text-sm ${
                    dog.dog_size === s.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-bold text-slate-900">{s.label}</p>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Sobre o cão</label>
            <Textarea
              placeholder="Personalidade, hábitos..."
              value={dog.bio}
              onChange={(e) => setDog(prev => ({ ...prev, bio: e.target.value }))}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Necessidades especiais */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Necessidades especiais</label>
            <Textarea
              placeholder="Alergias, medicações, comportamento..."
              value={dog.special_needs}
              onChange={(e) => setDog(prev => ({ ...prev, special_needs: e.target.value }))}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? "A guardar..." : "Registar Cão"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}