import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Star, MessageSquare, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ReviewCard from "@/components/reviews/ReviewCard";
import LeaveReviewDialog from "@/components/reviews/LeaveReviewDialog";
import { useLanguage } from "@/components/LanguageContext";

export default function ProfessionalReviewsSection({
  reviews,
  loadingReviews,
  walkerProfile,
  trainerProfile,
  currentUser,
  profileEmail,
  isOwnProfile,
}) {
  const { language } = useLanguage();
  const [visibleCount, setVisibleCount] = useState(5);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const isProfessional = walkerProfile || trainerProfile;
  const isTrainer = !!trainerProfile && !walkerProfile;
  const canReview =
    currentUser && !isOwnProfile && profileEmail;

  // Contagem de serviços elegíveis por avaliar (badge no botão)
  const { data: eligibleCount = 0 } = useQuery({
    queryKey: ["eligibleReviewCount", profileEmail, currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email || !profileEmail) return 0;
      const emailFilter = isTrainer
        ? { trainer_email: profileEmail, status: "completed", owner_email: currentUser.email }
        : { walker_email: profileEmail, status: "completed", owner_email: currentUser.email };

      const bookings = await base44.entities.Booking.filter(emailFilter, "-created_date", 20);

      let hotelBookings = [];
      if (!isTrainer && walkerProfile) {
        try {
          const hotelFilter = { hotel_email: profileEmail, status: "completed", owner_email: currentUser.email };
          hotelBookings = await base44.entities.HotelBooking.filter(hotelFilter, "-created_date", 20);
        } catch (e) {
          console.error('Error fetching hotel bookings for review count:', e);
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

      return allBookings.filter((b) => !reviewedBookingIds.has(b.id)).length;
    },
    enabled: !!canReview && !!currentUser?.email && !!profileEmail,
    staleTime: 60 * 1000,
  });

  if (!isProfessional) return null;

  const sortedReviews = [...(reviews || [])].sort(
    (a, b) => new Date(b.created_date) - new Date(a.created_date)
  );

  const avgRating =
    sortedReviews.length > 0
      ? sortedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / sortedReviews.length
      : 0;

  const profileRating =
    walkerProfile?.rating || trainerProfile?.rating || avgRating || 0;

  const displayRating = sortedReviews.length > 0 ? avgRating : profileRating;

  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMore = sortedReviews.length > visibleCount;

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"
        }`}
      />
    ));

  return (
    <div className="bg-white rounded-3xl p-5 md:p-7 shadow-sm border border-slate-100">
      {/* Header with summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Rating circle */}
          <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-teal-50 border border-teal-100 flex-shrink-0">
            <p className="text-3xl font-heading font-black text-teal-700 leading-none">
              {displayRating > 0 ? displayRating.toFixed(1) : "—"}
            </p>
            <div className="flex gap-0.5 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(displayRating) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-extrabold text-lg text-slate-900 leading-tight">
              {language === "pt" ? "Avaliações de Clientes" : "Customer Reviews"}
            </h3>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              {sortedReviews.length}{" "}
              {sortedReviews.length === 1
                ? language === "pt" ? "avaliação verificada" : "verified review"
                : language === "pt" ? "avaliações verificadas" : "verified reviews"}
            </p>
          </div>
        </div>

        {canReview && (
          <Button
            onClick={() => setReviewDialogOpen(true)}
            variant="ghost"
            className="bg-teal-50/80 backdrop-blur-md border border-teal-600/25 text-teal-700 hover:bg-teal-100/80 hover:border-teal-600/40 hover:text-teal-800 rounded-full font-bold shadow-lg shadow-teal-900/5 self-start sm:self-auto"
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            {language === "pt" ? "Deixar Avaliação" : "Leave a Review"}
            {eligibleCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-teal-600 text-white text-[11px] font-bold leading-none">
                {eligibleCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Reviews list */}
      {loadingReviews ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : visibleReviews.length > 0 ? (
        <>
          <div className="space-y-3">
            {visibleReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + 5)}
                className="rounded-full border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700 font-semibold"
              >
                {language === "pt" ? "Ver mais avaliações" : "Show more reviews"}
                <ChevronDown className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 px-4">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-teal-500" />
          </div>
          <p className="text-slate-600 text-sm font-semibold">
            {language === "pt"
              ? "Ainda sem avaliações"
              : "No reviews yet"}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            {language === "pt"
              ? "Sê o primeiro a partilhar a tua experiência!"
              : "Be the first to share your experience!"}
          </p>
        </div>
      )}

      {reviewDialogOpen && (
        <LeaveReviewDialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          professionalEmail={profileEmail}
          walkerProfile={walkerProfile}
          trainerProfile={trainerProfile}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}