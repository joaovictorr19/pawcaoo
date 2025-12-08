import React, { useEffect, useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ThumbsUp, User, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function PersonalizedRecommendations({ user }) {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingAI, setIsLoadingAI] = useState(true);

  // 1. Buscar uma amostra de profissionais de alta qualidade
  const { data: topProfessionals, isLoading: isLoadingData } = useQuery({
    queryKey: ['topProfessionalsForAI'],
    queryFn: async () => {
      // Busca passeadores e treinadores ativos e bem avaliados e VERIFICADOS
      const walkers = await base44.entities.WalkerProfile.filter({ is_active: true, verification_status: 'verified' }, '-rating', 15);
      return walkers;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });

  // 2. Buscar histórico recente do usuário (reservas) para contexto
  const { data: userHistory } = useQuery({
    queryKey: ['userHistoryForAI', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Booking.filter({ created_by: user.email }, '-created_date', 5);
    },
    enabled: !!user?.email,
  });

  useEffect(() => {
    const generateRecommendations = async () => {
      if (!user || !topProfessionals || topProfessionals.length === 0) {
        setIsLoadingAI(false);
        return;
      }

      setIsLoadingAI(true);
      try {
        // Preparar dados minificados para o LLM (para economizar tokens)
        const candidates = topProfessionals.map(p => ({
          id: p.id,
          name: p.walker_name,
          bio: p.bio?.substring(0, 100),
          location: p.location,
          services: p.services_offered?.map(s => s.service_name).join(', '),
          specialties: p.specializations?.join(', '),
          rating: p.rating
        }));

        const userContext = {
          name: user.full_name,
          location: user.city || "Unknown",
          history: userHistory?.map(h => h.service_type || 'walk').join(', ') || "New user"
        };

        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `
            Act as a matchmaking engine. 
            User Profile: ${JSON.stringify(userContext)}.
            Candidates: ${JSON.stringify(candidates)}.
            
            Select the top 3 best matches for this user based on location proximity, service history, and specialties.
            Explain WHY in one short sentence (in Portuguese).
            
            Return JSON:
            {
              "recommendations": [
                { "id": "candidate_id", "reason": "Reason string" }
              ]
            }
          `,
          response_json_schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    reason: { type: "string" }
                  }
                }
              }
            }
          }
        });

        // Cruzar dados do LLM com os objetos completos
        const recs = response.recommendations.map(rec => {
          const fullProfile = topProfessionals.find(p => p.id === rec.id);
          return fullProfile ? { ...fullProfile, ai_reason: rec.reason } : null;
        }).filter(Boolean);

        setRecommendations(recs);

      } catch (error) {
        console.error("AI Recommendation Error:", error);
      } finally {
        setIsLoadingAI(false);
      }
    };

    // Apenas rodar se tivermos os dados
    if (!isLoadingData && topProfessionals?.length > 0) {
      generateRecommendations();
    }
  }, [user, topProfessionals, userHistory, isLoadingData]);

  if (!user) return null;

  if (isLoadingData || isLoadingAI) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-gray-900">A criar recomendações para si...</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 rounded-xl bg-purple-50/50" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-900">Recomendado para {user.full_name?.split(' ')[0]}</h3>
            <p className="text-sm text-gray-500">Baseado no seu perfil e histórico</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="border-purple-100 hover:border-purple-300 transition-all hover:shadow-md group cursor-pointer" onClick={() => navigate(createPageUrl(`WalkerDetails?id=${rec.id}`))}>
            <CardContent className="p-4">
              <div className="flex gap-3 items-start mb-3">
                <img 
                  src={rec.photo_url} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  alt={rec.walker_name}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{rec.walker_name}</h4>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="text-yellow-500 mr-1">★</span> {rec.rating.toFixed(1)}
                    <span className="mx-1">•</span>
                    {rec.location}
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-2 rounded-lg mb-3">
                <p className="text-xs text-purple-800 italic flex gap-2">
                  <ThumbsUp className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  "{rec.ai_reason}"
                </p>
              </div>

              <div className="flex justify-between items-center">
                <Badge variant="outline" className="text-xs font-normal">
                  {rec.experience_years} anos exp.
                </Badge>
                <span className="text-sm font-bold text-green-700">
                  €{rec.hourly_rate}/h
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}