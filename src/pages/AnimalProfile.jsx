import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Edit2, MapPin, Heart, Phone,
  AlertCircle, Award, Activity, Stethoscope, PawPrint
} from "lucide-react";
import { motion } from "framer-motion";

const animalEmojis = {
  dog: "🐕", cat: "🐱", reptile: "🦎",
  arachnid: "🕷️", rodent: "🐹", bird: "🦜"
};

const sizeLabels = {
  small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "XL"
};

export default function AnimalProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const animalId = urlParams.get('id');

  const { data: animal, isLoading } = useQuery({
    queryKey: ['animalProfile', animalId],
    queryFn: async () => {
      const animals = await base44.entities.DogProfile.filter({ id: animalId });
      return animals[0];
    },
    enabled: !!animalId,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isOwner = user?.email === animal?.owner_email;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-10 w-24 rounded-xl bg-slate-800" />
          <Skeleton className="h-52 w-full rounded-3xl bg-slate-800" />
          <Skeleton className="h-40 w-full rounded-2xl bg-slate-800" />
          <Skeleton className="h-40 w-full rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Animal não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl('Home'))} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl mt-2">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between"
        style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        {isOwner && (
          <Button
            size="sm"
            onClick={() => navigate(createPageUrl(`EditAnimalProfile?id=${animal.id}`))}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" /> Editar
          </Button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700"
        >
          <div className="p-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-600 flex-shrink-0 bg-slate-700">
              {animal.photo_url ? (
                <img src={animal.photo_url} alt={animal.dog_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  {animalEmojis[animal.animal_type] || "🐾"}
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-black text-white tracking-tighter mb-2">{animal.dog_name}</h1>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {animal.breed && (
                  <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-medium rounded-full">{animal.breed}</span>
                )}
                {animal.age && (
                  <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-medium rounded-full">{animal.age} anos</span>
                )}
                {animal.size && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/30">
                    {sizeLabels[animal.size] || animal.size}
                  </span>
                )}
              </div>
              {animal.bio && (
                <p className="text-slate-400 text-sm mt-3 leading-relaxed">{animal.bio}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 gap-4">

          {/* Informações Básicas */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-slate-400">
              <Heart className="w-4 h-4 text-pink-400" /> Informações Básicas
            </h2>
            <div className="space-y-3 text-sm">
              {animal.gender && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Sexo</span>
                  <span className="font-semibold text-white">{animal.gender === 'male' ? 'Macho' : 'Fêmea'}</span>
                </div>
              )}
              {animal.weight && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Peso</span>
                  <span className="font-semibold text-white">{animal.weight} kg</span>
                </div>
              )}
              {animal.color && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cor</span>
                  <span className="font-semibold text-white">{animal.color}</span>
                </div>
              )}
              {animal.date_of_birth && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nascimento</span>
                  <span className="font-semibold text-white">{new Date(animal.date_of_birth).toLocaleDateString('pt-PT')}</span>
                </div>
              )}
              {animal.microchip_number && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Microchip</span>
                  <span className="font-semibold text-white text-xs">{animal.microchip_number}</span>
                </div>
              )}
              {!animal.gender && !animal.weight && !animal.color && !animal.date_of_birth && !animal.microchip_number && (
                <p className="text-slate-600 text-xs">Sem informações básicas registadas.</p>
              )}
            </div>
          </motion.div>

          {/* Saúde */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-slate-400">
              <Stethoscope className="w-4 h-4 text-green-400" /> Saúde
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Vacinado</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${animal.is_vaccinated ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                  {animal.is_vaccinated ? "Sim" : "Não"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Castrado</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${animal.is_neutered ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                  {animal.is_neutered ? "Sim" : "Não"}
                </span>
              </div>
              {animal.vet_clinic_name && (
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-slate-500 block mb-1 text-xs">Veterinário</span>
                  <span className="font-semibold text-white block">{animal.vet_clinic_name}</span>
                  {animal.vet_phone && (
                    <a href={`tel:${animal.vet_phone}`} className="text-xs text-blue-400 hover:underline">{animal.vet_phone}</a>
                  )}
                </div>
              )}
              {animal.medical_conditions && (
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-slate-500 block mb-1 text-xs">Condições</span>
                  <p className="text-slate-300 text-xs leading-relaxed">{animal.medical_conditions}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Comportamento */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-slate-400">
              <Activity className="w-4 h-4 text-purple-400" /> Comportamento
            </h2>
            <div className="space-y-3 text-sm">
              {animal.energy_level && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Energia</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    animal.energy_level === 'very_high' ? 'bg-red-500/20 text-red-400' :
                    animal.energy_level === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    animal.energy_level === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>
                    {animal.energy_level === 'very_high' ? 'Muito Alta' :
                     animal.energy_level === 'high' ? 'Alta' :
                     animal.energy_level === 'normal' ? 'Normal' : 'Baixa'}
                  </span>
                </div>
              )}
              {animal.socialization && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Socialização</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    animal.socialization === 'friendly' ? 'bg-green-500/20 text-green-400' :
                    animal.socialization === 'neutral' ? 'bg-blue-500/20 text-blue-400' :
                    animal.socialization === 'shy' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {animal.socialization === 'friendly' ? 'Amigável' :
                     animal.socialization === 'neutral' ? 'Neutro' :
                     animal.socialization === 'shy' ? 'Tímido' : 'Agressivo'}
                  </span>
                </div>
              )}
              {animal.behavioral_notes && (
                <div className="pt-2 border-t border-slate-700">
                  <span className="text-slate-500 block mb-1 text-xs">Notas</span>
                  <p className="text-slate-300 text-xs leading-relaxed">{animal.behavioral_notes}</p>
                </div>
              )}
              {!animal.energy_level && !animal.socialization && !animal.behavioral_notes && (
                <p className="text-slate-600 text-xs">Sem notas de comportamento.</p>
              )}
            </div>
          </motion.div>

          {/* Morada & Contacto */}
          {(animal.pickup_address || animal.owner_phone) && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-slate-400">
                <MapPin className="w-4 h-4 text-blue-400" /> Morada & Contacto
              </h2>
              <div className="space-y-3 text-sm">
                {animal.pickup_address && (
                  <div>
                    <span className="text-slate-500 block mb-1 text-xs">Endereço de Recolha</span>
                    <span className="font-semibold text-white block">{animal.pickup_address}</span>
                    {animal.pickup_city && <span className="text-slate-500 text-xs">{animal.pickup_city}</span>}
                  </div>
                )}
                {animal.owner_phone && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                    <span className="text-slate-500 flex items-center gap-1 text-xs"><Phone className="w-3.5 h-3.5" /> Telefone</span>
                    <a href={`tel:${animal.owner_phone}`} className="font-semibold text-blue-400 hover:underline text-sm">
                      {animal.owner_phone}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Estatísticas */}
        {(animal.total_walks > 0 || animal.total_training_sessions > 0) && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest text-slate-400">
              <Award className="w-4 h-4 text-amber-400" /> Estatísticas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-slate-700/50 rounded-xl">
                <p className="text-2xl font-black text-blue-400">{animal.total_walks || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Passeios</p>
              </div>
              <div className="text-center p-3 bg-slate-700/50 rounded-xl">
                <p className="text-2xl font-black text-purple-400">{animal.total_training_sessions || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Treinos</p>
              </div>
              <div className="text-center p-3 bg-slate-700/50 rounded-xl">
                <p className="text-2xl font-black text-green-400">{animal.total_distance_km || 0}</p>
                <p className="text-xs text-slate-500 mt-1">km</p>
              </div>
              <div className="text-center p-3 bg-slate-700/50 rounded-xl">
                <p className="text-2xl font-black text-amber-400">{animal.gamification_level || 1}</p>
                <p className="text-xs text-slate-500 mt-1">Nível</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Galeria */}
        {animal.gallery_photos?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h2 className="font-bold text-slate-400 text-sm uppercase tracking-widest mb-4">Galeria</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {animal.gallery_photos.map((photo, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-700">
                  <img src={photo} alt={`${animal.dog_name} ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}