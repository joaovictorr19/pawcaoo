import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star, Calendar, Loader2, PawPrint } from "lucide-react";
import { format } from "date-fns";
import ReviewForm from "@/components/reviews/ReviewForm";
import { toast } from "sonner";

const SERVICE_TYPE_LABELS = {
  walk: "Passeio",
  training: "Treino",
  hotel: "Hotel",
  boarding: "Estadia",
  daycare: "Creche",
  grooming: "Banho & Tosquia",
};

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

  const { data: eligibleBookings = [], isLoading } = useQuery({
    queryKey: ["eligibleBookingsForReview", professionalEmail, currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email || !professionalEmail) return [];
      const emailFilter = isTrainer
        ? { trainer_email: professionalEmail, status: "completed", owner_email: currentUser.email }
        : { walker_email: professionalEmail, status: "completed", owner_email: currentUser.email };

      const bookings = await base44.entities.Booking.filter(emailFilter, "-created_date", 20);

      let hotelBookings = [];
      if (!isTrainer && walkerProfile) {
        try {
          const hotelFilter = { hotel_email: professionalEmail, status: "completed", owner_email: currentUser.email };
          hotelBookings = await base44.entities.HotelBooking.filter(hotelFilter, "-created_date", 20);
          hotelBookings = hotelBookings.map(h => ({
            ...h,
            type: 'hotel',
            walk_date: h.checkin_date,
            walker_id: h.hotel_profile_id,
            walker_name: h.hotel_name,
            walker_email: h.hotel_email,
            dog_name: h.dogs?.[0]?.dog_name || '—',
          }));
        } catch (e) {
          console.error('Error fetching hotel bookings for review:', e);
        }
      }

      const allBookings = [...bookings, ...hotelBookings];

      const reviewedBookingIds = new Set();
      const reviewFilter = isTrainer
        ? { trainer_id: trainerProfile?.id }
        : { walker_id: walkerProfile?.id };

      const existingReviews = await base44.entities.Review.filter(reviewFilter, undefined, 50);
      existingReviews.forEach((r) => {
        if (r.booking_id) reviewedBookingIds.add(r.booking_id);
      });

      return allBookings.filter((b) => !reviewedBookingIds.has(b.id));
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
      let tipCheckoutUrl = null;

      await base44.entities.Review.create(reviewData);

      const isTrainerReview = !!reviewData.trainer_id;
      const profileEntity = isTrainerReview ? base44.entities.TrainerProfile : base44.entities.WalkerProfile;
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

      if (reviewData.booking_id) {
        try {
          await base44.entities.Booking.update(reviewData.booking_id, {
            review_id: "reviewed",
          });
        } catch (e) {
          console.error("Error marking booking as reviewed:", e);
        }
      }

      if (reviewData.tip_amount && reviewData.tip_amount > 0) {
        const bookingId = reviewData.booking_id || reviewData.training_booking_id;
        const bookingType = reviewData.training_booking_id ? 'training' : 'walk';
        try {
          const tipResponse = await base44.functions.invoke('createTipCheckout', {
            booking_id: bookingId,
            tip_amount: reviewData.tip_amount,
            booking_type: bookingType
          });
          if (tipResponse.data?.url) {
            tipCheckoutUrl = tipResponse.data.url;
          }
        } catch (tipErr) {
          console.error('Tip processing error:', tipErr);
        }
      }

      return { tipCheckoutUrl };
    },
    onSuccess: (data) => {
      toast.success("Avaliação enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["professionalReviews"] });
      queryClient.invalidateQueries({ queryKey: ["eligibleBookingsForReview"] });
      queryClient.invalidateQueries({ queryKey: ["eligibleReviewCount"] });
      onClose();

      if (data?.tipCheckoutUrl) {
        window.location.href = data.tipCheckoutUrl;
      }
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

  const getServiceLabel = (booking) => {
    if (booking.type === 'hotel') return SERVICE_TYPE_LABELS[booking.service_type] || "Hotel";
    if (booking.trainer_id || booking.trainer_name) return "Treino";
    return "Passeio";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[1.75rem] border border-slate-200 p-0 gap-0 bg-white shadow-xl">
        <DialogHeader className="px-7 md:px-8 pt-7 md:pt-8 pb-3 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-heading font-bold text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Star className="w-4 h-4 fill-teal-500 text-teal-500" />
            </div>
            Avaliar {professionalName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-sm mt-3 text-slate-400">A carregar reservas...</p>
          </div>
        ) : !selectedBooking ? (
          eligibleBookings.length > 0 ? (
            <div className="px-7 md:px-8 py-6 space-y-2.5">
              <p className="text-sm mb-3 text-slate-500 font-medium">
                Seleciona o serviço concluído que queres avaliar:
              </p>
              {eligibleBookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/50 transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                    <PawPrint className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-slate-900">
                      {booking.dog_name || booking.dogs?.[0]?.dog_name || "Cão"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatBookingLabel(booking)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                        {getServiceLabel(booking)}
                      </span>
                    </div>
                  </div>
                  <Star className="w-5 h-5 text-slate-200 group-hover:text-teal-500 transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-teal-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                Não tens serviços concluídos com este profissional para avaliar.
              </p>
              <p className="text-xs mt-1 text-slate-400">
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