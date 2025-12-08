import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export default function ReviewModal({ booking, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) throw new Error("Por favor, selecione uma classificação.");

      const user = await base44.auth.me();

      // 1. Create Review
      const review = await base44.entities.Review.create({
        booking_id: booking.id,
        walker_id: booking.walker_id,
        walker_name: booking.walker_name,
        reviewer_email: user?.email || booking.owner_email,
        reviewer_name: user?.full_name || booking.owner_name,
        rating: rating,
        comment: comment,
        is_verified: true,
        created_by: user?.email
      });

      // 2. Update Booking with Review ID
      await base44.entities.Booking.update(booking.id, {
        review_id: review.id // Using actual ID instead of 'submitted' for better data integrity
      });

      // 3. Gamification: Give XP to user
      if (user) {
        const currentXP = user.gamification_xp || 0;
        await base44.auth.updateMe({
          gamification_xp: currentXP + 50
        });
      }

      return review;
    },
    onSuccess: () => {
      if (rating === 5) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      toast.success("Avaliação enviada! +50 XP ganhos");
      queryClient.invalidateQueries(['allOwnerBookings']);
      onClose();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Erro ao enviar avaliação.");
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-lg border border-white/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
            Como foi o passeio com {booking?.walker_name}?
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="bg-yellow-100/50 border border-yellow-300 rounded-full px-4 py-1 flex items-center gap-2 shadow-sm animate-bounce-slow">
            <Award className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-bold text-yellow-800">Avalie para ganhar +50 XP!</span>
          </div>

          <div className="flex gap-2 p-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-all duration-200 hover:scale-125 active:scale-95"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`w-10 h-10 drop-shadow-sm transition-colors ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300 fill-gray-100"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="w-full space-y-2">
            <Label className="text-gray-700 font-medium">Deixe um comentário</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos o que mais gostou..."
              rows={3}
              className="bg-white/50 border-gray-200 focus:border-purple-400 focus:ring-purple-400 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => submitReviewMutation.mutate()}
            disabled={rating === 0 || submitReviewMutation.isPending}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold shadow-lg transform transition-transform active:scale-95"
          >
            {submitReviewMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" /> Enviando...
              </span>
            ) : (
              "Enviar Avaliação"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}