import { promoActiveAt } from '@/lib/operations/promo-eligibility'

describe('promo eligibility (Track 6.3)', () => {
  it('rejects inactive promos', () => {
    expect(promoActiveAt({ is_active: false }, new Date('2026-01-15T12:00:00Z'))).toBe(false)
  })

  it('respects starts_at and ends_at window', () => {
    const at = new Date('2026-06-15T12:00:00Z')
    expect(
      promoActiveAt(
        {
          is_active: true,
          starts_at: '2026-06-01T00:00:00Z',
          ends_at: '2026-06-30T23:59:59Z',
        },
        at
      )
    ).toBe(true)
    expect(
      promoActiveAt(
        {
          is_active: true,
          starts_at: '2026-07-01T00:00:00Z',
          ends_at: '2026-07-30T23:59:59Z',
        },
        at
      )
    ).toBe(false)
    expect(
      promoActiveAt(
        {
          is_active: true,
          starts_at: '2026-01-01T00:00:00Z',
          ends_at: '2026-05-01T00:00:00Z',
        },
        at
      )
    ).toBe(false)
  })
})
