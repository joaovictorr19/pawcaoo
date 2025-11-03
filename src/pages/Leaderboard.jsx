import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, TrendingUp, DollarSign, Clock, Award, Crown, Medal, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Leaderboard() {
  const [activeCategory, setActiveCategory] = useState("earnings");

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

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-orange-600 fill-orange-600" />;
      default: return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
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

  const getAchievementCount = (email) => {
    const prof = achievements.find(a => a.professional_email === email);
    return prof?.total_achievements || 0;
  };

  const renderLeaderboardCard = (professional, rank, type) => {
    const isWalker = !!professional.walker_name;
    const name = isWalker ? professional.walker_name : professional.trainer_name;
    const achievementCount = getAchievementCount(professional.created_by);

    return (
      <motion.div
        key={professional.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: rank * 0.03 }}
      >
        <Card className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
          rank <= 3 ? 'ring-2 ring-offset-2' : ''
        } ${
          rank === 1 ? 'ring-yellow-400' :
          rank === 2 ? 'ring-gray-400' :
          rank === 3 ? 'ring-orange-400' : ''
        }`}>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              {/* Rank Badge */}
              <div className={`w-16 h-16 bg-gradient-to-br ${getRankBgColor(rank)} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                {getRankIcon(rank)}
              </div>

              {/* Profile Photo */}
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-4 border-white shadow-lg">
                {professional.photo_url ? (
                  <img
                    src={professional.photo_url}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-gray-900 truncate">
                    {name}
                  </h3>
                  {rank <= 3 && (
                    <Trophy className={`w-5 h-5 ${
                      rank === 1 ? 'text-yellow-500' :
                      rank === 2 ? 'text-gray-400' :
                      'text-orange-500'
                    }`} />
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {professional.rating?.toFixed(1) || 'N/A'}
                  </span>
                  <span>
                    {professional.total_walks || professional.total_clients || 0} {isWalker ? 'walks' : 'clients'}
                  </span>
                  {achievementCount > 0 && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      <Award className="w-3 h-3 mr-1" />
                      {achievementCount}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {professional.location}
                </div>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                {type === 'earnings' && (
                  <>
                    <div className="text-2xl font-bold text-green-600">
                      €{(professional.total_earnings || 0).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">Total Ganho</div>
                  </>
                )}
                {type === 'rating' && (
                  <>
                    <div className="text-2xl font-bold text-yellow-600">
                      {professional.rating?.toFixed(2) || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Rating Médio</div>
                  </>
                )}
                {type === 'bookings' && (
                  <>
                    <div className="text-2xl font-bold text-blue-600">
                      {professional.total_walks || professional.total_clients || 0}
                    </div>
                    <div className="text-xs text-gray-500">{isWalker ? 'Walks' : 'Clientes'}</div>
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-32 rounded-3xl mb-8" />
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            🏆 Leaderboard PawCão
          </h1>
          <p className="text-lg text-gray-600">
            Os melhores profissionais da plataforma
          </p>
        </motion.div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-6">
                {/* 2nd Place */}
                {sortedByEarnings[1] && (
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-400 shadow-xl">
                        {sortedByEarnings[1].photo_url ? (
                          <img
                            src={sortedByEarnings[1].photo_url}
                            alt="2nd place"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">
                              {(sortedByEarnings[1].walker_name || sortedByEarnings[1].trainer_name)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-white font-bold text-lg">2</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {sortedByEarnings[1].walker_name || sortedByEarnings[1].trainer_name}
                    </h3>
                    <p className="text-2xl font-bold text-gray-600">
                      €{(sortedByEarnings[1].total_earnings || 0).toFixed(0)}
                    </p>
                  </div>
                )}

                {/* 1st Place */}
                {sortedByEarnings[0] && (
                  <div className="text-center md:order-first md:col-start-2">
                    <div className="relative inline-block mb-4">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl"
                      >
                        <Crown className="w-10 h-10 text-white fill-white" />
                      </motion.div>
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-yellow-400 shadow-2xl">
                        {sortedByEarnings[0].photo_url ? (
                          <img
                            src={sortedByEarnings[0].photo_url}
                            alt="1st place"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold text-3xl">
                              {(sortedByEarnings[0].walker_name || sortedByEarnings[0].trainer_name)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                        <span className="text-white font-bold text-xl">1</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 mb-1">
                      {sortedByEarnings[0].walker_name || sortedByEarnings[0].trainer_name}
                    </h3>
                    <p className="text-3xl font-bold text-yellow-600">
                      €{(sortedByEarnings[0].total_earnings || 0).toFixed(0)}
                    </p>
                    <Badge className="mt-2 bg-yellow-500 text-white">
                      👑 Top Earner
                    </Badge>
                  </div>
                )}

                {/* 3rd Place */}
                {sortedByEarnings[2] && (
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-500 shadow-xl">
                        {sortedByEarnings[2].photo_url ? (
                          <img
                            src={sortedByEarnings[2].photo_url}
                            alt="3rd place"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                            <span className="text-white font-bold text-2xl">
                              {(sortedByEarnings[2].walker_name || sortedByEarnings[2].trainer_name)?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-white font-bold text-lg">3</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {sortedByEarnings[2].walker_name || sortedByEarnings[2].trainer_name}
                    </h3>
                    <p className="text-2xl font-bold text-orange-600">
                      €{(sortedByEarnings[2].total_earnings || 0).toFixed(0)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 h-14 bg-white shadow-lg rounded-2xl p-2">
            <TabsTrigger 
              value="earnings" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-xl"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Ganhos
            </TabsTrigger>
            <TabsTrigger 
              value="rating"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white rounded-xl"
            >
              <Star className="w-5 h-5 mr-2" />
              Rating
            </TabsTrigger>
            <TabsTrigger 
              value="bookings"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Reservas
            </TabsTrigger>
          </TabsList>

          {/* Earnings Leaderboard */}
          <TabsContent value="earnings">
            <div className="space-y-4">
              {sortedByEarnings.map((prof, idx) => 
                renderLeaderboardCard(prof, idx + 1, 'earnings')
              )}
            </div>
          </TabsContent>

          {/* Rating Leaderboard */}
          <TabsContent value="rating">
            <div className="space-y-4">
              {sortedByRating.map((prof, idx) => 
                renderLeaderboardCard(prof, idx + 1, 'rating')
              )}
            </div>
          </TabsContent>

          {/* Bookings Leaderboard */}
          <TabsContent value="bookings">
            <div className="space-y-4">
              {sortedByBookings.map((prof, idx) => 
                renderLeaderboardCard(prof, idx + 1, 'bookings')
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}