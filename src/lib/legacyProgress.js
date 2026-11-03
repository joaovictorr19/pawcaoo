import { base44 } from "@/api/base44Client";
import { REVIEW_POINTS } from "@/lib/stagePrizes";

const isInMonth = (value, monthKey) =>
  typeof value === "string" && value.startsWith(monthKey);

/**
 * Progresso mensal de O Legado: reservas concluídas no mês + um ponto por review escrita.
 */
export async function fetchLegacyProgress(email, monthKey) {
  if (!email || !monthKey) return { bookings: 0, reviews: 0, points: 0 };

  const [walks, trainings, hotels, services, reviews] = await Promise.all([
    base44.entities.Booking.filter({ owner_email: email, status: "completed" }, "-created_date", 200),
    base44.entities.TrainingBooking.filter({ owner_email: email, status: "completed" }, "-created_date", 200),
    base44.entities.HotelBooking.filter({ owner_email: email, status: "completed" }, "-created_date", 200),
    base44.entities.ServiceBooking.filter({ owner_email: email, status: "completed" }, "-created_date", 200),
    base44.entities.Review.filter({ reviewer_email: email }, "-created_date", 200),
  ]);

  const countBookings = (records, dateFields) =>
    (records || []).filter((record) =>
      dateFields.some((field) => isInMonth(record?.[field], monthKey))
    ).length;

  const bookings =
    countBookings(walks, ["walk_date", "completed_date"]) +
    countBookings(trainings, ["session_date", "completed_date"]) +
    countBookings(hotels, ["checkin_date"]) +
    countBookings(services, ["booking_date"]);

  const reviewCount = (reviews || []).filter((review) =>
    isInMonth(review?.created_date, monthKey)
  ).length;

  return {
    bookings,
    reviews: reviewCount,
    points: bookings + reviewCount * REVIEW_POINTS,
  };
}