import type { SupabaseClient } from '@supabase/supabase-js'
import { assertCustomerMeetsMinAge } from '@/lib/operations/age-sale-guard'

/**
 * Validates that the order's customer can purchase a menu line with the given menu item (Track 10.15).
 */
export async function assertOrderCustomerMeetsAgeForMenuItem(params: {
  supabase: SupabaseClient
  orderId: string
  menuItemId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { supabase, orderId, menuItemId } = params
  const { data: menuRow, error: menuErr } = await supabase
    .from('menu_items')
    .select('min_age')
    .eq('id', menuItemId)
    .single()
  if (menuErr) return { ok: false, message: menuErr.message }
  const minAge = Number((menuRow as { min_age?: number | null })?.min_age ?? 0)
  if (minAge <= 0) return { ok: true }

  const { data: ordRow, error: ordErr } = await supabase.from('orders').select('customer_id').eq('id', orderId).single()
  if (ordErr) return { ok: false, message: ordErr.message }
  const customerId = (ordRow as { customer_id?: string | null })?.customer_id
  if (!customerId) {
    return {
      ok: false,
      message: 'Order must have customer_id before adding age-restricted menu items',
    }
  }

  const { data: cust, error: cErr } = await supabase
    .from('customers')
    .select('date_of_birth')
    .eq('id', customerId)
    .single()
  if (cErr) return { ok: false, message: cErr.message }
  const dobRaw = (cust as { date_of_birth?: string | null })?.date_of_birth
  const customerDateOfBirth = dobRaw ? new Date(dobRaw) : null
  return assertCustomerMeetsMinAge({ customerDateOfBirth, minAge })
}

/**
 * Before closing an order, ensure the customer meets the highest min_age among linked menu items (Track 10.15).
 */
export async function assertOrderAgeComplianceForClose(params: {
  supabase: SupabaseClient
  orderId: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { supabase, orderId } = params
  const { data: lines, error: lErr } = await supabase
    .from('order_items')
    .select('menu_item_id')
    .eq('order_id', orderId)
  if (lErr) return { ok: false, message: lErr.message }
  const menuIds = [...new Set((lines || []).map((r) => r.menu_item_id).filter(Boolean))] as string[]
  if (menuIds.length === 0) return { ok: true }

  const { data: menus, error: mErr } = await supabase.from('menu_items').select('min_age').in('id', menuIds)
  if (mErr) return { ok: false, message: mErr.message }
  const maxMin = Math.max(0, ...((menus || []) as { min_age?: number | null }[]).map((m) => Number(m.min_age ?? 0)))
  if (maxMin <= 0) return { ok: true }

  const { data: ord, error: oErr } = await supabase.from('orders').select('customer_id').eq('id', orderId).single()
  if (oErr) return { ok: false, message: oErr.message }
  const customerId = (ord as { customer_id?: string | null })?.customer_id
  if (!customerId) {
    return {
      ok: false,
      message: 'Order must have customer_id before closing with age-restricted menu items',
    }
  }

  const { data: cust, error: cErr } = await supabase
    .from('customers')
    .select('date_of_birth')
    .eq('id', customerId)
    .single()
  if (cErr) return { ok: false, message: cErr.message }
  const dobRaw = (cust as { date_of_birth?: string | null })?.date_of_birth
  const customerDateOfBirth = dobRaw ? new Date(dobRaw) : null
  return assertCustomerMeetsMinAge({ customerDateOfBirth, minAge: maxMin })
}
