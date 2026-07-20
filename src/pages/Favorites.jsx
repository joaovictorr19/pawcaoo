import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Trash2, Dog, User, Star } from "lucide-react";
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
    queryFn: () => getCurrentUser(),
  });

  const { data: favoriteWalkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.Favorite.list('-created_date'),
    initialData: [],
  });

  const { data: favoritePets, isLoading: loadingPets } = useQuery({
    queryKey: ['adoptionFavorites', user?.email],
    queryFn: () => base44.entities.AdoptionFavorite.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const removeWalkerMutation = useMutation({
    mutationFn: (id) => base44.entities.Favorite.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const removePetMutation = useMutation({
    mutationFn: (id) => base44.entities.AdoptionFavorite.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adoptionFavorites'] }),
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      {/* Sticky header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
          <h1 className="text-base font-bold text-slate-900">{t('myFavorites', language)}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full mb-5 h-11 bg-white border border-slate-200 rounded-xl shadow-sm" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <TabsTrigger value="walkers" className="rounded-lg text-sm font-semibold data-[state=active]:bg-rose-500 data-[state=active]:text-white">
              <User className="w-3.5 h-3.5 mr-1.5" />
              {language === 'pt' ? 'Profissionais' : 'Professionals'}
            </TabsTrigger>
            <TabsTrigger value="pets" className="rounded-lg text-sm font-semibold data-[state=active]:bg-rose-500 data-[state=active]:text-white">
              <Dog className="w-3.5 h-3.5 mr-1.5" />
              {language === 'pt' ? 'Pets' : 'Pets'}
            </TabsTrigger>
          </TabsList>

          {/* ── Walkers Tab ── */}
          <TabsContent value="walkers">
            {loadingWalkers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-3xl" />)}
              </div>
            ) : favoriteWalkers.length === 0 ? (
              <EmptyState
                message={t('noFavorites', language)}
                action={() => navigate(createPageUrl('Home'))}
                buttonText={t('browseWalkers', language)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteWalkers.map((favorite, index) => (
                  <motion.div
                    key={favorite.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
                      {/* Photo */}
                      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                        {favorite.walker_photo_url ? (
                          <img src={favorite.walker_photo_url} alt={favorite.walker_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl font-black text-slate-300">{favorite.walker_name?.[0]}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        {/* Remove button */}
                        <button
                          onClick={() => removeWalkerMutation.mutate(favorite.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-white/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                        {/* Name overlay */}
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="text-white font-bold text-lg drop-shadow-lg">{favorite.walker_name}</h3>
                        </div>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        {favorite.walker_location && (
                          <p className="text-slate-500 text-xs flex items-center gap-1 mb-3">
                            <MapPin className="w-3 h-3" /> {favorite.walker_location}
                          </p>
                        )}
                        {favorite.walker_hourly_rate != null && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <span className="text-xs font-bold text-slate-700">€{favorite.walker_hourly_rate}/h</span>
                          </div>
                        )}
                        <Button
                          className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs"
                          onClick={() => navigate(createPageUrl(`UserProfile?id=${favorite.walker_id}`))}
                        >
                          {t('viewDetails', language)}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Pets Tab ── */}
          <TabsContent value="pets">
            {loadingPets ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-3xl" />)}
              </div>
            ) : favoritePets.length === 0 ? (
              <EmptyState
                message={language === 'pt' ? 'Nenhum pet favorito ainda' : 'No favorite pets yet'}
                action={() => navigate(createPageUrl("Home"))}
                buttonText={t('browsePets', language)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoritePets.map((favorite, index) => (
                  <motion.div
                    key={favorite.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group">
                      <div className="relative h-44 bg-gradient-to-br from-amber-50 to-rose-50 overflow-hidden">
                        {favorite.pet_photo_url ? (
                          <img src={favorite.pet_photo_url} alt={favorite.pet_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">🐾</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        <button
                          onClick={() => removePetMutation.mutate(favorite.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md border border-white/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="text-white font-bold text-lg drop-shadow-lg">{favorite.pet_name}</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        {favorite.location && (
                          <p className="text-slate-500 text-xs flex items-center gap-1 mb-3">
                            <MapPin className="w-3 h-3" /> {favorite.location}
                          </p>
                        )}
                        <Button
                          className="w-full h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold text-xs"
                          onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${favorite.listing_id}`))}
                        >
                          {t('viewPet', language)}
                        </Button>
                      </div>
                    </div>
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
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-sm p-12 text-center">
      <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4">
        <Heart className="w-9 h-9 text-rose-300" />
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-1">{message}</h3>
      <p className="text-sm text-slate-400 mb-5">Explore profissionais e adicione-os aqui</p>
      <Button onClick={action} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6">
        {buttonText}
      </Button>
    </div>
  );
}