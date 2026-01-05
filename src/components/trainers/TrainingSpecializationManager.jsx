import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GraduationCap, Award } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AVAILABLE_SPECIALIZATIONS = [
  { 
    id: "positive_reinforcement", 
    name: "Reforço Positivo",
    icon: "➕",
    description: "Técnicas baseadas em recompensas para moldar comportamentos desejados"
  },
  { 
    id: "agility_training", 
    name: "Treino de Agilidade",
    icon: "🏃",
    description: "Treino para competições de agilidade e coordenação"
  },
  { 
    id: "behavioral_correction", 
    name: "Correção Comportamental",
    icon: "🧠",
    description: "Modificação de comportamentos indesejados através de técnicas científicas"
  },
  { 
    id: "puppy_socialization", 
    name: "Socialização de Cachorros",
    icon: "🐶",
    description: "Exposição controlada a ambientes, pessoas e outros cães"
  },
  { 
    id: "obedience_training", 
    name: "Treino de Obediência",
    icon: "🎯",
    description: "Comandos básicos e avançados para controlo do cão"
  },
  { 
    id: "service_dog_training", 
    name: "Treino de Cães de Serviço",
    icon: "🦮",
    description: "Preparação de cães para assistência a pessoas com deficiência"
  },
  { 
    id: "anxiety_management", 
    name: "Gestão de Ansiedade",
    icon: "😰",
    description: "Técnicas para reduzir ansiedade de separação e medo"
  },
  { 
    id: "aggression_rehabilitation", 
    name: "Reabilitação de Agressão",
    icon: "⚠️",
    description: "Trabalho especializado com cães agressivos ou reativos"
  },
  { 
    id: "clicker_training", 
    name: "Clicker Training",
    icon: "🔘",
    description: "Treino de precisão usando clicker para marcar comportamentos"
  },
  { 
    id: "protection_training", 
    name: "Treino de Proteção",
    icon: "🛡️",
    description: "Treino para cães de guarda e proteção profissional"
  }
];

export default function TrainingSpecializationManager({ specializations = [], onChange }) {
  const [expandedId, setExpandedId] = useState(null);

  // CRITICAL: Ensure onChange always receives an array
  React.useEffect(() => {
    console.log('🎓 TrainingSpecializationManager mounted with:', specializations);
    if (!Array.isArray(specializations)) {
      console.warn('⚠️ Specializations is not an array, fixing...');
      onChange([]);
    }
  }, []);

  const handleToggle = (spec) => {
    console.log('🎓 Toggle specialization:', spec.id, 'Current:', specializations);
    const exists = specializations?.find(s => s.specialty_id === spec.id);
    
    if (exists) {
      const updated = (specializations || []).filter(s => s.specialty_id !== spec.id);
      console.log('✅ Removing spec, new list:', updated);
      onChange(updated);
      if (expandedId === spec.id) setExpandedId(null);
    } else {
      const newSpec = {
        specialty_id: spec.id,
        specialty_name: spec.name,
        description: spec.description,
        years_experience: 0,
        certifications: []
      };
      const updated = [...(specializations || []), newSpec];
      console.log('✅ Adding spec, new list:', updated);
      onChange(updated);
      setExpandedId(spec.id);
    }
  };

  const updateSpecialization = (specId, field, value) => {
    console.log('📝 Updating spec:', specId, field, value);
    const updated = (specializations || []).map(s =>
      s.specialty_id === specId ? { ...s, [field]: value } : s
    );
    onChange(updated);
  };

  const addCertification = (specId, cert) => {
    const spec = (specializations || []).find(s => s.specialty_id === specId);
    if (spec && cert?.trim()) {
      updateSpecialization(specId, 'certifications', [...(spec.certifications || []), cert.trim()]);
    }
  };

  const removeCertification = (specId, index) => {
    const spec = (specializations || []).find(s => s.specialty_id === specId);
    if (spec && spec.certifications) {
      const updated = [...spec.certifications];
      updated.splice(index, 1);
      updateSpecialization(specId, 'certifications', updated);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-lg">Especializações de Treino</h3>
        <Badge className="bg-purple-100 text-purple-800">
          {specializations.length} selecionadas
        </Badge>
      </div>

      <div className="grid gap-3">
        {AVAILABLE_SPECIALIZATIONS.map((spec) => {
          const isSelected = (specializations || []).find(s => s.specialty_id === spec.id);
          const isExpanded = expandedId === spec.id;

          return (
            <Card
              key={spec.id}
              className={`transition-all ${
                isSelected
                  ? 'ring-2 ring-purple-500 bg-purple-50'
                  : 'hover:shadow-md hover:bg-gray-50'
              }`}
            >
              <CardContent className="p-4">
                <div
                  onClick={(e) => {
                    console.log('🖱️ Card clicked:', spec.id);
                    e.preventDefault();
                    handleToggle(spec);
                  }}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <Checkbox 
                    checked={!!isSelected} 
                    className="mt-1 pointer-events-none" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{spec.icon}</span>
                      <h4 className="font-bold text-sm">{spec.name}</h4>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{spec.description}</p>
                  </div>
                  {isSelected && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('📂 Expand clicked:', spec.id);
                        setExpandedId(isExpanded ? null : spec.id);
                      }}
                      className="shrink-0"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </Button>
                  )}
                </div>

                <AnimatePresence>
                  {isSelected && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t space-y-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2">
                        <Label className="text-xs">Descrição Personalizada</Label>
                        <Textarea
                          value={isSelected.description || ''}
                          onChange={(e) => updateSpecialization(spec.id, 'description', e.target.value)}
                          placeholder="Adicione detalhes sobre sua experiência nesta área..."
                          rows={3}
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Anos de Experiência nesta Especialização</Label>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          value={isSelected.years_experience || 0}
                          onChange={(e) => updateSpecialization(spec.id, 'years_experience', parseInt(e.target.value) || 0)}
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Certificações Relacionadas
                        </Label>
                        <div className="space-y-2">
                          {isSelected.certifications?.map((cert, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Badge variant="secondary" className="flex-1 justify-between">
                                <span>{cert}</span>
                                <button
                                  type="button"
                                  onClick={() => removeCertification(spec.id, idx)}
                                  className="ml-2 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </Badge>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nome da certificação..."
                              className="text-xs"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addCertification(spec.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                const input = e.target.closest('.flex').querySelector('input');
                                addCertification(spec.id, input.value);
                                input.value = '';
                              }}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}