import { z } from 'zod'

/**
 * Environment variables required when NODE_ENV=production (Node.js server).
 * Validates at boot via instrumentation — fail fast with actionable messages.
 * Do not log values from this module.
 */
const productionEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_URL is required')
    .refine((v) => /^https?:\/\//i.test(v), 'NEXT_PUBLIC_SUPABASE_URL must be an absolute URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  UPSTASH_REDIS_REST_URL: z
    .string()
    .min(1, 'UPSTASH_REDIS_REST_URL is required')
    .refine((v) => /^https:\/\//i.test(v), 'UPSTASH_REDIS_REST_URL must be an https URL'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN is required'),
  ENCRYPTION_KEY: z.string().min(1, 'ENCRYPTION_KEY is required for PII encryption routes'),
})

export type ValidatedProductionEnv = z.infer<typeof productionEnvSchema>

function pickProductionEnv(env: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
    ENCRYPTION_KEY: env.ENCRYPTION_KEY,
  }
}

/**
 * Validate required production variables. Throws Error on first invalid/missing field.
 */
export function validateProductionEnv(
  env: NodeJS.ProcessEnv = process.env
): ValidatedProductionEnv {
  const result = productionEnvSchema.safeParse(pickProductionEnv(env))
  if (!result.success) {
    const details = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Production environment validation failed. Fix env vars: ${details}`)
  }
  return result.data
}

/**
 * Run production validation when NODE_ENV is production and runtime is Node.js.
 * Skips during `npm run build` / `next build` (`npm_lifecycle_event === 'build'`) so CI and
 * compile-time installs are not required to inject production secrets; runtime (`next start`) must pass.
 * Edge: omitted here; validate on Node server processes.
 */
export function assertProductionEnvAtBoot(): void {
  if (process.env.NODE_ENV !== 'production') return
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.npm_lifecycle_event === 'build') return
  validateProductionEnv()
}
