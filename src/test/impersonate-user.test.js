import { describe, it, expect } from 'vitest'

// Validation logic extracted from base44/functions/impersonateUser/entry.ts
const MAX_IMPERSONATION_MINUTES = 30

function validateImpersonationRequest({ targetUserId, reason, confirm_admin_impersonation }, targetUser) {
  if (!targetUserId) {
    return { error: 'targetUserId is required', status: 400 }
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    return { error: 'A reason is required (minimum 5 characters) for audit purposes', status: 400 }
  }

  if (!targetUser) {
    return { error: 'User not found', status: 404 }
  }

  if (targetUser.role === 'admin' && !confirm_admin_impersonation) {
    return { error: 'Impersonating an admin requires confirm_admin_impersonation: true', status: 400 }
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + MAX_IMPERSONATION_MINUTES * 60 * 1000)

  return {
    success: true,
    expiresAt,
    maxDurationMinutes: MAX_IMPERSONATION_MINUTES,
  }
}

describe('impersonateUser validation', () => {
  const normalUser = { id: 'user1', email: 'user@test.com', role: 'user', full_name: 'Test User' }
  const adminUser = { id: 'admin2', email: 'admin2@test.com', role: 'admin', full_name: 'Other Admin' }

  describe('required fields', () => {
    it('rejects missing targetUserId', () => {
      const result = validateImpersonationRequest({ reason: 'Support ticket #123' }, normalUser)
      expect(result.error).toBe('targetUserId is required')
      expect(result.status).toBe(400)
    })

    it('rejects missing reason', () => {
      const result = validateImpersonationRequest({ targetUserId: 'user1' }, normalUser)
      expect(result.error).toContain('reason is required')
      expect(result.status).toBe(400)
    })

    it('rejects empty reason', () => {
      const result = validateImpersonationRequest({ targetUserId: 'user1', reason: '' }, normalUser)
      expect(result.error).toContain('reason is required')
    })

    it('rejects short reason (less than 5 chars)', () => {
      const result = validateImpersonationRequest({ targetUserId: 'user1', reason: 'test' }, normalUser)
      expect(result.error).toContain('reason is required')
    })

    it('rejects non-string reason', () => {
      const result = validateImpersonationRequest({ targetUserId: 'user1', reason: 123 }, normalUser)
      expect(result.error).toContain('reason is required')
    })
  })

  describe('target user validation', () => {
    it('rejects when target user not found', () => {
      const result = validateImpersonationRequest(
        { targetUserId: 'nonexistent', reason: 'Support ticket #123' },
        null
      )
      expect(result.error).toBe('User not found')
      expect(result.status).toBe(404)
    })
  })

  describe('admin-to-admin impersonation', () => {
    it('rejects impersonating admin without confirmation', () => {
      const result = validateImpersonationRequest(
        { targetUserId: 'admin2', reason: 'Debug admin panel' },
        adminUser
      )
      expect(result.error).toContain('confirm_admin_impersonation')
      expect(result.status).toBe(400)
    })

    it('allows impersonating admin with confirmation', () => {
      const result = validateImpersonationRequest(
        { targetUserId: 'admin2', reason: 'Debug admin panel', confirm_admin_impersonation: true },
        adminUser
      )
      expect(result.success).toBe(true)
    })
  })

  describe('successful impersonation', () => {
    it('returns success for valid request', () => {
      const result = validateImpersonationRequest(
        { targetUserId: 'user1', reason: 'Support ticket #12345' },
        normalUser
      )
      expect(result.success).toBe(true)
      expect(result.maxDurationMinutes).toBe(30)
    })

    it('sets expiry 30 minutes from now', () => {
      const before = Date.now()
      const result = validateImpersonationRequest(
        { targetUserId: 'user1', reason: 'Customer support request' },
        normalUser
      )
      const after = Date.now()

      const expectedMin = before + 30 * 60 * 1000
      const expectedMax = after + 30 * 60 * 1000

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin)
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax)
    })

    it('accepts reason with exactly 5 characters', () => {
      const result = validateImpersonationRequest(
        { targetUserId: 'user1', reason: 'debug' },
        normalUser
      )
      expect(result.success).toBe(true)
    })

    it('does not require admin confirmation for normal user', () => {
      const result = validateImpersonationRequest(
        { targetUserId: 'user1', reason: 'Support ticket #999' },
        normalUser
      )
      expect(result.success).toBe(true)
    })
  })
})
