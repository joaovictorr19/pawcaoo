import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, MessageCircle, Send, X, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewsManagementSection({ professionalProfile, user }) {
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState('recent'); // recent, rating-high, rating-low
  const [filterRating, setFilterRating] = useState(null); // null, 1-5
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const isWalker = !!professionalProfile?.walker_name;

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['professionalReviews', professionalProfile?.id],
    queryFn: async () => {
      if (!professionalProfile?.id) return [];
      let allReviews = [];
      if (isWalker) {
        allReviews = await base44.entities.Review.filter({ walker_id: professionalProfile.id }, '-created_date');
      } else {
        allReviews = await base44.entities.Review.filter({ trainer_id: professionalProfile.id }, '-created_date');
      }
      return allReviews || [];
    },
    enabled: !!professionalProfile?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Filtrar e ordenar
  let filtered = reviews.filter(r => !filterRating || r.rating === filterRating);
  
  if (sortBy === 'recent') {
    filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  } else if (sortBy === 'rating-high') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'rating-low') {
    filtered.sort((a, b) => a.rating - b.rating);
  }

  const replyMutation = useMutation({
    mutationFn: async ({ reviewId, replyText }) => {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) throw new Error('Review not found');
      
      const updatedReplies = review.public_replies || [];
      updatedReplies.push({
        author_email: user.email,
        author_name: user.full_name,
        reply_text: replyText,
        created_date: new Date().toISOString()
      });

      await base44.entities.Review.update(reviewId, { public_replies: updatedReplies });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['professionalReviews']);
      setReplyingId(null);
      setReplyText('');
      toast.success('Resposta publicada!');
    },
    onError: () => toast.error('Erro ao publicar resposta.')
  });

  const handleReply = () => {
    if (!replyText.trim()) {
      toast.error('Escreve uma resposta');
      return;
    }
    replyMutation.mutate({ reviewId: replyingId, replyText });
  };

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* HEADER COM STATS */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black text-amber-700 uppercase tracking-wider mb-1">Avaliação Geral</p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-amber-900">{avgRating}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i <= Math.round(avgRating) ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-amber-700 mt-2 font-bold">{reviews.length} avaliações</p>
          </div>
          <div className="text-right space-y-2">
            {reviews.filter(r => r.rating >= 4).length > 0 && (
              <div className="text-xs">
                <p className="font-bold text-green-700">{reviews.filter(r => r.rating >= 4).length}</p>
                <p className="text-green-600">Positivas ⭐⭐⭐⭐+</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILTROS E ORDENAÇÃO */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500"
        >
          <option value="recent">Mais Recentes</option>
          <option value="rating-high">Classificação: Alto → Baixo</option>
          <option value="rating-low">Classificação: Baixo → Alto</option>
        </select>

        <select
          value={filterRating || ''}
          onChange={(e) => setFilterRating(e.target.value ? parseInt(e.target.value) : null)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-blue-500"
        >
          <option value="">Todas as Classificações</option>
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating} ⭐ ({reviews.filter(r => r.rating === rating).length})
            </option>
          ))}
        </select>
      </div>

      {/* LISTA DE AVALIAÇÕES */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((review) => (
            <Card key={review.id} className="p-5 bg-white border border-slate-200">
              <div className="space-y-3">
                {/* HEADER */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-slate-900">{review.reviewer_name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(review.created_date).toLocaleDateString('pt-PT', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i <= review.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}
                      />
                    ))}
                  </div>
                </div>

                {/* COMENTÁRIO */}
                <div>
                  <p className="text-sm text-slate-700">{review.comment}</p>
                  
                  {/* CATEGORIAS */}
                  {review.categories && (
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      {Object.entries(review.categories).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 p-2 rounded">
                          <p className="text-slate-600 font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                          <p className="font-bold text-slate-900">{value}/5</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RESPOSTAS EXISTENTES */}
                {review.public_replies && review.public_replies.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Tua Resposta</p>
                    {review.public_replies.map((reply, idx) => (
                      <div key={idx} className="text-sm text-slate-700">
                        <p className="font-bold text-blue-900 text-xs mb-1">{reply.author_name}</p>
                        <p>{reply.reply_text}</p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {new Date(reply.created_date).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* RESPONDER */}
                {replyingId === review.id ? (
                  <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Escreve uma resposta pública..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                      rows="2"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleReply}
                        disabled={replyMutation.isPending}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg"
                      >
                        <Send size={14} className="mr-1.5" /> Publicar
                      </Button>
                      <button
                        onClick={() => {
                          setReplyingId(null);
                          setReplyText('');
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  !review.public_replies?.length && (
                    <button
                      onClick={() => setReplyingId(review.id)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                    >
                      <MessageCircle size={14} /> Responder publicamente
                    </button>
                  )
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="text-slate-500 text-sm">Nenhuma avaliação ainda</p>
        </div>
      )}
    </div>
  );
}