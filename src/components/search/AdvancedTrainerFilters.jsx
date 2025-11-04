import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Sliders, Calendar as CalendarIcon, Shield, Award, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdvancedTrainerFilters({ filters, onFiltersChange, onReset }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const trainingSpecialties = [
    { id: "basic_obedience", label: "Obediência Básica", icon: "🎯" },
    { id: "advanced_obedience", label: "Obediência Avançada", icon: "🏆" },
    { id: "puppy_training", label: "Treino de Filhotes", icon: "🐶" },
    { id: "behavior_modification", label: "Modificação Comportamental", icon: "🧠" },
    { id: "aggression", label: "Agressão", icon: "⚠️" },
    { id: "anxiety", label: "Ansiedade", icon: "😰" },
    { id: "socialization", label: "Socialização", icon: "👥" },
    { id: "service_dog", label: "Cão de Serviço", icon: "🦮" },
    { id: "agility", label: "Agilidade", icon: "🏃" },
    { id: "tricks", label: "Truques", icon: "🎪" }
  ];

  const methodologies = [
    { id: "positive_reinforcement", label: "Reforço Positivo", icon: "➕" },
    { id: "clicker_training", label: "Clicker Training", icon: "🔘" },
    { id: "science_based", label: "Baseado em Ciência", icon: "🔬" },
    { id: "balanced_training", label: "Treino Equilibrado", icon: "⚖️" }
  ];

  const consultationTypes = [
    { id: "in_person", label: "Presencial", icon: "👤" },
    { id: "online", label: "Online", icon: "💻" },
    { id: "hybrid", label: "Híbrido", icon: "🔄" }
  ];

  const handleSpecialtyToggle = (spec) => {
    const current = filters.specialties || [];
    const updated = current.includes(spec)
      ? current.filter(s => s !== spec)
      : [...current, spec];
    onFiltersChange({ ...filters, specialties: updated });
  };

  const handleMethodologyToggle = (method) => {
    const current = filters.methodologies || [];
    const updated = current.includes(method)
      ? current.filter(m => m !== method)
      : [...current, method];
    onFiltersChange({ ...filters, methodologies: updated });
  };

  const handleConsultationToggle = (type) => {
    const current = filters.consultationTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    onFiltersChange({ ...filters, consultationTypes: updated });
  };

  const activeFiltersCount = 
    (filters.specialties?.length || 0) +
    (filters.methodologies?.length || 0) +
    (filters.consultationTypes?.length || 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.availableDate ? 1 : 0);

  return (
    <Card className="border-0 shadow-2xl sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sliders className="w-5 h-5" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <Badge className="bg-white text-green-600 ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onReset} className="text-white hover:bg-white/20">
            <X className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Quick Filters */}
        <div className="space-y-3">
          <Label className="text-sm font-bold text-gray-900">Filtros Rápidos</Label>
          <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
            filters.verifiedOnly ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
          }`}>
            <Checkbox
              checked={filters.verifiedOnly || false}
              onCheckedChange={(checked) => onFiltersChange({ ...filters, verifiedOnly: checked })}
            />
            <div className="flex-1">
              <p className="font-semibold text-sm flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-600" />
                Apenas Certificados
              </p>
              <p className="text-xs text-gray-600">Treinadores com certificações verificadas</p>
            </div>
          </label>
        </div>

        <Separator />

        {/* Availability Date */}
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
                onSelect={(date) => {
                  setSelectedDate(date);
                  onFiltersChange({ ...filters, availableDate: date });
                }}
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        {/* Consultation Types */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Tipo de Consulta ({filters.consultationTypes?.length || 0})
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {consultationTypes.map((type) => (
              <Badge
                key={type.id}
                variant={filters.consultationTypes?.includes(type.id) ? "default" : "outline"}
                className="cursor-pointer justify-center p-3 h-auto flex-col hover:scale-105 transition-transform"
                onClick={() => handleConsultationToggle(type.id)}
              >
                <div className="text-xl mb-1">{type.icon}</div>
                <div className="text-xs font-semibold">{type.label}</div>
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Training Specialties */}
        <div>
          <Label className="text-sm font-bold mb-3 block flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            Especialidades ({filters.specialties?.length || 0})
          </Label>
          <div className="space-y-2">
            {trainingSpecialties.map((spec) => (
              <label
                key={spec.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  filters.specialties?.includes(spec.id)
                    ? 'bg-purple-50 border-2 border-purple-300'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  checked={filters.specialties?.includes(spec.id)}
                  onCheckedChange={() => handleSpecialtyToggle(spec.id)}
                />
                <span className="text-lg">{spec.icon}</span>
                <span className="text-sm font-medium">{spec.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Training Methodologies */}
        <div>
          <Label className="text-sm font-bold mb-3 block">
            🎓 Metodologias ({filters.methodologies?.length || 0})
          </Label>
          <div className="space-y-2">
            {methodologies.map((method) => (
              <label
                key={method.id}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  filters.methodologies?.includes(method.id)
                    ? 'bg-green-50 border-2 border-green-300'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Checkbox
                  checked={filters.methodologies?.includes(method.id)}
                  onCheckedChange={() => handleMethodologyToggle(method.id)}
                />
                <span className="text-lg">{method.icon}</span>
                <span className="text-sm font-medium">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* Experience & Rating */}
        <div>
          <Label className="text-sm font-bold mb-3 block">
            💼 Experiência Mínima: {filters.minExperience || 0} anos
          </Label>
          <Slider
            value={[filters.minExperience || 0]}
            onValueChange={([value]) => onFiltersChange({ ...filters, minExperience: value })}
            min={0}
            max={20}
            step={1}
          />
        </div>

        <Separator />

        <div>
          <Label className="text-sm font-bold mb-3 block">
            ⭐ Rating Mínimo: {filters.minRating || 0}
          </Label>
          <Slider
            value={[filters.minRating || 0]}
            onValueChange={([value]) => onFiltersChange({ ...filters, minRating: value })}
            min={0}
            max={5}
            step={0.5}
          />
        </div>
      </CardContent>
    </Card>
  );
}