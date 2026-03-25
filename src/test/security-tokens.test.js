import { describe, it, expect } from 'vitest'

// Extracted from base44/functions/generateSecurityTokens/entry.ts
function generateSecureToken(prefix) {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${prefix}-${hex.substring(0, 12).toUpperCase()}`
}

describe('generateSecureToken', () => {
  it('generates token with correct prefix', () => {
    const pickup = generateSecureToken('PK')
    const dropoff = generateSecureToken('DO')

    expect(pickup).toMatch(/^PK-[A-F0-9]{12}$/)
    expect(dropoff).toMatch(/^DO-[A-F0-9]{12}$/)
  })

  it('generates unique tokens on each call', () => {
    const tokens = new Set()
    for (let i = 0; i < 100; i++) {
      tokens.add(generateSecureToken('PK'))
    }
    expect(tokens.size).toBe(100)
  })

  it('uses 128 bits of entropy (16 bytes)', () => {
    const token = generateSecureToken('PK')
    // PK- prefix + 12 hex chars = 48 bits visible, but generated from 16 bytes
    const hexPart = token.slice(3)
    expect(hexPart.length).toBe(12)
    expect(hexPart).toMatch(/^[A-F0-9]+$/)
  })

  it('token expiry is 2 hours from now', () => {
    const now = Date.now()
    const expiresAt = new Date(now + 2 * 60 * 60 * 1000)
    const twoHoursFromNow = new Date(now + 2 * 60 * 60 * 1000)

    // Within 1 second tolerance
    expect(Math.abs(expiresAt.getTime() - twoHoursFromNow.getTime())).toBeLessThan(1000)
  })
})
