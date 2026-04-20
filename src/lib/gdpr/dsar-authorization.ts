import type { SupabaseClient } from '@supabase/supabase-js'
import { hasPermission } from '@/lib/security/permissions'

export async function getCustomerIdForProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<string | null> {
  const { data, error } = await supabase.from('customers').select('id').eq('profile_id', profileId).maybeSingle()
  if (error || !data) return null
  return (data as { id: string }).id
}

/**
 * Export / portability: customer may only export self; staff/admin need compliance.read.
 */
export async function assertGdprExportAccess(params: {
  supabase: SupabaseClient
  role: string
  profileId: string
  targetCustomerId: string
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const { supabase, role, profileId, targetCustomerId } = params
  if (role === 'customer') {
    const own = await getCustomerIdForProfile(supabase, profileId)
    if (!own || own !== targetCustomerId) {
      return { ok: false, status: 403, message: 'You may only export data for your own account' }
    }
    return { ok: true }
  }
  if (role === 'staff' || role === 'admin') {
    if (!hasPermission(role, 'compliance.read')) {
      return { ok: false, status: 403, message: 'Missing compliance.read for data subject export' }
    }
    return { ok: true }
  }
  return { ok: false, status: 403, message: 'Forbidden' }
}

/**
 * Erasure / anonymize: customer only on own row; staff/admin need compliance.write (DSAR processor).
 */
export async function assertGdprDeleteAccess(params: {
  supabase: SupabaseClient
  role: string
  profileId: string
  targetCustomerId: string
}): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const { supabase, role, profileId, targetCustomerId } = params
  if (role === 'customer') {
    const own = await getCustomerIdForProfile(supabase, profileId)
    if (!own || own !== targetCustomerId) {
      return { ok: false, status: 403, message: 'You may only request erasure for your own account' }
    }
    return { ok: true }
  }
  if (role === 'staff' || role === 'admin') {
    if (!hasPermission(role, 'compliance.write')) {
      return { ok: false, status: 403, message: 'Missing compliance.write for erasure requests' }
    }
    return { ok: true }
  }
  return { ok: false, status: 403, message: 'Forbidden' }
}
