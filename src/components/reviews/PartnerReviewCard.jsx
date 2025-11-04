import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, CheckCircle, Flag, Image as ImageIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PartnerReviewCard({ review }) {
  const queryClient = useQueryClient();
  const [showPhotos, setShowPhotos] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: userHelpful } = useQuery({
    queryKey: ['reviewHelpful', review.id, user?.email],
    queryFn: async () => {
      const helpful = await base44.entities.PartnerReviewHelpful.filter({
        review_id: review.id,
        user_email: user.email
      });
      return helpful[0];
    },
    enabled: !!user,
  });

  const markHelpfulMutation = useMutation({
    mutationFn: async () => {
      if (userHelpful) {
        await base44.entities.PartnerReviewHelpful.delete(userHelpful.id);
      } else {
        await base44.entities.PartnerReviewHelpful.create({
          review_id: review.id,
          user_email: user.email,
          is_helpful: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviewHelpful', review.id]);
      queryClient.invalidateQueries(['partnerReviews']);
      toast.success(userHelpful ? "Removido dos úteis" : "Marcado como útil");
    }
  });

  const StarDisplay = ({ rating, size = "small" }) => {
    const starSize = size === "small" ? "w-4 h-4" : "w-5 h-5";
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <StarDisplay rating={review.rating} />
              <span className="font-bold text-lg">{review.rating.toFixed(1)}</span>
              {review.verified_purchase && (
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Compra Verificada
                </Badge>
              )}
              {review.is_featured && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                  ⭐ Destaque
                </Badge>
              )}
            </div>
            
            {review.title && (
              <h4 className="font-semibold text-gray-900 mb-1">
                {review.title}
              </h4>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium">{review.reviewer_name}</span>
              <span>•</span>
              <span>
                {format(new Date(review.created_date), "d 'de' MMMM, yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>

        {/* Category Ratings */}
        {review.categories && Object.values(review.categories).some(v => v > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            {[
              { key: "quality", label: "Qualidade" },
              { key: "value", label: "Valor" },
              { key: "service", label: "Atendimento" },
              { key: "delivery", label: "Entrega" }
            ].map(({ key, label }) => (
              review.categories[key] > 0 && (
                <div key={key} className="text-center">
                  <div className="text-xs text-gray-600 mb-1">{label}</div>
                  <div className="flex justify-center">
                    <StarDisplay rating={review.categories[key]} />
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Comment */}
        <p className="text-gray-700 mb-4 leading-relaxed">
          {review.comment}
        </p>

        {/* Product Name if applicable */}
        {review.product_name && (
          <div className="mb-3">
            <Badge variant="outline" className="text-xs">
              Produto: {review.product_name}
            </Badge>
          </div>
        )}

        {/* Photos */}
        {review.photos && review.photos.length > 0 && (
          <div className="mb-4">
            {!showPhotos ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPhotos(true)}
                className="text-emerald-600 hover:text-emerald-700"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Ver {review.photos.length} {review.photos.length === 1 ? 'foto' : 'fotos'}
              </Button>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {review.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Review photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(photo, '_blank')}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendation */}
        {review.would_recommend && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded-lg mb-4">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Recomenda este parceiro</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markHelpfulMutation.mutate()}
            disabled={!user || markHelpfulMutation.isPending}
            className={userHelpful ? "text-emerald-600" : "text-gray-600"}
          >
            <ThumbsUp className={`w-4 h-4 mr-2 ${userHelpful ? 'fill-current' : ''}`} />
            Útil ({review.helpful_count || 0})
          </Button>
          
          {user && (
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Flag className="w-4 h-4 mr-2" />
              Reportar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}