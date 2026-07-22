import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trophy, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export default function ReviewModal({ booking, isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma classificação de estrelas.");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📤 Enviando review para booking:', booking.id, 'Rating:', rating);
      
      // ✅ Chamar backend function que processa tudo
      const response = await base44.functions.invoke('processReview', {
        bookingId: booking.id,
        rating: rating,
        comment: comment
      });

      console.log('📥 Resposta do backend:', response.data);

      if (response.data.success) {
        // Efeito Wow para 5 estrelas
        if (rating === 5) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#8b5cf6', '#fbbf24']
          });
        }

        const xpEarned = response.data.review.xp_earned;
        toast.success(`Avaliação enviada! +${xpEarned} XP ganhos! 🏆`);
        onClose();
      } else {
        throw new Error(response.data.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error("Erro ao enviar avaliação:", error);
      toast.error(error.response?.data?.error || "Erro ao enviar avaliação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-md border-purple-100 shadow-2xl max-h-[95vh] flex flex-col">
        <DialogHeader className="text-center flex-shrink-0">
          <div className="mx-auto bg-yellow-100 p-3 rounded-full w-fit mb-4">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">Como foi o passeio?</DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            Avalie o serviço de <strong>{booking.walker_name}</strong>
          </p>
        </DialogHeader>

        {/* Gamification Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-lg text-center text-sm font-medium shadow-md mb-4"
        >
          ✨ Avalie o Dog Walker e ganhe <span className="font-bold text-yellow-300">+50 XP!</span>
        </motion.div>

        <div className="flex flex-col items-center space-y-6 py-4 overflow-y-auto flex-1">
          {/* Stars */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-10 h-10 transition-colors duration-200 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400 drop-shadow-md"
                      : "text-gray-300 fill-gray-100"
                  }`}
                />
              </button>
            ))}
          </div>
          
          {rating > 0 && (
            <span className="text-sm font-semibold text-purple-600 animate-pulse">
              {rating === 5 ? "Incrível! 🤩" : rating >= 4 ? "Muito bom! 😄" : rating === 3 ? "Bom 🙂" : "Pode melhorar 😐"}
            </span>
          )}

          <Textarea
            placeholder="Conte-nos mais sobre a experiência... (opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full min-h-[100px] border-gray-200 focus:border-purple-500 focus:ring-purple-500 bg-white/50"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 flex-shrink-0 pt-4 border-t">
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            Lembrar mais tarde
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || rating === 0}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
          >
            {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}