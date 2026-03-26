import { describe, it, expect } from 'vitest'

// Extracted from src/utils/recommendationEngine.js
function calculateCompatibilityScore(professional, userContext) {
  let score = 0
  const maxScore = 100

  // 1. Base Score (35 pts max)
  const rating = professional.rating || 0
  score += Math.min(20, rating * 4) // max 20 pts for 5-star rating
  score += Math.min(10, (professional.experience_years || 0) * 2) // max 10 pts
  if (professional.verification_status === 'verified') score += 5

  // 2. Distance (25 pts max)
  const distance = userContext.distance_km
  if (distance !== undefined && distance !== null) {
    if (distance <= 2) score += 25
    else if (distance <= 5) score += 20
    else if (distance <= 10) score += 15
    else if (distance <= 20) score += 10
    else if (distance <= 50) score += 5
  }

  // 3. Dog Compatibility (30 pts max)
  if (userContext.dogs && userContext.dogs.length > 0) {
    const dog = userContext.dogs[0]
    const dogSizes = professional.dog_sizes || []
    const breeds = professional.dog_breeds_handled || []

    if (dogSizes.includes(dog.size)) score += 10
    if (breeds.includes(dog.breed)) score += 10
    if (dog.special_needs && (professional.specializations || []).includes('special_needs')) score += 10
  }

  // 4. Loyalty/History (10 pts max)
  if (userContext.is_favorite) score += 5
  if (userContext.past_bookings > 0) score += 5

  return Math.min(maxScore, Math.round(score))
}

describe('calculateCompatibilityScore', () => {
  const baseWalker = {
    rating: 4.5,
    experience_years: 3,
    verification_status: 'verified',
    dog_sizes: ['medium', 'large'],
    dog_breeds_handled: ['Labrador', 'Golden Retriever'],
    specializations: ['special_needs'],
  }

  const baseContext = {
    distance_km: 3,
    dogs: [{ size: 'medium', breed: 'Labrador', special_needs: false }],
    is_favorite: false,
    past_bookings: 0,
  }

  describe('base score', () => {
    it('gives 20 pts for 5-star rating', () => {
      const walker = { ...baseWalker, rating: 5, experience_years: 0, verification_status: 'pending' }
      const ctx = { ...baseContext, distance_km: null, dogs: [] }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(20)
    })

    it('gives 10 pts for 5 years experience', () => {
      const walker = { ...baseWalker, rating: 0, experience_years: 5, verification_status: 'pending' }
      const ctx = { ...baseContext, distance_km: null, dogs: [] }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(10)
    })

    it('caps experience at 10 pts', () => {
      const walker = { ...baseWalker, rating: 0, experience_years: 20, verification_status: 'pending' }
      const ctx = { ...baseContext, distance_km: null, dogs: [] }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(10)
    })

    it('gives 5 pts for verified status', () => {
      const walker = { ...baseWalker, rating: 0, experience_years: 0, verification_status: 'verified' }
      const ctx = { ...baseContext, distance_km: null, dogs: [] }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(5)
    })
  })

  describe('distance scoring', () => {
    it('gives 25 pts for under 2km', () => {
      const walker = { rating: 0, experience_years: 0, verification_status: 'pending' }
      const ctx = { distance_km: 1.5, dogs: [] }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(25)
    })

    it('gives 20 pts for 2-5km', () => {
      const walker = { rating: 0, experience_years: 0, verification_status: 'pending' }
      const ctx = { distance_km: 4, dogs: [] }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(20)
    })

    it('gives 0 pts for over 50km', () => {
      const walker = { rating: 0, experience_years: 0, verification_status: 'pending' }
      const ctx = { distance_km: 100, dogs: [] }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(0)
    })
  })

  describe('dog compatibility', () => {
    it('gives 10 pts for matching size', () => {
      const walker = { ...baseWalker, rating: 0, experience_years: 0, verification_status: 'pending' }
      const ctx = { distance_km: null, dogs: [{ size: 'medium', breed: 'Unknown' }] }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(10)
    })

    it('gives 10 pts for matching breed', () => {
      const walker = { ...baseWalker, rating: 0, experience_years: 0, verification_status: 'pending' }
      const ctx = { distance_km: null, dogs: [{ size: 'tiny', breed: 'Labrador' }] }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(10)
    })

    it('gives 10 pts for special needs match', () => {
      const walker = { ...baseWalker, rating: 0, experience_years: 0, verification_status: 'pending' }
      const ctx = { distance_km: null, dogs: [{ size: 'tiny', breed: 'Unknown', special_needs: true }] }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(10)
    })
  })

  describe('loyalty bonuses', () => {
    it('gives 5 pts for favorite', () => {
      const walker = { rating: 0, experience_years: 0, verification_status: 'pending' }
      const ctx = { distance_km: null, dogs: [], is_favorite: true, past_bookings: 0 }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(5)
    })

    it('gives 5 pts for past bookings', () => {
      const walker = { rating: 0, experience_years: 0, verification_status: 'pending' }
      const ctx = { distance_km: null, dogs: [], is_favorite: false, past_bookings: 3 }
      expect(calculateCompatibilityScore(walker, ctx)).toBe(5)
    })
  })

  describe('combined scoring', () => {
    it('perfect match gives 100', () => {
      const result = calculateCompatibilityScore(
        { ...baseWalker, rating: 5, experience_years: 5 },
        { distance_km: 1, dogs: [{ size: 'medium', breed: 'Labrador', special_needs: true }], is_favorite: true, past_bookings: 1 }
      )
      expect(result).toBe(100)
    })

    it('caps at 100', () => {
      const result = calculateCompatibilityScore(
        { ...baseWalker, rating: 5, experience_years: 10 },
        { distance_km: 0.5, dogs: [{ size: 'medium', breed: 'Labrador', special_needs: true }], is_favorite: true, past_bookings: 5 }
      )
      expect(result).toBe(100)
    })

    it('zero match gives 0', () => {
      const result = calculateCompatibilityScore(
        { rating: 0, experience_years: 0, verification_status: 'pending' },
        { distance_km: 100, dogs: [], is_favorite: false, past_bookings: 0 }
      )
      expect(result).toBe(0)
    })
  })
})
