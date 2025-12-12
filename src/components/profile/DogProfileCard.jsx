import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dog, Edit, Trash2, Calendar, Weight, Heart, Shield, FileText, AlertCircle, Trophy, Star, Award } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { calculateDogLevel, calculateDogStars, getDogLevelInfo, getAllDogAchievements } from "../gamification/dogGamificationSystem";

export default function DogProfileCard({ dog, onEdit, onDelete }) {
  const [showAchievements, setShowAchievements] = useState(false);
  
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

  // Gamification calculations
  const levelInfo = getDogLevelInfo(dog.total_walks || 0);
  const stars = calculateDogStars(dog.perfect_walks_count || 0, dog.total_walks || 0);
  const { earned, locked } = getAllDogAchievements(dog);
  
  const rarityColors = {
    common: "bg-gray-100 text-gray-700 border-gray-300",
    rare: "bg-blue-100 text-blue-700 border-blue-300",
    epic: "bg-purple-100 text-purple-700 border-purple-300",
    legendary: "bg-yellow-100 text-yellow-700 border-yellow-300"
  };

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

          {/* Gamification Section */}
          <div className="mt-4 pt-4 border-t space-y-3">
            {/* Level & Stars */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3 border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span className="font-bold text-gray-900">Nível {levelInfo.level}</span>
                  <Badge className="bg-yellow-500 text-white text-xs">{levelInfo.title}</Badge>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < stars ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Progress Bar */}
              {levelInfo.level < 10 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>{levelInfo.progress.remaining} passeios até nível {levelInfo.level + 1}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full transition-all duration-500"
                      style={{ width: `${levelInfo.progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Achievements Preview */}
            {earned.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">🏅 Conquistas</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAchievements(true)}
                    className="text-xs h-7"
                  >
                    Ver Todas ({earned.length})
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {earned.slice(0, 4).map((achievement, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${
                        rarityColors[achievement.rarity] || rarityColors.common
                      }`}
                    >
                      {achievement.icon} {achievement.name}
                    </div>
                  ))}
                  {earned.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{earned.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-bold text-green-600">
                {dog.total_walks || 0}
              </div>
              <div className="text-xs text-gray-600">Passeios</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">
                {dog.total_training_sessions || 0}
              </div>
              <div className="text-xs text-gray-600">Treinos</div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-600">
                {dog.total_distance_km?.toFixed(1) || 0}
              </div>
              <div className="text-xs text-gray-600">km</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Modal */}
      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trophy className="w-6 h-6 text-yellow-600" />
              Conquistas de {dog.dog_name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Level Overview */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-3xl font-bold text-gray-900">Nível {levelInfo.level}</div>
                  <div className="text-sm text-gray-600">{levelInfo.title}</div>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < stars ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {levelInfo.level < 10 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Próximo Nível</span>
                    <span>{levelInfo.progress.remaining} passeios restantes</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all"
                      style={{ width: `${levelInfo.progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Earned Achievements */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Desbloqueadas ({earned.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {earned.map((achievement, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-xl border-2 ${rarityColors[achievement.rarity]}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{achievement.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{achievement.description}</div>
                        {achievement.earned_date && (
                          <div className="text-xs text-gray-500 mt-2">
                            {format(new Date(achievement.earned_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Locked Achievements */}
            {locked.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  🔒 Para Desbloquear ({locked.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {locked.map((achievement, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50 opacity-60"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl grayscale">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="font-bold text-sm text-gray-700">{achievement.name}</div>
                          <div className="text-xs text-gray-600 mt-1">{achievement.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}