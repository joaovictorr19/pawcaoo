import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dog, Activity, HeartPulse, AlertTriangle, Syringe } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientPetsSection({ userEmail }) {
  const { language } = useLanguage();

  const { data: pets, isLoading } = useQuery({
    queryKey: ['clientPets', userEmail],
    queryFn: () => base44.entities.DogProfile.filter({ owner_email: userEmail }),
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000
  });

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  if (!pets || pets.length === 0) {
    return (
      <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center text-gray-500">
          <Dog className="w-10 h-10 mb-2 opacity-20" />
          <p className="text-sm">Nenhum pet registado para este cliente.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pets.map(pet => (
        <Card key={pet.id} className="overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors">
          <div className="h-2 bg-gradient-to-r from-blue-400 to-purple-500" />
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100 flex-shrink-0">
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.dog_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300">
                  <Dog className="w-8 h-8" />
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-800">{pet.dog_name}</CardTitle>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline" className="text-xs">{pet.breed || 'Raça não inf.'}</Badge>
                <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                  {pet.age ? `${pet.age} anos` : 'Idade não inf.'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 text-sm space-y-3">
            {/* Health & Behavior Status Grid */}
            <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                <span className="text-gray-600 text-xs">Energia:</span>
                <span className="font-medium capitalize">{pet.energy_level || 'Normal'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Syringe className="w-4 h-4 text-green-500" />
                <span className="text-gray-600 text-xs">Vacinas:</span>
                <span className={`font-medium ${pet.is_vaccinated ? 'text-green-600' : 'text-red-500'}`}>
                  {pet.is_vaccinated ? 'Em dia' : 'Pendentes'}
                </span>
              </div>
            </div>

            {/* Critical Info */}
            {(pet.medical_conditions || pet.allergies) && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-md">
                <h4 className="flex items-center gap-2 text-red-700 font-semibold text-xs mb-1">
                  <HeartPulse className="w-3.5 h-3.5" /> Atenção Médica
                </h4>
                {pet.medical_conditions && (
                  <p className="text-xs text-red-600 mb-1">
                    <span className="font-semibold">Condições:</span> {pet.medical_conditions}
                  </p>
                )}
                {pet.allergies && (
                  <p className="text-xs text-red-600">
                    <span className="font-semibold">Alergias:</span> {pet.allergies}
                  </p>
                )}
              </div>
            )}

            {/* Behavioral Notes */}
            {pet.behavioral_notes && (
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-md">
                <h4 className="flex items-center gap-2 text-amber-700 font-semibold text-xs mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Comportamento
                </h4>
                <p className="text-xs text-amber-800 italic">"{pet.behavioral_notes}"</p>
              </div>
            )}

            {/* Socialization */}
            <div className="flex gap-2 text-xs">
              <div className={`px-2 py-1 rounded border ${pet.gets_along_with?.dogs ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                🐶 Cães: {pet.gets_along_with?.dogs ? 'Sim' : 'Não'}
              </div>
              <div className={`px-2 py-1 rounded border ${pet.gets_along_with?.cats ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                🐱 Gatos: {pet.gets_along_with?.cats ? 'Sim' : 'Não'}
              </div>
              <div className={`px-2 py-1 rounded border ${pet.gets_along_with?.children ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                👶 Crianças: {pet.gets_along_with?.children ? 'Sim' : 'Não'}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}