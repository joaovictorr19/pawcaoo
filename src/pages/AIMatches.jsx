import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Dog, Settings, MapPin, Euro, Clock } from "lucide-react";
import AIMatchSuggestions from "@/components/matching/AIMatchSuggestions";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function AIMatches() {
  const { language } = useLanguage();
  const [selectedDog, setSelectedDog] = React.useState(null);
  const [preferences, setPreferences] = React.useState({
    preferred_time: [],
    location: '',
    max_price: 50,
    priority_factors: ['experience', 'rating', 'specialization'],
    special_requirements: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dogs } = useQuery({
    queryKey: ['userDogs'],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.DogProfile.filter({ owner_email: user.email });
    },
    enabled: !!user,
  });

  const selectedDogProfile = dogs?.find(d => d.id === selectedDog);

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-lg border border-white/40 rounded-2xl px-6 py-3 shadow-xl mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Matches Inteligentes
            </h1>
          </div>
          <p className="text-lg text-gray-700 font-medium max-w-2xl mx-auto">
            Encontre o passeador perfeito com o poder da Inteligência Artificial
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Preferences Panel */}
          <div className="lg:col-span-1">
            <Card className="glass-panel border-0 shadow-xl sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dog Selection */}
                <div>
                  <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Dog className="w-4 h-4" />
                    Selecione o Cão
                  </Label>
                  <Select value={selectedDog || ''} onValueChange={setSelectedDog}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cão" />
                    </SelectTrigger>
                    <SelectContent>
                      {dogs?.map((dog) => (
                        <SelectItem key={dog.id} value={dog.id}>
                          {dog.dog_name} - {dog.breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedDogProfile && (
                  <>
                    {/* Location */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Localização
                      </Label>
                      <Input
                        placeholder="Ex: Lisboa"
                        value={preferences.location}
                        onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
                      />
                    </div>

                    {/* Max Price */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Euro className="w-4 h-4" />
                        Orçamento Máximo (€/hora)
                      </Label>
                      <Input
                        type="number"
                        min="10"
                        max="100"
                        value={preferences.max_price}
                        onChange={(e) => setPreferences({ ...preferences, max_price: Number(e.target.value) })}
                      />
                    </div>

                    {/* Preferred Time */}
                    <div>
                      <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Horário Preferido
                      </Label>
                      <Select
                        value={preferences.preferred_time[0] || ''}
                        onValueChange={(val) => setPreferences({ ...preferences, preferred_time: [val] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Manhã</SelectItem>
                          <SelectItem value="afternoon">Tarde</SelectItem>
                          <SelectItem value="evening">Noite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Special Requirements */}
                    <div>
                      <Label className="text-sm font-semibold mb-2">
                        Requisitos Especiais
                      </Label>
                      <Input
                        placeholder="Ex: experiência com cães ansiosos"
                        value={preferences.special_requirements}
                        onChange={(e) => setPreferences({ ...preferences, special_requirements: e.target.value })}
                      />
                    </div>

                    {/* Dog Profile Summary */}
                    <div className="p-3 bg-purple-50 rounded-lg mt-4">
                      <h4 className="font-semibold text-sm mb-2 text-purple-900">Perfil Selecionado</h4>
                      <div className="space-y-1 text-xs text-gray-700">
                        <p><strong>Nome:</strong> {selectedDogProfile.dog_name}</p>
                        <p><strong>Raça:</strong> {selectedDogProfile.breed}</p>
                        <p><strong>Tamanho:</strong> {selectedDogProfile.size}</p>
                        <p><strong>Energia:</strong> {selectedDogProfile.energy_level || 'Normal'}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Matches Results */}
          <div className="lg:col-span-2">
            <AIMatchSuggestions 
              dogProfile={selectedDogProfile}
              preferences={preferences}
            />
          </div>
        </div>
      </div>
    </div>
  );
}