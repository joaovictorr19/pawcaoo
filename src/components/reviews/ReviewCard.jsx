import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, Heart, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ReviewCard({ review }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: helpfulVotes } = useQuery({
    queryKey: ['reviewHelpful', review.id],
    queryFn: () => base44.entities.ReviewHelpful.filter({ review_id: review.id }),
    initialData: [],
  });

  const userVote = (helpfulVotes || []).find(v => v.user_email === user?.email);
  const helpfulCount = (helpfulVotes || []).filter(v => v.reaction_type === 'helpful' || (v.is_helpful && !v.reaction_type)).length;
  const loveCount = (helpfulVotes || []).filter(v => v.reaction_type === 'love').length;

  const voteMutation = useMutation({
    mutationFn: async (reactionType) => {
      if (userVote) {
        const currentType = userVote.reaction_type || (userVote.is_helpful ? 'helpful' : 'helpful');
        if (currentType === reactionType) {
          await base44.entities.ReviewHelpful.delete(userVote.id);
        } else {
          await base44.entities.ReviewHelpful.update(userVote.id, { 
            is_helpful: true, 
            reaction_type: reactionType 
          });
        }
      } else {
        await base44.entities.ReviewHelpful.create({
          review_id: review.id,
          user_email: user?.email,
          is_helpful: true,
          reaction_type: reactionType
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewHelpful', review.id] });
    },
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
        }`}
      />
    ));
  };

  const renderCategoryStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
        }`}
      />
    ));
  };

  return (
    <Card className="glass-panel border-0 shadow-sm hover:shadow-md transition-all rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className="font-semibold text-base text-slate-900">{review.reviewer_name}</h4>
              {review.is_verified && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verificado
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">{renderStars(review.rating)}</div>
              <span className="text-xs text-slate-400">
                {review.created_date && !isNaN(new Date(review.created_date).getTime()) 
                  ? format(new Date(review.created_date), "MMM d, yyyy") 
                  : "Data desconhecida"}
              </span>
            </div>
          </div>
        </div>

        {review.comment && (
          <p className="text-slate-600 mb-4 leading-relaxed text-sm">{review.comment}</p>
        )}

        {review.categories && (
          <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-slate-50 rounded-xl">
            {review.categories.punctuality && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Pontualidade</div>
                <div className="flex">{renderCategoryStars(review.categories.punctuality)}</div>
              </div>
            )}
            {review.categories.care && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Cuidado</div>
                <div className="flex">{renderCategoryStars(review.categories.care)}</div>
              </div>
            )}
            {review.categories.communication && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Comunicação</div>
                <div className="flex">{renderCategoryStars(review.categories.communication)}</div>
              </div>
            )}
            {review.categories.professionalism && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Profissionalismo</div>
                <div className="flex">{renderCategoryStars(review.categories.professionalism)}</div>
              </div>
            )}
            {review.categories.effectiveness && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Eficácia</div>
                <div className="flex">{renderCategoryStars(review.categories.effectiveness)}</div>
              </div>
            )}
            {review.categories.knowledge && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Conhecimento</div>
                <div className="flex">{renderCategoryStars(review.categories.knowledge)}</div>
              </div>
            )}
          </div>
        )}

        {review.would_recommend !== undefined && (
          <div className="mb-4">
            <Badge className={review.would_recommend ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"}>
              {review.would_recommend ? "Recomenda" : "Não recomenda"}
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => voteMutation.mutate('helpful')}
              disabled={!user || voteMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                (userVote?.reaction_type === 'helpful' || (!userVote?.reaction_type && userVote?.is_helpful))
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              {helpfulCount > 0 && helpfulCount}
            </button>
            <button
              type="button"
              onClick={() => voteMutation.mutate('love')}
              disabled={!user || voteMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                userVote?.reaction_type === 'love'
                  ? 'bg-rose-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${userVote?.reaction_type === 'love' ? 'fill-white' : ''}`} />
              {loveCount > 0 && loveCount}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}