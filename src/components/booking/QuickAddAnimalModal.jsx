import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PawPrint, Upload, Camera, X } from "lucide-react";

/**
 * Modal rápido para cadastrar um animal durante o fluxo de reserva.
 * Campos essenciais para o profissional receber por e-mail.
 */
export default function QuickAddAnimalModal({ open, onClose, user, onCreated }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    dog_name: "",
    animal_type: "dog",
    breed: "",
    age: "",
    size: "medium",
    gender: "male",
    weight: "",
    is_vaccinated: true,
    is_neutered: false,
    medical_conditions: "",
    behavioral_notes: "",
    energy_level: "normal",
    socialization: "friendly",
    owner_phone: user?.phone || "",
    default_pickup_address: "",
    photo_url: "",
    special_care_notes: "",
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("photo_url", file_url);
      toast.success("Foto carregada!");
    } catch { toast.error("Erro ao carregar foto"); }
    finally { setUploading(false); }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.dog_name.trim()) throw new Error("Nome do animal é obrigatório");
      if (!form.owner_phone.trim()) throw new Error("Telefone do dono é obrigatório");
      if (!form.default_pickup_address.trim()) throw new Error("Endereço de recolha é obrigatório");

      return base44.entities.DogProfile.create({
        ...form,
        owner_email: user.email,
        age: form.age ? parseInt(form.age) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
      });
    },
    onSuccess: (newDog) => {
      queryClient.invalidateQueries({ queryKey: ['myDogs'] });
      toast.success(`${form.dog_name} adicionado com sucesso!`);
      onCreated(newDog);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white p-0 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-4 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg font-bold text-white">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <PawPrint className="w-5 h-5" />
              </div>
              Adicionar Animal
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-white/80 mt-1">Preencha os dados essenciais. Estes serão enviados ao profissional.</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Foto */}
          <div className="flex items-center gap-4">
            {form.photo_url ? (
              <div className="relative">
                <img src={form.photo_url} alt="pet" className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-200" />
                <button onClick={() => set("photo_url", "")}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer w-16 h-16 border-2 border-dashed border-orange-200 rounded-2xl flex flex-col items-center justify-center bg-orange-50 hover:bg-orange-100 transition-colors">
                <Camera className="w-5 h-5 text-orange-400" />
                <span className="text-[9px] text-orange-400 mt-0.5">Foto</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            )}
            <div className="flex-1 space-y-2">
              <Input value={form.dog_name} onChange={e => set("dog_name", e.target.value)}
                placeholder="Nome do animal *" className="h-10 rounded-xl border-slate-200 text-sm" />
              <Input value={form.breed} onChange={e => set("breed", e.target.value)}
                placeholder="Raça / Espécie" className="h-10 rounded-xl border-slate-200 text-sm" />
            </div>
          </div>

          {/* Tipo e tamanho */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "dog", e: "🐕" }, { v: "cat", e: "🐱" }, { v: "reptile", e: "🦎" },
              { v: "rodent", e: "🐹" }, { v: "bird", e: "🦜" }, { v: "arachnid", e: "🕷️" },
            ].map(({ v, e }) => (
              <button key={v} type="button" onClick={() => set("animal_type", v)}
                className={`p-2 rounded-xl border text-sm transition-all ${form.animal_type === v ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-200'}`}>
                {e}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Tamanho</Label>
              <Select value={form.size} onValueChange={v => set("size", v)}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequeno</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                  <SelectItem value="extra_large">XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Sexo</Label>
              <Select value={form.gender} onValueChange={v => set("gender", v)}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">♂ Macho</SelectItem>
                  <SelectItem value="female">♀ Fêmea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Idade (anos)</Label>
              <Input type="number" value={form.age} onChange={e => set("age", e.target.value)}
                placeholder="Ex: 3" className="h-10 rounded-xl border-slate-200 text-sm" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Peso (kg)</Label>
              <Input type="number" value={form.weight} onChange={e => set("weight", e.target.value)}
                placeholder="Ex: 12" className="h-10 rounded-xl border-slate-200 text-sm" />
            </div>
          </div>

          {/* Saúde rápida */}
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_vaccinated} onChange={e => set("is_vaccinated", e.target.checked)}
                className="w-4 h-4 accent-orange-500" />
              <span className="text-sm text-slate-700">Vacinado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_neutered} onChange={e => set("is_neutered", e.target.checked)}
                className="w-4 h-4 accent-orange-500" />
              <span className="text-sm text-slate-700">Castrado</span>
            </label>
          </div>

          {/* Comportamento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Energia</Label>
              <Select value={form.energy_level} onValueChange={v => set("energy_level", v)}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="very_high">Muito Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600 mb-1 block">Socialização</Label>
              <Select value={form.socialization} onValueChange={v => set("socialization", v)}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Amigável</SelectItem>
                  <SelectItem value="neutral">Neutro</SelectItem>
                  <SelectItem value="shy">Tímido</SelectItem>
                  <SelectItem value="aggressive">Agressivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Condições médicas */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1 block">Condições médicas / Alergias</Label>
            <Textarea value={form.medical_conditions} onChange={e => set("medical_conditions", e.target.value)}
              placeholder="Ex: Alergia a frango, epilepsia controlada..." rows={2}
              className="rounded-xl border-slate-200 text-sm resize-none" />
          </div>

          {/* Notas comportamentais */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1 block">Notas para o profissional</Label>
            <Textarea value={form.behavioral_notes} onChange={e => set("behavioral_notes", e.target.value)}
              placeholder="Ex: Não gosta de homens, puxa muito na trela..." rows={2}
              className="rounded-xl border-slate-200 text-sm resize-none" />
          </div>

          <hr className="border-slate-100" />

          {/* Contacto e morada — obrigatórios */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1 block">Telefone do Dono *</Label>
            <Input type="tel" value={form.owner_phone} onChange={e => set("owner_phone", e.target.value)}
              placeholder="+351 912 345 678" className="h-10 rounded-xl border-slate-200 text-sm" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600 mb-1 block">Endereço de Recolha *</Label>
            <Input value={form.default_pickup_address} onChange={e => set("default_pickup_address", e.target.value)}
              placeholder="Rua, Número, Cidade" className="h-10 rounded-xl border-slate-200 text-sm" />
            <p className="text-[10px] text-slate-400 mt-1">Será usado automaticamente em futuras reservas</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl border-slate-200 text-slate-600">
              Cancelar
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
              className="flex-1 h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold">
              {createMutation.isPending ? "A guardar..." : "Guardar Animal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}