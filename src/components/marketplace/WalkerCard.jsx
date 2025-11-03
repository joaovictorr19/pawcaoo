import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, DollarSign, ShieldCheck, Heart, Zap, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

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
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0 bg-white relative">
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

      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-green-100 to-blue-100">
        {walker.photo_url ? (
          <img
            src={walker.photo_url}
            alt={walker.walker_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
              <span className="text-4xl font-bold text-green-600">
                {walker.walker_name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        
        {/* Favorite Button */}
        <div className="absolute top-4 left-4">
          <Button
            size="icon"
            variant="ghost"
            className="bg-white/90 hover:bg-white shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavoriteMutation.mutate();
            }}
            disabled={toggleFavoriteMutation.isLoading || !user}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
        </div>

        <div className="absolute top-4 right-4 flex gap-2 flex-col items-end">
          {walker.verification_status === "verified" && (
            <Badge className="bg-green-500 text-white border-0 shadow-lg">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Verified
            </Badge>
          )}
          {walker.rating && (
            <Badge className="bg-white/95 text-gray-900 border-0 shadow-lg">
              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
              {walker.rating.toFixed(1)}
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            {walker.walker_name}
            {isProPlan && <Crown className="w-5 h-5 text-yellow-500" />}
          </h3>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {walker.location}
          </div>
        </div>

        {/* Response Time Badge */}
        {(isPremium || isProPlan) && (
          <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Usually replies in {getResponseTime()}
            </span>
          </div>
        )}

        {walker.bio && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {walker.bio}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {walker.dog_sizes?.slice(0, 3).map(size => (
            <Badge key={size} variant="outline" className="border-green-200 text-green-700 bg-green-50">
              {getSizeLabel(size)}
            </Badge>
          ))}
          {walker.dog_sizes?.length > 3 && (
            <Badge variant="outline" className="border-gray-200 text-gray-600">
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
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              €{walker.hourly_rate}
            </div>
            <div className="text-xs text-gray-500">per hour</div>
          </div>
        </div>

        <Button 
          className={`w-full shadow-lg h-12 text-base font-semibold ${
            isProPlan 
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
              : isPremium
              ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600'
              : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600'
          } text-white`}
          onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
          disabled={walker.verification_status !== "verified"}
        >
          {walker.verification_status === "verified" ? "View Profile & Book" : "Verification Pending"}
        </Button>
      </CardContent>
    </Card>
  );
}