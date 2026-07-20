/**
 * Calculates the effective commission rate for a professional profile.
 * Mirrors the server-side logic in createBookingCheckout / createHotelCheckout.
 *
 * @param {object} profile - WalkerProfile or TrainerProfile
 * @returns {number} Commission rate as a percentage (0-100)
 */
export function getCommissionBearer(profile) {
  return profile?.commission_borne_by || "hotel";
}

export function getEffectiveCommissionRate(profile) {
  const DEFAULT_RATE = 10;

  if (!profile) return DEFAULT_RATE;

  const mode = profile.commission_rate_mode || "default";

  if (profile.exempt_from_platform_fees === true || mode === "zero") {
    return 0;
  }

  if (mode === "zero_temporary") {
    if (
      profile.commission_rate_expiry &&
      new Date() > new Date(profile.commission_rate_expiry)
    ) {
      return DEFAULT_RATE; // expired, revert to default
    }
    return 0;
  }

  if (mode === "custom_percent") {
    return profile.custom_commission_rate != null
      ? Number(profile.custom_commission_rate)
      : DEFAULT_RATE;
  }

  return DEFAULT_RATE;
}