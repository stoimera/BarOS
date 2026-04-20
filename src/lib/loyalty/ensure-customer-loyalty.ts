import type { SupabaseClient } from '@supabase/supabase-js'
import { createLogger } from '@/lib/logger'

const log = createLogger('loyalty.ensure-customer-loyalty')

const DEFAULT_COFFEE_GOAL = 8
const DEFAULT_ALCOHOL_GOAL = 10

/**
 * Ensures a loyalty row exists for the customer (visit triggers and punch cards depend on it).
 */
export async function ensureCustomerLoyaltyRow(
  admin: SupabaseClient,
  customerId: string
): Promise<{ id: string } | null> {
  const { data: existing, error: selErr } = await admin
    .from('loyalty')
    .select('id')
    .eq('customer_id', customerId)
    .maybeSingle()

  if (selErr) {
    log.error('loyalty_select_failed', { customerId, message: selErr.message })
    return null
  }

  if (existing?.id) {
    return { id: existing.id }
  }

  const { data: inserted, error: insErr } = await admin
    .from('loyalty')
    .insert({
      customer_id: customerId,
      coffee_goal: DEFAULT_COFFEE_GOAL,
      alcohol_goal: DEFAULT_ALCOHOL_GOAL,
    })
    .select('id')
    .single()

  if (insErr) {
    if (insErr.code === '23505') {
      const { data: again } = await admin.from('loyalty').select('id').eq('customer_id', customerId).maybeSingle()
      if (again?.id) return { id: again.id }
    }
    log.error('loyalty_insert_failed', { customerId, message: insErr.message })
    return null
  }

  return inserted?.id ? { id: inserted.id } : null
}
