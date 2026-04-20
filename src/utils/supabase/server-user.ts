import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * User-scoped Supabase client (anon key + session cookies).
 * Respects RLS; use from API routes and server code acting as the signed-in user.
 */
export async function createUserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  const cookieStore = await cookies()

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll() {
        // API routes typically do not refresh cookies here; middleware handles refresh.
      },
    },
  })
}
