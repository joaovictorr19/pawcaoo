import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Sliders, Calendar as CalendarIcon, Shield, Award, Clock, Star, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdvancedWalkerFilters({ filters, onFiltersChange, onReset, onClose }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const languages = ["Português", "English", "Español", "Français", "Deutsch", "Italiano"];
  
  const specializations = [
    { id: "puppies", label: "Filhotes", icon: "🐶" },
    { id: "senior_dogs", label: "Cães Idosos", icon: "🦴" },
    { id: "large_breeds", label: "Raças Grandes", icon: "🐕" },
    { id: "small_breeds", label: "Raças Pequenas", icon: "🐩" },
    { id: "reactive_dogs", label: "Cães Reativos", icon: "⚡" },
    { id: "multiple_dogs", label: "Múltiplos Cães", icon: "🐕‍🦺" },
    { id: "special_needs", label: "Necessidades Especiais", icon: "♿" },
    { id: "agility_training", label: "Treino de Agilidade", icon: "🏃" },
    { id: "behavioral_issues", label: "Problemas Comportamentais", icon: "🧠" },
    { id: "anxious_dogs", label: "Cães Ansiosos", icon: "😰" },
    { id: "high_energy", label: "Alta Energia", icon: "⚡" },
    { id: "therapy_dogs", label: "Cães de Terapia", icon: "❤️" }
  ];

  const breeds = [
    { id: "Labrador", label: "Labrador" },
    { id: "Golden Retriever", label: "Golden Retriever" },
    { id: "Pastor Alemão", label: "Pastor Alemão" },
    { id: "Bulldog", label: "Bulldog" },
    { id: "Beagle", label: "Beagle" },
    { id: "Poodle", label: "Poodle" },
    { id: "Chihuahua", label: "Chihuahua" },
    { id: "Yorkshire", label: "Yorkshire" },
    { id: "Boxer", label: "Boxer" },
    { id: "Husky", label: "Husky" },
    { id: "Dachshund", label: "Dachshund" },
    { id: "Shih Tzu", label: "Shih Tzu" },
    { id: "Mixed Breed", label: "Rafeiro / Mix" }
  ];

  const certifications = [
    { id: "pet_first_aid", label: "Primeiros Socorros Pet", icon: "🏥" },
    { id: "dog_training_certified", label: "Treinador Certificado", icon: "🎓" },
    { id: "dog_behavior_specialist", label: "Especialista em Comportamento", icon: "🧠" },
    { id: "canine_nutrition", label: "Nutrição Canina", icon: "🍖" },
    { id: "grooming_certified", label: "Grooming Certificado", icon: "✂️" },
    { id: "veterinary_assistant", label: "Assistente Veterinário", icon: "⚕️" },
    { id: "service_dog_trainer", label: "Treinador de Cães de Serviço", icon: "🦮" },
    { id: "agility_instructor", label: "Instrutor de Agilidade", icon: "🏆" }
  ];

  const serviceTypes = [
    { id: "regular_walks", label: "Passeios Regulares", icon: "🚶" },
    { id: "boarding", label: "Alojamento", icon: "🏠" },
    { id: "house_sitting", label: "Casa-Sitting", icon: "🏡" },
    { id: "drop_in", label: "Visitas Rápidas", icon: "🚪" },
    { id: "training", label: "Treino", icon: "🎓" },
    { id: "grooming", label: "Grooming", icon: "✂️" },
    { id: "pet_taxi", label: "Transporte", icon: "🚗" },
    { id: "daycare", label: "Creche", icon: "👶" }
  ];

  const timeSlots = [
    { id: "morning", label: "Manhã", time: "06:00 - 12:00", icon: "🌅" },
    { id: "afternoon", label: "Tarde", time: "12:00 - 18:00", icon: "☀️" },
    { id: "evening", label: "Noite", time: "18:00 - 22:00", icon: "🌙" },
    { id: "night", label: "Madrugada", time: "22:00 - 06:00", icon: "🌃" }
  ];

  const handleLanguageToggle = (lang) => {
    const currentLanguages = filters.languages || [];
    const newLanguages = currentLanguages.includes(lang)
      ? currentLanguages.filter(l => l !== lang)
      : [...currentLanguages, lang];
    onFiltersChange({ ...filters, languages: newLanguages });
  };

  const handleSpecializationToggle = (spec) => {
    const currentSpecs = filters.specializations || [];
    const newSpecs = currentSpecs.includes(spec)
      ? currentSpecs.filter(s => s !== spec)
      : [...currentSpecs, spec];
    onFiltersChange({ ...filters, specializations: newSpecs });
  };

  const handleBreedToggle = (breed) => {
    const currentBreeds = filters.breeds || [];
    const newBreeds = currentBreeds.includes(breed)
      ? currentBreeds.filter(b => b !== breed)
      : [...currentBreeds, breed];
    onFiltersChange({ ...filters, breeds: newBreeds });
  };

  const handleCertificationToggle = (cert) => {
    const currentCerts = filters.certifications || [];
    const newCerts = currentCerts.includes(cert)
      ? currentCerts.filter(c => c !== cert)
      : [...currentCerts, cert];
    onFiltersChange({ ...filters, certifications: newCerts });
  };

  const handleServiceToggle = (service) => {
    const currentServices = filters.serviceTypes || [];
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    onFiltersChange({ ...filters, serviceTypes: newServices });
  };

  const handleTimeSlotToggle = (slot) => {
    const currentSlots = filters.timeSlots || [];
    const newSlots = currentSlots.includes(slot)
      ? currentSlots.filter(s => s !== slot)
      : [...currentSlots, slot];
    onFiltersChange({ ...filters, timeSlots: newSlots });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    onFiltersChange({ ...filters, availableDate: date });
  };

  const activeFiltersCount = 
    (filters.languages?.length || 0) +
    (filters.specializations?.length || 0) +
    (filters.breeds?.length || 0) +
    (filters.certifications?.length || 0) +
    (filters.serviceTypes?.length || 0) +
    (filters.timeSlots?.length || 0) +
    (filters.backgroundCheck ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.instantBooking ? 1 : 0) +
    (filters.availableDate ? 1 : 0);

  return (
    <Card className="border-0 shadow-2xl sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sliders className="w-5 h-5" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <Badge className="bg-white text-purple-600 ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={onReset} className="text-white hover:bg-white/20">
              <RotateCcw className="w-4 h-4 mr-1" />
              Limpar
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 h-8 w-8">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Quick Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-600" />
            Filtros Rápidos
          </Label>
          <div className="space-y-2">
            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              filters.verifiedOnly ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
            }`}>
              <Checkbox
                id="verifiedOnly"
                checked={filters.verifiedOnly || false}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, verifiedOnly: checked })}
              />
              <div className="flex-1">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <Shield className="w-4 h-4 text-green-600" />
                  Apenas Verificados
                </p>
                <p className="text-xs text-gray-600">Profissionais com verificação completa</p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              filters.backgroundCheck ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
            }`}>
              <Checkbox
                id="backgroundCheck"
                checked={filters.backgroundCheck || false}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, backgroundCheck: checked })}
              />
              <div className="flex-1">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Background Check
                </p>
                <p className="text-xs text-gray-600">Verificação de antecedentes</p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              filters.instantBooking ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
            }`}>
              <Checkbox
                id="instantBooking"
                checked={filters.instantBooking || false}
                onCheckedChange={(checked) => onFiltersChange({ ...filters, instantBooking: checked })}
              />
              <div className="flex-1">
                <p className="font-semibold text-sm flex items-center gap-1">
                  ⚡ Reserva Instantânea
                </p>
                <p className="text-xs text-gray-600">Confirma sem aprovação manual</p>
              </div>
            </label>
          </div>
        </div>

        <Separator />

        {/* Availability Date Filter */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-purple-600" />
            Disponível em Data Específica
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: ptBR }) : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
          {selectedDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDate(null);
                onFiltersChange({ ...filters, availableDate: null });
              }}
              className="w-full mt-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar data
            </Button>
          )}
        </div>

        <Separator />

        {/* Time Slots */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Horários Disponíveis ({filters.timeSlots?.length || 0})
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => handleTimeSlotToggle(slot.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  filters.timeSlots?.includes(slot.id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-lg mb-1">{slot.icon}</div>
                <div className="font-semibold text-sm">{slot.label}</div>
                <div className="text-xs text-gray-600">{slot.time}</div>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Service Types */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center gap-2">
            🐾 Serviços Oferecidos ({filters.serviceTypes?.length || 0})
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {serviceTypes.map((service) => (
              <label
                key={service.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  filters.serviceTypes?.includes(service.id)
                    ? 'bg-blue-50 border-2 border-blue-300'
                    : 'hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <Checkbox
                  id={`svc-${service.id}`}
                  checked={filters.serviceTypes?.includes(service.id)}
                  onCheckedChange={() => handleServiceToggle(service.id)}
                />
                <span className="text-lg">{service.icon}</span>
                <span className="text-xs font-semibold">{service.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Specializations */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            Especializações ({filters.specializations?.length || 0})
          </Label>
          <div className="space-y-2">
            {specializations.map((spec) => (
              <label
                key={spec.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  filters.specializations?.includes(spec.id)
                    ? 'bg-purple-50 border-2 border-purple-300'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  id={`spec-${spec.id}`}
                  checked={filters.specializations?.includes(spec.id)}
                  onCheckedChange={() => handleSpecializationToggle(spec.id)}
                />
                <span className="text-lg">{spec.icon}</span>
                <span className="text-sm font-medium">{spec.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Breeds */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center gap-2">
            <div className="w-4 h-4 flex items-center justify-center text-orange-600">🐕</div>
            Experiência com Raças ({filters.breeds?.length || 0})
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {breeds.map((breed) => (
              <label
                key={breed.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                  filters.breeds?.includes(breed.id)
                    ? 'bg-orange-50 border-orange-300'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  id={`breed-${breed.id}`}
                  checked={filters.breeds?.includes(breed.id)}
                  onCheckedChange={() => handleBreedToggle(breed.id)}
                  className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                />
                <span className="text-xs font-medium">{breed.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Certifications */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-600" />
            Certificações ({filters.certifications?.length || 0})
          </Label>
          <div className="space-y-2">
            {certifications.map((cert) => (
              <label
                key={cert.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  filters.certifications?.includes(cert.id)
                    ? 'bg-yellow-50 border-2 border-yellow-300'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  id={`cert-${cert.id}`}
                  checked={filters.certifications?.includes(cert.id)}
                  onCheckedChange={() => handleCertificationToggle(cert.id)}
                />
                <span className="text-lg">{cert.icon}</span>
                <span className="text-sm font-medium">{cert.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Languages */}
        <div>
          <Label className="text-sm font-bold mb-3 block">
            🌐 Idiomas ({filters.languages?.length || 0})
          </Label>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <Badge
                key={lang}
                variant={filters.languages?.includes(lang) ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleLanguageToggle(lang)}
              >
                {lang}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Distance Radius */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center justify-between">
            <span className="flex items-center gap-2">
              📍 Raio de Distância
            </span>
            <span className="text-purple-600">{filters.radius}km</span>
          </Label>
          <Slider
            value={[filters.radius || 50]}
            onValueChange={([value]) => onFiltersChange({ ...filters, radius: value })}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>1km</span>
            <span>50km</span>
            <span>100km</span>
          </div>
        </div>

        <Separator />

        {/* Experience */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center justify-between">
            <span>💼 Experiência Mínima</span>
            <span className="text-green-600">{filters.minExperience || 0} anos</span>
          </Label>
          <Slider
            value={[filters.minExperience || 0]}
            onValueChange={([value]) => onFiltersChange({ ...filters, minExperience: value })}
            min={0}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Iniciante</span>
            <span>Experiente (10+)</span>
            <span>Veterano (20+)</span>
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-600" />
              Rating Mínimo
            </span>
            <span className="text-yellow-600">{filters.minRating || 0}⭐</span>
          </Label>
          <Slider
            value={[filters.minRating || 0]}
            onValueChange={([value]) => onFiltersChange({ ...filters, minRating: value })}
            min={0}
            max={5}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Qualquer</span>
            <span>3.0⭐</span>
            <span>4.0⭐</span>
            <span>5.0⭐</span>
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <Label className="text-sm font-bold mb-3 block">
            💰 Preço por Hora: €{filters.minPrice || 0} - €{filters.maxPrice || 100}
          </Label>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Mínimo</Label>
              <Input
                type="number"
                value={filters.minPrice || 0}
                onChange={(e) => onFiltersChange({ ...filters, minPrice: parseInt(e.target.value) || 0 })}
                min={0}
                max={filters.maxPrice || 100}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">Máximo</Label>
              <Input
                type="number"
                value={filters.maxPrice || 100}
                onChange={(e) => onFiltersChange({ ...filters, maxPrice: parseInt(e.target.value) || 100 })}
                min={filters.minPrice || 0}
                max={200}
                className="h-9"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <>
            <Separator />
            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
              <Label className="text-xs font-bold text-purple-900 mb-2 block flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                Filtros Ativos ({activeFiltersCount}):
              </Label>
              <div className="flex flex-wrap gap-1">
                {filters.languages?.map(lang => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    🌐 {lang}
                  </Badge>
                ))}
                {filters.specializations?.map(spec => {
                  const specData = specializations.find(s => s.id === spec);
                  return (
                    <Badge key={spec} variant="secondary" className="text-xs">
                      {specData?.icon} {specData?.label}
                    </Badge>
                  );
                })}
                {filters.breeds?.map(breed => (
                  <Badge key={breed} variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                    🐕 {breed}
                  </Badge>
                ))}
                {filters.certifications?.map(cert => {
                  const certData = certifications.find(c => c.id === cert);
                  return (
                    <Badge key={cert} variant="secondary" className="text-xs">
                      {certData?.icon} {certData?.label}
                    </Badge>
                  );
                })}
                {filters.serviceTypes?.map(service => {
                  const serviceData = serviceTypes.find(s => s.id === service);
                  return (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {serviceData?.icon} {serviceData?.label}
                    </Badge>
                  );
                })}
                {filters.timeSlots?.map(slot => {
                  const slotData = timeSlots.find(s => s.id === slot);
                  return (
                    <Badge key={slot} variant="secondary" className="text-xs">
                      {slotData?.icon} {slotData?.label}
                    </Badge>
                  );
                })}
                {filters.backgroundCheck && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Background Check
                  </Badge>
                )}
                {filters.verifiedOnly && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    Verificados
                  </Badge>
                )}
                {filters.availableDate && (
                  <Badge variant="secondary" className="text-xs">
                    📅 {format(filters.availableDate, "dd/MM")}
                  </Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}