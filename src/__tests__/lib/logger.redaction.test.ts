import { redactMeta } from '@/lib/logger'

describe('redactMeta', () => {
  it('redacts sensitive keys case-insensitively', () => {
    expect(
      redactMeta({
        userId: 'u1',
        email: 'a@b.com',
        Authorization: 'Bearer x',
        nested: { ok: 1 },
      }),
    ).toEqual({
      userId: 'u1',
      email: '[REDACTED]',
      Authorization: '[REDACTED]',
      nested: '[Object]',
    })
  })

  it('returns undefined for undefined input', () => {
    expect(redactMeta(undefined)).toBeUndefined()
  })
})
