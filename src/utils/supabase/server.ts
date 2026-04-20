export { createUserSupabaseClient } from './server-user'
export { createServiceRoleClient } from './service-role'

import { createServiceRoleClient } from './service-role'

/**
 * @deprecated Prefer {@link createUserSupabaseClient} for RLS-respecting access or
 * {@link createServiceRoleClient} when intentionally bypassing RLS on the server.
 */
export async function createClient() {
  return createServiceRoleClient()
}
