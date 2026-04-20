import { assertValidOrderTransition, assertValidPaymentTransition } from '@/lib/operations/state-machine'

describe('operations state machine integrity', () => {
  describe('order transitions', () => {
    it('allows open -> active and active -> closed with reasons', () => {
      expect(() =>
        assertValidOrderTransition('open', 'active', { actorProfileId: 'actor-1', reason: 'service started' })
      ).not.toThrow()

      expect(() =>
        assertValidOrderTransition('active', 'closed', { actorProfileId: 'actor-1', reason: 'bill settled' })
      ).not.toThrow()
    })

    it('rejects invalid transition closed -> active', () => {
      expect(() =>
        assertValidOrderTransition('closed', 'active', { actorProfileId: 'actor-1', reason: 'reopen not allowed' })
      ).toThrow('Invalid order transition closed -> active')
    })

    it('enforces audit reason for voided/closed transitions', () => {
      expect(() =>
        assertValidOrderTransition('active', 'voided', { actorProfileId: 'actor-1', reason: '' })
      ).toThrow('Transition requires reason for auditability')

      expect(() =>
        assertValidOrderTransition('active', 'closed', { actorProfileId: 'actor-1', reason: '' })
      ).toThrow('Transition requires reason for auditability')
    })
  })

  describe('payment transitions', () => {
    it('allows authorized -> captured', () => {
      expect(() =>
        assertValidPaymentTransition('authorized', 'captured', { actorProfileId: 'actor-1', reason: 'capture approved' })
      ).not.toThrow()
    })

    it('rejects invalid transition refunded -> captured', () => {
      expect(() =>
        assertValidPaymentTransition('refunded', 'captured', { actorProfileId: 'actor-1', reason: 'illegal transition' })
      ).toThrow('Invalid payment transition refunded -> captured')
    })

    it('requires reason for refunded and chargeback statuses', () => {
      expect(() =>
        assertValidPaymentTransition('captured', 'refunded', { actorProfileId: 'actor-1', reason: '' })
      ).toThrow('Refund and chargeback require reason')

      expect(() =>
        assertValidPaymentTransition('captured', 'chargeback', { actorProfileId: 'actor-1', reason: '' })
      ).toThrow('Refund and chargeback require reason')
    })
  })
})

