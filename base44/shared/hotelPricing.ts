// Shared hotel pricing + booking helpers used by createHotelCheckout, respondPriceProposal, and submitPriceProposal.
// Extracted to avoid duplication across backend functions.

export const ALLOWED_ORIGINS = [
  'https://pawcao.base44.app',
  'https://app.pawcao.pt',
  'https://pawcao.pt',
  'https://www.pawcao.pt'
];

export function resolveOrigin(req) {
  const requestOrigin = req.headers.get('origin') || '';
  return (ALLOWED_ORIGINS.includes(requestOrigin) ||
    /^https:\/\/[a-z0-9-]*pawcao[a-z0-9-]*\.base44\.app$/.test(requestOrigin))
    ? requestOrigin
    : 'https://pawcao.base44.app';
}

export function getEffectiveCommissionRate(hotelProfile) {
  const DEFAULT_RATE = 10;
  const commissionMode = hotelProfile.commission_rate_mode || 'default';
  if (hotelProfile.exempt_from_platform_fees === true || commissionMode === 'zero') return 0;
  if (commissionMode === 'zero_temporary') {
    if (hotelProfile.commission_rate_expiry && new Date() > new Date(hotelProfile.commission_rate_expiry)) return DEFAULT_RATE;
    return 0;
  }
  if (commissionMode === 'custom_percent') return hotelProfile.custom_commission_rate != null ? Number(hotelProfile.custom_commission_rate) : DEFAULT_RATE;
  return DEFAULT_RATE;
}

/**
 * Calculate grooming price for a single dog based on size_prices and breed_prices.
 * Priority: breed_prices (exact match) > size_prices (by dog size) > price_per_day (fallback)
 */
export function calcGroomingPricePerDog(service, dog) {
  const breed = (dog?.dog_breed || dog?.breed || '').trim().toLowerCase();
  const size = dog?.dog_size || dog?.size || 'medium';

  // 1. Check breed_prices for exact match
  if (breed && Array.isArray(service.breed_prices)) {
    const breedMatch = service.breed_prices.find(bp =>
      (bp.breed || '').trim().toLowerCase() === breed
    );
    if (breedMatch && Number(breedMatch.price) > 0) return Number(breedMatch.price);
  }

  // 2. Check size_prices
  if (service.size_prices && typeof service.size_prices === 'object') {
    const sizePrice = service.size_prices[size];
    if (sizePrice != null && Number(sizePrice) > 0) return Number(sizePrice);
  }

  // 3. Fallback to price_per_day
  return Number(service.price_per_day) || 0;
}

/**
 * Calculate total grooming price across all dogs in a booking.
 */
export function calcGroomingTotal(service, dogs) {
  if (!dogs || dogs.length === 0) return Number(service.price_per_day) || 0;
  return dogs.reduce((sum, dog) => sum + calcGroomingPricePerDog(service, dog), 0);
}

/**
 * Compute the commission split for a hotel booking given a desired total
 * (what the hotel wants the client to pay for the service, before client-borne
 * commission). Returns totalAmount (what client pays), serviceAmount (what
 * hotel receives), and platformFee (platform commission).
 */
export function computeHotelPayoutSplit(hotel, desiredTotal, transportFee = 0) {
  const commissionRate = getEffectiveCommissionRate(hotel);
  const commissionBorneBy = hotel.commission_borne_by || 'hotel';
  const serviceBase = Math.max(0, (desiredTotal || 0) - (transportFee || 0));
  const platformFee = Math.round(serviceBase * (commissionRate / 100) * 100) / 100;
  let totalAmount, serviceAmount;
  if (commissionBorneBy === 'client') {
    totalAmount = Math.round((serviceBase + platformFee + transportFee) * 100) / 100;
    serviceAmount = Math.round((serviceBase + transportFee) * 100) / 100;
  } else {
    totalAmount = Math.round((serviceBase + transportFee) * 100) / 100;
    serviceAmount = Math.round((serviceBase - platformFee + transportFee) * 100) / 100;
  }
  return { totalAmount, serviceAmount, platformFee, commissionBorneBy };
}

/**
 * Restore or reserve hotel capacity for a service type.
 * direction: 'reserve' (subtract) or 'restore' (add back)
 */
export async function adjustHotelCapacity(base44, hotelProfileId, serviceType, dogsCount, direction) {
  try {
    const hotelProfiles = await base44.asServiceRole.entities.WalkerProfile.filter({ id: hotelProfileId });
    if (hotelProfiles.length === 0) return;
    const capProfile = hotelProfiles[0];
    const capHd = capProfile.hotel_details || {};
    const capServices = (capHd.services || []).map(s => {
      if (s.service_type === serviceType) {
        const current = s.capacity_available ?? 0;
        return { ...s, capacity_available: direction === 'reserve' ? Math.max(0, current - dogsCount) : current + dogsCount };
      }
      return s;
    });
    const topCurrent = capHd.capacity_available ?? 0;
    const topUpdated = direction === 'reserve' ? Math.max(0, topCurrent - dogsCount) : topCurrent + dogsCount;
    await base44.asServiceRole.entities.WalkerProfile.update(capProfile.id, {
      hotel_details: { ...capHd, capacity_available: topUpdated, services: capServices }
    });
  } catch (err) {
    console.error('Erro ao ajustar capacidade:', err.message);
  }
}