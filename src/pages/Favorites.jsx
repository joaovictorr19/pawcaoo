import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, DollarSign, Trash2, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Favorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.Favorite.list('-created_date'),
    initialData: [],
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const handleRemove = async (favoriteId) => {
    await removeFavoriteMutation.mutateAsync(favoriteId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Heart className="w-10 h-10 text-red-500 fill-red-500" />
            My Favorite Walkers
          </h1>
          <p className="text-gray-600 text-lg">Quick access to your trusted dog walkers</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6">Start adding your favorite walkers for quick access</p>
              <Button onClick={() => navigate(createPageUrl('Home'))}>
                Browse Walkers
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite, index) => (
              <motion.div
                key={favorite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-red-100">
                  <div className="relative h-48 bg-gradient-to-br from-red-100 to-pink-100">
                    {favorite.walker_photo_url ? (
                      <img
                        src={favorite.walker_photo_url}
                        alt={favorite.walker_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                          <span className="text-3xl font-bold text-red-500">
                            {favorite.walker_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-red-500 text-white border-0 shadow-lg">
                        <Heart className="w-4 h-4 mr-1 fill-white" />
                        Favorite
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {favorite.walker_name}
                    </h3>
                    {favorite.walker_location && (
                      <div className="flex items-center text-gray-600 text-sm mb-4">
                        <MapPin className="w-4 h-4 mr-1" />
                        {favorite.walker_location}
                      </div>
                    )}

                    {favorite.walker_hourly_rate && (
                      <div className="mb-4">
                        <span className="text-2xl font-bold text-green-600">
                          ${favorite.walker_hourly_rate}
                        </span>
                        <span className="text-gray-500 text-sm ml-1">per hour</span>
                      </div>
                    )}

                    {favorite.notes && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {favorite.notes}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => navigate(createPageUrl(`WalkerDetails?id=${favorite.walker_id}`))}
                      >
                        Book Now
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(createPageUrl(`Messages?walker_id=${favorite.walker_id}`))}
                      >
                        <MessageCircle className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleRemove(favorite.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}