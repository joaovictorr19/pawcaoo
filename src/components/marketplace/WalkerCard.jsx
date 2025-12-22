import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, DollarSign, Shield, Heart, User, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeContext";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import ProfessionalRoleBadge from "@/components/ui/ProfessionalRoleBadge";

// Dummy data for specializations for the purpose of this component
// In a real application, this would likely be imported from a constants file or fetched from an API.
const quickSpecializations = [
  { id: "puppy_care", icon: "🐾", label: "Puppy Care" },
  { id: "senior_dog_care", icon: "👴", label: "Senior Dog Care" },
  { id: "medication_admin", icon: "💊", label: "Medication Admin" },
  { id: "large_dog_expert", icon: "🐕", label: "Large Dog Expert" },
  { id: "reactive_dog_handling", icon: "⚠️", label: "Reactive Dog Handling" },
  { id: "first_aid_certified", icon: "⛑️", label: "First Aid Certified" },
  { id: "overnight_care", icon: "🌙", label: "Overnight Care" },
  { id: "cat_friendly", icon: "🐈", label: "Cat Friendly" },
];


const WalkerCard = React.memo(({ walker, distance, matchScore, showMatchScore }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const { data: user } = useQuery({ 
    queryKey: ['currentUser'], 
    queryFn: () => base44.auth.me() 
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['myFavorites'],
    queryFn: () => base44.entities.Favorite.filter({ created_by: user?.email }),
    enabled: !!user?.email
  });

  const isFavorite = favorites.some(f => f.walker_id === walker.id);
  const favoriteRecord = favorites.find(f => f.walker_id === walker.id);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
        if (!user) {
            toast.error("Faça login para adicionar aos favoritos");
            return;
        }
        if (isFavorite) {
            await base44.entities.Favorite.delete(favoriteRecord.id);
        } else {
            await base44.entities.Favorite.create({
                walker_id: walker.id,
                walker_name: walker.walker_name,
                walker_photo_url: walker.photo_url,
                walker_location: walker.location,
                walker_hourly_rate: walker.hourly_rate
            });
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['myFavorites']);
        toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: () => {
        toast.error("Erro ao atualizar favoritos");
    }
  });

  const handleViewProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(createPageUrl(`WalkerDetails?id=${walker.id}`));
  };

  const handleCardClick = () => {
    navigate(createPageUrl(`WalkerDetails?id=${walker.id}`));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="cursor-pointer group"
    >
      <Card className="glass-panel border-0 shadow-xl hover:shadow-2xl transition-all overflow-hidden h-full rounded-3xl">
        <div className="relative h-32 md:h-44 bg-gradient-to-br from-green-100 to-blue-100 overflow-hidden">
          {walker.photo_url ? (
            <img
              src={walker.photo_url}
              alt={`Photo of ${walker.walker_name}, Dog Walker in ${walker.location}`}
              loading="lazy"
              className="w-full h-full object-cover object-center aspect-square transition-transform duration-300 group-hover:scale-110 bg-gray-200"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(walker.walker_name) + '&background=10b981&color=fff&size=400';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl md:text-2xl font-bold text-green-600">
                  {walker.walker_name?.[0]?.toUpperCase()}
                </span>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Special Badges - Top Right */}
          {(walker.is_pawcao_employee || walker.is_verified_trainer) && (
            <div className="absolute top-2 right-2 flex gap-1">
              {walker.is_verified_trainer && (
                <div className="transform hover:scale-110 transition-transform">
                  <TrainerVerifiedBadge size="sm" />
                </div>
              )}
              {walker.is_pawcao_employee && (
                <div className="transform hover:scale-110 transition-transform">
                  <GoldEmployeeBadge size="sm" />
                </div>
              )}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {showMatchScore && matchScore !== undefined && (
              <Badge className={`${
                matchScore >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                matchScore >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                matchScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                'bg-gradient-to-r from-gray-500 to-gray-600'
              } text-white border-0 shadow-lg text-[10px] px-2 py-0.5 font-bold`}>
                {matchScore}%
              </Badge>
            )}
            {walker.total_walks > 50 && (
              <Badge className="bg-purple-500 text-white border-0 shadow-lg text-[10px] px-1.5 py-0.5">
                ⭐ Top
              </Badge>
            )}
          </div>

          {/* Favorite Button */}
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2 md:top-3 left-2 md:left-3 w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteMutation.mutate();
            }}
          >
            <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-500"}`} />
          </motion.button>
        </div>

        <CardContent className="p-3 md:p-4">
          <div className="flex items-start justify-between mb-1 md:mb-1.5 gap-2">
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-green-600 transition-colors break-words">
                  {walker.walker_name.length > 20 ? (
                    <span className="animate-marquee inline-block">
                      {walker.walker_name}
                    </span>
                  ) : (
                    walker.walker_name
                  )}
                </h3>
                {(walker.is_verified || walker.verification_status === 'verified') && (
                  <div className="flex-shrink-0">
                    <VerifiedBadge type="walker" size="sm" />
                  </div>
                )}
              </div>
            </div>
            {(walker.rating > 0 && walker.total_walks > 0) ? (
              <div className="flex items-center gap-0.5 bg-yellow-50 px-1.5 py-0.5 rounded-lg flex-shrink-0">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-xs">{walker.rating.toFixed(1)}</span>
              </div>
            ) : (
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0 text-[10px] px-1.5 py-0.5">
                Novo
              </Badge>
            )}
          </div>

          <div className="flex items-center text-gray-600 text-xs mb-1 overflow-hidden">
            <MapPin className="w-3 h-3 mr-1 text-green-600 flex-shrink-0" />
            <span className="truncate flex-1">{walker.location}</span>
            {distance !== null && distance !== undefined && (
              <span className="text-blue-600 font-semibold ml-1">• {distance.toFixed(1)}km</span>
            )}
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-600">
              <span className="font-semibold text-gray-900">{walker.total_walks || 0}</span> passeios
            </div>
            <div className="flex items-center gap-0.5 text-green-600 font-bold text-base">
              <span>€{walker.hourly_rate}</span>
              <span className="text-[10px] text-gray-500">/h</span>
            </div>
          </div>

          {walker.bio && (
            <p className="text-gray-600 text-xs mb-2 line-clamp-2">
              {walker.bio}
            </p>
          )}

          {showMatchScore && walker.services_offered && walker.services_offered.length > 0 && (
            <div className="mb-1.5">
              <div className="flex flex-wrap gap-1">
                {walker.services_offered.slice(0, 2).map((service, idx) => (
                  <Badge key={idx} variant="outline" className="text-[9px] px-1 py-0 border-blue-200 text-blue-600">
                    {service.service_name}
                  </Badge>
                ))}
                {walker.services_offered.length > 2 && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0">+{walker.services_offered.length - 2}</Badge>
                )}
              </div>
            </div>
          )}

          {walker.dog_sizes && walker.dog_sizes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {walker.dog_sizes.slice(0, 3).map(size => (
                <Badge key={size} variant="outline" className="text-[9px] capitalize px-1 py-0">
                  {size.replace('_', ' ')}
                </Badge>
              ))}
              {walker.dog_sizes.length > 3 && (
                <Badge variant="outline" className="text-[9px] px-1 py-0">+{walker.dog_sizes.length - 3}</Badge>
              )}
            </div>
          )}

          <Button 
            className="w-full text-white shadow-lg text-xs h-8 hover:opacity-90 bg-gradient-to-r from-blue-600 to-indigo-600"
            onClick={handleViewProfile}
          >
            Ver Perfil
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default WalkerCard;