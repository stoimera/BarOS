import { createServerClient } from '@supabase/ssr'

/** Browser-safe Supabase client (no `next/headers`). Use from client components. */
export function createClientApiClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for client-side
        },
      },
    }
  )
}
