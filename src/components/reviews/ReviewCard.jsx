import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, Heart, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getCurrentUser } from "@/utils/getCurrentUser";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const CATEGORY_LABELS = {
  punctuality: "Pontualidade",
  care: "Cuidado",
  communication: "Comunicação",
  professionalism: "Profissionalismo",
  effectiveness: "Eficácia",
  knowledge: "Conhecimento",
  dog_behavior: "Comportamento",
  owner_communication: "Comunicação",
  payment_promptness: "Processo",
};

export default function ReviewCard({ review }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
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

  const renderMiniStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
        }`}
      />
    ));
  };

  const activeCategories = review.categories
    ? Object.entries(review.categories).filter(([, val]) => val && val > 0)
    : [];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header: avatar + name + stars */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-heading font-bold text-sm flex-shrink-0">
          {getInitials(review.reviewer_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-slate-900">{review.reviewer_name}</h4>
            {review.is_verified && (
              <Badge className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px] px-1.5 py-0 h-5 rounded-full font-semibold">
                <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                Verificado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">{renderStars(review.rating)}</div>
            <span className="text-xs text-slate-400">
              {review.created_date && !isNaN(new Date(review.created_date).getTime()) 
                ? format(new Date(review.created_date), "MMM d, yyyy") 
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-slate-600 mb-3 leading-relaxed text-sm">{review.comment}</p>
      )}

      {/* Categories as compact chips */}
      {activeCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {activeCategories.map(([key, val]) => (
            <div
              key={key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100"
            >
              <span className="text-[11px] font-medium text-slate-500">
                {CATEGORY_LABELS[key] || key}
              </span>
              <div className="flex gap-0.5">{renderMiniStars(val)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recommend + tip badges */}
      {review.would_recommend !== undefined && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <Badge className={`text-[11px] px-2 py-0.5 h-5 rounded-full font-semibold border ${
            review.would_recommend
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}>
            {review.would_recommend ? "Recomenda" : "Não recomenda"}
          </Badge>
          {review.tip_amount && review.tip_amount > 0 && (
            <Badge className="bg-rose-50 text-rose-600 border-rose-200 text-[11px] px-2 py-0.5 h-5 rounded-full font-semibold">
              <Heart className="w-2.5 h-2.5 mr-0.5" />
              Gorjeta €{review.tip_amount}
            </Badge>
          )}
        </div>
      )}

      {/* Vote actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => voteMutation.mutate('helpful')}
          disabled={!user || voteMutation.isPending}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
            (userVote?.reaction_type === 'helpful' || (!userVote?.reaction_type && userVote?.is_helpful))
              ? 'bg-teal-600 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-500 hover:bg-teal-50 hover:text-teal-700'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          Útil
          {helpfulCount > 0 && <span className="font-bold">{helpfulCount}</span>}
        </button>
        <button
          type="button"
          onClick={() => voteMutation.mutate('love')}
          disabled={!user || voteMutation.isPending}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
            userVote?.reaction_type === 'love'
              ? 'bg-rose-500 text-white shadow-sm' 
              : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${userVote?.reaction_type === 'love' ? 'fill-white' : ''}`} />
          {loveCount > 0 && <span className="font-bold">{loveCount}</span>}
        </button>
      </div>
    </div>
  );
}