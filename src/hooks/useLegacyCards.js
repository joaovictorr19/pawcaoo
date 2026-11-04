import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { EMPTY_STATS, buildLegacyCards, buildLegacyStats } from "@/lib/legacyCards";

const safe = (promise, fallback) => promise.catch(() => fallback);

/** Progresso real das Provações + cartas já conquistadas (uma por provação). */
export function useLegacyCards({ email, userProfile }) {
  const queryClient = useQueryClient();
  const awardedRef = useRef(new Set());
  const streakDays = Number(userProfile?.daily_streak || 0);

  const { data: stats = EMPTY_STATS, isLoading: isLoadingStats } = useQuery({
    queryKey: ["legacyCardStats", email, streakDays],
    enabled: !!email,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const [walks, reviews, hotels, trainings, purchases, referrals, redemptions] = await Promise.all([
        safe(base44.entities.Booking.filter({ owner_email: email, status: "completed" }, "-created_date", 300), []),
        safe(base44.entities.Review.filter({ reviewer_email: email }, "-created_date", 300), []),
        safe(base44.entities.HotelBooking.filter({ owner_email: email, status: "completed" }, "-created_date", 300), []),
        safe(base44.entities.TrainingBooking.filter({ owner_email: email, status: "completed" }, "-created_date", 300), []),
        safe(
          base44.entities.ProductOrder.filter(
            { customer_email: email, status: { $in: ["paid", "processing", "shipped", "delivered"] } },
            "-created_date",
            300
          ),
          []
        ),
        safe(
          base44.entities.Referral.filter(
            { referrer_email: email, status: { $in: ["completed", "rewarded"] } },
            "-created_date",
            300
          ),
          []
        ),
        safe(base44.entities.Redemption.filter({ user_email: email }, "-created_date", 300), []),
      ]);

      return buildLegacyStats({
        walks,
        reviews,
        hotelStays: hotels.length,
        trainings: trainings.length,
        purchases: purchases.length,
        referrals: referrals.length,
        redemptions: redemptions.filter((row) => row.status !== "cancelled").length,
        streakDays,
      });
    },
  });

  const { data: earnedRows = [], isLoading: isLoadingEarned } = useQuery({
    queryKey: ["legacyCards", email],
    enabled: !!email,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: () => safe(base44.entities.LegacyCard.filter({ user_email: email }, "-earned_date", 200), []),
  });

  const earnedIds = useMemo(
    () => new Set((earnedRows || []).map((row) => row.card_id)),
    [earnedRows]
  );

  const cards = useMemo(() => buildLegacyCards(stats, earnedIds), [stats, earnedIds]);

  const earnedCards = useMemo(() => cards.filter((card) => card.earned), [cards]);
  const collectionPoints = useMemo(
    () => earnedCards.reduce((total, card) => total + card.points, 0),
    [earnedCards]
  );

  useEffect(() => {
    if (!email || isLoadingStats || isLoadingEarned) return;

    const pending = cards.filter((card) => card.earned && !earnedIds.has(card.id) && !awardedRef.current.has(card.id));
    if (pending.length === 0) return;

    pending.forEach((card) => awardedRef.current.add(card.id));

    (async () => {
      try {
        await base44.entities.LegacyCard.bulkCreate(
          pending.map((card) => ({
            user_email: email,
            card_id: card.id,
            card_title: card.title,
            rarity: card.rarity,
            points: card.points,
            xp_awarded: card.xp,
            earned_date: new Date().toISOString(),
          }))
        );

        const xpWon = pending.reduce((total, card) => total + card.xp, 0);
        if (userProfile?.id && xpWon > 0) {
          await base44.entities.UserProfile.update(userProfile.id, {
            gamification_xp: (userProfile.gamification_xp || 0) + xpWon,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["legacyCards", email] });
        queryClient.invalidateQueries({ queryKey: ["userProfileGamification", email] });

        pending.forEach((card) => toast.success(`Nova carta conquistada: ${card.title}`));
      } catch (error) {
        pending.forEach((card) => awardedRef.current.delete(card.id));
        console.warn("Não foi possível guardar as cartas conquistadas:", error?.message);
      }
    })();
  }, [cards, earnedIds, email, isLoadingStats, isLoadingEarned, userProfile, queryClient]);

  return {
    cards,
    earnedCards,
    collectionPoints,
    isLoading: isLoadingStats || isLoadingEarned,
  };
}