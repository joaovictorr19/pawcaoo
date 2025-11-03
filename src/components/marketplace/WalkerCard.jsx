
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
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white relative backdrop-blur-sm">
        {/* Glassmorphism overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-blue-500/0 group-hover:from-green-500/10 group-hover:to-blue-500/10 transition-all duration-500 pointer-events-none z-10" />
        
        {/* Premium Ribbon with glow */}
        {isProPlan && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute top-0 left-0 z-20"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 text-xs font-bold shadow-xl rounded-br-2xl flex items-center gap-1.5">
                <Crown className="w-4 h-4 animate-bounce" />
                PRO
              </div>
            </div>
          </motion.div>
        )}
        {isPremium && !isProPlan && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute top-0 left-0 z-20"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400 blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 text-xs font-bold shadow-xl rounded-br-2xl flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                PREMIUM
              </div>
            </div>
          </motion.div>
        )}

        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-green-100 to-blue-100">
          {walker.photo_url ? (
            <motion.img
              src={walker.photo_url}
              alt={walker.walker_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              whileHover={{ scale: 1.1 }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-200 to-blue-200">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl"
              >
                <span className="text-4xl font-bold bg-gradient-to-br from-green-600 to-blue-600 bg-clip-text text-transparent">
                  {walker.walker_name?.[0]?.toUpperCase()}
                </span>
              </motion.div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Favorite Button with enhanced animation */}
          <motion.div
            className="absolute top-4 left-4"
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="icon"
              variant="ghost"
              className="bg-white/90 hover:bg-white shadow-xl backdrop-blur-md border border-white/50"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteMutation.mutate();
              }}
              disabled={toggleFavoriteMutation.isLoading || !user}
            >
              <motion.div
                animate={isFavorite ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </motion.div>
            </Button>
          </motion.div>

          <div className="absolute top-4 right-4 flex gap-2 flex-col items-end">
            {walker.verification_status === "verified" && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <Badge className="bg-green-500 text-white border-0 shadow-xl backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Verified
                </Badge>
              </motion.div>
            )}
            {walker.rating && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                whileHover={{ scale: 1.1 }}
              >
                <Badge className="bg-white/95 backdrop-blur-md text-gray-900 border-0 shadow-xl">
                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                  {walker.rating.toFixed(1)}
                </Badge>
              </motion.div>
            )}
            
            {/* NEW: Video Badge */}
            {walker.video_intro_url && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
                whileHover={{ scale: 1.1 }}
              >
                <Badge className="bg-blue-500 text-white border-0 shadow-xl backdrop-blur-md flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  Video
                </Badge>
              </motion.div>
            )}

            {/* NEW: Background Check Badge */}
            {walker.background_check_status === 'verified' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                whileHover={{ scale: 1.1 }}
              >
                <Badge className="bg-gradient-to-r from-green-600 to-green-500 text-white border-0 shadow-xl backdrop-blur-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Background Verified
                </Badge>
              </motion.div>
            )}
          </div>
        </div>
        
        <CardContent className="p-6 space-y-4 relative z-20">
          <div>
            <motion.h3
              className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {walker.walker_name}
              {isProPlan && <Crown className="w-5 h-5 text-yellow-500 animate-pulse" />}
            </motion.h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {walker.location}
            </div>
          </div>

          {/* Response Time Badge with glow */}
          {(isPremium || isProPlan) && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-400 blur-md opacity-20"></div>
              <div className="relative flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl px-3 py-2 border border-blue-200/50">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Usually replies in {getResponseTime()}
                </span>
              </div>
            </motion.div>
          )}

          {walker.bio && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {walker.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {walker.dog_sizes?.slice(0, 3).map(size => (
              <motion.div
                key={size}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                  {getSizeLabel(size)}
                </Badge>
              </motion.div>
            ))}
            {walker.dog_sizes?.length > 3 && (
              <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50">
                +{walker.dog_sizes.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {walker.experience_years && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {walker.experience_years}y
                </div>
              )}
              {walker.total_walks > 0 && (
                <div>
                  {walker.total_walks} walks
                </div>
              )}
            </div>
            <motion.div
              className="text-right"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                €{walker.hourly_rate}
              </div>
              <div className="text-xs text-gray-500">per hour</div>
            </motion.div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              className={`w-full shadow-lg h-12 text-base font-semibold relative overflow-hidden group/btn ${
                isProPlan 
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
                  : isPremium
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
              } text-white`}
              onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
              disabled={walker.verification_status !== "verified"}
            >
              <span className="relative z-10">
                {walker.verification_status === "verified" ? "View Profile & Book" : "Verification Pending"}
              </span>
              <div className="absolute inset-0 bg-white/20 transform translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
