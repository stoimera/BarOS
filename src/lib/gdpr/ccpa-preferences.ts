import { createServiceRoleClient } from '@/utils/supabase/service-role'

export type CaliforniaPreferenceInput = {
  do_not_sell_or_share: boolean
  limit_sensitive_use: boolean
}

/**
 * Updates CPRA preference flags on the customer row. Uses the service role because
 * RLS does not grant customers direct UPDATE on `customers`.
 */
export type CaliforniaPreferenceRow = {
  id: string
  ccpa_do_not_sell_or_share: boolean
  ccpa_limit_sensitive_use: boolean
}

export async function applyCaliforniaPreferencesForCustomer(
  customerId: string,
  prefs: CaliforniaPreferenceInput
): Promise<{ data: CaliforniaPreferenceRow | null; error: Error | null }> {
  const svc = await createServiceRoleClient()
  const { data, error } = await svc
    .from('customers')
    .update({
      ccpa_do_not_sell_or_share: prefs.do_not_sell_or_share,
      ccpa_limit_sensitive_use: prefs.limit_sensitive_use,
    })
    .eq('id', customerId)
    .select('id, ccpa_do_not_sell_or_share, ccpa_limit_sensitive_use')
    .single()

  if (error) {
    return { data: null, error: new Error(error.message) }
  }
  return { data: data as CaliforniaPreferenceRow, error: null }
}
