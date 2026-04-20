import { createServerClient } from '@supabase/ssr'

/**
 * Supabase client with the service role key. Bypasses RLS — use only for
 * trusted server paths (auditing, cross-tenant jobs, intentional admin writes).
 */
export async function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!key || key === 'SUPABASE_SERVICE_ROLE_KEY') {
    throw new Error('Missing valid SUPABASE_SERVICE_ROLE_KEY')
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // No-op: service role is not tied to browser cookies.
      },
    },
  })
}
