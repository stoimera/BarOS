import { allocateProportionalSplit } from '@/lib/operations/split-bills'
import { isOrderVoidReasonCode } from '@/lib/operations/voids'
import { assertValidOrderTransition, assertValidPaymentTransition } from '@/lib/operations/state-machine'

describe('POS lifecycle helpers', () => {
  it('splits a payment proportionally across lines with exact total', () => {
    const out = allocateProportionalSplit({
      lines: [
        { orderItemId: 'a', lineTotal: 30 },
        { orderItemId: 'b', lineTotal: 70 },
      ],
      paymentAmount: 100,
    })
    expect(out.reduce((s, r) => s + r.allocated_amount, 0)).toBe(100)
    expect(out[0].allocated_amount + out[1].allocated_amount).toBe(100)
  })

  it('validates known void reason codes', () => {
    expect(isOrderVoidReasonCode('staff_error')).toBe(true)
    expect(isOrderVoidReasonCode('unknown')).toBe(false)
  })

  it('allows open -> active and blocks closed -> active', () => {
    expect(() =>
      assertValidOrderTransition('open', 'active', { reason: 'start', actorProfileId: 'p1' })
    ).not.toThrow()
    expect(() =>
      assertValidOrderTransition('closed', 'active', { reason: 'nope', actorProfileId: 'p1' })
    ).toThrow()
  })

  it('requires reason for refund transitions on payments', () => {
    expect(() =>
      assertValidPaymentTransition('authorized', 'refunded', { actorProfileId: 'p1' })
    ).toThrow()
    expect(() =>
      assertValidPaymentTransition('authorized', 'refunded', { reason: 'guest left', actorProfileId: 'p1' })
    ).not.toThrow()
  })

  it('rejects invalid split inputs (Track 3.3 guards)', () => {
    expect(() => allocateProportionalSplit({ lines: [], paymentAmount: 10 })).toThrow('At least one line')
    expect(() =>
      allocateProportionalSplit({ lines: [{ orderItemId: 'a', lineTotal: 10 }], paymentAmount: -1 })
    ).toThrow('non-negative')
    expect(() =>
      allocateProportionalSplit({ lines: [{ orderItemId: 'a', lineTotal: 0 }], paymentAmount: 10 })
    ).toThrow('positive')
  })
})
