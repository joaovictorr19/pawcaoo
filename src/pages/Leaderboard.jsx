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
  Award, Flame, MessageCircle, Heart, Camera 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("xp");

  const { data: allUsers, isLoading } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  // Leaderboards by category
  const sortedByXP = [...allUsers]
    .filter(u => (u.gamification_xp || 0) > 0)
    .sort((a, b) => (b.gamification_xp || 0) - (a.gamification_xp || 0))
    .slice(0, 50);

  const sortedByLevel = [...allUsers]
    .filter(u => (u.gamification_level || 1) > 1)
    .sort((a, b) => 
      (b.gamification_level || 1) - (a.gamification_level || 1) ||
      (b.gamification_xp || 0) - (a.gamification_xp || 0)
    )
    .slice(0, 50);

  const sortedByBadges = [...allUsers]
    .filter(u => (u.public_badges?.length || 0) > 0)
    .sort((a, b) => (b.public_badges?.length || 0) - (a.public_badges?.length || 0))
    .slice(0, 50);

  const sortedByStreak = [...allUsers]
    .filter(u => (u.daily_streak || 0) > 0)
    .sort((a, b) => (b.daily_streak || 0) - (a.daily_streak || 0))
    .slice(0, 50);

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
    return user.public_badges?.filter(b => b.rarity === rarity).length || 0;
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
                  <span>Nível {user.gamification_level || 1}</span>
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
                    <div className="text-xs text-gray-500">Nível</div>
                  </>
                )}
                {type === 'badges' && (
                  <>
                    <div className="text-xl font-bold text-blue-600">
                      {user.public_badges?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Emblemas</div>
                  </>
                )}
                {type === 'streak' && (
                  <>
                    <div className="text-xl font-bold text-orange-600 flex items-center justify-end">
                      <Flame className="w-5 h-5 mr-1" />
                      {user.daily_streak || 0}
                    </div>
                    <div className="text-xs text-gray-500">Dias</div>
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
            🏆 Leaderboard Dog Connect
          </h1>
          <p className="text-gray-600">
            Os membros mais ativos e engajados da comunidade
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                {/* 2nd Place */}
                {sortedByXP[1] && (
                  <div className="text-center">
                    <div className="relative inline-block mb-2">
                      <Avatar className="w-20 h-20 border-3 border-gray-400 shadow-lg">
                        <AvatarImage src={sortedByXP[1].profile_photo_url} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xl">
                          {sortedByXP[1].full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-1 truncate">
                      {sortedByXP[1].full_name}
                    </h3>
                    <p className="text-xl font-bold text-gray-600">
                      {sortedByXP[1].gamification_xp || 0} XP
                    </p>
                    <Badge className="bg-gray-400 text-white text-xs mt-1">
                      Nível {sortedByXP[1].gamification_level || 1}
                    </Badge>
                  </div>
                )}

                {/* 1st Place */}
                {sortedByXP[0] && (
                  <div className="text-center md:order-first md:col-start-2">
                    <div className="relative inline-block mb-2">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl z-10"
                      >
                        <Crown className="w-6 h-6 text-white fill-white" />
                      </motion.div>
                      <Avatar className="w-24 h-24 border-3 border-yellow-400 shadow-2xl">
                        <AvatarImage src={sortedByXP[0].profile_photo_url} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-2xl">
                          {sortedByXP[0].full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white shadow-xl">
                        <span className="text-white font-bold">1</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
                      {sortedByXP[0].full_name}
                    </h3>
                    <p className="text-2xl font-bold text-yellow-600">
                      {sortedByXP[0].gamification_xp || 0} XP
                    </p>
                    <Badge className="bg-yellow-500 text-white text-xs mt-1">
                      👑 Nível {sortedByXP[0].gamification_level || 1}
                    </Badge>
                  </div>
                )}

                {/* 3rd Place */}
                {sortedByXP[2] && (
                  <div className="text-center">
                    <div className="relative inline-block mb-2">
                      <Avatar className="w-20 h-20 border-3 border-orange-500 shadow-lg">
                        <AvatarImage src={sortedByXP[2].profile_photo_url} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-600 to-blue-600 text-white text-xl">
                          {sortedByXP[2].full_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-gray-900 mb-1 truncate">
                      {sortedByXP[2].full_name}
                    </h3>
                    <p className="text-xl font-bold text-orange-600">
                      {sortedByXP[2].gamification_xp || 0} XP
                    </p>
                    <Badge className="bg-orange-400 text-white text-xs mt-1">
                      Nível {sortedByXP[2].gamification_level || 1}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-12 bg-white shadow-lg rounded-xl p-1">
            <TabsTrigger 
              value="xp" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg"
            >
              <Zap className="w-4 h-4 mr-1" />
              XP Total
            </TabsTrigger>
            <TabsTrigger 
              value="level"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white rounded-lg"
            >
              <Trophy className="w-4 h-4 mr-1" />
              Nível
            </TabsTrigger>
            <TabsTrigger 
              value="badges"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg"
            >
              <Award className="w-4 h-4 mr-1" />
              Emblemas
            </TabsTrigger>
            <TabsTrigger 
              value="streak"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg"
            >
              <Flame className="w-4 h-4 mr-1" />
              Streak
            </TabsTrigger>
          </TabsList>

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