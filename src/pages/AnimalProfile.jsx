import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Edit2, MapPin, Heart, Phone,
  AlertCircle, Award, Activity, Stethoscope, PawPrint,
  Shield, Zap, Users, Dog, Calendar, Weight
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import HealthDiary from "@/components/animals/HealthDiary";
import { motion } from "framer-motion";

const animalEmojis = {
  dog: "🐕", cat: "🐱", reptile: "🦎",
  arachnid: "🕷️", rodent: "🐹", bird: "🦜"
};
const sizeLabels = { small: "Pequeno", medium: "Médio", large: "Grande", extra_large: "XL" };
const energyConfig = {
  very_high: { label: "Muito Alta", cls: "bg-red-50 text-red-600 border-red-200" },
  high:      { label: "Alta",       cls: "bg-orange-50 text-orange-600 border-orange-200" },
  normal:    { label: "Normal",     cls: "bg-blue-50 text-blue-600 border-blue-200" },
  low:       { label: "Baixa",      cls: "bg-slate-50 text-slate-500 border-slate-200" },
};
const socConfig = {
  friendly:   { label: "Amigável",  cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  neutral:    { label: "Neutro",    cls: "bg-blue-50 text-blue-600 border-blue-200" },
  shy:        { label: "Tímido",    cls: "bg-yellow-50 text-yellow-600 border-yellow-200" },
  aggressive: { label: "Agressivo", cls: "bg-red-50 text-red-600 border-red-200" },
};

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-slate-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function SectionCard({ icon, title, color, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`px-4 py-3 flex items-center gap-2 border-b border-slate-100 ${color}`}>
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-4 py-2">{children}</div>
    </motion.div>
  );
}

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
    queryFn: () => getCurrentUser(),
  });

  const isOwner = user?.email === animal?.owner_email;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-2xl mx-auto space-y-3 pt-4">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-700 mb-2">Animal não encontrado</h2>
          <Button onClick={() => navigate(createPageUrl('Home'))} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl mt-2">
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  const energy = energyConfig[animal.energy_level];
  const soc = socConfig[animal.socialization];

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        {isOwner && (
          <Button size="sm" onClick={() => navigate(createPageUrl(`EditAnimalProfile?id=${animal.id}`))}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs gap-1.5 h-8">
            <Edit2 className="w-3.5 h-3.5" /> Editar
          </Button>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── Hero Card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Cover band */}
          <div className="h-20 bg-gradient-to-r from-orange-100 to-amber-50" />
          <div className="px-5 pb-5 -mt-10">
            <div className="flex items-end gap-4 mb-3">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-orange-50 flex-shrink-0">
                {animal.photo_url
                  ? <img src={animal.photo_url} alt={animal.dog_name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-4xl">{animalEmojis[animal.animal_type] || "🐾"}</div>
                }
              </div>
              <div className="pb-1 flex-1">
                <h1 className="text-xl font-bold text-slate-900">{animal.dog_name}</h1>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {animal.breed && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{animal.breed}</span>}
                  {animal.age && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{animal.age} anos</span>}
                  {animal.size && <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">{sizeLabels[animal.size]}</span>}
                  {animal.is_vaccinated && <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full">✓ Vacinado</span>}
                  {animal.is_neutered && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">✓ Castrado</span>}
                </div>
              </div>
            </div>
            {animal.bio && <p className="text-sm text-slate-500 leading-relaxed">{animal.bio}</p>}
          </div>
        </motion.div>

        {/* ── Stats bar ── */}
        {(animal.total_walks > 0 || animal.total_training_sessions > 0 || animal.total_distance_km > 0) && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: animal.total_walks || 0, label: "Passeios", color: "text-orange-500" },
              { val: animal.total_training_sessions || 0, label: "Treinos", color: "text-blue-500" },
              { val: `${animal.total_distance_km || 0} km`, label: "Distância", color: "text-emerald-500" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-3 text-center shadow-sm">
                <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-2 w-full bg-white border border-slate-200 rounded-xl h-10 shadow-sm mb-4">
            <TabsTrigger value="overview" className="rounded-lg text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white">Visão Geral</TabsTrigger>
            <TabsTrigger value="health" className="rounded-lg text-sm data-[state=active]:bg-orange-500 data-[state=active]:text-white">Diário de Saúde</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">

            {/* Informações Básicas */}
            <SectionCard icon={<Heart className="w-3.5 h-3.5 text-pink-500" />} title="Informações Básicas" color="text-pink-600">
              <InfoRow label="Sexo" value={animal.gender === 'male' ? '♂ Macho' : animal.gender === 'female' ? '♀ Fêmea' : null} />
              <InfoRow label="Peso" value={animal.weight ? `${animal.weight} kg` : null} />
              <InfoRow label="Cor" value={animal.color} />
              <InfoRow label="Nascimento" value={animal.date_of_birth ? new Date(animal.date_of_birth).toLocaleDateString('pt-PT') : null} />
              <InfoRow label="Microchip" value={animal.microchip_number} />
              {!animal.gender && !animal.weight && !animal.color && !animal.date_of_birth && !animal.microchip_number && (
                <p className="text-xs text-slate-400 py-3 text-center">Sem informações básicas — <button onClick={() => navigate(createPageUrl(`EditAnimalProfile?id=${animal.id}`))} className="text-orange-500 underline">adicionar</button></p>
              )}
            </SectionCard>

            {/* Saúde */}
            <SectionCard icon={<Stethoscope className="w-3.5 h-3.5 text-emerald-500" />} title="Saúde" color="text-emerald-600">
              <div className="flex gap-2 pt-2 pb-2">
                <span className={`text-xs border px-2.5 py-1 rounded-full font-medium ${animal.is_vaccinated ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                  {animal.is_vaccinated ? '✓ Vacinado' : '✗ Não vacinado'}
                </span>
                <span className={`text-xs border px-2.5 py-1 rounded-full font-medium ${animal.is_neutered ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                  {animal.is_neutered ? '✓ Castrado' : '✗ Não castrado'}
                </span>
              </div>
              <InfoRow label="Veterinário" value={animal.vet_name || animal.vet_clinic_name} />
              <InfoRow label="Tel. Vet." value={animal.vet_phone} />
              {animal.medical_conditions && (
                <div className="py-2 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 mb-1 font-medium uppercase tracking-wide">Condições Médicas</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{animal.medical_conditions}</p>
                </div>
              )}
              {animal.allergies && (
                <div className="py-2 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 mb-1 font-medium uppercase tracking-wide">Alergias</p>
                  <p className="text-sm text-slate-700">{animal.allergies}</p>
                </div>
              )}
            </SectionCard>

            {/* Comportamento */}
            <SectionCard icon={<Activity className="w-3.5 h-3.5 text-purple-500" />} title="Comportamento" color="text-purple-600">
              <div className="flex gap-2 pt-2 pb-2 flex-wrap">
                {energy && <span className={`text-xs border px-2.5 py-1 rounded-full font-medium ${energy.cls}`}>⚡ Energia: {energy.label}</span>}
                {soc && <span className={`text-xs border px-2.5 py-1 rounded-full font-medium ${soc.cls}`}>🤝 {soc.label}</span>}
              </div>
              {animal.gets_along_with && (
                <div className="flex gap-1.5 flex-wrap pb-2">
                  {animal.gets_along_with.dogs && <span className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">🐕 Cães</span>}
                  {animal.gets_along_with.cats && <span className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">🐱 Gatos</span>}
                  {animal.gets_along_with.children && <span className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">👶 Crianças</span>}
                  {animal.gets_along_with.strangers && <span className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">👥 Estranhos</span>}
                </div>
              )}

              {/* Reatividades — destaque visual */}
              {(animal.reactive_to_dogs || animal.reactive_to_people || animal.reactive_to_noises) && (
                <div className="border-t border-slate-50 pt-2 pb-1 space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">⚠️ Reatividades</p>
                  <div className="flex flex-wrap gap-1.5">
                    {animal.reactive_to_dogs && <span className="text-xs bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full font-medium">⚠️ Reativo a cães</span>}
                    {animal.reactive_to_people && <span className="text-xs bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full font-medium">⚠️ Reativo a pessoas</span>}
                    {animal.reactive_to_noises && <span className="text-xs bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full font-medium">⚠️ Reativo a barulhos</span>}
                  </div>
                </div>
              )}

              {animal.behavioral_notes && (
                <div className="py-2 border-t border-slate-50">
                  <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Notas de Comportamento</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{animal.behavioral_notes}</p>
                </div>
              )}

              {animal.other_observations && (
                <div className="py-2 border-t border-slate-50">
                  <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">📝 Outras Observações</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{animal.other_observations}</p>
                </div>
              )}

              {isOwner && !animal.reactive_to_dogs && !animal.reactive_to_people && !animal.reactive_to_noises && !animal.behavioral_notes && !animal.other_observations && (
                <p className="text-xs text-slate-400 py-2 text-center">Sem notas — <button onClick={() => navigate(createPageUrl(`EditAnimalProfile?id=${animal.id}`))} className="text-orange-500 underline">adicionar</button></p>
              )}
            </SectionCard>

            {/* Emergência */}
            {(animal.emergency_contact_name || animal.emergency_contact_phone) && (
              <SectionCard icon={<Shield className="w-3.5 h-3.5 text-red-500" />} title="Contacto de Emergência" color="text-red-600">
                <InfoRow label="Nome" value={animal.emergency_contact_name} />
                <InfoRow label="Relação" value={animal.emergency_contact_relationship} />
                <InfoRow label="Telefone" value={animal.emergency_contact_phone} />
              </SectionCard>
            )}

            {/* Morada & Contacto */}
            {(animal.pickup_address || animal.default_pickup_address || animal.owner_phone) && (
              <SectionCard icon={<MapPin className="w-3.5 h-3.5 text-blue-500" />} title="Recolha & Contacto" color="text-blue-600">
                <InfoRow label="Endereço de Recolha" value={animal.pickup_address || animal.default_pickup_address} />
                <InfoRow label="Telefone do Dono" value={animal.owner_phone} />
              </SectionCard>
            )}

            {/* Galeria */}
            {animal.gallery_photos?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Galeria</h3>
                <div className="grid grid-cols-3 gap-2">
                  {animal.gallery_photos.map((photo, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                      <img src={photo} alt={`${animal.dog_name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </TabsContent>

          <TabsContent value="health">
            <HealthDiary animal={animal} isOwner={isOwner} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}