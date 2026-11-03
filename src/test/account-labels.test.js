import { describe, it, expect } from 'vitest'
import {
  effectiveRegime,
  effectiveCountry,
  isManuallyConfirmed,
  isReviewPending,
  isReviewResolved,
} from '@/lib/accountLabels'

const base = {
  user_email: 'ana@example.com',
  regime: 'walker',
  country: null,
  status: 'verified',
  review_state: 'missing_country',
}

describe('valores efetivos da conta', () => {
  it('usa o valor detetado quando não há confirmação manual', () => {
    expect(effectiveRegime(base)).toBe('walker')
    expect(effectiveCountry(base)).toBeNull()
    expect(isManuallyConfirmed(base)).toBe(false)
  })

  it('o valor confirmado pelo admin prevalece', () => {
    const confirmed = { ...base, confirmed_country: 'spain', confirmed_regime: 'walker' }
    expect(effectiveCountry(confirmed)).toBe('spain')
    expect(effectiveRegime(confirmed)).toBe('walker')
    expect(isManuallyConfirmed(confirmed)).toBe(true)
  })

  it('sem registo não inventa valores', () => {
    expect(effectiveRegime(null)).toBeNull()
    expect(effectiveCountry(undefined)).toBeNull()
  })
})

describe('estado de revisão', () => {
  it('caso detetado e não decidido está por rever', () => {
    expect(isReviewPending(base)).toBe(true)
    expect(isReviewResolved(base)).toBe(false)
  })

  it('caso decidido deixa de estar por rever', () => {
    const resolved = { ...base, review_resolved: true, review_action: 'confirmed' }
    expect(isReviewPending(resolved)).toBe(false)
    expect(isReviewResolved(resolved)).toBe(true)
  })

  it('conta sem problemas nunca aparece em revisão', () => {
    const clean = { ...base, review_state: 'ok', country: 'portugal' }
    expect(isReviewPending(clean)).toBe(false)
    expect(isReviewResolved(clean)).toBe(false)
  })
})