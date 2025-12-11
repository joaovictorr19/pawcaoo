import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, Star, TrendingUp, Crown, Medal, Zap, Sparkles, 
  Award, Flame, MessageCircle, Heart, Camera, Info, Dog, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

export default function Leaderboard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("xp");

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboardData'],
    queryFn: async () => {
      const [profiles, walkers, dogs, badges] = await Promise.all([
        base44.entities.UserProfile.list(null, 100),
        base44.entities.WalkerProfile.filter({ is_active: true }, '-total_walks', 100),
        base44.entities.DogProfile.list(null, 100),
        base44.entities.UserBadge.list()
      ]);

      // Process User Profiles (XP)
      const users = profiles.map(p => {
        // Find badges for this user
        const userBadges = badges.filter(b => b.user_email === p.user_email);
        // Resolve pinned badges
        const pinnedBadges = (p.pinned_badge_ids || [])
          .map(id => userBadges.find(b => b.badge_id === id || b.id === id))
          .filter(Boolean);

        return {
          id: p.user_id || p.id,
          name: p.full_name,
          photo: p.profile_photo_url,
          secondary: `${p.gamification_xp || 0} XP`,
          value: p.gamification_xp || 0,
          badges: userBadges,
          pinnedBadges: pinnedBadges.slice(0, 2), // Take top 2
          isVerified: p.is_verified,
          type: 'user',
          email: p.user_email
        };
      }).sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

      // Process Walkers
      const topWalkers = walkers.map(w => ({
        id: w.id,
        name: w.walker_name,
        photo: w.photo_url,
        secondary: `${w.total_walks || 0} ${language === 'pt' ? 'Passeios' : 'Walks'}`,
        value: w.total_walks || 0,
        isVerified: w.verification_status === 'verified',
        rating: w.rating,
        type: 'walker',
        email: w.created_by
      })).sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

      // Process Dogs - Real popularity from total_walks
      const popularDogs = dogs.map(d => ({
        id: d.id,
        name: d.dog_name,
        photo: d.photo_url,
        secondary: d.breed,
        value: d.total_walks || 0, // Real data from schema
        type: 'dog',
        owner_email: d.owner_email
      })).sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));

      return { users, walkers: topWalkers, dogs: popularDogs };
    },
    initialData: { users: [], walkers: [], dogs: [] },
  });

  const activeList = useMemo(() => {
    switch(activeCategory) {
      case 'walkers': return leaderboardData.walkers;
      case 'dogs': return leaderboardData.dogs;
      case 'xp': default: return leaderboardData.users;
    }
  }, [activeCategory, leaderboardData]);

  const userRank = useMemo(() => {
    if (!currentUser || activeCategory === 'dogs') return null;
    const index = activeList.findIndex(u => u.email === currentUser.email);
    return index !== -1 ? { rank: index + 1, data: activeList[index] } : null;
  }, [currentUser, activeList, activeCategory]);

  const getPodiumStyle = (rank) => {
    if (rank === 1) return "border-yellow-400/80 bg-gradient-to-br from-yellow-200/80 via-yellow-50/50 to-white/90 scale-110 z-20 shadow-[0_10px_40px_-10px_rgba(234,179,8,0.6)] ring-4 ring-yellow-400/20 transform-gpu";
    if (rank === 2) return "border-slate-300/80 bg-gradient-to-br from-slate-200/80 via-slate-50/50 to-white/90 mt-8 z-10 shadow-[0_10px_30px_-10px_rgba(148,163,184,0.4)] ring-2 ring-slate-300/20 transform-gpu";
    if (rank === 3) return "border-orange-300/80 bg-gradient-to-br from-orange-200/80 via-orange-50/50 to-white/90 mt-16 z-0 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.4)] ring-2 ring-orange-300/20 transform-gpu";
    return "";
  };

  const renderBadge = (badge, idx) => (
    <div key={idx} className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/90 border border-white/50 shadow-sm flex items-center justify-center text-[10px] md:text-xs" title={badge.name}>
      {badge.icon || (badge.rarity === 'legendary' ? '👑' : '🛡️')}
    </div>
  );

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Skeleton className="w-full max-w-md h-96" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pb-20">
      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .gold-gradient-text {
          background: linear-gradient(to bottom, #FCD34D, #D97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 pt-8">
        <h1 className="text-3xl md:text-4xl font-black text-center text-gray-900 mb-2 tracking-tight">
          Ranking Global
        </h1>
        <p className="text-center text-gray-500 mb-8">Quem são as lendas da comunidade PawCão?</p>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full mb-12">
          <TabsList className="grid w-full grid-cols-3 h-12 bg-white/80 backdrop-blur p-1 rounded-xl shadow-sm border border-white/50">
            <TabsTrigger value="xp" className="rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 font-bold">
              <TrendingUp className="w-4 h-4 mr-2" />
              Top Jogadores
            </TabsTrigger>
            <TabsTrigger value="walkers" className="rounded-lg data-[state=active]:bg-green-100 data-[state=active]:text-green-700 font-bold">
              <Dog className="w-4 h-4 mr-2" />
              Top Passeadores
            </TabsTrigger>
            <TabsTrigger value="dogs" className="rounded-lg data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700 font-bold">
              <Heart className="w-4 h-4 mr-2" />
              Cães Populares
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            {/* PODIUM SECTION */}
            <div className="flex justify-center items-end gap-2 md:gap-6 mb-12 px-2">
              {[1, 0, 2].map((idx) => {
                const item = activeList[idx];
                const rank = idx + 1;
                
                // Placeholder para posições vazias
                if (!item) {
                  return (
                    <div key={idx} className={`relative flex flex-col items-center flex-1 md:w-40 md:flex-none ${rank === 1 ? '-mt-10 mb-10' : ''} opacity-50 grayscale`}>
                       <div className={`
                        relative rounded-2xl p-4 w-full h-40 flex flex-col items-center justify-center text-center
                        border-2 border-dashed border-gray-300 bg-gray-50/50
                        ${rank === 2 ? 'mt-8' : rank === 3 ? 'mt-16' : ''}
                      `}>
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                           <span className="text-gray-400 font-bold">#{rank}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium">Vago</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={item.id}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.15 }}
                    className={`relative flex flex-col items-center flex-1 md:w-40 md:flex-none cursor-pointer ${rank === 1 ? '-mt-6 mb-6' : ''}`}
                    onClick={() => {
                        if(item.type === 'user') navigate(createPageUrl(`UserProfile?email=${item.email}`));
                        if(item.type === 'walker') navigate(createPageUrl(`WalkerDetails?id=${item.id}`));
                    }}
                  >
                    <div className={`
                      relative rounded-2xl p-4 w-full flex flex-col items-center text-center
                      border-2 backdrop-blur-xl transition-all duration-300
                      ${getPodiumStyle(rank)}
                    `}>
                      <div className="relative overflow-visible w-fit mx-auto">
                        {rank === 1 && (
                          <>
                            <div className="absolute -top-[45px] left-1/2 -translate-x-1/2 z-50">
                              <motion.div 
                                animate={{ y: [-5, 5, -5] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="filter drop-shadow-xl"
                              >
                                <Crown className="w-12 h-12 text-yellow-500 fill-yellow-300" />
                              </motion.div>
                            </div>
                            <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full -z-10 animate-pulse" />
                          </>
                        )}
                        <Avatar className={`relative z-10 w-16 h-16 md:w-24 md:h-24 border-[4px] mb-3 shadow-xl ${
                          rank === 1 ? 'border-yellow-400 ring-2 ring-yellow-200 ring-offset-2' : 
                          rank === 2 ? 'border-slate-300 ring-2 ring-slate-200 ring-offset-2' : 
                          'border-orange-400 ring-2 ring-orange-200 ring-offset-2'
                        }`}>
                          <AvatarImage src={item.photo} className="object-cover" />
                          <AvatarFallback className="font-bold text-xl">{item.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <Badge className={`
                          absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs md:text-sm font-black z-20 tracking-wider
                          ${rank === 1 ? 'bg-yellow-400 text-yellow-900' : rank === 2 ? 'bg-slate-400 text-white' : 'bg-orange-400 text-white'}
                          shadow-lg border-2 border-white ring-1 ring-black/5
                        `}>
                          #{rank}
                        </Badge>
                      </div>

                      <div className="mt-3 w-full overflow-hidden">
                        <h3 className="font-bold text-gray-900 truncate text-sm md:text-base flex items-center justify-center gap-1">
                          {item.name}
                          {item.isVerified && <VerifiedBadge className="w-3 h-3" />}
                        </h3>
                        <p className={`text-xs md:text-sm font-bold mt-1 ${
                          activeCategory === 'dogs' ? 'text-pink-500' : 'text-purple-600'
                        }`}>
                          {activeCategory === 'dogs' ? '❤️' : ''} {item.value} {activeCategory === 'xp' ? 'XP' : ''}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate opacity-80">{item.secondary}</p>
                      </div>

                      {/* Pinned Badges */}
                      {item.pinnedBadges && item.pinnedBadges.length > 0 && (
                        <div className="flex gap-[-4px] mt-2">
                          {item.pinnedBadges.map((b, i) => (
                            <div key={i} className="-ml-2 first:ml-0 transform hover:scale-110 transition-transform">
                              {renderBadge(b, i)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* LIST SECTION (4th - 50th) */}
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
              {activeList.slice(3).map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center p-4 border-b border-gray-100/50 hover:bg-white/50 transition-colors cursor-pointer group"
                  onClick={() => {
                      if(item.type === 'user') navigate(createPageUrl(`UserProfile?email=${item.email}`));
                      if(item.type === 'walker') navigate(createPageUrl(`WalkerDetails?id=${item.id}`));
                  }}
                >
                  <div className="w-8 text-center font-bold text-gray-400 group-hover:text-purple-600 transition-colors">
                    {idx + 4}
                  </div>
                  
                  <Avatar className="w-10 h-10 md:w-12 md:h-12 ml-4 border-2 border-white shadow-sm">
                    <AvatarImage src={item.photo} />
                    <AvatarFallback>{item.name?.[0]}</AvatarFallback>
                  </Avatar>

                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                      {item.isVerified && <VerifiedBadge className="w-4 h-4" />}
                      
                      {/* Inline Badges in List */}
                      {item.pinnedBadges && (
                        <div className="flex gap-1 ml-2 opacity-80">
                          {item.pinnedBadges.map(b => (
                            <span key={b.id} title={b.name} className="text-xs filter grayscale group-hover:grayscale-0 transition-all">
                              {b.icon || '🛡️'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{item.secondary}</p>
                  </div>

                  <div className="text-right font-bold text-gray-700">
                    {item.value}
                    <span className="text-xs text-gray-400 ml-1 font-normal">
                      {activeCategory === 'xp' ? 'XP' : activeCategory === 'dogs' ? 'Likes' : ''}
                    </span>
                  </div>
                </motion.div>
              ))}
              
              {activeList.length <= 3 && (
                <div className="p-8 text-center text-gray-500">
                  Não há mais competidores nesta categoria.
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </div>

      {/* STICKY FOOTER (Your Position) */}
      {userRank && userRank.rank > 10 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 shadow-2xl z-50"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-purple-600 text-white font-bold w-8 h-8 flex items-center justify-center rounded-full">
                #{userRank.rank}
              </div>
              <Avatar className="w-10 h-10 border border-gray-200">
                <AvatarImage src={userRank.data.photo} />
                <AvatarFallback>EU</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-gray-900">A tua posição</p>
                <p className="text-xs text-gray-500">Continua a subir!</p>
              </div>
            </div>
            <div className="font-bold text-purple-600 text-lg">
              {userRank.data.value} XP
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}