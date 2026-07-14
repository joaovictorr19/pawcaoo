import React, { useState } from "react";
import { Star, MessageSquare, ChevronDown } from "lucide-react";
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

  const canReview =
    currentUser && !isOwnProfile && profileEmail;

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
    <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
      {/* Header with summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-4xl font-black text-slate-900">
              {displayRating > 0 ? displayRating.toFixed(1) : "—"}
            </p>
            <div className="flex justify-center gap-0.5 my-1">
              {renderStars(displayRating)}
            </div>
            <p className="text-xs font-semibold text-slate-400">
              {sortedReviews.length}{" "}
              {sortedReviews.length === 1
                ? language === "pt" ? "avaliação" : "review"
                : language === "pt" ? "avaliações" : "reviews"}
            </p>
          </div>
          <div className="hidden sm:block w-px h-16 bg-slate-100" />
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-1.5 sm:hidden">
            <Star className="w-3 h-3" />
            {language === "pt" ? "Avaliações" : "Reviews"}
          </h3>
          <h3 className="hidden sm:block text-[10px] font-black uppercase text-slate-400 tracking-widest italic flex items-center gap-1.5">
            <Star className="w-3 h-3" />
            {language === "pt" ? "Avaliações de Clientes" : "Customer Reviews"}
          </h3>
        </div>

        {canReview && (
          <Button
            onClick={() => setReviewDialogOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full font-bold shadow-sm"
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            {language === "pt" ? "Deixar Avaliação" : "Leave a Review"}
          </Button>
        )}
      </div>

      {/* Reviews list */}
      {loadingReviews ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
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
            <div className="flex justify-center mt-5">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + 5)}
                className="rounded-full"
              >
                {language === "pt" ? "Ver mais avaliações" : "Show more reviews"}
                <ChevronDown className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <Star className="w-10 h-10 mx-auto mb-2 opacity-20 text-slate-400" />
          <p className="text-slate-400 text-sm font-medium">
            {language === "pt"
              ? "Ainda sem avaliações. Sê o primeiro a avaliar!"
              : "No reviews yet. Be the first to review!"}
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