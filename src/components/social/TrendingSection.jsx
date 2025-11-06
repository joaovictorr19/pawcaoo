import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, Calendar, Heart, Hash, MapPin, CheckCircle, Shield, ShieldCheck, Crown } from "lucide-react";
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
    staleTime: 5 * 60 * 1000,
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
    staleTime: 10 * 60 * 1000,
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
    staleTime: 15 * 60 * 1000,
  });

  // Top Contributors (Users com mais posts/atividade)
  const { data: topUsers = [] } = useQuery({
    queryKey: ['topContributors'],
    queryFn: async () => {
      const users = await base44.entities.User.list('-total_posts', 5);
      return users.filter(u => u.total_posts > 0);
    },
    staleTime: 10 * 60 * 1000,
  });

  const getBadgeIcon = (badge) => {
    if (badge.badge_id === 'verified') return <CheckCircle className="w-3 h-3 text-blue-500 fill-blue-500" />;
    if (badge.badge_id === 'admin') return <Shield className="w-3 h-3 text-red-500" />;
    if (badge.badge_id === 'moderator') return <ShieldCheck className="w-3 h-3 text-blue-500" />;
    if (badge.badge_id === 'vip_member') return <Crown className="w-3 h-3 text-yellow-500" />;
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Trending Hashtags */}
      {trendingHashtags.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              Tendências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {trendingHashtags.map((hashtag, idx) => (
              <motion.div
                key={hashtag.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-3 hover:bg-blue-100/50 rounded-xl cursor-pointer transition-all group"
                onClick={() => navigate(createPageUrl(`SocialFeed?hashtag=${hashtag.hashtag}`))}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Hash className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                      #{hashtag.hashtag}
                    </span>
                    <p className="text-xs text-gray-500">{hashtag.usage_count} posts</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 text-xs font-semibold">
                  {idx + 1}º
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Top Contributors */}
      {topUsers.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
              Top da Semana
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {topUsers.map((user, idx) => {
              const badges = user.profile_badges || [];
              const verifiedBadge = badges.find(b => b.badge_id === 'verified');
              const adminBadge = badges.find(b => b.badge_id === 'admin');
              const modBadge = badges.find(b => b.badge_id === 'moderator');
              const vipBadge = badges.find(b => b.badge_id === 'vip_member');

              return (
                <motion.div
                  key={user.email}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-2 hover:bg-purple-100/50 rounded-xl cursor-pointer transition-all group"
                  onClick={() => navigate(createPageUrl(`UserProfile?email=${user.email}`))}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10 border-2 border-purple-300 group-hover:border-purple-500 transition-all">
                      <AvatarImage src={user.profile_photo_url} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                        {user.full_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {(verifiedBadge || adminBadge || modBadge || vipBadge) && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                        {adminBadge && <Shield className="w-3 h-3 text-red-500 fill-red-500" />}
                        {!adminBadge && modBadge && <ShieldCheck className="w-3 h-3 text-blue-500 fill-blue-500" />}
                        {!adminBadge && !modBadge && verifiedBadge && <CheckCircle className="w-3 h-3 text-blue-500 fill-blue-500" />}
                        {!adminBadge && !modBadge && !verifiedBadge && vipBadge && <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                        {user.full_name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{user.total_posts} posts</p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 text-xs font-semibold flex-shrink-0">
                    #{idx + 1}
                  </Badge>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50 overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                Próximos Eventos
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('SocialEvents'))}
                className="text-xs h-7 text-white hover:bg-white/20"
              >
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {upcomingEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 hover:bg-green-100/50 rounded-xl cursor-pointer transition-all border border-green-200"
                onClick={() => navigate(createPageUrl(`SocialEvents?id=${event.id}`))}
              >
                <p className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">{event.title}</p>
                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                  <MapPin className="w-3 h-3 text-green-600" />
                  <span>{event.city}</span>
                </div>
                <p className="text-xs text-gray-500">
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-rose-50 overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
                Adote Urgente
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(createPageUrl('AdoptionListings'))}
                className="text-xs h-7 text-white hover:bg-white/20"
              >
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            {adoptionPets.map((pet, idx) => (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2 p-2 bg-white hover:bg-pink-50 rounded-xl cursor-pointer transition-all border-2 border-pink-200 hover:border-pink-400"
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
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-600 overflow-hidden">
        <CardContent className="p-4">
          <Button
            onClick={() => navigate(createPageUrl('SocialEvents'))}
            className="w-full bg-white hover:bg-gray-100 text-blue-600 font-semibold"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Criar Evento
          </Button>
          <p className="text-xs text-white/80 text-center mt-2">
            Organize passeios, encontros e mais! 🎉
          </p>
        </CardContent>
      </Card>
    </div>
  );
}