const TIME_ZONE = "Europe/Lisbon";
export const COMMENT_BONUS = 2;
export const MAX_STARS = 5;

const FULL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

/** Minutos de desvio entre a hora local de Lisboa e UTC, no instante indicado. */
function zoneOffsetMinutes(date) {
  const parts = FULL_FORMATTER
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );

  return Math.round((asUtc - date.getTime()) / 60000);
}

/** Instante UTC correspondente às 00:00 de Lisboa num dia civil. */
function lisbonMidnight(year, monthIndex, day) {
  const guess = Date.UTC(year, monthIndex, day, 0, 0, 0);
  let offset = zoneOffsetMinutes(new Date(guess));
  offset = zoneOffsetMinutes(new Date(guess - offset * 60000));
  return new Date(guess - offset * 60000);
}

/** Início e fim (exclusivo) do mês civil em curso, no fuso Europe/Lisbon. */
export function getLisbonMonthRange(now = new Date()) {
  const parts = MONTH_FORMATTER
    .formatToParts(now)
    .reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  const year = Number(parts.year);
  const monthIndex = Number(parts.month) - 1;

  return {
    start: lisbonMidnight(year, monthIndex, 1),
    end: lisbonMidnight(monthIndex === 11 ? year + 1 : year, (monthIndex + 1) % 12, 1),
  };
}

/** Início e fim (exclusivo) de um mês AAAA-MM no fuso Europe/Lisbon. */
export function getLisbonRangeForMonthKey(monthKey) {
  const [yearStr, monthStr] = String(monthKey || "").split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return getLisbonMonthRange(new Date());
  }

  return {
    start: lisbonMidnight(year, monthIndex, 1),
    end: lisbonMidnight(monthIndex === 11 ? year + 1 : year, (monthIndex + 1) % 12, 1),
  };
}

/** Pontos de uma review: estrelas (1–5) + bónus de comentário. Usado só no desempate. */
export function scoreReview(review) {
  const rating = Math.round(Number(review?.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > MAX_STARS) return 0;
  const hasComment = typeof review?.comment === "string" && review.comment.trim().length > 0;
  return rating + (hasComment ? COMMENT_BONUS : 0);
}

/** Categoria de pódio de um perfil profissional. */
export function profileCategory(profile) {
  const type = profile?.professional_type;
  if (type === "hotel") return "hotel";
  if (type === "trainer") return "trainer";
  if (type === "shop") return "shop";
  return "walker";
}

/**
 * Pódio de uma categoria: conta as avaliações recebidas no mês para os perfis
 * dessa categoria e ordena pelo número de avaliações.
 * Desempate: pontos das estrelas > avaliação mais recente > nome.
 */
export function buildCategoryPodium(reviews, profilesById, category, limit = 3) {
  const grouped = new Map();

  (reviews || []).forEach((review) => {
    const professionalId = review?.walker_id;
    if (!professionalId) return;

    const profile = profilesById?.get?.(professionalId);
    if (!profile || profileCategory(profile) !== category) return;

    const points = scoreReview(review);
    if (points <= 0) return;

    const entry = grouped.get(professionalId) || {
      professionalId,
      name: review.walker_name || "",
      points: 0,
      reviews: 0,
      lastReviewAt: 0,
    };

    entry.points += points;
    entry.reviews += 1;
    if (!entry.name) entry.name = review.walker_name || "";

    const timestamp = Date.parse(review.created_date || "");
    if (Number.isFinite(timestamp) && timestamp > entry.lastReviewAt) {
      entry.lastReviewAt = timestamp;
    }

    grouped.set(professionalId, entry);
  });

  return Array.from(grouped.values())
    .sort(
      (a, b) =>
        b.reviews - a.reviews ||
        b.points - a.points ||
        b.lastReviewAt - a.lastReviewAt ||
        String(a.name).localeCompare(String(b.name))
    )
    .slice(0, limit);
}

/** Divide os milissegundos restantes em dias, horas, minutos e segundos. */
export function splitCountdown(remainingMs) {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}