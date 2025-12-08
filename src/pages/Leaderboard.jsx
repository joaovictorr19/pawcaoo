import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, Star, TrendingUp, Crown, Medal, Zap, Sparkles, 
  Award, Flame, MessageCircle, Heart, Camera, Info 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Leaderboard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("xp");

  const { data: leaderboardData, isLoading } = useQuery({
    queryKey: ['leaderboardData'],
    queryFn: async () => {
      const [profiles, points, badges, users] = await Promise.all([
        base44.entities.UserProfile.list(),
        base44.entities.LoyaltyPoints.list(),
        base44.entities.UserBadge.list(),
        base44.entities.User.list()
      ]);

      // Create a map of users by email
      const userMap = new Map();
      users.forEach(u => {
        userMap.set(u.email, {
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          profile_photo_url: null, // Will be updated from profile if exists
          gamification_xp: 0,
          gamification_level: 1,
          badges_count: 0,
          daily_streak: 0,
          ...u // Keep other props
        });
      });

      // Merge Profile Data (XP, Level, Streak)
      profiles.forEach(p => {
        if (userMap.has(p.user_email)) {
          const user = userMap.get(p.user_email);
          user.profile_photo_url = p.profile_photo_url || user.profile_photo_url;
          user.gamification_xp = p.gamification_xp || 0;
          user.gamification_level = p.gamification_level || 1;
          user.daily_streak = p.daily_streak || 0;
          user.badges_count = p.badges_count || 0;
        } else {
          // If user not in User list (rare), add from profile
          userMap.set(p.user_email, {
            id: p.id,
            email: p.user_email,
            full_name: p.full_name || p.user_email.split('@')[0],
            profile_photo_url: p.profile_photo_url,
            gamification_xp: p.gamification_xp || 0,
            gamification_level: p.gamification_level || 1,
            badges_count: p.badges_count || 0,
            daily_streak: p.daily_streak || 0
          });
        }
      });

      // Merge Loyalty Points (Fallback for XP if 0)
      points.forEach(pt => {
        if (userMap.has(pt.user_email)) {
          const user = userMap.get(pt.user_email);
          // If XP is 0 but has points, use points as XP proxy
          if (user.gamification_xp === 0 && pt.total_earned > 0) {
            user.gamification_xp = pt.total_earned;
            user.gamification_level = 1 + Math.floor(pt.total_earned / 1000);
          }
        }
      });

      // Merge Badges Count & Rarity (Calculate real stats)
      const badgeStats = {};
      badges.forEach(b => {
        if (!badgeStats[b.user_email]) {
          badgeStats[b.user_email] = { count: 0, rarities: { legendary: 0, epic: 0, rare: 0, common: 0 } };
        }
        badgeStats[b.user_email].count++;
        if (b.rarity) {
          badgeStats[b.user_email].rarities[b.rarity] = (badgeStats[b.user_email].rarities[b.rarity] || 0) + 1;
        }
      });
      
      Object.keys(badgeStats).forEach(email => {
        if (userMap.has(email)) {
          const user = userMap.get(email);
          // Update count
          user.badges_count = Math.max(user.badges_count || 0, badgeStats[email].count);
          // Store rarities for display
          user.badge_rarities = badgeStats[email].rarities;
        }
      });

      return Array.from(userMap.values());
    },
    initialData: [],
  });

  // Leaderboards by category
  const sortedByXP = [...leaderboardData]
    .filter(u => (u.gamification_xp || 0) > 0)
    .sort((a, b) => (b.gamification_xp || 0) - (a.gamification_xp || 0))
    .slice(0, 50);

  const sortedByLevel = [...leaderboardData]
    .filter(u => (u.gamification_level || 1) > 1)
    .sort((a, b) => 
      (b.gamification_level || 1) - (a.gamification_level || 1) ||
      (b.gamification_xp || 0) - (a.gamification_xp || 0)
    )
    .slice(0, 50);

  const sortedByBadges = [...leaderboardData]
    .filter(u => (u.badges_count || 0) > 0)
    .sort((a, b) => (b.badges_count || 0) - (a.badges_count || 0))
    .slice(0, 50);

  const sortedByStreak = [...leaderboardData]
    .filter(u => (u.daily_streak || 0) > 0)
    .sort((a, b) => (b.daily_streak || 0) - (a.daily_streak || 0))
    .slice(0, 50);

  const getActiveSortedData = () => {
    switch(activeCategory) {
      case 'level': return sortedByLevel;
      case 'badges': return sortedByBadges;
      case 'streak': return sortedByStreak;
      case 'xp': default: return sortedByXP;
    }
  };

  const activeData = getActiveSortedData();

  const getMetricLabel = (user, type) => {
    switch(type) {
      case 'level': return `${t('level', language)} ${user.gamification_level || 1}`;
      case 'badges': return `${user.badges_count || 0} ${t('badges', language)}`;
      case 'streak': return `${user.daily_streak || 0} ${t('days', language)}`;
      case 'xp': default: return `${user.gamification_xp || 0} XP`;
    }
  };

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400 fill-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-orange-600 fill-orange-600" />;
      default: return <span className="text-base font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank) => {
    switch(rank) {
      case 1: return "from-yellow-400 to-yellow-600";
      case 2: return "from-gray-300 to-gray-500";
      case 3: return "from-orange-400 to-orange-600";
      default: return "from-gray-100 to-gray-200";
    }
  };

  const getRarityCount = (user, rarity) => {
    return user.badge_rarities?.[rarity] || 0;
  };

  const renderLeaderboardCard = (user, rank, type) => {
    const legendaryCount = getRarityCount(user, 'legendary');
    const epicCount = getRarityCount(user, 'epic');
    const rareCount = getRarityCount(user, 'rare');

    return (
      <motion.div
        key={user.id}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, delay: rank * 0.02 }}
        onClick={() => navigate(createPageUrl(`UserProfile?email=${user.email}`))}
        className="cursor-pointer"
      >
        <Card className={`border-0 shadow-md hover:shadow-xl transition-all duration-200 ${
          rank <= 3 ? 'ring-2 ring-offset-2' : ''
        } ${
          rank === 1 ? 'ring-yellow-400' :
          rank === 2 ? 'ring-gray-400' :
          rank === 3 ? 'ring-orange-400' : ''
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {/* Rank Badge */}
              <div className={`w-12 h-12 bg-gradient-to-br ${getRankBgColor(rank)} rounded-lg flex items-center justify-center shadow-md flex-shrink-0`}>
                {getRankIcon(rank)}
              </div>

              {/* Avatar */}
              <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                <AvatarImage src={user.profile_photo_url} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white font-bold">
                  {user.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-base text-gray-900 truncate">
                    {user.full_name}
                  </h3>
                  {user.is_verified && (
                    <Star className="w-4 h-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                  )}
                  {rank <= 3 && (
                    <Trophy className={`w-4 h-4 flex-shrink-0 ${
                      rank === 1 ? 'text-yellow-500' :
                      rank === 2 ? 'text-gray-400' :
                      'text-orange-500'
                    }`} />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
                  {type === 'badges' && (
                    <>
                      {legendaryCount > 0 && (
                        <Badge className="bg-yellow-500 text-white text-xs h-5">
                          🏆 {legendaryCount}
                        </Badge>
                      )}
                      {epicCount > 0 && (
                        <Badge className="bg-purple-500 text-white text-xs h-5">
                          💜 {epicCount}
                        </Badge>
                      )}
                      {rareCount > 0 && (
                        <Badge className="bg-blue-500 text-white text-xs h-5">
                          💎 {rareCount}
                        </Badge>
                      )}
                    </>
                  )}
                  <span>{t('level', language)} {user.gamification_level || 1}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                {type === 'xp' && (
                  <>
                    <div className="text-xl font-bold text-purple-600">
                      {user.gamification_xp || 0}
                    </div>
                    <div className="text-xs text-gray-500">XP</div>
                  </>
                )}
                {type === 'level' && (
                  <>
                    <div className="text-xl font-bold text-yellow-600">
                      {user.gamification_level || 1}
                    </div>
                    <div className="text-xs text-gray-500">{t('level', language)}</div>
                  </>
                )}
                {type === 'badges' && (
                  <>
                    <div className="text-xl font-bold text-blue-600">
                      {user.badges_count || 0}
                    </div>
                    <div className="text-xs text-gray-500">{t('badges', language)}</div>
                  </>
                )}
                {type === 'streak' && (
                  <>
                    <div className="text-xl font-bold text-orange-600 flex items-center justify-end">
                      <Flame className="w-5 h-5 mr-1" />
                      {user.daily_streak || 0}
                    </div>
                    <div className="text-xs text-gray-500">{t('days', language)}</div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-32 rounded-3xl mb-8" />
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xl">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('leaderboardTitle', language)}
          </h1>
          <p className="text-gray-600">
            {t('leaderboardSubtitle', language)}
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <div className="relative pt-20 mb-20 mt-12">
          <div className="flex justify-center items-end gap-4 md:gap-8 max-w-3xl mx-auto h-64">
            
            {/* 2nd Place */}
            {activeData[1] ? (
              <motion.div 
                key={`2nd-${activeCategory}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center w-1/3 md:w-40 relative group cursor-pointer"
                onClick={() => navigate(createPageUrl(`UserProfile?email=${activeData[1].email}`))}
              >
                <div className="relative mb-3 transform transition-transform group-hover:-translate-y-2">
                  <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-slate-300 shadow-xl">
                    <AvatarImage src={activeData[1].profile_photo_url} />
                    <AvatarFallback className="bg-slate-200 text-slate-600 text-xl font-bold">
                      {activeData[1].full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-500 text-white border-2 border-white w-7 h-7 flex items-center justify-center p-0 rounded-full text-sm font-bold shadow-md">2</Badge>
                </div>
                
                <div className="w-full bg-gradient-to-t from-slate-300 via-slate-100 to-white rounded-t-xl p-3 pt-6 text-center shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] h-36 flex flex-col justify-start border-t border-white/60 relative">
                  <h3 className="font-bold text-sm md:text-base text-slate-800 truncate w-full mb-1 px-1">
                    {activeData[1].full_name}
                  </h3>
                  <p className="text-xs md:text-sm font-bold text-slate-600 mb-2">
                    {getMetricLabel(activeData[1], activeCategory)}
                  </p>
                </div>
              </motion.div>
            ) : <div className="w-1/3 md:w-40 h-36" />}

            {/* 1st Place */}
            {activeData[0] ? (
              <motion.div 
                key={`1st-${activeCategory}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center w-1/3 md:w-48 z-10 -mx-2 md:mx-0 relative group cursor-pointer"
                onClick={() => navigate(createPageUrl(`UserProfile?email=${activeData[0].email}`))}
              >
                <div className="relative mb-3 transform transition-transform group-hover:-translate-y-2">
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
                    <Crown className="w-12 h-12 text-yellow-500 fill-yellow-400 drop-shadow-lg animate-[bounce_3s_infinite]" />
                  </div>
                  <Avatar className="w-20 h-20 md:w-28 md:h-28 border-4 border-yellow-400 shadow-2xl ring-4 ring-yellow-100/50">
                    <AvatarImage src={activeData[0].profile_photo_url} />
                    <AvatarFallback className="bg-yellow-100 text-yellow-600 text-3xl font-bold">
                      {activeData[0].full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white border-2 border-white w-8 h-8 flex items-center justify-center p-0 rounded-full text-base font-bold shadow-md">1</Badge>
                </div>
                
                <div className="w-full bg-gradient-to-t from-yellow-400 via-yellow-200 to-yellow-50 rounded-t-xl p-3 pt-8 text-center shadow-[0_10px_30px_-5px_rgba(234,179,8,0.3)] h-48 flex flex-col justify-start border-t-2 border-white/70 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
                  
                  <h3 className="font-bold text-base md:text-lg text-yellow-900 truncate w-full mb-1 relative z-10 px-1">
                    {activeData[0].full_name}
                  </h3>
                  <p className="text-sm md:text-base font-extrabold text-yellow-800 mb-2 relative z-10">
                    {getMetricLabel(activeData[0], activeCategory)}
                  </p>
                  <div className="mt-auto mb-2">
                     <Badge className="bg-white/30 text-yellow-900 hover:bg-white/40 backdrop-blur-sm border-0 shadow-sm">
                        {t('champion', language)}
                     </Badge>
                  </div>
                </div>
              </motion.div>
            ) : <div className="w-1/3 md:w-48 h-48" />}

            {/* 3rd Place */}
            {activeData[2] ? (
              <motion.div 
                key={`3rd-${activeCategory}`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center w-1/3 md:w-40 relative group cursor-pointer"
                onClick={() => navigate(createPageUrl(`UserProfile?email=${activeData[2].email}`))}
              >
                <div className="relative mb-3 transform transition-transform group-hover:-translate-y-2">
                  <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-orange-400 shadow-xl">
                    <AvatarImage src={activeData[2].profile_photo_url} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 text-xl font-bold">
                      {activeData[2].full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white border-2 border-white w-7 h-7 flex items-center justify-center p-0 rounded-full text-sm font-bold shadow-md">3</Badge>
                </div>
                
                <div className="w-full bg-gradient-to-t from-orange-400 via-orange-200 to-orange-50 rounded-t-xl p-3 pt-6 text-center shadow-[0_10px_20px_-5px_rgba(234,88,12,0.2)] h-28 flex flex-col justify-start border-t border-white/60 relative">
                  <h3 className="font-bold text-sm md:text-base text-orange-900 truncate w-full mb-1 px-1">
                    {activeData[2].full_name}
                  </h3>
                  <p className="text-xs md:text-sm font-bold text-orange-800 mb-2">
                    {getMetricLabel(activeData[2], activeCategory)}
                  </p>
                </div>
              </motion.div>
            ) : <div className="w-1/3 md:w-40 h-28" />}
          </div>
          
          {/* Podium Base Decoration */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-4 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-50 blur-sm rounded-full pointer-events-none"></div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-14 bg-white shadow-lg rounded-xl p-1">
            <TabsTrigger 
              value="xp" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg text-xs md:text-sm"
            >
              <Zap className="w-4 h-4 mr-1" />
              {t('totalXP', language)}
            </TabsTrigger>
            <TabsTrigger 
              value="level"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white rounded-lg text-xs md:text-sm"
            >
              <Trophy className="w-4 h-4 mr-1" />
              {t('level', language)}
            </TabsTrigger>
            <TabsTrigger 
              value="badges"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg text-xs md:text-sm"
            >
              <Award className="w-4 h-4 mr-1" />
              {t('badges', language)}
            </TabsTrigger>
            <TabsTrigger 
              value="streak"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg text-xs md:text-sm"
            >
              <Flame className="w-4 h-4 mr-1" />
              {t('streak', language)}
            </TabsTrigger>
          </TabsList>

          <div className="bg-white/50 p-3 rounded-lg text-center mb-4 text-sm text-gray-600 flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span>
              {activeCategory === 'streak' 
                ? t('streakDescription', language) 
                : activeCategory === 'badges' 
                  ? "Colecione emblemas completando missões especiais!"
                  : activeCategory === 'level'
                    ? "Suba de nível ganhando XP em atividades na plataforma."
                    : "Acumule XP participando e contratando serviços."}
            </span>
          </div>

          <TabsContent value="xp">
            <div className="space-y-2">
              {sortedByXP.map((user, idx) => 
                renderLeaderboardCard(user, idx + 1, 'xp')
              )}
            </div>
          </TabsContent>

          <TabsContent value="level">
            <div className="space-y-2">
              {sortedByLevel.map((user, idx) => 
                renderLeaderboardCard(user, idx + 1, 'level')
              )}
            </div>
          </TabsContent>

          <TabsContent value="badges">
            <div className="space-y-2">
              {sortedByBadges.map((user, idx) => 
                renderLeaderboardCard(user, idx + 1, 'badges')
              )}
            </div>
          </TabsContent>

          <TabsContent value="streak">
            <div className="space-y-2">
              {sortedByStreak.map((user, idx) => 
                renderLeaderboardCard(user, idx + 1, 'streak')
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}