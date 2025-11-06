import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, Heart, Hash, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TrendingSection() {
  const navigate = useNavigate();

  // Trending Hashtags
  const { data: trendingHashtags = [] } = useQuery({
    queryKey: ['trendingHashtags'],
    queryFn: async () => {
      const hashtags = await base44.entities.SocialHashtag.filter({ is_trending: true }, '-trending_score', 5);
      return hashtags;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Upcoming Events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['upcomingEvents'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const events = await base44.entities.SocialEvent.filter({
        status: 'published',
        start_date: { $gte: now }
      }, 'start_date', 3);
      return events;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Featured Adoption Pets
  const { data: adoptionPets = [] } = useQuery({
    queryKey: ['featuredAdoptions'],
    queryFn: async () => {
      const pets = await base44.entities.AdoptionListing.filter({
        status: 'available',
        urgency_level: { $in: ['urgent', 'critical'] }
      }, '-created_date', 3);
      return pets;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  return (
    <div className="space-y-4">
      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Tendências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {trendingHashtags.map((hashtag, idx) => (
              <motion.div
                key={hashtag.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => navigate(createPageUrl(`SocialFeed?hashtag=${hashtag.hashtag}`))}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-gray-900">#{hashtag.hashtag}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {hashtag.usage_count} posts
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                Próximos Eventos
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('SocialEvents'))}
                className="text-xs h-7"
              >
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                onClick={() => navigate(createPageUrl(`SocialEvents?id=${event.id}`))}
              >
                <p className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">{event.title}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{event.city}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(event.start_date).toLocaleDateString('pt-PT', { 
                    day: 'numeric', 
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Featured Adoptions */}
      {adoptionPets.length > 0 && (
        <Card className="border border-pink-200 shadow-sm bg-gradient-to-br from-pink-50 to-rose-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-600" />
                Adote Urgente
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('AdoptionListings'))}
                className="text-xs h-7"
              >
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {adoptionPets.map((pet, idx) => (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2 p-2 bg-white hover:bg-pink-50 rounded-lg cursor-pointer transition-colors border border-pink-100"
                onClick={() => navigate(createPageUrl(`AdoptionListingDetails?id=${pet.id}`))}
              >
                {pet.photos?.[0] ? (
                  <img 
                    src={pet.photos[0]} 
                    alt={pet.pet_name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center text-2xl">
                    🐕
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{pet.pet_name}</p>
                  <div className="flex items-center gap-1">
                    <Badge 
                      className={`text-xs ${
                        pet.urgency_level === 'critical' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-orange-500 text-white'
                      }`}
                    >
                      {pet.urgency_level === 'critical' ? '🚨 Crítico' : '⚡ Urgente'}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Create Event */}
      <Card className="border border-blue-200 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <Button
            onClick={() => navigate(createPageUrl('SocialEvents'))}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Criar Evento
          </Button>
          <p className="text-xs text-gray-600 text-center mt-2">
            Organize passeios, encontros e mais! 🎉
          </p>
        </CardContent>
      </Card>
    </div>
  );
}