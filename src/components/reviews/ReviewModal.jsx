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
  const [tags, setTags] = useState([]);

  const quickTags = ["Pontual", "Amigável", "Cansou o cão", "Profissional", "Excelente comunicação"];

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) throw new Error("Por favor, selecione uma classificação.");

      // 1. Create Review
      const review = await base44.entities.Review.create({
        booking_id: booking.id,
        walker_id: booking.walker_id,
        walker_name: booking.walker_name,
        reviewer_email: booking.owner_email,
        reviewer_name: booking.owner_name,
        rating: rating,
        comment: comment + (tags.length > 0 ? ` [Tags: ${tags.join(", ")}]` : ""),
        is_verified: true,
        created_by: booking.owner_email
      });

      // 2. Update Booking
      await base44.entities.Booking.update(booking.id, {
        review_id: review.id
      });

      // 3. Gamification (Client-side simulation for Owner)
      const user = await base44.auth.me();
      if (user) {
        const newXP = (user.gamification_xp || 0) + 50;
        await base44.auth.updateMe({ gamification_xp: newXP });
      }

      return review;
    },
    onSuccess: () => {
      if (rating === 5) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
      toast.success(`Obrigado! Ganhaste +50 XP!`);
      queryClient.invalidateQueries(['userBookings']);
      queryClient.invalidateQueries(['myBookings']);
      onClose();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Erro ao enviar avaliação.");
    }
  });

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Como foi o passeio?</DialogTitle>
          <DialogDescription className="text-center">
            Avalie sua experiência com {booking?.walker_name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-bold text-yellow-700">Avalie para ganhar +50 XP!</span>
          </div>

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
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="w-full space-y-2">
            <Label>O que achou?</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre o passeio..."
              rows={3}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {quickTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  tags.includes(tag)
                    ? "bg-green-100 border-green-300 text-green-700 font-semibold"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => submitReviewMutation.mutate()}
            disabled={rating === 0 || submitReviewMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            {submitReviewMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}