
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, DollarSign, ShieldCheck, Heart, Zap, Crown, Video } from "lucide-react"; // Added Video
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function WalkerCard({ walker }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

  // Fetch walker's subscription to determine if premium
  const { data: walkerSubscription } = useQuery({
    queryKey: ['walkerSubscription', walker.created_by],
    queryFn: async () => {
      const subs = await base44.entities.WalkerSubscription.filter({
        walker_email: walker.created_by,
        is_active: true
      });
      return subs[0];
    },
    enabled: !!walker.created_by,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.Favorite.list(),
    initialData: [],
    enabled: !!user,
  });

  const isFavorite = favorites.some(f => f.walker_id === walker.id);
  const isPremium = walkerSubscription && ['premium', 'pro'].includes(walkerSubscription.plan_type);
  const isProPlan = walkerSubscription?.plan_type === 'pro';

  // Calculate average response time (mock - you'd track this in real implementation)
  const getResponseTime = () => {
    if (isProPlan) return "< 5 min";
    if (isPremium) return "< 15 min";
    return "< 1 hour";
  };

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        const favorite = favorites.find(f => f.walker_id === walker.id);
        if (favorite) {
          await base44.entities.Favorite.delete(favorite.id);
        }
      } else {
        await base44.entities.Favorite.create({
          walker_id: walker.id,
          walker_name: walker.walker_name,
          walker_photo_url: walker.photo_url,
          walker_location: walker.location,
          walker_hourly_rate: walker.hourly_rate,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const getSizeLabel = (size) => {
    const labels = {
      small: "Small",
      medium: "Medium",
      large: "Large",
      extra_large: "XL"
    };
    return labels[size] || size;
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white h-full flex flex-col">
        {/* Premium Ribbon */}
        {isProPlan && (
          <div className="absolute top-0 left-0 z-20">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold shadow-lg rounded-br-xl flex items-center gap-1">
              <Crown className="w-3 h-3" />
              PRO
            </div>
          </div>
        )}
        {isPremium && !isProPlan && (
          <div className="absolute top-0 left-0 z-20">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold shadow-lg rounded-br-xl flex items-center gap-1">
              <Zap className="w-3 h-3" />
              PREMIUM
            </div>
          </div>
        )}

        <div className="relative h-44 md:h-56 overflow-hidden bg-gradient-to-br from-green-100 to-blue-100">
          {walker.photo_url ? (
            <img
              src={walker.photo_url}
              alt={walker.walker_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-200 to-blue-200">
              <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl md:text-4xl font-bold bg-gradient-to-br from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {walker.walker_name?.[0]?.toUpperCase()}
                </span>
              </div>
            </div>
          )}
          
          {/* Favorite Button */}
          <div className="absolute top-2 left-2 md:top-3 md:left-3">
            <Button
              size="icon"
              variant="ghost"
              className="bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm border border-white/50 h-8 w-8 md:h-9 md:w-9"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteMutation.mutate();
              }}
              disabled={toggleFavoriteMutation.isLoading || !user}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
            </Button>
          </div>

          <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-1 md:gap-1.5 flex-col items-end">
            {walker.verification_status === "verified" && (
              <Badge className="bg-green-500 text-white border-0 shadow-lg text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1">
                <ShieldCheck className="w-3 h-3 mr-0.5" />
                Verified
              </Badge>
            )}
            {walker.rating && (
              <Badge className="bg-white/95 backdrop-blur-sm text-gray-900 border-0 shadow-lg text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1">
                <Star className="w-3 h-3 mr-0.5 fill-yellow-400 text-yellow-400" />
                {walker.rating.toFixed(1)}
              </Badge>
            )}
            
            {/* NEW: Video Badge */}
            {walker.video_intro_url && (
              <Badge className="bg-blue-500 text-white border-0 shadow-lg text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1">
                <Video className="w-3 h-3" />
              </Badge>
            )}

            {/* NEW: Background Check Badge */}
            {walker.background_check_status === 'verified' && (
              <Badge className="bg-green-600 text-white border-0 shadow-lg text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-1">
                <ShieldCheck className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </div>
        
        <CardContent className="p-3 md:p-5 space-y-2 md:space-y-3 flex-1 flex flex-col">
          <div>
            <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1 flex items-center gap-1.5 line-clamp-1">
              {walker.walker_name}
              {isProPlan && <Crown className="w-4 h-4 text-yellow-500" />}
            </h3>
            <div className="flex items-center text-gray-600 text-xs md:text-sm">
              <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{walker.location}</span>
            </div>
          </div>

          {(isPremium || isProPlan) && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg px-2 py-1.5 md:px-3 md:py-2 border border-blue-200/50">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-600 flex-shrink-0" />
                <span className="text-[10px] md:text-xs font-medium text-blue-700 truncate">
                  Responde em {getResponseTime()}
                </span>
              </div>
            </div>
          )}

          {walker.bio && (
            <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
              {walker.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-1 md:gap-1.5">
            {walker.dog_sizes?.slice(0, 3).map(size => (
              <Badge key={size} variant="outline" className="border-green-200 text-green-700 bg-green-50 text-[10px] md:text-xs px-1.5 py-0.5">
                {getSizeLabel(size)}
              </Badge>
            ))}
            {walker.dog_sizes?.length > 3 && (
              <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50 text-[10px] md:text-xs px-1.5 py-0.5">
                +{walker.dog_sizes.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto">
            <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-600">
              {walker.experience_years && (
                <div className="flex items-center gap-0.5 md:gap-1">
                  <Clock className="w-3 h-3 md:w-4 md:h-4" />
                  {walker.experience_years}a
                </div>
              )}
              {walker.total_walks > 0 && (
                <div className="text-xs md:text-sm">
                  {walker.total_walks} passeios
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-lg md:text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                €{walker.hourly_rate}
              </div>
              <div className="text-[10px] md:text-xs text-gray-500">por hora</div>
            </div>
          </div>

          <Button 
            className={`w-full shadow-md h-9 md:h-11 text-xs md:text-sm font-semibold ${
              isProPlan 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                : isPremium
                ? 'bg-gradient-to-r from-purple-600 to-purple-500'
                : 'bg-gradient-to-r from-green-600 to-green-500'
            } text-white`}
            onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
            disabled={walker.verification_status !== "verified"}
          >
            {walker.verification_status === "verified" ? "Ver Perfil" : "Pendente"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
