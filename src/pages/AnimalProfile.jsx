import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Edit2, 
  MapPin, 
  Calendar, 
  Weight, 
  Ruler, 
  Heart,
  Phone,
  AlertCircle,
  Award,
  Activity,
  Stethoscope
} from "lucide-react";
import { motion } from "framer-motion";

const animalEmojis = {
  dog: "🐕",
  cat: "🐱",
  reptile: "🦎",
  arachnid: "🕷️",
  rodent: "🐹",
  bird: "🦜"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-64 w-full rounded-3xl mb-6" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Animal não encontrado</h2>
            <Button onClick={() => navigate(createPageUrl('Home'))}>Voltar ao Início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-12">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          {isOwner && (
            <Button
              size="sm"
              onClick={() => navigate(createPageUrl(`EditAnimalProfile?id=${animal.id}`))}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            {/* Photo */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white flex-shrink-0">
              {animal.photo_url ? (
                <img src={animal.photo_url} alt={animal.dog_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-orange-200 to-pink-200">
                  {animalEmojis[animal.animal_type] || "🐾"}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{animal.dog_name}</h1>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
                {animal.breed && (
                  <Badge className="bg-white/20 text-white border-0">{animal.breed}</Badge>
                )}
                {animal.age && (
                  <Badge className="bg-white/20 text-white border-0">{animal.age} anos</Badge>
                )}
                {animal.size && (
                  <Badge className="bg-white/20 text-white border-0 capitalize">{animal.size}</Badge>
                )}
              </div>
              {animal.bio && (
                <p className="text-sm text-white/90 max-w-lg">{animal.bio}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Informações Básicas
              </h2>
              <div className="space-y-3 text-sm">
                {animal.gender && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sexo:</span>
                    <span className="font-semibold text-gray-900">
                      {animal.gender === 'male' ? 'Macho' : 'Fêmea'}
                    </span>
                  </div>
                )}
                {animal.weight && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Peso:</span>
                    <span className="font-semibold text-gray-900">{animal.weight} kg</span>
                  </div>
                )}
                {animal.color && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Cor:</span>
                    <span className="font-semibold text-gray-900">{animal.color}</span>
                  </div>
                )}
                {animal.date_of_birth && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Nascimento:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(animal.date_of_birth).toLocaleDateString('pt-PT')}
                    </span>
                  </div>
                )}
                {animal.microchip_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Microchip:</span>
                    <span className="font-semibold text-gray-900 text-xs">{animal.microchip_number}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Endereço e Contato */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Endereço & Contato
              </h2>
              <div className="space-y-3 text-sm">
                {animal.pickup_address && (
                  <div>
                    <span className="text-gray-600 block mb-1">Endereço de Recolha:</span>
                    <span className="font-semibold text-gray-900 block">{animal.pickup_address}</span>
                    {animal.pickup_city && (
                      <span className="text-gray-500 text-xs">{animal.pickup_city}</span>
                    )}
                  </div>
                )}
                {animal.owner_phone && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      Telefone:
                    </span>
                    <a href={`tel:${animal.owner_phone}`} className="font-semibold text-blue-600 hover:underline">
                      {animal.owner_phone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Saúde */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-green-500" />
                Saúde
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Vacinado:</span>
                  <Badge className={animal.is_vaccinated ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {animal.is_vaccinated ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Castrado:</span>
                  <Badge className={animal.is_neutered ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {animal.is_neutered ? "Sim" : "Não"}
                  </Badge>
                </div>
                {animal.vet_clinic_name && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-600 block mb-1">Veterinário:</span>
                    <span className="font-semibold text-gray-900 block">{animal.vet_clinic_name}</span>
                    {animal.vet_phone && (
                      <a href={`tel:${animal.vet_phone}`} className="text-xs text-blue-600 hover:underline">
                        {animal.vet_phone}
                      </a>
                    )}
                  </div>
                )}
                {animal.medical_conditions && (
                  <div className="pt-2">
                    <span className="text-gray-600 block mb-1">Condições:</span>
                    <span className="text-gray-700 text-xs">{animal.medical_conditions}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comportamento */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Comportamento
              </h2>
              <div className="space-y-3 text-sm">
                {animal.energy_level && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Energia:</span>
                    <Badge className={
                      animal.energy_level === 'very_high' ? 'bg-red-100 text-red-800' :
                      animal.energy_level === 'high' ? 'bg-orange-100 text-orange-800' :
                      animal.energy_level === 'normal' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {animal.energy_level === 'very_high' ? 'Muito Alta' :
                       animal.energy_level === 'high' ? 'Alta' :
                       animal.energy_level === 'normal' ? 'Normal' : 'Baixa'}
                    </Badge>
                  </div>
                )}
                {animal.socialization && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Socialização:</span>
                    <Badge className={
                      animal.socialization === 'friendly' ? 'bg-green-100 text-green-800' :
                      animal.socialization === 'neutral' ? 'bg-blue-100 text-blue-800' :
                      animal.socialization === 'shy' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {animal.socialization === 'friendly' ? 'Amigável' :
                       animal.socialization === 'neutral' ? 'Neutro' :
                       animal.socialization === 'shy' ? 'Tímido' : 'Agressivo'}
                    </Badge>
                  </div>
                )}
                {animal.behavioral_notes && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-gray-600 block mb-1">Notas:</span>
                    <p className="text-gray-700 text-xs leading-relaxed">{animal.behavioral_notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        {(animal.total_walks > 0 || animal.total_training_sessions > 0) && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Estatísticas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">{animal.total_walks || 0}</p>
                  <p className="text-xs text-gray-600 mt-1">Passeios</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <p className="text-2xl font-bold text-purple-600">{animal.total_training_sessions || 0}</p>
                  <p className="text-xs text-gray-600 mt-1">Treinos</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">{animal.total_distance_km || 0}</p>
                  <p className="text-xs text-gray-600 mt-1">km Percorridos</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-2xl font-bold text-amber-600">{animal.gamification_level || 1}</p>
                  <p className="text-xs text-gray-600 mt-1">Nível</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gallery */}
        {animal.gallery_photos?.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg text-gray-900 mb-4">Galeria</h2>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {animal.gallery_photos.map((photo, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden shadow-md">
                    <img src={photo} alt={`${animal.dog_name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}