import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, ThumbsDown, CheckCircle, AlertCircle, MessageSquare, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PartnerReviewCard({ review, canRespond = false }) {
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: helpfulVote } = useQuery({
    queryKey: ['reviewHelpful', review.id, user?.email],
    queryFn: async () => {
      const votes = await base44.entities.ReviewHelpful.filter({
        review_id: review.id,
        review_type: 'partner',
        user_email: user?.email
      });
      return votes[0];
    },
    enabled: !!user && !!review.id,
  });

  const voteHelpfulMutation = useMutation({
    mutationFn: async (isHelpful) => {
      if (helpfulVote) {
        await base44.entities.ReviewHelpful.update(helpfulVote.id, { is_helpful: isHelpful });
      } else {
        await base44.entities.ReviewHelpful.create({
          review_id: review.id,
          review_type: 'partner',
          user_email: user.email,
          is_helpful: isHelpful
        });
      }
      
      const currentHelpful = review.helpful_count || 0;
      const currentNotHelpful = review.not_helpful_count || 0;
      
      let newHelpful = currentHelpful;
      let newNotHelpful = currentNotHelpful;
      
      if (helpfulVote) {
        if (helpfulVote.is_helpful && !isHelpful) {
          newHelpful = Math.max(0, currentHelpful - 1);
          newNotHelpful = currentNotHelpful + 1;
        } else if (!helpfulVote.is_helpful && isHelpful) {
          newNotHelpful = Math.max(0, currentNotHelpful - 1);
          newHelpful = currentHelpful + 1;
        }
      } else {
        if (isHelpful) {
          newHelpful = currentHelpful + 1;
        } else {
          newNotHelpful = currentNotHelpful + 1;
        }
      }
      
      await base44.entities.PartnerReview.update(review.id, {
        helpful_count: newHelpful,
        not_helpful_count: newNotHelpful
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerReviews']);
      queryClient.invalidateQueries(['reviewHelpful']);
    },
  });

  const respondMutation = useMutation({
    mutationFn: (text) => base44.entities.PartnerReview.update(review.id, {
      partner_response: {
        response_text: text,
        responded_by: user.email,
        responded_date: new Date().toISOString()
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerReviews']);
      setShowResponse(false);
      setResponseText("");
      toast.success("Resposta enviada com sucesso!");
    },
  });

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = () => {
    const badges = {
      pending: <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>,
      approved: <Badge className="bg-green-500 text-white"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>,
      rejected: <Badge variant="destructive">Rejeitado</Badge>,
      flagged: <Badge className="bg-orange-500 text-white"><AlertCircle className="w-3 h-3 mr-1" />Sinalizado</Badge>
    };
    return badges[review.status] || null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-700">
                  {review.reviewer_name?.[0]?.toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900">{review.reviewer_name}</h4>
                  {review.purchase_verified && (
                    <Badge className="bg-blue-500 text-white text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Compra Verificada
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mb-2">
                  {renderStars(review.rating)}
                  <span className="text-sm text-gray-500">
                    {format(new Date(review.created_date), 'dd/MM/yyyy')}
                  </span>
                </div>
                {review.product_name && (
                  <p className="text-sm text-gray-600">Produto: <span className="font-medium">{review.product_name}</span></p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge()}
              {review.is_featured && (
                <Badge className="bg-purple-500 text-white">⭐ Destaque</Badge>
              )}
            </div>
          </div>

          {/* Title */}
          {review.title && (
            <h5 className="font-semibold text-lg text-gray-900 mb-2">{review.title}</h5>
          )}

          {/* Comment */}
          <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>

          {/* Categories */}
          {review.categories && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {Object.entries(review.categories).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-600 capitalize mb-1">{key === 'quality' ? 'Qualidade' : key === 'value' ? 'Valor' : key === 'service' ? 'Atendimento' : 'Entrega'}</p>
                  {renderStars(value)}
                </div>
              ))}
            </div>
          )}

          {/* Pros and Cons */}
          {(review.pros?.length > 0 || review.cons?.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {review.pros?.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-800 mb-2">✓ Pontos Positivos</p>
                  <ul className="space-y-1">
                    {review.pros.map((pro, idx) => (
                      <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                        <span>•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {review.cons?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-800 mb-2">✗ Pontos Negativos</p>
                  <ul className="space-y-1">
                    {review.cons.map((con, idx) => (
                      <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                        <span>•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Photos */}
          {review.photos?.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {review.photos.map((photo, idx) => (
                <img
                  key={idx}
                  src={photo}
                  alt={`Review photo ${idx + 1}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Recommendation */}
          {review.would_recommend !== undefined && (
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${
              review.would_recommend ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
            }`}>
              {review.would_recommend ? (
                <>
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Recomendo este parceiro</span>
                </>
              ) : (
                <>
                  <ThumbsDown className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Não recomendo</span>
                </>
              )}
            </div>
          )}

          {/* Partner Response */}
          {review.partner_response && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Resposta do Parceiro</span>
                <span className="text-xs text-blue-600">
                  {format(new Date(review.partner_response.responded_date), 'dd/MM/yyyy')}
                </span>
              </div>
              <p className="text-sm text-blue-800">{review.partner_response.response_text}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => voteHelpfulMutation.mutate(true)}
                disabled={!user || voteHelpfulMutation.isPending}
                className={helpfulVote?.is_helpful ? 'border-green-500 text-green-600' : ''}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Útil ({review.helpful_count || 0})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => voteHelpfulMutation.mutate(false)}
                disabled={!user || voteHelpfulMutation.isPending}
                className={helpfulVote?.is_helpful === false ? 'border-red-500 text-red-600' : ''}
              >
                <ThumbsDown className="w-4 h-4 mr-1" />
                Não Útil ({review.not_helpful_count || 0})
              </Button>
            </div>

            {canRespond && !review.partner_response && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResponse(!showResponse)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Responder
              </Button>
            )}
          </div>

          {/* Response Form */}
          {showResponse && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <Textarea
                placeholder="Escreva sua resposta..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="mb-3"
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowResponse(false);
                    setResponseText("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => respondMutation.mutate(responseText)}
                  disabled={!responseText.trim() || respondMutation.isPending}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600"
                >
                  Enviar Resposta
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}