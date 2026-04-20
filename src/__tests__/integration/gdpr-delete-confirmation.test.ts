/**
 * @jest-environment node
 */
import { gdprDeleteRequestSchema, GDPR_FULL_DELETE_CONFIRMATION_PHRASE } from '@/lib/gdpr/delete-request'

describe('gdprDeleteRequestSchema', () => {
  const id = '550e8400-e29b-41d4-a716-446655440000'

  it('rejects full delete without confirmation phrase', () => {
    const r = gdprDeleteRequestSchema.safeParse({ customerId: id, anonymize: false })
    expect(r.success).toBe(false)
  })

  it('accepts full delete with exact phrase', () => {
    const r = gdprDeleteRequestSchema.safeParse({
      customerId: id,
      anonymize: false,
      confirmationPhrase: GDPR_FULL_DELETE_CONFIRMATION_PHRASE,
    })
    expect(r.success).toBe(true)
  })

  it('allows anonymize without phrase', () => {
    const r = gdprDeleteRequestSchema.safeParse({ customerId: id, anonymize: true })
    expect(r.success).toBe(true)
  })
})
