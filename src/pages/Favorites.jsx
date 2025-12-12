import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, DollarSign, Trash2, MessageCircle, Dog, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Favorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("walkers");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch Walker Favorites
  const { data: favoriteWalkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.Favorite.list('-created_date'),
    initialData: [],
  });

  // Fetch Pet Favorites
  const { data: favoritePets, isLoading: loadingPets } = useQuery({
    queryKey: ['adoptionFavorites', user?.email],
    queryFn: () => base44.entities.AdoptionFavorite.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const removeWalkerMutation = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removePetMutation = useMutation({
    mutationFn: (id) => base44.entities.AdoptionFavorite.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adoptionFavorites'] });
    },
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Heart className="w-10 h-10 text-red-500 fill-red-500" />
            {t('myFavorites', language)}
          </h1>
          <p className="text-gray-600 text-lg">{t('quickAccessTrusted', language)}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
            <TabsTrigger value="walkers">
              <User className="w-4 h-4 mr-2" />
              {language === 'pt' ? 'Profissionais' : 'Professionals'}
            </TabsTrigger>
            <TabsTrigger value="pets">
              <Dog className="w-4 h-4 mr-2" />
              {language === 'pt' ? 'Pets para Adoção' : 'Pets for Adoption'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="walkers">
            {loadingWalkers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
              </div>
            ) : favoriteWalkers.length === 0 ? (
              <EmptyState 
                message={t('noFavorites', language)} 
                action={() => navigate(createPageUrl('Home'))}
                buttonText={t('browseWalkers', language)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteWalkers.map((favorite, index) => (
                  <motion.div
                    key={favorite.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass-panel overflow-hidden hover:shadow-2xl transition-all duration-300 border-0">
                      <div className="relative h-48 bg-gradient-to-br from-red-100 to-pink-100">
                        {favorite.walker_photo_url ? (
                          <img src={favorite.walker_photo_url} alt={favorite.walker_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl font-bold text-red-500">{favorite.walker_name?.[0]}</span>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={() => removeWalkerMutation.mutate(favorite.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2">{favorite.walker_name}</h3>
                        <p className="text-gray-600 text-sm mb-4 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" /> {favorite.walker_location}
                        </p>
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => navigate(createPageUrl(`WalkerDetails?id=${favorite.walker_id}`))}
                        >
                          {t('viewDetails', language)}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pets">
            {loadingPets ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
              </div>
            ) : favoritePets.length === 0 ? (
              <EmptyState 
                message={language === 'pt' ? 'Nenhum pet favorito ainda' : 'No favorite pets yet'}
                action={() => navigate(createPageUrl('AdoptionListings'))}
                buttonText={t('browsePets', language)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritePets.map((favorite, index) => (
                  <motion.div
                    key={favorite.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="glass-panel overflow-hidden hover:shadow-2xl transition-all duration-300 border-0">
                      <div className="relative h-48 bg-gray-200">
                        {favorite.pet_photo_url ? (
                          <img src={favorite.pet_photo_url} alt={favorite.pet_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={() => removePetMutation.mutate(favorite.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2">{favorite.pet_name}</h3>
                        {favorite.location && (
                          <p className="text-gray-600 text-sm mb-4 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" /> {favorite.location}
                          </p>
                        )}
                        <Button 
                          className="w-full bg-pink-600 hover:bg-pink-700"
                          onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${favorite.listing_id}`))}
                        >
                          {t('viewPet', language)}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ message, action, buttonText }) {
  return (
    <Card className="glass-panel border-0 shadow-xl">
      <CardContent className="p-12 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">{message}</h3>
        <Button onClick={action} className="mt-4">
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}