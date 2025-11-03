import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, TrendingUp, DollarSign, Clock, Award, Crown, Medal, Zap, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function Leaderboard() {
  const { language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("earnings");
  const [previousRankings, setPreviousRankings] = useState({});
  const [rankChanges, setRankChanges] = useState({});

  const { data: walkers, isLoading: loadingWalkers } = useQuery({
    queryKey: ['allWalkers'],
    queryFn: () => base44.entities.WalkerProfile.filter({ is_active: true }),
    initialData: [],
  });

  const { data: trainers, isLoading: loadingTrainers } = useQuery({
    queryKey: ['allTrainers'],
    queryFn: () => base44.entities.TrainerProfile.filter({ is_active: true }),
    initialData: [],
  });

  const { data: achievements } = useQuery({
    queryKey: ['allAchievements'],
    queryFn: () => base44.entities.ProfessionalAchievement.list(),
    initialData: [],
  });

  const professionals = [...walkers, ...trainers];

  const sortedByEarnings = [...professionals].sort((a, b) => 
    (b.total_earnings || 0) - (a.total_earnings || 0)
  ).slice(0, 50);

  const sortedByRating = [...professionals].filter(p => p.rating).sort((a, b) => 
    (b.rating || 0) - (a.rating || 0) || 
    (b.total_walks || b.total_clients || 0) - (a.total_walks || a.total_clients || 0)
  ).slice(0, 50);

  const sortedByBookings = [...professionals].sort((a, b) => 
    (b.total_walks || b.total_clients || 0) - (a.total_walks || a.total_clients || 0)
  ).slice(0, 50);

  // Track ranking changes
  useEffect(() => {
    const getCurrentRankings = () => {
      const rankings = {};
      sortedByEarnings.forEach((prof, idx) => {
        rankings[`${prof.id}_earnings`] = idx + 1;
      });
      sortedByRating.forEach((prof, idx) => {
        rankings[`${prof.id}_rating`] = idx + 1;
      });
      sortedByBookings.forEach((prof, idx) => {
        rankings[`${prof.id}_bookings`] = idx + 1;
      });
      return rankings;
    };

    const current = getCurrentRankings();
    
    if (Object.keys(previousRankings).length > 0) {
      const changes = {};
      Object.keys(current).forEach(key => {
        if (previousRankings[key] && previousRankings[key] !== current[key]) {
          changes[key] = previousRankings[key] - current[key]; // positive = moved up
        }
      });
      setRankChanges(changes);
      
      // Clear changes after animation
      setTimeout(() => setRankChanges({}), 3000);
    }
    
    setPreviousRankings(current);
  }, [sortedByEarnings, sortedByRating, sortedByBookings]);

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Crown className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-yellow-500" />;
      case 2: return <Medal className="w-4 h-4 md:w-5 md:h-5 text-gray-400 fill-gray-400" />;
      case 3: return <Medal className="w-4 h-4 md:w-5 md:h-5 text-orange-600 fill-orange-600" />;
      default: return <span className="text-sm md:text-base font-bold text-gray-600">#{rank}</span>;
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

  const getAchievementCount = (email) => {
    const prof = achievements.find(a => a.professional_email === email);
    return prof?.total_achievements || 0;
  };

  const getRankChange = (profId, category) => {
    return rankChanges[`${profId}_${category}`];
  };

  const renderLeaderboardCard = (professional, rank, type) => {
    const isWalker = !!professional.walker_name;
    const name = isWalker ? professional.walker_name : professional.trainer_name;
    const achievementCount = getAchievementCount(professional.created_by);
    const rankChange = getRankChange(professional.id, type);

    return (
      <motion.div
        key={professional.id}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.2, delay: rank * 0.02 }}
      >
        <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden ${
          rank <= 3 ? 'ring-1 ring-offset-1' : ''
        } ${
          rank === 1 ? 'ring-yellow-400' :
          rank === 2 ? 'ring-gray-400' :
          rank === 3 ? 'ring-orange-400' : ''
        }`}>
          {/* Rank Change Indicator */}
          <AnimatePresence>
            {rankChange && rankChange > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.5 }}
                className="absolute top-2 right-2 z-10"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.2, 1, 1.2, 1]
                  }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="bg-green-500 text-white rounded-full p-1.5 shadow-lg flex items-center gap-1"
                >
                  <TrendingUp className="w-3 h-3" />
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs font-bold">+{rankChange}</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <CardContent className="p-2 md:p-3">
            <div className="flex items-center gap-2 md:gap-3">
              {/* Rank Badge - Compact */}
              <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br ${getRankBgColor(rank)} rounded-lg flex items-center justify-center shadow-md flex-shrink-0`}>
                {getRankIcon(rank)}
              </div>

              {/* Profile Photo - Compact */}
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                {professional.photo_url ? (
                  <img
                    src={professional.photo_url}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info - Compact */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <h3 className="font-bold text-sm md:text-base text-gray-900 truncate">
                    {name}
                  </h3>
                  {rank <= 3 && (
                    <Trophy className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ${
                      rank === 1 ? 'text-yellow-500' :
                      rank === 2 ? 'text-gray-400' :
                      'text-orange-500'
                    }`} />
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-600">
                  <span className="flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-yellow-400 text-yellow-400" />
                    {professional.rating?.toFixed(1) || 'N/A'}
                  </span>
                  <span className="truncate">
                    {professional.total_walks || professional.total_clients || 0} {isWalker ? 'walks' : 'clientes'}
                  </span>
                  {achievementCount > 0 && (
                    <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1 py-0 h-4">
                      <Award className="w-2 h-2 mr-0.5" />
                      {achievementCount}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats - Compact */}
              <div className="text-right flex-shrink-0">
                {type === 'earnings' && (
                  <>
                    <div className="text-base md:text-xl font-bold text-green-600">
                      €{(professional.total_earnings || 0).toFixed(0)}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-500">Total</div>
                  </>
                )}
                {type === 'rating' && (
                  <>
                    <div className="text-base md:text-xl font-bold text-yellow-600">
                      {professional.rating?.toFixed(2) || 'N/A'}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-500">Rating</div>
                  </>
                )}
                {type === 'bookings' && (
                  <>
                    <div className="text-base md:text-xl font-bold text-blue-600">
                      {professional.total_walks || professional.total_clients || 0}
                    </div>
                    <div className="text-[10px] md:text-xs text-gray-500">{isWalker ? 'Walks' : 'Clientes'}</div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (loadingWalkers || loadingTrainers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-3 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-24 md:h-32 rounded-3xl mb-4 md:mb-8" />
          <div className="space-y-2 md:space-y-3">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 md:h-20 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 md:mb-6"
        >
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2 md:mb-3 shadow-2xl">
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
            🏆 Leaderboard PawCão
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            {language === 'pt' ? 'Os melhores profissionais da plataforma' : 'Top professionals on the platform'}
          </p>
        </motion.div>

        {/* Top 3 Podium - Compact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4 md:mb-6"
        >
          <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-3 md:p-6">
              <div className="grid md:grid-cols-3 gap-3 md:gap-4">
                {/* 2nd Place */}
                {sortedByEarnings[1] && (
                  <div className="text-center">
                    <div className="relative inline-block mb-2">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 md:border-3 border-gray-400 shadow-lg">
                        {sortedByEarnings[1].photo_url ? (
                          <img src={sortedByEarnings[1].photo_url} alt="2nd" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {(sortedByEarnings[1].walker_name || sortedByEarnings[1].trainer_name)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm md:text-base text-gray-900 mb-0.5 truncate px-2">
                      {sortedByEarnings[1].walker_name || sortedByEarnings[1].trainer_name}
                    </h3>
                    <p className="text-lg md:text-xl font-bold text-gray-600">
                      €{(sortedByEarnings[1].total_earnings || 0).toFixed(0)}
                    </p>
                  </div>
                )}

                {/* 1st Place */}
                {sortedByEarnings[0] && (
                  <div className="text-center md:order-first md:col-start-2">
                    <div className="relative inline-block mb-2">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-2 -right-2 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl"
                      >
                        <Crown className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
                      </motion.div>
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 md:border-3 border-yellow-400 shadow-2xl">
                        {sortedByEarnings[0].photo_url ? (
                          <img src={sortedByEarnings[0].photo_url} alt="1st" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">
                              {(sortedByEarnings[0].walker_name || sortedByEarnings[0].trainer_name)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-2 border-white shadow-xl">
                        <span className="text-white font-bold text-base">1</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-base md:text-lg text-gray-900 mb-0.5 truncate px-2">
                      {sortedByEarnings[0].walker_name || sortedByEarnings[0].trainer_name}
                    </h3>
                    <p className="text-xl md:text-2xl font-bold text-yellow-600">
                      €{(sortedByEarnings[0].total_earnings || 0).toFixed(0)}
                    </p>
                    <Badge className="mt-1 bg-yellow-500 text-white text-[10px] md:text-xs">
                      👑 Top Earner
                    </Badge>
                  </div>
                )}

                {/* 3rd Place */}
                {sortedByEarnings[2] && (
                  <div className="text-center">
                    <div className="relative inline-block mb-2">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 md:border-3 border-orange-500 shadow-lg">
                        {sortedByEarnings[2].photo_url ? (
                          <img src={sortedByEarnings[2].photo_url} alt="3rd" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {(sortedByEarnings[2].walker_name || sortedByEarnings[2].trainer_name)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <span className="text-white font-bold text-sm">3</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-sm md:text-base text-gray-900 mb-0.5 truncate px-2">
                      {sortedByEarnings[2].walker_name || sortedByEarnings[2].trainer_name}
                    </h3>
                    <p className="text-lg md:text-xl font-bold text-orange-600">
                      €{(sortedByEarnings[2].total_earnings || 0).toFixed(0)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Tabs - Compact */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 h-10 md:h-12 bg-white shadow-lg rounded-xl p-1">
            <TabsTrigger 
              value="earnings" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-lg text-xs md:text-sm"
            >
              <DollarSign className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Ganhos
            </TabsTrigger>
            <TabsTrigger 
              value="rating"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white rounded-lg text-xs md:text-sm"
            >
              <Star className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Rating
            </TabsTrigger>
            <TabsTrigger 
              value="bookings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg text-xs md:text-sm"
            >
              <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
              Reservas
            </TabsTrigger>
          </TabsList>

          {/* Leaderboards - Compact */}
          <TabsContent value="earnings">
            <div className="space-y-1.5 md:space-y-2">
              <AnimatePresence mode="popLayout">
                {sortedByEarnings.map((prof, idx) => 
                  renderLeaderboardCard(prof, idx + 1, 'earnings')
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="rating">
            <div className="space-y-1.5 md:space-y-2">
              <AnimatePresence mode="popLayout">
                {sortedByRating.map((prof, idx) => 
                  renderLeaderboardCard(prof, idx + 1, 'rating')
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-1.5 md:space-y-2">
              <AnimatePresence mode="popLayout">
                {sortedByBookings.map((prof, idx) => 
                  renderLeaderboardCard(prof, idx + 1, 'bookings')
                )}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}