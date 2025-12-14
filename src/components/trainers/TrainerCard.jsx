import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Award, Video, User as UserIcon, ShieldCheck, Clock, Crown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeContext";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import TrainerVerifiedBadge from "@/components/ui/TrainerVerifiedBadge";
import GoldEmployeeBadge from "@/components/ui/GoldEmployeeBadge";

const TrainerCard = React.memo(({ trainer, distance }) => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  // Fetch trainer's subscription to determine if premium
  const { data: trainerSubscription } = useQuery({
    queryKey: ['trainerSubscription', trainer.created_by],
    queryFn: async () => {
      const subs = await base44.entities.WalkerSubscription.filter({
        walker_email: trainer.created_by,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!trainer.created_by,
  });

  const isPremium = trainerSubscription && ['premium', 'pro'].includes(trainerSubscription.plan_type);
  const isProPlan = trainerSubscription?.plan_type === 'pro';

  const getResponseTime = () => {
    if (isProPlan) return "< 5 min";
    if (isPremium) return "< 15 min";
    return "< 1 hour";
  };

  const getSpecialtyLabel = (specialty) => {
    const labels = {
      basic_obedience: "Basic Obedience",
      advanced_obedience: "Advanced Obedience",
      behavior_modification: "Behavior Modification",
      puppy_training: "Puppy Training",
      socialization: "Socialization",
      aggression: "Aggression Issues",
      anxiety: "Anxiety & Fear",
      potty_training: "Potty Training",
      leash_training: "Leash Training",
      service_dog: "Service Dog",
      therapy_dog: "Therapy Dog",
      agility: "Agility Training",
      tricks: "Tricks & Commands"
    };
    return labels[specialty] || specialty;
  };

  const getMethodologyLabel = (methodology) => {
    const labels = {
      positive_reinforcement: "Positive Reinforcement",
      aversive_training: "Aversive Training",
      balanced_training: "Balanced Training",
      force_free: "Force-Free Training",
      clicker_training: "Clicker Training",
      lure_reward: "Lure-Reward Training",
      model_rival: "Model-Rival Training",
      scientific_methods: "Scientific Methods",
      ethology_based: "Ethology-Based",
      cognitive_training: "Cognitive Training"
    };
    // Fallback: replace underscores and capitalize each word
    return labels[methodology] || methodology.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getConsultationIcon = (method) => {
    if (method === "online") return <Video className="w-4 h-4" />;
    if (method === "in_person") return <UserIcon className="w-4 h-4" />;
    return <Video className="w-4 h-4" />;
  };

  const handleClick = () => {
    navigate(createPageUrl(`TrainerDetails?id=${trainer.id}`));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className="cursor-pointer group"
    >
      <Card className="glass-panel border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden h-full relative rounded-3xl"> {/* Updated className, keep relative for ribbons */}
        {/* Premium Ribbon */}
        {isProPlan && (
          <div className="absolute top-0 left-0 z-20">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-1 text-xs font-bold shadow-lg rounded-br-lg flex items-center gap-1">
              <Crown className="w-3 h-3" />
              PRO
            </div>
          </div>
        )}
        {isPremium && !isProPlan && (
          <div className="absolute top-0 left-0 z-20">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1 text-xs font-bold shadow-lg rounded-br-lg flex items-center gap-1">
              <Zap className="w-3 h-3" />
              PREMIUM
            </div>
          </div>
        )}

        <div className="relative h-48 md:h-64 overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
          {trainer.photo_url ? (
            <img
              src={trainer.photo_url}
              alt={trainer.trainer_name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl font-bold text-purple-600">
                  {trainer.trainer_name?.[0]?.toUpperCase()}
                </span>
              </div>
            </div>
          )}
          <div className="absolute top-2 md:top-4 right-2 md:right-4 flex flex-col gap-1 md:gap-2 items-end z-10">
            {/* Special Badges Row */}
            <div className="flex gap-1">
              {trainer.is_verified_trainer && (
                <div className="transform hover:scale-110 transition-transform">
                  <TrainerVerifiedBadge size="sm" />
                </div>
              )}
              {trainer.is_pawcao_employee && (
                <div className="transform hover:scale-110 transition-transform">
                  <GoldEmployeeBadge size="md" />
                </div>
              )}
            </div>
            
            {(trainer.is_verified || trainer.verification_status === "verified") && (
              <div className="flex items-center gap-1 md:gap-1.5 bg-purple-500 text-white border-0 shadow-lg px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                <VerifiedBadge type="trainer" size="sm" />
                <span className="text-[10px] md:text-xs font-bold">Certificado</span>
              </div>
            )}
            {trainer.video_intro_url && (
              <Badge className="bg-blue-500 text-white border-0 shadow-lg flex items-center gap-1 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1">
                <Video className="w-3 h-3" />
                Video
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 md:p-5 space-y-3 md:space-y-4">
          <div className="flex items-start justify-between mb-2 gap-2">
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm md:text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors break-words">
                  {trainer.trainer_name.length > 20 ? (
                    <span className="animate-marquee inline-block">
                      {trainer.trainer_name}
                    </span>
                  ) : (
                    trainer.trainer_name
                  )}
                </h3>
                {(trainer.is_verified || trainer.verification_status === 'verified') && (
                  <div className="flex-shrink-0">
                    <VerifiedBadge type="trainer" size="sm" />
                  </div>
                )}
                {isProPlan && <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
              </div>
            </div>
            {/* Rating moved here */}
            {(trainer.average_rating || trainer.rating) && (
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm">{(trainer.average_rating || trainer.rating).toFixed(1)}</span>
              </div>
            )}
          </div>

          {trainer.location && (
            <div className="flex items-center text-gray-600 text-xs md:text-sm mb-2 overflow-hidden">
              <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 flex-shrink-0" />
              <span className="truncate flex-1">{trainer.location}</span>
            </div>
          )}

          {distance !== null && distance !== undefined && (
            <div className="flex items-center gap-1 text-[10px] md:text-xs text-blue-600 mb-2 bg-blue-50 px-2 py-1 rounded-lg w-fit">
              <MapPin className="w-3 h-3" />
              <span className="font-semibold">{distance.toFixed(1)} km</span>
            </div>
          )}

          {trainer.success_rate && trainer.success_rate >= 90 && (
            <div className="flex items-center gap-1.5 md:gap-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-green-200">
              <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-600" />
              <span className="text-xs md:text-sm font-bold text-green-700">
                {trainer.success_rate}% Sucesso
              </span>
            </div>
          )}

          {(isPremium || isProPlan) && (
            <div className="flex items-center gap-1.5 md:gap-2 bg-blue-50 rounded-lg px-2 md:px-3 py-1.5 md:py-2">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
              <span className="text-xs md:text-sm font-medium text-blue-700">
                Responde em {getResponseTime()}
              </span>
            </div>
          )}

          {trainer.bio && (
            <p className="text-gray-600 text-xs md:text-sm line-clamp-2">
              {trainer.bio}
            </p>
          )}

          {trainer.certifications && trainer.certifications.length > 0 && (
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-purple-700 bg-purple-50 rounded-lg p-2">
              <Award className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="font-semibold">
                {trainer.certifications.length} Certificado{trainer.certifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {trainer.training_methodologies && trainer.training_methodologies.length > 0 && (
            <div className="text-xs md:text-sm">
              {(() => {
                const primaryMethod = trainer.training_methodologies.find(m => m.primary);
                if (primaryMethod) {
                  return (
                    <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-2 md:px-3 py-1.5 md:py-2 border border-indigo-200">
                      <span className="text-indigo-700 font-semibold">
                        {getMethodologyLabel(primaryMethod.methodology_name)}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          <div className="flex flex-wrap gap-1 md:gap-2">
            {trainer.training_specialties?.slice(0, 2).map(specialty => (
              <Badge key={specialty} variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                {getSpecialtyLabel(specialty)}
              </Badge>
            ))}
            {trainer.training_specialties?.length > 2 && (
              <Badge variant="outline" className="border-gray-200 text-gray-600 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                +{trainer.training_specialties.length - 2}
              </Badge>
            )}
          </div>

          {trainer.consultation_options && trainer.consultation_options.length > 0 && (
            <div className="flex gap-1 md:gap-2 flex-wrap">
              {trainer.consultation_options.map(method => (
                <Badge key={method} className="bg-blue-100 text-blue-700 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5">
                  {getConsultationIcon(method)}
                  <span className="ml-1 capitalize">{method.replace('_', ' ')}</span>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
              {trainer.experience_years && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {trainer.experience_years}a
                </div>
              )}
              {trainer.total_clients > 0 && (
                <div className="text-xs md:text-sm">
                  {trainer.total_clients} clientes
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg md:text-2xl font-bold text-purple-600">
                €{trainer.hourly_rate}
              </div>
              <div className="text-[10px] md:text-xs text-gray-500">/hora</div>
            </div>
          </div>

          <Button 
            className={`w-full shadow-lg h-10 md:h-12 text-xs md:text-base font-semibold text-white hover:opacity-90 ${
              isProPlan 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                : ''
            }`}
            style={!isProPlan ? {
              background: `linear-gradient(to right, ${colors?.primary || '#3b82f6'}, ${colors?.primary || '#3b82f6'}dd)`
            } : {}}
            onClick={handleClick}
            disabled={trainer.verification_status !== "verified"}
          >
            {trainer.verification_status === "verified" ? "Ver Perfil" : "Em Verificação"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default TrainerCard;