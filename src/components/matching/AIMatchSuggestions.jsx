import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, MapPin, Clock, TrendingUp, Heart, ChevronRight, Zap, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { t } from "@/components/translations";

export default function AIMatchSuggestions({ dogProfile, preferences, onMatchSelect }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isLoadingMatches, setIsLoadingMatches] = React.useState(false);

  const { data: matches, isLoading, refetch } = useQuery({
    queryKey: ['aiMatches', dogProfile?.id],
    queryFn: async () => {
      if (!dogProfile) return null;
      
      setIsLoadingMatches(true);
      try {
        const response = await base44.functions.invoke('aiMatchWalker', {
          dogProfile,
          preferences: preferences || {},
          limit: 5
        });
        return response?.data;
      } finally {
        setIsLoadingMatches(false);
      }
    },
    enabled: !!dogProfile,
    staleTime: 5 * 60 * 1000,
  });

  const getScoreColor = (score) => {
    if (score >= 90) return "from-green-500 to-emerald-600";
    if (score >= 75) return "from-blue-500 to-cyan-600";
    if (score >= 60) return "from-yellow-500 to-orange-600";
    return "from-gray-500 to-gray-600";
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return { text: "Match Perfeito", icon: "🌟", color: "bg-green-500" };
    if (score >= 75) return { text: "Excelente Match", icon: "✨", color: "bg-blue-500" };
    if (score >= 60) return { text: "Bom Match", icon: "👍", color: "bg-yellow-500" };
    return { text: "Match OK", icon: "✓", color: "bg-gray-500" };
  };

  if (!dogProfile) {
    return (
      <Card className="glass-panel border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">
            Adicione um perfil de cão para receber sugestões personalizadas
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || isLoadingMatches) {
    return (
      <Card className="glass-panel border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
            IA a Analisar Matches...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!matches?.matches || matches.matches.length === 0) {
    return (
      <Card className="glass-panel border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-4">
            Nenhum match encontrado no momento
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <Zap className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass-panel border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Matches Perfeitos com IA
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Analisámos {matches.total_analyzed} passeadores para encontrar o match ideal para {dogProfile.dog_name}
          </p>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {matches.matches.map((match, index) => {
          const badge = getScoreBadge(match.compatibility_score);
          const walker = match.walker;

          return (
            <motion.div
              key={match.walker_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-panel border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer hover:shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Walker Photo */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={walker.photo_url || '/placeholder-walker.png'}
                        alt={walker.walker_name}
                        className="w-20 h-20 rounded-2xl object-cover shadow-md"
                      />
                      <div className={`absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br ${getScoreColor(match.compatibility_score)} rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
                        <span className="text-white font-bold text-xs">
                          {match.compatibility_score}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            {walker.walker_name}
                            {match.compatibility_score >= 90 && (
                              <Award className="w-5 h-5 text-yellow-500" />
                            )}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <MapPin className="w-4 h-4" />
                            {walker.location}
                            <span className="mx-1">•</span>
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            {walker.rating?.toFixed(1) || '5.0'}
                          </div>
                        </div>
                        <Badge className={`${badge.color} text-white text-xs`}>
                          {badge.icon} {badge.text}
                        </Badge>
                      </div>

                      {/* Best For */}
                      <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-900 font-medium">
                          💡 {match.best_for}
                        </p>
                      </div>

                      {/* Strengths */}
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Pontos Fortes:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.strengths?.slice(0, 3).map((strength, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              ✓ {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Match Reasons */}
                      <div className="space-y-1 mb-3">
                        {match.match_reasons?.slice(0, 2).map((reason, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                            <TrendingUp className="w-3 h-3 mt-0.5 text-purple-500 flex-shrink-0" />
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 flex-1"
                          onClick={() => {
                            if (onMatchSelect) {
                              onMatchSelect(walker);
                            } else {
                              navigate(createPageUrl(`WalkerDetails?id=${walker.id}`));
                            }
                          }}
                        >
                          Ver Perfil
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(createPageUrl(`WalkerDetails?id=${walker.id}`))}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => refetch()}
        disabled={isLoadingMatches}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isLoadingMatches ? 'A Analisar...' : 'Atualizar Matches'}
      </Button>
    </div>
  );
}