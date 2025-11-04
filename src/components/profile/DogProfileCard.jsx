import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dog, Edit, Trash2, Calendar, Weight, Heart, Shield, FileText, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function DogProfileCard({ dog, onEdit, onDelete }) {
  const getSizeLabel = (size) => {
    const labels = {
      small: "Pequeno",
      medium: "Médio",
      large: "Grande",
      extra_large: "Extra Grande"
    };
    return labels[size] || size;
  };

  const getGenderIcon = (gender) => {
    return gender === "male" ? "♂️" : "♀️";
  };

  const hasVaccinationAlert = dog.vaccination_date && 
    new Date(dog.vaccination_date) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card className="border-2 border-green-200 hover:shadow-xl transition-all h-full">
        <CardContent className="p-6">
          {/* Header with Photo */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              {dog.photo_url ? (
                <img
                  src={dog.photo_url}
                  alt={dog.dog_name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-green-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center border-4 border-green-100">
                  <Dog className="w-10 h-10 text-green-600" />
                </div>
              )}
              {dog.is_active && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Heart className="w-3 h-3 text-white fill-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {dog.dog_name}
                    <span className="text-2xl">{getGenderIcon(dog.gender)}</span>
                  </h3>
                  <p className="text-sm text-gray-600">{dog.breed}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onEdit}
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onDelete}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className="bg-green-100 text-green-700">
                  {getSizeLabel(dog.size)}
                </Badge>
                {dog.age && (
                  <Badge variant="outline">{dog.age} {dog.age === 1 ? 'ano' : 'anos'}</Badge>
                )}
                {dog.weight && (
                  <Badge variant="outline">{dog.weight} kg</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {dog.energy_level && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Energia</div>
                  <div className="font-semibold capitalize">{dog.energy_level}</div>
                </div>
              </div>
            )}
            
            {dog.socialization && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🤝</span>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Social</div>
                  <div className="font-semibold capitalize">{dog.socialization}</div>
                </div>
              </div>
            )}
          </div>

          {/* Health Status */}
          <div className="space-y-2 mb-4">
            {dog.is_vaccinated ? (
              <div className={`flex items-center gap-2 p-2 rounded-lg ${
                hasVaccinationAlert ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
              }`}>
                {hasVaccinationAlert ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs text-yellow-700 flex-1">
                      Vacinação pode estar desatualizada
                    </span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700 flex-1">
                      Vacinação em dia
                    </span>
                  </>
                )}
                {dog.vaccination_date && (
                  <span className="text-xs text-gray-600">
                    {format(new Date(dog.vaccination_date), 'dd/MM/yyyy')}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-700">Vacinação pendente</span>
              </div>
            )}

            {dog.is_neutered && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-xs text-blue-700">✓ Castrado/Esterilizado</span>
              </div>
            )}
          </div>

          {/* Medical Records Count */}
          {(dog.medical_records?.length > 0 || dog.vaccination_records?.length > 0) && (
            <div className="flex gap-3 pt-3 border-t">
              {dog.vaccination_records?.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4" />
                  <span>{dog.vaccination_records.length} vacinas</span>
                </div>
              )}
              {dog.medical_records?.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>{dog.medical_records.length} registos</span>
                </div>
              )}
            </div>
          )}

          {/* Badges */}
          {dog.badges && dog.badges.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {dog.badges.slice(0, 3).map((badge, idx) => (
                  <div
                    key={idx}
                    className="px-2 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: badge.color + '20', color: badge.color }}
                  >
                    {badge.icon} {badge.name}
                  </div>
                ))}
                {dog.badges.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{dog.badges.length - 3} mais
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {dog.total_walks || 0}
              </div>
              <div className="text-xs text-gray-600">Passeios</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {dog.total_training_sessions || 0}
              </div>
              <div className="text-xs text-gray-600">Treinos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}