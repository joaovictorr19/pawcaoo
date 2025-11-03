import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dog, Edit, Heart, Star, Award, Calendar, Activity, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function DogProfileCard({ dog, onEdit }) {
  const getSizeLabel = (size) => {
    const labels = {
      small: "Pequeno",
      medium: "Médio",
      large: "Grande",
      extra_large: "Extra Grande"
    };
    return labels[size] || size;
  };

  const getEnergyColor = (level) => {
    const colors = {
      low: "bg-blue-100 text-blue-700",
      normal: "bg-green-100 text-green-700",
      high: "bg-orange-100 text-orange-700",
      very_high: "bg-red-100 text-red-700"
    };
    return colors[level] || colors.normal;
  };

  const getSocializationIcon = (socialization) => {
    switch(socialization) {
      case 'friendly': return '🤗';
      case 'neutral': return '😐';
      case 'shy': return '😊';
      case 'aggressive': return '⚠️';
      default: return '🐕';
    }
  };

  const getBadgeColor = (category) => {
    const colors = {
      behavior: "from-blue-500 to-blue-600",
      training: "from-purple-500 to-purple-600",
      obedience: "from-green-500 to-green-600",
      socialization: "from-pink-500 to-pink-600",
      achievement: "from-yellow-500 to-yellow-600"
    };
    return colors[category] || colors.achievement;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
        {/* Header with photo */}
        <div className="relative h-56 bg-gradient-to-br from-green-100 to-blue-100">
          {dog.photo_url ? (
            <img
              src={dog.photo_url}
              alt={dog.dog_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl">
                <Dog className="w-16 h-16 text-green-600" />
              </div>
            </div>
          )}
          
          {/* Edit button */}
          <Button
            size="icon"
            className="absolute top-4 right-4 bg-white hover:bg-gray-100 shadow-xl"
            onClick={onEdit}
          >
            <Edit className="w-4 h-4 text-gray-700" />
          </Button>

          {/* Active status badge */}
          {dog.is_active && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-green-500 text-white">
                <Activity className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            </div>
          )}

          {/* Vaccinated badge */}
          {dog.is_vaccinated && (
            <div className="absolute bottom-4 right-4">
              <Badge className="bg-blue-500 text-white">
                <ShieldCheck className="w-3 h-3 mr-1" />
                Vacinado
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Basic info */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              {dog.dog_name}
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="text-base">
                {getSizeLabel(dog.size)}
              </Badge>
              {dog.breed && (
                <Badge variant="outline" className="text-base">
                  {dog.breed}
                </Badge>
              )}
              {dog.age && (
                <Badge variant="outline" className="text-base">
                  <Calendar className="w-3 h-3 mr-1" />
                  {dog.age} anos
                </Badge>
              )}
              {dog.gender && (
                <Badge variant="outline" className="text-base">
                  {dog.gender === 'male' ? '♂️ Macho' : '♀️ Fêmea'}
                </Badge>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dog.total_walks || 0}</div>
              <div className="text-xs text-gray-600">Passeios</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dog.total_training_sessions || 0}</div>
              <div className="text-xs text-gray-600">Treinos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{dog.badges?.length || 0}</div>
              <div className="text-xs text-gray-600">Medalhas</div>
            </div>
          </div>

          {/* Characteristics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Nível de Energia:</span>
              <Badge className={getEnergyColor(dog.energy_level)}>
                {dog.energy_level?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Socialização:</span>
              <Badge variant="outline">
                {getSocializationIcon(dog.socialization)} {dog.socialization}
              </Badge>
            </div>
            {dog.weight && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Peso:</span>
                <span className="font-semibold">{dog.weight} kg</span>
              </div>
            )}
          </div>

          {/* Badges/Medals */}
          {dog.badges && dog.badges.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Medalhas & Conquistas
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {dog.badges.slice(0, 4).map((badge, idx) => (
                  <motion.div
                    key={badge.badge_id || idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className={`bg-gradient-to-br ${getBadgeColor(badge.category)} text-white rounded-xl p-3 text-center cursor-pointer`}
                  >
                    <div className="text-3xl mb-1">{badge.icon}</div>
                    <div className="text-xs font-bold">{badge.name}</div>
                    <div className="text-xs opacity-90 mt-1 line-clamp-1">{badge.description}</div>
                  </motion.div>
                ))}
              </div>
              {dog.badges.length > 4 && (
                <p className="text-center text-sm text-gray-600 mt-3">
                  +{dog.badges.length - 4} mais medalhas
                </p>
              )}
            </div>
          )}

          {/* Medical info alert */}
          {(dog.medical_conditions || dog.allergies || dog.medications?.length > 0) && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Heart className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900 mb-1">
                    Informações Médicas
                  </p>
                  {dog.medical_conditions && (
                    <p className="text-xs text-orange-800 mb-1">
                      <strong>Condições:</strong> {dog.medical_conditions}
                    </p>
                  )}
                  {dog.allergies && (
                    <p className="text-xs text-orange-800 mb-1">
                      <strong>Alergias:</strong> {dog.allergies}
                    </p>
                  )}
                  {dog.medications && dog.medications.length > 0 && (
                    <p className="text-xs text-orange-800">
                      <strong>Medicações:</strong> {dog.medications.map(m => m.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Behavior notes */}
          {dog.behavioral_notes && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                <strong>Notas de Comportamento:</strong> {dog.behavioral_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}