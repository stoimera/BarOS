import { validateProductionEnv } from '@/lib/security/env'

const validBase = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role',
  UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'token',
  ENCRYPTION_KEY: 'a'.repeat(64),
}

describe('validateProductionEnv', () => {
  it('returns parsed env when all required fields are valid', () => {
    const out = validateProductionEnv(validBase as unknown as NodeJS.ProcessEnv)
    expect(out.NEXT_PUBLIC_SUPABASE_URL).toBe(validBase.NEXT_PUBLIC_SUPABASE_URL)
    expect(out.ENCRYPTION_KEY).toBe(validBase.ENCRYPTION_KEY)
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    expect(() =>
      validateProductionEnv({
        ...validBase,
        NEXT_PUBLIC_SUPABASE_URL: '',
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is not an absolute URL', () => {
    expect(() =>
      validateProductionEnv({
        ...validBase,
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/absolute URL/)
  })

  it('throws when UPSTASH_REDIS_REST_URL is not https', () => {
    expect(() =>
      validateProductionEnv({
        ...validBase,
        UPSTASH_REDIS_REST_URL: 'http://insecure.example',
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/https URL/)
  })

  it('throws when ENCRYPTION_KEY is missing', () => {
    expect(() =>
      validateProductionEnv({
        ...validBase,
        ENCRYPTION_KEY: '',
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/ENCRYPTION_KEY/)
  })
})
