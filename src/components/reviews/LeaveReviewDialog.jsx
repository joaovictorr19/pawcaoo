import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Calendar, Dog, CheckCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import ReviewForm from "@/components/reviews/ReviewForm";
import { toast } from "sonner";

export default function LeaveReviewDialog({
  open,
  onClose,
  professionalEmail,
  walkerProfile,
  trainerProfile,
  currentUser,
}) {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isTrainer = !!trainerProfile && !walkerProfile;
  const professionalName =
    walkerProfile?.walker_name || trainerProfile?.trainer_name || "Profissional";

  // Fetch user's completed bookings with this professional that haven't been reviewed
  const { data: eligibleBookings = [], isLoading } = useQuery({
    queryKey: ["eligibleBookingsForReview", professionalEmail, currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email || !professionalEmail) return [];

      const emailFilter = isTrainer
        ? { trainer_email: professionalEmail, status: "completed", owner_email: currentUser.email }
        : { walker_email: professionalEmail, status: "completed", owner_email: currentUser.email };

      const bookings = await base44.entities.Booking.filter(emailFilter, "-created_date", 20);

      // Filter out bookings that already have reviews
      const reviewedBookingIds = new Set();
      const reviewFilter = isTrainer
        ? { trainer_id: trainerProfile?.id }
        : { walker_id: walkerProfile?.id };

      const existingReviews = await base44.entities.Review.filter(reviewFilter, undefined, 50);
      existingReviews.forEach((r) => {
        if (r.booking_id) reviewedBookingIds.add(r.booking_id);
      });

      return bookings.filter((b) => !reviewedBookingIds.has(b.id));
    },
    enabled: !!open && !!currentUser?.email && !!professionalEmail,
  });

  useEffect(() => {
    if (!open) {
      setSelectedBooking(null);
      setIsProcessing(false);
    }
  }, [open]);

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      // 1. Create the review
      await base44.entities.Review.create(reviewData);

      // 2. Update professional profile rating
      const isTrainerReview = !!reviewData.trainer_id;
      const profileEntity = isTrainerReview
        ? base44.entities.TrainerProfile
        : base44.entities.WalkerProfile;
      const profileId = isTrainerReview ? reviewData.trainer_id : reviewData.walker_id;

      try {
        const profile = await profileEntity.get(profileId);
        if (profile) {
          const currentRating = profile.rating || 5;
          const currentCount = profile.total_walks || profile.total_reviews || 0;
          const count = currentCount || 1;
          const newRating = ((currentRating * count) + reviewData.rating) / (count + 1);

          await profileEntity.update(profileId, {
            rating: parseFloat(newRating.toFixed(2)),
            total_walks: (profile.total_walks || 0) + 1,
          });
        }
      } catch (e) {
        console.error("Error updating profile rating:", e);
      }

      // 3. Mark booking as reviewed
      if (reviewData.booking_id) {
        try {
          await base44.entities.Booking.update(reviewData.booking_id, {
            review_id: "reviewed",
          });
        } catch (e) {
          console.error("Error marking booking as reviewed:", e);
        }
      }
    },
    onSuccess: () => {
      toast.success("Avaliação enviada com sucesso! Obrigado pelo feedback.");
      queryClient.invalidateQueries({ queryKey: ["professionalReviews"] });
      queryClient.invalidateQueries({ queryKey: ["eligibleBookingsForReview"] });
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao enviar avaliação: " + error.message);
    },
    onSettled: () => setIsProcessing(false),
  });

  const handleSubmit = (reviewData) => {
    setIsProcessing(true);
    submitReviewMutation.mutate(reviewData);
  };

  const formatBookingLabel = (booking) => {
    const date = booking.walk_date || booking.session_date || booking.created_date;
    const dogName = booking.dog_name || (booking.dogs?.[0]?.dog_name) || "—";
    return `${dogName} · ${date ? format(new Date(date), "dd/MM/yyyy") : "—"}`;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            Avaliar {professionalName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-400 mt-2">A carregar reservas...</p>
          </div>
        ) : !selectedBooking ? (
          eligibleBookings.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-2">
                Seleciona o serviço concluído que queres avaliar:
              </p>
              {eligibleBookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Dog className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {booking.dog_name || booking.dogs?.[0]?.dog_name || "Cão"}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatBookingLabel(booking)}
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-slate-200" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20 text-slate-400" />
              <p className="text-slate-500 text-sm font-medium">
                Não tens serviços concluídos com este profissional para avaliar.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Completa um serviço primeiro para poderes deixar a tua avaliação.
              </p>
            </div>
          )
        ) : (
          <ReviewForm
            booking={selectedBooking}
            onSubmit={handleSubmit}
            onCancel={() => setSelectedBooking(null)}
            isProcessing={isProcessing}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}