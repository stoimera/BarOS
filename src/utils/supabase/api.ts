import { createServerClient } from '@supabase/ssr'
import { createUserSupabaseClient } from './server-user'

// For server-side contexts (API routes, server components)
export async function createServerApiClient() {
  return createUserSupabaseClient()
}

// For client-side contexts (client components, hooks)
export { createClientApiClient } from './browser-client'

// Universal function that tries server-side first, falls back to client-side
export async function createApiClient() {
  try {
    return await createServerApiClient()
  } catch {
    const { createClientApiClient } = await import('./browser-client')
    return createClientApiClient()
  }
}
