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

        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-purple-100 to-blue-100">
          {trainer.photo_url ? (
            <img
              src={trainer.photo_url}
              alt={trainer.trainer_name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
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
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {trainer.verification_status === "verified" && (
              <Badge className="bg-purple-500 text-white border-0 shadow-lg">
                <ShieldCheck className="w-4 h-4 mr-1" />
                Certified
              </Badge>
            )}
            {/* Removed rating badge from top right, as it's now in CardContent */}
            {/* NEW: Video Badge */}
            {trainer.video_intro_url && (
              <Badge className="bg-blue-500 text-white border-0 shadow-lg flex items-center gap-1">
                <Video className="w-3 h-3" />
                Video
              </Badge>
            )}

            {/* NEW: Background Check Badge */}
            {trainer.background_check_status === 'verified' && (
              <Badge className="bg-gradient-to-r from-purple-600 to-purple-500 text-white border-0 shadow-lg flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4 space-y-4"> {/* Changed padding to p-4 */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors flex items-center gap-2"> {/* Changed text size and added hover effect */}
              {trainer.trainer_name}
              {isProPlan && <Crown className="w-4 h-4 text-yellow-500" />} {/* Reduced Crown size */}
            </h3>
            {/* Rating moved here */}
            {(trainer.average_rating || trainer.rating) && (
              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm">{(trainer.average_rating || trainer.rating).toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Location moved here */}
          {trainer.location && (
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {trainer.location}
            </div>
          )}

          {/* Distance Badge */}
          {distance !== null && distance !== undefined && (
            <div className="flex items-center gap-1 text-xs text-blue-600 mb-2 bg-blue-50 px-2 py-1 rounded-lg w-fit">
              <MapPin className="w-3 h-3" />
              <span className="font-semibold">{distance.toFixed(1)} km away</span>
            </div>
          )}

          {/* Success Rate Badge */}
          {trainer.success_rate && trainer.success_rate >= 90 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-3 py-2 border border-green-200">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-700">
                {trainer.success_rate}% Success Rate
              </span>
            </div>
          )}

          {/* Response Time Badge */}
          {(isPremium || isProPlan) && (
            <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Usually replies in {getResponseTime()}
              </span>
            </div>
          )}

          {trainer.bio && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {trainer.bio}
            </p>
          )}

          {trainer.certifications && trainer.certifications.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-lg p-2">
              <Award className="w-4 h-4" />
              <span className="font-semibold">
                {trainer.certifications.length} Professional Certificate{trainer.certifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Primary Methodology Badge */}
          {trainer.training_methodologies && trainer.training_methodologies.length > 0 && (
            <div className="text-sm">
              {(() => {
                const primaryMethod = trainer.training_methodologies.find(m => m.primary);
                if (primaryMethod) {
                  return (
                    <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-200">
                      <span className="text-indigo-700 font-semibold">
                        ★ {getMethodologyLabel(primaryMethod.methodology_name)}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {trainer.training_specialties?.slice(0, 2).map(specialty => (
              <Badge key={specialty} variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                {getSpecialtyLabel(specialty)}
              </Badge>
            ))}
            {trainer.training_specialties?.length > 2 && (
              <Badge variant="outline" className="border-gray-200 text-gray-600">
                +{trainer.training_specialties.length - 2} more
              </Badge>
            )}
          </div>

          {trainer.consultation_options && trainer.consultation_options.length > 0 && (
            <div className="flex gap-2">
              {trainer.consultation_options.map(method => (
                <Badge key={method} className="bg-blue-100 text-blue-700">
                  {getConsultationIcon(method)}
                  <span className="ml-1 capitalize">{method.replace('_', ' ')}</span>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {trainer.experience_years && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {trainer.experience_years}y
                </div>
              )}
              {trainer.total_clients > 0 && (
                <div>
                  {trainer.total_clients} clients
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">
                €{trainer.hourly_rate}
              </div>
              <div className="text-xs text-gray-500">per hour</div>
            </div>
          </div>

          <Button 
            className={`w-full shadow-lg h-12 text-base font-semibold text-white hover:opacity-90 ${
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
            {trainer.verification_status === "verified" ? "View Profile & Book" : "Verification Pending"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default TrainerCard;