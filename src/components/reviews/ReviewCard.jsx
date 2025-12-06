import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
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

  const userVote = helpfulVotes.find(v => v.user_email === user?.email);
  const helpfulCount = helpfulVotes.filter(v => v.is_helpful).length;
  const notHelpfulCount = helpfulVotes.filter(v => !v.is_helpful).length;

  const voteHelpfulMutation = useMutation({
    mutationFn: async (isHelpful) => {
      if (userVote) {
        if (userVote.is_helpful === isHelpful) {
          await base44.entities.ReviewHelpful.delete(userVote.id);
        } else {
          await base44.entities.ReviewHelpful.update(userVote.id, { is_helpful: isHelpful });
        }
      } else {
        await base44.entities.ReviewHelpful.create({
          review_id: review.id,
          user_email: user?.email,
          is_helpful: isHelpful
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewHelpful', review.id] });
      toast.success("Thank you for your feedback!");
    },
  });

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderCategoryStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-base text-gray-900">{review.reviewer_name}</h4>
              {review.is_verified && (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">{renderStars(review.rating)}</div>
              <span className="text-sm text-gray-600">
                {format(new Date(review.created_date), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>

        {review.comment && (
          <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>
        )}

        {review.categories && (
          <div className="grid grid-cols-2 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
            {review.categories.punctuality && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Punctuality</div>
                <div className="flex">{renderCategoryStars(review.categories.punctuality)}</div>
              </div>
            )}
            {review.categories.care && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Care</div>
                <div className="flex">{renderCategoryStars(review.categories.care)}</div>
              </div>
            )}
            {review.categories.communication && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Communication</div>
                <div className="flex">{renderCategoryStars(review.categories.communication)}</div>
              </div>
            )}
            {review.categories.professionalism && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Professionalism</div>
                <div className="flex">{renderCategoryStars(review.categories.professionalism)}</div>
              </div>
            )}
            {review.categories.effectiveness && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Effectiveness</div>
                <div className="flex">{renderCategoryStars(review.categories.effectiveness)}</div>
              </div>
            )}
            {review.categories.knowledge && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Knowledge</div>
                <div className="flex">{renderCategoryStars(review.categories.knowledge)}</div>
              </div>
            )}
          </div>
        )}

        {review.would_recommend !== undefined && (
          <div className="mb-4">
            <Badge className={review.would_recommend ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {review.would_recommend ? "Would Recommend" : "Would Not Recommend"}
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">Was this review helpful?</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={userVote?.is_helpful === true ? "default" : "outline"}
              onClick={() => voteHelpfulMutation.mutate(true)}
              disabled={!user || voteHelpfulMutation.isPending}
              className="h-8"
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              {helpfulCount}
            </Button>
            <Button
              size="sm"
              variant={userVote?.is_helpful === false ? "default" : "outline"}
              onClick={() => voteHelpfulMutation.mutate(false)}
              disabled={!user || voteHelpfulMutation.isPending}
              className="h-8"
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              {notHelpfulCount}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}